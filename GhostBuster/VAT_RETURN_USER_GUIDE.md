# ZRA VAT Return Fraud Scoring — System Guide

Audience: VAT operations, audit, risk analysts, and developers

This guide explains how the dashboard predicts VAT refund fraud risk from a single VAT Return upload. It covers the upload format, what happens in the background (feature engineering), how scores are produced, and how to troubleshoot or extend the system.

---

## 1) What you upload

You upload a VAT Return for a single taxpayer and period in CSV or JSON format. The file should contain human-friendly VAT-return fields only — no formulas or derived columns. The app computes all features and risk scores automatically.

Download the template from the dashboard:
- Templates link: “VAT Return CSV Template”
- Path on disk: data/vat_return_template.csv

Minimal CSV example:
```csv path=null start=null
claim_id,taxpayer_id,period_start,period_end,claim_date,submitted_by,net_refund_amount,output_vat,input_vat,total_sales_amount,export_sales_value,zero_rated_sales,exempt_sales,sales_invoice_count,supporting_docs_count
CLM_RETURN_0001,TPIN_12345678,2025-07-01,2025-09-30,2025-10-05,Self,7500,12000,15000,400000,180000,20000,5000,20,6
```

Accepted file types and limits:
- CSV or JSON (.csv, .json)
- Max size: 50MB

---

## 2) Input field dictionary (VAT Return)

Required (preferred where marked):
- claim_id (string, preferred): Unique claim reference.
- taxpayer_id (string, preferred): TPIN or equivalent.
- period_start, period_end (date, optional): Tax period dates used for display/metadata.
- claim_date (date, optional): If present, helps compute business age when combined with optional business_start_date.
- submitted_by (string, optional): “Self” or “Tax Agent”. If “Tax Agent”, system flags submitted_by_agent.
- net_refund_amount (number, required): Amount claimed as refund.
- output_vat (number, optional): Output VAT paid.
- input_vat (number, optional): Input VAT claimed.
- total_sales_amount (number, optional): Total sales turnover for period.
- export_sales_value (number, optional): Export sales value for period.
- zero_rated_sales (number, optional): Used for reporting only (not currently model features).
- exempt_sales (number, optional): Used for reporting only (not currently model features).
- sales_invoice_count (integer, optional): Count of sales invoices. Used as a proxy for activity level.
- supporting_docs_count (integer, optional): Number of documents attached to the claim.

Optional advanced fields (if known):
- business_start_date (date): Improves “business_age_years” and “is_young_business”.

All fields not present default safely (often to zero), and engineered features will still be computed.

---

## 3) What the system computes in the background

After you upload a VAT Return, the app maps return fields into the model’s feature space and computes all engineered features. Here’s a plain-language overview.

A) Core ratios and heuristics
- refund_to_output_ratio = net_refund_amount / (output_vat + small epsilon)
- input_output_vat_ratio = input_vat / (output_vat + small epsilon)
- processing_days_zscore = (processing_days − 30) / 15
  - For VAT returns, processing_days defaults to 30 unless provided elsewhere.

B) Claim frequency and basic flags
- total_claims_filed defaults to 1; is_first_time_claimant = total_claims_filed <= 1
- is_high_value_claim thresholding is handled downstream by the original training pipeline logic (uses distributional heuristics).
- submitted_by_agent = (submitted_by == “Tax Agent”)
- has_few_documents = supporting_docs_count < 5

C) Business profile
- business_age_years: if business_start_date and claim_date are present, difference in years; otherwise defaults.
- is_young_business = business_age_years < 2
- claim_to_turnover_ratio = net_refund_amount / total_sales_amount
- claim_exceeds_business_size = claim_to_turnover_ratio > 0.20
- single_director, no_tax_agent, is_sole_proprietor default to reasonable values when not present in a VAT return.

D) Purchases and suppliers (VAT return typically doesn’t contain these)
- supplier_count, unverified_supplier_count, purchases_count, payments_unverified_flag, suspicious_purchase_flag default to 0.
- low_supplier_diversity = supplier_count <= 3
- unverified_supplier_ratio derived safely from counts.

E) Sales/exports
- has_export_sales = export_sales_value > 0
- is_export_heavy = export_sales_value > 0.5 × total_sales_amount
- has_missing_export_docs, has_unpaid_sales default to 0 unless provided.
- has_few_sales = sales_invoice_count < 10
- single_export_destination defaults to 0 unless destination count provided.

F) Customs (not in VAT return)
- customs_export_value defaults equal to export_sales_value to avoid false positives.
- export_without_customs, large_export_customs_mismatch default to safe values based on available data.

