# WhistlePro Backend

**Secure Anonymous Reporting System for ZRA TaxGuard AI**

A Node.js + Express backend service that provides secure, anonymous whistleblowing capabilities for reporting tax evasion, fraud, and corruption to the Zambia Revenue Authority (ZRA).

## 🌟 Features

- **Anonymous Report Submission** - Citizens can submit reports without revealing identity
- **End-to-End Encryption** - All sensitive data encrypted at rest using AES-256-GCM
- **Audit Trail** - Complete audit logging for compliance and security
- **Rate Limiting** - Prevent spam and abuse with intelligent rate limiting
- **JWT Authentication** - Secure authentication for investigators
- **Role-Based Access** - Different access levels (investigator, supervisor, admin)
- **Metadata Scrubbing** - Removes identifying information for true anonymity
- **Blockchain Ready** - Report hashes prepared for blockchain integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Docker & Docker Compose (recommended)

### 1. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Required: JWT_SECRET, ENCRYPTION_KEY, DB credentials
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Run database migrations
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec web npm run migrate
```

## 📡 API Endpoints

### Public Endpoints

- `POST /api/reports` - Submit anonymous report
- `POST /api/auth/login` - Investigator login
- `GET /health` - Health check

### Protected Endpoints (Investigators)

- `GET /api/reports` - List reports with pagination
- `GET /api/reports/:caseId` - Get specific report
- `PATCH /api/reports/:caseId/status` - Update report status
- `GET /api/reports/stats` - Statistics (Supervisor/Admin only)
- `GET /api/auth/me` - Current user profile

## 🔒 Security Features

- **Anonymous Reporting**: No accounts required, IP hashing only
- **Encryption**: AES-256-GCM for sensitive data
- **Rate Limiting**: 5 reports/IP/15min, 5 login attempts/IP/15min
- **Audit Trail**: All actions logged immutably
- **Metadata Scrubbing**: Headers sanitized for anonymity

## 🗄️ Database Schema

- **Reports**: Encrypted reports with case IDs
- **Investigators**: User accounts with role-based access
- **Audit Logs**: Immutable activity tracking

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## 🔗 Integration

- **Frontend (Ephraim)**: RESTful API with CORS
- **Blockchain (Kaps)**: Metadata hashes for immutable storage
- **Dashboard (Thomas)**: Analytics and visualization endpoints

## 👥 Team

- **Kelvin** - Backend Developer (WhistlePro Backend)
- **Ephraim** - Frontend Developer
- **Thomas** - Dashboard & Integration
- **Kaps** - Blockchain Integration

---

**Built for ZRA Hackathon 2023 - TaxGuard AI Project**

# WhistlePro Backend - Dev 3

**Assigned to: Kelvin**

## Overview
Django/Node.js + PostgreSQL backend for secure whistleblower reporting system.

## Features
- End-to-end encryption
- Metadata scrubbing
- Whistleblower case management
- APIs for frontend + investigators' dashboard

## Tech Stack
- **Backend**: Django/Node.js
- **Database**: PostgreSQL
- **Security**: End-to-end encryption, metadata scrubbing
- **APIs**: RESTful APIs for frontend and dashboard integration

## Structure
```
whistlepro_backend/
├── api/
├── models/
├── encryption/
├── case_management/
├── database/
└── tests/
```

## Key Responsibilities
- Secure report submission handling
- Case ID generation and tracking
- Encrypted data storage
- API endpoints for frontend integration
- Investigator dashboard APIs
