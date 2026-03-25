#!/usr/bin/env python3
"""
Test script specifically for new Config page features:
- ESP module with color picker, sound ESP, head circle, snap line toggles  
- RCS module with strength slider
- Triggerbot module with delay slider (50-500ms) and key binding
- Cloud Sync functionality
"""
import requests
import sys
import json
from datetime import datetime

class ConfigFeatureTester:
    def __init__(self, base_url="https://cipher-panel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_email = "admin@ghostdriver.com"
        self.admin_password = "ghost123"

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_symbols = {"INFO": "🔍", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
        symbol = status_symbols.get(status, "ℹ️")
        print(f"{symbol} [{timestamp}] {message}")

    def login(self):
        """Login to get auth token"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", json={
                "email": self.admin_email,
                "password": self.admin_password
            })
            if response.status_code == 200:
                self.token = response.json()['token']
                self.log("Login successful", "PASS")
                return True
            else:
                self.log(f"Login failed: {response.status_code}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Login error: {str(e)}", "FAIL")
            return False

    def test_esp_config(self):
        """Test ESP module configuration features"""
        self.log("Testing ESP configuration features...", "INFO")
        
        esp_test_configs = [
            {
                "name": "ESP Color Picker",
                "config": {
                    "esp_enabled": True,
                    "esp_color": "#00FF00",  # Green
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "ESP Sound Toggle", 
                "config": {
                    "esp_enabled": True,
                    "esp_color": "#FF0000",
                    "esp_sound": True,  # Sound ESP enabled
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "ESP Head Circle Toggle",
                "config": {
                    "esp_enabled": True,
                    "esp_color": "#0066FF",
                    "esp_sound": False,
                    "esp_head_circle": True,  # Head circle enabled
                    "esp_snap_line": False,
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "ESP Snap Line Toggle",
                "config": {
                    "esp_enabled": True,
                    "esp_color": "#FFFF00",
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": True,  # Snap line enabled
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            }
        ]
        
        return self._test_config_variations(esp_test_configs)

    def test_rcs_config(self):
        """Test RCS module configuration features"""
        self.log("Testing RCS configuration features...", "INFO")
        
        rcs_test_configs = [
            {
                "name": "RCS Strength 25%",
                "config": {
                    "esp_enabled": False,
                    "esp_color": "#FF0000",
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": True,
                    "rcs_strength": 25,  # Low strength
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "RCS Strength 75%",
                "config": {
                    "esp_enabled": False,
                    "esp_color": "#FF0000",
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": True,
                    "rcs_strength": 75,  # High strength
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "RCS Strength 100%",
                "config": {
                    "esp_enabled": False,
                    "esp_color": "#FF0000",
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": True,
                    "rcs_strength": 100,  # Maximum strength
                    "triggerbot_enabled": False,
                    "triggerbot_delay": 100,
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            }
        ]
        
        return self._test_config_variations(rcs_test_configs)

    def test_triggerbot_config(self):
        """Test Triggerbot module configuration features"""
        self.log("Testing Triggerbot configuration features...", "INFO")
        
        triggerbot_test_configs = [
            {
                "name": "Triggerbot Delay 50ms (Fast)",
                "config": {
                    "esp_enabled": False,
                    "esp_color": "#FF0000",
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": True,
                    "triggerbot_delay": 50,  # Minimum delay
                    "triggerbot_key": "MOUSE4",
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "Triggerbot Delay 250ms (Medium)",
                "config": {
                    "esp_enabled": False,
                    "esp_color": "#FF0000", 
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": True,
                    "triggerbot_delay": 250,  # Medium delay
                    "triggerbot_key": "SHIFT",  # Different key binding
                    "smoothing": 50,
                    "fov": 90
                }
            },
            {
                "name": "Triggerbot Delay 500ms (Slow)",
                "config": {
                    "esp_enabled": False,
                    "esp_color": "#FF0000",
                    "esp_sound": False,
                    "esp_head_circle": False,
                    "esp_snap_line": False,
                    "rcs_enabled": False,
                    "rcs_strength": 50,
                    "triggerbot_enabled": True,
                    "triggerbot_delay": 500,  # Maximum delay
                    "triggerbot_key": "CTRL",  # Another key binding
                    "smoothing": 50,
                    "fov": 90
                }
            }
        ]
        
        return self._test_config_variations(triggerbot_test_configs)

    def _test_config_variations(self, test_configs):
        """Helper method to test multiple config variations"""
        all_passed = True
        
        for test_case in test_configs:
            self.tests_run += 1
            name = test_case["name"]
            config = test_case["config"]
            
            try:
                headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
                response = requests.put(f"{self.api_url}/config", json=config, headers=headers)
                
                if response.status_code == 200:
                    self.tests_passed += 1
                    self.log(f"PASSED - {name}", "PASS")
                    
                    # Verify the response contains the expected values
                    response_data = response.json()
                    for key, expected_value in config.items():
                        if response_data.get(key) != expected_value:
                            self.log(f"WARNING - {name}: {key} mismatch. Expected: {expected_value}, Got: {response_data.get(key)}", "WARN")
                else:
                    all_passed = False
                    self.log(f"FAILED - {name} - Status: {response.status_code}", "FAIL")
                    try:
                        error_detail = response.json().get('detail', 'No error detail')
                        self.log(f"Error detail: {error_detail}", "FAIL")
                    except:
                        self.log(f"Raw response: {response.text}", "FAIL")
                        
            except Exception as e:
                all_passed = False
                self.log(f"FAILED - {name} - Error: {str(e)}", "FAIL")
        
        return all_passed

    def test_cloud_sync(self):
        """Test Cloud Sync functionality (config save/load)"""
        self.log("Testing Cloud Sync functionality...", "INFO")
        
        # Test configuration to save
        test_config = {
            "esp_enabled": True,
            "esp_color": "#00FFFF",  # Cyan
            "esp_sound": True,
            "esp_head_circle": True,
            "esp_snap_line": True,
            "rcs_enabled": True,
            "rcs_strength": 85,
            "triggerbot_enabled": True,
            "triggerbot_delay": 150,
            "triggerbot_key": "ALT",
            "smoothing": 65,
            "fov": 110
        }
        
        self.tests_run += 1
        
        try:
            headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
            
            # Save configuration
            save_response = requests.put(f"{self.api_url}/config", json=test_config, headers=headers)
            
            if save_response.status_code != 200:
                self.log(f"FAILED - Config save failed with status: {save_response.status_code}", "FAIL")
                return False
            
            # Retrieve configuration to verify it was saved correctly
            get_response = requests.get(f"{self.api_url}/config", headers=headers)
            
            if get_response.status_code != 200:
                self.log(f"FAILED - Config get failed with status: {get_response.status_code}", "FAIL")
                return False
            
            retrieved_config = get_response.json()
            
            # Verify all fields match
            mismatches = []
            for key, expected_value in test_config.items():
                if retrieved_config.get(key) != expected_value:
                    mismatches.append(f"{key}: expected {expected_value}, got {retrieved_config.get(key)}")
            
            if mismatches:
                self.log(f"FAILED - Cloud Sync verification failed: {', '.join(mismatches)}", "FAIL")
                return False
            else:
                self.tests_passed += 1
                self.log("PASSED - Cloud Sync save and retrieve verification", "PASS")
                return True
                
        except Exception as e:
            self.log(f"FAILED - Cloud Sync error: {str(e)}", "FAIL")
            return False

def main():
    print("🎯 Ghost-Driver Config Feature Test Suite")
    print("=" * 60)
    
    tester = ConfigFeatureTester()
    
    # Login first
    if not tester.login():
        print("❌ Cannot proceed without authentication")
        return 1
    
    # Test all new config features
    print("\n🔍 Testing ESP Module Features...")
    esp_success = tester.test_esp_config()
    
    print("\n🔍 Testing RCS Module Features...")
    rcs_success = tester.test_rcs_config()
    
    print("\n🔍 Testing Triggerbot Module Features...")
    triggerbot_success = tester.test_triggerbot_config()
    
    print("\n🔍 Testing Cloud Sync...")
    cloud_sync_success = tester.test_cloud_sync()
    
    # Results
    print("\n" + "=" * 60)
    print("🏁 CONFIG FEATURE TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "N/A")
    
    feature_summary = {
        "ESP Module": "✅ PASS" if esp_success else "❌ FAIL",
        "RCS Module": "✅ PASS" if rcs_success else "❌ FAIL", 
        "Triggerbot Module": "✅ PASS" if triggerbot_success else "❌ FAIL",
        "Cloud Sync": "✅ PASS" if cloud_sync_success else "❌ FAIL"
    }
    
    print("\nFeature Summary:")
    for feature, status in feature_summary.items():
        print(f"  {feature}: {status}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All config features working correctly!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"\n❌ {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())