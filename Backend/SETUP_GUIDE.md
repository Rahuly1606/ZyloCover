# 🚀 Backend Setup & Troubleshooting Guide

## Quick Start

### Option 1: Using the Startup Script (Recommended)

**Windows (PowerShell):**
```powershell
cd Backend
.\run.ps1
```

**Windows (Command Prompt):**
```cmd
cd Backend
run.bat
```

**Linux/macOS:**
```bash
cd Backend
chmod +x run.sh
./run.sh
```

### Option 2: Manual Setup

1. **Navigate to Backend directory:**
   ```bash
   cd Backend
   ```

2. **Create and activate virtual environment:**
   
   **Windows:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   
   **Linux/macOS:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## Verification

Once started, you should see:
- ✅ Database tables initialized
- ✅ Demo user credentials (check logs)
- ✅ RaahPay Automation Engine started
- ✅ Application startup complete

**Access the API:**
- API: http://127.0.0.1:8000
- Interactive Docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'app'`

**Cause:** Running uvicorn from the wrong directory

**Fix:** Make sure you're in the `Backend` directory before running the server:
```bash
cd Backend  # Navigate HERE first
python -m uvicorn app.main:app --reload
```

### Error: `type object 'Policy' has no attribute 'city'`

**Cause:** Model schema mismatch (now FIXED ✅)

**Fix:** This was fixed in the scheduler and admin routes. If you still see this:
1. Pull the latest changes
2. Restart the server

### Error: `ModuleNotFoundError` for dependencies

**Fix:** Reinstall dependencies
```bash
pip install -r requirements.txt --force-reinstall
```

### Port 8000 already in use

**Fix:** Use a different port
```bash
python -m uvicorn app.main:app --port 8001
```

### Virtual environment activation fails

**Windows PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**Windows CMD:** Just run `run.bat`

## Database Configuration

The app uses MySQL/MariaDB. Ensure your database is running and configured in `.env`:

```bash
# .env file
DATABASE_URL=mysql+pymysql://username:password@localhost/zylocover
```

See `.env.example` for more details.

## Environment Variables

Required:
- `DATABASE_URL` - MySQL connection string
- `OPENWEATHER_API_KEY` - Weather API key for trigger detection
- `WAQI_API_KEY` - Air quality API key

Optional:
- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 127.0.0.1)

## Demo Credentials

After starting the server successfully, you'll see demo user credentials:

```
Email: demo@zylocover.com
Password: Demo1234!
```

Use these to test the API endpoints.

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Cannot find Python | Install Python 3.9+ from python.org |
| pip not found | Add Python to PATH or use `python -m pip` |
| Database connection error | Check `.env` credentials and ensure MySQL is running |
| Port binding error | Change port with `--port 8001` |
| Slow startup | First run takes longer as it initializes tables |

## Next Steps

Once the backend is running:

1. **Test the API:**
   - Open http://127.0.0.1:8000/docs in your browser
   - Try the interactive endpoints

2. **Frontend Development:**
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```

3. **Check the logs:**
   - Monitor the terminal for ERROR or WARNING messages
   - Look for scheduler job execution logs

## Deployment to Render

The `Procfile` file handles deployment configuration automatically:

```
web: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Key Points:**
- `--host 0.0.0.0` - Binds to all network interfaces (required for external access)
- `--port $PORT` - Uses Render's environment variable for dynamic port assignment
- Render detects and uses this automatically

**Deployment Steps:**

1. **Ensure Procfile exists** in Backend directory ✅
2. **Set environment variables on Render:**
   - `DATABASE_URL=mysql+aiomysql://user:pass@host/zylocover`
   - `OPENWEATHER_API_KEY=...`
   - `WAQI_API_KEY=...`
3. **Push to GitHub:**
   ```bash
   git add Backend/Procfile Backend/requirements.txt Backend/setup.sh
   git commit -m "fix: deployment configuration"
   git push origin master
   ```
4. **Render automatically redeploys** (~2-3 minutes)
5. **Verify:**
   - Check deployment logs for "Uvicorn running on http://0.0.0.0:PORT"
   - Visit `https://<your-service>.onrender.com/docs`
   - Test login with demo credentials

**Troubleshooting Render Deployment:**

| Issue | Solution |
|-------|----------|
| "No open ports detected" | Ensure Procfile has `--host 0.0.0.0` ✅ Fixed |
| Health check timeout | Check logs for startup errors, verify DATABASE_URL |
| Module not found error | All 62 dependencies have explicit versions ✅ |
| Database connection error | Verify DATABASE_URL matches Aiven credentials |

---

## Getting Help

If you encounter issues:
1. Check the error logs carefully
2. Verify all environment variables are set
3. Ensure database is running and accessible
4. Check that you're in the `Backend` directory
5. Try the troubleshooting steps above

---

**Happy coding! 🚀**
