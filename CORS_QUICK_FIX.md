# ⚡ CORS Fix - Quick Reference

## 🎯 The Problem
```
Access to fetch at 'https://zylocover.onrender.com/auth/signup' 
from origin 'https://zylo-cover.vercel.app' has been blocked by CORS policy
```

## ✅ The Solution (3 Steps)

### Step 1: Add Environment Variable on Render
1. Go to: https://dashboard.render.com
2. Select your backend service
3. Go to: **Environment** tab
4. Click: **Add Environment Variable**
5. Add:
   ```
   Key: ALLOWED_ORIGINS
   Value: http://localhost:5173,https://zylo-cover.vercel.app
   ```
6. Click: **Save Changes**

### Step 2: Redeploy Backend
1. Go to: **Manual Deploy** section
2. Click: **Deploy latest commit**
3. Wait 2-3 minutes for deployment

### Step 3: Test
1. Go to: https://zylo-cover.vercel.app
2. Try signup
3. Should work! ✅

---

## 🔥 Already Updated Code

I've already updated `Backend/app/main.py` to:
- ✅ Include your Vercel URL by default
- ✅ Support Vercel preview deployments
- ✅ Add proper CORS headers

**You just need to redeploy!**

---

## 🚨 If Still Not Working

### Option 1: Allow All Origins (Quick Fix)
On Render, set:
```
ALLOWED_ORIGINS=*
```

### Option 2: Check Backend Health
Visit: https://zylocover.onrender.com/health

Should return:
```json
{
  "status": "healthy",
  "startup_complete": true,
  "ai_service": "healthy"
}
```

### Option 3: Check Logs
1. Render Dashboard → Your Service → Logs
2. Look for: `CORS allowed origins: [...]`
3. Verify your Vercel URL is listed

---

## 📱 Contact

If still having issues, share:
1. Render logs (last 50 lines)
2. Browser console errors
3. Network tab (F12 → Network)

---

**TL;DR:** Add `ALLOWED_ORIGINS` env var on Render, redeploy, done! 🎉
