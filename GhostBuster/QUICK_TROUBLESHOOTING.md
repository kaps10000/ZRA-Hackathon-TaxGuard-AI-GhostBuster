# GhostBuster - Quick Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "react-scripts is not recognized"

**Problem:** Frontend dependencies not installed

**Solution:**
```bash
cd C:\Users\dell\Desktop\ghostbuster\frontend
npm install
```

Wait 2-5 minutes for installation to complete. You'll see many warnings - this is NORMAL.

**Verify installation worked:**
```bash
cd frontend
dir node_modules
```
You should see many folders.

---

### Issue 2: "pip is not recognized"

**Problem:** Python not in PATH

**Solution 1 - Add Python to PATH:**
1. Find Python installation (usually `C:\Users\dell\AppData\Local\Programs\Python\Python3XX`)
2. Add to system PATH
3. Restart terminal

**Solution 2 - Use full path:**
```bash
C:\Users\dell\AppData\Local\Programs\Python\Python311\python.exe -m pip install -r requirements.txt
```

---

### Issue 3: Backend won't start - "No module named 'flask'"

**Problem:** Backend dependencies not installed

**Solution:**
```bash
cd C:\Users\dell\Desktop\ghostbuster\backend
pip install -r requirements.txt
```

---

### Issue 4: "File not found: data/master_records.csv"

**Problem:** Datasets not generated

**Solution:**
```bash
cd C:\Users\dell\Desktop\ghostbuster\backend
python generate_datasets.py
```

Wait ~30 seconds. You should see:
- "✓ Generated 10000 master records"
- "✓ Generated XXXXX NAPSA contribution records"
- etc.

---

### Issue 5: Port 5000 already in use

**Problem:** Another application using port 5000

**Solution 1 - Find and kill the process:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Solution 2 - Change port:**
Edit `backend/app.py`, last line:
```python
app.run(debug=True, port=5001, host='0.0.0.0')  # Changed to 5001
```

Then update frontend API URLs in all component files:
```javascript
const API_BASE = 'http://localhost:5001/api';  // Changed to 5001
```

---

### Issue 6: Port 3000 already in use

**Problem:** Another application using port 3000

**Solution:**
When prompted "Would you like to run the app on another port instead? (Y/n)"
Type: `Y`

It will use port 3001 instead.

---

### Issue 7: CORS errors in browser console

**Problem:** Backend not running or CORS not enabled

**Solution:**
1. Make sure backend is running: `start_backend.bat`
2. Check http://localhost:5000/api/health in browser
3. Verify flask-cors is installed: `pip install flask-cors`

---

### Issue 8: "npm install" fails

**Problem:** npm cache or network issues

**Solution:**
```bash
npm cache clean --force
cd C:\Users\dell\Desktop\ghostbuster\frontend
npm install
```

If still fails:
```bash
# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Try again
npm install
```

---

### Issue 9: Charts not displaying

**Problem:** recharts not installed

**Solution:**
```bash
cd frontend
npm install recharts
```

---

### Issue 10: File upload not working

**Problem:** react-dropzone not installed

**Solution:**
```bash
cd frontend
npm install react-dropzone
```

---

## Quick Health Checks

### Backend Health Check
```bash
# Terminal 1
cd C:\Users\dell\Desktop\ghostbuster\backend
python app.py
```

**Expected output:**
```
Loading datasets...
✓ Datasets loaded successfully
GhostBuster API Server
...
Running on http://0.0.0.0:5000
```

**Test in browser:** http://localhost:5000/api/health

**Should return:**
```json
{"status": "healthy", "datasets_loaded": true}
```

---

### Frontend Health Check
```bash
# Terminal 2
cd C:\Users\dell\Desktop\ghostbuster\frontend
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view ghostbuster-frontend in the browser.
  Local: http://localhost:3000
```

**Browser opens automatically to:** http://localhost:3000

---

## Complete Reset (Nuclear Option)

If everything is broken:

```bash
# 1. Stop all running servers (Ctrl+C in terminals)

# 2. Delete generated files
cd C:\Users\dell\Desktop\ghostbuster\backend
rmdir /s /q data
mkdir data

# 3. Delete frontend dependencies
cd C:\Users\dell\Desktop\ghostbuster\frontend
rmdir /s /q node_modules
del package-lock.json

# 4. Reinstall everything
cd C:\Users\dell\Desktop\ghostbuster
setup_backend.bat
setup_frontend.bat

# 5. Start fresh
start_backend.bat
start_frontend.bat
```

---

## System Requirements Verification

### Check Python Version
```bash
python --version
```
**Should be:** Python 3.8 or higher

### Check Node.js Version
```bash
node --version
```
**Should be:** v16.0.0 or higher

### Check npm Version
```bash
npm --version
```
**Should be:** 8.0.0 or higher

### Check pip Version
```bash
pip --version
```
**Should work and show version**

---

## Installation Verification

### Backend Verification
```bash
cd backend

# Check if packages are installed
pip list | findstr flask
pip list | findstr pandas
pip list | findstr numpy
```

**Should show:**
- flask
- flask-cors
- pandas
- numpy
- faker

### Frontend Verification
```bash
cd frontend

# Check if node_modules exists
dir node_modules

# Check if react is installed
npm list react
```

**Should show:** react@18.2.0

---

## Manual Step-by-Step Setup

If automated scripts fail:

### Backend Setup
```bash
# 1. Navigate to backend
cd C:\Users\dell\Desktop\ghostbuster\backend

# 2. Install dependencies
pip install flask==3.0.0
pip install flask-cors==4.0.0
pip install pandas==2.1.4
pip install numpy==1.26.2
pip install faker==22.0.0
pip install scikit-learn==1.3.2
pip install openpyxl==3.1.2
pip install python-dateutil==2.8.2

# 3. Generate datasets
python generate_datasets.py

# 4. Start server
python app.py
```

### Frontend Setup
```bash
# 1. Navigate to frontend
cd C:\Users\dell\Desktop\ghostbuster\frontend

# 2. Install dependencies
npm install react react-dom
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install axios recharts react-dropzone file-saver
npm install react-scripts

# 3. Start server
npm start
```

---

## Getting Help

### Check Logs
- Backend logs: Look in terminal running `start_backend.bat`
- Frontend logs: Look in terminal running `start_frontend.bat`
- Browser console: Press F12 in browser

### Common Error Messages

**"ModuleNotFoundError: No module named 'X'"**
→ Backend dependency missing: `pip install X`

**"Cannot find module 'X'"**
→ Frontend dependency missing: `npm install X`

**"ENOENT: no such file or directory"**
→ File missing or wrong directory: Check your current directory

**"Address already in use"**
→ Port conflict: Change port or kill existing process

---

## Contact Information

For issues not covered here:
1. Check the full documentation:
   - INSTALLATION_GUIDE.md
   - USER_GUIDE.md
   - TESTING_CHECKLIST.md

2. Review error messages carefully

3. Google the specific error message

---

**Last Resort:** Delete the entire `ghostbuster` folder and rebuild from scratch. All files are self-contained.

---

**Current Status:** npm install is running...
This can take 2-5 minutes on first install.
Be patient! ☕
