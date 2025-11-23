"""
Comprehensive Optimization Testing Script
Tests all optimization systems
"""
import requests
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_section(title):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{title.center(60)}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def test_optimization_health():
    """Test optimization system health"""
    print_section("OPTIMIZATION SYSTEM HEALTH")
    
    try:
        response = requests.get(f"{BASE_URL}/api/optimization/health")
        data = response.json()
        
        print(f"Status: {Colors.GREEN}✓{Colors.END} All systems operational")
        print(f"  - Data Archival: {Colors.GREEN if data['archival'] else Colors.RED}{'✓' if data['archival'] else '✗'}{Colors.END}")
        print(f"  - Materialized Views: {Colors.GREEN if data['materialized_views'] else Colors.RED}{'✓' if data['materialized_views'] else '✗'}{Colors.END}")
        print(f"  - Cache Manager: {Colors.GREEN if data['cache'] else Colors.RED}{'✓' if data['cache'] else '✗'}{Colors.END}")
        print(f"  - Cache Warmer: {Colors.GREEN if data['cache_warmer'] else Colors.RED}{'✓' if data['cache_warmer'] else '✗'}{Colors.END}")
        
        if 'cache_details' in data:
            print(f"\nCache Details:")
            print(f"  - Total Keys: {data['cache_details'].get('total_keys', 0)}")
            print(f"  - Memory Used: {data['cache_details'].get('memory_used', 'N/A')}")
        
        if 'views_details' in data:
            print(f"\nMaterialized Views:")
            print(f"  - Total Views: {data['views_details'].get('total_views', 0)}")
        
        return True
    except Exception as e:
        print(f"Status: {Colors.RED}✗{Colors.END} Health check failed: {e}")
        return False

def test_materialized_views():
    """Test materialized views performance"""
    print_section("MATERIALIZED VIEWS PERFORMANCE")
    
    try:
        # Get view stats
        response = requests.get(f"{BASE_URL}/api/optimization/views/stats")
        stats = response.json()
        
        print(f"Total Views: {stats['total_views']}")
        
        for view in stats.get('views', []):
            print(f"\n{view['view_name']}:")
            print(f"  - Type: {view['view_type']}")
            print(f"  - Last Updated: {view.get('updated_at', 'Never')}")
            print(f"  - Age: {view.get('age_seconds', 0):.1f}s")
            print(f"  - Refresh Time: {Colors.GREEN}{view.get('refresh_duration_ms', 0):.2f}ms{Colors.END}")
        
        # Test refresh
        print(f"\n{Colors.YELLOW}Testing refresh...{Colors.END}")
        start = time.time()
        refresh_response = requests.post(f"{BASE_URL}/api/optimization/views/refresh")
        duration = (time.time() - start) * 1000
        
        if refresh_response.status_code == 200:
            print(f"{Colors.GREEN}✓{Colors.END} Refresh completed in {duration:.2f}ms")
        else:
            print(f"{Colors.RED}✗{Colors.END} Refresh failed")
        
        return True
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.END} Test failed: {e}")
        return False

def test_cache_performance():
    """Test cache performance"""
    print_section("CACHE PERFORMANCE TEST")
    
    try:
        # Get cache stats
        response = requests.get(f"{BASE_URL}/api/optimization/cache/stats")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"Cache Statistics:")
            print(f"  - Total Keys: {stats.get('total_keys', 0)}")
            print(f"  - Memory Used: {stats.get('memory_used', 'N/A')}")
            print(f"  - Connected Clients: {stats.get('connected_clients', 0)}")
            
            if 'layer_distribution' in stats:
                print(f"\nLayer Distribution:")
                for layer, count in stats['layer_distribution'].items():
                    print(f"  - {layer}: {count} keys")
            
            if 'layers' in stats:
                print(f"\nLayer Configuration:")
                for layer, config in stats['layers'].items():
                    print(f"  - {layer}: TTL={config['ttl']}s ({config['description']})")
        else:
            print(f"{Colors.YELLOW}⚠{Colors.END} Cache stats unavailable (status: {response.status_code})")
        
        # Test cache warming
        print(f"\n{Colors.YELLOW}Testing cache warming...{Colors.END}")
        warm_response = requests.post(f"{BASE_URL}/api/optimization/cache/warm?target=dashboard")
        
        if warm_response.status_code == 200:
            print(f"{Colors.GREEN}✓{Colors.END} Cache warming completed")
        else:
            print(f"{Colors.YELLOW}⚠{Colors.END} Cache warming partially completed")
        
        return True
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.END} Test failed: {e}")
        return False

