import logging
import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from app.utils import load_data, preprocess, save_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

DATA_DIR = "data"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "revenue_forecast_model.pkl")

def train_model(X, y):
    logging.info("Training predictive model...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    logging.info(f"✅ Model trained. MAE: {mae:.2f}, R²: {r2:.3f}")
    return model

def simulate_scenario(model, copper_drop=-10):
    logging.info("Simulating copper price shock scenario...")

    scenario = pd.DataFrame({
        "Open": [3000],
        "High": [3050],
        "Low": [2950],
        "Volume": [1_500_000],
        "GDP_Growth": [1.5],
        "Inflation_Rate": [2.0],
        "Unemployment_Rate": [4.5],
        "EUR_USD": [1.12]
    })
    scenario[["Open", "High", "Low"]] *= (1 + copper_drop / 100)

    forecast = model.predict(scenario)[0]
    logging.info(f"📉 Predicted tax revenue after {copper_drop}% copper price drop: {forecast:.2f}")
    return forecast

def main():
    df = load_data(
        os.path.join(DATA_DIR, "historical_atx.csv"),
        os.path.join(DATA_DIR, "economic_factors_atx.csv")
    )
    X, y = preprocess(df)
    model = train_model(X, y)
    save_model(model, MODEL_PATH)
    simulate_scenario(model, copper_drop=-15)

if __name__ == "__main__":
    main()
