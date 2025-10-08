import pandas as pd
import os
import joblib
import logging

def load_data(historical_file, economic_file):
    """Load and merge historical and economic datasets."""
    logging.info("Loading data...")
    atx = pd.read_csv(historical_file)
    econ = pd.read_csv(economic_file)
    df = pd.merge(atx, econ, on="Date", how="inner")
    logging.info(f"Loaded {len(df)} records.")
    return df

def preprocess(df):
    """Preprocess data for ML model."""
    logging.info("Preprocessing data...")
    y = df["Close"]
    X = df.drop(columns=["Date", "Close"])
    return X, y

def save_model(model, path):
    """Save trained model to disk."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)
    logging.info(f"Model saved to {path}")
