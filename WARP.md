# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**ZRA TaxGuard AI GhostBuster** is a blockchain-powered tax compliance and fraud detection system for the Zambia Revenue Authority (ZRA). It's a microservices architecture built for a hackathon with production-ready code quality.

### Core Purpose
- **Blockchain-based immutable audit trails** for tax events
- **AI-powered fraud detection** modules (GhostBuster, WhistlePro, AI Risk)
- **Enterprise-grade security** with JWT authentication and RBAC
- **Real-time monitoring** with Prometheus metrics and dashboards

## Architecture Overview

This is a **distributed microservices system** with the following key components:

```
Frontend (React/TypeScript) → API Gateway (Express.js) → Blockchain API (Node.js/Hyperledger)
                                      ↓
                               Individual AI Modules
                          (GhostBuster, WhistlePro, AI Risk, etc.)
```

### Main Services:
1. **`api-gateway/`** - Central API gateway with authentication, routing, and monitoring (Port 4000)
2. **`blockchain/`** - Core blockchain service with Hyperledger Fabric smart contracts (Port 3001)
3. **`frontend/`** - React TypeScript dashboard with real-time monitoring (Port 5173)
4. **`ocr-backend/`** - OCR document processing service (Port 5000)
5. **`ai-service/`** (alias `ocr-ai-service/`) - AI/ML document analysis service (Port 8000)

### Integration Points:
- Team modules integrate via dedicated API endpoints under `/api/{module-name}`
- All modules communicate through the central API Gateway
- Blockchain serves as the immutable ledger for all tax events
- PostgreSQL database for persistent data storage

## Development Commands

### Quick Start (3-service minimum):
```bash
# Terminal 1: Start Blockchain API
cd blockchain
npm install
npm start  # http://localhost:3001

# Terminal 2: Start API Gateway  
cd api-gateway
npm install
npm start  # http://localhost:4000

# Terminal 3: Start Frontend
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### Full System (Docker):
```bash
# Start all services with PostgreSQL
docker-compose up -d

# Check service health
curl http://localhost:4000/health
```

### Service-Specific Commands:

#### API Gateway (`api-gateway/`):
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Security and integration tests
```

#### Blockchain (`blockchain/`):
```bash
npm start          # Start blockchain API
npm run dev        # Development mode
npm test           # Smart contract tests
npm run docker:build    # Build container
npm run network-up      # Start Hyperledger network
npm run network-down    # Stop Hyperledger network
```

#### Frontend (`frontend/`):
```bash
npm run dev        # Development server (Vite)
npm run build      # TypeScript build + Vite production build
npm run lint       # ESLint validation
npm run preview    # Preview production build
```

#### OCR Backend (`ocr-backend/`):
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run db:setup   # Set up PostgreSQL
npm run db:init    # Initialize database schema
```

#### AI Service (`ai-service/`):
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # AI/OCR tests
```

### Testing Commands:
```bash
# Security tests
cd api-gateway && npm test

# Blockchain contract tests  
cd blockchain && npm test

# Integration tests (all APIs)
node test-all-integrations.js

# Load testing
cd api-gateway && npm test -- -t "Performance"
```

## System URLs & Key Endpoints

### Development URLs:
- **Main Dashboard**: http://localhost:5173
- **API Gateway**: http://localhost:4000 
- **Blockchain API**: http://localhost:3001
- **OCR Backend**: http://localhost:5000
- **AI Service**: http://localhost:8000

### Documentation & Tools:
- **API Documentation**: http://localhost:4000/api-docs (Swagger)
- **API Tester**: http://localhost:4000/tester
- **Health Check**: http://localhost:4000/health
- **Prometheus Metrics**: http://localhost:4000/metrics
- **JSON Metrics**: http://localhost:4000/metrics/json

### Core API Patterns:
```bash
# Authentication
POST /api/auth/login              # JWT token
POST /api/auth/register          # User registration (admin only)
GET  /api/auth/profile           # User profile

# Tax Events (Core blockchain functionality)
POST /api/events                 # Submit tax event to blockchain
GET  /api/events                 # List events (auditor+ role)
GET  /api/events/:id             # Get specific event
GET  /api/events/stats           # Event statistics

# Team Module Integration
POST /api/ghostbuster/detection  # Phantom detection (Ezra)
POST /api/whistlepro/report      # Whistleblower reports (Kelvin/Ephraim)  
POST /api/ai-risk/assessment     # AI risk scoring (Shuan)
POST /api/predictive/forecast    # Predictive analytics (Emmanuel)
GET  /api/dashboard-feed/summary # Dashboard data (Thomas)

# System Monitoring
GET  /health                     # System health
GET  /metrics                    # Prometheus metrics
```

## Key Architectural Patterns

