# 🔄 Migration Guide: Dual Service → Unified Architecture

## Overview

This guide helps you migrate from the old dual-service architecture (separate backend and AI processes) to the new unified architecture (single process).

## What Changed?

### Old Architecture ❌
```
Terminal 1: python -m uvicorn app.main:app --port 8000
Terminal 2: python -m uvicorn app.ai.service:app --port 8001
```

### New Architecture ✅
```
Terminal 1: python start.py
```

## Migration Steps

### Step 1: Backup Current Setup

```bash
# Backup database
mysqldump -u root -p zylocover > backup_$(date +%Y%m%d).sql

# Backup code
cp -r Backend Backend_backup_$(date +%Y%m%d)
```

### Step 2: Update Code

```bash
cd Backend

# Pull latest changes
git pull origin main

# Or manually update files:
# - app/main.py (AI service now mounted)
# - app/services/ai_client.py (updated URL)
# - start.py (new unified startup)
# - check_health.py (new health check)
```

### Step 3: Update Dependencies

```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Update dependencies (if any new ones)
pip install -r requirements.txt
```

### Step 4: Update Environment Variables

No changes needed! Your existing `.env` file works as-is.

### Step 5: Stop Old Services

```bash
# Stop both old processes
# Press Ctrl+C in both terminals

# Or kill processes
# Linux/Mac
pkill -f "uvicorn app.main:app"
pkill -f "uvicorn app.ai.service:app"

# Windows
taskkill /F /IM python.exe
```

### Step 6: Start Unified Service

```bash
python start.py
```

### Step 7: Verify Migration

```bash
# Run health check
python check_health.py

# Expected output:
# ✓ Main Backend: Healthy
# ✓ Health Endpoint: Healthy
# ✓ Readiness Check: Healthy
# ✓ AI Service: Healthy
# ✓ API Documentation: Healthy
# ✓ AI Models: 5 loaded
```

### Step 8: Update Frontend (if needed)

No changes needed! The frontend continues to use the same API endpoints.

### Step 9: Update Deployment Scripts

If you have custom deployment scripts, update them:

**Old:**
```bash
# start_backend.sh
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
python -m uvicorn app.ai.service:app --host 0.0.0.0 --port 8001 &
```

**New:**
```bash
# start_backend.sh
python start.py
```

### Step 10: Update Process Managers

#### Systemd

**Old:**
```ini
# /etc/systemd/system/zylocover-backend.service
ExecStart=/path/to/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# /etc/systemd/system/zylocover-ai.service
ExecStart=/path/to/.venv/bin/uvicorn app.ai.service:app --host 0.0.0.0 --port 8001
```

**New:**
```ini
# /etc/systemd/system/zylocover.service
ExecStart=/path/to/.venv/bin/python start.py
```

```bash
# Reload and restart
sudo systemctl daemon-reload
sudo systemctl stop zylocover-backend zylocover-ai
sudo systemctl disable zylocover-backend zylocover-ai
sudo systemctl enable zylocover
sudo systemctl start zylocover
```

#### PM2

**Old:**
```bash
pm2 delete zylocover-backend
pm2 delete zylocover-ai
```

**New:**
```bash
pm2 start start.py --name zylocover --interpreter python3
pm2 save
```

#### Docker

**Old:**
```dockerfile
# Two separate containers
```

**New:**
```bash
# Single container
docker-compose up -d
```

## API Endpoint Changes

### AI Service Endpoints

**Old URLs:**
```
http://localhost:8001/predict/fraud
http://localhost:8001/predict/premium
http://localhost:8001/predict/risk
http://localhost:8001/predict/anomaly
http://localhost:8001/forecast/{city}
http://localhost:8001/health
```

**New URLs:**
```
http://localhost:8000/ai/predict/fraud
http://localhost:8000/ai/predict/premium
http://localhost:8000/ai/predict/risk
http://localhost:8000/ai/predict/anomaly
http://localhost:8000/ai/forecast/{city}
http://localhost:8000/ai/health
```

**Note:** The `ai_client.py` already handles this change automatically. No code changes needed in your application.

## Rollback Plan

If you need to rollback:

```bash
# Stop unified service
pkill -f "python start.py"

# Restore backup
rm -rf Backend
mv Backend_backup_YYYYMMDD Backend
cd Backend

# Start old way
python -m uvicorn app.main:app --port 8000 &
python -m uvicorn app.ai.service:app --port 8001 &
```

## Benefits of Migration

✅ **Simpler Deployment** - One process instead of two  
✅ **Lower Resource Usage** - Shared memory and connections  
✅ **Easier Monitoring** - Single health check  
✅ **Better Performance** - No network overhead  
✅ **Reduced Complexity** - Fewer moving parts  
✅ **Easier Scaling** - Scale entire stack together  

## Troubleshooting

### Issue: AI service not responding

**Solution:**
```bash
# Check if AI models are loaded
curl http://localhost:8000/ai/health

# Retrain models if needed
python train_all_models.py
```

### Issue: Port 8000 already in use

**Solution:**
```bash
# Find and kill process
# Linux/Mac
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: Database connection error

**Solution:**
```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
python -c "from app.db.session import engine; engine.connect()"
```

## Verification Checklist

- [ ] Old services stopped
- [ ] New unified service started
- [ ] Health check passes
- [ ] AI models loaded (5 models)
- [ ] Frontend can connect
- [ ] API endpoints working
- [ ] Admin dashboard accessible
- [ ] Claims processing working
- [ ] Automation engine running

## Support

If you encounter issues during migration:

1. **Check logs**: `tail -f logs/app.log`
2. **Run health check**: `python check_health.py`
3. **Verify setup**: Check SETUP.md
4. **Rollback if needed**: Use backup

---

**Migration complete! Your system is now running on unified architecture.**
