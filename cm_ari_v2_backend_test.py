#!/usr/bin/env python3
"""
Channel Manager ARI v2 Endpoint Testing
Test CM ARI v2 endpoint (nested) as requested in review.

Test Flow:
1) Login as muratsutay@hotmail.com / murat1903 (super_admin)
2) Create a partner API key via POST /api/admin/api-keys with {"name": "Syroce agency"}
3) Call GET /api/cm/ari/v2?start_date=2024-01-01&end_date=2024-01-07 using header X-API-Key
4) Expect 200 and response contains hotel_id, currency, date_from/date_to, room_types[]
5) Test missing key => 401
6) Optionally call with room_type=deluxe to ensure filtering doesn't crash
7) Report sample response keys
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://code-review-helper-12.preview.emergentagent.com/api"
SUPER_ADMIN_EMAIL = "muratsutay@hotmail.com"
SUPER_ADMIN_PASSWORD = "murat1903"

class CMARIv2Tester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.api_key = None
        self.test_results = []
        
    def log_test(self, test_name, success, details, response_time=None):
        """Log test result"""
        status = "✅ PASSED" if success else "❌ FAILED"
        time_info = f" ({response_time:.1f}ms)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        
    def authenticate_super_admin(self):
        """Step 1: Login as super_admin"""
        print("\n🔐 STEP 1: Authenticating as super_admin...")
        
        try:
            start_time = datetime.now()
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": SUPER_ADMIN_EMAIL,
                    "password": SUPER_ADMIN_PASSWORD
                },
                timeout=30
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                user = data.get("user", {})
                
                if user.get("role") == "super_admin":
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.access_token}"
                    })
                    self.log_test(
                        "Super Admin Authentication",
                        True,
                        f"Logged in as {user.get('name')} ({user.get('email')}) with role: {user.get('role')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Super Admin Authentication",
                        False,
                        f"User role is {user.get('role')}, expected super_admin"
                    )
                    return False
            else:
                self.log_test(
                    "Super Admin Authentication",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Super Admin Authentication",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def create_partner_api_key(self):
        """Step 2: Create partner API key"""
        print("\n🔑 STEP 2: Creating partner API key...")
        
        try:
            start_time = datetime.now()
            response = self.session.post(
                f"{BASE_URL}/admin/api-keys",
                json={"name": "Syroce agency"},
                timeout=30
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.api_key = data.get("api_key")
                
                self.log_test(
                    "Partner API Key Creation",
                    True,
                    f"API Key created: {data.get('id')}, Name: {data.get('name')}, Masked: {data.get('masked')}",
                    response_time
                )
                
                print(f"   🔑 Raw API Key: {self.api_key}")
                print(f"   🎭 Masked Key: {data.get('masked')}")
                return True
            else:
                self.log_test(
                    "Partner API Key Creation",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Partner API Key Creation",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_cm_ari_v2_valid_key(self):
        """Step 3: Test CM ARI v2 with valid API key"""
        print("\n📊 STEP 3: Testing CM ARI v2 with valid API key...")
        
        try:
            headers = {"X-API-Key": self.api_key}
            params = {
                "start_date": "2024-01-01",
                "end_date": "2024-01-07"
            }
            
            start_time = datetime.now()
            response = requests.get(
                f"{BASE_URL}/cm/ari/v2",
                headers=headers,
                params=params,
                timeout=30
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["hotel_id", "currency", "date_from", "date_to", "room_types"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Analyze response structure
                    room_types_count = len(data.get("room_types", []))
                    sample_room_type = data.get("room_types", [{}])[0] if room_types_count > 0 else {}
                    
                    details = (
                        f"hotel_id: {data.get('hotel_id')}, "
                        f"currency: {data.get('currency')}, "
                        f"date_from: {data.get('date_from')}, "
                        f"date_to: {data.get('date_to')}, "
                        f"room_types count: {room_types_count}"
                    )
                    
                    if room_types_count > 0:
                        details += f", sample room_type: {sample_room_type.get('room_type_id', 'N/A')}"
                        if sample_room_type.get('days'):
                            details += f", days count: {len(sample_room_type.get('days', []))}"
                    
                    self.log_test(
                        "CM ARI v2 Valid Key",
                        True,
                        details,
                        response_time
                    )
                    
                    # Print sample response keys for analysis
                    print(f"\n📋 SAMPLE RESPONSE STRUCTURE:")
                    print(f"   Response Keys: {list(data.keys())}")
                    if room_types_count > 0:
                        print(f"   Room Type Keys: {list(sample_room_type.keys())}")
                        if sample_room_type.get('days'):
                            sample_day = sample_room_type.get('days', [{}])[0]
                            print(f"   Day Keys: {list(sample_day.keys())}")
                            if sample_day.get('restrictions'):
                                print(f"   Restrictions Keys: {list(sample_day.get('restrictions', {}).keys())}")
                            if sample_day.get('rate'):
                                print(f"   Rate Keys: {list(sample_day.get('rate', {}).keys())}")
                    
                    return True, data
                else:
                    self.log_test(
                        "CM ARI v2 Valid Key",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
                    return False, None
            else:
                self.log_test(
                    "CM ARI v2 Valid Key",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "CM ARI v2 Valid Key",
                False,
                f"Exception: {str(e)}"
            )
            return False, None
    
    def test_cm_ari_v2_missing_key(self):
        """Step 4: Test CM ARI v2 without API key (should return 401)"""
        print("\n🚫 STEP 4: Testing CM ARI v2 without API key...")
        
        try:
            params = {
                "start_date": "2024-01-01",
                "end_date": "2024-01-07"
            }
            
            start_time = datetime.now()
            response = requests.get(
                f"{BASE_URL}/cm/ari/v2",
                params=params,
                timeout=30
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 401:
                self.log_test(
                    "CM ARI v2 Missing Key (401 Expected)",
                    True,
                    f"Correctly returned 401 Unauthorized: {response.json().get('detail', 'No detail')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "CM ARI v2 Missing Key (401 Expected)",
                    False,
                    f"Expected 401, got HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "CM ARI v2 Missing Key (401 Expected)",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_cm_ari_v2_invalid_key(self):
        """Step 5: Test CM ARI v2 with invalid API key (should return 401)"""
        print("\n🔒 STEP 5: Testing CM ARI v2 with invalid API key...")
        
        try:
            headers = {"X-API-Key": "invalid-api-key-12345"}
            params = {
                "start_date": "2024-01-01",
                "end_date": "2024-01-07"
            }
            
            start_time = datetime.now()
            response = requests.get(
                f"{BASE_URL}/cm/ari/v2",
                headers=headers,
                params=params,
                timeout=30
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 401:
                self.log_test(
                    "CM ARI v2 Invalid Key (401 Expected)",
                    True,
                    f"Correctly returned 401 Unauthorized: {response.json().get('detail', 'No detail')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "CM ARI v2 Invalid Key (401 Expected)",
                    False,
                    f"Expected 401, got HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "CM ARI v2 Invalid Key (401 Expected)",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_cm_ari_v2_room_type_filter(self):
        """Step 6: Test CM ARI v2 with room_type filter"""
        print("\n🏨 STEP 6: Testing CM ARI v2 with room_type=deluxe filter...")
        
        try:
            headers = {"X-API-Key": self.api_key}
            params = {
                "start_date": "2024-01-01",
                "end_date": "2024-01-07",
                "room_type": "deluxe"
            }
            
            start_time = datetime.now()
            response = requests.get(
                f"{BASE_URL}/cm/ari/v2",
                headers=headers,
                params=params,
                timeout=30
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                room_types = data.get("room_types", [])
                
                # Check if filtering worked (should only return deluxe rooms or empty if no deluxe rooms)
                deluxe_rooms = [rt for rt in room_types if rt.get("room_type_id") == "deluxe"]
                non_deluxe_rooms = [rt for rt in room_types if rt.get("room_type_id") != "deluxe"]
                
                if len(non_deluxe_rooms) == 0:
                    details = f"Filtering working correctly. Deluxe rooms found: {len(deluxe_rooms)}, Total room types: {len(room_types)}"
                    self.log_test(
                        "CM ARI v2 Room Type Filter",
                        True,
                        details,
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "CM ARI v2 Room Type Filter",
                        False,
                        f"Filter not working. Found non-deluxe rooms: {[rt.get('room_type_id') for rt in non_deluxe_rooms]}"
                    )
                    return False
            else:
                self.log_test(
                    "CM ARI v2 Room Type Filter",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "CM ARI v2 Room Type Filter",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 STARTING CM ARI V2 COMPREHENSIVE TESTING")
        print("=" * 60)
        
        # Step 1: Authenticate
        if not self.authenticate_super_admin():
            print("\n❌ Authentication failed. Cannot proceed with testing.")
            return False
        
        # Step 2: Create API key
        if not self.create_partner_api_key():
            print("\n❌ API key creation failed. Cannot proceed with testing.")
            return False
        
        # Step 3: Test valid key
        success, response_data = self.test_cm_ari_v2_valid_key()
        if not success:
            print("\n⚠️ Valid key test failed, but continuing with error tests...")
        
        # Step 4: Test missing key
        self.test_cm_ari_v2_missing_key()
        
        # Step 5: Test invalid key
        self.test_cm_ari_v2_invalid_key()
        
        # Step 6: Test room type filter (only if we have a valid API key)
        if self.api_key:
            self.test_cm_ari_v2_room_type_filter()
        
        # Summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 CM ARI V2 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            time_info = f" ({result['response_time']:.1f}ms)" if result["response_time"] else ""
            print(f"{status} {result['test']}{time_info}")
            if result["details"]:
                print(f"   {result['details']}")
        
        if success_rate >= 80:
            print(f"\n🎉 OVERALL RESULT: CM ARI V2 ENDPOINT IS PRODUCTION READY!")
        elif success_rate >= 60:
            print(f"\n⚠️ OVERALL RESULT: CM ARI V2 ENDPOINT NEEDS MINOR FIXES")
        else:
            print(f"\n❌ OVERALL RESULT: CM ARI V2 ENDPOINT HAS CRITICAL ISSUES")

def main():
    """Main test execution"""
    tester = CMARIv2Tester()
    
    try:
        tester.run_comprehensive_test()
    except KeyboardInterrupt:
        print("\n\n⚠️ Testing interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error during testing: {str(e)}")
    
    print(f"\n🏁 CM ARI V2 TESTING COMPLETED")

if __name__ == "__main__":
    main()