"""
ZRA TaxGuard OCR AI Service - Pydantic Schemas
API Request/Response Models
Dev 1 - AI & OCR Engineer
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# =====================================================
# Health Check Schema
# =====================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: str
    components: Dict[str, str]


# =====================================================
# OCR Processing Schemas
# =====================================================

class OCRRegion(BaseModel):
    """Detected text region"""
    text: str
    confidence: float
    bbox: List[int] = Field(description="Bounding box [x, y, width, height]")


class OCRResponse(BaseModel):
    """OCR processing response"""
    success: bool
    filename: str
    text: str
    confidence: float
    word_count: int
    processing_time: float
    regions: List[OCRRegion] = []
    metadata: Dict[str, Any] = {}


# =====================================================
# Data Extraction Schemas
# =====================================================

class ExtractionResponse(BaseModel):
    """Data extraction response"""
    success: bool
    filename: str
    document_type: str
    extracted_fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    validation_errors: List[str] = []
    raw_text: str


# =====================================================
# Verification Schemas
# =====================================================

class Anomaly(BaseModel):
    """Detected anomaly"""
    type: str
    severity: str
    description: str
    field: Optional[str] = None
    details: Dict[str, Any] = {}


class VerificationDetails(BaseModel):
    """Detailed verification information"""
    checks_performed: List[str]
    passed_checks: List[str]
    failed_checks: List[str]
    warnings: List[str] = []


class VerificationResponse(BaseModel):
    """Complete verification response"""
    success: bool
    filename: str
    document_type: str
    extracted_fields: Dict[str, Any]
    verification_status: str  # VERIFIED, FLAGGED, REJECTED
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    anomalies: List[Anomaly]
    verification_details: VerificationDetails
    recommendations: List[str]
    ocr_confidence: float


# =====================================================
# Batch Processing Schemas
# =====================================================

class BatchResultItem(BaseModel):
    """Single batch processing result"""
    filename: str
    success: bool
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    extracted_fields: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BatchResponse(BaseModel):
    """Batch processing response"""
    success: bool
    total_files: int
    processed: int
    results: List[BatchResultItem]
