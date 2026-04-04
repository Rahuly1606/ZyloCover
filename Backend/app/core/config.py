"""
Application Configuration
=========================
Settings from environment variables, with sensible defaults.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application Settings from .env"""

    # ── Database ────────────────────────────────────────────────────────
    # Aiven MySQL (development): avnadmin:AVNS_rOnElif_Zt3IhpWU2Y1@mysql-21d912cf-csitelge-ca54.c.aivencloud.com:19240/defaultdb
    # Local MySQL (optional): mysql+pymysql://root:Rahul%401606@localhost:3306/zylocover
    DATABASE_URL: str = "mysql+pymysql://avnadmin:AVNS_rOnElif_Zt3IhpWU2Y1@mysql-21d912cf-csitelge-ca54.c.aivencloud.com:19240/defaultdb"

    # ── JWT & Security ──────────────────────────────────────────────────
    SECRET_KEY: str = "your-secret-key-change-this-in-production-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Admin Key ───────────────────────────────────────────────────────
    ADMIN_API_KEY: str = "raahpay-admin-2026"

    # ── Pricing Parameters ──────────────────────────────────────────────
    MIN_PREMIUM_INR: float = 49.0
    MAX_PREMIUM_INR: float = 299.0
    GST_RATE: float = 0.18

    # ── Trigger Thresholds (parametric triggers) ────────────────────────
    RAIN_TRIGGER_MM: float = 50.0
    TEMP_TRIGGER_C: float = 42.0
    AQI_TRIGGER: float = 300.0
    WIND_TRIGGER_KMPH: float = 60.0

    # ── Environment ────────────────────────────────────────────────────
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # ── Mock Data ──────────────────────────────────────────────────────
    USE_MOCK_ENV_DATA: bool = True

    # ── Weather APIs ────────────────────────────────────────────────────
    OPENWEATHER_API_KEY: str = ""  # Get from https://openweathermap.org/api
    WAQI_API_KEY: str = ""         # Get from https://aqicn.org/data-platform/
    WEATHER_API_TIMEOUT: int = 5   # API call timeout in seconds

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = 'allow'  # Allow extra fields from .env


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
