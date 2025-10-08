# Predictive Analytics Module (TaxGuard AI)

FastAPI microservice providing tax revenue forecasting and scenario simulation (e.g., copper price shocks).

## Endpoints
- `GET /health`: service and model status
- `POST /train`: train model on CSV dataset (default: `predictive/data/sample_revenue.csv`)
- `POST /forecast`: generate forecasts for `horizon` months
- `GET /accuracy-report`: evaluation metrics on training data
- `POST /simulate`: apply a copper price shock using elasticity

## Quick Start
```bash
cd /home/emmd/Workstation/projects/ZRA-Hackathon-TaxGuard-AI-GhostBuster
./predictive/run.sh
```
Service: http://localhost:8001/docs

### Train
```bash
curl -X POST http://localhost:8001/train -H Content-Type: