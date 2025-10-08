# ZRA Hackathon - TaxGuard AI GhostBuster

## ZRA Fraud EDA, Modeling and Dashboard

This project includes:
- A Jupyter notebook for EDA and model training that saves the best model and artifacts
- A Flask app that serves a simple dashboard with EDA visuals and a prediction form
- Mock input data to test the prediction endpoint

## Prerequisites
- Python 3.10+
- Recommended: create and activate a virtual environment

## Setup

1) Install dependencies

Windows PowerShell:

```
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

2) Run the notebook to train and save the model

Open the notebook and run all cells:

```
jupyter notebook notebooks/fraud_eda_and_model.ipynb
```

This will create:
- models/best_model.pkl
- models/feature_config.json
- models/metrics.json
- models/summary.json
- static/images/*.png (EDA charts)

3) Launch the Flask app

```
python app.py
```

Open your browser at http://127.0.0.1:5000 to view the dashboard.

## Testing the prediction endpoint

After running the notebook and starting the app:

- Using the web form on the homepage (enter numeric values for each feature)
- Or call the JSON API from a terminal:

```
curl -s -X POST http://127.0.0.1:5000/api/predict \
  -H "Content-Type: application/json" \
  -d @data/mock_input.json
```

Expected JSON response structure:

```
{
  "prediction": 0 or 1,
  "fraud_probability": 0.0-1.0
}
```

## Notes
- The model pipeline includes preprocessing (impute + scale) and the classifier, so the app only needs numeric feature values.
- ID columns (claim_id, taxpayer_id) and the target (is_fraud) are excluded from the prediction inputs.
- If you change the dataset schema, re-run the notebook to regenerate artifacts.
