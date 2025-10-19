"""
ZRA TaxGuard OCR AI Service - Main Application
FastAPI-based OCR and AI extraction service
Dev 1 - AI & OCR Engineer
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import uvicorn
from loguru import logger
import sys
from datetime import datetime

# Import application modules
from app.ocr.processor import OCRProcessor
from app.extraction.extractor import DataExtractor
from app.verification.verifier import DocumentVerifier
from app.models.schemas import (
    OCRResponse,
    ExtractionResponse,
    VerificationResponse,
    HealthResponse
)
from config.settings import settings

# =====================================================
# FastAPI Application Setup
# =====================================================

app = FastAPI(
    title="ZRA TaxGuard OCR AI Service",
    description="AI-powered OCR and document verification service for customs and tax documents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# =====================================================
# CORS Middleware
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Logging Configuration
# =====================================================

logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/ocr-ai-service.log",
    rotation="100 MB",
    retention="30 days",
    level="DEBUG"
)

# =====================================================
# Initialize Services
# =====================================================

ocr_processor = OCRProcessor()
data_extractor = DataExtractor()
document_verifier = DocumentVerifier()

logger.info("🚀 ZRA TaxGuard OCR AI Service initialized")

# =====================================================
# Health Check Endpoint
# =====================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    Returns service status and component availability
    """
    return HealthResponse(
        status="healthy",
        service="OCR AI Service",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat(),
        components={
            "ocr": "operational",
            "extraction": "operational",
            "verification": "operational",
            "database": "operational"
        }
    )

# =====================================================
# OCR Processing Endpoint
# =====================================================

