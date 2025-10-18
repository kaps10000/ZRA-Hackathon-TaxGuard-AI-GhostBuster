# TaxGuard AI GhostBuster - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 15+
- Redis 7+ (optional, for rate limiting)

### Installation Steps

#### 1. Install Dependencies

```bash
# API Gateway
cd api-gateway
npm install

# Dashboard Frontend
cd dashboard_integration/frontend
npm install

# GhostBuster (Python)
cd ghostbuster_module
pip install -r requirements.txt

# Predictive Analytics (Python)
cd predictive_analytics
pip install -r requirements.txt

# WhistlePro Backend
cd whistlepro_backend
npm install

# OCR Backend
cd ocr-backend
npm install
```

#### 2. Environment Configuration

Create `.env` files in each service directory:

**api-gateway/.env:**
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:3001
```

#### 3. Start All Services

**Terminal 1: API Gateway with WebSocket**
```bash
cd api-gateway
node server-with-websocket.js
```

**Terminal 2: Dashboard Frontend**
```bash
cd dashboard_integration/frontend
npm run dev
```

**Terminal 3: GhostBuster API**
```bash
cd ghostbuster_module
python api.py
```

**Terminal 4: Predictive Analytics API**
```bash
cd predictive_analytics
python api.py
```

#### 4. Access the System

- **Dashboard**: http://localhost:3001
- **API Gateway**: http://localhost:4000
- **GhostBuster API**: http://localhost:3003
- **Predictive API**: http://localhost:3004

---

## 🧪 Testing the Integration

### Test API Gateway
```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/dashboard/feed
```

### Test GhostBuster
```bash
curl -X POST http://localhost:3003/detect/company \
  -H "Content-Type: application/json" \
  -d '{"tin":"999999","name":"Ghost Company Ltd","address":"P.O. Box 123"}'
```

### Test Predictive Analytics
```bash
curl http://localhost:3004/revenue-forecast?months=6
curl http://localhost:3004/copper-impact?change=-10
```

### Test Dashboard Feed
```bash
curl http://localhost:4000/api/dashboard/feed | jq
```

---

## 📊 System Architecture

```
Frontend (Port 3001) → API Gateway (Port 4000) → Backend Services
                          ↓ WebSocket
                     Real-time Updates
                          ↓
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   GhostBuster (3003)  Predictive (3004)  Others
```

---

## 🔧 Troubleshooting

### Frontend won't start
```bash
cd dashboard_integration/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### WebSocket connection fails
- Check CORS settings in `api-gateway/websocket.js`
- Ensure API Gateway is running on port 4000
- Check browser console for connection errors

### Python modules not working
```bash
pip install --upgrade Flask flask-cors
python -m api  # Instead of python api.py
```

---

## 📝 Next Steps

1. Customize dashboard colors (Thomas)
2. Connect to real databases
3. Implement authentication
4. Add SSL/TLS certificates
5. Deploy to production

See INTEGRATION_README.md for more details!
