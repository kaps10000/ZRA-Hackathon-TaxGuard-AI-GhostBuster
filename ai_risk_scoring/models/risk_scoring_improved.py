import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Optional

class RiskScorer:
    def __init__(self, scaler_path: str = "models/risk_scaler.pkl"):
        self.scaler_path = scaler_path
        self.scaler = None
        self._load_or_create_scaler()
    
    def _load_or_create_scaler(self):
        """Load existing scaler or create new one"""
        if os.path.exists(self.scaler_path):
            try:
                self.scaler = joblib.load(self.scaler_path)
                print(f"✅ Scaler loaded from {self.scaler_path}")
            except Exception as e:
                print(f"⚠️ Error loading scaler: {e}. Creating new one.")
                self.scaler = StandardScaler()
        else:
            self.scaler = StandardScaler()
            print("📊 New scaler created")
    
    def fit_scaler(self, features: pd.DataFrame):
        """Fit scaler on training data and save it"""
        self.scaler.fit(features)
        os.makedirs(os.path.dirname(self.scaler_path), exist_ok=True)
        joblib.dump(self.scaler, self.scaler_path)
        print(f"💾 Scaler fitted and saved to {self.scaler_path}")
    
    def compute_risk_score(self, features: pd.DataFrame) -> pd.Series:
        """
        Compute risk scores using improved algorithm
        """
        if self.scaler is None:
            raise ValueError("Scaler not initialized. Fit scaler first.")
        
        try:
            # Validate input
            if features.empty:
                raise ValueError("Empty features DataFrame")
            
            # Transform features
            scaled_features = self.scaler.transform(features)
            
            # Improved risk scoring algorithm
            # Use weighted combination of features and add sector/region risk factors
            risk_scores = []
            
            for i, row in enumerate(scaled_features):
                # Base score from standardized features
                base_score = np.mean(np.abs(row)) * 30 + 30
                
                # Add feature-specific weights if available
                if 'amount' in features.columns:
                    amount_idx = features.columns.get_loc('amount')
                    amount_risk = min(abs(row[amount_idx]) * 15, 25)
                    base_score += amount_risk
                
                # Clip to valid range
                risk_scores.append(np.clip(base_score, 0, 100))
            
            return pd.Series(risk_scores, index=features.index)
            
        except Exception as e:
            raise ValueError(f"Error computing risk scores: {e}")
    
    def compute_sector_region_risk(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add sector and region-based risk factors
        """
        df_copy = df.copy()
        
        # Sector risk mapping (based on business domain knowledge)
        sector_risk = {
            'Mining': 0.8, 'Finance': 0.7, 'Energy': 0.6,
            'Manufacturing': 0.5, 'IT': 0.4, 'Transport': 0.4,
            'Tourism': 0.3, 'Retail': 0.2, 'Agriculture': 0.1
        }
        
        # Region risk mapping (based on compliance history)
        region_risk = {
            'Lusaka': 0.6, 'Ndola': 0.4, 'Kitwe': 0.3, 'Chipata': 0.2
        }
        
        df_copy['sector_risk'] = df_copy['sector'].map(sector_risk).fillna(0.5)
        df_copy['region_risk'] = df_copy['region'].map(region_risk).fillna(0.5)
        
        return df_copy