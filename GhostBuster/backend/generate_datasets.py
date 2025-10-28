"""
GhostBuster Dataset Generator
Generates realistic synthetic datasets for testing the ghost employee detection system
"""

import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import random
import os

fake = Faker('en_GB')
Faker.seed(42)
np.random.seed(42)
random.seed(42)

# Zambian banks
BANKS = [
    'Zanaco', 'Stanbic Bank', 'First National Bank', 'Standard Chartered',
    'Barclays Bank', 'Indo Zambia Bank', 'Atlas Mara Bank', 'Access Bank',
    'Cavmont Bank', 'AB Bank'
]

# Zambian government ministries
MINISTRIES = [
    'Ministry of Finance', 'Ministry of Health', 'Ministry of Education',
    'Ministry of Agriculture', 'Ministry of Home Affairs', 'Ministry of Defence',
    'Ministry of Energy', 'Ministry of Transport', 'Ministry of Justice',
    'Ministry of Commerce'
]

# Shell companies for ghost workers
SHELL_COMPANIES = [
    'ABC Trading Ltd', 'Universal Services', 'Crown Investments',
    'Eagle Enterprises', 'Phoenix Holdings', 'Summit Solutions',
    'Global Ventures Ltd', 'Apex Business Group', 'Trinity Trading'
]

PROVINCES = [
    'Lusaka', 'Copperbelt', 'Southern', 'Eastern', 'Western',
    'Northern', 'North-Western', 'Central', 'Luapula', 'Muchinga'
]

def generate_nrc():
    """Generate realistic Zambian NRC format: XXXXXX/XX/X"""
    return f"{random.randint(100000, 999999)}/{random.randint(10, 99)}/{random.randint(1, 9)}"

def generate_napsa_number():
    """Generate NAPSA number"""
    return f"NP{random.randint(100000, 999999)}"

def generate_account_number(bank):
    """Generate bank account number"""
    if 'Zanaco' in bank:
        return f"01{random.randint(10000000, 99999999)}"
    elif 'Stanbic' in bank:
        return f"92{random.randint(10000000, 99999999)}"
    else:
        return f"{random.randint(1000000000, 9999999999)}"