@app.post("/api/ocr/process", response_model=OCRResponse)
async def process_ocr(
    file: UploadFile = File(...),
    preprocess: bool = True,
    language: str = "eng"
):
    """
    Process uploaded document with OCR

    Args:
        file: Image or PDF file
        preprocess: Apply image preprocessing (default: True)
        language: OCR language (default: eng)

    Returns:
        OCRResponse with extracted text and metadata
    """
    try:
        logger.info(f"📄 Processing OCR for file: {file.filename}")

        # Validate file type
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.pdf', '.tiff')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Supported: PNG, JPG, JPEG, PDF, TIFF"
            )

        # Read file content
        content = await file.read()

        # Process with OCR
        result = await ocr_processor.process_image(
            content,
            filename=file.filename,
            preprocess=preprocess,
            language=language
        )

        logger.info(f"✅ OCR completed for {file.filename}")

        return OCRResponse(
            success=True,
            filename=file.filename,
            text=result["text"],
            confidence=result["confidence"],
            word_count=result["word_count"],
            processing_time=result["processing_time"],
            regions=result.get("regions", []),
            metadata=result.get("metadata", {})
        )

    except Exception as e:
        logger.error(f"❌ OCR processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

# =====================================================
# Data Extraction Endpoint
# =====================================================

@app.post("/api/extract", response_model=ExtractionResponse)
async def extract_data(
    file: UploadFile = File(...),
    document_type: Optional[str] = None
):
    """
    Extract structured data from document

    Args:
        file: Image or PDF file
        document_type: Optional document type hint (invoice, customs, receipt)

    Returns:
        ExtractionResponse with extracted fields
    """
    try:
        logger.info(f"🔍 Extracting data from: {file.filename}")

        # Read file content
        content = await file.read()

        # Step 1: OCR Processing
        ocr_result = await ocr_processor.process_image(
            content,
            filename=file.filename,
            preprocess=True
        )

        # Step 2: Data Extraction
        extracted_data = await data_extractor.extract_fields(
            text=ocr_result["text"],
            document_type=document_type,
            metadata=ocr_result.get("metadata", {})
        )

        logger.info(f"✅ Extraction completed for {file.filename}")

        return ExtractionResponse(
            success=True,
            filename=file.filename,
            document_type=extracted_data["document_type"],
            extracted_fields=extracted_data["fields"],
            confidence_scores=extracted_data["confidence_scores"],
            validation_errors=extracted_data.get("validation_errors", []),
            raw_text=ocr_result["text"]
        )

    except Exception as e:
        logger.error(f"❌ Extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

# =====================================================
# Full Verification Endpoint (OCR + Extract + Verify)
# =====================================================

@app.post("/api/verify", response_model=VerificationResponse)
async def verify_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Complete verification workflow: OCR → Extraction → Verification

    Args:
        file: Image or PDF file
        document_type: Optional document type hint

    Returns:
        VerificationResponse with verification results and risk score
    """
    try:
        logger.info(f"🔬 Starting verification for: {file.filename}")

        # Read file content
        content = await file.read()

        # Step 1: OCR Processing
        logger.info("Step 1/3: OCR Processing")
        ocr_result = await ocr_processor.process_image(
            content,
            filename=file.filename,
            preprocess=True
        )

        # Step 2: Data Extraction
        logger.info("Step 2/3: Data Extraction")
        extracted_data = await data_extractor.extract_fields(
            text=ocr_result["text"],
            document_type=document_type
        )

        # Step 3: Verification
        logger.info("Step 3/3: Verification & Risk Assessment")
        verification_result = await document_verifier.verify(
            extracted_fields=extracted_data["fields"],
            document_type=extracted_data["document_type"],
            ocr_confidence=ocr_result["confidence"]
        )

        logger.info(f"✅ Verification completed. Risk score: {verification_result['risk_score']}")

        return VerificationResponse(
            success=True,
            filename=file.filename,
            document_type=extracted_data["document_type"],
            extracted_fields=extracted_data["fields"],
            verification_status=verification_result["status"],
            risk_score=verification_result["risk_score"],
            risk_level=verification_result["risk_level"],
            anomalies=verification_result["anomalies"],
            verification_details=verification_result["details"],
            recommendations=verification_result["recommendations"],
            ocr_confidence=ocr_result["confidence"]
        )

    except Exception as e:
        logger.error(f"❌ Verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

# =====================================================
# Batch Processing Endpoint
# =====================================================

@app.post("/api/verify/batch")
async def verify_batch(
    files: List[UploadFile] = File(...),
    document_type: Optional[str] = None
):
    """
    Process multiple documents in batch

    Args:
        files: List of image/PDF files
        document_type: Optional document type hint

    Returns:
        List of verification results
    """
    try:
        logger.info(f"📦 Starting batch processing for {len(files)} files")

        results = []
        for file in files:
            try:
                content = await file.read()

                # Process each file
                ocr_result = await ocr_processor.process_image(content, filename=file.filename)
                extracted_data = await data_extractor.extract_fields(
                    text=ocr_result["text"],
                    document_type=document_type
                )
                verification_result = await document_verifier.verify(
                    extracted_fields=extracted_data["fields"],
                    document_type=extracted_data["document_type"],
                    ocr_confidence=ocr_result["confidence"]
                )

                results.append({
                    "filename": file.filename,
                    "success": True,
                    "risk_score": verification_result["risk_score"],
                    "risk_level": verification_result["risk_level"],
                    "extracted_fields": extracted_data["fields"]
                })

            except Exception as e:
                logger.error(f"Failed to process {file.filename}: {str(e)}")
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": str(e)
                })

        logger.info(f"✅ Batch processing completed: {len(results)} files")

        return {
            "success": True,
            "total_files": len(files),
            "processed": len(results),
            "results": results
        }

    except Exception as e:
        logger.error(f"❌ Batch processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

# =====================================================
# Root Endpoint
# =====================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "ZRA TaxGuard OCR AI Service",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "ocr": "/api/ocr/process",
            "extract": "/api/extract",
            "verify": "/api/verify",
            "batch": "/api/verify/batch"
        }
    }

# =====================================================
# Run Server
# =====================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
