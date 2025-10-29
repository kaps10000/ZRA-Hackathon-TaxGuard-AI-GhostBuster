# VAT Return Fraud Scoring — Functional Flow and Architecture

This document explains how the system works end-to-end: how input is received, how it is processed and transformed into model-ready features, how the model is executed, and how the output is returned to the dashboard.

---

## 1) High-level overview

- Purpose: Score a VAT refund claim (VAT Return) for potential fraud risk using a trained ML model.
- Input: A human-friendly VAT Return (CSV or JSON) for one or more taxpayers/periods — only original VAT-return fields, no derived columns.
- Processing: The app maps VAT-return fields to engineered features (ratios/flags/scores), aligns them to the model’s expected feature order, and generates predictions.
- Output: A table of predictions (fraud_probability and prediction) displayed in the dashboard.

---

## 2) Components

- Web application: Flask (app.py)
  - Routes:
    - GET `/` — dashboard UI
    - GET `/templates/return` — download VAT Return CSV template
    - POST `/upload/return` — upload VAT Return CSV/JSON and obtain predictions
- Templates/UI: Jinja2 HTML (templates/index.html)
- Model artifacts (models/):
  - best_model.pkl — trained model with preprocessing
  - feature_config.json — the exact list and order of features expected by the model
  - metrics.json, summary.json — display only
- Static/template data (data/):
  - vat_return_template.csv — the human-friendly VAT Return format

---

## 3) Request lifecycle (step-by-step)

1) User opens the dashboard (GET `/`). The page renders the upload form and (optionally) model metrics.
2) User uploads a file (CSV or JSON) via POST `/upload/return`.
3) Backend validates the file type and size, then parses it:
   - CSV: loaded into a Pandas DataFrame.
   - JSON: a single object or a list of objects is converted into a DataFrame.
4) The DataFrame is passed to the VAT-return featureizer `_featureize_from_vat_return(df)`.
5) The featureizer converts the VAT-return fields into an intake-like frame (still human-oriented), then calls `_featureize_from_intake(mapped_df)` which:
   - Computes all engineered features (ratios, z-scores, flags) and composite risk scores.
   - Produces a model-ready feature matrix with the exact feature names from `feature_config.json`.
6) `_predict_dataframe(df_features)` ensures the features are in the correct order expected by the model, fills missing ones with 0, and executes the model.
7) The model returns probabilities; the system computes a default class label (prediction) using a 0.5 threshold (or model decision_function if applicable).
8) The rendered page displays the results table (top 200 rows, typically 1 row for a return) along with metrics/summary if available.

---

## 4) Input contract (VAT Return fields)

Accepted file types: `.csv` or `.json` (max 50MB).

Typical columns (no derived math required):
- claim_id (string): Unique claim reference.
- taxpayer_id (string): TPIN or equivalent.
- period_start, period_end (dates): Tax period (optional, used for display/metadata).
- claim_date (date): Optional, improves time-based features.
- submitted_by (string): "Self" or "Tax Agent".
- net_refund_amount (number): Claimed refund amount.
- output_vat (number): Output VAT paid in the period.
- input_vat (number): Input VAT claimed in the period.
- total_sales_amount (number): Sales/turnover for the period.
- export_sales_value (number): Export sales value for the period.
- zero_rated_sales, exempt_sales (number): Optional, reporting only (not used in the current model features).
- sales_invoice_count (integer): Proxy for sales transaction volume.
- supporting_docs_count (integer): Number of attached supporting documents.
- Optional advanced field: business_start_date (date) to improve business age features.

All omitted fields are defaulted internally to safe values.

---

## 5) Feature engineering (background processing)

From the VAT Return fields, the system computes the model features. Key groups:

- Ratios & heuristics:
  - refund_to_output_ratio = net_refund_amount / (output_vat + epsilon)
  - input_output_vat_ratio = input_vat / (output_vat + epsilon)
  - processing_days_zscore = (processing_days − 30) / 15 (VAT Return defaults processing_days to 30)
- Claim history:
  - total_claims_filed (default 1), is_first_time_claimant, is_high_value_claim
- Submission & documents:
  - submitted_by_agent (from submitted_by), has_few_documents (docs < 5)
