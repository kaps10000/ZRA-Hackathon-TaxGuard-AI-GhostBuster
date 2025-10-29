# TaxGuard AI - AWS Deployment Guide

## Overview
This guide covers deploying the TaxGuard AI system (12 microservices + PostgreSQL) on AWS Lightsail for **$5-10/month**.

---

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com
2. **Domain name** (optional) - For custom URL
3. **SSH client** - PuTTY (Windows) or Terminal (Mac/Linux)

---

## Architecture

### AWS Lightsail Instance
- **Plan**: $5/month (1GB RAM, 1 vCore, 40GB SSD, 2TB transfer)
- **OS**: Ubuntu 22.04 LTS
- **Region**: Choose closest to your users

### Services Layout
- **Nginx**: Reverse proxy and static file server (port 80/443)
- **Node.js Services**: Managed by PM2
- **Python Services**: Managed by systemd
- **PostgreSQL**: Self-hosted on same instance
- **Static IP**: Free with Lightsail

---

## Step 1: Create Lightsail Instance

### 1.1 Sign in to AWS
1. Go to https://lightsail.aws.amazon.com
2. Sign in to your AWS account

### 1.2 Create Instance
1. Click **"Create instance"**
2. **Instance location**: Choose your region (e.g., us-east-1)
3. **Pick your instance image**:
   - Select: **Linux/Unix**
   - Blueprint: **OS Only** → **Ubuntu 22.04 LTS**
4. **Choose your instance plan**:
   - Select **$5 USD** (1GB RAM, 1 vCore, 40GB SSD)
5. **Name your instance**: `taxguard-production`
6. Click **"Create instance"**

### 1.3 Configure Networking
1. Wait for instance to start (2-3 minutes)
2. Click on instance name
3. Go to **"Networking"** tab
4. Click **"Create static IP"**
5. Attach to your instance
6. Click **"Firewall"** → Add rules:
   ```
   HTTP  - TCP - 80
   HTTPS - TCP - 443
   Custom - TCP - 5432 (only if external DB access needed)
   ```

### 1.4 Download SSH Key
1. Go to **"Account"** → **"SSH keys"**
2. Download your default private key
3. Save as `lightsail-key.pem`

---

## Step 2: Connect to Your Instance

### On Windows (using PuTTY):
1. Download PuTTYgen
2. Load `lightsail-key.pem`
3. Save as `lightsail-key.ppk`
4. Open PuTTY:
   - Host: `ubuntu@YOUR_STATIC_IP`
   - Connection → SSH → Auth → Browse to `.ppk` file
   - Click Open

### On Mac/Linux:
```bash
chmod 400 lightsail-key.pem
ssh -i lightsail-key.pem ubuntu@YOUR_STATIC_IP
```

---

## Step 3: Server Setup

### 3.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.2 Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x
```

### 3.3 Install Python 3
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version  # Should show Python 3.10+
```

### 3.4 Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.5 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.6 Install PM2 (Process Manager for Node.js)
```bash
sudo npm install -g pm2
```

### 3.7 Install Git
```bash
sudo apt install -y git
```

---

## Step 4: Clone Your Repository

```bash
# Create application directory
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www

# Clone repository
cd /var/www
git clone https://github.com/kaps10000/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git taxguard
cd taxguard

# Checkout appropriate branch
git checkout updated-main  # or your production branch
```

---

## Step 5: Database Setup

### 5.1 Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console, run:
CREATE DATABASE taxguard;
CREATE USER taxguard_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE taxguard TO taxguard_user;
\q
```

### 5.2 Configure PostgreSQL for Local Connections
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line:
```
local   all             taxguard_user                           md5
host    all             taxguard_user   127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 5.3 Run Database Migrations
```bash
cd /var/www/taxguard

# Run any SQL migration files
sudo -u postgres psql -d taxguard -f migrations/001_initial_schema.sql
sudo -u postgres psql -d taxguard -f migrations/002_blockchain_schema.sql
sudo -u postgres psql -d taxguard -f migrations/003_update_whistlepro_schema.sql

# Run Knex migrations for Whistlepro
cd whistlepro_backend
npm install
npx knex migrate:latest
```

---

## Step 6: Install Service Dependencies

### 6.1 Node.js Services
```bash
cd /var/www/taxguard

# Blockchain
cd blockchain && npm install && cd ..

# Whistlepro
cd whistlepro_backend && npm install && cd ..

# OCR Backend
cd ocr-backend && npm install && cd ..

# API Gateway
cd api-gateway && npm install && cd ..

# OCR AI Service
cd ai-service && npm install && cd ..
```

