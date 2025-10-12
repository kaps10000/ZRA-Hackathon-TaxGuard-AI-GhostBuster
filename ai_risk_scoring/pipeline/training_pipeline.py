from data_processing.data_loader import load_csv
from data_processing.feature_engineering import create_features
from models.model_training import ModelTrainer
import joblib

def run_training():
    income_df = load_csv('data/income_data.csv')
    features_df = create_features(income_df)
    X = features_df[['amount', 'transaction_count', 'avg_transaction']]
    y = features_df['risk_label']
    trainer = ModelTrainer()
    model = trainer.train(X, y)
    print('Model trained successfully')
    return model

if __name__ == '__main__':
    model=run_training()
    joblib.dump(model, 'models/risk_model.pkl')
    print("Model saved as models/risk_model.pkl")
