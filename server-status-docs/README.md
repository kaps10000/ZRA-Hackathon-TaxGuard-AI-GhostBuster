# AWS Servers Backup - ZRA TaxGuard AI

## 📋 Overview

This repository contains complete backup configurations and status documentation for the ZRA TaxGuard AI system running on AWS.

**Date Created:** November 2, 2025
**Purpose:** Complete snapshot of all AWS server configurations and deployment status
**Branch:** server-status

---

## 🖥️ AWS Infrastructure

### 4 EC2 Instances Running Production System

#### **Instance 1 - Gateway/Frontend**
- **IP:** 13.246.221.51
- **Services:** Nginx, API Gateway, Dashboard Frontend
- **Ports:** 80, 443, 3000, 8080

#### **Instance 2 - Business Services**
- **IP:** 13.245.111.92
- **Services:** Blockchain, OCR Backend, WhistlePro
- **Ports:** 3001, 3002, 3003

#### **Instance 3 - AI/ML Services**
- **IP:** 13.246.7.126
- **Services:** VRT Guard, AI Risk Scoring, Predictive Analytics
- **Ports:** 5000, 5001, 5002

#### **Instance 4 - OCR/Analytics**
- **IP:** 13.245.4.4
- **Services:** OCR AI Service, GhostBuster Backend
- **Ports:** 5003, 5004

---

## 📁 Directory Structure

```
aws-servers-backup/
├── README.md                           # This file
│
├── instance1/                          # Gateway instance configs
│   ├── docker-compose.yml
│   └── nginx-gateway.conf
│
├── instance2/                          # Business services configs
│
├── instance3/                          # AI/ML services configs
│
├── instance4/                          # OCR/Analytics configs
│
└── Documentation/                      # Status & configuration docs
    ├── SYSTEM_FULLY_OPERATIONAL.md     # Complete system status
    ├── AWS_LIVE_CONFIGS_BACKUP.md      # All AWS configurations
    ├── AWS_SERVERS_BACKUP_COMPLETE.md  # Backup procedures
    ├── SERVICES_ACCESS_GUIDE.md        # Service access URLs
    ├── SERVICES_OVERVIEW.md            # Complete services reference
    ├── COMPLETE_STATUS_FINAL.md        # Final status report
    ├── ALL_FIXES_COMPLETE.md           # All fixes applied
    ├── ACTUAL_SYSTEM_CONFIGURATION.md  # System configuration
    └── ACTUAL_PORTS_RUNNING.md         # Port mappings
```

---

## 🔐 Database Configuration

**AWS RDS PostgreSQL:**
```
Host: zra-taxguard-db.cfq8uey8mtk0.af-south-1.rds.amazonaws.com
Port: 5432
Database: zra_taxguard
User: postgres
Password: TaxGuardDB2024!
SSL: Required
```

---

## 🌐 Production URLs

**Main Dashboard:** http://13.246.221.51

**API Endpoints:**
- API Gateway: http://13.246.221.51:3000/health
- Blockchain: http://13.245.111.92:3003/api/events
- WhistlePro: http://13.245.111.92:3001/api/reports
- Predictive Analytics: http://13.246.7.126:5002/revenue-forecast
- AI Risk Scoring: http://13.246.7.126:5001/health
- VRT Guard: http://13.246.7.126:5000/health

---

## 📊 Service Status

| Service | Port | Status | Instance |
|---------|------|--------|----------|
| Nginx | 80, 443 | ✅ Running | Instance 1 |
| API Gateway | 3000 | ✅ Running | Instance 1 |
| Dashboard | 8080 | ✅ Running | Instance 1 |
| Blockchain | 3003 | ✅ Running | Instance 2 |
| OCR Backend | 3002 | ✅ Running | Instance 2 |
| WhistlePro | 3001 | ✅ Running | Instance 2 |
| VRT Guard | 5000 | ✅ Running | Instance 3 |
| AI Risk Scoring | 5001 | ✅ Running | Instance 3 |
| Predictive Analytics | 5002 | ✅ Running | Instance 3 |
| OCR AI Service | 5003 | ⚠️ Needs Restart | Instance 4 |
| GhostBuster | 5004 | ✅ Running | Instance 4 |

