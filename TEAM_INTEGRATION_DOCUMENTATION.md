# 🤝 TaxGuard Blockchain - Team Integration Documentation

## Overview
This document provides comprehensive integration guides for connecting all TaxGuard AI GhostBuster team modules with the blockchain ledger system.

**Blockchain Module Lead:** Kaps
**Integration Version:** 1.0.0
**Last Updated:** October 2, 2025

---

## 🎯 Team Members & Integrations

| Team Member | Module | Integration API | Status |
|-------------|--------|----------------|--------|
| **Ezra** | GhostBuster | `/api/ghostbuster` | ✅ Ready |
| **Kelvin** | WhistlePro Backend | `/api/whistlepro` | ✅ Ready |
| **Ephraim** | WhistlePro Frontend | `/api/whistlepro` | ✅ Ready |
| **Shuan** | AI Risk Scoring | `/api/ai-risk` | ✅ Ready |
| **Emmanuel** | Predictive Analytics | `/api/predictive` | ✅ Ready |
| **Thomas** | Dashboard & Integration | `/api/dashboard-feed` | ✅ Ready |
| **Kaps** | Blockchain Ledger | `/api/events` | ✅ Core System |
| **Mubanga** | Data & QA | All endpoints | ✅ Testing Ready |

---

## 🔗 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TaxGuard Blockchain API                  │
│                    http://localhost:3001                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │GhostBust│          │Whistle  │          │AI Risk  │
   │  Ezra   │          │Pro Team │          │ Shuan   │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │Predict  │          │Dashboard│          │Data/QA  │
   │Emmanuel │          │ Thomas  │          │Mubanga  │
   └─────────┘          └─────────┘          └─────────┘
