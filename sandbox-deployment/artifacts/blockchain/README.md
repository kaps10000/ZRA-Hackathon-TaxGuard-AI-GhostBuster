# Blockchain Module - TaxGuard AI

**Assigned to: Kaps (Dev 4)**

## Overview
Blockchain Ledger for Integrity - Hyperledger Fabric implementation for immutable tax event recording.

## Components
1. **ML Tax Risk Scoring Engine Integration**
2. **WhistlePro Secure Reporting Storage**
3. **Blockchain Ledger for Integrity**
4. **Predictive Revenue Analytics Support**

## Architecture
- **Producer (TaxGuard)** → can submit events
- **Auditor** → can read events  
- **Admin** → manage nodes/contracts

## Folder Structure
```
blockchain/
├── contracts/          # Smart contracts/chaincode
├── api/               # REST API for blockchain interaction
├── scripts/           # Deployment and utility scripts
├── tests/             # Unit and integration tests
├── docs/              # Architecture diagrams and documentation
└── config/            # Network configuration files
```

## Event Types
- `filing` - Tax filing events
- `payment` - Tax payment events
- `auditFlag` - Audit flag events
- `adminChange` - Administrative changes
