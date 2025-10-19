#!/usr/bin/env python3
"""
ZRA TaxGuard - Mock Data Generator
Generate valid mock tax documents for testing

Usage:
    python generate_mock_data.py --type invoice --quality perfect --output mock_invoice.json
    python generate_mock_data.py --type customs --quality good --count 5
"""

import argparse
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any


class MockDataGenerator:
    """Generate mock tax documents that pass ZRA TaxGuard verification"""

    def __init__(self):
        self.companies = [
            "Global Trading Ltd", "Premium Imports Limited", "ABC Corporation",
            "XYZ Trading Co", "Zambia Exports Ltd", "International Trade Ltd",
            "African Commerce Ltd", "Continental Trading", "Gateway Imports",
            "Horizon Trading Ltd", "Unity Commerce Limited", "Summit Exports"
        ]

        self.suppliers = [
            "Manufacturing Corp", "Production Ltd", "Supply Chain Inc",
            "Factory Direct Ltd", "Wholesale Partners", "Production Hub",
            "Manufacturing Solutions", "Industrial Supplies Ltd"
        ]

        self.products = [
            {"name": "Mobile Phones", "hs_code": "8517120000"},
            {"name": "Laptop Computers", "hs_code": "8471300000"},
            {"name": "Men's Trousers", "hs_code": "6203420000"},
            {"name": "Women's Dresses", "hs_code": "6204430000"},
            {"name": "Coffee", "hs_code": "0901210000"},
            {"name": "Tea", "hs_code": "0902300000"},
            {"name": "Petroleum Oils", "hs_code": "2710194900"},
            {"name": "Passenger Cars", "hs_code": "8703230000"},
            {"name": "Furniture", "hs_code": "9403600000"},
            {"name": "Textiles", "hs_code": "5208210000"}
        ]

        self.currencies = ["ZMW", "USD", "EUR", "GBP"]
        self.zmw_currencies = ["ZMW"]  # For Zambian documents

    def generate_tpin(self) -> str:
        """Generate valid TPIN (10 digits, not all same)"""
        # Ensure not all digits are the same
        tpin = ''.join([str(random.randint(1, 9)) for _ in range(10)])
        # Check if all digits are the same, regenerate if so
        if len(set(tpin)) == 1:
            return self.generate_tpin()
        return tpin

    def generate_invoice_number(self, quality: str) -> str:
        """Generate invoice number based on quality"""
        if quality == "perfect":
            prefix = random.choice(["INV", "TAX", "ZRA"])
            date_part = datetime.now().strftime("%Y-%m-%d")
            number = random.randint(1000, 9999)
            return f"{prefix}-{date_part}-{number}"

        elif quality == "good":
            prefix = random.choice(["TAX", "INV"])
            number = random.randint(10000, 99999)
            return f"{prefix}{number}"

        elif quality == "flagged":
            # Just numbers, minimal length
            return str(random.randint(10000, 99999))

        else:  # rejected
            return "00000"  # Invalid: all zeros

    def generate_date(self, quality: str) -> str:
        """Generate document date based on quality"""
        today = datetime.now()

        if quality == "perfect":
            # Recent date within last 3 months
            days_ago = random.randint(1, 90)
            date = today - timedelta(days=days_ago)
            return date.strftime("%Y-%m-%d")

        elif quality == "good":
            # Date within last 6 months to 1 year
            days_ago = random.randint(180, 365)
            date = today - timedelta(days=days_ago)
            return date.strftime("%Y-%m-%d")

        elif quality == "flagged":
            # Old date (3-4 years ago)
            days_ago = random.randint(1095, 1460)
            date = today - timedelta(days=days_ago)
            return date.strftime("%Y-%m-%d")

        else:  # rejected
            # Future date
            days_ahead = random.randint(30, 90)
            date = today + timedelta(days=days_ahead)
            return date.strftime("%Y-%m-%d")

    def generate_amount(self, quality: str) -> float:
        """Generate monetary amount based on quality"""
        if quality == "perfect":
            # Realistic amount with cents
            return round(random.uniform(1000, 100000), 2)

        elif quality == "good":
            # Round amount (triggers -10 penalty)
            amount = random.choice([5000, 10000, 25000, 50000, 100000])
            return float(amount)

        elif quality == "flagged":
            # Very high amount
            return round(random.uniform(5000000, 9500000), 2)

        else:  # rejected
            # Invalid: negative or zero
            return random.choice([0.0, -500.0, -1000.0])

    def generate_currency(self, quality: str) -> str:
        """Generate currency code based on quality"""
        if quality in ["perfect", "good", "flagged"]:
            return random.choice(self.currencies)
        else:  # rejected
            return "XYZ"  # Invalid currency

    def generate_phone(self) -> str:
        """Generate Zambian phone number"""
        prefix = random.choice(["977", "966", "955", "976"])
        number = random.randint(100000, 999999)
        return f"+260 {prefix} {number}"

    def generate_email(self, company_name: str) -> str:
        """Generate email based on company name"""
        domain = company_name.lower().replace(" ", "").replace("ltd", "").replace("limited", "")[:15]
        return f"contact@{domain}.zm"

    def generate_line_items(self, count: int = 3) -> List[Dict[str, Any]]:
        """Generate invoice line items"""
        items = []
        for _ in range(count):
            product = random.choice(self.products)
            quantity = random.randint(10, 1000)
            unit_price = round(random.uniform(10, 1000), 2)
            amount = round(quantity * unit_price, 2)

            items.append({
                "description": product["name"],
                "hs_code": product["hs_code"],
                "quantity": quantity,
                "unit_price": unit_price,
                "amount": amount
            })

        return items

    def generate_invoice(self, quality: str = "perfect") -> Dict[str, Any]:
        """Generate mock invoice"""
        company = random.choice(self.companies)
        supplier = random.choice(self.suppliers)

        invoice = {
            "document_type": "invoice",
            "invoice_number": self.generate_invoice_number(quality),
            "document_date": self.generate_date(quality),
            "total_amount": self.generate_amount(quality),
            "currency": self.generate_currency(quality)
        }

        if quality in ["perfect", "good"]:
            invoice["importer_name"] = company

        if quality == "perfect":
            invoice["tpin"] = self.generate_tpin()
            invoice["supplier_name"] = supplier
            invoice["phone"] = self.generate_phone()
            invoice["email"] = self.generate_email(company)
            invoice["address"] = f"Plot {random.randint(100, 999)}, Great East Road, Lusaka"

            # Add line items
            line_items = self.generate_line_items()
            invoice["line_items"] = line_items
            invoice["subtotal"] = sum(item["amount"] for item in line_items)
            invoice["tax_amount"] = round(invoice["subtotal"] * 0.16, 2)  # 16% VAT
            invoice["total_amount"] = round(invoice["subtotal"] + invoice["tax_amount"], 2)

        elif quality == "good":
            # Missing TPIN and some optional fields
            pass

        elif quality == "flagged":
            # Missing multiple fields
            pass

        else:  # rejected
            # Invalid TPIN
            invoice["tpin"] = "123"  # Too short

        return invoice

    def generate_customs_declaration(self, quality: str = "perfect") -> Dict[str, Any]:
        """Generate mock customs declaration"""
        company = random.choice(self.companies)

        declaration = {
            "document_type": "customs_declaration",
            "invoice_number": f"CUSTOMS-{datetime.now().strftime('%Y')}-{random.randint(100000, 999999)}",
            "document_date": self.generate_date(quality),
            "total_amount": self.generate_amount(quality),
            "currency": random.choice(["USD", "EUR"]),  # Customs often in USD/EUR
        }

        if quality in ["perfect", "good"]:
            declaration["importer_name"] = company
            # Generate multiple HS codes
            num_items = random.randint(2, 5)
            items = random.sample(self.products, num_items)
            declaration["hs_codes"] = [item["hs_code"] for item in items]

        if quality == "perfect":
            declaration["tpin"] = self.generate_tpin()
            declaration["country_of_origin"] = random.choice([
                "China", "South Africa", "United Kingdom", "United States", "Germany"
            ])
            declaration["port_of_entry"] = random.choice([
                "Lusaka International Airport",
                "Chirundu Border Post",
                "Nakonde Border Post",
                "Kazungula Border Post"
            ])
            declaration["phone"] = self.generate_phone()

            # Generate detailed items
            items_list = []
            for product in random.sample(self.products, num_items):
                quantity = random.randint(100, 10000)
                unit_value = round(random.uniform(10, 500), 2)
                value = round(quantity * unit_value, 2)

                items_list.append({
                    "description": product["name"],
                    "hs_code": product["hs_code"],
                    "quantity": quantity,
                    "unit_value": unit_value,
                    "value": value
                })

            declaration["items"] = items_list
            declaration["total_amount"] = sum(item["value"] for item in items_list)
            declaration["duty_amount"] = round(declaration["total_amount"] * 0.15, 2)  # 15% duty

        elif quality == "flagged":
            # Missing HS codes (critical for customs)
            declaration.pop("hs_codes", None)

        elif quality == "rejected":
            # Invalid HS codes
            declaration["hs_codes"] = ["ABC123", "12345"]  # Invalid format

        return declaration

    def generate_receipt(self, quality: str = "perfect") -> Dict[str, Any]:
        """Generate mock receipt"""
        merchant = random.choice(self.companies)

        receipt = {
            "document_type": "receipt",
            "invoice_number": f"REC-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
            "document_date": self.generate_date(quality),
            "total_amount": self.generate_amount(quality),
            "currency": "ZMW"
        }

        if quality == "perfect":
            receipt["merchant_name"] = merchant
            receipt["payment_method"] = random.choice(["Cash", "Mobile Money", "Card", "Bank Transfer"])
            receipt["transaction_id"] = f"TXN{random.randint(100000000, 999999999)}"
            receipt["tpin"] = self.generate_tpin()

        return receipt