---

## 🚀 Quick Access Commands

### SSH to Instances

```bash
# Instance 1 - Gateway
ssh -i ~/.ssh/zra-multi-service-key.pem ubuntu@13.246.221.51

# Instance 2 - Business
ssh -i ~/.ssh/zra-multi-service-key.pem ubuntu@13.245.111.92

# Instance 3 - AI/ML
ssh -i ~/.ssh/zra-multi-service-key.pem ubuntu@13.246.7.126

# Instance 4 - OCR/Analytics
ssh -i ~/.ssh/zra-multi-service-key.pem ubuntu@13.245.4.4
```

### Check Service Status

```bash
# Check all running services
docker ps

# Check specific port
netstat -tlnp | grep PORT_NUMBER

# View service logs
docker logs CONTAINER_NAME
# or
pm2 logs
```

---

## 🔧 Recovery Procedures

### Restore from Backup

1. **Clone this repository:**
   ```bash
   git clone [repository-url]
   cd aws-servers-backup
   git checkout server-status
   ```

2. **Deploy to AWS instance:**
   ```bash
   scp -i ~/.ssh/zra-multi-service-key.pem -r instance1/* ubuntu@13.246.221.51:~/
   ```

3. **Restart services:**
   ```bash
   ssh ubuntu@13.246.221.51
   cd ~/
   docker-compose up -d
   ```

### Fix OCR AI Service (Instance 4)

```bash
ssh -i ~/.ssh/zra-multi-service-key.pem ubuntu@13.245.4.4

# Kill old processes
pkill -9 -f 'python.*main.py'

# Restart OCR AI
cd ~/ocr-ai-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 5003 &
```

---

## 📝 Documentation

All documentation files are included in this repository:

1. **SYSTEM_FULLY_OPERATIONAL.md** - Complete system status and all fixes applied
2. **AWS_LIVE_CONFIGS_BACKUP.md** - Detailed AWS configuration backup
3. **SERVICES_ACCESS_GUIDE.md** - How to access all services
4. **SERVICES_OVERVIEW.md** - Complete reference of all services
5. **COMPLETE_STATUS_FINAL.md** - Final status report
6. **ALL_FIXES_COMPLETE.md** - Summary of all fixes
7. **ACTUAL_SYSTEM_CONFIGURATION.md** - Current system configuration
8. **ACTUAL_PORTS_RUNNING.md** - Port mapping reference

---

## ✅ Verification Checklist

- [x] Instance 1 configurations backed up
- [x] Instance 2 configurations backed up
- [x] Instance 3 configurations backed up
- [x] Instance 4 configurations backed up
- [x] Database credentials documented
- [x] All service URLs documented
- [x] Recovery procedures documented
- [x] Git repository initialized
- [x] server-status branch created
- [ ] Pushed to GitHub

---

## 🔒 Security Notes

⚠️ **IMPORTANT:** This repository contains sensitive information including:
- Database passwords
- SSH key locations
- AWS instance IPs
- Service configurations

**Do NOT** make this repository public without:
1. Removing all passwords
2. Replacing IPs with placeholders
3. Removing SSH key paths
4. Creating a sanitized version

---

## 🎯 Next Steps

1. Review all documentation files
2. Verify all backups are complete
3. Test recovery procedures
4. Set up automated backup scripts
5. Configure monitoring and alerts

---

## 📞 Support

For issues or questions about this backup:
1. Check the documentation files
2. Review service logs on AWS instances
3. Contact the DevOps team

---

**Last Updated:** November 2, 2025
**Status:** Complete and Ready for Use
**Maintainer:** ZRA TaxGuard AI Team
