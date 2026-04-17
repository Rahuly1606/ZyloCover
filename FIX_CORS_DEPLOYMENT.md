# 🚀 Fix CORS Error - Deployment Guide

## Problem
Your backend on Render is blocking requests from your Vercel frontend due to CORS policy.

## ✅ Solution Applied

I've updated `Backend/app/main.py` to include your Vercel URL in CORS configuration.

## 🔧 Steps to Fix

### 1. Update Backend Environment Variables on Render

Go to your Render dashboard → Your backend service → Environment → Add:

```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://zylo-cover.vercel.app
```

**Important:** Include ALL your frontend URLs:
- Local development: `http://localhost:5173`
- Production: `https://zylo-cover.vercel.app`
- Preview deployments: Will be handled automatically

### 2. Redeploy Backend

After adding the environment variable:
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete (~2-3 minutes)

### 3. Verify CORS is Fixed

Check backend logs on Render. You should see:
```
CORS allowed origins: ['http://localhost:5173', 'http://localhost:3000', 'https://zylo-cover.vercel.app', 'https://*.vercel.app']
```

### 4. Test Signup

Go to your Vercel app and try signup again. It should work now!

---

## 🎯 Alternative: Allow All Origins (Quick Fix)

If you want to allow ALL origins (not recommended for production):

**On Render Environment Variables:**
```
ALLOWED_ORIGINS=*
```

Then update `Backend/app/main.py`:

```python
# Quick fix - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📋 Complete Render Environment Variables

Make sure you have these on Render:

```bash
# Database (Render provides this automatically if using Render PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# OR for MySQL
DATABASE_URL=mysql+pymysql://user:pass@host:3306/dbname

# JWT
SECRET_KEY=your-super-secret-key-min-32-chars-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS (IMPORTANT!)
ALLOWED_ORIGINS=http://localhost:5173,https://zylo-cover.vercel.app

# Environment
ENV=production
LOG_LEVEL=INFO

# Optional: External APIs
OPENWEATHER_API_KEY=your_key_here
AQI_API_KEY=your_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🔍 Troubleshooting

### Still Getting CORS Error?

1. **Check Render Logs:**
   - Go to Render dashboard → Logs
   - Look for: `CORS allowed origins: [...]`
   - Verify your Vercel URL is in the list

2. **Clear Browser Cache:**
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```

3. **Check Backend is Running:**
   - Visit: `https://zylocover.onrender.com/health`
   - Should return: `{"status": "healthy", ...}`

4. **Verify Frontend API URL:**
   - Check `Frontend/.env` or Vercel environment variables
   - Should be: `VITE_API_URL=https://zylocover.onrender.com`

### Backend Not Responding?

Render free tier sleeps after 15 minutes of inactivity. First request takes ~30 seconds to wake up.

**Solution:** Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend every 5 minutes.

---

## 🎉 After Fix

Your app should work perfectly:
1. ✅ Signup works
2. ✅ Login works
3. ✅ All API calls work
4. ✅ No CORS errors

---

## 📝 Quick Checklist

- [ ] Added `ALLOWED_ORIGINS` to Render environment variables
- [ ] Redeployed backend on Render
- [ ] Verified CORS origins in logs
- [ ] Tested signup on Vercel app
- [ ] Cleared browser cache if needed

---

**Need Help?** Check Render logs for detailed error messages.