G) Compliance/PACRA (not in VAT return)
- audit_issues_count, penalties_count, compliance_rating, ever_audited_flag default to non-risky values.
- pacra_registered_flag defaults to 1 (registered), directors_mismatch_flag/address_mismatch_flag/dormant_flag default to 0.
- claim_exceeds_share_capital = net_refund_amount > 10 × share_capital (share_capital defaults to 0 if unknown).

H) Composite risk scores (computed automatically)
- supplier_risk_score = (low_supplier_diversity×3) + (has_unverified_suppliers×3) + (has_unverified_payments×2) + (suspicious_purchase_pattern×2)
- export_risk_score = (export_without_customs×5) + (has_missing_export_docs×3) + (has_unpaid_sales×2)
- legitimacy_risk_score = (not_registered_pacra×4) + (address_not_verified×2) + (directors_mismatch×2) + (is_dormant_company×2)
- historical_risk_score = (has_audit_issues×3) + (has_penalties×3) + (low_compliance_rating×2) + (is_first_time_claimant×2)

All of the above reproduce your feature engineering pipeline while using only VAT-return fields from the user and safe defaults for everything else.

---

## 4) Model alignment and predictions

- The app loads the model and feature list from:
  - models/best_model.pkl
  - models/feature_config.json
- It ensures the feature order exactly matches the model’s training configuration.
- Missing features default to 0.
- Output returned to the UI:
  - fraud_probability (0.0–1.0)
  - prediction (0 or 1)
  - Optional: claim_id and taxpayer_id for readability if provided in the upload.

---

## 5) How to use the dashboard

- Start: `python app.py`
- Open: http://127.0.0.1:5000
- Download the VAT Return CSV template, fill one row for the taxpayer/period, and upload it via the single upload form.
- The predictions table shows up to the first 200 rows (usually 1 row for returns).

---

## 6) API endpoints (for integration)

- GET `/` — Dashboard UI
- GET `/templates/return` — Download the VAT Return CSV template
- POST `/upload/return` — Upload a VAT Return (CSV or JSON). Returns the rendered page with predictions.

Legacy endpoints (not shown in the UI anymore) remain for backward compatibility:
- POST `/upload/features` — Accepts feature-ready CSV/JSON (advanced only)
- POST `/upload/intake` — Accepts intake CSV/JSON and computes features
- POST `/upload/datasets` — Accepts ZIP/XLSX bundle of the 8 datasets (admin/testing)

---

## 7) Troubleshooting

- “Model not found. Please run the training notebook.”
  - Run notebooks/fraud_eda_and_model.ipynb and ensure models/*.json and best_model.pkl are created.
- “Please upload a CSV (recommended) or JSON VAT Return file.”
  - Ensure your file has .csv or .json extension.
- “VAT return processing failed: ...”
  - Check column names match the template. Unknown columns are ignored; missing critical numeric fields become 0 by default.
- Predictions look too conservative
  - Provide more optional fields (supporting_docs_count, business_start_date, sales_invoice_count). The more raw detail, the better the engineered features.

---

## 8) Extending the VAT Return format (optional)

You can add any of these optional columns to improve feature quality (still human-friendly, no math required):
- business_start_date (date)
- has_tax_agent (0/1) to override the default derived from submitted_by
- unpaid_sales_flag (0/1)
- export_docs_missing (0/1)
- directors_count (integer)
- share_capital (number)

The app will automatically use them when present; otherwise it falls back to safe defaults.

---

## 9) Data handling and security notes

- Files are handled in-memory for prediction; they are not stored persistently by default.
- Max upload size is limited (50MB) to reduce accidental large files.
- Only CSV and JSON are accepted for returns.
- No secrets are required or exposed in logs.

---

## 10) Frequently asked questions

- Do users have to compute risk scores? No. All engineered features and composite scores are computed automatically from the VAT-return input.
- Can I upload more than one return at a time? Yes, you can include multiple rows in the CSV/JSON, and the app will compute scores for each row.
- Do I need the 8 datasets to run predictions? No. The VAT Return upload is sufficient. The dataset bundle route is only for admin/testing.

---

## 11) File structure reference

- app.py — Flask app with VAT Return processing and prediction
- templates/index.html — Dashboard UI (single VAT Return upload and results)
- data/vat_return_template.csv — VAT Return template
- models/* — Model artifacts (best_model.pkl, feature_config.json, metrics.json, summary.json)

---

## 12) Contact and maintenance

- Update the model by re-running notebooks/fraud_eda_and_model.ipynb after any schema or feature changes.
- If you change VAT Return fields, adjust the mapping in app.py (_featureize_from_vat_return) accordingly.
