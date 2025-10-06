# TaxGuard AI Blockchain Architecture

## System Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TaxGuard AI   │───▶│  Blockchain API  │───▶│   Blockchain    │
│   (Producer)    │    │   (Port 3001)    │    │   (Immutable)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  WhistlePro     │    │   Dashboard      │    │      SIEM       │
│  (Reports)      │    │  (Visualization) │    │   (Monitoring)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Network Roles

### **Producer Role (TaxGuard AI)**
- Submit tax events to blockchain
- Create audit flags and compliance records
- Generate risk scores and alerts

### **Auditor Role (ZRA Officials)**
- Read blockchain events
- Query specific transactions
- Generate audit reports

### **Admin Role (System Administrators)**
- Manage blockchain network
- Update system configurations
- Monitor network health

## Data Flow

1. **Event Creation**: TaxGuard AI → REST API → Blockchain
2. **Event Storage**: Blockchain → Immutable Ledger
3. **Event Retrieval**: Dashboard → REST API → Blockchain
4. **Monitoring**: SIEM → REST API → Real-time Events

## Security Model

- **Anonymized User IDs**: No PII stored on blockchain
- **Hash-based Storage**: Only fingerprints, not full data
- **Immutable Audit Trail**: Tamper-proof event history
- **Role-based Access**: Producer/Auditor/Admin permissions

## Integration Points

- **AI Risk Scoring** → Blockchain (Risk events)
- **WhistlePro** → Blockchain (Anonymous reports)
- **GhostBuster** → Blockchain (Detection results)
- **Predictive Analytics** → Blockchain (Forecast events)
- **Dashboard** → Blockchain (Real-time data)
