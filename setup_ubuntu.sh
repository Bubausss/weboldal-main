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
    pip install -r requirements.txt
else
    pip install fastapi uvicorn motor pymongo passlib[bcrypt] pyjwt python-dotenv pydantic
fi
cd ..
echo "✔️ Python dependencies kész!"

# 4. React Admin Panel Frontend építése (Build)
echo "⚛️ [4/6] React Frontend NPM telepítése és buildelése (Ez eltarthat pár percig)..."
cd frontend
npm install
npm run build
cd ..
echo "✔️ React Frontend Build kész!"

# 5. Fájlok másolása és webszerver beállítása
echo "🌐 [5/6] Nginx Webszerver beállítása (Könyvtárak másolása)..."

WEB_ROOT="/var/www/anely"
rm -rf $WEB_ROOT
mkdir -p $WEB_ROOT
mkdir -p $WEB_ROOT/api

# Frontend bemásolása
cp -r frontend/build/* $WEB_ROOT/

# PHP API bemásolása
cp api/fetch_config.php $WEB_ROOT/api/

# Jogosultságok
chown -R www-data:www-data $WEB_ROOT
chmod -R 755 $WEB_ROOT

echo "✔️ Web mappák beállítva ($WEB_ROOT)!"

# 6. PM2 telepítése a Pyton Backend folyamatos futtatásához a háttérben
echo "⚙️ [6/6] Háttérfolyamatok konfigurálása (PM2)..."
npm install -g pm2
cd backend
pm2 start "venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000" --name "anely-backend"
pm2 save
pm2 startup | grep "sudo pm2" | bash
cd ..

echo "============================================================"
echo "✅ TELEPÍTÉS SIKERESEN BEFEJEZŐDÖTT!"
echo "============================================================"
echo "Amik futnak:"
echo "- 🐘 MySQL fut (Adatbázis: anely_db, User: buba)"
echo "- 🐍 Python API fut a háttérben (Port: 8000)"
echo "- ⚛️ React UI és PHP készen áll a fájlrendszerben (/var/www/anely)."
echo ""
echo "Következő lépésed:"
echo "Csak mutasd rá az Nginx/Apache szerver konfigurációdat a '/var/www/anely' mappára!"
echo "Ne felejtsd el elindítani az nginx-et: sudo systemctl restart nginx"
echo "============================================================"