class GhostBusterDataGenerator:
    def __init__(self, num_records=10000):
        self.num_records = num_records
        self.master_data = []
        self.nrc_registry = {}

    def generate_master_records(self):
        """Generate master employee records"""
        print("Generating master employee records...")

        ghost_types = {
            'LEGITIMATE': int(self.num_records * 0.70),  # 70% legitimate
            'DECEASED': int(self.num_records * 0.10),     # 10% deceased
            'DUPLICATE': int(self.num_records * 0.08),    # 8% duplicate
            'PHANTOM': int(self.num_records * 0.07),      # 7% phantom (no NAPSA)
            'OVER_AGE': int(self.num_records * 0.05)      # 5% over retirement age
        }

        records = []
        person_id = 1

        for ghost_type, count in ghost_types.items():
            for i in range(count):
                nrc = generate_nrc()

                # For duplicates, reuse some NRCs
                if ghost_type == 'DUPLICATE' and len(records) > 100:
                    nrc = records[random.randint(0, len(records)-1)]['nrc']

                # Generate realistic dates
                if ghost_type == 'OVER_AGE':
                    # Over 65 years old
                    dob = fake.date_of_birth(minimum_age=66, maximum_age=80)
                else:
                    dob = fake.date_of_birth(minimum_age=25, maximum_age=60)

                # Death date for deceased workers
                death_date = None
                if ghost_type == 'DECEASED':
                    death_date = fake.date_between(start_date='-3y', end_date='-6m')

                # Salary ranges
                salary = random.choice([
                    8000, 10000, 12000, 15000, 18000, 20000, 25000, 30000
                ])

                # For ghost workers, often round numbers
                if ghost_type in ['DECEASED', 'PHANTOM', 'DUPLICATE']:
                    salary = random.choice([10000, 15000, 20000, 25000])

                record = {
                    'person_id': person_id,
                    'nrc': nrc,
                    'full_name': fake.name(),
                    'date_of_birth': dob,
                    'gender': random.choice(['M', 'F']),
                    'province': random.choice(PROVINCES),
                    'salary': salary,
                    'ministry': random.choice(MINISTRIES),
                    'employment_start_date': fake.date_between(start_date='-10y', end_date='-1y'),
                    'primary_bank': random.choice(BANKS),
                    'primary_account': generate_account_number(random.choice(BANKS)),
                    'is_ghost': ghost_type != 'LEGITIMATE',
                    'ghost_type': ghost_type,
                    'death_date': death_date,
                    'napsa_number': generate_napsa_number()
                }

                records.append(record)
                self.master_data.append(record)
                person_id += 1

        df = pd.DataFrame(records)
        df.to_csv('data/master_records.csv', index=False)
        print(f"✓ Generated {len(records)} master records")
        return df

    def generate_napsa_data(self, master_df):
        """Generate NAPSA contribution records"""
        print("Generating NAPSA contribution records...")

        napsa_records = []

        for _, person in master_df.iterrows():
            # Legitimate workers have regular contributions
            if person['ghost_type'] == 'LEGITIMATE':
                num_contributions = random.randint(24, 120)  # 2-10 years
            elif person['ghost_type'] == 'OVER_AGE':
                num_contributions = random.randint(50, 120)  # Many contributions (long career)
            elif person['ghost_type'] == 'PHANTOM':
                num_contributions = random.randint(0, 5)  # Very few or none
            elif person['ghost_type'] == 'DECEASED':
                # Contributions stop after death
                months_alive = (person['death_date'].year - person['employment_start_date'].year) * 12
                num_contributions = max(0, months_alive)
            else:
                num_contributions = random.randint(5, 30)

            # Generate contribution records
            start_date = person['employment_start_date']

            for i in range(num_contributions):
                contribution_date = start_date + timedelta(days=30*i)

                # Stop contributions after death
                if person['death_date'] and contribution_date > person['death_date']:
                    break

                employee_contribution = person['salary'] * 0.05
                employer_contribution = person['salary'] * 0.05

                napsa_records.append({
                    'napsa_number': person['napsa_number'],
                    'nrc': person['nrc'],
                    'full_name': person['full_name'],
                    'employer': person['ministry'],
                    'contribution_date': contribution_date,
                    'employee_contribution': employee_contribution,
                    'employer_contribution': employer_contribution,
                    'total_contribution': employee_contribution + employer_contribution
                })

        df = pd.DataFrame(napsa_records)
        df.to_csv('data/napsa_contributions.csv', index=False)
        print(f"✓ Generated {len(napsa_records)} NAPSA contribution records")
        return df

    def generate_home_affairs_data(self, master_df):
        """Generate Home Affairs NRC Registry (including death registry)"""
        print("Generating Home Affairs NRC registry...")

        registry_records = []

        for _, person in master_df.iterrows():
            status = 'DECEASED' if person['death_date'] else 'ACTIVE'

            registry_records.append({
                'nrc': person['nrc'],
                'full_name': person['full_name'],
                'date_of_birth': person['date_of_birth'],
                'gender': person['gender'],
                'province_of_origin': person['province'],
                'district_of_origin': fake.city(),
                'status': status,
                'death_date': person['death_date'] if person['death_date'] else None,
                'death_registered': True if person['death_date'] else False,
                'registration_date': fake.date_between(start_date='-30y', end_date='-18y')
            })

        df = pd.DataFrame(registry_records)
        df.to_csv('data/home_affairs_registry.csv', index=False)
        print(f"✓ Generated {len(registry_records)} Home Affairs registry records")
        return df

    def generate_bank_transactions(self, master_df):
        """Generate bank transaction records with realistic patterns"""
        print("Generating bank transaction records...")

        transactions = []
        transaction_id = 1

        for _, person in master_df.iterrows():
            # Determine employment months
            start_date = person['employment_start_date']
            end_date = datetime.now()

            if person['death_date']:
                # Ghost workers continue getting paid after death
                end_date = datetime.now()

            months_employed = ((end_date.year - start_date.year) * 12 +
                             (end_date.month - start_date.month))

            # Generate transactions for each month
            for month in range(min(months_employed, 36)):  # Last 3 years
                transaction_date = start_date + timedelta(days=30*month)

                # Salary deposit (1st of month)
                salary_date = transaction_date.replace(day=1)
                balance = person['salary']

                transactions.append({
                    'transaction_id': f"TXN{transaction_id:010d}",
                    'transaction_date': salary_date,
                    'account_number': person['primary_account'],
                    'bank_name': person['primary_bank'],
                    'nrc': person['nrc'],
                    'transaction_type': 'SALARY_DEPOSIT',
                    'amount': person['salary'],
                    'recipient': person['full_name'],
                    'balance_after': balance,
                    'description': f"Salary - {person['ministry']}"
                })
                transaction_id += 1

                # Withdrawal patterns based on ghost type
                if person['ghost_type'] == 'LEGITIMATE':
                    # Normal spending pattern - multiple withdrawals
                    num_withdrawals = random.randint(8, 20)

                    for w in range(num_withdrawals):
                        withdrawal_date = salary_date + timedelta(days=random.randint(1, 28))
                        withdrawal_amount = random.choice([50, 100, 200, 500, 1000, 1500])
                        balance -= withdrawal_amount

                        transactions.append({
                            'transaction_id': f"TXN{transaction_id:010d}",
                            'transaction_date': withdrawal_date,
                            'account_number': person['primary_account'],
                            'bank_name': person['primary_bank'],
                            'nrc': person['nrc'],
                            'transaction_type': random.choice(['ATM_WITHDRAWAL', 'POS_PURCHASE', 'TRANSFER']),
                            'amount': -withdrawal_amount,
                            'recipient': random.choice(['ATM', 'Shoprite', 'Pick n Pay', 'ZESCO', 'Airtel']),
                            'balance_after': max(0, balance),
                            'description': 'Normal spending'
                        })
                        transaction_id += 1

                else:
                    # Ghost worker pattern - exact salary withdrawal
                    # Withdraw exactly salary amount within 1-3 days
                    withdrawal_date = salary_date + timedelta(days=random.randint(1, 3))

                    # Often to shell companies
                    if person['ghost_type'] in ['DECEASED', 'PHANTOM', 'DUPLICATE']:
                        recipient = random.choice(SHELL_COMPANIES)
                        txn_type = 'TRANSFER'
                    else:
                        recipient = 'ATM'
                        txn_type = 'ATM_WITHDRAWAL'

                    transactions.append({
                        'transaction_id': f"TXN{transaction_id:010d}",
                        'transaction_date': withdrawal_date,
                        'account_number': person['primary_account'],
                        'bank_name': person['primary_bank'],
                        'nrc': person['nrc'],
                        'transaction_type': txn_type,
                        'amount': -person['salary'],
                        'recipient': recipient,
                        'balance_after': 0,
                        'description': 'Full salary withdrawal'
                    })
                    transaction_id += 1

        df = pd.DataFrame(transactions)
        df.to_csv('data/bank_transactions.csv', index=False)
        print(f"✓ Generated {len(transactions)} bank transaction records")
        return df

def main():
    """Generate all datasets"""
    print("=" * 60)
    print("GhostBuster Dataset Generator")
    print("=" * 60)

    # Create data directory
    os.makedirs('data', exist_ok=True)

    # Initialize generator
    generator = GhostBusterDataGenerator(num_records=10000)

    # Generate datasets
    master_df = generator.generate_master_records()
    napsa_df = generator.generate_napsa_data(master_df)
    home_affairs_df = generator.generate_home_affairs_data(master_df)
    bank_df = generator.generate_bank_transactions(master_df)

    print("\n" + "=" * 60)
    print("Dataset Generation Complete!")
    print("=" * 60)
    print(f"\nDatasets created in ./data/ directory:")
    print(f"  - master_records.csv ({len(master_df)} records)")
    print(f"  - napsa_contributions.csv ({len(napsa_df)} records)")
    print(f"  - home_affairs_registry.csv ({len(home_affairs_df)} records)")
    print(f"  - bank_transactions.csv ({len(bank_df)} records)")

    print(f"\nGhost Employee Distribution:")
    print(master_df['ghost_type'].value_counts())

    print("\n✓ Ready to run GhostBuster detection engine!")

if __name__ == "__main__":
    main()
