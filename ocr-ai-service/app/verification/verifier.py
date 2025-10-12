"""
ZRA TaxGuard OCR AI Service - Document Verifier
Risk assessment and anomaly detection for tax documents
Dev 1 - AI & OCR Engineer
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from loguru import logger
import re

from config.settings import settings


class DocumentVerifier:
    """Document verification with risk scoring and anomaly detection"""

    def __init__(self):
        """Initialize document verifier"""
        logger.info("Document Verifier initialized")

    # =====================================================
    # Field Validation
    # =====================================================

    def validate_invoice_number(self, invoice_num: str) -> Dict[str, Any]:
        """Validate invoice number format"""
        checks = {
            'valid': True,
            'issues': [],
            'score': 100
        }

        # Check length
        if len(invoice_num) < 5:
            checks['issues'].append("Invoice number too short")
            checks['score'] -= 20

        # Check for suspicious patterns
        if re.match(r'^0+$', invoice_num):
            checks['issues'].append("Invoice number contains only zeros")
            checks['score'] -= 30
            checks['valid'] = False

        # Check for valid format (alphanumeric with some special chars)
        if not re.match(r'^[A-Z0-9\-/]+$', invoice_num, re.IGNORECASE):
            checks['issues'].append("Invoice number contains invalid characters")
            checks['score'] -= 15

        return checks

    def validate_hs_code(self, hs_code: str) -> Dict[str, Any]:
        """Validate HS code format"""
        checks = {
            'valid': True,
            'issues': [],
            'score': 100
        }

        # HS codes should be 6-10 digits
        if not hs_code.isdigit():
            checks['issues'].append("HS code should be numeric")
            checks['score'] -= 30
            checks['valid'] = False
        elif len(hs_code) < 6 or len(hs_code) > 10:
            checks['issues'].append(f"HS code length invalid ({len(hs_code)} digits)")
            checks['score'] -= 20

        return checks

    def validate_date(self, date_str: str) -> Dict[str, Any]:
        """Validate date field"""
        checks = {
            'valid': True,
            'issues': [],
            'score': 100
        }

        try:
            # Parse ISO format date
            doc_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            now = datetime.now()

            # Check if date is in future
            if doc_date > now:
                checks['issues'].append("Document date is in the future")
                checks['score'] -= 40
                checks['valid'] = False

            # Check if date is too old (> 5 years)
            five_years_ago = now - timedelta(days=365 * 5)
            if doc_date < five_years_ago:
                checks['issues'].append("Document date is more than 5 years old")
                checks['score'] -= 20

        except Exception as e:
            checks['issues'].append(f"Invalid date format: {str(e)}")
            checks['score'] = 0
            checks['valid'] = False

        return checks

    def validate_amount(self, amount: float, currency: str) -> Dict[str, Any]:
        """Validate monetary amount"""
        checks = {
            'valid': True,
            'issues': [],
            'score': 100
        }

        # Check for negative or zero amounts
        if amount <= 0:
            checks['issues'].append("Amount must be positive")
            checks['score'] -= 40
            checks['valid'] = False

        # Check for suspiciously large amounts (> 10 million)
        if amount > 10_000_000:
            checks['issues'].append("Amount is unusually large")
            checks['score'] -= 30

        # Check for suspiciously round numbers (might be fake)
        if amount % 1000 == 0 and amount > 10000:
            checks['issues'].append("Amount is suspiciously round")
            checks['score'] -= 10

        # Validate currency
        valid_currencies = ['ZMW', 'USD', 'EUR', 'GBP']
        if currency not in valid_currencies:
            checks['issues'].append(f"Invalid currency: {currency}")
            checks['score'] -= 20

        return checks

    def validate_tpin(self, tpin: str) -> Dict[str, Any]:
        """Validate TPIN format"""
        checks = {
            'valid': True,
            'issues': [],
            'score': 100
        }

        # TPIN should be 10 digits
        if not tpin.isdigit():
            checks['issues'].append("TPIN should be numeric")
            checks['score'] -= 40
            checks['valid'] = False
        elif len(tpin) != 10:
            checks['issues'].append(f"TPIN should be 10 digits (got {len(tpin)})")
            checks['score'] -= 30
            checks['valid'] = False

        # Check for sequential or repeated digits
        if re.match(r'^(\d)\1+$', tpin):
            checks['issues'].append("TPIN contains only repeated digits")
            checks['score'] -= 50
            checks['valid'] = False

        return checks

    # =====================================================
    # Anomaly Detection
    # =====================================================

    def detect_anomalies(
        self,
        extracted_fields: Dict[str, Any],
        document_type: str,
        ocr_confidence: float
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalies in extracted data

        Returns:
            List of anomalies with severity levels
        """
        anomalies = []

        # Check OCR confidence
        if ocr_confidence < 0.7:
            anomalies.append({
                'type': 'low_ocr_confidence',
                'severity': 'HIGH',
                'description': f"OCR confidence is low ({ocr_confidence:.2%})",
                'field': None,
                'details': {'confidence': ocr_confidence}
            })

        # Check for missing critical fields
        critical_fields = ['invoice_number', 'document_date']
        for field in critical_fields:
            if field not in extracted_fields or not extracted_fields[field]:
                anomalies.append({
                    'type': 'missing_critical_field',
                    'severity': 'HIGH',
                    'description': f"Missing critical field: {field}",
                    'field': field,
                    'details': {}
                })

        # Check for missing amounts in invoices
        if document_type in ['invoice', 'customs_declaration']:
            if 'total_amount' not in extracted_fields:
                anomalies.append({
                    'type': 'missing_amount',
                    'severity': 'MEDIUM',
                    'description': "Total amount not found in invoice",
                    'field': 'total_amount',
                    'details': {}
                })

        # Check for missing HS codes in customs declarations
        if document_type == 'customs_declaration':
            if 'hs_codes' not in extracted_fields or not extracted_fields['hs_codes']:
                anomalies.append({
                    'type': 'missing_hs_codes',
                    'severity': 'HIGH',
                    'description': "HS codes not found in customs declaration",
                    'field': 'hs_codes',
                    'details': {}
                })

        # Check for missing TPIN
        if 'tpin' not in extracted_fields:
            anomalies.append({
                'type': 'missing_tpin',
                'severity': 'MEDIUM',
                'description': "Tax Payer Identification Number (TPIN) not found",
                'field': 'tpin',
                'details': {}
            })

        # Check for inconsistent data
        if 'currency' in extracted_fields and 'total_amount' in extracted_fields:
            if extracted_fields['currency'] not in ['ZMW', 'USD', 'EUR', 'GBP']:
                anomalies.append({
                    'type': 'invalid_currency',
                    'severity': 'MEDIUM',
                    'description': f"Unrecognized currency: {extracted_fields['currency']}",
                    'field': 'currency',
                    'details': {'currency': extracted_fields['currency']}
                })

        return anomalies

    # =====================================================
    # Risk Scoring
    # =====================================================

    def calculate_risk_score(
        self,
        extracted_fields: Dict[str, Any],
        validation_results: Dict[str, Dict[str, Any]],
        anomalies: List[Dict[str, Any]],
        ocr_confidence: float
    ) -> float:
        """
        Calculate risk score (0-100, higher is better)

        Factors:
        - OCR confidence
        - Field validation results
        - Number and severity of anomalies
        - Completeness of data
        """
        score = 100.0

        # OCR confidence factor (max -20 points)
        if ocr_confidence < 0.9:
            score -= (0.9 - ocr_confidence) * 40

        # Validation results factor
        for field, result in validation_results.items():
            if not result['valid']:
                score -= 10
            else:
                # Deduct proportional to validation score
                score -= (100 - result['score']) * 0.1

        # Anomalies factor
        for anomaly in anomalies:
            if anomaly['severity'] == 'CRITICAL':
                score -= 25
            elif anomaly['severity'] == 'HIGH':
                score -= 15
            elif anomaly['severity'] == 'MEDIUM':
                score -= 8
            elif anomaly['severity'] == 'LOW':
                score -= 3

        # Completeness factor
        expected_fields = ['invoice_number', 'document_date', 'total_amount', 'importer_name']
        found_fields = sum(1 for field in expected_fields if field in extracted_fields)
        completeness = found_fields / len(expected_fields)
        if completeness < 0.75:
            score -= (0.75 - completeness) * 40

        # Ensure score is in valid range
        score = max(0, min(100, score))

        return score

    def determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from score"""
        if risk_score >= settings.RISK_LOW_THRESHOLD:
            return "LOW"
        elif risk_score >= settings.RISK_MEDIUM_THRESHOLD:
            return "MEDIUM"
        elif risk_score >= settings.RISK_HIGH_THRESHOLD:
            return "HIGH"
        else:
            return "CRITICAL"

    def determine_verification_status(self, risk_level: str) -> str:
        """Determine verification status from risk level"""
        if risk_level == "LOW":
            return "VERIFIED"
        elif risk_level == "MEDIUM":
            return "FLAGGED"
        else:
            return "REJECTED"

    # =====================================================
    # Recommendations
    # =====================================================

    def generate_recommendations(
        self,
        risk_level: str,
        anomalies: List[Dict[str, Any]],
        validation_results: Dict[str, Dict[str, Any]]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        if risk_level == "CRITICAL":
            recommendations.append("⛔ REJECT: Document has critical issues and should not be processed")
            recommendations.append("Requires manual review by senior officer")

        elif risk_level == "HIGH":
            recommendations.append("⚠️ FLAG: Document requires thorough manual verification")
            recommendations.append("Verify with original paper documents")

        elif risk_level == "MEDIUM":
            recommendations.append("⚡ REVIEW: Document should be reviewed before approval")

        else:
            recommendations.append("✅ APPROVE: Document appears legitimate")

        # Specific recommendations based on anomalies
        for anomaly in anomalies:
            if anomaly['type'] == 'low_ocr_confidence':
                recommendations.append("Consider requesting clearer scan or photo")

            elif anomaly['type'] == 'missing_critical_field':
                recommendations.append(f"Request document with visible {anomaly['field']}")

            elif anomaly['type'] == 'missing_hs_codes':
                recommendations.append("Verify HS codes with importer or customs broker")

            elif anomaly['type'] == 'missing_tpin':
                recommendations.append("Verify TPIN in ZRA taxpayer database")

        # Recommendations based on validation failures
        for field, result in validation_results.items():
            if not result['valid']:
                recommendations.append(f"Investigate {field}: {', '.join(result['issues'])}")

        return recommendations

    # =====================================================
    # Main Verification Method
    # =====================================================

    async def verify(
        self,
        extracted_fields: Dict[str, Any],
        document_type: str,
        ocr_confidence: float
    ) -> Dict[str, Any]:
        """
        Perform comprehensive document verification

        Args:
            extracted_fields: Fields extracted from document
            document_type: Type of document
            ocr_confidence: OCR confidence score

        Returns:
            Verification results with risk assessment
        """
        try:
            logger.info(f"Starting verification for {document_type}")

            # Perform field validations
            validation_results = {}
            checks_performed = []
            passed_checks = []
            failed_checks = []

            # Validate invoice number
            if 'invoice_number' in extracted_fields:
                checks_performed.append("Invoice number validation")
                result = self.validate_invoice_number(extracted_fields['invoice_number'])
                validation_results['invoice_number'] = result
                if result['valid']:
                    passed_checks.append("Invoice number format")
                else:
                    failed_checks.append("Invoice number format")

            # Validate HS codes
            if 'hs_codes' in extracted_fields:
                checks_performed.append("HS code validation")
                for hs_code in extracted_fields['hs_codes']:
                    result = self.validate_hs_code(hs_code)
                    if result['valid']:
                        passed_checks.append(f"HS code {hs_code}")
                    else:
                        failed_checks.append(f"HS code {hs_code}")

            # Validate date
            if 'document_date' in extracted_fields:
                checks_performed.append("Date validation")
                result = self.validate_date(extracted_fields['document_date'])
                validation_results['document_date'] = result
                if result['valid']:
                    passed_checks.append("Document date")
                else:
                    failed_checks.append("Document date")

            # Validate amount
            if 'total_amount' in extracted_fields:
                checks_performed.append("Amount validation")
                result = self.validate_amount(
                    extracted_fields['total_amount'],
                    extracted_fields.get('currency', 'ZMW')
                )
                validation_results['total_amount'] = result
                if result['valid']:
                    passed_checks.append("Total amount")
                else:
                    failed_checks.append("Total amount")

            # Validate TPIN
            if 'tpin' in extracted_fields:
                checks_performed.append("TPIN validation")
                result = self.validate_tpin(extracted_fields['tpin'])
                validation_results['tpin'] = result
                if result['valid']:
                    passed_checks.append("TPIN format")
                else:
                    failed_checks.append("TPIN format")

            # Detect anomalies
            checks_performed.append("Anomaly detection")
            anomalies = self.detect_anomalies(extracted_fields, document_type, ocr_confidence)

            # Calculate risk score
            risk_score = self.calculate_risk_score(
                extracted_fields,
                validation_results,
                anomalies,
                ocr_confidence
            )

            # Determine risk level and status
            risk_level = self.determine_risk_level(risk_score)
            status = self.determine_verification_status(risk_level)

            # Generate recommendations
            recommendations = self.generate_recommendations(
                risk_level,
                anomalies,
                validation_results
            )

            # Build verification details
            details = {
                'checks_performed': checks_performed,
                'passed_checks': passed_checks,
                'failed_checks': failed_checks,
                'warnings': [
                    issue
                    for result in validation_results.values()
                    for issue in result.get('issues', [])
                ]
            }

            logger.info(
                f"Verification completed: {status}, "
                f"risk score: {risk_score:.1f}, "
                f"risk level: {risk_level}"
            )

            return {
                'status': status,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'anomalies': anomalies,
                'details': details,
                'recommendations': recommendations
            }

        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            raise
