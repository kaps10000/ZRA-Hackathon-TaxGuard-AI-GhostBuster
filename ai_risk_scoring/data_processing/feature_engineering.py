import pandas as pd

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    df_features = df.copy()
    df_features['transaction_count'] = df_features.groupby('taxpayer_id')['amount'].transform('count')
    df_features['avg_transaction'] = df_features.groupby('taxpayer_id')['amount'].transform('mean')
    df_features = df_features.drop_duplicates('taxpayer_id')
    return df_features
