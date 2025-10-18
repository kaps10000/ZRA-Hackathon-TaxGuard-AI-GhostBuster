import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

class RiskScorer:
    def __init__(self):
        self.scaler = StandardScaler()

    def compute_risk_score(self, features: pd.DataFrame) -> pd.Series:
        scaled = self.scaler.fit_transform(features)
        risk_scores = np.clip(np.mean(scaled, axis=1) * 25 + 50, 0, 100)
        return pd.Series(risk_scores, index=features.index)
