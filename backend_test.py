#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Umeed Now Foundation Finance Dashboard
Tests all endpoints with proper authentication and data validation
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class UmeedNowAPITester:
    def __init__(self, base_url: str = "https://fund-tracker-153.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials
        self.admin_creds = {"email": "admin@umeednow.org", "password": "admin123"}
        self.user_creds = {"email": "user@umeednow.org", "password": "user123"}
        
        print(f"🚀 Starting API tests for: {self.api_url}")
        print("=" * 60)

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    expected_status: int = 200, use_admin: bool = False, 
                    use_user: bool = False) -> tuple[bool, Dict]:
        """Make API request with proper authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        # Add authentication if needed
        if use_admin and self.admin_token:
            headers["Authorization"] = f"Bearer {self.admin_token}"
        elif use_user and self.user_token:
            headers["Authorization"] = f"Bearer {self.user_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints")
        print("-" * 40)
        
        # Test admin login
        success, response = self.make_request("POST", "auth/login", self.admin_creds)
        if success and "id" in response:
            self.log_test("Admin Login", True)
            # Extract token from cookies if available
            if 'access_token' in self.session.cookies:
                self.admin_token = self.session.cookies['access_token']
        else:
            self.log_test("Admin Login", False, f"Response: {response}")
        
        # Test user login
        success, response = self.make_request("POST", "auth/login", self.user_creds)
        if success and "id" in response:
            self.log_test("User Login", True)
            if 'access_token' in self.session.cookies:
                self.user_token = self.session.cookies['access_token']
        else:
            self.log_test("User Login", False, f"Response: {response}")
        
        # Test /auth/me endpoint
        success, response = self.make_request("GET", "auth/me", use_admin=True)
        if success and "email" in response:
            self.log_test("Get Current User (Admin)", True)
        else:
            self.log_test("Get Current User (Admin)", False, f"Response: {response}")
        
        # Test invalid login
        success, response = self.make_request("POST", "auth/login", 
                                            {"email": "invalid@test.com", "password": "wrong"}, 
                                            expected_status=401)
        self.log_test("Invalid Login (401)", success, f"Response: {response}")
        
        # Test logout
        success, response = self.make_request("POST", "auth/logout")
        self.log_test("Logout", success)

    def test_dashboard_endpoint(self):
        """Test dashboard endpoint"""
        print("\n📊 Testing Dashboard Endpoint")
        print("-" * 40)
        
        success, response = self.make_request("GET", "dashboard", use_admin=True)
        if success and "today" in response and "campaign_stats" in response:
            self.log_test("Dashboard Data", True)
            
            # Validate dashboard structure
            today_data = response.get("today", {})
            required_fields = ["total_profit", "platform_profit", "total_revenue", "total_ad_spend"]
            has_all_fields = all(field in today_data for field in required_fields)
            self.log_test("Dashboard Structure Validation", has_all_fields)
        else:
            self.log_test("Dashboard Data", False, f"Response: {response}")

    def test_campaigns_endpoints(self):
        """Test campaign management endpoints"""
        print("\n🎯 Testing Campaign Endpoints")
        print("-" * 40)
        
        # Get campaigns list
        success, response = self.make_request("GET", "campaigns", use_admin=True)
        if success and isinstance(response, list):
            self.log_test("Get Campaigns List", True)
            campaigns = response
            
            if campaigns:
                # Test get single campaign
                campaign_id = campaigns[0]["id"]
                success, response = self.make_request("GET", f"campaigns/{campaign_id}", use_admin=True)
                self.log_test("Get Single Campaign", success and "id" in response)
            else:
                self.log_test("Get Single Campaign", False, "No campaigns found")
        else:
            self.log_test("Get Campaigns List", False, f"Response: {response}")
        
        # Test create campaign
        new_campaign = {
            "name": "Test Campaign API",
            "description": "Test campaign created via API",
            "commission_percentage": 20.0,
            "company_share": 4.0,
            "dev_share": 6.0,
            "himanshu_share": 5.0,
            "denim_share": 5.0,
            "status": "active"
        }
        
        success, response = self.make_request("POST", "campaigns", new_campaign, 
                                            expected_status=200, use_admin=True)
        if success and "id" in response:
            self.log_test("Create Campaign", True)
            test_campaign_id = response["id"]
            
            # Test update campaign
            update_data = {"name": "Updated Test Campaign"}
            success, response = self.make_request("PUT", f"campaigns/{test_campaign_id}", 
                                                update_data, use_admin=True)
            self.log_test("Update Campaign", success and response.get("name") == "Updated Test Campaign")
            
            # Test delete campaign (cleanup)
            success, response = self.make_request("DELETE", f"campaigns/{test_campaign_id}", 
                                                expected_status=200, use_admin=True)
            self.log_test("Delete Campaign", success)
        else:
            self.log_test("Create Campaign", False, f"Response: {response}")

    def test_daily_entries_endpoints(self):
        """Test daily entries endpoints"""
        print("\n📅 Testing Daily Entries Endpoints")
        print("-" * 40)
        
        # Get daily entries
        success, response = self.make_request("GET", "daily-entries", use_admin=True)
        if success and isinstance(response, list):
            self.log_test("Get Daily Entries", True)
            
            # Test with filters
            today = datetime.now().strftime("%Y-%m-%d")
            success, response = self.make_request("GET", f"daily-entries?start_date={today}", use_admin=True)
            self.log_test("Get Daily Entries with Date Filter", success and isinstance(response, list))
        else:
            self.log_test("Get Daily Entries", False, f"Response: {response}")
        
        # Get campaigns for testing entry creation
        success, campaigns = self.make_request("GET", "campaigns", use_admin=True)
        if success and campaigns:
            campaign_id = campaigns[0]["id"]
            
            # Test create daily entry
            test_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            new_entry = {
                "campaign_id": campaign_id,
                "date": test_date,
                "ad_spend": 1000.0,
                "website_collection": 5000.0,
                "qr_collection": 500.0
            }
            
            success, response = self.make_request("POST", "daily-entries", new_entry, 
                                                expected_status=200, use_admin=True)
            if success and "id" in response:
                self.log_test("Create Daily Entry", True)
                entry_id = response["id"]
                
                # Test update entry
                update_data = {"ad_spend": 1200.0}
                success, response = self.make_request("PUT", f"daily-entries/{entry_id}", 
                                                    update_data, use_admin=True)
                self.log_test("Update Daily Entry", success)
                
                # Test delete entry (cleanup)
                success, response = self.make_request("DELETE", f"daily-entries/{entry_id}", 
                                                    expected_status=200, use_admin=True)
                self.log_test("Delete Daily Entry", success)
            else:
                self.log_test("Create Daily Entry", False, f"Response: {response}")

    def test_reports_endpoints(self):
        """Test reports endpoints"""
        print("\n📈 Testing Reports Endpoints")
        print("-" * 40)
        
        # Test general reports
        success, response = self.make_request("GET", "reports", use_admin=True)
        if success and "entries" in response and "summary" in response:
            self.log_test("Get Reports", True)
            
            # Test with preset filters
            success, response = self.make_request("GET", "reports?preset=today", use_admin=True)
            self.log_test("Get Reports with Preset Filter", success and "entries" in response)
        else:
            self.log_test("Get Reports", False, f"Response: {response}")
        
        # Test monthly reports
        success, response = self.make_request("GET", "monthly-reports", use_admin=True)
        if success and isinstance(response, list):
            self.log_test("Get Monthly Reports", True)
        else:
            self.log_test("Get Monthly Reports", False, f"Response: {response}")
        
        # Test stakeholder earnings
        success, response = self.make_request("GET", "stakeholder-earnings", use_admin=True)
        if success and "totals" in response and "by_month" in response:
            self.log_test("Get Stakeholder Earnings", True)
        else:
            self.log_test("Get Stakeholder Earnings", False, f"Response: {response}")

    def test_settings_endpoints(self):
        """Test settings endpoints"""
        print("\n⚙️ Testing Settings Endpoints")
        print("-" * 40)
        
        # Test get settings
        success, response = self.make_request("GET", "settings", use_admin=True)
        if success and "gst_percentage" in response and "gateway_percentage" in response:
            self.log_test("Get Settings", True)
            
            # Test update settings
            update_data = {"gst_percentage": 18.5}
            success, response = self.make_request("PUT", "settings", update_data, use_admin=True)
            if success and response.get("gst_percentage") == 18.5:
                self.log_test("Update Settings", True)
                
                # Restore original settings
                restore_data = {"gst_percentage": 18.0}
                self.make_request("PUT", "settings", restore_data, use_admin=True)
            else:
                self.log_test("Update Settings", False, f"Response: {response}")
        else:
            self.log_test("Get Settings", False, f"Response: {response}")

    def test_user_management_endpoints(self):
        """Test user management endpoints (admin only)"""
        print("\n👥 Testing User Management Endpoints")
        print("-" * 40)
        
        # Test get users (admin only)
        success, response = self.make_request("GET", "users", use_admin=True)
        if success and isinstance(response, list):
            self.log_test("Get Users (Admin)", True)
        else:
            self.log_test("Get Users (Admin)", False, f"Response: {response}")
        
        # Test user access restriction
        success, response = self.make_request("GET", "users", expected_status=403, use_user=True)
        self.log_test("User Access Restriction (403)", success)
        
        # Test create user
        new_user = {
            "email": "testuser@example.com",
            "password": "testpass123",
            "name": "Test User",
            "role": "user"
        }
        
        success, response = self.make_request("POST", "users", new_user, use_admin=True)
        if success and "id" in response:
            self.log_test("Create User", True)
            user_id = response["id"]
            
            # Test delete user (cleanup)
            success, response = self.make_request("DELETE", f"users/{user_id}", 
                                                expected_status=200, use_admin=True)
            self.log_test("Delete User", success)
        else:
            self.log_test("Create User", False, f"Response: {response}")

    def test_monthly_settlements_endpoints(self):
        """Test monthly settlements endpoints"""
        print("\n💰 Testing Monthly Settlements Endpoints")
        print("-" * 40)
        
        # Test get settlements
        success, response = self.make_request("GET", "monthly-settlements", use_admin=True)
        if success and isinstance(response, list):
            self.log_test("Get Monthly Settlements", True)
        else:
            self.log_test("Get Monthly Settlements", False, f"Response: {response}")
        
        # Test user access restriction
        success, response = self.make_request("GET", "monthly-settlements", 
                                            expected_status=403, use_user=True)
        self.log_test("Settlements User Access Restriction (403)", success)

    def run_all_tests(self):
        """Run all test suites"""
        print("🧪 Umeed Now Foundation API Testing Suite")
        print("=" * 60)
        
        # Run test suites
        self.test_auth_endpoints()
        self.test_dashboard_endpoint()
        self.test_campaigns_endpoints()
        self.test_daily_entries_endpoints()
        self.test_reports_endpoints()
        self.test_settings_endpoints()
        self.test_user_management_endpoints()
        self.test_monthly_settlements_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t["success"]]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = UmeedNowAPITester()
    success = tester.run_all_tests()
    
    # Save test results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": tester.tests_passed/tester.tests_run*100 if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())