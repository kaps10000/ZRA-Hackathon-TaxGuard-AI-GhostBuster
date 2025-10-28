# ZRA TaxGuard AI - Ghost Company Detection & Tax Revenue Optimization

![TaxGuard AI Banner](https://img.shields.io/badge/TaxGuard-AI-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)

## 🎯 Overview

**ZRA TaxGuard AI** is a comprehensive AI-powered platform designed to combat tax evasion, detect ghost companies, and optimize revenue collection for the Zambia Revenue Authority (ZRA).

### Key Features

- 🕵️ **GhostBuster Detection** - AI-powered ghost company identification
- 📄 **OCR Scanner** - Automated document processing with batch upload
- 🔮 **Predictive Analytics** - Revenue forecasting with copper price & compliance impact analysis
- 🛡️ **VRT Guard** - VAT fraud detection system
- 📊 **Anomaly Tracker** - AI-based risk scoring
- 🔗 **Blockchain Ledger** - Immutable audit trail
- 📢 **WhistlePro** - Secure whistleblower reporting

---

## 🚀 Quick Start

### First Time Setup (Complete Installation)

```bash
# Clone the repository
git clone <repository-url>
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Run complete setup (installs dependencies + starts services)
./complete-setup.sh
```

### Subsequent Runs (Start Services Only)

```bash
# After first setup, use this for daily startup
./quick-start.sh
```

### Alternative: Manual Service Management

```bash
# Start all services (if dependencies already installed)
./start-all-services.sh

# Stop all services
./stop-all-services.sh
```

**Access your dashboard at: http://localhost:3000**

---

## 🔧 Troubleshooting

If you encounter any issues, see **[TROUBLESHOOTING_AND_SETUP.md](./TROUBLESHOOTING_AND_SETUP.md)** for:
- Common issues and solutions
- Detailed setup instructions
- Service verification commands
- Configuration details

---

## 📖 Detailed Setup Guide

For detailed installation instructions, see **[SETUP.md](./SETUP.md)**

The setup guide includes:
- Complete prerequisite installation
- Manual service startup instructions
- Troubleshooting guide
- Production deployment tips

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Dashboard Frontend                      │
│                    (Port 3000)                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│                    (Port 4001)                          │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ GhostBuster  │  │  Whistlepro  │  │   VRT Guard  │
│ Frontend     │  │  Backend     │  │  (Port 5003) │
│ (Port 3004)  │  │ (Port 3005)  │  └──────────────┘
└──────────────┘  └──────────────┘         │
       │                  │                 ▼
       ▼                  ▼          ┌──────────────┐
┌──────────────┐  ┌──────────────┐  │  Anomaly     │
│ GhostBuster  │  │ Whistlepro/  │  │  Tracker     │
│ Backend      │  │ VRT Module   │  │ (Port 5002)  │
│ (Port 5001)  │  │ (Port 3006)  │  └──────────────┘
└──────────────┘  └──────────────┘         │
       │                  │                 │
       └──────────────────┼─────────────────┘
                          ▼
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ OCR Backend  │  │  OCR AI      │  │  Blockchain  │
│ (Port 4000)  │  │ (Port 5000)  │  │ (Port 3001)  │
└──────────────┘  └──────────────┘  └──────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│                 (Port 5432)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Features Overview

### 1. OCR Scanner
- **Single Document Upload**: Quick document processing
- **Batch Upload**: Process multiple documents simultaneously
- **Real-time Extraction**: Instant text and data extraction
- **Validation**: Automated data validation and verification

### 2. Predictive Analytics
Advanced revenue forecasting with:

**Copper Price Impact Analysis**
- ⚠️ Severity indicators (CRITICAL/HIGH/MEDIUM/LOW)
- 💡 Mitigation & opportunity strategies
- 📊 Direct vs. indirect impact breakdown
- 🏭 Affected revenue sectors
- 📈 Monthly projections with confidence intervals

**Compliance Impact Analysis**
- 💰 Investment ROI calculations
- ✓ Recommended enforcement actions
- 📊 Payback period analysis
- 🎯 Target compliance rates

### 3. GhostBuster Detection
- AI-powered pattern recognition
- Company verification
- Risk scoring algorithm
- Historical data analysis

### 4. VRT Guard
- VAT fraud detection
- Anomaly identification
- Compliance monitoring
- Real-time alerts

### 5. Blockchain Ledger
- Immutable audit trail
- 6 pre-loaded verified transactions
- Real-time updates every 10 seconds
- Transaction details and hashes
- Complete transparency

### 6. WhistlePro
- Anonymous reporting system
- Secure submissions
- Case tracking
- Protection mechanisms

---

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Dashboard Frontend | 3000 | Main user interface |
| Blockchain Service | 3001 | Blockchain ledger |
| GhostBuster Frontend | 3004 | Ghost detection UI |
| Whistlepro Backend | 3005 | Whistleblower system |
| Whistlepro/VRT Module | 3006 | Additional module |
| OCR Backend | 4000 | Document processing backend |
| API Gateway | 4001 | Central routing hub |
| OCR AI Service | 5000 | ML/OCR processing |
| GhostBuster Backend | 5001 | Ghost detection engine |
| Anomaly Tracker (Predictive Analytics) | 5002 | AI risk scoring & revenue forecasting |
| VRT Guard | 5003 | VAT fraud detection |
| PostgreSQL | 5432 | Database |

---

## 🔧 Management Commands

### Start All Services
```bash
./start-all-services.sh
```

### Stop All Services
```bash
./stop-all-services.sh
```

### Check Service Status
```bash
# API Gateway
curl http://localhost:4001/health

# All services
for port in 4001 3000 5002 5001 3004 3005 8000 5000 3001; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health > /dev/null && echo "✅ Running" || echo "❌ Not running"
done
```

### View Logs
```bash
# All logs are in /tmp/taxguard-logs/
tail -f /tmp/taxguard-logs/api-gateway.log
tail -f /tmp/taxguard-logs/frontend.log
# etc.
```

---

## 📁 Project Structure

```
ZRA-Hackathon-TaxGuard-AI-GhostBuster/
├── dashboard_integration/
│   └── frontend/             # Port 3000 - React dashboard
├── blockchain/               # Port 3001 - Blockchain ledger
├── GhostBuster/
│   ├── frontend/             # Port 3004 - Ghost detection UI
│   └── backend/              # Port 5001 - Ghost detection engine
├── whistlepro_backend/       # Port 3005 - Whistleblower system
├── ocr-backend/              # Port 4000 - Document processing backend
├── api-gateway/              # Port 4001 - Central API routing
├── ai-service/               # Port 5000 - OCR AI processing
├── predictive_analytics/     # Port 5002 - Anomaly tracker & revenue forecasting
├── vrt_guard/                # Port 5003 - VAT fraud detection
├── SETUP.md                  # Detailed setup guide
├── README.md                 # This file
├── start-all-linux.sh        # Startup script
└── stop-all-services.sh      # Shutdown script
```

---

## 🛠️ Development

### Adding New Features

Each service is independent. Navigate to the service directory and make changes:

```bash
cd <service-directory>
# Make your changes
# Restart the specific service
```

### Testing

```bash
# Individual service testing
cd <service-directory>
npm test  # For Node.js services
pytest    # For Python services
```

---

## 🚫 No Docker Required!

This project has been optimized to run **without Docker**. All services run natively, making it:
- ✅ Easier to debug
- ✅ Faster to start
- ✅ Simpler to understand
- ✅ More accessible to developers

---

## 📚 Documentation

- **[Complete Setup Guide](./SETUP.md)** - Detailed installation instructions
- **Individual Service READMEs** - Each service folder contains its own README
- **API Documentation** - Available at service endpoints (e.g., http://localhost:8000/docs for OCR AI)

---

## 🤝 Contributing

1. Make your changes
2. Test locally
3. Commit with clear messages
4. Push to your branch

---

## 📞 Support & Troubleshooting

### Common Issues

**Services won't start?**
- Check prerequisites are installed
- Ensure ports are not in use
- Review logs in `/tmp/taxguard-logs/`

**Database connection errors?**
- Verify PostgreSQL is running: `pg_isready`
- Check database exists: `sudo -u postgres psql -l`
- Restart: `sudo service postgresql restart`

**Port conflicts?**
- Find process: `lsof -i :<port>`
- Kill process: `kill -9 <PID>`

For more troubleshooting, see **[SETUP.md](./SETUP.md)**

---

## 🎉 Success!

Once everything is running, you should have:
- ✅ 12 services operational
- ✅ PostgreSQL database running
- ✅ Dashboard accessible at http://localhost:3000
- ✅ GhostBuster UI at http://localhost:3004
- ✅ All features working (OCR batch, predictive analytics, blockchain, ghost detection, etc.)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built for the Zambia Revenue Authority (ZRA) to modernize tax collection and combat fraud using AI and blockchain technology.

---

**Made with ❤️ for ZRA Hackathon**
