import requests
import sys
import json
from datetime import datetime
import time

class GhostDriverAPITester:
    def __init__(self, base_url="https://cipher-panel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.regular_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_invite_key = "ADMIN-6KP6-Q51R"
        self.admin_email = "admin@ghostdriver.com"
        self.admin_password = "ghost123"
        self.test_email = f"test_user_{int(time.time())}@ghostdriver.com"
        self.test_password = "testpass123"

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_symbols = {"INFO": "🔍", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
        symbol = status_symbols.get(status, "ℹ️")
        print(f"{symbol} [{timestamp}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            response = None
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)
            
            if response is None:
                self.log(f"FAILED - {name} - Invalid HTTP method", "FAIL")
                return False, {}
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASSED - {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"FAILED - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    error_detail = response.json().get('detail', 'No error detail')
                    self.log(f"Error detail: {error_detail}", "FAIL")
                except:
                    self.log(f"Raw response: {response.text}", "FAIL")
                return False, {}

        except requests.exceptions.ConnectionError as e:
            self.log(f"FAILED - {name} - Connection Error: {str(e)}", "FAIL")
            return False, {}
        except Exception as e:
            self.log(f"FAILED - {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def test_setup_admin_key(self):
        """Test admin key initialization"""
        self.log("Testing admin key setup...", "INFO")
        success, response = self.run_test(
            "Setup Admin Key",
            "POST", 
            "setup/init-admin",
            200
        )
        if success:
            admin_key = response.get('key', self.admin_invite_key)
            self.log(f"Admin key available: {admin_key}", "INFO")
            return admin_key
        return self.admin_invite_key

    def test_register_admin(self):
        """Test admin registration with admin invite key"""
        success, response = self.run_test(
            "Register Admin User",
            "POST",
            "auth/register",
            200,
            data={
                "email": self.admin_email,
                "password": self.admin_password,
                "invite_key": self.admin_invite_key
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"Admin registered successfully", "PASS")
            return True
        return False

    def test_login_admin(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.admin_email,
                "password": self.admin_password
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"Admin login successful", "PASS")
            return True
        return False

    def test_invite_request_flow(self):
        """Test invite request creation"""
        success, response = self.run_test(
            "Create Invite Request",
            "POST",
            "invite-requests",
            200,
            data={
                "email": self.test_email,
                "reason": "Testing purposes"
            }
        )
        return success, response.get('id') if success else None

    def test_admin_approve_request(self, request_id):
        """Test admin approving invite request"""
        if not self.admin_token or not request_id:
            return False, None
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Approve Request",
            "POST",
            f"admin/invite-requests/{request_id}/approve",
            200,
            headers=headers
        )
        return success, response.get('invite_key') if success else None

    def test_register_regular_user(self, invite_key):
        """Test regular user registration with invite key"""
        if not invite_key:
            return False
            
        success, response = self.run_test(
            "Register Regular User",
            "POST",
            "auth/register",
            200,
            data={
                "email": self.test_email,
                "password": self.test_password,
                "invite_key": invite_key
            }
        )
        
        if success and 'token' in response:
            self.regular_token = response['token']
            self.log(f"Regular user registered successfully", "PASS")
            return True
        return False

    def test_dashboard_endpoints(self):
        """Test dashboard data endpoints"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test status endpoint
        status_success, status_data = self.run_test(
            "Dashboard Status",
            "GET",
            "dashboard/status",
            200,
            headers=headers
        )
        
        # Test stats endpoint
        stats_success, stats_data = self.run_test(
            "Dashboard Stats", 
            "GET",
            "dashboard/stats",
            200,
            headers=headers
        )
        
        return status_success and stats_success

    def test_config_endpoints(self):
        """Test user config endpoints with all new modules"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get config
        get_success, config_data = self.run_test(
            "Get User Config",
            "GET",
            "config",
            200,
            headers=headers
        )
        
        if get_success:
            # Verify all 7 modules are present
            required_modules = [
                'esp_enabled', 'esp_color', 'esp_sound', 'esp_sound_color',
                'rcs_enabled', 'triggerbot_enabled', 'radar_enabled', 'radar_color',
                'grenade_prediction_enabled', 'grenade_prediction_color',
                'bomb_timer_enabled', 'bomb_timer_color',
                'spectator_list_enabled', 'spectator_list_color'
            ]
            
            missing_fields = [field for field in required_modules if field not in config_data]
            if missing_fields:
                self.log(f"Missing config fields: {missing_fields}", "FAIL")
                return False
            else:
                self.log("All required config modules present", "PASS")
        
        # Update config with all new modules
        full_config_data = {
            "esp_enabled": True,
            "esp_color": "#FF0000",
            "esp_sound": True,
            "esp_sound_color": "#FFFF00",
            "esp_head_circle": True,
            "esp_snap_line": False,
            "rcs_enabled": True,
            "rcs_strength": 75,
            "triggerbot_enabled": False,
            "triggerbot_delay": 150,
            "triggerbot_key": "MOUSE4",
            "radar_enabled": True,
            "radar_color": "#00FF00",
            "grenade_prediction_enabled": True,
            "grenade_prediction_color": "#FF8800",
            "bomb_timer_enabled": True,
            "bomb_timer_color": "#FF0000",
            "spectator_list_enabled": True,
            "spectator_list_color": "#FFFFFF"
        }
        
        update_success, updated_data = self.run_test(
            "Update User Config with All Modules",
            "PUT", 
            "config",
            200,
            data=full_config_data,
            headers=headers
        )
        
        if update_success and updated_data:
            # Verify config was saved correctly
            verify_success, verify_data = self.run_test(
                "Verify Updated Config",
                "GET",
                "config",
                200,
                headers=headers
            )
            
            if verify_success:
                # Check that ESP sound color was saved correctly
                if verify_data.get('esp_sound_color') == '#FFFF00':
                    self.log("ESP Sound color configuration verified", "PASS")
                else:
                    self.log("ESP Sound color not saved correctly", "FAIL")
                    return False
                
                # Check radar color
                if verify_data.get('radar_color') == '#00FF00':
                    self.log("Radar color configuration verified", "PASS")
                else:
                    self.log("Radar color not saved correctly", "FAIL")
                    return False
        
        return get_success and update_success

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get all users
        users_success, _ = self.run_test(
            "Get All Users",
            "GET",
            "admin/users",
            200,
            headers=headers
        )
        
        # Get invite requests
        requests_success, _ = self.run_test(
            "Get Invite Requests",
            "GET", 
            "admin/invite-requests",
            200,
            headers=headers
        )
        
        # Get invite keys
        keys_success, _ = self.run_test(
            "Get Invite Keys",
            "GET",
            "admin/invite-keys",
            200,
            headers=headers
        )
        
        # Generate new invite key
        generate_success, _ = self.run_test(
            "Generate Invite Key",
            "POST",
            "admin/invite-keys/generate",
            200,
            headers=headers
        )
        
        # Get killswitch status
        killswitch_success, _ = self.run_test(
            "Get Killswitch Status",
            "GET",
            "admin/killswitch/status",
            200,
            headers=headers
        )
        
        # Get suggestions
        suggestions_success, suggestions_data = self.run_test(
            "Get Suggestions",
            "GET",
            "admin/suggestions",
            200,
            headers=headers
        )
        
        return all([users_success, requests_success, keys_success, generate_success, killswitch_success, suggestions_success])

    def test_killswitch_functionality(self):
        """Test killswitch activate/deactivate"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Activate killswitch
        activate_success, _ = self.run_test(
            "Activate Killswitch",
            "POST",
            "admin/killswitch/activate",
            200,
            headers=headers
        )
        
        # Deactivate killswitch
        deactivate_success, _ = self.run_test(
            "Deactivate Killswitch", 
            "POST",
            "admin/killswitch/deactivate",
            200,
            headers=headers
        )
        
        return activate_success and deactivate_success

    def test_suggestions_api(self):
        """Test suggestions creation, review, and delete functionality"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Create a suggestion
        create_success, create_data = self.run_test(
            "Create Suggestion",
            "POST",
            "suggestions",
            200,
            data={"message": "Test suggestion for new feature"},
            headers=headers
        )
        
        if not create_success:
            return False
            
        suggestion_id = create_data.get('id')
        if not suggestion_id:
            self.log("No suggestion ID returned", "FAIL")
            return False
        
        # Get all suggestions (admin)
        get_success, suggestions_data = self.run_test(
            "Get All Suggestions",
            "GET",
            "admin/suggestions", 
            200,
            headers=headers
        )
        
        if not get_success or not suggestions_data:
            return False
        
        # Find our suggestion
        our_suggestion = next((s for s in suggestions_data if s['id'] == suggestion_id), None)
        if not our_suggestion:
            self.log("Created suggestion not found in list", "FAIL")
            return False
        
        if our_suggestion['status'] != 'new':
            self.log(f"Wrong initial status: {our_suggestion['status']}", "FAIL")
            return False
        
        # Mark as reviewed
        review_success, _ = self.run_test(
            "Mark Suggestion as Reviewed",
            "POST",
            f"admin/suggestions/{suggestion_id}/review",
            200,
            headers=headers
        )
        
        if not review_success:
            return False
        
        # Verify status changed
        verify_success, verify_data = self.run_test(
            "Verify Suggestion Status Change",
            "GET",
            "admin/suggestions",
            200,
            headers=headers
        )
        
        if verify_success:
            reviewed_suggestion = next((s for s in verify_data if s['id'] == suggestion_id), None)
            if reviewed_suggestion and reviewed_suggestion['status'] == 'reviewed':
                self.log("Suggestion status updated to reviewed", "PASS")
            else:
                self.log("Suggestion status not updated correctly", "FAIL")
                return False
        
        # Delete the suggestion
        delete_success, _ = self.run_test(
            "Delete Suggestion",
            "DELETE", 
            f"admin/suggestions/{suggestion_id}",
            200,
            headers=headers
        )
        
        return all([create_success, get_success, review_success, verify_success, delete_success])

    def test_auth_me_endpoint(self):
        """Test the /auth/me endpoint"""
        if not self.admin_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        
        if success and response.get('is_admin'):
            self.log("Admin user verification successful", "PASS")
            return True
        return False

def main():
    print("🚀 Starting Ghost-Driver API Test Suite")
    print("=" * 60)
    
    tester = GhostDriverAPITester()
    
    # Test sequence
    tester.log("Phase 1: Admin Setup", "INFO")
    admin_key = tester.test_setup_admin_key()
    
    # Try to register admin (might fail if already exists)
    admin_registered = tester.test_register_admin()
    if not admin_registered:
        # Try login instead
        tester.log("Admin registration failed, trying login...", "WARN")
        admin_logged_in = tester.test_login_admin()
        if not admin_logged_in:
            tester.log("Cannot proceed without admin access", "FAIL")
            return 1
    
    tester.log("Phase 2: Authentication Tests", "INFO")
    auth_success = tester.test_auth_me_endpoint()
    
    tester.log("Phase 3: Invite Request Flow", "INFO") 
    request_success, request_id = tester.test_invite_request_flow()
    
    if request_success and request_id:
        approve_success, invite_key = tester.test_admin_approve_request(request_id)
        if approve_success and invite_key:
            user_reg_success = tester.test_register_regular_user(invite_key)
    
    tester.log("Phase 4: Dashboard & Config Tests", "INFO")
    dashboard_success = tester.test_dashboard_endpoints()
    config_success = tester.test_config_endpoints()
    
    tester.log("Phase 5: Admin Functions", "INFO")
    admin_success = tester.test_admin_endpoints()
    killswitch_success = tester.test_killswitch_functionality()
    
    tester.log("Phase 6: Suggestions API", "INFO")
    suggestions_success = tester.test_suggestions_api()
    
    # Results
    print("\n" + "=" * 60)
    print("🏁 TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "N/A")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"❌ {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())