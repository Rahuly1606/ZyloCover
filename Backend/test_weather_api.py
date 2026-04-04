"""
Test Weather API Integration
=============================
Run this to verify OpenWeatherMap + WAQI integration
"""

import asyncio
from app.services.environmental import get_env_service, ZONE_CENTROIDS
from app.core.config import get_settings

settings = get_settings()
env_service = get_env_service()


async def test_all_zones():
    """Test environmental data fetching for all zones"""
    
    print("\n" + "="*70)
    print("🌍 RaahPay Weather API Integration Test")
    print("="*70)
    print(f"\nConfiguration:")
    print(f"  USE_MOCK_ENV_DATA: {settings.USE_MOCK_ENV_DATA}")
    print(f"  OPENWEATHER_API_KEY: {'✅ SET' if settings.OPENWEATHER_API_KEY else '❌ NOT SET'}")
    print(f"  WAQI_API_KEY: {'✅ SET' if settings.WAQI_API_KEY else '❌ NOT SET'}")
    print(f"  API Timeout: {settings.WEATHER_API_TIMEOUT}s\n")
    
    for zone in ZONE_CENTROIDS.keys():
        print(f"\n🔍 Testing {zone}...")
        try:
            snapshot = await env_service.get_snapshot(zone)
            
            print(f"   ✅ Data source: {snapshot.data_source}")
            print(f"   📍 Zone: {snapshot.zone}")
            print(f"   🌡️  Temperature: {snapshot.temp_c}°C")
            print(f"   💧 Rainfall: {snapshot.rainfall_mm}mm")
            print(f"   💨 Wind: {snapshot.wind_kmph} km/h")
            print(f"   🏭 AQI: {snapshot.aqi}")
            print(f"   ⚠️  Triggers: {snapshot.triggers_active or 'None'}")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "="*70)
    print("✅ Test complete!\n")


async def test_parallel_zones():
    """Test fetching data for multiple zones in parallel"""
    
    print("\n🚀 Testing parallel API calls...")
    zones = list(ZONE_CENTROIDS.keys())
    
    import time
    start = time.time()
    
    snapshots = await asyncio.gather(*[
        env_service.get_snapshot(zone) for zone in zones
    ])
    
    elapsed = time.time() - start
    
    print(f"✅ Fetched {len(snapshots)} zones in {elapsed:.2f}s")
    
    for snapshot in snapshots:
        print(f"   - {snapshot.zone}: {snapshot.temp_c}°C, AQI={snapshot.aqi}, {len(snapshot.triggers_active)} triggers")


if __name__ == "__main__":
    print("\n📝 Instructions:")
    print("1. Add your API keys to .env:")
    print("   OPENWEATHER_API_KEY=your_key_here")
    print("   WAQI_API_KEY=your_token_here")
    print("2. Set USE_MOCK_ENV_DATA=False in .env to use real APIs")
    print("3. Run this test:")
    print("   python test_weather_api.py\n")
    
    asyncio.run(test_all_zones())
    asyncio.run(test_parallel_zones())
