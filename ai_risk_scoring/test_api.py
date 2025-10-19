#!/usr/bin/env python3
"""
Test script for the improved AI Risk Scoring API
"""
import requests
import json
from data_processing.feature_engineering import create_features, prepare_features_for_model
import pandas as pd

API_BASE = "http://127.0.0.1:5000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API Status: {data['status']}")
        print(f"✅ ML Model: {data['services']['ml_model']['status']}")
        print(f"✅ Manual Scorer: {data['services']['manual_scorer']['status']}")
    print()

def test_with_proper_features():
    """Test with properly formatted data including sector and region"""
    print("🔍 Testing with complete taxpayer data...")
    
    # Test data with sector and region (like training data)
    test_data = [
        {"amount": 8500, "sector": "Finance", "region": "Lusaka"},
        {"amount": 4000, "sector": "Retail", "region": "Ndola"}, 
        {"amount": 12000, "sector": "Mining", "region": "Kitwe"}
    ]
    
    # Create features like in training
    df = pd.DataFrame(test_data)
    features_df = create_features(df, group_by_taxpayer=False)
    X, _ = prepare_features_for_model(features_df, 'risk_label')
    
    # Convert to dict for API
    api_data = X.to_dict('records')
    
    print("📊 Features created:")
    print(f"   Columns: {list(X.columns)}")
    print(f"   Shape: {X.shape}")
    print()
    
    # Test ML prediction
    print("🤖 Testing ML prediction...")
    response = requests.post(
        f"{API_BASE}/predict/ml",
        json=api_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ ML Prediction successful!")
        print(f"   Risk scores: {result['risk_scores']}")
        print(f"   Method: {result['method']}")
    else:
        print(f"❌ Error: {response.text}")
    print()

def test_simple_manual_scoring():
    """Test manual scoring with just amount"""
    print("🔍 Testing simple manual scoring...")
    
    simple_data = [{"amount": 8500}]
    
    response = requests.post(
        f"{API_BASE}/predict/manual",
        json=simple_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Manual scoring successful!")
        print(f"   Risk scores: {result['risk_scores']}")
    else:
        print(f"❌ Error: {response.text}")
    print()

if __name__ == "__main__":
    print("🚀 Testing Improved AI Risk Scoring API\n")
    
    try:
        test_health()
        test_with_proper_features()  
        test_simple_manual_scoring()
        
        print("✅ API Testing Complete!")
        
    except requests.exceptions.ConnectionError:
        print("❌ API server not running. Start it with:")
        print("   python -m api.scoring_api")
    except Exception as e:
        print(f"❌ Test error: {e}")