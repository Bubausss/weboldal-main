#!/bin/bash
# ============================================================
# Anely Cheat - Teljes Automatikus Telepítő Script Ubuntuhoz
# ============================================================
# Használat: 
# 1. git clone <repo_url>
# 2. cd weboldal-main
# 3. chmod +x setup_ubuntu.sh
# 4. sudo ./setup_ubuntu.sh
# ============================================================

# Győződjünk meg róla, hogy rootként futtatják
if [ "$EUID" -ne 0 ]; then
  echo "❌ Kérlek sudo-val futtasd a scriptet!"
  echo "Példa: sudo ./setup_ubuntu.sh"
  exit
fi

echo "🚀 [Anely Setup] Telepítés megkezdése..."

# Biztosítjuk, hogy az Apache ne akadályozza az Nginx-et a 80-as porton
echo "🛑 [0/6] Apache2 leállítása (ha telepítve van), hogy ne ütközzön az Nginx-el..."
systemctl stop apache2 2>/dev/null
systemctl disable apache2 2>/dev/null
apt-get remove -y apache2 apache2-utils apache2-bin apache2.2-common 2>/dev/null
apt-get autoremove -y

# OOM (Out Of Memory) védelem 1GB RAM-os VPS-eknek: 2GB Swap Fájl létrehozása
echo "💾 [0.5/6] Swap (virtuális memória) ellenőrzése és létrehozása a kifagyások ellen..."
if [ $(swapon -s | wc -l) -eq 0 ]; then
    echo "  -> Nincs Swap, létrehozok egy 2GB-os Swap fájlt, hogy ne fagyjon ki a build!"
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    # Kisebb "swappiness", hogy a rendszer inkább a fizikait egye
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
else
    echo "  -> Swap fájl már létezik, folytatás..."
fi

# 1. Rendszer frissítése és alapvető csomagok telepítése
echo "📦 [1/6] Rendszer frissítése és csomagok letöltése (Nginx, MySQL, PHP, Python, Node.js)..."
apt-get update -y
apt-get upgrade -y
apt-get install -y nginx mysql-server python3 python3-pip python3-venv \
                   php-fpm php-mysql php-mbstring curl git unzip

# Node.js LTS telepítése
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# 2. MySQL Adatbázis konfigurálása
echo "🗄️ [2/6] MySQL Adatbázis létrehozása és importálása..."
# Indítsuk el a servert ha nem fut
systemctl start mysql

# Futtassuk a ma elkészített komplett SQL fájlt rootként
mysql -u root < ./api/database_schema.sql

# Létrehozunk egy külön MySQL usert a PHP-nek, ha nem a rootot akarjuk használni
mysql -u root -e "CREATE USER IF NOT EXISTS 'buba'@'localhost' IDENTIFIED BY 'Jelszo123!';"
mysql -u root -e "GRANT ALL PRIVILEGES ON anely_db.* TO 'buba'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"
echo "✔️ MySQL Adatbázis (anely_db) és user (buba) kész!"

# 3. Python Backend (FastAPI / Server.py) beállítása
echo "🐍 [3/6] Python Backend telepítése..."
cd backend
python3 -m venv venv
source venv/bin/activate
# Ha van requirements.txt telepítjük, ha nincs, rápakoljuk az alapvető csomagokat
if [ -f "requirements.txt" ]; then
    # Remove broken package that causes installation to fail
    grep -v "emergentintegrations" requirements.txt > requirements_clean.txt
    mv requirements_clean.txt requirements.txt
    pip install -r requirements.txt
else
    pip install fastapi uvicorn motor pymongo passlib[bcrypt] pyjwt python-dotenv pydantic
fi
cd ..
echo "✔️ Python dependencies kész!"

# Setup Nginx Reverse Proxy Config
echo "🌐 [4/6] Nginx szerver konfiguráció beállítása (Reverse Proxy)..."

cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    root /var/www/anely;
    index index.html index.php;

    # React Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Python Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # PHP (Fallback for specific scripts like fetch_config.php, optional)
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
    }
}
EOF

# 5. React Admin Panel Frontend építése (Build)
echo "⚛️ [4/6] React Frontend NPM/YARN telepítése és buildelése (Ez eltarthat pár percig)..."
cd frontend
npm install -g yarn
yarn install
yarn build
cd ..
echo "✔️ React Frontend Build kész!"

echo "🌐 [5/6] Weboldal fájlok másolása..."

WEB_ROOT="/var/www/anely"
rm -rf $WEB_ROOT
mkdir -p $WEB_ROOT
mkdir -p $WEB_ROOT/api

# Ellenőrizzük, hogy sikeres volt-e a build, nehogy 403-as errort kapjon a felhasználó
if [ -d "frontend/build" ] && [ "$(ls -A frontend/build)" ]; then
    # Frontend bemásolása
    cp -r frontend/build/* $WEB_ROOT/
else
    echo "❌ FATAL ERROR: A React build sikertelen volt (frontend/build üres)! Nincs mit kiszolgálni."
    exit 1
fi

# PHP API bemásolása
cp api/fetch_config.php $WEB_ROOT/api/

# Jogosultságok
chown -R www-data:www-data $WEB_ROOT
chmod -R 755 $WEB_ROOT

echo "✔️ Web mappák beállítva ($WEB_ROOT)!"

# Nginx újraindítása (most már léteznek a mappák)
systemctl restart nginx
echo "✔️ Nginx Webszerver elindítva!"

# 6. PM2 telepítése a Pyton Backend folyamatos futtatásához a háttérben
echo "⚙️ [6/6] Háttérfolyamatok konfigurálása (PM2)..."
npm install -g pm2
cd backend
pm2 start venv/bin/python --name "anely-backend" -- -m uvicorn server:app --host 0.0.0.0 --port 8000
pm2 save
pm2 startup | grep "sudo pm2" | bash
cd ..

echo "============================================================"
echo "✅ TELEPÍTÉS SIKERESEN BEFEJEZŐDÖTT!"
echo "============================================================"
echo "Amik futnak:"
echo "- 🐘 MySQL fut (Adatbázis: anely_db, User: buba)"
echo "- 🐍 Python API fut a háttérben (Port: 8000)"
echo "- ⚛️ Nginx Reverse Proxy fut (Port: 80), továbbítja a /api/ kéréseket a Pythonnak!"
echo ""
echo "A weboldalad már elérhető az IP címeden vagy domaineden!"
echo "============================================================"
