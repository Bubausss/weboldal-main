# Anely Driver - Cloud Config API

## Áttekintés

PHP API végpont a kernel driver Cloud Config rendszeréhez. A driver HWID alapján lekéri a felhasználó beállításait, titkosított formában.

## Fájlok

```
/api/
├── fetch_config.php          # Fő API végpont
├── database_schema.sql       # SQL tábla struktúra
├── driver_example/
│   └── config_decryptor.hpp  # C++ dekódoló a driverhez
└── README.md                 # Ez a fájl
```

## API Használat

### Endpoint
```
GET /api/fetch_config.php?hwid=XXXXXXXX
```

### Paraméterek
| Paraméter | Típus | Leírás |
|-----------|-------|--------|
| hwid | string | Hardware ID (8-64 karakter, alfanumerikus + kötőjel) |

### Válasz
Titkosított Base64 string (AES-256-CBC)

### Példa
```bash
curl "https://yourdomain.com/api/fetch_config.php?hwid=HWID-1234-5678-ABCD"
# Válasz: dGhpcyBpcyBlbmNyeXB0ZWQgZGF0YQ==
```

## Dekódolt Formátum

```
OK|ESP|SOUND|HEAD|SNAP|RCS|RCS_STR|TRIG|TRIG_DLY|TRIG_KEY|RADAR|NADE|BOMB|SPEC|CLR1|CLR2|...
```

### Mezők
| Index | Mező | Típus | Leírás |
|-------|------|-------|--------|
| 0 | Status | string | "OK" vagy "ERR_*" |
| 1 | ESP | 0/1 | ESP engedélyezve |
| 2 | Sound | 0/1 | Sound ESP |
| 3 | Head | 0/1 | Head Circle |
| 4 | Snap | 0/1 | Snap Line |
| 5 | RCS | 0/1 | Recoil Control |
| 6 | RCS_STR | int | RCS erősség (0-100) |
| 7 | Trig | 0/1 | Triggerbot |
| 8 | Trig_DLY | int | Delay ms (50-500) |
| 9 | Trig_KEY | string | Aktiváló gomb |
| 10 | Radar | 0/1 | Radar |
| 11 | Nade | 0/1 | Grenade Prediction |
| 12 | Bomb | 0/1 | Bomb Timer |
| 13 | Spec | 0/1 | Spectator List |
| 14+ | Colors | hex | Színkódok (#nélkül) |

### Példa dekódolt válasz
```
OK|1|0|1|0|1|75|1|100|MOUSE4|0|0|0|0|FF0000|FFFF00|00FF00|FF8800|FF0000|FFFFFF
```

## Hibakódok

| Kód | Jelentés |
|-----|----------|
| ERR_NO_HWID | Nincs HWID paraméter |
| ERR_INVALID_HWID | Érvénytelen HWID formátum |
| ERR_DB | Adatbázis hiba |
| ERR_AUTH | HWID nem található |
| ERR_SUB_INACTIVE | Inaktív előfizetés |
| ERR_SUB_EXPIRED | Lejárt előfizetés |

## Titkosítás

- **Algoritmus**: AES-256-CBC
- **Kulcs**: 32 byte (definiálva a PHP-ben)
- **IV**: 16 byte (fix)
- **Kimenet**: Base64 encoded

### PHP Kulcsok (fetch_config.php)
```php
define('AES_KEY', 'hvNssrRzUsy4YPnULNSD0d86R5qweNF3');
define('AES_IV', 'x5YDW5e8JVX5Hngo');
```

## Telepítés

### 1. Adatbázis
```bash
mysql -u root -p anely_db < database_schema.sql
```

### 2. PHP konfiguráció
Szerkeszd a `fetch_config.php` fájl elejét:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'anely_db');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');
```

### 3. Driver integráció
Másold a `config_decryptor.hpp` fájlt a driver projektedbe és használd:
```cpp
#include "config_decryptor.hpp"

std::string encrypted = FetchFromAPI(hwid);
std::string decrypted = DecryptConfig(encrypted);
AnelyConfig config = ParseConfig(decrypted);
```

## DNS TXT Rekord Használat

A titkosított válasz max 255 byte, így DNS TXT rekordban is tárolható:

```
_config.anely.com TXT "dGhpcyBpcyBlbmNyeXB0ZWQgZGF0YQ=="
```

A driver DNS lekérdezéssel is lekérheti a configot (nehezebb blokkolni).

## Biztonság

1. **HTTPS**: Mindig használj HTTPS-t
2. **Kulcscsere**: Változtasd meg az AES kulcsokat
3. **Rate limiting**: Adj hozzá rate limitinget
4. **HWID validálás**: Ellenőrizd a HWID formátumot
5. **IP logging**: Logold a kéréseket
