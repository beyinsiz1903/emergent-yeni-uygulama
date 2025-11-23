#!/usr/bin/env python3
"""
Redis Cache Performance Test
Test cache hit rates and performance improvements
"""

import asyncio
import aiohttp
import time
import subprocess

BACKEND_URL = "http://localhost:8001/api"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmYwMjc0ZjgtZWFkYy00YWVkLTg1MzktY2JlN2U4MTk1ZmY3IiwidGVuYW50X2lkIjoiN2E4ZGE5NjYtYjRhOS00ZWYwLTg0ZTctMjAyNzhkZDlmMzFjIiwiZXhwIjoxNzY0NDc1ODYzfQ.c6k4XoqGKuQRodb1VhasnfLIiEDO0PUU1VcLvuVOkc4"

async def test_endpoint(session, url, headers):
    """Test an endpoint and return response time"""
    start = time.time()
    try:
        async with session.get(url, headers=headers) as response:
            await response.json()
            end = time.time()
            return (end - start) * 1000  # Convert to ms
    except Exception as e:
        return None

async def test_cache_performance():
    """Test cache performance with multiple requests"""
    print("🔥 REDIS CACHE PERFORMANCE TEST")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Get initial Redis stats
    result = subprocess.run(['redis-cli', 'info', 'stats'], capture_output=True, text=True)
    initial_stats = result.stdout
    initial_hits = int([line for line in initial_stats.split('\n') if 'keyspace_hits' in line][0].split(':')[1])
    initial_misses = int([line for line in initial_stats.split('\n') if 'keyspace_misses' in line][0].split(':')[1])
    
    print(f"\n📊 Initial Redis Stats:")
    print(f"  Cache Hits: {initial_hits}")
    print(f"  Cache Misses: {initial_misses}")
    
    # Test endpoints with cache
    endpoints = [
        ("/pms/dashboard", "PMS Dashboard"),
        ("/housekeeping/room-status", "Housekeeping Room Status"),
        ("/dashboard/role-based", "Role-Based Dashboard"),
    ]
    
    async with aiohttp.ClientSession() as session:
        for endpoint, name in endpoints:
            url = f"{BACKEND_URL}{endpoint}"
            
            print(f"\n🧪 Testing: {name}")
            print(f"   Endpoint: {endpoint}")
            
            # First call (cache miss expected)
            first_time = await test_endpoint(session, url, headers)
            if first_time:
                print(f"   ⏱️  First call (cache miss): {first_time:.1f}ms")
            
            # Wait a bit
            await asyncio.sleep(0.1)
            
            # Second call (cache hit expected)
            second_time = await test_endpoint(session, url, headers)
            if second_time:
                print(f"   ⚡ Second call (cache hit): {second_time:.1f}ms")
                
                if first_time and second_time:
                    improvement = ((first_time - second_time) / first_time) * 100
                    print(f"   📈 Performance improvement: {improvement:.1f}%")
            
            # Third call (cache hit)
            third_time = await test_endpoint(session, url, headers)
            if third_time:
                print(f"   ⚡ Third call (cache hit): {third_time:.1f}ms")
            
            await asyncio.sleep(0.1)
    
    # Get final Redis stats
    result = subprocess.run(['redis-cli', 'info', 'stats'], capture_output=True, text=True)
    final_stats = result.stdout
    final_hits = int([line for line in final_stats.split('\n') if 'keyspace_hits' in line][0].split(':')[1])
    final_misses = int([line for line in final_stats.split('\n') if 'keyspace_misses' in line][0].split(':')[1])
    
    # Calculate cache hit rate
    new_hits = final_hits - initial_hits
    new_misses = final_misses - initial_misses
    total_requests = new_hits + new_misses
    
    if total_requests > 0:
        hit_rate = (new_hits / total_requests) * 100
    else:
        hit_rate = 0
    
    print(f"\n" + "=" * 60)
    print(f"📊 CACHE PERFORMANCE RESULTS")
    print(f"=" * 60)
    print(f"  Total Requests: {total_requests}")
    print(f"  Cache Hits: {new_hits}")
    print(f"  Cache Misses: {new_misses}")
    print(f"  Cache Hit Rate: {hit_rate:.1f}%")
    
    if hit_rate >= 60:
        print(f"  ✅ Excellent cache performance!")
    elif hit_rate >= 40:
        print(f"  ⚠️  Good cache performance, can be improved")
    else:
        print(f"  ❌ Poor cache performance, needs optimization")
    
    # Show cache keys
    result = subprocess.run(['redis-cli', 'KEYS', 'cache:*'], capture_output=True, text=True)
    cache_keys = [k for k in result.stdout.split('\n') if k]
    print(f"\n📦 Cache Keys ({len(cache_keys)}):")
    for key in cache_keys[:10]:  # Show first 10
        print(f"  • {key}")
    if len(cache_keys) > 10:
        print(f"  ... and {len(cache_keys) - 10} more")
    
    print("\n" + "=" * 60)
    print("✅ Cache Performance Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_cache_performance())
