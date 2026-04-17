# 🚀 ZyloCover Unified Deployment Guide

## Architecture Overview

The system now runs as a **single unified service** instead of separate backend and AI processes:

```
┌─────────────────────────────────────────────────────────┐
│         Main Backend (Port 8000)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  FastAPI Main App                                 │  │
│  │  • Auth, User, Policy, Claims APIs                │  │
│  │  • Admin Dashboard APIs                           │  │
│  │  • Automation Engine (Scheduler)                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AI Service (Mounted at /ai)                      │  │
│  │  • Fraud Detection Model                          │  │
│  │  • Pricing Model                                  │  │
│  │  • Risk Assessment Model                          │  │
│  │  • Anomaly Detection Model                        │  │
│  │  • Forecasting Model                              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start the Unified Service

```bash
cd Backend
python start.py
```

That's it! Both backend and AI services are now running.

### 2. Verify Services

```bash
python check_health.py
```

Expected output:
```
✓ Main Backend: Healthy
✓ Health Endpoint: Healthy
✓ Readiness Check: Healthy
✓ AI Service: Healthy
✓ API Documentation: Healthy
✓ AI Models: 5 loaded
```

### 3. Access Services

- **Main API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **AI Service**: http://localhost:8000/ai/health
- **AI Docs**: http://localhost:8000/ai/docs

## Production Deployment

### Environment Variables

```bash
# Required
DATABASE_URL=mysql+pymysql://user:pass@host:3306/zylocover
SECRET_KEY=your-secret-key-min-32-chars

# Optional
ENV=production
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://yourdomain.com

# External APIs
OPENWEATHER_API_KEY=your_key
AQI_API_KEY=your_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Deployment Options

#### Option 1: Docker (Recommended)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "start.py"]
```

Build and run:
```bash
docker build -t zylocover-backend .
docker run -p 8000:8000 --env-file .env zylocover-backend
```

#### Option 2: Cloud Platforms

**Render / Railway / Fly.io:**
```bash
# Procfile (already exists)
web: python start.py
```

**AWS EC2 / Google Cloud:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run with systemd
sudo systemctl start zylocover
```

**Heroku:**
```bash
heroku create zylocover-backend
git push heroku main
```

#### Option 3: Traditional Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run with gunicorn (production)
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

### Process Management

#### Using systemd (Linux)

Create `/etc/systemd/system/zylocover.service`:

```ini
[Unit]
Description=ZyloCover Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/zylocover/Backend
Environment="PATH=/opt/zylocover/Backend/.venv/bin"
EnvironmentFile=/opt/zylocover/Backend/.env
ExecStart=/opt/zylocover/Backend/.venv/bin/python start.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable zylocover
sudo systemctl start zylocover
sudo systemctl status zylocover
```

#### Using PM2 (Node.js process manager)

```bash
pm2 start start.py --name zylocover --interpreter python3
pm2 save
pm2 startup
```

## Monitoring

### Health Checks

```bash
# Quick check
curl http://localhost:8000/health

# Comprehensive check
python check_health.py
```

### Logs

```bash
# View logs (systemd)
sudo journalctl -u zylocover -f

# View logs (PM2)
pm2 logs zylocover

# View logs (Docker)
docker logs -f zylocover-backend
```

## Scaling

### Horizontal Scaling

Run multiple instances behind a load balancer:

```bash
# Instance 1
PORT=8001 python start.py

# Instance 2
PORT=8002 python start.py

# Instance 3
PORT=8003 python start.py
```

Configure Nginx load balancer:

```nginx
upstream zylocover {
    server localhost:8001;
    server localhost:8002;
    server localhost:8003;
}

server {
    listen 80;
    server_name api.zylocover.com;

    location / {
        proxy_pass http://zylocover;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Vertical Scaling

Adjust worker count in production:

```python
# start.py
uvicorn.run(
    "app.main:app",
    host="0.0.0.0",
    port=8000,
    workers=8,  # Increase for more CPU cores
)
```

## Troubleshooting

### Service Won't Start

```bash
# Check Python version
python --version  # Should be 3.11+

# Check dependencies
pip install -r requirements.txt

# Check database connection
python -c "from app.db.session import engine; engine.connect()"

# Check AI models
ls -la models/*.pkl
```

### AI Service Not Responding

```bash
# Train models if missing
python train_all_models.py

# Check AI health
curl http://localhost:8000/ai/health
```

### High Memory Usage

```bash
# Reduce workers
ENV=production WORKERS=2 python start.py

# Monitor memory
htop
```

## Migration from Old Architecture

If you were running separate services:

### Old Way (2 processes)
```bash
# Terminal 1
python -m uvicorn app.main:app --port 8000

# Terminal 2
python -m uvicorn app.ai.service:app --port 8001
```

### New Way (1 process)
```bash
python start.py
```

All existing API endpoints remain the same. The AI service is now accessible at `/ai/*` instead of a separate port.

## Benefits

✅ **Single Deployment** - Deploy once, not twice  
✅ **Simplified Operations** - One process to manage  
✅ **Reduced Complexity** - No inter-service networking  
✅ **Lower Resource Usage** - Shared memory and connections  
✅ **Easier Scaling** - Scale the entire stack together  
✅ **Better Performance** - No network overhead between services  

## Support

- **Health Check**: `python check_health.py`
- **API Docs**: http://localhost:8000/docs
- **Logs**: Check systemd/PM2/Docker logs
- **Issues**: Create GitHub issue

---

**Built with ❤️ for India's gig workers**
