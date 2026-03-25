<?php
/**
 * Anely Driver - Cloud Config API
 * Endpoint: api/fetch_config.php
 * 
 * Titkosított config lekérés HWID alapján
 * DNS TXT rekord kompatibilis (max 255 byte)
 */

// ============== KONFIGURÁCIÓ ==============
// Használhatsz környezeti változókat (.env), vagy ha nincsenek, a beégetett alapértelmezéseket használja az azonnali kompatibilitásért
define('AES_KEY', getenv('ANELY_AES_KEY') ?: 'hvNssrRzUsy4YPnULNSD0d86R5qweNF3'); // 32 byte - Ugyanaz mint a C Kernel driverben!
define('AES_IV',  getenv('ANELY_AES_IV')  ?: 'x5YDW5e8JVX5Hngo');                // 16 byte

// Adatbázis kapcsolat
define('DB_HOST', getenv('ANELY_DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('ANELY_DB_NAME') ?: 'anely_db'); // Cseréld erre a MySQL adatbázisod nevét
define('DB_USER', getenv('ANELY_DB_USER') ?: 'buba');
define('DB_PASS', getenv('ANELY_DB_PASS') ?: 'Jelszo123!');

// ============== TITKOSÍTÁSI FÜGGVÉNYEK ==============

/**
 * AES-256-CTR titkosítás (Driver kompatibilis CTR mód)
 * A driver BCRYPT AES ECB módból építi fel a CTR-t, így itt is CTR-t kell használni.
 */
function encrypt_response($data) {
    // Generate a fixed 16-byte IV that matches the start counter in the driver logic
    // or pass the IV alongside the data. Here we assume AES_IV is 16 bytes.
    $encrypted = openssl_encrypt(
        $data,
        'AES-256-CTR',
        AES_KEY,
        OPENSSL_RAW_DATA,
        AES_IV
    );
    return base64_encode($encrypted);
}

/**
 * Kompakt config string generálás (DNS TXT kompatibilis)
 * Formátum: STATUS|ESP|SOUND|HEAD|SNAP|RCS|RCS_STR|TRIG|TRIG_DLY|TRIG_KEY|RADAR|NADE|BOMB|SPEC|ESP_CLR|...
 */
function generate_compact_config($config) {
    // Boolean értékek: 1/0
    // Színek: hex rövidítve (pl. FF0000 -> F00 ha lehetséges, vagy hash nélkül)
    $parts = [
        'OK',
        $config['esp_enabled'] ? '1' : '0',
        $config['esp_sound'] ? '1' : '0',
        $config['esp_head_circle'] ? '1' : '0',
        $config['esp_snap_line'] ? '1' : '0',
        $config['rcs_enabled'] ? '1' : '0',
        $config['rcs_strength'],
        $config['triggerbot_enabled'] ? '1' : '0',
        $config['triggerbot_delay'],
        $config['triggerbot_key'],
        $config['radar_enabled'] ? '1' : '0',
        $config['grenade_prediction_enabled'] ? '1' : '0',
        $config['bomb_timer_enabled'] ? '1' : '0',
        $config['spectator_list_enabled'] ? '1' : '0',
        ltrim($config['esp_color'], '#'),
        ltrim($config['esp_sound_color'], '#'),
        ltrim($config['radar_color'], '#'),
        ltrim($config['grenade_prediction_color'], '#'),
        ltrim($config['bomb_timer_color'], '#'),
        ltrim($config['spectator_list_color'], '#')
    ];
    
    return implode('|', $parts);
}

/**
 * Hiba válasz generálás
 */
function error_response($code) {
    header('Content-Type: text/plain');
    echo encrypt_response($code);
    exit;
}

// ============== MAIN ==============

// CORS headers (opcionális)
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/plain; charset=utf-8');

// HWID ellenőrzés
if (!isset($_GET['hwid']) || empty($_GET['hwid'])) {
    error_response('ERR_NO_HWID');
}

$hwid = trim($_GET['hwid']);

// HWID validálás (csak alfanumerikus és kötőjel)
if (!preg_match('/^[A-Za-z0-9\-]{8,64}$/', $hwid)) {
    error_response('ERR_INVALID_HWID');
}

// Adatbázis kapcsolat
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    error_response('ERR_DB');
}

// Felhasználó keresése HWID alapján
$stmt = $pdo->prepare("
    SELECT 
        u.id,
        u.email,
        u.subscription_active,
        u.subscription_end,
        c.*
    FROM users u
    LEFT JOIN user_configs c ON u.id = c.user_id
    WHERE u.hwid = :hwid
    LIMIT 1
");

$stmt->execute(['hwid' => $hwid]);
$user = $stmt->fetch();

// Felhasználó nem található
if (!$user) {
    error_response('ERR_AUTH');
}

// Előfizetés ellenőrzés
if (!$user['subscription_active']) {
    error_response('ERR_SUB_INACTIVE');
}

// Előfizetés lejárat ellenőrzés
if (!empty($user['subscription_end'])) {
    $subEnd = strtotime($user['subscription_end']);
    if ($subEnd < time()) {
        error_response('ERR_SUB_EXPIRED');
    }
}

// Config összeállítás default értékekkel
$config = [
    'esp_enabled' => $user['esp_enabled'] ?? 0,
    'esp_color' => $user['esp_color'] ?? '#FF0000',
    'esp_sound' => $user['esp_sound'] ?? 0,
    'esp_sound_color' => $user['esp_sound_color'] ?? '#FFFF00',
    'esp_head_circle' => $user['esp_head_circle'] ?? 0,
    'esp_snap_line' => $user['esp_snap_line'] ?? 0,
    'rcs_enabled' => $user['rcs_enabled'] ?? 0,
    'rcs_strength' => $user['rcs_strength'] ?? 50,
    'triggerbot_enabled' => $user['triggerbot_enabled'] ?? 0,
    'triggerbot_delay' => $user['triggerbot_delay'] ?? 100,
    'triggerbot_key' => $user['triggerbot_key'] ?? 'MOUSE4',
    'radar_enabled' => $user['radar_enabled'] ?? 0,
    'radar_color' => $user['radar_color'] ?? '#00FF00',
    'grenade_prediction_enabled' => $user['grenade_prediction_enabled'] ?? 0,
    'grenade_prediction_color' => $user['grenade_prediction_color'] ?? '#FF8800',
    'bomb_timer_enabled' => $user['bomb_timer_enabled'] ?? 0,
    'bomb_timer_color' => $user['bomb_timer_color'] ?? '#FF0000',
    'spectator_list_enabled' => $user['spectator_list_enabled'] ?? 0,
    'spectator_list_color' => $user['spectator_list_color'] ?? '#FFFFFF'
];

// Kompakt config generálás
$compactConfig = generate_compact_config($config);

// Titkosítás és kiküldés
$encrypted = encrypt_response($compactConfig);

// DNS TXT limit ellenőrzés (255 byte)
if (strlen($encrypted) > 255) {
    // Ha túl hosszú, rövidebb formátum
    $shortConfig = implode('|', [
        'OK',
        $config['esp_enabled'] ? '1' : '0',
        $config['rcs_enabled'] ? '1' : '0',
        $config['rcs_strength'],
        $config['triggerbot_enabled'] ? '1' : '0',
        $config['triggerbot_delay'],
        $config['triggerbot_key']
    ]);
    $encrypted = encrypt_response($shortConfig);
}

echo $encrypted;
