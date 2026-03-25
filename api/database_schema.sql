-- ============================================================
-- Anely Driver - Teljes SQL Adatbázis Séma
-- Cloud Config & Auth rendszerhez
-- ============================================================

-- 1. USERS tábla (Felhasználók alapadatai)
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(64) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `hwid` VARCHAR(64) NULL DEFAULT NULL,
    `subscription_active` TINYINT(1) NOT NULL DEFAULT 1,
    `subscription_end` DATETIME NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
    `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE INDEX `idx_username` (`username`),
    UNIQUE INDEX `idx_email` (`email`),
    UNIQUE INDEX `idx_hwid` (`hwid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. INVITE_KEYS tábla (Admin generált regisztrációs kódok)
-- ============================================================

CREATE TABLE IF NOT EXISTS `invite_keys` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `key_string` VARCHAR(64) NOT NULL,
    `created_by` INT NULL,          -- Admin ID aki generálta
    `used` TINYINT(1) NOT NULL DEFAULT 0,
    `used_by_user_id` INT NULL,     -- User ID aki elhasználta
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME NULL DEFAULT NULL,
    UNIQUE INDEX `idx_key` (`key_string`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. USER_CONFIGS tábla (Felhasználónkénti Cloud Cheat Config)
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_configs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    
    -- ESP beállítások
    `esp_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `esp_color` VARCHAR(7) NOT NULL DEFAULT '#FF0000',
    `esp_sound` TINYINT(1) NOT NULL DEFAULT 0,
    `esp_sound_color` VARCHAR(7) NOT NULL DEFAULT '#FFFF00',
    `esp_head_circle` TINYINT(1) NOT NULL DEFAULT 0,
    `esp_snap_line` TINYINT(1) NOT NULL DEFAULT 0,
    
    -- RCS beállítások
    `rcs_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `rcs_strength` INT NOT NULL DEFAULT 50,
    
    -- Triggerbot beállítások
    `triggerbot_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `triggerbot_delay` INT NOT NULL DEFAULT 100,
    `triggerbot_key` VARCHAR(16) NOT NULL DEFAULT 'MOUSE4',
    
    -- Radar beállítások
    `radar_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `radar_color` VARCHAR(7) NOT NULL DEFAULT '#00FF00',
    
    -- Grenade Prediction
    `grenade_prediction_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `grenade_prediction_color` VARCHAR(7) NOT NULL DEFAULT '#FF8800',
    
    -- Bomb Timer
    `bomb_timer_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `bomb_timer_color` VARCHAR(7) NOT NULL DEFAULT '#FF0000',
    
    -- Spectator List
    `spectator_list_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `spectator_list_color` VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Teszt Adat / Alapértelmezett Admin Fiók (Fejlesztéshez)
-- ============================================================

-- INSERT INTO `users` (`username`, `email`, `password_hash`, `is_admin`, `subscription_active`, `subscription_end`) 
-- VALUES ('Admin', 'admin@anely.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1, DATE_ADD(NOW(), INTERVAL 365 DAY));