```

---

## 1️⃣ GhostBuster Integration (Ezra)

### **Purpose**
Record phantom employee and ghost company detections on the blockchain for immutable audit trails.

### **Base URL**
```
http://localhost:3001/api/ghostbuster
```

### **Endpoints**

#### **POST /detection** - Record a Detection
Submit a phantom employee or ghost company detection to the blockchain.

**Request Body:**
```json
{
  "detectionType": "phantom_employee",
  "entityId": "TPN-XXXXX-anonymized",
  "confidenceScore": 95,
  "detectionMethod": "pattern_analysis",
  "indicators": [
    "No biometric records",
    "Multiple employees same address",
    "Salary exceeds position grade"
  ],
  "severity": "HIGH",
  "investigatorId": "ghostbuster-ai",
  "evidenceHash": "a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
  "metadata": {
    "department": "Ministry of Finance",
    "detectionDate": "2025-10-02",
    "algorithmVersion": "v2.3"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phantom detection recorded on blockchain",
  "detection": {
    "detectionId": "d7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a",
    "blockchainEventId": "evt-detection-001",
    "blockIndex": 152,
    "evidenceHash": "a3f7e92b...",
    "timestamp": "2025-10-02T10:30:00Z"
  }
}
```

#### **GET /detections** - Get All Detections
Retrieve all recorded detections with optional filtering.

**Query Parameters:**
- `detectionType` - Filter by type: `phantom_employee` or `ghost_company`
- `severity` - Filter by severity: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `status` - Filter by review status: `pending`, `confirmed`, `false_positive`
- `limit` - Limit results (default: all)

**Example:**
```bash
GET /api/ghostbuster/detections?severity=HIGH&limit=10
```

#### **GET /detection/:detectionId** - Get Detection Details
Retrieve full details of a specific detection including blockchain verification.

#### **PUT /detection/:detectionId/review** - Update Review Status
Update the review status of a detection.

**Request Body:**
```json
{
  "reviewStatus": "confirmed",
  "reviewerId": "auditor-123",
  "reviewNotes": "Verified with HR records. Phantom confirmed."
}
```

#### **GET /stats** - Detection Statistics
Get summary statistics for all detections.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 47,
    "byType": {
      "phantom_employee": 32,
      "ghost_company": 15
    },
    "bySeverity": {
      "CRITICAL": 5,
      "HIGH": 18,
      "MEDIUM": 20,
      "LOW": 4
    },
    "averageConfidence": "87.3"
  }
}
```

### **Integration Code Example (Python)**
```python
import requests
import hashlib
import json

BLOCKCHAIN_API = "http://localhost:3001/api/ghostbuster"

def submit_detection(detection_data):
    # Hash the evidence bundle
    evidence_hash = hashlib.sha256(
        json.dumps(detection_data).encode()
    ).hexdigest()

    payload = {
        "detectionType": "phantom_employee",
        "entityId": detection_data["tpn"],
        "confidenceScore": detection_data["score"],
        "detectionMethod": "pattern_analysis",
        "indicators": detection_data["red_flags"],
        "evidenceHash": evidence_hash
    }

    response = requests.post(
        f"{BLOCKCHAIN_API}/detection",
        json=payload
    )

    return response.json()

# Usage
detection = {
    "tpn": "TPN-12345-ANON",
    "score": 95,
    "red_flags": ["No biometric", "Duplicate address"]
}

result = submit_detection(detection)
print(f"Detection ID: {result['detection']['detectionId']}")
print(f"Blockchain Block: {result['detection']['blockIndex']}")
```

---

## 2️⃣ WhistlePro Integration (Kelvin & Ephraim)

### **Purpose**
Store anonymous whistleblower reports on the blockchain with full privacy protection and tamper-proof audit trails.

### **Base URL**
```
http://localhost:3001/api/whistlepro
```

### **Endpoints**

#### **POST /report** - Submit Whistleblower Report
Submit an anonymous report with end-to-end encryption.

**Request Body:**
```json
{
  "reportType": "tax_evasion",
  "targetEntity": "Company-XXXXX-anonymized",
  "severity": "HIGH",
  "description": "[encrypted on client-side]",
  "evidenceHash": "b4c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
  "estimatedAmount": "500000",
  "location": "Lusaka-Province",
  "whistleblowerKey": "public-key-for-followup",
  "metadata": {
    "submissionChannel": "web",
    "deviceType": "desktop"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Whistleblower report submitted successfully",
  "report": {
    "reportId": "e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b",
    "caseCode": "WP-2025-A3F7E9",
    "blockchainEventId": "evt-whistlepro-001",
    "blockIndex": 153,
    "timestamp": "2025-10-02T11:15:00Z",
    "trackingUrl": "/api/whistlepro/track/WP-2025-A3F7E9"
  },
  "security": {
    "anonymityProtected": true,
    "blockchainVerified": true,
    "tamperProof": true
  }
}
```

**Important:** Give the `caseCode` to the whistleblower so they can track their report anonymously.

#### **GET /track/:caseCode** - Track Report Status (Public)
Allow whistleblowers to check their report status using only the case code (no authentication required).

**Example:**
```bash
GET /api/whistlepro/track/WP-2025-A3F7E9
```

**Response:**
```json
{
  "success": true,
  "caseCode": "WP-2025-A3F7E9",
  "status": "submitted",
  "reviewStatus": "under_review",
  "priority": "HIGH",
  "submittedAt": "2025-10-02T11:15:00Z",
  "lastUpdated": "2025-10-02T14:30:00Z",
  "updates": [
    {
      "timestamp": "2025-10-02T14:30:00Z",
      "publicUpdate": "Your report is being reviewed by investigators"
    }
  ]
}
```

#### **GET /reports** - Get All Reports (Admin)
Retrieve all submitted reports for investigation management.

**Query Parameters:**
- `reportType` - Filter by type: `tax_evasion`, `fraud`, `corruption`, `money_laundering`
- `severity` - Filter by severity: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `status` - Filter by status: `pending`, `under_review`, `investigating`, `verified`
- `priority` - Filter by priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

#### **PUT /report/:reportId/update** - Update Report Status (Admin)
Update the investigation status and add public updates for whistleblowers.

**Request Body:**
```json
{
  "reviewStatus": "investigating",
  "assignedTo": "investigator-456",
  "publicUpdate": "Investigation opened. Evidence being reviewed.",
  "notes": "Internal: Cross-referencing with GhostBuster data"
}
```

#### **POST /verify/:caseCode** - Verify Report Integrity
Verify that a report hasn't been tampered with using the case code and evidence hash.

**Request Body:**
```json
{
  "evidenceHash": "b4c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8"
}
```

#### **GET /stats** - WhistlePro Statistics
Get summary statistics for all reports.

### **Integration Code Example (Node.js/Express - Backend)**
```javascript
const axios = require('axios');
const crypto = require('crypto');

const BLOCKCHAIN_API = 'http://localhost:3001/api/whistlepro';

async function submitWhistleblowerReport(reportData) {
    // Encrypt description on client-side (use your encryption method)
    const encryptedDescription = encryptData(reportData.description);

    // Hash the evidence bundle
    const evidenceHash = crypto.createHash('sha256')
        .update(JSON.stringify(reportData.evidence))
        .digest('hex');

    const payload = {
        reportType: reportData.type,
        targetEntity: reportData.target,
        severity: reportData.severity,
        description: encryptedDescription,
        evidenceHash: evidenceHash,
        estimatedAmount: reportData.amount,
        metadata: {
            submissionChannel: 'web',
            ipScrubbed: true // Never log IP addresses
        }
    };

    const response = await axios.post(`${BLOCKCHAIN_API}/report`, payload);

    return {
        caseCode: response.data.report.caseCode,
        trackingUrl: response.data.report.trackingUrl
    };
}

// Usage
const report = {
    type: 'tax_evasion',
    target: 'Company-ABC-ANON',
    severity: 'HIGH',
    description: 'Company not declaring full revenue',
    evidence: { documents: ['doc1.pdf', 'doc2.pdf'] },
    amount: 500000
};

submitWhistleblowerReport(report).then(result => {
    console.log(`Case Code: ${result.caseCode}`);
    console.log(`Track at: ${result.trackingUrl}`);
});
```

### **Integration Code Example (React - Frontend)**
```javascript
import axios from 'axios';

const BLOCKCHAIN_API = 'http://localhost:3001/api/whistlepro';

const WhistleblowerForm = () => {
    const [caseCode, setCaseCode] = useState(null);

    const submitReport = async (formData) => {
        try {
            const response = await axios.post(`${BLOCKCHAIN_API}/report`, {
                reportType: formData.type,
                targetEntity: formData.company,
                severity: formData.severity,
                description: formData.description,
                evidenceHash: formData.evidenceHash
            });

            // Show case code to user (SAVE THIS!)
            setCaseCode(response.data.report.caseCode);

            alert(`Report submitted! Your case code is: ${response.data.report.caseCode}`);
        } catch (error) {
            console.error('Submission failed:', error);
        }
    };

    return (
        <div>
            {/* Form UI */}
            {caseCode && (
                <div className="case-code-display">
                    <h3>⚠️ SAVE THIS CASE CODE!</h3>
                    <p>{caseCode}</p>
                    <p>Use it to track your report anonymously</p>
                </div>
            )}
        </div>
    );
};
```

---

## 3️⃣ AI Risk Scoring Integration (Shuan)

### **Purpose**
Record ML-based risk assessments on the blockchain for transparency and accountability.

### **Base URL**
```
http://localhost:3001/api/ai-risk
```

### **Endpoints**

#### **POST /assessment** - Submit Risk Assessment
Submit an AI-generated risk score to the blockchain.

**Request Body:**
```json
{
  "taxpayerId": "TPN-67890-ANON",
  "riskScore": 87,
  "riskLevel": "HIGH",
  "modelVersion": "v2.5.1",
  "features": {
    "filing_consistency": 0.45,
    "payment_history": 0.72,
    "declaration_accuracy": 0.38,
    "audit_history": 0.91
  },
  "predictions": {
    "evasion_probability": 0.87,
    "compliance_likelihood": 0.13
  },
  "confidence": 92,
  "riskFactors": [
    "Inconsistent revenue reporting",
    "Late payment history",
    "Previous audit flags"
  ],
  "recommendations": [
    "Schedule compliance audit",
    "Request supporting documentation",
    "Monitor quarterly filings"
  ],
  "dataHash": "c5d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9",
  "metadata": {
    "processingTime": "450ms",
    "dataPoints": 247
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Risk assessment recorded on blockchain",
  "assessment": {
    "assessmentId": "f9a0b1c2-d3e4-5f6a-7b8c-9d0e1f2a3b4c",
    "blockchainEventId": "evt-ai-risk-001",
    "blockIndex": 154,
    "riskScore": 87,
    "riskLevel": "HIGH",
    "timestamp": "2025-10-02T12:00:00Z"
  }
}
```

#### **GET /assessments** - Get All Assessments
Retrieve risk assessments with filtering options.

**Query Parameters:**
- `riskLevel` - Filter by level: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `modelVersion` - Filter by ML model version
- `minScore` - Minimum risk score (0-100)
- `maxScore` - Maximum risk score (0-100)

#### **GET /taxpayer/:taxpayerId/history** - Get Risk History
Retrieve all risk assessments for a specific taxpayer to track trends.

**Response:**
```json
{
  "success": true,
  "taxpayerId": "TPN-67890-ANON",
  "count": 12,
  "latestRiskScore": 87,
  "latestRiskLevel": "HIGH",
  "averageRiskScore": "76.5",
  "trend": "increasing",
  "history": [...]
}
```

#### **POST /batch-assessment** - Batch Risk Scoring
Submit multiple risk assessments at once for efficiency.

**Request Body:**
```json
{
  "assessments": [
    {
      "taxpayerId": "TPN-001",
      "riskScore": 85,
      "dataHash": "..."
    },
    {
      "taxpayerId": "TPN-002",
      "riskScore": 42,
      "dataHash": "..."
    }
  ]
}
```

#### **GET /stats** - AI Risk Statistics
Get summary statistics for all risk assessments.

#### **POST /model/update** - Record Model Update
Log ML model updates/retraining on the blockchain for audit trails.

**Request Body:**
```json
{
  "modelVersion": "v2.6.0",
  "updateType": "retrain",
  "performance": {
    "accuracy": 0.94,
    "precision": 0.91,
    "recall": 0.89,
    "f1Score": 0.90
  },
  "changesHash": "d6e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0",
  "notes": "Retrained with Q3 2025 data. Improved fraud detection by 7%."
}
```

### **Integration Code Example (Python/scikit-learn)**
```python
import requests
import hashlib
import json
import joblib

BLOCKCHAIN_API = "http://localhost:3001/api/ai-risk"

def submit_risk_assessment(taxpayer_id, features, model):
    # Generate prediction
    risk_score = model.predict_proba([features])[0][1] * 100

    # Get feature importance
    feature_importance = dict(zip(
        feature_names,
        model.feature_importances_
    ))

    # Hash input data
    data_hash = hashlib.sha256(
        json.dumps(features).encode()
    ).hexdigest()

    payload = {
        "taxpayerId": taxpayer_id,
        "riskScore": int(risk_score),
        "modelVersion": "v2.5.1",
        "features": feature_importance,
        "confidence": 92,
        "dataHash": data_hash,
        "riskFactors": identify_risk_factors(features),
        "recommendations": generate_recommendations(risk_score)
    }

    response = requests.post(
        f"{BLOCKCHAIN_API}/assessment",
        json=payload
    )

    return response.json()

# Usage
model = joblib.load('risk_model_v2.5.1.pkl')
taxpayer_features = [0.45, 0.72, 0.38, 0.91]

result = submit_risk_assessment(
    "TPN-12345-ANON",
    taxpayer_features,
    model
)

print(f"Risk Score: {result['assessment']['riskScore']}")
print(f"Blockchain Block: {result['assessment']['blockIndex']}")
```

---

## 4️⃣ Predictive Analytics Integration (Emmanuel)

### **Purpose**
Record forecasts and predictions on the blockchain for accountability and accuracy tracking.

### **Base URL**
```
http://localhost:3001/api/predictive
```

### **Endpoints**

#### **POST /forecast** - Submit Forecast
Submit a predictive forecast to the blockchain.

**Request Body:**
```json
{
  "forecastType": "revenue",
  "targetEntity": "Sector-Mining-ANON",
  "timeframe": "Q1-2026",
  "prediction": {
    "value": 45000000,
    "unit": "ZMW",
    "confidence_lower": 42000000,
    "confidence_upper": 48000000
  },
  "confidence": 85,
  "methodology": "ARIMA + ML ensemble",
  "factors": [
    "Historical tax collection trends",
    "Economic indicators",
    "Copper price forecasts",
    "Seasonal patterns"
  ],
  "historicalData": "e7f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
  "modelVersion": "v3.1.0",
  "metadata": {
    "dataPoints": 360,
    "timeSeriesLength": "3 years",
    "algorithm": "Prophet + XGBoost"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Predictive forecast recorded on blockchain",
  "forecast": {
    "forecastId": "a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
    "blockchainEventId": "evt-forecast-001",
    "blockIndex": 155,
    "forecastType": "revenue",
    "timeframe": "Q1-2026",
    "timestamp": "2025-10-02T13:00:00Z"
  }
}
```

#### **PUT /forecast/:forecastId/verify** - Verify Forecast with Actual Outcome
When the forecast period ends, submit actual outcomes to calculate accuracy.

**Request Body:**
```json
{
  "actualOutcome": {
    "value": 46500000,
    "unit": "ZMW"
  },
  "verifiedBy": "finance-dept",
  "notes": "Actual Q1-2026 revenue collection"
}
```

**Response:**
```json
{
  "success": true,
  "forecast": {
    "forecastId": "a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
    "prediction": 45000000,
    "actualOutcome": 46500000,
    "accuracy": 96.7,
    "verifiedAt": "2026-04-01T10:00:00Z"
  }
}
```

#### **POST /trend** - Record Trend Analysis
Submit trend analysis results to the blockchain.

**Request Body:**
```json
{
  "trendType": "compliance_trend",
  "direction": "increasing",
  "magnitude": 75,
  "timeWindow": "6 months",
  "dataPoints": 180,
  "significance": 0.001,
  "description": "Compliance rate increasing by 7.5% over 6 months",
  "dataHash": "f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
}
```

#### **POST /model/register** - Register Prediction Model
Register a new forecasting model on the blockchain.

**Request Body:**
```json
{
  "modelName": "RevenueForecaster",
  "modelVersion": "v3.1.0",
  "modelType": "ensemble",
  "features": ["historical_revenue", "economic_indicators", "seasonal_factors"],
  "performance": {
    "mae": 2.3,
    "rmse": 3.1,
    "mape": 5.2
  },
  "trainedOn": "g9b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4",
  "description": "Hybrid ARIMA-XGBoost model for revenue forecasting"
}
```

#### **GET /forecasts** - Get All Forecasts
Retrieve forecasts with filtering options.

#### **GET /accuracy-report** - Model Accuracy Report
Get accuracy report for verified forecasts.

**Response:**
```json
{
  "success": true,
  "report": {
    "totalVerified": 24,
    "averageAccuracy": "93.4",
    "highAccuracy": 18,
    "mediumAccuracy": 5,
    "lowAccuracy": 1,
    "byType": {
      "revenue": {
        "count": 12,
        "averageAccuracy": "95.2"
      },
      "compliance": {
        "count": 8,
        "averageAccuracy": "91.5"
      }
    }
  }
}
```

### **Integration Code Example (Python/Prophet)**
```python
import requests
import hashlib
import json
from prophet import Prophet
import pandas as pd

BLOCKCHAIN_API = "http://localhost:3001/api/predictive"

def submit_forecast(model, future_df, historical_data, entity):
    # Generate forecast
    forecast = model.predict(future_df)
    prediction_value = forecast['yhat'].iloc[0]
    lower_bound = forecast['yhat_lower'].iloc[0]
    upper_bound = forecast['yhat_upper'].iloc[0]

    # Hash historical data
    data_hash = hashlib.sha256(
        historical_data.to_json().encode()
    ).hexdigest()

    payload = {
        "forecastType": "revenue",
        "targetEntity": entity,
        "timeframe": "Q1-2026",
        "prediction": {
            "value": float(prediction_value),
            "unit": "ZMW",
            "confidence_lower": float(lower_bound),
            "confidence_upper": float(upper_bound)
        },
        "confidence": 85,
        "methodology": "Facebook Prophet",
        "historicalData": data_hash,
        "modelVersion": "v3.1.0"
    }

    response = requests.post(
        f"{BLOCKCHAIN_API}/forecast",
        json=payload
    )

    return response.json()

# Later, verify accuracy
def verify_forecast(forecast_id, actual_value):
    response = requests.put(
        f"{BLOCKCHAIN_API}/forecast/{forecast_id}/verify",
        json={
            "actualOutcome": {"value": actual_value},
            "verifiedBy": "analytics-team"
        }
    )

    return response.json()
```

---

## 5️⃣ Dashboard Integration (Thomas)

### **Purpose**
Provide real-time, aggregated data feeds for the central monitoring dashboard.

### **Base URL**
```
http://localhost:3001/api/dashboard-feed
```

### **Endpoints**

#### **GET /live** - Live Event Stream
Get real-time events from all modules formatted for dashboard display.

**Query Parameters:**
- `modules` - Filter by modules: `ghostbuster,whistlepro,ai-risk,predictive`
- `eventTypes` - Filter by event types: `filing,payment,auditFlag,compliance`
- `limit` - Limit results (default: 50)

**Example:**
```bash
GET /api/dashboard-feed/live?modules=ghostbuster,whistlepro&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "events": [
    {
      "eventId": "evt-001",
      "type": "auditFlag",
      "module": "GhostBuster",
      "userId": "TPN-12345-ANON...",
      "timestamp": "2025-10-02T14:30:00Z",
      "timeAgo": "2m ago",
      "severity": "HIGH",
      "icon": "🚩",
      "color": "orange",
      "summary": "GhostBuster: Audit flag raised"
    },
    {
      "eventId": "evt-002",
      "type": "whistleblower",
      "module": "WhistlePro",
      "userId": "whistlepro-WP-2025...",
      "timestamp": "2025-10-02T14:25:00Z",
      "timeAgo": "7m ago",
      "severity": "CRITICAL",
      "icon": "🔔",
      "color": "red",
      "summary": "WhistlePro: Whistleblower report received"
    }
  ]
}
```

#### **GET /summary** - Dashboard Summary
Get comprehensive summary statistics for all modules.

**Response:**
```json
{
  "success": true,
  "summary": {
    "blockchain": {
      "totalBlocks": 156,
      "totalEvents": 450,
      "latestBlock": 155,
      "chainValid": true
    },
    "activity": {
      "total": 450,
      "last24h": 87,
      "lastHour": 12,
      "eventsPerHour": "3.63"
    },
    "modules": {
      "ghostbuster": 120,
      "whistlepro": 45,
      "aiRisk": 180,
      "predictive": 85
    },
    "eventTypes": {
      "filing": 150,
      "payment": 130,
      "auditFlag": 75,
      "compliance": 60,
      "whistleblower": 35
    },
    "alerts": {
      "critical": 15,
      "high": 35,
      "medium": 60
    },
    "trends": {
      "growthRate": "12.5",
      "mostActiveModule": "aiRisk",
      "hotspots": [...]
    }
  }
}
```

#### **GET /modules/:moduleName** - Module-Specific Activity
Get activity details for a specific module.

**Example:**
```bash
GET /api/dashboard-feed/modules/ghostbuster?timeRange=24
```

#### **GET /alerts** - Critical Alerts
Get critical alerts requiring immediate attention.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "alerts": [
    {
      "alertId": "evt-abc123",
      "severity": "CRITICAL",
      "type": "whistleblower",
      "module": "WhistlePro",
      "message": "New whistleblower report requires immediate attention",
      "timestamp": "2025-10-02T14:25:00Z",
      "timeAgo": "7m ago",
      "actionRequired": true,
      "priority": 1
    }
  ]
}
```

#### **GET /timeline** - Event Timeline
Get time-series data for visualization (charts/graphs).

**Query Parameters:**
- `groupBy` - Group by: `hour` or `day` (default: day)
- `days` - Number of days to include (default: 7)

**Example:**
```bash
GET /api/dashboard-feed/timeline?groupBy=day&days=30
```

#### **GET /health** - System Health
Get health status of blockchain and all modules.

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "blockchain": {
      "operational": true,
      "blocks": 156,
      "integrity": "verified"
    },
    "activity": {
      "eventsLastHour": 12,
      "status": "active"
    },
    "modules": {
      "ghostbuster": {
        "status": "active",
        "eventsLastHour": 3
      },
      "whistlepro": {
        "status": "active",
        "eventsLastHour": 2
      },
      "aiRisk": {
        "status": "active",
        "eventsLastHour": 5
      },
      "predictive": {
        "status": "active",
        "eventsLastHour": 2
      }
    },
    "uptime": 86400
  }
}
```