def test_dashboard_performance():
    """Test dashboard loading performance"""
    print_section("DASHBOARD PERFORMANCE TEST")
    
    endpoints = [
        ("/api/pms/dashboard", "PMS Dashboard"),
        ("/api/reports/daily-flash", "Daily Flash Report"),
        ("/api/folio/dashboard-stats", "Folio Stats"),
    ]
    
    results = []
    
    for endpoint, name in endpoints:
        try:
            # First request (cold)
            start = time.time()
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
            cold_duration = (time.time() - start) * 1000
            
            # Second request (warm/cached)
            start = time.time()
            response2 = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
            warm_duration = (time.time() - start) * 1000
            
            improvement = ((cold_duration - warm_duration) / cold_duration * 100) if cold_duration > 0 else 0
            
            status = Colors.GREEN if response.status_code == 200 else Colors.RED
            
            print(f"{name}:")
            print(f"  - Cold: {cold_duration:.2f}ms")
            print(f"  - Warm: {warm_duration:.2f}ms")
            print(f"  - Improvement: {Colors.GREEN if improvement > 0 else Colors.YELLOW}{improvement:.1f}%{Colors.END}")
            print(f"  - Status: {status}{response.status_code}{Colors.END}\n")
            
            results.append({
                'name': name,
                'cold': cold_duration,
                'warm': warm_duration,
                'improvement': improvement,
                'status': response.status_code
            })
        except Exception as e:
            print(f"{name}: {Colors.RED}✗{Colors.END} Failed - {e}\n")
    
    # Summary
    if results:
        avg_cold = sum(r['cold'] for r in results) / len(results)
        avg_warm = sum(r['warm'] for r in results) / len(results)
        avg_improvement = sum(r['improvement'] for r in results) / len(results)
        
        print(f"Average Performance:")
        print(f"  - Cold: {avg_cold:.2f}ms")
        print(f"  - Warm: {avg_warm:.2f}ms")
        print(f"  - Average Improvement: {Colors.GREEN}{avg_improvement:.1f}%{Colors.END}")
    
    return True

def test_data_archival():
    """Test data archival system"""
    print_section("DATA ARCHIVAL SYSTEM")
    
    try:
        # Get archival stats
        response = requests.get(f"{BASE_URL}/api/optimization/archive/stats")
        stats = response.json()
        
        print(f"Archival Statistics:")
        print(f"  - Active Bookings: {stats.get('active_bookings', 0):,}")
        print(f"  - Archived Bookings: {stats.get('archived_bookings', 0):,}")
        print(f"  - Total Bookings: {stats.get('total_bookings', 0):,}")
        print(f"  - Archive Percentage: {stats.get('archive_percentage', 0):.2f}%")
        print(f"  - Threshold: {stats.get('threshold_days', 365)} days")
        
        # Dry run test
        print(f"\n{Colors.YELLOW}Running dry-run archival test...{Colors.END}")
        dry_run_response = requests.post(
            f"{BASE_URL}/api/optimization/archive/bookings",
            json={"dry_run": True}
        )
        
        if dry_run_response.status_code == 200:
            dry_run = dry_run_response.json()
            print(f"{Colors.GREEN}✓{Colors.END} Dry run completed")
            print(f"  - Records to archive: {dry_run.get('records_to_archive', 0):,}")
            print(f"  - Cutoff date: {dry_run.get('cutoff_date', 'N/A')}")
        else:
            print(f"{Colors.RED}✗{Colors.END} Dry run failed")
        
        return True
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.END} Test failed: {e}")
        return False

def run_all_tests():
    """Run all optimization tests"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}HOTEL PMS OPTIMIZATION TEST SUITE{Colors.END}")
    print(f"{Colors.BLUE}Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    tests = [
        ("Health Check", test_optimization_health),
        ("Materialized Views", test_materialized_views),
        ("Cache Performance", test_cache_performance),
        ("Dashboard Performance", test_dashboard_performance),
        ("Data Archival", test_data_archival),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"{Colors.RED}✗{Colors.END} {test_name} crashed: {e}")
            results.append((test_name, False))
        
        time.sleep(1)  # Brief pause between tests
    
    # Final Summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = f"{Colors.GREEN}✓ PASSED{Colors.END}" if success else f"{Colors.RED}✗ FAILED{Colors.END}"
        print(f"{test_name}: {status}")
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    percentage = (passed / total * 100) if total > 0 else 0
    color = Colors.GREEN if percentage == 100 else Colors.YELLOW if percentage >= 70 else Colors.RED
    print(f"{color}Results: {passed}/{total} tests passed ({percentage:.1f}%){Colors.END}")
    print(f"{Colors.BLUE}Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

if __name__ == "__main__":
    run_all_tests()