def main():
    parser = argparse.ArgumentParser(
        description="Generate mock tax documents for ZRA TaxGuard testing"
    )
    parser.add_argument(
        "--type",
        choices=["invoice", "customs", "receipt"],
        default="invoice",
        help="Document type to generate"
    )
    parser.add_argument(
        "--quality",
        choices=["perfect", "good", "flagged", "rejected"],
        default="perfect",
        help="Quality of mock data (affects risk score)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1,
        help="Number of documents to generate"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output file path (if not specified, prints to stdout)"
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty print JSON output"
    )

    args = parser.parse_args()

    generator = MockDataGenerator()

    # Generate documents
    documents = []
    for _ in range(args.count):
        if args.type == "invoice":
            doc = generator.generate_invoice(args.quality)
        elif args.type == "customs":
            doc = generator.generate_customs_declaration(args.quality)
        else:  # receipt
            doc = generator.generate_receipt(args.quality)

        documents.append(doc)

    # Prepare output
    output_data = documents[0] if args.count == 1 else documents

    # Format JSON
    indent = 2 if args.pretty else None
    json_output = json.dumps(output_data, indent=indent)

    # Write or print
    if args.output:
        with open(args.output, 'w') as f:
            f.write(json_output)
        print(f"Generated {args.count} {args.quality} {args.type}(s) -> {args.output}")
        print(f"\nExpected Results:")
        if args.quality == "perfect":
            print("  Risk Score: 95-100 (LOW)")
            print("  Status: ✅ VERIFIED")
        elif args.quality == "good":
            print("  Risk Score: 70-85 (LOW-MEDIUM)")
            print("  Status: ✅ VERIFIED or ⚡ FLAGGED")
        elif args.quality == "flagged":
            print("  Risk Score: 50-69 (MEDIUM)")
            print("  Status: ⚡ FLAGGED")
        else:  # rejected
            print("  Risk Score: 0-29 (CRITICAL)")
            print("  Status: ⛔ REJECTED")
    else:
        print(json_output)


if __name__ == "__main__":
    main()