### **Integration Code Example (React Dashboard)**
```javascript
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BLOCKCHAIN_API = 'http://localhost:3001/api/dashboard-feed';

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [liveEvents, setLiveEvents] = useState([]);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Fetch initial data
        fetchDashboardData();

        // Poll for updates every 10 seconds
        const interval = setInterval(fetchDashboardData, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [summaryRes, eventsRes, alertsRes] = await Promise.all([
                axios.get(`${BLOCKCHAIN_API}/summary`),
                axios.get(`${BLOCKCHAIN_API}/live?limit=20`),
                axios.get(`${BLOCKCHAIN_API}/alerts`)
            ]);

            setSummary(summaryRes.data.summary);
            setLiveEvents(eventsRes.data.events);
            setAlerts(alertsRes.data.alerts);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        }
    };

    return (
        <div className="dashboard">
            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="card">
                    <h3>Total Events</h3>
                    <p>{summary?.blockchain.totalEvents}</p>
                </div>
                <div className="card">
                    <h3>Events (24h)</h3>
                    <p>{summary?.activity.last24h}</p>
                </div>
                <div className="card critical">
                    <h3>Critical Alerts</h3>
                    <p>{summary?.alerts.critical}</p>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="alerts-section">
                <h2>🚨 Critical Alerts</h2>
                {alerts.map(alert => (
                    <div key={alert.alertId} className={`alert ${alert.severity.toLowerCase()}`}>
                        <span className="module">{alert.module}</span>
                        <span className="message">{alert.message}</span>
                        <span className="time">{alert.timeAgo}</span>
                    </div>
                ))}
            </div>

            {/* Live Events Feed */}
            <div className="live-feed">
                <h2>📡 Live Event Stream</h2>
                {liveEvents.map(event => (
                    <div key={event.eventId} className="event-item">
                        <span className="icon">{event.icon}</span>
                        <span className="module">{event.module}</span>
                        <span className="summary">{event.summary}</span>
                        <span className="time">{event.timeAgo}</span>
                    </div>
                ))}
            </div>

            {/* Module Activity */}
            <div className="module-activity">
                <h2>Module Activity (24h)</h2>
                <div className="chart">
                    {/* Use chart library like Chart.js or Recharts */}
                    {summary?.modules && Object.entries(summary.modules).map(([module, count]) => (
                        <div key={module} className="bar">
                            <span>{module}</span>
                            <div style={{width: `${count}px`}}></div>
                            <span>{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
```

