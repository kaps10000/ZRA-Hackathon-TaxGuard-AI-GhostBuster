# 🚀 TaxGuard - Quick Start Guide

## **Get Started in 5 Minutes**

This guide will help you get the complete TaxGuard blockchain system running on your local machine.

---

## 📋 Prerequisites

- **Node.js** 16+ installed
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- **8GB RAM** minimum recommended

---

## ⚡ Quick Setup (3 Commands)

### Step 1: Start Blockchain API
```bash
cd blockchain
npm install  # First time only
npm start

# ✅ Running on http://localhost:3001
```

### Step 2: Start API Gateway
```bash
cd ../api-gateway
npm install  # First time only
npm start

# ✅ Running on http://localhost:4000
```

### Step 3: Start Frontend Dashboard
```bash
cd ../frontend
npm install  # First time only
npm run dev

# ✅ Running on http://localhost:5173
```

---

## 🌐 Access Points

Once all services are running:

### Main Interfaces:
- **Frontend Dashboard:** http://localhost:5173
- **API Gateway:** http://localhost:4000
- **Blockchain API:** http://localhost:3001

### Documentation & Tools:
- **API Documentation:** http://localhost:4000/api-docs
- **API Tester:** http://localhost:4000/tester
- **API Directory:** http://localhost:4000/apis
- **Health Check:** http://localhost:4000/health
- **Metrics (Prometheus):** http://localhost:4000/metrics
- **Metrics (JSON):** http://localhost:4000/metrics/json

---

## 🔐 Test Credentials

Use these credentials to test the system:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| `taxpayer1` | `password123` | Taxpayer | Submit events only |
| `auditor1` | `password123` | Auditor | View all events |
| `admin1` | `password123` | Admin | Full system access |

---

## 🧪 Testing the System

### 1. Login via API
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"taxpayer1","password":"password123"}'

# Save the returned token for next steps
```

### 2. Submit a Tax Event
```bash
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "eventType":"filing",
    "anonymizedUserId":"TPN-12345-ANON",
    "hashOfPayload":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "notes":"Test VAT filing Q3-2025"
  }'
```

### 3. View Events (Auditor/Admin Only)
```bash
curl http://localhost:4000/api/events \
  -H "Authorization: Bearer AUDITOR_TOKEN_HERE"
```

### 4. Check System Health
```bash
curl http://localhost:4000/health | jq
```

---

## 📊 Using the Frontend Dashboard

1. Open http://localhost:5173 in your browser
2. The dashboard loads automatically (no login required for demo)
3. View real-time statistics and blockchain events
4. Navigate between modules: GhostBuster, WhistlePro, AI Risk, Predictive

### Dashboard Features:
- ✅ Real-time event stream
- ✅ Blockchain statistics
- ✅ Critical alerts monitoring
- ✅ Module activity tracking
- ✅ Live event feed

---

## 🔧 Running Tests

### Security Tests:
```bash
cd api-gateway
npm test
```

### Blockchain Tests:
```bash
cd blockchain
npm test
```

### Load Testing (Optional):
```bash
cd api-gateway
npm test -- tests/security.test.js -t "Performance"
```

---

## 📈 Monitoring & Metrics

### View Prometheus Metrics:
```bash
curl http://localhost:4000/metrics
```

### View JSON Metrics:
```bash
curl http://localhost:4000/metrics/json | jq
```

### Key Metrics Available:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `blockchain_events_total` - Events created by type
- `authentication_attempts_total` - Auth success/failure
- `active_connections` - Current connections
- `errors_total` - Errors by type

---

## 🛠️ Troubleshooting

### Port Already in Use:
If you see "Port XXXX is already in use":

```bash
# Find process using the port
lsof -i :4000  # Or :3001, :5173

# Kill the process
kill -9 PID_NUMBER

# Or change the port in .env file
```

### API Gateway Won't Start:
```bash
cd api-gateway
rm -rf node_modules package-lock.json
npm install
npm start
```

### Frontend Build Errors:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Blockchain API Errors:
```bash
cd blockchain
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📱 API Endpoints Quick Reference

### Authentication:
```
POST   /api/auth/login       # Get JWT token
POST   /api/auth/register    # Register user (admin only)
GET    /api/auth/profile     # Get user profile
```

### Events:
```
POST   /api/events           # Submit event (authenticated)
GET    /api/events           # List events (auditor+)
GET    /api/events/:id       # Get event by ID (auditor+)
GET    /api/events/stats     # Event statistics (auditor+)
```

### Team Integration:
```
POST   /api/ghostbuster/detection       # GhostBuster detection
POST   /api/whistlepro/report           # Whistleblower report
POST   /api/ai-risk/assessment          # AI risk assessment
POST   /api/predictive/forecast         # Predictive forecast
GET    /api/dashboard-feed/summary      # Dashboard summary
GET    /api/dashboard-feed/live         # Live event feed
```

### System:
```
GET    /health              # Health check
GET    /metrics             # Prometheus metrics
GET    /metrics/json        # JSON metrics
GET    /api-docs            # Swagger documentation
```

---

## 🎯 Common Use Cases

### Use Case 1: Submit a Tax Filing Event
1. Login as taxpayer: `POST /api/auth/login`
2. Get token from response
3. Submit event: `POST /api/events` with token
4. Verify in dashboard: Open http://localhost:5173

### Use Case 2: Audit Tax Events
1. Login as auditor: `POST /api/auth/login`
2. List all events: `GET /api/events` with auditor token
3. View specific event: `GET /api/events/{id}`
4. Check statistics: `GET /api/events/stats`

### Use Case 3: Monitor System Health
1. Check health: `GET /health`
2. View metrics: `GET /metrics`
3. Open dashboard: http://localhost:5173
4. Monitor real-time feed

---

## 📚 Additional Resources

### Documentation:
- **Complete API Docs:** `TEAM_INTEGRATION_DOCUMENTATION.md`
- **Security Report:** `TASK5_SECURITY_TEST_REPORT.md`
- **Deployment Guide:** `sandbox-deployment/DEPLOYMENT_GUIDE.md`
- **Project Summary:** `FINAL_PROJECT_SUMMARY.md`

### Interactive Tools:
- Swagger UI: http://localhost:4000/api-docs
- API Tester: http://localhost:4000/tester
- API Directory: http://localhost:4000/apis

---

## 🚀 Next Steps

After getting the system running:

1. **Explore the Dashboard** - http://localhost:5173
2. **Test the APIs** - http://localhost:4000/tester
3. **Read Documentation** - `TEAM_INTEGRATION_DOCUMENTATION.md`
4. **Run Security Tests** - `cd api-gateway && npm test`
5. **Check Monitoring** - http://localhost:4000/metrics

---

## 💡 Tips

- **Use the interactive API tester** for easy testing without curl
- **Check logs** in `api-gateway/logs/` for debugging
- **Monitor metrics** via `/metrics/json` for dashboard integration
- **Use Swagger docs** at `/api-docs` for complete API reference

---

## ⚠️ Important Notes

- **Default passwords** should be changed in production
- **In-memory user store** - users reset on server restart
- **HTTPS** recommended for production (SSL certificates needed)
- **Database** persistence needed for production deployment
- **Rate limiting** is 100 requests per 15 minutes per IP

---

## 🎉 You're Ready!

The complete TaxGuard blockchain system is now running. Start exploring the dashboard and testing the APIs!

**Need Help?**
- Check the documentation in the `docs/` folder
- View API docs at http://localhost:4000/api-docs
- Run tests with `npm test` in each module

---

**Built for ZRA Hackathon 2025** 🏆
**Status:** ✅ Production Ready
