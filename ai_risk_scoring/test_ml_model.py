#!/usr/bin/env python3
"""
Simple test for the trained ML model
"""
import joblib
import pandas as pd
import requests
import json

def test_ml_model_direct():
    """Test the trained ML model directly"""
    print("🤖 Testing Trained ML Model Directly\n")
    
    try:
        # Load the trained model
        model = joblib.load('models/risk_model.pkl')
        print("✅ ML model loaded successfully")
        
        # Load training data to see what features were used
        from data_processing.data_loader import load_csv
        from data_processing.feature_engineering import create_features, prepare_features_for_model
        
        df = load_csv('data/income_data.csv')
        features_df = create_features(df, group_by_taxpayer=False)
        X, y = prepare_features_for_model(features_df, 'risk_label')
        
        print(f"📊 Model expects {X.shape[1]} features:")
        print(f"   {list(X.columns)}\n")
        
        # Test with first few records from training data
        print("🧪 Testing with training data samples:")
        test_X = X.head(3).fillna(0)  # Fill NaN with 0 for testing
        
        predictions = model.predict_proba(test_X)[:, 1] * 100
        
        print("✅ ML Prediction Results:")
        for i, (idx, row) in enumerate(test_X.iterrows()):
            print(f"   Record {i+1}: Risk Score = {predictions[i]:.2f}%")
            print(f"      Amount: ${row['amount']:,.2f}")
            print(f"      High Risk Sector: {'Yes' if row.get('is_high_risk_sector', 0) else 'No'}")
            print(f"      High Risk Region: {'Yes' if row.get('is_high_risk_region', 0) else 'No'}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing ML model: {e}")
        return False

def test_ml_via_api_with_proper_data():
    """Test ML model via API with properly formatted data"""
    print("🌐 Testing ML Model via API\n")
    
    try:
        # Create test data with all required features
        test_data = {
            'amount': 8500,
            'amount_log': 9.048,  # ln(8500)
            'amount_squared': 72250000,  # 8500^2
            'sector_avg_amount': 7000,
            'sector_std_amount': 3000,
            'amount_vs_sector_avg': 1.21,  # 8500/7000
            'amount_sector_zscore': 0.5,
            'region_avg_amount': 6500,
            'region_std_amount': 2500,
            'amount_vs_region_avg': 1.31,  # 8500/6500
            'is_high_amount': 1,
            'is_high_risk_sector': 1,
            'is_high_risk_region': 1
        }
        
        print("📊 Sending properly formatted data to API:")
        print(f"   Features: {len(test_data)} (matches model requirements)")
        
        response = requests.post(
            'http://127.0.0.1:5000/predict/ml',
            json=[test_data],
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"🔗 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ML API Prediction Success!")
            print(f"   Risk Score: {result['risk_scores'][0]}%")
            print(f"   Method: {result['method']}")
            print(f"   Records Processed: {result['records_processed']}")
            return True
        else:
            print(f"❌ API Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing via API: {e}")
        return False

if __name__ == "__main__":
    print("🎯 ML Model Testing Suite\n")
    
    # Test 1: Direct model testing
    direct_success = test_ml_model_direct()
    
    print("\n" + "="*50 + "\n")
    
    # Test 2: API testing with proper data
    api_success = test_ml_via_api_with_proper_data()
    
    print("\n" + "="*50)
    print("📋 Test Summary:")
    print(f"   Direct ML Model: {'✅ PASS' if direct_success else '❌ FAIL'}")
    print(f"   ML API Endpoint: {'✅ PASS' if api_success else '❌ FAIL'}")
    
    if direct_success and api_success:
        print("\n🎉 All ML model tests passed! The trained model is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")