### Authentication & Authorization:
- **JWT-based authentication** with role-based access control (RBAC)
- **Three user roles**: `taxpayer` (submit only), `auditor` (read-only), `admin` (full access)
- **Default test credentials** in `QUICK_START_GUIDE.md`
- All sensitive endpoints require `Authorization: Bearer <token>` header

### Data Flow:
1. **Frontend** → **API Gateway** → **Blockchain API** → **Hyperledger Fabric Smart Contracts**
2. **AI Modules** → **API Gateway** → **Blockchain** (for audit trails)
3. **SIEM Integration**: Winston logging with structured JSON output

### Security Patterns:
- **Helmet.js** security headers
- **Rate limiting**: 100 requests per 15 minutes per IP
- **Input validation** with `express-validator`
- **Hash integrity** verification for all blockchain events
- **CORS** configured for local development

### Error Handling:
- Structured error responses with consistent JSON format
- Comprehensive logging to `logs/` directories
- Health checks with detailed service status

## File Structure Context

### Smart Contracts (`blockchain/contracts/`):
- **`TaxGuardContract.js`**: Core blockchain contract for tax events
- **`AdvancedTaxGuardContract.js`**: Enhanced features (527 lines)

### API Routes (`api-gateway/routes/`):
- Modular route organization by feature
- Centralized authentication middleware
- Team integration endpoints

### Configuration:
- **`docker-compose.yml`**: Complete 5-service stack with PostgreSQL
- **`package.json`** files: Service-specific dependencies and scripts
- **`.env`** files: Environment configuration (not committed)

### Documentation:
- **`FINAL_PROJECT_SUMMARY.md`**: Complete project overview
- **`TEAM_INTEGRATION_DOCUMENTATION.md`**: API integration guide  
- **`QUICK_START_GUIDE.md`**: 5-minute setup instructions
- Multiple service-specific README files

## Development Patterns

### Adding New API Endpoints:
1. **API Gateway**: Add route in `api-gateway/routes/`
2. **Authentication**: Use existing middleware in `middleware/auth.js`
3. **Blockchain Integration**: Call blockchain API via `axios` 
4. **Logging**: Use Winston logger from `utils/logger.js`
5. **Testing**: Add tests in `tests/` directory

### Team Module Integration:
- Each team member has dedicated API namespace: `/api/{module-name}`
- Standard response format: `{success: boolean, data: object, message: string}`
- Blockchain event creation for audit trails using `POST /api/events`
- See `TEAM_INTEGRATION_DOCUMENTATION.md` for complete integration examples

### Database Patterns:
- **PostgreSQL** for persistent data (configured in docker-compose)
- **Sequelize ORM** in OCR backend
- **In-memory storage** for development/demo (API Gateway users)
- Database initialization scripts in `migrations/`

## Common Tasks

### Running Single Tests:
```bash
# Test specific security feature
cd api-gateway
npm test -- --testNamePattern="Authentication"

# Test blockchain contract
cd blockchain  
npm test -- tests/contract.test.js
```

### Adding Team Module Integration:
1. Review existing patterns in `api-gateway/server.js` 
2. Add new route group under `/api/{your-module}`
3. Implement authentication middleware
4. Add blockchain event logging for audit trail
5. Update Swagger documentation

### Monitoring & Debugging:
```bash
# View real-time logs
tail -f api-gateway/logs/app.log

# Check service health
curl http://localhost:4000/health | jq

# View metrics
curl http://localhost:4000/metrics/json | jq
```

### Database Operations:
```bash
# Setup PostgreSQL (if not using Docker)
cd ocr-backend
npm run db:setup
npm run db:init

# Connect to database
docker exec -it zra-postgres psql -U postgres -d zra_taxguard
```

## Important Notes

### For Team Integration:
- **Authentication required** for all module APIs except health checks
- **Consistent error handling** using established patterns in `api-gateway/server.js`
- **Blockchain audit logging** recommended for all significant actions
- **Rate limiting applies** to all endpoints (100 req/15 min)

### Production Considerations:
- Change default JWT secret and database credentials
- Enable SSL/TLS certificates  
- Configure production database (current setup uses in-memory storage for users)
- Set up proper secret management
- Configure load balancer for high availability

### Performance:
- **Average response time**: <100ms for most endpoints
- **Concurrent capacity**: 20+ requests tested
- **Monitoring**: Prometheus metrics available at `/metrics`
- **Health checks**: Available at `/health` with detailed status

## Testing Strategy

### Security Testing:
- **30+ security tests** in `api-gateway/tests/`
- **OWASP compliance** testing
- **Authentication/authorization** validation
- **Rate limiting** verification

### Integration Testing:
- **End-to-end API testing** with `test-all-integrations.js`
- **Blockchain integration** validation
- **Cross-service communication** testing

### Load Testing:
- **Performance benchmarks** included
- **Concurrent request handling** validated
- **Response time monitoring** with Prometheus