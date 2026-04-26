# ZRA TaxGuard AI - Services Access Guide

## All Dependencies Installed Successfully!

All Node.js and Python dependencies have been installed for all services.

## Services Currently Starting

The following services are launching in separate PowerShell windows:

### Core Services

| Service | Port | Access URL | Status Window |
|---------|------|------------|---------------|
| **Dashboard Frontend** | 3000 | http://localhost:3000 | PowerShell Window |
| **API Gateway** | 4001 | http://localhost:4001/health | PowerShell Window |
| **Blockchain Service** | 3001 | http://localhost:3001 | PowerShell Window |
| **GhostBuster Backend** | 5001 | http://localhost:5001/api/health | PowerShell Window |
| **VRT Guard** | 5003 | http://localhost:5003/health | PowerShell Window |
| **Anomaly Tracker** | 5002 | http://localhost:5002/health | PowerShell Window |

### Additional Services

| Service | Port | Access URL | Status Window |
|---------|------|------------|---------------|
| **Predictive Analytics** | 3004 | http://localhost:3004/health | PowerShell Window |
| **OCR Backend** | 4000 | http://localhost:4000 | PowerShell Window |
| **OCR AI Service** | 5000 | http://localhost:5000/docs | PowerShell Window |
| **WhistlePro Backend** | 3005 | http://localhost:3005/api | PowerShell Window |

## Main Dashboard Access

Once all services are running (wait 60-90 seconds), access the main dashboard at:

**http://localhost:3000**

## Service Verification

To check if all services are running, you can:

1. **Check PowerShell Windows**: Each service has its own window showing logs
2. **Check Ports**: Run this PowerShell command:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000,3001,3004,4000,4001,5000,5001,5002,5003 -ErrorAction SilentlyContinue | Select LocalPort, State
   ```

3. **Test URLs**: Visit each service URL above to verify it's responding

## PostgreSQL Database (Optional)

PostgreSQL is not currently running. To enable database features:

### Option 1: Using Docker (Recommended)

1. Start Docker Desktop
2. Run these commands:
   ```bash
   docker run --name zra-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
   docker exec -it zra-postgres psql -U postgres -c "CREATE DATABASE zra_taxguard;"
   ```

### Option 2: Install PostgreSQL Locally

1. Download from: https://www.postgresql.org/download/windows/
2. Install and start PostgreSQL service
3. Create database:
   ```sql
   CREATE DATABASE zra_taxguard;
   ```

## Stopping Services

To stop all services:
- Close each PowerShell window individually, OR
- Run this PowerShell command to kill all processes:
  ```powershell
  Get-Process node,python | Where-Object {$_.Path -like "*ZRA-Hackathon*"} | Stop-Process -Force
  ```

## Troubleshooting

### Service won't start
- Check the PowerShell window for error messages
- Verify the port isn't already in use
- Check that dependencies were installed correctly

### Port conflicts
```powershell
# Find what's using a port (example: port 3000)
Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess
# Kill the process
Stop-Process -Id <process_id> -Force
```

### Missing Python packages
```bash
cd <service-directory>
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Missing Node packages
```bash
cd <service-directory>
npm install
```

## Features Available

### Without Database:
- Dashboard UI
- API routing
- File uploads
- Basic processing

### With Database:
- Blockchain logging
- WhistlePro reports
- GhostBuster detection history
- Analytics tracking
- Full audit trail

## Next Steps

1. Wait 60-90 seconds for all services to fully initialize
2. Open browser to http://localhost:3000
3. Explore the dashboard and all modules
4. (Optional) Set up PostgreSQL for full functionality

## Quick Service Restart

To restart all services quickly, run:
```powershell
.\START-ALL-SERVICES.ps1
```

Or use the commands already executed to start individual services.