---

## 🔐 Security & Authentication

### **API Key Authentication (Optional)**
For production deployment, protect integration endpoints with API keys.

**Request Header:**
```
X-API-Key: your-team-api-key-here
```

### **CORS Configuration**
The blockchain API allows cross-origin requests. Configure your frontend:

```javascript
axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.headers.common['Content-Type'] = 'application/json';
```

### **Data Anonymization**
All personally identifiable information (PII) must be anonymized before submitting to the blockchain:
- Taxpayer IDs: Use anonymized TPNs
- Company names: Use anonymized identifiers
- Personal details: Hash or encrypt sensitive data

---

## 📊 Testing & Validation

### **Test the Integration**

1. **Start the Blockchain API:**
```bash
cd blockchain
npm start
# Runs on http://localhost:3001
```

2. **Test GhostBuster Integration:**
```bash
curl -X POST http://localhost:3001/api/ghostbuster/detection \
  -H "Content-Type: application/json" \
  -d '{
    "detectionType": "phantom_employee",
    "entityId": "TEST-001",
    "confidenceScore": 95,
    "evidenceHash": "a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f"
  }'
```

3. **Test WhistlePro Integration:**
```bash
curl -X POST http://localhost:3001/api/whistlepro/report \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "tax_evasion",
    "targetEntity": "TEST-COMPANY",
    "evidenceHash": "b4c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8"
  }'
```

