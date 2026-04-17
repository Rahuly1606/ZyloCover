# 🚀 ZyloCover Quick Reference

## Start Services

```bash
# Development (with hot reload)
cd Backend && python start.py

# Production
ENV=production python start.py

# Docker
docker-compose up -d

# PM2
pm2 start start.py --name zylocover --interpreter python3
```

## Health Checks

```bash
# Comprehensive check
python check_health.py

# Quick check
curl http://localhost:8000/health

# AI service check
curl http://localhost:8000/ai/health
```

## Common Commands

```bash
# Setup database
python -m app.db.init_db

# Train AI models
python train_all_models.py

# Seed demo data
python seed_demo_data.py

# Clean project
python cleanup.py --force
```

## Endpoints

- **API Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health
- **AI Health**: http://localhost:8000/ai/health
- **Frontend**: http://localhost:5173

## Troubleshooting

```bash
# Check Python version
python --version

# Check dependencies
pip install -r requirements.txt

# Check database
mysql -u root -p

# View logs
tail -f logs/app.log

# Kill port 8000
lsof -ti:8000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :8000   # Windows
```

## Documentation

- **Setup**: [SETUP.md](SETUP.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Migration**: [MIGRATION.md](MIGRATION.md)
- **Architecture**: [UNIFIED_ARCHITECTURE.md](UNIFIED_ARCHITECTURE.md)

---

**One command to rule them all:** `python start.py`
