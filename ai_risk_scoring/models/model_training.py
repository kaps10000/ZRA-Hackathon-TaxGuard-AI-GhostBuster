from xgboost import XGBClassifier
import pandas as pd

class ModelTrainer:
    def __init__(self):
        self.model = XGBClassifier(use_label_encoder=False, eval_metric='logloss')

    def train(self, X: pd.DataFrame, y: pd.Series):
        self.model.fit(X, y)
        return self.model
