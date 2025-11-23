#!/usr/bin/env python3
"""
Ultra Massive Cache Addition - Phase 3
Targeting 150+ cached endpoints
"""

import re

# Enterprise, Deluxe, and remaining critical endpoints
ENDPOINTS_TO_CACHE = [
    # ============= ENTERPRISE ANALYTICS (15 min) =============
    ('/enterprise/rate-leakage', 900, 'enterprise_rate_leakage', 'Rate leakage analysis'),
    ('/enterprise/pickup-pace', 900, 'enterprise_pickup_pace', 'Pickup pace'),
    ('/enterprise/availability-heatmap', 900, 'enterprise_avail_heatmap', 'Availability heatmap'),
    ('/enterprise/competitive-set', 900, 'enterprise_competitive', 'Competitive set analysis'),
    ('/enterprise/market-intelligence', 900, 'enterprise_market_intel', 'Market intelligence'),
    
    # ============= DELUXE REVENUE (10-15 min) =============
    ('/deluxe/pickup-pace-analytics', 900, 'deluxe_pickup_pace', 'Pickup pace analytics'),
    ('/deluxe/lead-time-analysis', 900, 'deluxe_lead_time', 'Lead time analysis'),
    ('/deluxe/oversell-protection', 600, 'deluxe_oversell', 'Oversell protection'),
    ('/deluxe/grouped-conflicts', 600, 'deluxe_grouped_conflicts', 'Grouped conflicts'),
    ('/deluxe/channel-mix', 600, 'deluxe_channel_mix', 'Channel mix'),
    ('/deluxe/rate-parity', 600, 'deluxe_rate_parity', 'Rate parity'),
    
    # ============= NOTIFICATIONS (5 min) =============
    ('/notifications', 300, 'notifications_list', 'Notifications list'),
    ('/notifications/unread', 180, 'notifications_unread', 'Unread notifications'),
    ('/notifications/count', 60, 'notifications_count', 'Notification count'),
    
    # ============= APPROVALS (3-5 min) =============
    ('/approvals', 180, 'approvals_list', 'Approvals list'),
    ('/approvals/pending', 180, 'approvals_pending', 'Pending approvals'),
    ('/approvals/my-requests', 300, 'approvals_my_requests', 'My approval requests'),
    
    # ============= USERS & ROLES (10 min) =============
    ('/users', 600, 'users_list', 'Users list'),
    ('/users/active', 600, 'users_active', 'Active users'),
    ('/roles', 900, 'roles_list', 'Roles list'),
    ('/permissions', 900, 'permissions_list', 'Permissions list'),
    
    # ============= ROOM TYPES & CATEGORIES (10 min) =============
    ('/room-types', 600, 'room_types', 'Room types'),
    ('/room-categories', 600, 'room_categories', 'Room categories'),
    ('/amenities', 900, 'amenities_list', 'Amenities list'),
    
    # ============= RATE PLANS (10 min) =============
    ('/rate-plans', 600, 'rate_plans', 'Rate plans'),
    ('/rate-plans/active', 600, 'rate_plans_active', 'Active rate plans'),
    ('/packages', 600, 'packages_list', 'Packages list'),
    
    # ============= PAYMENT METHODS (10 min) =============
    ('/payment-methods', 600, 'payment_methods', 'Payment methods'),
    ('/payment-gateways', 900, 'payment_gateways', 'Payment gateways'),
    
    # ============= ACCOUNTING CATEGORIES (10 min) =============
    ('/accounting/categories', 600, 'accounting_categories', 'Accounting categories'),
    ('/accounting/accounts', 600, 'accounting_accounts', 'Chart of accounts'),
    ('/accounting/tax-codes', 900, 'accounting_tax_codes', 'Tax codes'),
    
    # ============= MAINTENANCE (3-5 min) =============
    ('/maintenance/categories', 600, 'maintenance_categories', 'Maintenance categories'),
    ('/maintenance/vendors', 600, 'maintenance_vendors', 'Maintenance vendors'),
    ('/maintenance/history/{room_id}', 600, 'maintenance_history', 'Maintenance history'),
    
    # ============= INVENTORY (5 min) =============
    ('/inventory/items', 300, 'inventory_items', 'Inventory items'),
    ('/inventory/stock-levels', 300, 'inventory_stock', 'Stock levels'),
    ('/inventory/low-stock', 180, 'inventory_low_stock', 'Low stock items'),
    
    # ============= HR & STAFF (10 min) =============
    ('/staff', 600, 'staff_list', 'Staff list'),
    ('/staff/schedule', 300, 'staff_schedule', 'Staff schedule'),
    ('/staff/attendance', 300, 'staff_attendance', 'Staff attendance'),
    ('/departments', 900, 'departments_list', 'Departments'),
    
    # ============= CONFIGURATION & SETTINGS (15 min) =============
    ('/settings/general', 900, 'settings_general', 'General settings'),
    ('/settings/property', 900, 'settings_property', 'Property settings'),
    ('/settings/integrations', 900, 'settings_integrations', 'Integration settings'),
    ('/settings/email-templates', 900, 'settings_email_templates', 'Email templates'),
    ('/settings/sms-templates', 900, 'settings_sms_templates', 'SMS templates'),
    
    # ============= LOOKUPS (15 min - static data) =============
    ('/lookup/countries', 900, 'lookup_countries', 'Countries'),
    ('/lookup/cities', 900, 'lookup_cities', 'Cities'),
    ('/lookup/currencies', 900, 'lookup_currencies', 'Currencies'),
    ('/lookup/languages', 900, 'lookup_languages', 'Languages'),
    ('/lookup/nationalities', 900, 'lookup_nationalities', 'Nationalities'),
    ('/lookup/id-types', 900, 'lookup_id_types', 'ID types'),
    ('/lookup/payment-types', 900, 'lookup_payment_types', 'Payment types'),
    ('/lookup/market-segments', 900, 'lookup_market_segments', 'Market segments'),
    ('/lookup/sources', 900, 'lookup_sources', 'Booking sources'),
    
    # ============= SPECIAL REQUESTS (5 min) =============
    ('/special-requests', 300, 'special_requests', 'Special requests'),
    ('/special-requests/templates', 600, 'special_requests_templates', 'Request templates'),
    
    # ============= FEEDBACK & REVIEWS (10 min) =============
    ('/feedback', 600, 'feedback_list', 'Guest feedback'),
    ('/feedback/stats', 900, 'feedback_stats', 'Feedback statistics'),
    ('/reviews', 600, 'reviews_list', 'Guest reviews'),
    
    # ============= CONCIERGE (5 min) =============
    ('/concierge/services', 600, 'concierge_services', 'Concierge services'),
    ('/concierge/recommendations', 600, 'concierge_recommendations', 'Recommendations'),
    
    # ============= LOST & FOUND (5 min) =============
    ('/lost-found', 300, 'lost_found', 'Lost & Found items'),
    ('/lost-found/claimed', 600, 'lost_found_claimed', 'Claimed items'),
    
    # ============= INCIDENT REPORTS (5 min) =============
    ('/incidents', 300, 'incidents_list', 'Incident reports'),
    ('/incidents/by-type', 600, 'incidents_by_type', 'Incidents by type'),
    
    # ============= CONTRACTS (10 min) =============
    ('/contracts', 600, 'contracts_list', 'Contracts'),
    ('/contracts/active', 600, 'contracts_active', 'Active contracts'),
    ('/contracts/expiring', 300, 'contracts_expiring', 'Expiring contracts'),
]

