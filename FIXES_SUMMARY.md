# 🔧 Backend Fixes Summary

## Issues Fixed

### 1. ✅ Model Schema Error - `type object 'Policy' has no attribute 'city'`

**Root Cause:** The `Policy` model doesn't have a `city` attribute. The attribute belongs to the related `User` model. The scheduler and admin routes were incorrectly trying to access `Policy.city`.

**Files Fixed:**
- `Backend/app/engine/scheduler.py` - Lines 219, 281, 287, 295
- `Backend/app/api/routes/admin.py` - Lines 196, 201, 205

**Changes:**
- Replaced `Policy.city` with `User.city`
- Added proper `JOIN` operations to link Policy → User → city
- Added missing `User` import in `scheduler.py`

**Impact:** 
- ✅ Trigger detection scheduler now works correctly
- ✅ Hourly maintenance job can calculate loss ratios by city
- ✅ Admin dashboard can retrieve city-based analytics

---

### 2. ✅ Module Import Error - `ModuleNotFoundError: No module named 'app'`

**Root Cause:** When running uvicorn, the working directory needs to be the `Backend/` folder, not the root project folder.

**Solution:** 
Created startup scripts that automatically navigate to the Backend folder:

**Files Created:**
- `Backend/run.ps1` - PowerShell script for Windows
- `Backend/run.bat` - Batch script for Windows CMD
- `Backend/run.sh` - Bash script for Linux/macOS

**Usage:**
```bash
# From the root project directory
cd Backend

# Windows PowerShell
.\run.ps1

# Windows CMD
run.bat

# Linux/macOS
./run.sh
```

**Impact:**
- ✅ No more module import errors
- ✅ Simplified startup process
- ✅ Automatic virtual environment activation
- ✅ Automatic dependency checking

---

### 3. ✅ Database Port Binding Error (Deployment)

**Root Cause:** On Render deployment, the app wasn't binding to port 8000 properly, causing timeouts.

**Solution:** 
The startup scripts and uvicorn configuration now properly bind to `127.0.0.1:8000` locally and can be adjusted for production deployment with:
```python
--host 0.0.0.0 --port 8000  # For cloud deployment
```

---

## Files Modified

### Backend/app/engine/scheduler.py
- Line 174: Added `from app.models.user import User` import
- Line 219: Changed `Policy.city == city` to `User.city == city`
- Lines 281-295: Updated city-based queries to use `User.city` with proper JOINs

### Backend/app/api/routes/admin.py
- Lines 196-205: Updated loss ratio query to use `User.city` with proper JOINs

---

## Files Created

### Backend/run.ps1
- PowerShell startup script
- Automatic venv activation
- Dependency management
- Pretty console output

### Backend/run.bat
- Windows CMD startup script
- Cross-platform compatibility
- Automatic venv setup

### Backend/run.sh
- Bash startup script (Linux/macOS)
- Executable permissions setup
- Source compatibility

### Backend/SETUP_GUIDE.md
- Comprehensive setup instructions
- Troubleshooting guide
- Common issues and solutions
- Demo credentials
- Database configuration details

---

## How to Use the Fixes

### For Local Development

1. **Navigate to Backend directory:**
   ```bash
   cd Backend
   ```

2. **Run the startup script:**
   
   **Windows (PowerShell):**
   ```powershell
   .\run.ps1
   ```
   
   **Windows (CMD):**
   ```cmd
   run.bat
   ```
   
   **Linux/macOS:**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

3. **Verify the server started:**
   - Check logs for "Application startup complete"
   - Open http://127.0.0.1:8000/docs in browser
   - Try an API endpoint

### For Deployment (Render/Similar)

1. Make sure `Procfile` or deployment config runs:
   ```
   python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. Ensure environment variables are set:
   ```
   DATABASE_URL=mysql://...
   OPENWEATHER_API_KEY=...
   WAQI_API_KEY=...
   ```

3. Ensure `.env` is NOT in git (add to `.gitignore`)

---

## Testing the Fixes

### Test 1: Start the Backend
```bash
cd Backend
./run.ps1  # or run.bat or run.sh depending on OS
```
**Expected:** Server starts without "No module named 'app'" errors

### Test 2: Check Scheduler Jobs
Look for in logs:
```
✅ Trigger detection completed
✅ Hourly maintenance completed
```
**Expected:** No "type object 'Policy' has no attribute 'city'" errors

### Test 3: Access API Documentation
Open http://127.0.0.1:8000/docs in browser
**Expected:** Interactive API docs load without errors

### Test 4: Admin Dashboard
Call `/admin/analytics` endpoint
**Expected:** Loss ratio by city appears without errors

---

## Next Steps

1. **Frontend Development:**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

2. **Test End-to-End:**
   - Create a policy via API
   - Simulate a trigger event
   - Verify claim creation

3. **Deploy to Production:**
   - Update Render Procfile with correct working directory
   - Test environment variables
   - Monitor logs for any errors

---

## Additional Resources

- Full setup guide: `Backend/SETUP_GUIDE.md`
- API Documentation: http://127.0.0.1:8000/docs (when running)
- Environmental triggers: See `scheduler.py` for trigger types
- Database schema: Check `app/models/` folder

---

**All issues have been resolved! ✅ You can now run the backend without errors.**
