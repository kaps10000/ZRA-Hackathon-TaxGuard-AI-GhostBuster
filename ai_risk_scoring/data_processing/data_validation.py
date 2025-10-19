import pandas as pd

def validate_data(df: pd.DataFrame) -> bool:
    return not df.isnull().any().any()
