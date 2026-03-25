/**
 * Anely Driver - Config Decryptor
 * C++ példakód a titkosított config dekódolásához
 * 
 * Használat: 
 *   std::string config = DecryptConfig(encryptedBase64);
 *   ParseConfig(config);
 */

#pragma once
#include <string>
#include <vector>
#include <sstream>
#include <openssl/evp.h>
#include <openssl/aes.h>

// AES keys are loaded at runtime from encrypted config or server handshake.
// NEVER embed keys in source code — they would be trivially extractable.
// Use ServerCrypto_DeobfuscateKey() from the driver's server_crypto.h
// or load from an encrypted config file via LoadEncryptedConfig().
static char g_AesKey[33] = {0};  // Set at runtime via SetDecryptionKeys()
static char g_AesIV[17]  = {0};  // Set at runtime via SetDecryptionKeys()

/**
 * @brief Set decryption keys at runtime (call before DecryptConfig)
 * @param key 32-byte AES-256 key
 * @param iv 16-byte IV
 */
inline void SetDecryptionKeys(const char* key, const char* iv) {
    memcpy(g_AesKey, key, 32); g_AesKey[32] = 0;
    memcpy(g_AesIV, iv, 16);   g_AesIV[16] = 0;
}

// ============== BASE64 DEKÓDOLÁS ==============

std::string Base64Decode(const std::string& encoded) {
    static const std::string base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    std::string decoded;
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++) T[base64_chars[i]] = i;

    int val = 0, valb = -8;
    for (unsigned char c : encoded) {
        if (T[c] == -1) break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0) {
            decoded.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return decoded;
}

// ============== AES-256-CBC DEKÓDOLÁS ==============

std::string AESDecrypt(const std::string& ciphertext) {
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    
    EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, 
        (unsigned char*)g_AesKey, (unsigned char*)g_AesIV);
    
    std::vector<unsigned char> plaintext(ciphertext.size() + AES_BLOCK_SIZE);
    int len = 0, plaintext_len = 0;
    
    EVP_DecryptUpdate(ctx, plaintext.data(), &len, 
        (unsigned char*)ciphertext.c_str(), ciphertext.size());
    plaintext_len = len;
    
    EVP_DecryptFinal_ex(ctx, plaintext.data() + len, &len);
    plaintext_len += len;
    
    EVP_CIPHER_CTX_free(ctx);
    
    return std::string((char*)plaintext.data(), plaintext_len);
}

// ============== FŐ DEKÓDOLÓ FÜGGVÉNY ==============

std::string DecryptConfig(const std::string& encryptedBase64) {
    std::string decoded = Base64Decode(encryptedBase64);
    return AESDecrypt(decoded);
}

// ============== CONFIG STRUKTÚRA ==============

struct AnelyConfig {
    bool valid = false;
    std::string error;
    
    // ESP
    bool esp_enabled = false;
    bool esp_sound = false;
    bool esp_head_circle = false;
    bool esp_snap_line = false;
    
    // RCS
    bool rcs_enabled = false;
    int rcs_strength = 50;
    
    // Triggerbot
    bool triggerbot_enabled = false;
    int triggerbot_delay = 100;
    std::string triggerbot_key = "MOUSE4";
    
    // Extra
    bool radar_enabled = false;
    bool grenade_prediction_enabled = false;
    bool bomb_timer_enabled = false;
    bool spectator_list_enabled = false;
    
    // Színek
    std::string esp_color = "FF0000";
    std::string esp_sound_color = "FFFF00";
    std::string radar_color = "00FF00";
    std::string grenade_color = "FF8800";
    std::string bomb_color = "FF0000";
    std::string spectator_color = "FFFFFF";
};

// ============== CONFIG PARSER ==============

AnelyConfig ParseConfig(const std::string& decrypted) {
    AnelyConfig cfg;
    
    // Hiba ellenőrzés
    if (decrypted.substr(0, 3) == "ERR") {
        cfg.valid = false;
        cfg.error = decrypted;
        return cfg;
    }
    
    // Config parse: OK|1|0|1|0|1|75|1|100|MOUSE4|0|0|0|0|FF0000|FFFF00|...
    std::vector<std::string> parts;
    std::stringstream ss(decrypted);
    std::string part;
    while (std::getline(ss, part, '|')) {
        parts.push_back(part);
    }
    
    if (parts.size() < 7 || parts[0] != "OK") {
        cfg.valid = false;
        cfg.error = "ERR_PARSE";
        return cfg;
    }
    
    cfg.valid = true;
    
    // Parse értékek
    size_t i = 1;
    if (i < parts.size()) cfg.esp_enabled = parts[i++] == "1";
    if (i < parts.size()) cfg.esp_sound = parts[i++] == "1";
    if (i < parts.size()) cfg.esp_head_circle = parts[i++] == "1";
    if (i < parts.size()) cfg.esp_snap_line = parts[i++] == "1";
    if (i < parts.size()) cfg.rcs_enabled = parts[i++] == "1";
    if (i < parts.size()) cfg.rcs_strength = std::stoi(parts[i++]);
    if (i < parts.size()) cfg.triggerbot_enabled = parts[i++] == "1";
    if (i < parts.size()) cfg.triggerbot_delay = std::stoi(parts[i++]);
    if (i < parts.size()) cfg.triggerbot_key = parts[i++];
    if (i < parts.size()) cfg.radar_enabled = parts[i++] == "1";
    if (i < parts.size()) cfg.grenade_prediction_enabled = parts[i++] == "1";
    if (i < parts.size()) cfg.bomb_timer_enabled = parts[i++] == "1";
    if (i < parts.size()) cfg.spectator_list_enabled = parts[i++] == "1";
    
    // Színek
    if (i < parts.size()) cfg.esp_color = parts[i++];
    if (i < parts.size()) cfg.esp_sound_color = parts[i++];
    if (i < parts.size()) cfg.radar_color = parts[i++];
    if (i < parts.size()) cfg.grenade_color = parts[i++];
    if (i < parts.size()) cfg.bomb_color = parts[i++];
    if (i < parts.size()) cfg.spectator_color = parts[i++];
    
    return cfg;
}

// ============== HASZNÁLATI PÉLDA ==============

/*
#include "config_decryptor.hpp"
#include <curl/curl.h>

int main() {
    // 1. HWID generálás (pl. CPU ID + HDD serial hash)
    std::string hwid = GetHardwareID();
    
    // 2. API hívás
    std::string url = "https://anely.com/api/fetch_config.php?hwid=" + hwid;
    std::string response = HTTPGet(url);  // vagy DNS TXT lekérés
    
    // 3. Dekódolás
    std::string decrypted = DecryptConfig(response);
    
    // 4. Parse
    AnelyConfig config = ParseConfig(decrypted);
    
    if (!config.valid) {
        // Hiba kezelés
        if (config.error == "ERR_AUTH") {
            // HWID nem található
        } else if (config.error == "ERR_SUB_EXPIRED") {
            // Lejárt előfizetés
        }
        return 1;
    }
    
    // 5. Config alkalmazása
    g_ESP.enabled = config.esp_enabled;
    g_ESP.color = HexToColor(config.esp_color);
    g_RCS.enabled = config.rcs_enabled;
    g_RCS.strength = config.rcs_strength;
    // ... stb
    
    return 0;
}
*/
