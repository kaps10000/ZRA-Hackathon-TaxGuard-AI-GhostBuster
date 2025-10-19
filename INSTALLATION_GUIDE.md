# GhostBuster Installation Guide

## Prerequisites

Before installing GhostBuster, ensure you have the following installed:

1. **Python 3.8 or higher**
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Node.js 16 or higher**
   - Download from: https://nodejs.org/
   - This includes npm (Node Package Manager)

3. **pip** (Python package installer)
   - Usually comes with Python installation

## Quick Start (Windows)

### Step 1: Setup Backend

1. Open Command Prompt or PowerShell
2. Navigate to the GhostBuster directory:
   ```
   cd C:\Users\dell\Desktop\ghostbuster
   ```

3. Run the backend setup script:
   ```
   setup_backend.bat
   ```

This will:
- Install all Python dependencies
- Generate 10,000 synthetic employee records
- Generate NAPSA, Home Affairs, and Bank transaction datasets

### Step 2: Setup Frontend

1. In the same directory, run:
   ```
   setup_frontend.bat
   ```

This will install all Node.js dependencies for the React frontend.

### Step 3: Start the Application

You need to run both the backend and frontend:

**Terminal 1 - Backend Server:**
```
start_backend.bat
```

**Terminal 2 - Frontend Application:**
```
start_frontend.bat
```

The application will automatically open in your browser at http://localhost:3000

## Manual Installation

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python generate_datasets.py
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Troubleshooting

### Python not found
- Make sure Python is installed and added to PATH
- Restart your terminal after installing Python

### pip install fails
- Try: `python -m pip install --upgrade pip`
- Then run: `pip install -r requirements.txt` again

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` folder and try again

### Port 5000 already in use
- Change the port in `backend/app.py` (last line)
- Update the port in `frontend/src/components/*.js` files (API_BASE variable)

### Port 3000 already in use
- The system will prompt you to use a different port
- Type 'Y' to accept

## Dataset Information

After running `generate_datasets.py`, the following files will be created in `backend/data/`:

- `master_records.csv` - 10,000 employee records
- `napsa_contributions.csv` - NAPSA contribution history
- `home_affairs_registry.csv` - NRC registry including death records
- `bank_transactions.csv` - Bank transaction records from 10 Zambian banks

## Verification

To verify everything is working:

1. Backend Health Check:
   - Visit: http://localhost:5000/api/health
   - Should return: `{"status": "healthy"}`

2. Frontend:
   - Visit: http://localhost:3000
   - You should see the GhostBuster dashboard

## Next Steps

1. Go to "Individual Analysis" tab
2. Click "Load Samples" to get test NRCs
3. Click any sample to auto-fill the form
4. Click "Analyze Employee" to see results

Or:

1. Go to "Batch Analysis" tab
2. Download the CSV template
3. Upload the template file
4. Click "Analyze Batch"

## System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 500MB for datasets and application
- **OS**: Windows 10/11, macOS, or Linux
- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)

## Support

For issues or questions:
- Check the README.md file
- Review the code documentation
- Create an issue in the project repository