### 6.2 Python Services
```bash
cd /var/www/taxguard

# GhostBuster Backend
cd GhostBuster/backend
pip3 install -r requirements.txt
cd ../..

# Anomaly Tracker
cd predictive_analytics
pip3 install -r requirements.txt
cd ..

# VRT Guard
cd vrt_guard
pip3 install -r requirements.txt
cd ..
```

---

## Step 7: Configure Environment Variables

See `ENVIRONMENT-CONFIG.md` for details on configuring `.env` files for each service.

Key configurations:
- Database connection strings
- API URLs
- Ports
- Secrets and keys

---

## Step 8: Build Frontend Applications

### 8.1 Dashboard Frontend
```bash
cd /var/www/taxguard/dashboard_integration/frontend
npm install
npm run build
# Build output will be in 'dist' folder
```

### 8.2 GhostBuster Frontend
```bash
cd /var/www/taxguard/GhostBuster/frontend
npm install
npm run build
# Build output will be in 'build' folder
```

---

## Step 9: Start Services with PM2

```bash
cd /var/www/taxguard

# Create PM2 ecosystem file (see ecosystem.config.js)
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Run the command that PM2 outputs
```

---

## Step 10: Setup Python Services with Systemd

See `systemd-services/` folder for service files.

```bash
# Copy systemd service files
sudo cp systemd-services/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable ghostbuster anomaly-tracker vrt-guard
sudo systemctl start ghostbuster anomaly-tracker vrt-guard
```

---

## Step 11: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx/taxguard.conf /etc/nginx/sites-available/taxguard

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/taxguard /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 12: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will auto-renew certificates
```

---

## Step 13: Verify Deployment

### Check Services
```bash
# Check PM2 services
pm2 status

# Check Python services
sudo systemctl status ghostbuster
sudo systemctl status anomaly-tracker
sudo systemctl status vrt-guard

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql
```

### Test Endpoints
```bash
# API Gateway
curl http://localhost:4001/health

# Blockchain
curl http://localhost:3001/health

# GhostBuster
curl http://localhost:5001/health
```

### Access Application
Open browser and go to:
- `http://YOUR_STATIC_IP` (or your domain)

---

## Monitoring & Maintenance

### View Logs
```bash
# PM2 logs
pm2 logs

# Python service logs
sudo journalctl -u ghostbuster -f
sudo journalctl -u anomaly-tracker -f
sudo journalctl -u vrt-guard -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart all PM2 services
pm2 restart all

# Restart specific Python service
sudo systemctl restart ghostbuster

# Restart Nginx
sudo systemctl restart nginx
```

### Update Application
```bash
cd /var/www/taxguard
git pull origin updated-main

# Reinstall dependencies if needed
cd service-folder && npm install

# Restart services
pm2 restart all
sudo systemctl restart ghostbuster anomaly-tracker vrt-guard
```

---

## Cost Breakdown

| Item | Cost/Month |
|------|------------|
| Lightsail Instance (1GB) | $5.00 |
| Static IP | $0.00 (included) |
| Data Transfer (2TB) | $0.00 (included) |
| **TOTAL** | **$5.00/month** |

**Additional costs:**
- Domain name: ~$12/year (~$1/month) - optional
- Backup snapshots: $0.05/GB/month - optional

---

## Backup Strategy

### Manual Snapshot
1. Go to Lightsail console
2. Click your instance
3. Go to "Snapshots" tab
4. Click "Create snapshot"
5. Cost: ~$0.05/GB/month

### Automated Backups
```bash
# Database backup script
sudo nano /usr/local/bin/backup-db.sh
```

See `scripts/backup-db.sh` for backup script.

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
pm2 logs service-name
sudo journalctl -u service-name -n 50
```

### Out of Memory
```bash
# Check memory usage
free -h

# Upgrade to $10/month plan (2GB RAM)
```

### Can't Connect to Database
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U taxguard_user -d taxguard -h localhost
```

---

## Security Best Practices

1. **Firewall**: Only open required ports
2. **SSH**: Disable password authentication, use keys only
3. **Database**: Never expose to public internet
4. **Secrets**: Use environment variables, never commit to Git
5. **Updates**: Regularly update system packages
6. **SSL**: Always use HTTPS in production
7. **Backups**: Regular database and instance snapshots

---

## Next Steps

1. [ ] Point your domain to Lightsail static IP
2. [ ] Setup SSL certificate with Certbot
3. [ ] Configure monitoring and alerts
4. [ ] Setup automated backups
5. [ ] Load test your application
6. [ ] Setup CI/CD pipeline (optional)

---

## Support

**AWS Lightsail Documentation**: https://lightsail.aws.amazon.com/ls/docs
**AWS Support**: Available in AWS console

---

**Deployment Date**: _________
**Instance IP**: _________
**Domain**: _________
**Admin Contact**: _________
