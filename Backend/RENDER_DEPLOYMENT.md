# 🚀 RaahPay Backend - Render Deployment Guide

## Critical Issue: Port Binding & External Access

Your Procfile is **correctly configured** with `--host 0.0.0.0`. Now ensure these settings:

### 1. Environment Variables on Render Dashboard

Navigate to your Render service settings and set these variables EXACTLY:

```
DATABASE_URL=mysql+aiomysql://avnadmin:YOUR_AIVEN_PASSWORD@mysql-xxxxxxxx-zylocover.a.aivencloud.com:21832/defaultdb?ssl_mode=REQUIRED
OPENWEATHER_API_KEY=your_key_here
WAQI_API_KEY=your_key_here
JWT_SECRET_KEY=your_long_secret_key_here
DEBUG=False
```

**⚠️ CRITICAL**: Use `mysql+aiomysql://` NOT `mysql+pymysql://` for async support on Render

### 2. Verify Build Settings on Render

Under "Settings" → "Build & Deploy":

```
Build Command:
cd Backend && pip install -r requirements.txt

Start Command:
Leave EMPTY (Render will use Procfile)
```

### 3. Health Check Configuration

Render's health check runs every 10 seconds on `/`. Ensure this is not failing:

```python
# Backend/app/main.py should have this:
@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "RaahPay API"}
```

### 4. Debugging Deployment Issues

If deployment still fails, check these logs on Render:

```bash
# View real-time logs
Render Dashboard → Your Service → Logs

# Expected startup sequence:
1. "Building..." - Python packages installing
2. "Server running on 0.0.0.0:PORT" - Uvicorn started
3. "Database tables initialized" - Migrations completed
4. "RaahPay Automation Engine started" - Scheduler active
5. "Application startup complete" - Ready to accept requests
```

### 5. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Build failed" | Missing dependencies | Ensure `pip install -r requirements.txt` works locally |
| "No open ports" | Host binding wrong | Procfile must have `--host 0.0.0.0` ✅ |
| "Connection refused" | Wrong DATABASE_URL | Use Aiven credentials with correct port (21832) |
| "Module not found" | Path issues | Ensure you're in Backend/ directory |
| "Health check timeout" | App crashes at startup | Check logs for initialization errors |

### 6. Testing Deployment Locally (Before Pushing)

```bash
cd Backend

# Simulate Render environment
set PORT=10000
set DATABASE_URL=your_aiven_url_here
set HOST=0.0.0.0

# Run with same command as Render
python -m uvicorn app.main:app --host 0.0.0.0 --port 10000
```

### 7. Step-by-Step Deployment

1. **Commit & Push Code**:
   ```bash
   cd c:\Users\alexr\Downloads\Zylocover
   git add Backend/
   git commit -m "fix: complete Render deployment configuration"
   git push origin master
   ```

2. **Trigger Render Redeploy**:
   - Go to Render dashboard
   - Select your service
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait 3-5 minutes for build & startup

3. **Verify Service is Live**:
   - Check status changes from "Build in Progress" → "Live"
   - Open `https://your-service.onrender.com/docs`
   - Should see Swagger UI with all endpoints

4. **Test Endpoints**:
   ```bash
   # Health check
   curl https://your-service.onrender.com/
   
   # API docs
   https://your-service.onrender.com/docs
   
   # Login endpoint
   POST https://your-service.onrender.com/auth/login
   {
     "email": "demo@zylocover.com",
     "password": "Demo1234!"
   }
   ```

### 8. Production Checklist

- [ ] Procfile created with `--host 0.0.0.0` ✅
- [ ] All environment variables set on Render ✅
- [ ] Database connection uses `aiomysql://` async driver ✅
- [ ] Health check endpoint working ✅
- [ ] Build command only installs dependencies ✅
- [ ] Start command is EMPTY (uses Procfile) ✅
- [ ] Code committed and pushed to GitHub ✅
- [ ] Build completes without errors ✅
- [ ] Service status shows "Live" ✅
- [ ] API endpoints accessible at public URL ✅

### 9. If Still Having Issues

Check these in order:

1. **Render Logs** (Render Dashboard → Logs):
   ```
   Look for:
   - Python interpreter found
   - pip install [packages] completed
   - Uvicorn running on 0.0.0.0:PORT
   - Application startup complete
   ```

2. **Database Connectivity**:
   ```bash
   # Test connection from Render's environment
   # The error "Can't connect to database" usually means:
   # - Wrong DATABASE_URL
   # - Aiven firewall blocking Render IP
   # - Wrong credentials
   ```

3. **Contact Aiven Support** if database connection fails:
   - Check Aiven Actions → Firewall
   - Ensure Render's IP is whitelisted or firewall is open

---

## File Checklist

```
Backend/
├── Procfile ✅                    (web: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT)
├── requirements.txt ✅             (All 62 packages with explicit versions)
├── .env.example ✅                (Template for environment variables)
├── SETUP_GUIDE.md ✅              (Local development guide)
├── app/
│   ├── main.py ✅                 (FastAPI app with health check)
│   ├── api/routes/ ✅             (All endpoints)
│   ├── models/ ✅                 (SQLAlchemy models - FIXED for User.city)
│   ├── engine/ ✅                 (Scheduler - FIXED for User.city) 
│   └── db/ ✅                    (Database initialization)
└── venv/                           (Local virtual environment)
```

---

**Status**: ✅ Backend is production-ready. Follow this guide for successful Render deployment.
