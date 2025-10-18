"""
GhostBuster Detection Module
Detects phantom employees and ghost companies using pattern analysis
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Optional

class PhantomDetector:
    """Detects phantom employees and ghost companies"""
    
    def __init__(self):
        # Mock registries (in production, these would be API calls)
        self.pacra_registry = self._load_mock_pacra()
        self.nrc_registry = self._load_mock_nrc()
        self.napsa_registry = self._load_mock_napsa()
    
    def _load_mock_pacra(self) -> Dict:
        """Load mock PACRA (company) registry"""
        return {
            "1001": {"name": "Legit Company Ltd", "status": "active", "registered": "2020-01-15"},
            "1002": {"name": "Real Business Inc", "status": "active", "registered": "2019-05-20"},
            # Ghost companies won't be in this registry
        }
    
    def _load_mock_nrc(self) -> Dict:
        """Load mock NRC (national registration) database"""
        return {
            "NRC123456": {"name": "John Doe", "status": "valid", "dob": "1985-03-15"},
            "NRC789012": {"name": "Jane Smith", "status": "valid", "dob": "1990-07-22"},
            # Phantom employees may have invalid or duplicate NRCs
        }
    
    def _load_mock_napsa(self) -> Dict:
        """Load mock NAPSA (social security) contributions"""
        return {
            "NRC123456": {"employer": "1001", "contributions": 24, "last_contribution": "2025-09"},
            "NRC789012": {"employer": "1002", "contributions": 18, "last_contribution": "2025-09"},
            # Phantom employees won't have NAPSA contributions
        }
    
    def detect_ghost_company(self, company_data: Dict) -> Dict:
        """
        Detect if a company is a ghost company
        
        Args:
            company_data: {
                "tin": "123456789",
                "name": "ABC Trading Ltd",
                "address": "123 Fake St",
                "phone": "+260123456789",
                "bank_account": "1234567890"
            }
        
        Returns:
            Detection result with risk score and evidence
        """
        tin = company_data.get("tin")
        name = company_data.get("name", "")
        address = company_data.get("address", "")
        
        risk_score = 0
        flags = []
        evidence = []
        
        # Check 1: Not in PACRA registry
        if tin not in self.pacra_registry:
            risk_score += 40
            flags.append("NOT_IN_PACRA")
            evidence.append(f"Company TIN {tin} not found in PACRA registry")
        
        # Check 2: Suspicious company name patterns
        ghost_patterns = [r'.*phantom.*', r'.*ghost.*', r'.*shell.*', r'.*fake.*']
        for pattern in ghost_patterns:
            if re.match(pattern, name.lower()):
                risk_score += 20
                flags.append("SUSPICIOUS_NAME")
                evidence.append(f"Company name '{name}' matches suspicious pattern")
                break
        
        # Check 3: Suspicious address (residential, PO Box only)
        if 'p.o. box' in address.lower() or 'po box' in address.lower():
            risk_score += 15
            flags.append("PO_BOX_ONLY")
            evidence.append("Company address is PO Box only (no physical address)")
        
        # Check 4: No business license/NRC
        has_license = tin in self.nrc_registry  # Simplified check
        if not has_license:
            risk_score += 15
            flags.append("NO_BUSINESS_LICENSE")
            evidence.append("No business license found")
        
        # Determine classification
        if risk_score >= 70:
            classification = "GHOST_COMPANY"
            severity = "CRITICAL"
        elif risk_score >= 50:
            classification = "SUSPICIOUS_COMPANY"
            severity = "HIGH"
        elif risk_score >= 30:
            classification = "REVIEW_REQUIRED"
            severity = "MEDIUM"
        else:
            classification = "LEGITIMATE"
            severity = "LOW"
        
        return {
            "entity_type": "company",
            "entity_id": tin,
            "entity_name": name,
            "classification": classification,
            "risk_score": min(risk_score, 100),
            "severity": severity,
            "flags": flags,
            "evidence": evidence,
            "timestamp": datetime.now().isoformat(),
            "details": company_data
        }
    
    def detect_phantom_employee(self, employee_data: Dict) -> Dict:
        """
        Detect if an employee is phantom (fake/duplicate)
        
        Args:
            employee_data: {
                "nrc": "NRC123456",
                "name": "John Doe",
                "employer_tin": "1001",
                "salary": 5000,
                "bank_account": "9876543210"
            }
        
        Returns:
            Detection result with risk score and evidence
        """
        nrc = employee_data.get("nrc")
        name = employee_data.get("name", "")
        employer_tin = employee_data.get("employer_tin")
        
        risk_score = 0
        flags = []
        evidence = []
        
        # Check 1: NRC not in registry or invalid
        if nrc not in self.nrc_registry:
            risk_score += 35
            flags.append("INVALID_NRC")
            evidence.append(f"NRC {nrc} not found in national registry")
        
        # Check 2: No NAPSA contributions
        if nrc not in self.napsa_registry:
            risk_score += 30
            flags.append("NO_NAPSA")
            evidence.append(f"No NAPSA contributions found for NRC {nrc}")
        
        # Check 3: Multiple employers (phantom pattern)
        # In real implementation, check if same NRC appears in multiple payrolls
        if nrc in self.napsa_registry:
            napsa_employer = self.napsa_registry[nrc].get("employer")
            if napsa_employer != employer_tin:
                risk_score += 25
                flags.append("MULTIPLE_EMPLOYERS")
                evidence.append(f"NRC {nrc} appears on multiple employer payrolls")
        
        # Check 4: Suspicious name patterns
        phantom_patterns = [r'.*test.*', r'.*dummy.*', r'.*fake.*', r'.*ghost.*']
        for pattern in phantom_patterns:
            if re.match(pattern, name.lower()):
                risk_score += 20
                flags.append("SUSPICIOUS_NAME")
                evidence.append(f"Employee name '{name}' matches suspicious pattern")
                break
        
        # Determine classification
        if risk_score >= 70:
            classification = "PHANTOM_EMPLOYEE"
            severity = "CRITICAL"
        elif risk_score >= 50:
            classification = "SUSPICIOUS_EMPLOYEE"
            severity = "HIGH"
        elif risk_score >= 30:
            classification = "REVIEW_REQUIRED"
            severity = "MEDIUM"
        else:
            classification = "LEGITIMATE"
            severity = "LOW"
        
        return {
            "entity_type": "employee",
            "entity_id": nrc,
            "entity_name": name,
            "classification": classification,
            "risk_score": min(risk_score, 100),
            "severity": severity,
            "flags": flags,
            "evidence": evidence,
            "timestamp": datetime.now().isoformat(),
            "details": employee_data
        }
    
    def analyze_network(self, entities: List[Dict]) -> Dict:
        """
        Analyze relationships between entities to find networks of ghost companies/phantom employees
        
        Args:
            entities: List of companies and employees to analyze
        
        Returns:
            Network analysis with connected entities
        """
        # Group by common attributes
        by_address = {}
        by_phone = {}
        by_bank_account = {}
        
        for entity in entities:
            # Group by address
            address = entity.get("address")
            if address:
                if address not in by_address:
                    by_address[address] = []
                by_address[address].append(entity)
            
            # Group by phone
            phone = entity.get("phone")
            if phone:
                if phone not in by_phone:
                    by_phone[phone] = []
                by_phone[phone].append(entity)
            
            # Group by bank account
            bank_account = entity.get("bank_account")
            if bank_account:
                if bank_account not in by_bank_account:
                    by_bank_account[bank_account] = []
                by_bank_account[bank_account].append(entity)
        
        # Find suspicious networks (multiple entities sharing attributes)
        suspicious_networks = []
        
        for address, entities_list in by_address.items():
            if len(entities_list) > 1:
                suspicious_networks.append({
                    "type": "shared_address",
                    "attribute": address,
                    "entity_count": len(entities_list),
                    "entities": [e.get("name") or e.get("tin") or e.get("nrc") for e in entities_list]
                })
        
        for phone, entities_list in by_phone.items():
            if len(entities_list) > 1:
                suspicious_networks.append({
                    "type": "shared_phone",
                    "attribute": phone,
                    "entity_count": len(entities_list),
                    "entities": [e.get("name") or e.get("tin") or e.get("nrc") for e in entities_list]
                })
        
        for account, entities_list in by_bank_account.items():
            if len(entities_list) > 1:
                suspicious_networks.append({
                    "type": "shared_bank_account",
                    "attribute": account,
                    "entity_count": len(entities_list),
                    "entities": [e.get("name") or e.get("tin") or e.get("nrc") for e in entities_list]
                })
        
        return {
            "total_entities": len(entities),
            "suspicious_networks": suspicious_networks,
            "network_count": len(suspicious_networks),
            "timestamp": datetime.now().isoformat()
        }

# Example usage
if __name__ == "__main__":
    detector = PhantomDetector()
    
    # Test ghost company detection
    ghost_company = {
        "tin": "999999",  # Not in PACRA registry
        "name": "Ghost Trading Ltd",
        "address": "P.O. Box 12345",
        "phone": "+260123456789",
        "bank_account": "1234567890"
    }
    
    result = detector.detect_ghost_company(ghost_company)
    print("Ghost Company Detection:")
    print(json.dumps(result, indent=2))
    
    # Test phantom employee detection
    phantom_employee = {
        "nrc": "NRC999999",  # Not in NRC registry
        "name": "Fake Employee",
        "employer_tin": "999999",
        "salary": 5000,
        "bank_account": "9876543210"
    }
    
    result = detector.detect_phantom_employee(phantom_employee)
    print("\nPhantom Employee Detection:")
    print(json.dumps(result, indent=2))
