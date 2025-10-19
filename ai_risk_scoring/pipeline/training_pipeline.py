from data_processing.data_loader import load_csv
from data_processing.feature_engineering import create_features, prepare_features_for_model
from models.model_training import ModelTrainer
from models.risk_scoring import RiskScorer
import joblib
import os

def run_training():
    # Load data
    income_df = load_csv('data/income_data.csv')
    print(f"Loaded {len(income_df)} records")
    
    # Create features (don't group by taxpayer since each row is already one taxpayer)
    features_df = create_features(income_df, group_by_taxpayer=False)
    print(f"Created features: {list(features_df.columns)}")
    
    # Prepare features for model
    X, y = prepare_features_for_model(features_df, 'risk_label')
    print(f"Training features shape: {X.shape}")
    print(f"Feature columns: {list(X.columns)}")
    
    # Train model
    trainer = ModelTrainer()
    model = trainer.train(X, y)
    print('✅ Model trained successfully')
    
    # Also train and save the scaler for manual scoring
    scorer = RiskScorer()
    scorer.fit_scaler(X)
    print('✅ Scaler trained and saved')
    
    return model

if __name__ == '__main__':
    model=run_training()
    joblib.dump(model, 'models/risk_model.pkl')
    print("Model saved as models/risk_model.pkl")
