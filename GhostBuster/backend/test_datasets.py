#!/usr/bin/env python3
"""
Test script to diagnose GhostBuster dataset loading issues
"""

import os
import pandas as pd
from detection_engine import GhostBusterEngine

def test_csv_files():
    """Test if CSV files can be loaded directly"""
    print("=" * 60)
    print("TESTING CSV FILES DIRECTLY")
    print("=" * 60)
    
    data_dir = "data"
    files = [
        "napsa_contributions.csv",
        "home_affairs_registry.csv", 
        "bank_transactions.csv",
        "master_records.csv"
    ]
    
    for filename in files:
        filepath = os.path.join(data_dir, filename)
        print(f"\nTesting: {filepath}")
        
        if not os.path.exists(filepath):
            print(f"  ❌ FILE NOT FOUND: {filepath}")
            continue
            
        try:
            df = pd.read_csv(filepath)
            print(f"  ✅ Loaded successfully: {len(df)} rows, {len(df.columns)} columns")
            print(f"  📋 Columns: {list(df.columns)}")
            
            # Check for date columns
            date_cols = [col for col in df.columns if 'date' in col.lower()]
            if date_cols:
                print(f"  📅 Date columns found: {date_cols}")
                for col in date_cols:
                    print(f"    - {col}: Sample values: {df[col].head(3).tolist()}")
                    
        except Exception as e:
            print(f"  ❌ ERROR loading {filename}: {e}")

def test_detection_engine():
    """Test the detection engine initialization"""
    print("\n" + "=" * 60)
    print("TESTING DETECTION ENGINE")
    print("=" * 60)
    
    try:
        print("Creating GhostBusterEngine instance...")
        engine = GhostBusterEngine()
        print("✅ Engine created successfully")
        
        print("\nAttempting to load datasets...")
        result = engine.load_datasets()
        
        if result:
            print("✅ Datasets loaded successfully!")
            print(f"  - NAPSA records: {len(engine.napsa_df) if engine.napsa_df is not None else 'None'}")
            print(f"  - Home Affairs records: {len(engine.home_affairs_df) if engine.home_affairs_df is not None else 'None'}")
            print(f"  - Bank records: {len(engine.bank_df) if engine.bank_df is not None else 'None'}")
            print(f"  - Master records: {len(engine.master_df) if engine.master_df is not None else 'None'}")
        else:
            print("❌ Dataset loading failed!")
            
    except Exception as e:
        print(f"❌ ERROR with detection engine: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("GhostBuster Dataset Diagnostic Tool")
    print("Current directory:", os.getcwd())
    
    test_csv_files()
    test_detection_engine()
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)
