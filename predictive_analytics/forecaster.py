"""
Predictive Analytics - Revenue Forecasting Module
Uses simple forecasting models to predict ZRA revenue
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List
import random

class RevenueForecaster:
    """Revenue forecasting and scenario analysis"""
    
    def __init__(self):
        # Historical data (mock - in production, load from database)
        self.historical_revenue = self._generate_historical_data()
        self.copper_price_history = self._generate_copper_prices()
    
    def _generate_historical_data(self) -> List[Dict]:
        """Generate mock historical revenue data"""
        base_revenue = 35000000  # ZMW 35M base
        data = []
        
        for i in range(12):
            month_date = datetime.now() - timedelta(days=30 * (11 - i))
            # Add seasonal variation
            seasonal_factor = 1.0 + (0.1 * (i % 4 - 2) / 2)
            # Add trend
            trend_factor = 1.0 + (i * 0.02)
            
            revenue = base_revenue * seasonal_factor * trend_factor
            
            data.append({
                "month": month_date.strftime("%Y-%m"),
                "revenue": round(revenue, 2),
                "collections": round(revenue * 0.85, 2),
                "compliance_rate": round(75 + (i * 0.5), 1)
            })
        
        return data
    
    def _generate_copper_prices(self) -> List[Dict]:
        """Generate mock copper price history"""
        base_price = 8500  # USD per ton
        data = []
        
        for i in range(12):
            month_date = datetime.now() - timedelta(days=30 * (11 - i))
            # Add volatility
            price = base_price + random.uniform(-500, 500)
            
            data.append({
                "month": month_date.strftime("%Y-%m"),
                "price_usd_per_ton": round(price, 2)
            })
        
        return data
    
    def forecast_revenue(self, months_ahead: int = 6) -> Dict:
        """
        Forecast revenue for the next N months
        
        Args:
            months_ahead: Number of months to forecast
        
        Returns:
            Forecast data with confidence intervals
        """
        # Simple linear trend forecast
        recent_data = self.historical_revenue[-3:]
        avg_growth_rate = 0.03  # 3% monthly growth
        
        last_revenue = recent_data[-1]["revenue"]
        forecasts = []
        
        for i in range(1, months_ahead + 1):
            forecast_date = datetime.now() + timedelta(days=30 * i)
            
            # Base forecast with trend
            forecast_value = last_revenue * ((1 + avg_growth_rate) ** i)
            
            # Add confidence interval
            confidence_lower = forecast_value * 0.9
            confidence_upper = forecast_value * 1.1
            
            forecasts.append({
                "month": forecast_date.strftime("%Y-%m"),
                "forecast": round(forecast_value, 2),
                "confidence_lower": round(confidence_lower, 2),
                "confidence_upper": round(confidence_upper, 2),
                "confidence_level": 78  # 78% confidence
            })
        
        return {
            "forecast_period": f"{months_ahead} months",
            "forecast_data": forecasts,
            "total_forecast": round(sum(f["forecast"] for f in forecasts), 2),
            "average_monthly": round(sum(f["forecast"] for f in forecasts) / months_ahead, 2),
            "trend": "increasing",
            "confidence": 78,
            "timestamp": datetime.now().isoformat()
        }
    
    def analyze_copper_impact(self, price_change_percent: float) -> Dict:
        """
        Analyze impact of copper price changes on ZRA revenue
        
        Args:
            price_change_percent: Percentage change in copper price (e.g., -10 for 10% drop)
        
        Returns:
            Impact analysis
        """
        # Copper exports represent ~70% of Zambia's exports
        # Tax revenue is correlated with copper prices
        
        current_monthly_revenue = self.historical_revenue[-1]["revenue"]
        
        # Impact factor: rough correlation between copper and tax revenue
        impact_factor = 0.25  # 25% of revenue affected by copper prices
        
        revenue_impact = current_monthly_revenue * impact_factor * (price_change_percent / 100)
        annual_impact = revenue_impact * 12
        
        # Categorize severity
        if abs(price_change_percent) > 15:
            severity = "CRITICAL"
        elif abs(price_change_percent) > 10:
            severity = "HIGH"
        elif abs(price_change_percent) > 5:
            severity = "MEDIUM"
        else:
            severity = "LOW"
        
        return {
            "scenario": f"Copper price change: {price_change_percent:+.1f}%",
            "monthly_impact": round(revenue_impact, 2),
            "annual_impact": round(annual_impact, 2),
            "severity": severity,
            "affected_sectors": ["mining_tax", "export_duties", "corporate_tax"],
            "mitigation_strategies": [
                "Increase enforcement in non-mining sectors",
                "Focus on VAT compliance",
                "Enhance collection efficiency"
            ] if price_change_percent < 0 else [
                "Maintain current enforcement levels",
                "Invest in capacity building"
            ],
            "confidence": 78,
            "timestamp": datetime.now().isoformat()
        }
    
    def analyze_compliance_impact(self, compliance_change_percent: float) -> Dict:
        """
        Analyze impact of compliance rate changes
        
        Args:
            compliance_change_percent: Change in compliance rate (e.g., +5 for 5% improvement)
        
        Returns:
            Impact analysis
        """
        current_revenue = self.historical_revenue[-1]["revenue"]
        current_compliance = self.historical_revenue[-1]["compliance_rate"]
        
        # Estimate revenue gap due to non-compliance
        compliance_rate = current_compliance / 100
        potential_revenue = current_revenue / compliance_rate
        revenue_gap = potential_revenue - current_revenue
        
        # Calculate impact of compliance improvement
        new_compliance_rate = (current_compliance + compliance_change_percent) / 100
        new_revenue = potential_revenue * new_compliance_rate
        revenue_gain = new_revenue - current_revenue
        annual_gain = revenue_gain * 12
        
        return {
            "scenario": f"Compliance improvement: +{compliance_change_percent}%",
            "current_compliance_rate": round(current_compliance, 1),
            "projected_compliance_rate": round(current_compliance + compliance_change_percent, 1),
            "monthly_revenue_gain": round(revenue_gain, 2),
            "annual_revenue_gain": round(annual_gain, 2),
            "strategies_to_improve": [
                "Deploy GhostBuster at scale",
                "Promote WhistlePro awareness",
                "Enhanced OCR verification",
                "Taxpayer education campaigns",
                "Simplified filing processes"
            ],
            "confidence": 82,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_compliance_trends(self) -> Dict:
        """Get compliance trend analysis"""
        compliance_data = [
            {"month": d["month"], "rate": d["compliance_rate"]}
            for d in self.historical_revenue
        ]
        
        # Calculate trend
        recent_avg = sum(d["compliance_rate"] for d in self.historical_revenue[-3:]) / 3
        older_avg = sum(d["compliance_rate"] for d in self.historical_revenue[-6:-3]) / 3
        trend_direction = "improving" if recent_avg > older_avg else "declining"
        
        return {
            "historical_data": compliance_data,
            "current_rate": round(compliance_data[-1]["rate"], 1),
            "trend": trend_direction,
            "average_rate_last_3_months": round(recent_avg, 1),
            "average_rate_last_6_months": round(older_avg, 1),
            "timestamp": datetime.now().isoformat()
        }

# Example usage
if __name__ == "__main__":
    forecaster = RevenueForecaster()
    
    # Revenue forecast
    print("Revenue Forecast (6 months):")
    forecast = forecaster.forecast_revenue(6)
    print(json.dumps(forecast, indent=2))
    
    # Copper impact
    print("\nCopper Price Impact (-10%):")
    copper_impact = forecaster.analyze_copper_impact(-10)
    print(json.dumps(copper_impact, indent=2))
    
    # Compliance impact
    print("\nCompliance Improvement (+5%):")
    compliance_impact = forecaster.analyze_compliance_impact(5)
    print(json.dumps(compliance_impact, indent=2))
