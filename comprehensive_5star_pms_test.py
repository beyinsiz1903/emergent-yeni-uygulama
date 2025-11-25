#!/usr/bin/env python3
"""
Comprehensive 5-Star Hotel PMS System Test
Tests 50+ newly added endpoints across 12 categories
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://user-auth-flow-14.preview.emergentagent.com/api"
EMAIL = "demo@hotel.com"
PASSWORD = "demo123"

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(category, endpoint, status, message=""):
    """Log test result"""
    test_results["total"] += 1
    if status == "PASS":
        test_results["passed"] += 1
        print(f"✅ [{category}] {endpoint}: PASS {message}")
    else:
        test_results["failed"] += 1
        error_msg = f"❌ [{category}] {endpoint}: FAIL - {message}"
        print(error_msg)
        test_results["errors"].append(error_msg)

def login():
    """Login and get access token"""
    print("\n🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        tenant_id = data.get("tenant", {}).get("id")
        print(f"✅ Login successful! Tenant ID: {tenant_id}")
        return token, tenant_id
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        sys.exit(1)

def get_headers(token):
    """Get authorization headers"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def test_email_auth_system(token):
    """Test Email & Auth System (5 endpoints)"""
    print("\n" + "="*80)
    print("1. EMAIL & AUTH SYSTEM")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. Request verification code
    try:
        response = requests.post(
            f"{BASE_URL}/auth/request-verification",
            json={
                "email": "newuser@test.com",
                "name": "Test User",
                "user_type": "hotel",
                "property_name": "Test Hotel"
            },
            timeout=10
        )
        if response.status_code == 200:
            log_test("Email Auth", "POST /auth/request-verification", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("Email Auth", "POST /auth/request-verification", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Email Auth", "POST /auth/request-verification", "FAIL", str(e))
    
    # 2. Forgot password
    try:
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json={"email": EMAIL},
            timeout=10
        )
        if response.status_code == 200:
            log_test("Email Auth", "POST /auth/forgot-password", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("Email Auth", "POST /auth/forgot-password", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Email Auth", "POST /auth/forgot-password", "FAIL", str(e))
    
    # 3. Login (already tested)
    log_test("Email Auth", "POST /auth/login", "PASS", "(tested during setup)")

def test_flash_report(token):
    """Test Flash Report (1 endpoint)"""
    print("\n" + "="*80)
    print("2. FLASH REPORT")
    print("="*80)
    
    headers = get_headers(token)
    
    try:
        response = requests.get(
            f"{BASE_URL}/reports/flash-report",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            required_fields = ['occupancy', 'revenue', 'guest_flow']
            if all(field in data for field in required_fields):
                log_test("Flash Report", "GET /reports/flash-report", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
            else:
                log_test("Flash Report", "GET /reports/flash-report", "FAIL", f"Missing required fields")
        else:
            log_test("Flash Report", "GET /reports/flash-report", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Flash Report", "GET /reports/flash-report", "FAIL", str(e))

def test_group_sales(token):
    """Test Group Sales (3 endpoints)"""
    print("\n" + "="*80)
    print("3. GROUP SALES")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. Create group block
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        next_week = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/groups/create-block",
            headers=headers,
            json={
                "group_name": "Test Conference Group",
                "contact_person": "John Doe",
                "contact_email": "john@conference.com",
                "contact_phone": "+1234567890",
                "check_in_date": tomorrow,
                "check_out_date": next_week,
                "room_type": "Standard",
                "total_rooms": 10,
                "rate_per_room": 100.0,
                "block_type": "definite"
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            block_id = data.get("block_id")
            log_test("Group Sales", "POST /groups/create-block", "PASS", f"Block ID: {block_id}")
            
            # 2. Get all blocks
            try:
                response = requests.get(
                    f"{BASE_URL}/groups/blocks",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    log_test("Group Sales", "GET /groups/blocks", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                else:
                    log_test("Group Sales", "GET /groups/blocks", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                log_test("Group Sales", "GET /groups/blocks", "FAIL", str(e))
            
            # 3. Get block details
            if block_id:
                try:
                    response = requests.get(
                        f"{BASE_URL}/groups/block/{block_id}",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if 'pickup' in data:
                            log_test("Group Sales", f"GET /groups/block/{block_id}", "PASS", "with pickup data")
                        else:
                            log_test("Group Sales", f"GET /groups/block/{block_id}", "PASS", "without pickup")
                    else:
                        log_test("Group Sales", f"GET /groups/block/{block_id}", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Group Sales", f"GET /groups/block/{block_id}", "FAIL", str(e))
        else:
            log_test("Group Sales", "POST /groups/create-block", "FAIL", f"HTTP {response.status_code}")
            log_test("Group Sales", "GET /groups/blocks", "SKIP", "Depends on create-block")
            log_test("Group Sales", "GET /groups/block/{id}", "SKIP", "Depends on create-block")
    except Exception as e:
        log_test("Group Sales", "POST /groups/create-block", "FAIL", str(e))

def test_online_checkin_upsell(token):
    """Test Online Check-in & Upsell (3 endpoints)"""
    print("\n" + "="*80)
    print("4. ONLINE CHECK-IN & UPSELL")
    print("="*80)
    
    headers = get_headers(token)
    
    # First, get a booking to test with
    try:
        response = requests.get(
            f"{BASE_URL}/pms/bookings?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            bookings = response.json().get("bookings", [])
            if bookings:
                booking_id = bookings[0].get("id")
                
                # 1. Get upsell offers
                try:
                    response = requests.get(
                        f"{BASE_URL}/upsell/offers/{booking_id}",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Online Checkin", f"GET /upsell/offers/{booking_id}", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Online Checkin", f"GET /upsell/offers/{booking_id}", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Online Checkin", f"GET /upsell/offers/{booking_id}", "FAIL", str(e))
                
                # 2. Submit online check-in
                try:
                    response = requests.post(
                        f"{BASE_URL}/checkin/online",
                        headers=headers,
                        json={
                            "booking_id": booking_id,
                            "estimated_arrival": "14:00",
                            "special_requests": "Early check-in if possible"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Online Checkin", "POST /checkin/online", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Online Checkin", "POST /checkin/online", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Online Checkin", "POST /checkin/online", "FAIL", str(e))
                
                # 3. Accept upsell offer
                try:
                    response = requests.post(
                        f"{BASE_URL}/upsell/accept",
                        headers=headers,
                        json={
                            "booking_id": booking_id,
                            "offer_type": "room_upgrade",
                            "offer_details": "Suite upgrade"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Online Checkin", "POST /upsell/accept", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Online Checkin", "POST /upsell/accept", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Online Checkin", "POST /upsell/accept", "FAIL", str(e))
            else:
                log_test("Online Checkin", "GET /upsell/offers/{id}", "SKIP", "No bookings found")
                log_test("Online Checkin", "POST /checkin/online", "SKIP", "No bookings found")
                log_test("Online Checkin", "POST /upsell/accept", "SKIP", "No bookings found")
    except Exception as e:
        log_test("Online Checkin", "All endpoints", "FAIL", str(e))

def test_vip_management(token):
    """Test VIP Management (3 endpoints)"""
    print("\n" + "="*80)
    print("5. VIP MANAGEMENT")
    print("="*80)
    
    headers = get_headers(token)
    
    # Get a guest to test with
    try:
        response = requests.get(
            f"{BASE_URL}/pms/guests?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            guests = response.json().get("guests", [])
            if guests:
                guest_id = guests[0].get("id")
                
                # 1. Create VIP protocol
                try:
                    response = requests.post(
                        f"{BASE_URL}/guests/{guest_id}/vip-protocol",
                        headers=headers,
                        json={
                            "vip_level": "gold",
                            "preferences": ["champagne", "late checkout"],
                            "special_instructions": "Prepare welcome amenities"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("VIP Management", f"POST /guests/{guest_id}/vip-protocol", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("VIP Management", f"POST /guests/{guest_id}/vip-protocol", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("VIP Management", f"POST /guests/{guest_id}/vip-protocol", "FAIL", str(e))
                
                # 2. Get VIP list
                try:
                    response = requests.get(
                        f"{BASE_URL}/vip/list",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("VIP Management", "GET /vip/list", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("VIP Management", "GET /vip/list", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("VIP Management", "GET /vip/list", "FAIL", str(e))
                
                # 3. Get upcoming celebrations
                try:
                    response = requests.get(
                        f"{BASE_URL}/celebrations/upcoming",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("VIP Management", "GET /celebrations/upcoming", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("VIP Management", "GET /celebrations/upcoming", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("VIP Management", "GET /celebrations/upcoming", "FAIL", str(e))
            else:
                log_test("VIP Management", "All endpoints", "SKIP", "No guests found")
    except Exception as e:
        log_test("VIP Management", "All endpoints", "FAIL", str(e))

def test_sales_crm(token):
    """Test Sales CRM (3 endpoints)"""
    print("\n" + "="*80)
    print("6. SALES CRM")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. Create lead
    try:
        response = requests.post(
            f"{BASE_URL}/sales/leads",
            headers=headers,
            json={
                "company_name": "Test Corporation",
                "contact_person": "Jane Smith",
                "contact_email": "jane@testcorp.com",
                "contact_phone": "+1234567890",
                "lead_source": "website",
                "estimated_rooms": 50,
                "estimated_value": 5000.0,
                "notes": "Interested in corporate rates"
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            lead_id = data.get("lead_id")
            log_test("Sales CRM", "POST /sales/leads", "PASS", f"Lead ID: {lead_id}")
            
            # 2. Get sales funnel
            try:
                response = requests.get(
                    f"{BASE_URL}/sales/funnel",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    log_test("Sales CRM", "GET /sales/funnel", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                else:
                    log_test("Sales CRM", "GET /sales/funnel", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                log_test("Sales CRM", "GET /sales/funnel", "FAIL", str(e))
            
            # 3. Log activity
            if lead_id:
                try:
                    response = requests.post(
                        f"{BASE_URL}/sales/activity",
                        headers=headers,
                        json={
                            "lead_id": lead_id,
                            "activity_type": "call",
                            "notes": "Follow-up call completed",
                            "next_action": "Send proposal"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Sales CRM", "POST /sales/activity", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Sales CRM", "POST /sales/activity", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Sales CRM", "POST /sales/activity", "FAIL", str(e))
        else:
            log_test("Sales CRM", "POST /sales/leads", "FAIL", f"HTTP {response.status_code}")
            log_test("Sales CRM", "GET /sales/funnel", "SKIP", "Depends on leads")
            log_test("Sales CRM", "POST /sales/activity", "SKIP", "Depends on leads")
    except Exception as e:
        log_test("Sales CRM", "POST /sales/leads", "FAIL", str(e))

def test_service_recovery(token):
    """Test Service Recovery (2 endpoints)"""
    print("\n" + "="*80)
    print("7. SERVICE RECOVERY")
    print("="*80)
    
    headers = get_headers(token)
    
    # Get a booking for complaint
    try:
        response = requests.get(
            f"{BASE_URL}/pms/bookings?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            bookings = response.json().get("bookings", [])
            if bookings:
                booking_id = bookings[0].get("id")
                guest_id = bookings[0].get("guest_id")
                
                # 1. Create complaint
                try:
                    response = requests.post(
                        f"{BASE_URL}/service/complaints",
                        headers=headers,
                        json={
                            "booking_id": booking_id,
                            "guest_id": guest_id,
                            "complaint_type": "room_cleanliness",
                            "description": "Room was not properly cleaned",
                            "severity": "medium"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Service Recovery", "POST /service/complaints", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Service Recovery", "POST /service/complaints", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Service Recovery", "POST /service/complaints", "FAIL", str(e))
                
                # 2. Get complaints
                try:
                    response = requests.get(
                        f"{BASE_URL}/service/complaints",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Service Recovery", "GET /service/complaints", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Service Recovery", "GET /service/complaints", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Service Recovery", "GET /service/complaints", "FAIL", str(e))
            else:
                log_test("Service Recovery", "All endpoints", "SKIP", "No bookings found")
    except Exception as e:
        log_test("Service Recovery", "All endpoints", "FAIL", str(e))

def test_ai_features(token):
    """Test AI Features (4 endpoints)"""
    print("\n" + "="*80)
    print("8. AI FEATURES")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. AI pricing recommendation
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = requests.get(
            f"{BASE_URL}/pricing/ai-recommendation?room_type=Standard&date={tomorrow}",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("AI Features", "GET /pricing/ai-recommendation", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("AI Features", "GET /pricing/ai-recommendation", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("AI Features", "GET /pricing/ai-recommendation", "FAIL", str(e))
    
    # 2. Reputation overview
    try:
        response = requests.get(
            f"{BASE_URL}/reputation/overview",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("AI Features", "GET /reputation/overview", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("AI Features", "GET /reputation/overview", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("AI Features", "GET /reputation/overview", "FAIL", str(e))
    
    # 3. AI chatbot
    try:
        response = requests.post(
            f"{BASE_URL}/ai/chat",
            headers=headers,
            json={
                "message": "What is the occupancy rate today?",
                "context": "dashboard"
            },
            timeout=15
        )
        if response.status_code == 200:
            log_test("AI Features", "POST /ai/chat", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("AI Features", "POST /ai/chat", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("AI Features", "POST /ai/chat", "FAIL", str(e))
    
    # 4. Sentiment analysis
    try:
        response = requests.get(
            f"{BASE_URL}/pms/guests?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            guests = response.json().get("guests", [])
            if guests:
                guest_id = guests[0].get("id")
                try:
                    response = requests.get(
                        f"{BASE_URL}/ai/sentiment/{guest_id}",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("AI Features", f"GET /ai/sentiment/{guest_id}", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("AI Features", f"GET /ai/sentiment/{guest_id}", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("AI Features", f"GET /ai/sentiment/{guest_id}", "FAIL", str(e))
            else:
                log_test("AI Features", "GET /ai/sentiment/{id}", "SKIP", "No guests found")
    except Exception as e:
        log_test("AI Features", "GET /ai/sentiment/{id}", "FAIL", str(e))

def test_spa_events(token):
    """Test Spa & Events (2 endpoints)"""
    print("\n" + "="*80)
    print("9. SPA & EVENTS")
    print("="*80)
    
    headers = get_headers(token)
    
    # Get a guest for spa appointment
    try:
        response = requests.get(
            f"{BASE_URL}/pms/guests?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            guests = response.json().get("guests", [])
            if guests:
                guest_id = guests[0].get("id")
                
                # 1. Create spa appointment
                try:
                    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                    response = requests.post(
                        f"{BASE_URL}/spa/appointments",
                        headers=headers,
                        json={
                            "guest_id": guest_id,
                            "service_type": "massage",
                            "appointment_date": tomorrow,
                            "appointment_time": "14:00",
                            "duration_minutes": 60,
                            "therapist": "Maria"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Spa & Events", "POST /spa/appointments", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Spa & Events", "POST /spa/appointments", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Spa & Events", "POST /spa/appointments", "FAIL", str(e))
                
                # 2. Create event booking
                try:
                    next_week = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
                    response = requests.post(
                        f"{BASE_URL}/events/bookings",
                        headers=headers,
                        json={
                            "event_name": "Corporate Conference",
                            "event_type": "conference",
                            "event_date": next_week,
                            "attendees": 50,
                            "contact_person": "John Doe",
                            "contact_email": "john@company.com"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Spa & Events", "POST /events/bookings", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Spa & Events", "POST /events/bookings", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Spa & Events", "POST /events/bookings", "FAIL", str(e))
            else:
                log_test("Spa & Events", "All endpoints", "SKIP", "No guests found")
    except Exception as e:
        log_test("Spa & Events", "All endpoints", "FAIL", str(e))

def test_advanced_features(token):
    """Test Advanced Features (4 endpoints)"""
    print("\n" + "="*80)
    print("10. ADVANCED FEATURES")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. Multi-property dashboard
    try:
        response = requests.get(
            f"{BASE_URL}/multi-property/dashboard",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("Advanced Features", "GET /multi-property/dashboard", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("Advanced Features", "GET /multi-property/dashboard", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Advanced Features", "GET /multi-property/dashboard", "FAIL", str(e))
    
    # 2. Installment calculator
    try:
        response = requests.get(
            f"{BASE_URL}/payments/installment?amount=1000&months=6",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("Advanced Features", "GET /payments/installment", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("Advanced Features", "GET /payments/installment", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Advanced Features", "GET /payments/installment", "FAIL", str(e))
    
    # 3. Earn loyalty points
    try:
        response = requests.get(
            f"{BASE_URL}/pms/guests?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            guests = response.json().get("guests", [])
            if guests:
                guest_id = guests[0].get("id")
                try:
                    response = requests.post(
                        f"{BASE_URL}/loyalty/earn-points",
                        headers=headers,
                        json={
                            "guest_id": guest_id,
                            "points": 100,
                            "reason": "Stay completion"
                        },
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("Advanced Features", "POST /loyalty/earn-points", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("Advanced Features", "POST /loyalty/earn-points", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("Advanced Features", "POST /loyalty/earn-points", "FAIL", str(e))
            else:
                log_test("Advanced Features", "POST /loyalty/earn-points", "SKIP", "No guests found")
    except Exception as e:
        log_test("Advanced Features", "POST /loyalty/earn-points", "FAIL", str(e))
    
    # 4. NPS score
    try:
        response = requests.get(
            f"{BASE_URL}/nps/score?days=30",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("Advanced Features", "GET /nps/score", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("Advanced Features", "GET /nps/score", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Advanced Features", "GET /nps/score", "FAIL", str(e))

def test_hr_staff(token):
    """Test HR & Staff (3 endpoints)"""
    print("\n" + "="*80)
    print("11. HR & STAFF")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. Add staff member
    try:
        response = requests.post(
            f"{BASE_URL}/hr/staff",
            headers=headers,
            json={
                "name": "Test Employee",
                "email": "employee@hotel.com",
                "phone": "+1234567890",
                "department": "housekeeping",
                "position": "Room Attendant",
                "hire_date": datetime.now().strftime("%Y-%m-%d"),
                "employment_type": "full_time"
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            staff_id = data.get("staff_id")
            log_test("HR & Staff", "POST /hr/staff", "PASS", f"Staff ID: {staff_id}")
            
            # 2. Get staff list
            try:
                response = requests.get(
                    f"{BASE_URL}/hr/staff?department=housekeeping",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    log_test("HR & Staff", "GET /hr/staff", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                else:
                    log_test("HR & Staff", "GET /hr/staff", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                log_test("HR & Staff", "GET /hr/staff", "FAIL", str(e))
            
            # 3. Get staff performance
            if staff_id:
                try:
                    response = requests.get(
                        f"{BASE_URL}/hr/performance/{staff_id}",
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        log_test("HR & Staff", f"GET /hr/performance/{staff_id}", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
                    else:
                        log_test("HR & Staff", f"GET /hr/performance/{staff_id}", "FAIL", f"HTTP {response.status_code}")
                except Exception as e:
                    log_test("HR & Staff", f"GET /hr/performance/{staff_id}", "FAIL", str(e))
        else:
            log_test("HR & Staff", "POST /hr/staff", "FAIL", f"HTTP {response.status_code}")
            log_test("HR & Staff", "GET /hr/staff", "SKIP", "Depends on staff creation")
            log_test("HR & Staff", "GET /hr/performance/{id}", "SKIP", "Depends on staff creation")
    except Exception as e:
        log_test("HR & Staff", "POST /hr/staff", "FAIL", str(e))

def test_gds_iot(token):
    """Test GDS & IoT (3 endpoints)"""
    print("\n" + "="*80)
    print("12. GDS & IoT")
    print("="*80)
    
    headers = get_headers(token)
    
    # 1. Push rate to GDS
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = requests.post(
            f"{BASE_URL}/gds/push-rate",
            headers=headers,
            json={
                "room_type": "Standard",
                "date": tomorrow,
                "rate": 150.0,
                "availability": 10
            },
            timeout=10
        )
        if response.status_code == 200:
            log_test("GDS & IoT", "POST /gds/push-rate", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("GDS & IoT", "POST /gds/push-rate", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("GDS & IoT", "POST /gds/push-rate", "FAIL", str(e))
    
    # 2. Get GDS reservations
    try:
        response = requests.get(
            f"{BASE_URL}/gds/reservations",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("GDS & IoT", "GET /gds/reservations", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("GDS & IoT", "GET /gds/reservations", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("GDS & IoT", "GET /gds/reservations", "FAIL", str(e))
    
    # 3. Get energy consumption
    try:
        response = requests.get(
            f"{BASE_URL}/iot/energy-consumption?days=30",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            log_test("GDS & IoT", "GET /iot/energy-consumption", "PASS", f"({response.elapsed.total_seconds():.2f}s)")
        else:
            log_test("GDS & IoT", "GET /iot/energy-consumption", "FAIL", f"HTTP {response.status_code}")
    except Exception as e:
        log_test("GDS & IoT", "GET /iot/energy-consumption", "FAIL", str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {test_results['total']}")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    
    if test_results['failed'] > 0:
        print(f"\nSuccess Rate: {(test_results['passed'] / test_results['total'] * 100):.1f}%")
        print("\n" + "="*80)
        print("FAILED TESTS:")
        print("="*80)
        for error in test_results['errors']:
            print(error)
    else:
        print("\n🎉 ALL TESTS PASSED! 100% SUCCESS RATE")
    
    print("\n" + "="*80)

def main():
    """Main test execution"""
    print("="*80)
    print("COMPREHENSIVE 5-STAR HOTEL PMS SYSTEM TEST")
    print("Testing 50+ newly added endpoints")
    print("="*80)
    
    # Login
    token, tenant_id = login()
    
    # Run all test categories
    test_email_auth_system(token)
    test_flash_report(token)
    test_group_sales(token)
    test_online_checkin_upsell(token)
    test_vip_management(token)
    test_sales_crm(token)
    test_service_recovery(token)
    test_ai_features(token)
    test_spa_events(token)
    test_advanced_features(token)
    test_hr_staff(token)
    test_gds_iot(token)
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if test_results['failed'] == 0 else 1)

if __name__ == "__main__":
    main()
