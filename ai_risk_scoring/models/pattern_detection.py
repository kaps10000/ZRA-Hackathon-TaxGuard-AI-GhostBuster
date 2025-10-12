import pandas as pd

def detect_anomalies(transactions: pd.DataFrame) -> pd.DataFrame:
    if 'amount' not in transactions.columns:
        raise ValueError('Missing column: amount')
    threshold = transactions['amount'].mean() + 3 * transactions['amount'].std()
    anomalies = transactions[transactions['amount'] > threshold]
    return anomalies
