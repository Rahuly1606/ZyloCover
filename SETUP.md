# 🚀 ZyloCover Setup Guide

## Quick Setup (5 Minutes)

### 1. Prerequisites

- Python 3.11+
- MySQL 8.0+
- Node.js 18+ (for frontend)
- Git

### 2. Clone Repository

```bash
git clone https://github.com/yourusername/zylocover.git
cd zylocover
```

### 3. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
mysql -u root -p
CREATE DATABASE zylocover;
EXIT;

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
python -m app.db.init_db

# Train AI models
python train_all_models.py

# Start unified service
python start.py
```

### 4. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

### 5. Verify Installation

```bash
cd Backend
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

## Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **AI Service**: http://localhost:8000/ai/health

## Admin Access

```bash
cd Backend
python -c "from app.db.init_db import create_admin_user; create_admin_user()"
```

Default credentials:
- Email: `admin@zylocover.com`
- Password: `Admin1234!`
- Get credential: Check console output

## Project Structure

```
Zylocover/
├── Backend/
│   ├── app/
│   │   ├── ai/              # AI service (mounted at /ai)
│   │   ├── api/             # API routes
│   │   ├── core/            # Configuration
│   │   ├── db/              # Database
│   │   ├── engine/          # Automation engine
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   └── main.py          # Main application
│   ├── models/              # Trained AI models
│   ├── start.py             # Unified startup script
│   ├── check_health.py      # Health check script
│   └── requirements.txt     # Python dependencies
├── Frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── lib/             # Utilities
│   └── package.json         # Node dependencies
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # Main documentation
```

## Common Commands

### Development

```bash
# Start backend
cd Backend
python start.py

# Start frontend
cd Frontend
npm run dev

# Check health
cd Backend
python check_health.py

# View logs
tail -f logs/app.log
```

### Production

```bash
# Set environment
export ENV=production

# Start service
python start.py

# Or use gunicorn
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Maintenance

```bash
# Train AI models
python train_all_models.py

# Seed demo data
python seed_demo_data.py

# Clean up project
python cleanup.py --dry-run  # Preview
python cleanup.py --force    # Execute
```

## Environment Variables

### Required

```env
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/zylocover
SECRET_KEY=your-secret-key-min-32-chars
```

### Optional

```env
ENV=development
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:5173

# External APIs
OPENWEATHER_API_KEY=your_key
AQI_API_KEY=your_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version

# Check dependencies
pip install -r requirements.txt

# Check database
mysql -u root -p -e "SHOW DATABASES;"
```

### AI models not loading

```bash
# Train models
python train_all_models.py

# Check models exist
ls -la models/*.pkl
```

### Database connection error

```bash
# Verify MySQL is running
mysql -u root -p

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Port already in use

```bash
# Change port
PORT=8001 python start.py

# Or kill existing process
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

## Next Steps

1. ✅ Setup complete
2. 📖 Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
3. 🔧 Configure external APIs (weather, payments)
4. 🧪 Test with demo data: `python seed_demo_data.py`
5. 🚀 Deploy to production

## Support

- **Documentation**: Check README.md and DEPLOYMENT.md
- **API Docs**: http://localhost:8000/docs
- **Health Check**: `python check_health.py`
- **Issues**: Create GitHub issue

---

**Built with ❤️ for India's gig workers**