4. **Test AI Risk Integration:**
```bash
curl -X POST http://localhost:3001/api/ai-risk/assessment \
  -H "Content-Type: application/json" \
  -d '{
    "taxpayerId": "TPN-TEST-001",
    "riskScore": 87,
    "dataHash": "c5d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9"
  }'
```

5. **Test Dashboard Feed:**
```bash
curl http://localhost:3001/api/dashboard-feed/summary
curl http://localhost:3001/api/dashboard-feed/live?limit=10
```

---

## 🚀 Production Deployment Checklist

### **Before Going Live:**

- [ ] **Security**
  - [ ] Enable API key authentication
  - [ ] Configure HTTPS/TLS
  - [ ] Set up rate limiting
  - [ ] Implement input validation
  - [ ] Enable CORS only for trusted domains

- [ ] **Data Privacy**
  - [ ] Verify all PII is anonymized
  - [ ] Implement data encryption
  - [ ] Set up metadata scrubbing
  - [ ] Configure audit logs

- [ ] **Performance**
  - [ ] Set up database for persistent storage (PostgreSQL/MongoDB)
  - [ ] Configure Redis caching
  - [ ] Implement connection pooling
  - [ ] Set up load balancing

- [ ] **Monitoring**
  - [ ] Configure logging (Winston/Bunyan)
  - [ ] Set up error tracking (Sentry)
  - [ ] Enable performance monitoring
  - [ ] Create alerting rules

