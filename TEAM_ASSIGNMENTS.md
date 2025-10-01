# TaxGuard AI - Team Assignments (Updated)

## Developers (Core Build Team)

1. **GhostBuster Module – Dev 7 (Thomas)**
   - Build the detection system for phantom employees/ghost companies
   - Work with sample payroll + company datasets
   - Implement matching logic against mock NAPSA, PACRA, NRC data
   - **Branch**: `Thomas`

2. **AI Risk Scoring – Shuan**
   - Build ML pipeline (Python, Scikit-learn/XGBoost)
   - Create taxpayer compliance risk scores
   - Output: ranked risk dashboard for ZRA
   - **Branch**: `Shuan`

3. **WhistlePro Frontend – Ephraim**
   - Progressive Web App + Mobile App (React Native/Flutter)
   - UI for submitting reports anonymously
   - Case code generation + clean reporting interface
   - **Branch**: `Ephraim`

4. **WhistlePro Backend – Kelvin**
   - Django/Node.js + PostgreSQL
   - End-to-end encryption, metadata scrubbing, whistleblower case management
   - APIs for frontend + investigators' dashboard
   - **Branch**: `Kelvin`

5. **Blockchain Ledger – Kaps**
   - Hyperledger Fabric integration
   - Store hashes of reports & investigation actions
   - Keep blockchain lightweight (just fingerprints, not full data)
   - **Branch**: `Kaps`

6. **Predictive Analytics – Emmanuel**
   - Build model to forecast tax revenue based on economic data
   - Simulate copper price drops & show ZRA revenue impact
   - Outputs charts for dashboard
   - **Branch**: `Emmanuel`

7. **Dashboard & Integration – Thomas**
   - Central web dashboard for investigators & ZRA
   - Pulls data from AI Risk, GhostBuster, WhistlePro, and Predictive modules
   - Visualization with D3.js/Chart.js
   - **Branch**: `Thomas`

## Technical Support

8. **Mubanga (Technical but not coding)**
   - **Data & QA manager**
   - Prepares & cleans sample datasets for ML/GhostBuster
   - Coordinates testing and ensures data pipelines run smoothly
   - Acts as bridge between devs and testers
   - **Branch**: `Mubanga`

## Current Branch Assignments
- **Thomas**: GhostBuster Module + Dashboard & Integration (dual role)
- **Shuan**: AI Risk Scoring
- **Ephraim**: WhistlePro Frontend  
- **Kelvin**: WhistlePro Backend
- **Kaps**: Blockchain Ledger
- **Emmanuel**: Predictive Analytics
- **Mubanga**: Data & QA Management

## Notes
- Thomas handles both GhostBuster detection and main dashboard integration
- All branches are set up with appropriate module structures
- Cross-module integration points documented for seamless development
