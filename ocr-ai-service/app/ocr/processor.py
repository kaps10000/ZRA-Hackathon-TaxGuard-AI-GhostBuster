"""
ZRA TaxGuard OCR AI Service - OCR Processor
Tesseract OCR with OpenCV preprocessing
Dev 1 - AI & OCR Engineer
"""

import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
from typing import Dict, List, Any, Optional
import time
from loguru import logger
import tempfile
import os
from pdf2image import convert_from_bytes

from config.settings import settings


class OCRProcessor:
    """OCR processing with Tesseract and OpenCV"""

    def __init__(self):
        """Initialize OCR processor"""
        self.tesseract_config = f'--psm {settings.OCR_PSM} --dpi {settings.OCR_DPI}'
        logger.info("OCR Processor initialized with Tesseract")

    # =====================================================
    # Image Preprocessing
    # =====================================================

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Apply image preprocessing for better OCR accuracy

        Steps:
        1. Convert to grayscale
        2. Denoise
        3. Resize (if needed)
        4. Adaptive thresholding
        5. Deskew (correct rotation)

        Args:
            image: OpenCV image (numpy array)

        Returns:
            Preprocessed image
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image

            # Denoise
            if settings.PREPROCESSING_DENOISE:
                gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

            # Resize for better OCR (if image is too small)
            if settings.PREPROCESSING_RESIZE:
                height, width = gray.shape
                if height < 1000 or width < 1000:
                    scale = max(1000 / height, 1000 / width)
                    new_width = int(width * scale)
                    new_height = int(height * scale)
                    gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)

            # Adaptive thresholding
            if settings.PREPROCESSING_THRESHOLD:
                gray = cv2.adaptiveThreshold(
                    gray,
                    255,
                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY,
                    11,
                    2
                )

            # Deskew
            coords = np.column_stack(np.where(gray > 0))
            if len(coords) > 0:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle

                # Only deskew if angle is significant
                if abs(angle) > 0.5:
                    (h, w) = gray.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    gray = cv2.warpAffine(
                        gray,
                        M,
                        (w, h),
                        flags=cv2.INTER_CUBIC,
                        borderMode=cv2.BORDER_REPLICATE
                    )

            return gray

        except Exception as e:
            logger.error(f"Preprocessing failed: {str(e)}")
            return image

    # =====================================================
    # PDF Handling
    # =====================================================

    def pdf_to_images(self, pdf_bytes: bytes) -> List[np.ndarray]:
        """
        Convert PDF to images

        Args:
            pdf_bytes: PDF file content

        Returns:
            List of images (one per page)
        """
        try:
            # Convert PDF to PIL images
            pil_images = convert_from_bytes(pdf_bytes, dpi=settings.OCR_DPI)

            # Convert PIL images to OpenCV format
            cv_images = []
            for pil_img in pil_images:
                # Convert PIL to numpy array
                img_array = np.array(pil_img)
                # Convert RGB to BGR (OpenCV format)
                cv_img = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                cv_images.append(cv_img)

            return cv_images

        except Exception as e:
            logger.error(f"PDF conversion failed: {str(e)}")
            raise

    # =====================================================
    # Text Extraction
    # =====================================================

    def extract_text(self, image: np.ndarray, language: str = "eng") -> Dict[str, Any]:
        """
        Extract text from image using Tesseract

        Args:
            image: OpenCV image
            language: OCR language

        Returns:
            Dictionary with text, confidence, and details
        """
        try:
            # Get detailed OCR data
            data = pytesseract.image_to_data(
                image,
                lang=language,
                config=self.tesseract_config,
                output_type=pytesseract.Output.DICT
            )

            # Extract text
            text = pytesseract.image_to_string(
                image,
                lang=language,
                config=self.tesseract_config
            )

            # Calculate confidence
            confidences = [conf for conf in data['conf'] if conf != -1]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            # Extract word count
            words = [word for word in data['text'] if word.strip()]
            word_count = len(words)

            # Extract regions (bounding boxes)
            regions = []
            for i in range(len(data['text'])):
                if data['text'][i].strip():
                    regions.append({
                        'text': data['text'][i],
                        'confidence': data['conf'][i] / 100.0 if data['conf'][i] != -1 else 0,
                        'bbox': [
                            data['left'][i],
                            data['top'][i],
                            data['width'][i],
                            data['height'][i]
                        ]
                    })

            return {
                'text': text.strip(),
                'confidence': avg_confidence / 100.0,
                'word_count': word_count,
                'regions': regions,
                'raw_data': data
            }

        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            raise

    # =====================================================
    # Main Processing Method
    # =====================================================

    async def process_image(
        self,
        file_content: bytes,
        filename: str,
        preprocess: bool = True,
        language: str = "eng"
    ) -> Dict[str, Any]:
        """
        Process image/PDF with OCR

        Args:
            file_content: File bytes
            filename: Original filename
            preprocess: Apply preprocessing
            language: OCR language

        Returns:
            OCR results dictionary
        """
        start_time = time.time()

        try:
            logger.info(f"Processing file: {filename}")

            # Handle PDF files
            if filename.lower().endswith('.pdf'):
                images = self.pdf_to_images(file_content)
                logger.info(f"PDF converted to {len(images)} page(s)")

                # Process each page
                all_text = []
                all_regions = []
                total_confidence = 0
                total_words = 0

                for i, img in enumerate(images):
                    logger.info(f"Processing page {i + 1}/{len(images)}")

                    if preprocess and settings.ENABLE_PREPROCESSING:
                        img = self.preprocess_image(img)

                    result = self.extract_text(img, language)
                    all_text.append(result['text'])
                    all_regions.extend(result['regions'])
                    total_confidence += result['confidence']
                    total_words += result['word_count']

                # Combine results
                combined_text = '\n\n--- Page Break ---\n\n'.join(all_text)
                avg_confidence = total_confidence / len(images)

            else:
                # Handle image files
                # Convert bytes to numpy array
                nparr = np.frombuffer(file_content, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if image is None:
                    raise ValueError("Failed to decode image")

                # Preprocess
                if preprocess and settings.ENABLE_PREPROCESSING:
                    image = self.preprocess_image(image)

                # Extract text
                result = self.extract_text(image, language)
                combined_text = result['text']
                avg_confidence = result['confidence']
                total_words = result['word_count']
                all_regions = result['regions']

            processing_time = time.time() - start_time

            # Build metadata
            metadata = {
                'filename': filename,
                'file_type': 'pdf' if filename.lower().endswith('.pdf') else 'image',
                'preprocessing_enabled': preprocess,
                'language': language,
                'pages': len(images) if filename.lower().endswith('.pdf') else 1
            }

            logger.info(
                f"OCR completed: {total_words} words, "
                f"{avg_confidence:.2%} confidence, "
                f"{processing_time:.2f}s"
            )

            return {
                'text': combined_text,
                'confidence': avg_confidence,
                'word_count': total_words,
                'processing_time': processing_time,
                'regions': all_regions,
                'metadata': metadata
            }

        except Exception as e:
            logger.error(f"OCR processing failed for {filename}: {str(e)}")
            raise

    # =====================================================
    # Google Vision API Integration (Optional)
    # =====================================================

    async def process_with_google_vision(self, file_content: bytes) -> Dict[str, Any]:
        """
        Process with Google Vision API (premium OCR)

        Args:
            file_content: File bytes

        Returns:
            OCR results dictionary
        """
        if not settings.USE_GOOGLE_VISION:
            raise ValueError("Google Vision API is not enabled")

        try:
            from google.cloud import vision

            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=file_content)

            # Perform text detection
            response = client.text_detection(image=image)
            texts = response.text_annotations

            if texts:
                full_text = texts[0].description
                confidence = texts[0].confidence if hasattr(texts[0], 'confidence') else 0.95

                # Extract regions
                regions = []
                for text in texts[1:]:  # Skip first (full text)
                    vertices = [(v.x, v.y) for v in text.bounding_poly.vertices]
                    x_coords = [v[0] for v in vertices]
                    y_coords = [v[1] for v in vertices]

                    regions.append({
                        'text': text.description,
                        'confidence': confidence,
                        'bbox': [
                            min(x_coords),
                            min(y_coords),
                            max(x_coords) - min(x_coords),
                            max(y_coords) - min(y_coords)
                        ]
                    })

                return {
                    'text': full_text,
                    'confidence': confidence,
                    'word_count': len(full_text.split()),
                    'regions': regions,
                    'metadata': {'ocr_engine': 'google_vision'}
                }

            return {
                'text': '',
                'confidence': 0,
                'word_count': 0,
                'regions': [],
                'metadata': {'ocr_engine': 'google_vision'}
            }

        except Exception as e:
            logger.error(f"Google Vision API failed: {str(e)}")
            raise