- [ ] **Documentation**
  - [ ] Update API documentation
  - [ ] Create integration guides for team
  - [ ] Document error codes
  - [ ] Write deployment runbook

---

## 🆘 Support & Contact

### **Integration Issues**
If you encounter integration issues, contact:

**Kaps (Blockchain Lead)**
- Slack: @kaps
- Email: kaps@taxguard.zm (hypothetical)

### **Common Issues**

**1. Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
**Solution:** Make sure blockchain API is running:
```bash
cd blockchain && npm start
```

**2. Invalid Hash Format**
```
Error: evidenceHash must be a valid 64-character SHA256 hex string
```
**Solution:** Use proper SHA256 hashing:
```python
import hashlib
hash_value = hashlib.sha256(data.encode()).hexdigest()
```

**3. CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** The API allows all origins in development. For production, update CORS config.

---

## 📝 Change Log

### **Version 1.0.0** (October 2, 2025)
- ✅ GhostBuster integration API
- ✅ WhistlePro integration API
- ✅ AI Risk Scoring integration API
- ✅ Predictive Analytics integration API
- ✅ Dashboard Feed integration API
- ✅ Real-time WebSocket support
- ✅ Comprehensive documentation

---

## 🎉 Next Steps

1. **Team Members:** Review your specific integration section
2. **Test:** Run the provided curl commands to test your endpoints
3. **Integrate:** Use the code examples to connect your module
4. **Deploy:** Follow the production checklist before going live
5. **Monitor:** Use the dashboard feed to track your module's activity

**All integrations are READY and OPERATIONAL!** 🚀

Let's build an amazing demo for the hackathon! 💪
