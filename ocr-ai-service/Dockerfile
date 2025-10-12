# =====================================================
# ZRA TaxGuard OCR AI Service - Dockerfile
# =====================================================
# Multi-stage build for optimized image size
# Includes Tesseract OCR, OpenCV, and FastAPI
# =====================================================

FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Tesseract OCR
    tesseract-ocr \
    tesseract-ocr-eng \
    # Image processing libraries
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    # PDF processing
    poppler-utils \
    # File type detection
    libmagic1 \
    # Build tools
    gcc \
    g++ \
    make \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# =====================================================
# Development Stage
# =====================================================
FROM base as development

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads /app/temp

# Expose port
EXPOSE 8000

# Run with hot reload for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# =====================================================
# Production Stage
# =====================================================
FROM base as production

# Copy requirements
COPY requirements.txt .

# Install Python dependencies (optimized)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Copy only necessary application files
COPY main.py .
COPY app/ ./app/
COPY config/ ./config/

# Create necessary directories
RUN mkdir -p /app/uploads /app/temp

# Create non-root user for security
RUN useradd -m -u 1000 ocruser && \
    chown -R ocruser:ocruser /app

# Switch to non-root user
USER ocruser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run with production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
