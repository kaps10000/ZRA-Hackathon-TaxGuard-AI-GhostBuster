from models.risk_scoring import RiskScorer
from data_processing.feature_engineering import create_features
from data_processing.data_loader import load_csv

def run_scoring():
    income_df = load_csv('data/income_data.csv')
    features_df = create_features(income_df)
    scorer = RiskScorer()
    X = features_df[['amount', 'transaction_count', 'avg_transaction']]
    features_df['risk_score'] = scorer.compute_risk_score(X)
    features_df.sort_values('risk_score', ascending=False, inplace=True)
    print(features_df[['taxpayer_id', 'risk_score']])
    return features_df

if __name__ == '__main__':
    run_scoring()
