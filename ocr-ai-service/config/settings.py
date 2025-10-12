"""
ZRA TaxGuard OCR AI Service - Configuration Settings
Environment-based configuration management
Dev 1 - AI & OCR Engineer
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # =====================================================
    # Application Settings
    # =====================================================
    APP_NAME: str = "ZRA TaxGuard OCR AI Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = 8000

    # =====================================================
    # CORS Settings
    # =====================================================
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:8080"
    ]

    # =====================================================
    # OCR Settings
    # =====================================================
    TESSERACT_PATH: str = "/usr/bin/tesseract"
    TESSERACT_LANG: str = "eng"
    OCR_DPI: int = 300
    OCR_PSM: int = 3  # Page segmentation mode

    # Image preprocessing
    ENABLE_PREPROCESSING: bool = True
    PREPROCESSING_RESIZE: bool = True
    PREPROCESSING_DENOISE: bool = True
    PREPROCESSING_THRESHOLD: bool = True

    # =====================================================
    # Google Vision API (Optional)
    # =====================================================
    USE_GOOGLE_VISION: bool = False
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # =====================================================
    # File Upload Settings
    # =====================================================
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg", ".pdf", ".tiff"]
    UPLOAD_DIR: str = "/app/uploads"
    TEMP_DIR: str = "/app/temp"

    # =====================================================
    # Database Settings
    # =====================================================
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "zra_taxguard"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "zrapassword"

    # SQLAlchemy URL
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # =====================================================
    # Backend Integration Settings
    # =====================================================
    BACKEND_URL: str = "http://ocr-backend:5000"
    BLOCKCHAIN_URL: str = "http://blockchain-service:3001"

    # =====================================================
    # AI/NLP Settings
    # =====================================================
    SPACY_MODEL: str = "en_core_web_sm"
    NLP_BATCH_SIZE: int = 50

    # Field extraction confidence thresholds
    MIN_FIELD_CONFIDENCE: float = 0.7
    MIN_DATE_CONFIDENCE: float = 0.8
    MIN_AMOUNT_CONFIDENCE: float = 0.85

    # =====================================================
    # Verification Settings
    # =====================================================
    # Risk scoring thresholds
    RISK_LOW_THRESHOLD: float = 70.0
    RISK_MEDIUM_THRESHOLD: float = 50.0
    RISK_HIGH_THRESHOLD: float = 30.0

    # Anomaly detection
    ENABLE_ANOMALY_DETECTION: bool = True
    ANOMALY_DETECTION_STRICT: bool = False

    # =====================================================
    # Performance Settings
    # =====================================================
    WORKER_THREADS: int = 4
    MAX_CONCURRENT_REQUESTS: int = 10
    REQUEST_TIMEOUT: int = 60  # seconds

    # =====================================================
    # Logging Settings
    # =====================================================
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/app/logs/ocr-ai-service.log"
    LOG_ROTATION: str = "100 MB"
    LOG_RETENTION: str = "30 days"

    # =====================================================
    # Security Settings
    # =====================================================
    API_KEY_ENABLED: bool = False
    API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# =====================================================
# Global settings instance
# =====================================================
settings = Settings()
