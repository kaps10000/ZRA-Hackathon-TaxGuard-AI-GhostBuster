"""
GhostBuster Detection Engine
Core detection logic for identifying ghost employees using multi-source analysis
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json
import os

class GhostBusterEngine:
    def __init__(self):
        """Initialize the detection engine with datasets"""
        self.napsa_df = None
        self.home_affairs_df = None
        self.bank_df = None
        self.master_df = None
        
        # Set base directory to the backend folder
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.base_dir, 'data')

        # Thresholds
        self.RETIREMENT_AGE = 65
        self.MIN_NAPSA_CONTRIBUTIONS = 12
        self.EXACT_WITHDRAWAL_THRESHOLD = 0.98  # 98% match to salary
        self.IMMEDIATE_WITHDRAWAL_DAYS = 3

        # Shell companies list
        self.SHELL_COMPANIES = [
            'ABC Trading Ltd', 'Universal Services', 'Crown Investments',
            'Eagle Enterprises', 'Phoenix Holdings', 'Summit Solutions',
            'Global Ventures Ltd', 'Apex Business Group', 'Trinity Trading'
        ]

    def load_datasets(self):
        """Load all datasets"""
        try:
            print(f"Loading datasets from: {self.data_dir}")
            napsa_path = os.path.join(self.data_dir, 'napsa_contributions.csv')
            home_affairs_path = os.path.join(self.data_dir, 'home_affairs_registry.csv')
            bank_path = os.path.join(self.data_dir, 'bank_transactions.csv')
            master_path = os.path.join(self.data_dir, 'master_records.csv')
            
            print(f"Loading NAPSA contributions from {napsa_path}")
            # Load NAPSA with memory optimization
            self.napsa_df = pd.read_csv(napsa_path, parse_dates=['contribution_date'],
                                      dtype={'napsa_number': 'str', 'nrc': 'str', 'employer': 'str',
                                            'employee_contribution': 'float32', 'employer_contribution': 'float32',
                                            'total_contribution': 'float32'})
            print(f"[OK] Loaded {len(self.napsa_df):,} NAPSA records")
            
            print(f"Loading Home Affairs registry from {home_affairs_path}")
            self.home_affairs_df = pd.read_csv(home_affairs_path, parse_dates=['date_of_birth', 'death_date'])
            print(f"[OK] Loaded {len(self.home_affairs_df)} Home Affairs records")
            
            print(f"Loading bank transactions from {bank_path}")
            # Load bank transactions with memory optimization
            # Use efficient dtypes to reduce memory usage for 3M+ records
            self.bank_df = pd.read_csv(bank_path,
                                      parse_dates=['transaction_date'],
                                      dtype={'account_number': 'str',
                                            'nrc': 'str',
                                            'amount': 'float32',
                                            'transaction_type': 'str',
                                            'description': 'str'})
            print(f"[OK] Loaded {len(self.bank_df):,} bank transaction records")
            
            print(f"Loading master records from {master_path}")
            self.master_df = pd.read_csv(master_path, parse_dates=['date_of_birth', 'employment_start_date', 'death_date'])
            print(f"[OK] Loaded {len(self.master_df)} master records")
            
            return True
        except Exception as e:
            print(f"[ERROR] Error loading datasets: {e}")
            import traceback
            traceback.print_exc()
            return False

    def calculate_age(self, date_of_birth):
        """Calculate age from date of birth"""
        if pd.isna(date_of_birth):
            return None
        today = datetime.now()
        dob = pd.to_datetime(date_of_birth)
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age

    def check_napsa_contributions(self, nrc: str, employment_start: datetime) -> Dict:
        """Check NAPSA contributions for an NRC"""
        napsa_records = self.napsa_df[self.napsa_df['nrc'] == nrc]

        contribution_count = len(napsa_records)
        total_contributed = napsa_records['total_contribution'].sum() if len(napsa_records) > 0 else 0

        # Calculate expected contributions
        months_employed = ((datetime.now().year - employment_start.year) * 12 +
                          (datetime.now().month - employment_start.month))

        red_flag = None
        severity = None

        if contribution_count == 0:
            red_flag = "NO_NAPSA_RECORD"
            severity = "CRITICAL"
        elif contribution_count < self.MIN_NAPSA_CONTRIBUTIONS:
            red_flag = "LOW_CONTRIBUTIONS"
            severity = "HIGH"
        elif contribution_count < months_employed * 0.5:
            red_flag = "INSUFFICIENT_CONTRIBUTIONS"
            severity = "MEDIUM"

        return {
            'found': contribution_count > 0,
            'contribution_count': int(contribution_count),
            'total_contributed': float(total_contributed),
            'expected_contributions': int(months_employed),
            'red_flag': red_flag,
            'severity': severity
        }

    def check_home_affairs(self, nrc: str) -> Dict:
        """Check Home Affairs death registry"""
        records = self.home_affairs_df[self.home_affairs_df['nrc'] == nrc]

        if len(records) == 0:
            return {
                'found': False,
                'status': None,
                'death_date': None,
                'red_flag': 'INVALID_NRC',
                'severity': 'CRITICAL'
            }

        record = records.iloc[0]

        red_flag = None
        severity = None

        if record['status'] == 'DECEASED':
            red_flag = 'DECEASED'
            severity = 'CRITICAL'

        return {
            'found': True,
            'status': record['status'],
            'death_date': str(record['death_date']) if pd.notna(record['death_date']) else None,
            'date_of_birth': str(record['date_of_birth']) if pd.notna(record['date_of_birth']) else None,
            'red_flag': red_flag,
            'severity': severity
        }

    def check_duplicate_nrc(self, nrc: str) -> Dict:
        """Check for duplicate NRC usage"""
        # Check across all datasets for same NRC with different names
        napsa_names = self.napsa_df[self.napsa_df['nrc'] == nrc]['full_name'].unique()
        home_affairs_names = self.home_affairs_df[self.home_affairs_df['nrc'] == nrc]['full_name'].unique()

        all_names = list(set(list(napsa_names) + list(home_affairs_names)))

        is_duplicate = len(all_names) > 1

        return {
            'is_duplicate': is_duplicate,
            'names_found': all_names,
            'red_flag': 'DUPLICATE_NRC' if is_duplicate else None,
            'severity': 'CRITICAL' if is_duplicate else None
        }

    def analyze_withdrawal_patterns(self, nrc: str, salary: float) -> Dict:
        """Analyze bank withdrawal patterns for suspicious activity"""
        transactions = self.bank_df[self.bank_df['nrc'] == nrc].copy()

        if len(transactions) == 0:
            return {
                'transaction_count': 0,
                'pattern': 'NO_DATA',
                'red_flags': []
            }

        # Sort by date
        transactions = transactions.sort_values('transaction_date')

        # Analyze withdrawals
        withdrawals = transactions[transactions['amount'] < 0].copy()
        withdrawals['amount'] = withdrawals['amount'].abs()

        # Detect exact salary withdrawals
        exact_salary_withdrawals = withdrawals[
            (withdrawals['amount'] >= salary * self.EXACT_WITHDRAWAL_THRESHOLD) &
            (withdrawals['amount'] <= salary)
        ]

        # Detect immediate withdrawals (within 3 days of month start)
        withdrawals['day_of_month'] = withdrawals['transaction_date'].dt.day
        immediate_withdrawals = withdrawals[withdrawals['day_of_month'] <= self.IMMEDIATE_WITHDRAWAL_DAYS]

        # Detect shell company transfers
        shell_transfers = withdrawals[withdrawals['recipient'].isin(self.SHELL_COMPANIES)]

        # Calculate average balance after withdrawals
        avg_balance = withdrawals['balance_after'].mean() if len(withdrawals) > 0 else 0

        # Identify red flags
        red_flags = []

        if len(exact_salary_withdrawals) >= 3:
            red_flags.append({
                'flag': 'EXACT_SALARY_WITHDRAWALS',
                'severity': 'CRITICAL',
                'count': int(len(exact_salary_withdrawals)),
                'description': f'Found {len(exact_salary_withdrawals)} withdrawals of exactly K{salary:,.2f}'
            })

        if len(immediate_withdrawals) >= 5:
            red_flags.append({
                'flag': 'IMMEDIATE_WITHDRAWALS',
                'severity': 'CRITICAL',
                'count': int(len(immediate_withdrawals)),
                'description': f'Found {len(immediate_withdrawals)} withdrawals within 3 days of month start'
            })

        if len(shell_transfers) > 0:
            shell_companies = shell_transfers['recipient'].unique()
            red_flags.append({
                'flag': 'SHELL_COMPANY_TRANSFERS',
                'severity': 'CRITICAL',
                'count': int(len(shell_transfers)),
                'companies': list(shell_companies),
                'description': f'Found {len(shell_transfers)} transfers to suspected shell companies'
            })

        if avg_balance < 100 and len(withdrawals) > 5:
            red_flags.append({
                'flag': 'LOW_BALANCE',
                'severity': 'HIGH',
                'average_balance': float(avg_balance),
                'description': f'Average balance after withdrawals: K{avg_balance:.2f}'
            })

        # Determine pattern
        pattern = 'NORMAL'
        if len(red_flags) >= 2:
            pattern = 'HIGHLY_SUSPICIOUS'
        elif len(red_flags) == 1:
            pattern = 'SUSPICIOUS'

        return {
            'transaction_count': int(len(transactions)),
            'withdrawal_count': int(len(withdrawals)),
            'exact_salary_withdrawals': int(len(exact_salary_withdrawals)),
            'immediate_withdrawals': int(len(immediate_withdrawals)),
            'shell_company_transfers': int(len(shell_transfers)),
            'avg_balance_after': float(avg_balance),
            'pattern': pattern,
            'red_flags': red_flags
        }

    def analyze_employee(self, nrc: str, full_name: str = None, salary: float = None,
                        employment_start: datetime = None) -> Dict:
        """
        Comprehensive analysis of a single employee
        Returns detailed evidence-based report
        """
        evidence_list = []
        red_flags_summary = []

        # Try to find employee in master records if details not provided
        if salary is None or employment_start is None:
            master_record = self.master_df[self.master_df['nrc'] == nrc]
            if len(master_record) > 0:
                record = master_record.iloc[0]
                full_name = full_name or record['full_name']
                salary = salary or record['salary']
                employment_start = employment_start or pd.to_datetime(record['employment_start_date'])

        if salary is None or employment_start is None:
            return {
                'error': 'Employee not found in system',
                'nrc': nrc
            }

        # 1. Check NAPSA
        napsa_result = self.check_napsa_contributions(nrc, employment_start)
        if napsa_result['red_flag']:
            evidence = {
                'source': 'NAPSA Database',
                'severity': napsa_result['severity'],
                'finding': napsa_result['red_flag'].replace('_', ' ').title(),
                'details': f"Found {napsa_result['contribution_count']} contributions. Expected: {napsa_result['expected_contributions']}. " +
                          f"Legitimate workers should have regular monthly contributions.",
                'evidence_strength': 'STRONG' if napsa_result['contribution_count'] == 0 else 'MODERATE'
            }
            evidence_list.append(evidence)
            red_flags_summary.append(napsa_result['red_flag'])

        # 2. Check Home Affairs
        home_affairs_result = self.check_home_affairs(nrc)
        if home_affairs_result['red_flag']:
            if home_affairs_result['red_flag'] == 'DECEASED':
                evidence = {
                    'source': 'Home Affairs (Death Registry)',
                    'severity': 'CRITICAL',
                    'finding': 'Person is Deceased',
                    'details': f"CRITICAL: This person died on {home_affairs_result['death_date']} but is still receiving salary. " +
                              "This is definitive proof of a ghost worker.",
                    'evidence_strength': 'DEFINITIVE'
                }
            else:
                evidence = {
                    'source': 'Home Affairs (NRC Registry)',
                    'severity': 'CRITICAL',
                    'finding': 'Invalid NRC',
                    'details': "NRC not found in national registry. This could indicate a fake or invalid NRC.",
                    'evidence_strength': 'DEFINITIVE'
                }
            evidence_list.append(evidence)
            red_flags_summary.append(home_affairs_result['red_flag'])

        # 3. Check for age (retirement)
        age = None
        if home_affairs_result['found'] and home_affairs_result['date_of_birth']:
            age = self.calculate_age(home_affairs_result['date_of_birth'])
            if age and age > self.RETIREMENT_AGE:
                evidence = {
                    'source': 'Age Verification',
                    'severity': 'HIGH',
                    'finding': 'Over Retirement Age',
                    'details': f"Employee is {age} years old, which is above the retirement age of {self.RETIREMENT_AGE}. " +
                              "Should not be receiving salary.",
                    'evidence_strength': 'STRONG'
                }
                evidence_list.append(evidence)
                red_flags_summary.append('OVER_RETIREMENT_AGE')

        # 4. Check for duplicate NRC
        duplicate_result = self.check_duplicate_nrc(nrc)
        if duplicate_result['is_duplicate']:
            evidence = {
                'source': 'Duplicate NRC Check',
                'severity': 'CRITICAL',
                'finding': 'Duplicate NRC',
                'details': f"This NRC is registered to multiple names: {', '.join(duplicate_result['names_found'])}. " +
                          "This indicates identity theft or fraud.",
                'evidence_strength': 'DEFINITIVE'
            }
            evidence_list.append(evidence)
            red_flags_summary.append('DUPLICATE_NRC')

        # 5. Analyze bank withdrawal patterns
        withdrawal_result = self.analyze_withdrawal_patterns(nrc, salary)
        for flag in withdrawal_result['red_flags']:
            evidence = {
                'source': 'Bank Transaction Analysis',
                'severity': flag['severity'],
                'finding': flag['flag'].replace('_', ' ').title(),
                'details': flag['description'],
                'evidence_strength': 'STRONG'
            }
            if 'companies' in flag:
                evidence['shell_companies'] = flag['companies']
            evidence_list.append(evidence)
            red_flags_summary.append(flag['flag'])

        # Calculate risk score
        risk_score = self.calculate_risk_score(evidence_list)

        # Determine classification
        classification, confidence = self.classify_employee(evidence_list, risk_score)

        # Generate recommendations
        recommendations = self.generate_recommendations(classification, evidence_list)

        # Calculate financial impact
        months_employed = ((datetime.now().year - employment_start.year) * 12 +
                          (datetime.now().month - employment_start.month))
        total_paid = salary * months_employed

        # Determine risk level
        risk_level = 'LOW'
        if risk_score >= 0.8:
            risk_level = 'CRITICAL'
        elif risk_score >= 0.6:
            risk_level = 'HIGH'
        elif risk_score >= 0.4:
            risk_level = 'MEDIUM'

        return {
            'nrc': nrc,
            'full_name': full_name,
            'age': age,
            'salary': float(salary),
            'risk_level': risk_level,
            'risk_score': round(risk_score, 2),
            'classification': classification,
            'confidence': round(confidence, 2),
            'evidence': evidence_list,
            'red_flags': red_flags_summary,
            'cross_reference_results': {
                'napsa': napsa_result,
                'home_affairs': home_affairs_result,
                'duplicate_check': duplicate_result
            },
            'withdrawal_analysis': withdrawal_result,
            'recommendations': recommendations,
            'financial_impact': {
                'monthly_salary': float(salary),
                'employment_months': int(months_employed),
                'total_paid': float(total_paid),
                'currency': 'ZMW'
            }
        }

    def calculate_risk_score(self, evidence_list: List[Dict]) -> float:
        """Calculate overall risk score based on evidence"""
        if not evidence_list:
            return 0.0

        severity_weights = {
            'CRITICAL': 0.4,
            'HIGH': 0.25,
            'MEDIUM': 0.15,
            'LOW': 0.05
        }

        strength_weights = {
            'DEFINITIVE': 1.0,
            'STRONG': 0.8,
            'MODERATE': 0.5,
            'WEAK': 0.3
        }

        total_score = 0.0
        for evidence in evidence_list:
            severity_weight = severity_weights.get(evidence['severity'], 0.1)
            strength_weight = strength_weights.get(evidence.get('evidence_strength', 'WEAK'), 0.3)
            total_score += severity_weight * strength_weight

        # Normalize to 0-1 range
        return min(1.0, total_score)

    def classify_employee(self, evidence_list: List[Dict], risk_score: float) -> Tuple[str, float]:
        """Classify employee as legitimate or ghost"""
        if not evidence_list:
            return 'LEGITIMATE', 0.95

        # Check for definitive evidence
        definitive_evidence = [e for e in evidence_list if e.get('evidence_strength') == 'DEFINITIVE']

        if definitive_evidence:
            return 'CONFIRMED_GHOST', 0.98

        if risk_score >= 0.7:
            return 'LIKELY_GHOST', 0.85
        elif risk_score >= 0.4:
            return 'SUSPICIOUS', 0.65
        else:
            return 'NEEDS_REVIEW', 0.50

    def generate_recommendations(self, classification: str, evidence_list: List[Dict]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        if classification == 'CONFIRMED_GHOST':
            recommendations.append('IMMEDIATE ACTION REQUIRED: Suspend salary payments immediately')
            recommendations.append('Escalate to fraud investigation unit')

            # Check for deceased
            deceased = any(e['finding'] == 'Person is Deceased' for e in evidence_list)
            if deceased:
                recommendations.append('Recover all payments made after death date')
                recommendations.append('Verify death with family and notify pension office')

        elif classification == 'LIKELY_GHOST':
            recommendations.append('HIGH PRIORITY: Initiate verification process')
            recommendations.append('Require in-person verification with biometric confirmation')
            recommendations.append('Freeze salary payments pending verification')

        elif classification == 'SUSPICIOUS':
            recommendations.append('MEDIUM PRIORITY: Schedule verification within 30 days')
            recommendations.append('Request updated documentation (NRC, proof of life)')
            recommendations.append('Monitor bank transactions closely')

        else:
            recommendations.append('Schedule routine verification')
            recommendations.append('Update employee records')

        return recommendations

    def batch_analyze(self, nrc_list: List[str]) -> List[Dict]:
        """Analyze multiple employees"""
        results = []
        for nrc in nrc_list:
            try:
                result = self.analyze_employee(nrc)
                results.append(result)
            except Exception as e:
                results.append({
                    'nrc': nrc,
                    'error': str(e)
                })
        return results
