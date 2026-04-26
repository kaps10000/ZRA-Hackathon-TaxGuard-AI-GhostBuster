# TaxGuard AI - Actual Running Ports

Based on the system scan, here are the **ACTUAL** ports your 11 services are running on:

## ✅ Confirmed Running Services

| # | Service Name | Actual Port | Type | What's Running |
|---|-------------|-------------|------|----------------|
| 1 | **PostgreSQL** | 5432 | Database | Docker PostgreSQL |
| 2 | **Dashboard Frontend** | **3000** | React/Vite | TaxGuard Dashboard (Vite dev server) |
| 3 | **Blockchain Service** | 3001 | Node.js | Blockchain API |
| 4 | **GhostBuster Frontend** | 3004 | React | Ghost employee detection UI |
| 5 | **Whistlepro Backend** | 3005 | Node.js | Whistleblower system |
| 6 | **Whistlepro/VRT Module** | 3006 | Python | Additional module |
| 7 | **OCR Backend** | 4000 | Node.js | Document processing backend |
| 8 | **API Gateway** | 4001 | Node.js | Central routing |
| 9 | **OCR AI Service** | 5000 | Node.js | ML/OCR processing |
| 10 | **GhostBuster Backend** | 5001 | Python | Ghost employee detection |
| 11 | **Anomaly Tracker** | 5002 | Python | AI risk scoring |
| 12 | **VRT Guard** | 5003 | Python | VAT return tracking |

## Key Findings:

1. **Dashboard is on port 3000** (NOT 5173) ✅
2. **OCR Backend is on port 4000** (NOT 3000) ✅  
3. **You have 12 services running** (not 11):
   - GhostBuster Frontend (3004)
   - Whistlepro/VRT Module (3006)

## Corrected Port List:

```
3000 - Dashboard Frontend (Vite)
3001 - Blockchain Service
3004 - GhostBuster Frontend
3005 - Whistlepro Backend
3006 - Whistlepro/VRT Module
4000 - OCR Backend
4001 - API Gateway
5000 - OCR AI Service
5001 - GhostBuster Backend
5002 - Anomaly Tracker (AI Risk Score)
5003 - VRT Guard
5432 - PostgreSQL
```

Total: **12 services**
