#!/usr/bin/env python3
"""
Subscription Manual Dates Backend Test
Tests the updated subscription endpoint with manual date setting functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://code-review-helper-12.preview.emergentagent.com/api"
SUPER_ADMIN_EMAIL = "muratsutay@hotmail.com"
SUPER_ADMIN_PASSWORD = "murat1903"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_result(test_name, passed, details=""):
    """Print test result"""
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")

def login_super_admin():
    """Login as super admin and return token"""
    print_section("1. SUPER ADMIN LOGIN")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        },
        timeout=10
    )
    
    print(f"Request: POST /api/auth/login")
    print(f"Email: {SUPER_ADMIN_EMAIL}")
    print(f"Response Status: HTTP {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        user = data.get("user", {})
        print(f"Response: User logged in successfully")
        print(f"User: {user.get('name')}, Role: {user.get('role')}")
        print_result("Super Admin Login", True, f"Token received, Role: {user.get('role')}")
        return token
    else:
        print(f"Response: {response.text}")
        print_result("Super Admin Login", False, f"HTTP {response.status_code}: {response.text}")
        return None

def get_tenants_list(token):
    """Get list of tenants and pick one tenant_id"""
    print_section("2. GET TENANTS LIST")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/admin/tenants",
        headers=headers,
        timeout=10
    )
    
    print(f"Request: GET /api/admin/tenants")
    print(f"Response Status: HTTP {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        tenants = data.get("tenants", [])
        
        if tenants:
            # Pick the first tenant
            tenant = tenants[0]
            tenant_id = tenant.get("id")
            property_name = tenant.get("property_name", "Unknown")
            
            print(f"Found {len(tenants)} tenants")
            print(f"Selected tenant: {property_name} (ID: {tenant_id})")
            print_result("Get Tenants List", True, f"Selected tenant: {property_name}")
            return tenant_id
        else:
            print_result("Get Tenants List", False, "No tenants found")
            return None
    else:
        print(f"Response: {response.text}")
        print_result("Get Tenants List", False, f"HTTP {response.status_code}")
        return None

def test_manual_dates_subscription(token, tenant_id):
    """Test PATCH with manual dates"""
    print_section("3. TEST MANUAL DATES SUBSCRIPTION")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test data with manual dates
    test_data = {
        "subscription_start_date": "2025-01-05",
        "subscription_end_date": "2025-03-10",
        "subscription_days": 30
    }
    
    response = requests.patch(
        f"{BASE_URL}/admin/tenants/{tenant_id}/subscription",
        json=test_data,
        headers=headers,
        timeout=10
    )
    
    print(f"Request: PATCH /api/admin/tenants/{tenant_id}/subscription")
    print(f"Body: {json.dumps(test_data, indent=2)}")
    print(f"Response Status: HTTP {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify response fields
        checks = {
            "HTTP 200": response.status_code == 200,
            "manual_dates == true": data.get("manual_dates") == True,
            "subscription_start matches": data.get("subscription_start_date") == "2025-01-05" or 
                                       data.get("subscription_start") == "2025-01-05" or
                                       "2025-01-05" in str(data.get("subscription_start", "")),
            "subscription_end matches": data.get("subscription_end_date") == "2025-03-10" or
                                      data.get("subscription_end") == "2025-03-10" or
                                      "2025-03-10" in str(data.get("subscription_end", ""))
        }
        
        all_passed = all(checks.values())
        for check, passed in checks.items():
            print_result(check, passed)
        
        return all_passed
    else:
        print(f"Response: {response.text}")
        print_result("Manual Dates Subscription", False, f"HTTP {response.status_code}")
        return False

def test_unlimited_subscription(token, tenant_id):
    """Test PATCH with empty end_date (unlimited)"""
    print_section("4. TEST UNLIMITED SUBSCRIPTION")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test data with empty end_date
    test_data = {
        "subscription_start_date": "2025-01-05",
        "subscription_end_date": "",
        "subscription_days": None
    }
    
    response = requests.patch(
        f"{BASE_URL}/admin/tenants/{tenant_id}/subscription",
        json=test_data,
        headers=headers,
        timeout=10
    )
    
    print(f"Request: PATCH /api/admin/tenants/{tenant_id}/subscription")
    print(f"Body: {json.dumps(test_data, indent=2)}")
    print(f"Response Status: HTTP {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify response fields
        checks = {
            "HTTP 200": response.status_code == 200,
            "subscription_end == 'Sınırsız'": data.get("subscription_end") == "Sınırsız" or
                                            data.get("subscription_end_date") == "Sınırsız" or
                                            data.get("subscription_end") == "" or
                                            data.get("subscription_end") is None
        }
        
        all_passed = all(checks.values())
        for check, passed in checks.items():
            print_result(check, passed)
        
        return all_passed
    else:
        print(f"Response: {response.text}")
        print_result("Unlimited Subscription", False, f"HTTP {response.status_code}")
        return False

def test_negative_case_end_before_start(token, tenant_id):
    """Negative test: end_date < start_date should return 400"""
    print_section("5. NEGATIVE TEST: END < START")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test data with end_date before start_date
    test_data = {
        "subscription_start_date": "2025-03-10",
        "subscription_end_date": "2025-01-05",  # Before start date
        "subscription_days": 30
    }
    
    response = requests.patch(
        f"{BASE_URL}/admin/tenants/{tenant_id}/subscription",
        json=test_data,
        headers=headers,
        timeout=10
    )
    
    print(f"Request: PATCH /api/admin/tenants/{tenant_id}/subscription")
    print(f"Body: {json.dumps(test_data, indent=2)}")
    print(f"Response Status: HTTP {response.status_code}")
    print(f"Response: {response.text}")
    
    # Should return 400 Bad Request
    checks = {
        "HTTP 400": response.status_code == 400,
        "Error message present": len(response.text) > 0
    }
    
    all_passed = all(checks.values())
    for check, passed in checks.items():
        print_result(check, passed)
    
    return all_passed

def main():
    """Main test execution"""
    print("\n" + "="*80)
    print("  SUBSCRIPTION MANUAL DATES BACKEND TEST")
    print("  Testing updated subscription endpoint with manual date functionality")
    print("="*80)
    
    results = {
        "super_admin_login": False,
        "get_tenants_list": False,
        "manual_dates_test": False,
        "unlimited_test": False,
        "negative_test": False
    }
    
    # Step 1: Login as super admin
    token = login_super_admin()
    if not token:
        print("\n❌ CRITICAL: Super admin login failed. Cannot continue tests.")
        print_final_summary(results)
        return
    results["super_admin_login"] = True
    
    # Step 2: Get tenants list and pick one
    tenant_id = get_tenants_list(token)
    if not tenant_id:
        print("\n❌ CRITICAL: Could not get tenant ID. Cannot continue tests.")
        print_final_summary(results)
        return
    results["get_tenants_list"] = True
    
    # Step 3: Test manual dates subscription
    results["manual_dates_test"] = test_manual_dates_subscription(token, tenant_id)
    
    # Step 4: Test unlimited subscription
    results["unlimited_test"] = test_unlimited_subscription(token, tenant_id)
    
    # Step 5: Negative test - end before start
    results["negative_test"] = test_negative_case_end_before_start(token, tenant_id)
    
    # Print final summary
    print_final_summary(results)

def print_final_summary(results):
    """Print final test summary"""
    print_section("FINAL TEST SUMMARY")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {success_rate:.1f}%\n")
    
    for test_name, passed in results.items():
        status = "✅" if passed else "❌"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    if all(results.values()):
        print("\n🎉 ALL TESTS PASSED! Manual dates subscription functionality is working correctly!")
    else:
        print("\n⚠️ SOME TESTS FAILED. Please review the details above.")
        
        # Show specific failures
        failed_tests = [name for name, passed in results.items() if not passed]
        if failed_tests:
            print(f"\nFailed tests: {', '.join(failed_tests)}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()