-- ============================================================
-- Anely Driver - SQL Tábla Módosítások
-- Cloud Config rendszerhez
-- ============================================================

-- 1. USERS tábla módosítás (HWID és subscription mezők hozzáadása)
-- ============================================================

ALTER TABLE `users` 
ADD COLUMN `hwid` VARCHAR(64) NULL DEFAULT NULL AFTER `email`,
ADD COLUMN `subscription_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `hwid`,
ADD COLUMN `subscription_end` DATETIME NULL DEFAULT NULL AFTER `subscription_active`,
ADD UNIQUE INDEX `idx_hwid` (`hwid`);

-- 2. USER_CONFIGS tábla (ha még nem létezik)
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

-- 3. Ha a user_configs tábla már létezik, csak mezők hozzáadása
-- ============================================================

-- ESP mezők
ALTER TABLE `user_configs` 
ADD COLUMN IF NOT EXISTS `esp_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `esp_color` VARCHAR(7) NOT NULL DEFAULT '#FF0000',
ADD COLUMN IF NOT EXISTS `esp_sound` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `esp_sound_color` VARCHAR(7) NOT NULL DEFAULT '#FFFF00',
ADD COLUMN IF NOT EXISTS `esp_head_circle` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `esp_snap_line` TINYINT(1) NOT NULL DEFAULT 0;

-- RCS mezők
ALTER TABLE `user_configs`
ADD COLUMN IF NOT EXISTS `rcs_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `rcs_strength` INT NOT NULL DEFAULT 50;

-- Triggerbot mezők
ALTER TABLE `user_configs`
ADD COLUMN IF NOT EXISTS `triggerbot_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `triggerbot_delay` INT NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS `triggerbot_key` VARCHAR(16) NOT NULL DEFAULT 'MOUSE4';

-- Radar mezők
ALTER TABLE `user_configs`
ADD COLUMN IF NOT EXISTS `radar_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `radar_color` VARCHAR(7) NOT NULL DEFAULT '#00FF00';

-- Grenade Prediction mezők
ALTER TABLE `user_configs`
ADD COLUMN IF NOT EXISTS `grenade_prediction_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `grenade_prediction_color` VARCHAR(7) NOT NULL DEFAULT '#FF8800';

-- Bomb Timer mezők
ALTER TABLE `user_configs`
ADD COLUMN IF NOT EXISTS `bomb_timer_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `bomb_timer_color` VARCHAR(7) NOT NULL DEFAULT '#FF0000';

-- Spectator List mezők
ALTER TABLE `user_configs`
ADD COLUMN IF NOT EXISTS `spectator_list_enabled` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `spectator_list_color` VARCHAR(7) NOT NULL DEFAULT '#FFFFFF';

-- 4. Teszt adat beszúrása (opcionális)
-- ============================================================

-- INSERT INTO `users` (`email`, `hwid`, `subscription_active`, `subscription_end`) 
-- VALUES ('test@anely.com', 'HWID-1234-5678-ABCD', 1, DATE_ADD(NOW(), INTERVAL 30 DAY));

-- INSERT INTO `user_configs` (`user_id`, `esp_enabled`, `esp_color`, `rcs_enabled`, `rcs_strength`) 
-- VALUES (LAST_INSERT_ID(), 1, '#FF0000', 1, 75);
