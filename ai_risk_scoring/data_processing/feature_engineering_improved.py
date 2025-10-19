import pandas as pd
import numpy as np
from typing import Optional

def create_features(df: pd.DataFrame, group_by_taxpayer: bool = True) -> pd.DataFrame:
    """
    Create meaningful features for risk scoring
    
    Args:
        df: Input DataFrame with taxpayer data
        group_by_taxpayer: Whether to group by taxpayer_id (for multi-transaction data)
    
    Returns:
        DataFrame with engineered features
    """
    df_features = df.copy()
    
    if group_by_taxpayer and 'taxpayer_id' in df.columns:
        # For multi-transaction data, aggregate by taxpayer
        grouped_features = df.groupby('taxpayer_id').agg({
            'amount': ['sum', 'mean', 'std', 'count', 'min', 'max'],
        }).round(2)
        
        # Flatten column names
        grouped_features.columns = [
            'total_amount', 'avg_amount', 'amount_std', 
            'transaction_count', 'min_amount', 'max_amount'
        ]
        
        # Calculate additional risk indicators
        grouped_features['amount_volatility'] = (
            grouped_features['amount_std'] / grouped_features['avg_amount']
        ).fillna(0)
        
        grouped_features['large_transaction_ratio'] = (
            grouped_features['max_amount'] / grouped_features['avg_amount']
        ).fillna(1)
        
        # Reset index to make taxpayer_id a column
        grouped_features = grouped_features.reset_index()
        
        # Merge with original categorical data (sector, region)
        categorical_cols = ['sector', 'region', 'risk_label']
        if any(col in df.columns for col in categorical_cols):
            taxpayer_info = df.groupby('taxpayer_id')[
                [col for col in categorical_cols if col in df.columns]
            ].first().reset_index()
            
            df_features = grouped_features.merge(taxpayer_info, on='taxpayer_id', how='left')
        else:
            df_features = grouped_features
            
    else:
        # For single-transaction per taxpayer data, create derived features
        df_features['amount_log'] = np.log1p(df_features['amount'])  # Log transform
        df_features['amount_squared'] = df_features['amount'] ** 2  # Polynomial feature
        
        # Sector-based features
        if 'sector' in df_features.columns:
            sector_stats = df_features.groupby('sector')['amount'].agg(['mean', 'std']).reset_index()
            sector_stats.columns = ['sector', 'sector_avg_amount', 'sector_std_amount']
            df_features = df_features.merge(sector_stats, on='sector', how='left')
            
            # Amount deviation from sector average
            df_features['amount_vs_sector_avg'] = (
                df_features['amount'] / df_features['sector_avg_amount']
            ).fillna(1)
            
            # Z-score within sector
            df_features['amount_sector_zscore'] = (
                (df_features['amount'] - df_features['sector_avg_amount']) / 
                df_features['sector_std_amount']
            ).fillna(0)
        
        # Region-based features
        if 'region' in df_features.columns:
            region_stats = df_features.groupby('region')['amount'].agg(['mean', 'std']).reset_index()
            region_stats.columns = ['region', 'region_avg_amount', 'region_std_amount']
            df_features = df_features.merge(region_stats, on='region', how='left')
            
            # Amount deviation from region average
            df_features['amount_vs_region_avg'] = (
                df_features['amount'] / df_features['region_avg_amount']
            ).fillna(1)
    
    # Add risk indicators based on business rules
    df_features = add_business_risk_features(df_features)
    
    return df_features

def add_business_risk_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add business-specific risk indicators
    """
    df_risk = df.copy()
    
    # High amount threshold (above 90th percentile)
    if 'amount' in df_risk.columns:
        high_amount_threshold = df_risk['amount'].quantile(0.9)
        df_risk['is_high_amount'] = (df_risk['amount'] > high_amount_threshold).astype(int)
        
        # Amount categories
        df_risk['amount_category'] = pd.cut(
            df_risk['amount'], 
            bins=[0, 5000, 10000, 15000, float('inf')],
            labels=['Low', 'Medium', 'High', 'Very High']
        )
    
    # Sector risk mapping (based on compliance history)
    if 'sector' in df_risk.columns:
        high_risk_sectors = ['Mining', 'Finance', 'Energy']
        df_risk['is_high_risk_sector'] = (
            df_risk['sector'].isin(high_risk_sectors)
        ).astype(int)
    
    # Region risk mapping
    if 'region' in df_risk.columns:
        high_risk_regions = ['Lusaka']  # Capital with more complex transactions
        df_risk['is_high_risk_region'] = (
            df_risk['region'].isin(high_risk_regions)
        ).astype(int)
    
    return df_risk

def prepare_features_for_model(df: pd.DataFrame, target_col: str = 'risk_label') -> tuple[pd.DataFrame, Optional[pd.Series]]:
    """
    Prepare features for ML model training/prediction
    
    Args:
        df: DataFrame with all features
        target_col: Name of target variable column
    
    Returns:
        Tuple of (features DataFrame, target Series or None)
    """
    # Separate features and target
    feature_cols = [col for col in df.columns if col not in [
        'taxpayer_id', target_col, 'sector', 'region', 'amount_category'
    ]]
    
    # Select only numeric features
    X = df[feature_cols].select_dtypes(include=[np.number])
    
    # Fill NaN values with column medians
    X = X.fillna(X.median())
    
    # Get target if it exists
    y = df[target_col] if target_col in df.columns else None
    
    return X, y

def validate_features(df: pd.DataFrame) -> tuple[bool, str]:
    """
    Validate feature DataFrame
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if df.empty:
        return False, "Empty DataFrame"
    
    # Check for all NaN columns
    all_nan_cols = df.columns[df.isnull().all()].tolist()
    if all_nan_cols:
        return False, f"Columns with all NaN values: {all_nan_cols}"
    
    # Check for infinite values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    inf_cols = []
    for col in numeric_cols:
        if np.isinf(df[col]).any():
            inf_cols.append(col)
    
    if inf_cols:
        return False, f"Columns with infinite values: {inf_cols}"
    
    return True, "Valid"