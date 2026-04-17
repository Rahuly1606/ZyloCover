# Admin Dashboard - Troubleshooting Guide

## Common Errors & Fixes

### 1. Import Errors

**Error:** `Cannot find module '@/hooks/useAuth'`
**Fix:** Update import in AdminCenter.tsx:
```typescript
// Change from:
import { useAuth } from '@/hooks/useAuth'

// To:
import { useAuth } from '@/contexts/AuthContext'
```

### 2. Missing AdminAction Enum

**Error:** `AdminAction.UPDATE_THRESHOLD is not defined`
**Fix:** In `Backend/app/api/routes/admin_extended.py`, add to AdminAction enum:
```python
class AdminAction(str, Enum):
    APPROVE_CLAIM = "approve_claim"
    REJECT_CLAIM = "reject_claim"
    BLACKLIST_USER = "blacklist_user"
    WHITELIST_USER = "whitelist_user"
    UPDATE_CONFIG = "update_config"
    UPDATE_THRESHOLD = "update_threshold"  # ADD THIS
    SIMULATE_TRIGGER = "simulate_trigger"
    MANUAL_REVIEW = "manual_review"
```

### 3. Database Connection Errors

**Error:** `sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError)`
**Fix:** 
1. Ensure MySQL is running
2. Check `.env` file has correct DATABASE_URL
3. Run: `python -m app.db.init_db`

### 4. Admin Token Not Found

**Error:** `401 Unauthorized - Admin token required`
**Fix:**
1. Check localStorage has `admin_token`
2. Verify admin login worked
3. Check API client includes token in headers:
```typescript
// In api/client.ts
headers: {
  'X-Admin-Token': localStorage.getItem('admin_token')
}
```

### 5. CORS Errors

**Error:** `Access to fetch blocked by CORS policy`
**Fix:** In `Backend/app/main.py`, ensure frontend URL in allowed origins:
```python
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    # Add your frontend URL
]
```

### 6. Modal Not Showing

**Error:** Modal opens but content not visible
**Fix:** Ensure z-index is high enough:
```typescript
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
```

### 7. Image Not Loading

**Error:** Job proof image shows broken image icon
**Fix:**
1. Check Cloudinary URL is valid
2. Verify CORS settings in Cloudinary dashboard
3. Check image URL format:
```typescript
{selectedUser.job_proof_image && (
  <img 
    src={selectedUser.job_proof_image} 
    alt="Job Proof"
    onError={(e) => {
      e.currentTarget.src = '/placeholder-image.png'
    }}
  />
)}
```

### 8. Pagination Not Working

**Error:** Page changes but data doesn't update
**Fix:** Ensure useEffect dependency includes page:
```typescript
useEffect(() => {
    fetchPendingApprovals()
}, [page])  // Add page dependency
```

### 9. Button Variant Not Found

**Error:** `variant="success" is not a valid prop`
**Fix:** Check Button component supports all variants:
```typescript
// In Button component
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'
```

### 10. formatters Not Defined

**Error:** `formatters is not defined`
**Fix:** Import formatters utility:
```typescript
import { formatters } from '@/utils/formatters'
```

## Quick Fixes

### Restart Backend
```bash
cd Backend
python start.py
```

### Restart Frontend
```bash
cd Frontend
npm run dev
```

### Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Check Backend Logs
```bash
# Look for errors in terminal where backend is running
# Common issues:
# - Port already in use
# - Database connection failed
# - Missing environment variables
```

### Check Frontend Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Check Network tab for failed API calls

## Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```
Expected response:
```json
{
  "status": "healthy",
  "startup_complete": true,
  "ai_service": "healthy"
}
```

### 2. Admin Endpoints Check
```bash
# Get pending approvals (requires admin token)
curl -H "X-Admin-Token: YOUR_TOKEN" http://localhost:8000/admin/pending-approvals
```

### 3. Frontend Build Check
```bash
cd Frontend
npm run build
# Should complete without errors
```

## Environment Variables Checklist

### Backend `.env`
```env
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/zylocover
SECRET_KEY=your-secret-key-min-32-chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
```

## Database Schema Check

Ensure User table has all required columns:
```sql
DESCRIBE users;

-- Should include:
-- job_proof_image VARCHAR(500)
-- job_verification_status VARCHAR(20)
-- registered_latitude FLOAT
-- registered_longitude FLOAT
-- registered_address VARCHAR(255)
```

## API Client Configuration

Ensure API client sends admin token:
```typescript
// Frontend/src/api/client.ts
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    headers['X-Admin-Token'] = adminToken
  }
  
  return headers
}
```

## Common TypeScript Errors

### 1. Type 'any' Error
```typescript
// Add proper typing
const [users, setUsers] = useState<any[]>([])
```

### 2. Property Does Not Exist
```typescript
// Use optional chaining
{selectedUser?.job_proof_image && (
  <img src={selectedUser.job_proof_image} />
)}
```

### 3. Cannot Find Module
```typescript
// Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Need More Help?

1. Check browser console for errors
2. Check backend terminal for errors
3. Verify all files were saved
4. Restart both frontend and backend
5. Clear browser cache and localStorage
6. Check database connection
7. Verify admin token is valid

---

**Last Updated:** 2024-01-17
**Version:** 1.0.0
