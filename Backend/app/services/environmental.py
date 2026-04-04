"""
RaahPay Environmental Data Service
===================================
Fetches real-time weather/AQI data for Hyderabad zones.
Integrates OpenWeatherMap + WAQI APIs with graceful fallback to mock data.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from datetime import datetime
import random
import logging
import asyncio
import httpx

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("raahpay.env")


# ── Zone Centroids (latitude, longitude) ─────────────────────────────────────

ZONE_CENTROIDS = {
    "zone_a_flood_prone": (17.3850, 78.5169),      # Malkajgiri
    "zone_b_high_traffic": (17.4608, 78.5671),     # Hitech City
    "zone_c_industrial": (17.4578, 78.7307),       # Patancheru
    "zone_d_residential": (17.3808, 78.4381),      # Jubilee Hills
    "zone_e_outer_ring": (17.2412, 78.3849),       # Shamshabad
}


@dataclass
class EnvironmentalSnapshot:
    """Current environmental state in a zone"""
    zone: str
    timestamp: datetime
    rainfall_mm: float
    temp_c: float
    aqi: int
    wind_kmph: float
    data_source: str = "mock"
    triggers_active: List[str] = field(default_factory=list)
    raw_response: Optional[dict] = None


class EnvironmentalDataService:
    """Fetches real-time environmental data with API integration"""
    
    OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather"
    WAQI_BASE = "https://api.waqi.info/feed"
    
    async def get_snapshot(self, zone: str, city: str = "Hyderabad") -> EnvironmentalSnapshot:
        """Get current environmental data for a zone"""
        
        # Try real APIs first if enabled
        if not settings.USE_MOCK_ENV_DATA and settings.OPENWEATHER_API_KEY and settings.WAQI_API_KEY:
            try:
                snapshot = await self._fetch_real_data(zone, city)
                if snapshot:
                    return snapshot
            except Exception as e:
                logger.warning(f"Real API fetch failed for {zone}: {str(e)}. Falling back to mock.")
        
        # Fallback to mock data
        return self._generate_mock_snapshot(zone)
    
    async def _fetch_real_data(self, zone: str, city: str) -> Optional[EnvironmentalSnapshot]:
        """Fetch real data from OpenWeatherMap + WAQI APIs"""
        
        if zone not in ZONE_CENTROIDS:
            return None
        
        lat, lon = ZONE_CENTROIDS[zone]
        
        try:
            async with httpx.AsyncClient(timeout=settings.WEATHER_API_TIMEOUT) as client:
                # Parallel API calls
                weather_task = self._fetch_openweather(client, lat, lon)
                aqi_task = self._fetch_waqi(client, lat, lon, city)
                
                weather_data, aqi_data = await asyncio.gather(
                    weather_task,
                    aqi_task,
                    return_exceptions=True
                )
                
                # Handle any exceptions
                if isinstance(weather_data, Exception):
                    logger.warning(f"OpenWeather API error: {weather_data}")
                    weather_data = None
                if isinstance(aqi_data, Exception):
                    logger.warning(f"WAQI API error: {aqi_data}")
                    aqi_data = None
                
                # If both failed, return None to trigger mock fallback
                if not weather_data or not aqi_data:
                    return None
                
                # Parse and combine data
                return self._parse_api_responses(zone, weather_data, aqi_data)
        
        except Exception as e:
            logger.error(f"Environmental data fetch error: {e}")
            return None
    
    async def _fetch_openweather(self, client: httpx.AsyncClient, lat: float, lon: float) -> Optional[dict]:
        """Fetch weather from OpenWeatherMap API"""
        
        try:
            params = {
                "lat": lat,
                "lon": lon,
                "appid": settings.OPENWEATHER_API_KEY,
                "units": "metric"
            }
            
            response = await client.get(self.OPENWEATHER_BASE, params=params)
            response.raise_for_status()
            
            logger.info(f"✅ OpenWeatherMap API call successful for ({lat}, {lon})")
            return response.json()
        
        except httpx.HTTPError as e:
            logger.warning(f"OpenWeatherMap HTTP error: {e}")
            return None
        except Exception as e:
            logger.warning(f"OpenWeatherMap parse error: {e}")
            return None
    
    async def _fetch_waqi(self, client: httpx.AsyncClient, lat: float, lon: float, city: str) -> Optional[dict]:
        """Fetch AQI from WAQI API"""
        
        try:
            # Try location-based first, then city-based
            params = {
                "token": settings.WAQI_API_KEY,
            }
            
            # Try geo coordinates first
            url = f"{self.WAQI_BASE}/geo:{lat};{lon}/"
            response = await client.get(url, params=params)
            
            # If geo fails, try city name
            if response.status_code != 200:
                url = f"{self.WAQI_BASE}/{city}/"
                response = await client.get(url, params=params)
            
            response.raise_for_status()
            data = response.json()
            
            # WAQI returns status "ok" or "error"
            if data.get("status") == "ok":
                logger.info(f"✅ WAQI API call successful for {city}")
                return data
            else:
                logger.warning(f"WAQI returned status: {data.get('status')}")
                return None
        
        except httpx.HTTPError as e:
            logger.warning(f"WAQI HTTP error: {e}")
            return None
        except Exception as e:
            logger.warning(f"WAQI parse error: {e}")
            return None
    
    def _parse_api_responses(self, zone: str, weather: dict, aqi: dict) -> EnvironmentalSnapshot:
        """Parse OpenWeatherMap + WAQI responses"""
        
        try:
            # Extract weather data
            temp_c = weather.get("main", {}).get("temp", 32.0)
            wind_kmph = weather.get("wind", {}).get("speed", 15.0) * 3.6  # m/s to km/h
            
            # Rain data (in mm for last 1 hour)
            rainfall_mm = weather.get("rain", {}).get("1h", 0.0)
            
            # Extract AQI data
            aqi_value = aqi.get("data", {}).get("aqi", 100)
            
            logger.info(f"📊 {zone}: {temp_c}°C, {rainfall_mm}mm rain, AQI={aqi_value}, {wind_kmph:.1f} km/h wind")
            
            # Determine triggers
            triggers = self._check_triggers(rainfall_mm, temp_c, aqi_value, wind_kmph)
            
            return EnvironmentalSnapshot(
                zone=zone,
                timestamp=datetime.utcnow(),
                rainfall_mm=round(rainfall_mm, 1),
                temp_c=round(temp_c, 1),
                aqi=int(aqi_value),
                wind_kmph=round(wind_kmph, 1),
                data_source="openweathermap+waqi",
                triggers_active=triggers,
                raw_response={"weather": weather, "aqi": aqi}
            )
        
        except Exception as e:
            logger.error(f"Parse error: {e}. Falling back to mock.")
            return None
    
    def _check_triggers(self, rainfall: float, temp: float, aqi: int, wind: float) -> List[str]:
        """Check which environmental thresholds are breached"""
        
        triggers = []
        
        if rainfall > settings.RAIN_TRIGGER_MM:
            triggers.append("heavy_rain")
        if temp > settings.TEMP_TRIGGER_C:
            triggers.append("extreme_heat")
        if aqi > settings.AQI_TRIGGER:
            triggers.append("high_aqi")
        if wind > settings.WIND_TRIGGER_KMPH:
            triggers.append("strong_winds")
        
        return triggers
    
    def _generate_mock_snapshot(self, zone: str) -> EnvironmentalSnapshot:
        """Generate realistic mock data for testing"""
        
        # Base values with zone-specific tendencies (realistic Hyderabad data)
        base_config = {
            "zone_a_flood_prone": {"rain": 45, "temp": 32, "aqi": 150, "wind": 18},
            "zone_b_high_traffic": {"rain": 15, "temp": 34, "aqi": 280, "wind": 20},
            "zone_c_industrial": {"rain": 20, "temp": 33, "aqi": 320, "wind": 22},
            "zone_d_residential": {"rain": 10, "temp": 36, "aqi": 140, "wind": 15},
            "zone_e_outer_ring": {"rain": 35, "temp": 31, "aqi": 130, "wind": 35},
        }
        
        config = base_config.get(zone, base_config["zone_d_residential"])
        
        # Add realistic randomness
        rainfall = max(0, config["rain"] + random.uniform(-20, 25))
        temp = config["temp"] + random.uniform(-3, 5)
        aqi = max(0, config["aqi"] + random.uniform(-50, 50))
        wind = max(0, config["wind"] + random.uniform(-10, 15))
        
        # Determine active triggers
        triggers = self._check_triggers(rainfall, temp, aqi, wind)
        
        logger.info(f"📊 [MOCK] {zone}: {temp:.1f}°C, {rainfall:.1f}mm rain, AQI={aqi:.0f}, {wind:.1f} km/h wind | Triggers: {triggers}")
        
        return EnvironmentalSnapshot(
            zone=zone,
            timestamp=datetime.utcnow(),
            rainfall_mm=round(rainfall, 1),
            temp_c=round(temp, 1),
            aqi=int(aqi),
            wind_kmph=round(wind, 1),
            data_source="mock",
            triggers_active=triggers,
        )


# Singleton instance
_env_service: Optional[EnvironmentalDataService] = None


def get_env_service() -> EnvironmentalDataService:
    """Get singleton environmental service"""
    global _env_service
    if _env_service is None:
        _env_service = EnvironmentalDataService()
    return _env_service


env_service = EnvironmentalDataService()