- Business profile:
  - business_age_years (from business_start_date and claim_date if present), is_young_business (< 2 yrs)
  - claim_to_turnover_ratio, claim_exceeds_business_size (> 20%)
- Purchases & suppliers (not in VAT Return): default-safe values; low_supplier_diversity inferred if supplier_count were provided (defaults to not risky)
- Sales & exports:
  - has_export_sales (export_sales_value > 0), is_export_heavy (> 50% of turnover)
  - has_few_sales (sales_invoice_count < 10)
- Customs (not in VAT Return): defaults chosen to avoid false positives (e.g., customs_export_value = export_sales_value)
- Compliance & PACRA (not in VAT Return): defaults to non-risky values unless provided in extended flows
- Composite risk scores:
  - supplier_risk_score = 3×low_supplier_diversity + 3×has_unverified_suppliers + 2×has_unverified_payments + 2×suspicious_purchase_pattern
  - export_risk_score = 5×export_without_customs + 3×has_missing_export_docs + 2×has_unpaid_sales
  - legitimacy_risk_score = 4×not_registered_pacra + 2×address_not_verified + 2×directors_mismatch + 2×is_dormant_company
  - historical_risk_score = 3×has_audit_issues + 3×has_penalties + 2×low_compliance_rating + 2×is_first_time_claimant

All names and thresholds mirror your original feature engineering pipeline.

---

## 6) Model alignment & prediction

- Artifacts loaded lazily at startup or on first request:
  - `models/feature_config.json` (feature names and order)
  - `models/best_model.pkl` (preprocessing + classifier)
- Before prediction, `_predict_dataframe`:
  - Ensures every expected feature exists; missing features are created and set to 0.
  - Orders columns exactly as in `feature_config.json`.
- Prediction:
  - If the model has `predict_proba`, use class-1 probability.
  - Else use `decision_function` and convert via logistic function.
  - `prediction` = 1 if probability ≥ 0.5, else 0 (adjustable).
- Output:
  - fraud_probability (float 0–1)
  - prediction (0/1)
  - Optional identifiers (claim_id, taxpayer_id) if provided in the upload

---

## 7) Output rendering

- The predictions DataFrame is limited to the first 200 rows for display.
- The dashboard shows a single table with columns corresponding to the returned output.
- Model metrics and a short summary (if provided by training) are shown above the upload card.

---

## 8) Error handling & validation

- File validation: only `.csv` and `.json` accepted for VAT Returns; max size enforced (50MB).
- Parsing: JSON can be a single object or array; CSV parsed with standard Pandas.
- Featureization: If a required numeric field is missing, it defaults to 0; date parsing is tolerant.
- Errors are surfaced as a user-friendly message on the page (e.g., "VAT return processing failed: ...").

---

## 9) Security & handling

- Files are processed in memory for prediction only; not saved persistently by default.
- There are no external secrets required for prediction.
- Inputs are not executed; only parsed as data.

---

## 10) Extensibility

- Add or rename VAT Return fields: update `_featureize_from_vat_return` to map the new fields.
- Change thresholds or weights: adjust logic in `_featureize_from_intake` for features and composite scores.
- Replace model: retrain via the notebook and overwrite artifacts in `models/`.
- Add a JSON API-only endpoint: reuse the same featureization and return JSON instead of rendering a page.

---

## 11) Typical end-to-end sequence (CSV)

1) User fills `data/vat_return_template.csv` (one row).
2) User uploads it at `/upload/return`.
3) Server parses CSV → DataFrame.
4) `_featureize_from_vat_return` maps VAT-return fields → intake-like DataFrame.
5) `_featureize_from_intake` computes engineered features and composite scores.
6) `_predict_dataframe` aligns to model features and predicts.
7) Page displays fraud_probability and prediction.

---

## 12) Operational checks

- If prediction fails, confirm:
  - Model artifacts exist in `models/`.
  - Upload file is `.csv` or `.json` and not empty.
  - Required numeric fields (e.g., net_refund_amount) have valid numbers.

---

This document reflects the current implementation in `app.py` and `templates/index.html`, using the trained model artifacts in `models/` and the VAT Return template in `data/`.
