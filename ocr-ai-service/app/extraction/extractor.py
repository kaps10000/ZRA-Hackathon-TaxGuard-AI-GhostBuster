"""
ZRA TaxGuard OCR AI Service - Data Extractor
NLP and regex-based field extraction for tax documents
Dev 1 - AI & OCR Engineer
"""

import re
from typing import Dict, List, Any, Optional
import spacy
from datetime import datetime
from loguru import logger
import json

from config.settings import settings


class DataExtractor:
    """Extract structured data from OCR text using NLP and regex"""

    def __init__(self):
        """Initialize data extractor with spaCy model"""
        try:
            self.nlp = spacy.load(settings.SPACY_MODEL)
            logger.info(f"spaCy model loaded: {settings.SPACY_MODEL}")
        except Exception as e:
            logger.warning(f"Failed to load spaCy model: {str(e)}")
            self.nlp = None

        # Compile regex patterns
        self._compile_patterns()

    # =====================================================
    # Regex Pattern Compilation
    # =====================================================

    def _compile_patterns(self):
        """Compile regex patterns for field extraction"""

        # Invoice/Document numbers
        self.invoice_pattern = re.compile(
            r'(?:invoice|inv|receipt|doc|document)\s*(?:no|number|#)?[\s:]*([A-Z0-9\-/]+)',
            re.IGNORECASE
        )

        # HS Codes (Harmonized System codes)
        self.hs_code_pattern = re.compile(
            r'(?:HS|H\.S\.|harmonized)\s*(?:code)?[\s:]*(\d{4,10})',
            re.IGNORECASE
        )

        # Dates (multiple formats)
        self.date_patterns = [
            re.compile(r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b'),  # DD/MM/YYYY
            re.compile(r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b'),  # YYYY-MM-DD
            re.compile(r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b', re.IGNORECASE)
        ]

        # Amounts/Currency
        self.amount_pattern = re.compile(
            r'(?:ZMW|USD|EUR|GBP|ZK|K)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
            re.IGNORECASE
        )

        # Tax identification numbers (TPIN)
        self.tpin_pattern = re.compile(
            r'(?:TPIN|tax\s+id)[\s:]*(\d{10})',
            re.IGNORECASE
        )

        # Company/Business names
        self.company_pattern = re.compile(
            r'(?:company|business|supplier|importer|exporter)[\s:]+([A-Z][A-Za-z\s&.,\-]+(?:Ltd|Limited|Inc|Corp|Co)?)',
            re.IGNORECASE
        )

        # Serial numbers
        self.serial_pattern = re.compile(
            r'(?:serial|s/n)[\s:]*([A-Z0-9\-]+)',
            re.IGNORECASE
        )

        # Phone numbers
        self.phone_pattern = re.compile(
            r'(?:phone|tel|mobile)[\s:]*(\+?\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4})',
            re.IGNORECASE
        )

        # Email addresses
        self.email_pattern = re.compile(
            r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b'
        )

    # =====================================================
    # Document Type Classification
    # =====================================================

    def classify_document_type(self, text: str) -> str:
        """
        Classify document type based on keywords

        Args:
            text: OCR extracted text

        Returns:
            Document type (invoice, customs, receipt, tax_return, etc.)
        """
        text_lower = text.lower()

        # Keywords for different document types
        if any(keyword in text_lower for keyword in ['customs declaration', 'import', 'export', 'tariff', 'duty']):
            return 'customs_declaration'
        elif any(keyword in text_lower for keyword in ['invoice', 'bill', 'payment', 'amount due']):
            return 'invoice'
        elif any(keyword in text_lower for keyword in ['receipt', 'paid', 'transaction']):
            return 'receipt'
        elif any(keyword in text_lower for keyword in ['tax return', 'income tax', 'zra return']):
            return 'tax_return'
        elif any(keyword in text_lower for keyword in ['certificate', 'clearance']):
            return 'certificate'
        else:
            return 'unknown'

    # =====================================================
    # Field Extraction Methods
    # =====================================================

    def extract_invoice_number(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract invoice/document number"""
        match = self.invoice_pattern.search(text)
        if match:
            return {
                'value': match.group(1).strip(),
                'confidence': 0.9
            }
        return None

    def extract_hs_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract HS codes"""
        matches = self.hs_code_pattern.findall(text)
        return [
            {'value': code, 'confidence': 0.85}
            for code in matches
        ]

    def extract_dates(self, text: str) -> List[Dict[str, Any]]:
        """Extract dates from text"""
        dates = []

        for pattern in self.date_patterns:
            for match in pattern.finditer(text):
                try:
                    # Parse date based on pattern
                    if len(match.groups()) == 3:
                        if match.group(2).isalpha():  # Month name format
                            date_str = f"{match.group(1)} {match.group(2)} {match.group(3)}"
                            parsed_date = datetime.strptime(date_str, "%d %b %Y")
                        elif len(match.group(1)) == 4:  # YYYY-MM-DD
                            parsed_date = datetime.strptime(match.group(0), "%Y-%m-%d")
                        else:  # DD/MM/YYYY
                            parsed_date = datetime.strptime(match.group(0), "%d/%m/%Y")

                        dates.append({
                            'value': parsed_date.isoformat(),
                            'original': match.group(0),
                            'confidence': 0.85
                        })
                except ValueError:
                    continue

        return dates

    def extract_amounts(self, text: str) -> List[Dict[str, Any]]:
        """Extract monetary amounts"""
        amounts = []

        for match in self.amount_pattern.finditer(text):
            try:
                # Remove commas and convert to float
                value_str = match.group(1).replace(',', '')
                value = float(value_str)

                # Extract currency if present
                currency = 'ZMW'  # Default to Zambian Kwacha
                full_match = match.group(0).upper()
                if 'USD' in full_match:
                    currency = 'USD'
                elif 'EUR' in full_match:
                    currency = 'EUR'
                elif 'GBP' in full_match:
                    currency = 'GBP'

                amounts.append({
                    'value': value,
                    'currency': currency,
                    'original': match.group(0),
                    'confidence': 0.9
                })
            except ValueError:
                continue

        return amounts

    def extract_tpin(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract Tax Payer Identification Number"""
        match = self.tpin_pattern.search(text)
        if match:
            return {
                'value': match.group(1),
                'confidence': 0.95
            }
        return None

    def extract_companies(self, text: str) -> List[Dict[str, Any]]:
        """Extract company names"""
        companies = []

        for match in self.company_pattern.finditer(text):
            company_name = match.group(1).strip()
            if len(company_name) > 3:  # Filter out too short matches
                companies.append({
                    'value': company_name,
                    'confidence': 0.75
                })

        return companies

    def extract_contact_info(self, text: str) -> Dict[str, Any]:
        """Extract contact information"""
        contact = {}

        # Phone numbers
        phone_match = self.phone_pattern.search(text)
        if phone_match:
            contact['phone'] = {
                'value': phone_match.group(1),
                'confidence': 0.85
            }

        # Email addresses
        email_match = self.email_pattern.search(text)
        if email_match:
            contact['email'] = {
                'value': email_match.group(1),
                'confidence': 0.9
            }

        return contact

    # =====================================================
    # NLP-based Entity Extraction
    # =====================================================

    def extract_entities_nlp(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract named entities using spaCy NLP

        Args:
            text: Input text

        Returns:
            Dictionary of entities by type
        """
        if not self.nlp:
            return {}

        try:
            doc = self.nlp(text)
            entities = {}

            for ent in doc.ents:
                entity_type = ent.label_
                if entity_type not in entities:
                    entities[entity_type] = []

                entities[entity_type].append({
                    'value': ent.text,
                    'confidence': 0.8,
                    'start': ent.start_char,
                    'end': ent.end_char
                })

            return entities

        except Exception as e:
            logger.error(f"NLP entity extraction failed: {str(e)}")
            return {}

    # =====================================================
    # Main Extraction Method
    # =====================================================

    async def extract_fields(
        self,
        text: str,
        document_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Extract structured fields from text

        Args:
            text: OCR extracted text
            document_type: Optional document type hint
            metadata: Optional OCR metadata

        Returns:
            Extracted fields with confidence scores
        """
        try:
            logger.info("Starting field extraction")

            # Auto-detect document type if not provided
            if not document_type:
                document_type = self.classify_document_type(text)
                logger.info(f"Detected document type: {document_type}")

            # Extract all fields
            fields = {}
            confidence_scores = {}
            validation_errors = []

            # Invoice/Document number
            invoice_num = self.extract_invoice_number(text)
            if invoice_num:
                fields['invoice_number'] = invoice_num['value']
                confidence_scores['invoice_number'] = invoice_num['confidence']
            else:
                validation_errors.append("Invoice number not found")

            # HS Codes
            hs_codes = self.extract_hs_codes(text)
            if hs_codes:
                fields['hs_codes'] = [code['value'] for code in hs_codes]
                confidence_scores['hs_codes'] = sum(c['confidence'] for c in hs_codes) / len(hs_codes)

            # Dates
            dates = self.extract_dates(text)
            if dates:
                # Assume first date is document date
                fields['document_date'] = dates[0]['value']
                confidence_scores['document_date'] = dates[0]['confidence']

                if len(dates) > 1:
                    fields['additional_dates'] = [d['value'] for d in dates[1:]]

            # Amounts
            amounts = self.extract_amounts(text)
            if amounts:
                # Find the largest amount (likely the total)
                largest = max(amounts, key=lambda x: x['value'])
                fields['total_amount'] = largest['value']
                fields['currency'] = largest['currency']
                confidence_scores['total_amount'] = largest['confidence']

                if len(amounts) > 1:
                    fields['line_amounts'] = [
                        {'amount': a['value'], 'currency': a['currency']}
                        for a in amounts
                    ]

            # TPIN
            tpin = self.extract_tpin(text)
            if tpin:
                fields['tpin'] = tpin['value']
                confidence_scores['tpin'] = tpin['confidence']

            # Company names
            companies = self.extract_companies(text)
            if companies:
                fields['importer_name'] = companies[0]['value']
                confidence_scores['importer_name'] = companies[0]['confidence']

                if len(companies) > 1:
                    fields['additional_parties'] = [c['value'] for c in companies[1:]]

            # Contact information
            contact = self.extract_contact_info(text)
            if contact:
                fields.update(contact)
                confidence_scores.update({k: v['confidence'] for k, v in contact.items()})

            # NLP entities
            nlp_entities = self.extract_entities_nlp(text)
            if nlp_entities:
                fields['nlp_entities'] = nlp_entities

            # Calculate overall confidence
            if confidence_scores:
                overall_confidence = sum(confidence_scores.values()) / len(confidence_scores)
            else:
                overall_confidence = 0.0

            logger.info(
                f"Extraction completed: {len(fields)} fields extracted, "
                f"{overall_confidence:.2%} confidence"
            )

            return {
                'document_type': document_type,
                'fields': fields,
                'confidence_scores': confidence_scores,
                'validation_errors': validation_errors,
                'overall_confidence': overall_confidence
            }

        except Exception as e:
            logger.error(f"Field extraction failed: {str(e)}")
            raise
