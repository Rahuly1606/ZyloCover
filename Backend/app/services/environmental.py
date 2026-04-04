"""
RaahPay Environmental Data Service
===================================
Fetches real-time weather/AQI data for Hyderabad zones.
Falls back to mock data during testing.
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
import random
import logging

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
    triggers_active: List[str] = None
    
    def __post_init__(self):
        if self.triggers_active is None:
            self.triggers_active = []


class EnvironmentalDataService:
    """Fetches and evaluates environmental data"""
    
    async def get_snapshot(self, zone: str, city: str = "Hyderabad") -> EnvironmentalSnapshot:
        """Get current environmental data for a zone"""
        
        if settings.USE_MOCK_ENV_DATA:
            return self._generate_mock_snapshot(zone)
        else:
            # In production: call real APIs (OpenWeather, AQI, etc.)
            return self._generate_mock_snapshot(zone)
    
    def _generate_mock_snapshot(self, zone: str) -> EnvironmentalSnapshot:
        """Generate realistic mock data for testing"""
        
        # Base values with zone-specific tendencies
        base_config = {
            "zone_a_flood_prone": {"rain": 45, "temp": 32, "aqi": 150, "wind": 18},
            "zone_b_high_traffic": {"rain": 15, "temp": 34, "aqi": 280, "wind": 20},
            "zone_c_industrial": {"rain": 20, "temp": 33, "aqi": 320, "wind": 22},
            "zone_d_residential": {"rain": 10, "temp": 36, "aqi": 140, "wind": 15},
            "zone_e_outer_ring": {"rain": 35, "temp": 31, "aqi": 130, "wind": 35},
        }
        
        config = base_config.get(zone, base_config["zone_d_residential"])
        
        # Add randomness
        rainfall = max(0, config["rain"] + random.uniform(-20, 25))
        temp = config["temp"] + random.uniform(-3, 5)
        aqi = max(0, config["aqi"] + random.uniform(-50, 50))
        wind = max(0, config["wind"] + random.uniform(-10, 15))
        
        # Determine active triggers
        triggers = []
        if rainfall > settings.RAIN_TRIGGER_MM:
            triggers.append("heavy_rain")
        if temp > settings.TEMP_TRIGGER_C:
            triggers.append("extreme_heat")
        if aqi > settings.AQI_TRIGGER:
            triggers.append("high_aqi")
        if wind > settings.WIND_TRIGGER_KMPH:
            triggers.append("strong_winds")
        
        return EnvironmentalSnapshot(
            zone=zone,
            timestamp=datetime.utcnow(),
            rainfall_mm=round(rainfall, 1),
            temp_c=round(temp, 1),
            aqi=int(aqi),
            wind_kmph=round(wind, 1),
            triggers_active=triggers,
        )


env_service = EnvironmentalDataService()