def add_cache_decorator(file_path, endpoint, ttl, key_prefix):
    """Add cache decorator to an endpoint"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    escaped_endpoint = re.escape(endpoint).replace('\\{', '{').replace('\\}', '}')
    pattern = rf'(@api_router\.get\("{escaped_endpoint}"[^\n]*\n)(async def \w+\()'
    
    # Check if already cached
    check_pattern = rf'@api_router\.get\("{escaped_endpoint}"'
    matches = list(re.finditer(check_pattern, content))
    
    if matches:
        for match in matches:
            start = match.start()
            check_area = content[max(0, start-200):start+200]
            if '@cached' in check_area:
                return 'skipped'
    
    replacement = rf'\1@cached(ttl={ttl}, key_prefix="{key_prefix}")  # Cache for {ttl//60} min\n\2'
    new_content, count = re.subn(pattern, replacement, content, count=1)
    
    if count > 0:
        with open(file_path, 'w') as f:
            f.write(new_content)
        return 'added'
    return 'not_found'

def main():
    """Add cache to endpoints"""
    server_file = '/app/backend/server.py'
    
    print("=" * 70)
    print("🚀 ULTRA MASSIVE CACHE ADDITION - Phase 3")
    print("=" * 70)
    print(f"Target: {len(ENDPOINTS_TO_CACHE)} endpoints\n")
    
    success = skip = fail = 0
    
    categories = {}
    
    for endpoint, ttl, key_prefix, description in ENDPOINTS_TO_CACHE:
        result = add_cache_decorator(server_file, endpoint, ttl, key_prefix)
        
        # Extract category from description
        category = description.split()[0] if description else 'Other'
        if category not in categories:
            categories[category] = {'added': 0, 'skipped': 0, 'failed': 0}
        
        if result == 'added':
            print(f"  ✅ {endpoint[:45]:<45} | {description}")
            success += 1
            categories[category]['added'] += 1
        elif result == 'skipped':
            skip += 1
            categories[category]['skipped'] += 1
        else:
            fail += 1
            categories[category]['failed'] += 1
    
    # Count total
    with open(server_file, 'r') as f:
        total_cached = f.read().count('@cached(')
    
    print("\n" + "=" * 70)
    print("📊 SUMMARY BY CATEGORY")
    print("=" * 70)
    for cat, stats in sorted(categories.items()):
        if stats['added'] > 0:
            print(f"  {cat:<25} ✅ {stats['added']}")
    
    print("\n" + "=" * 70)
    print("📊 OVERALL SUMMARY")
    print("=" * 70)
    print(f"  ✅ Successfully added: {success}")
    print(f"  ⏭️  Already cached: {skip}")
    print(f"  ⚠️  Not found: {fail}")
    print(f"  📦 Total processed: {len(ENDPOINTS_TO_CACHE)}")
    print("=" * 70)
    print(f"\n🎯 TOTAL CACHED ENDPOINTS: {total_cached}")
    print(f"   Coverage: ~{(total_cached / 459 * 100):.1f}% of GET endpoints")
    print(f"   Original: 12 endpoints")
    print(f"   Increase: +{total_cached - 12} ({((total_cached - 12) / 12 * 100):.0f}%)")
    print("=" * 70)

if __name__ == "__main__":
    main()
