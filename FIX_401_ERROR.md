# 🔧 Fix 401 Unauthorized Error

## Problem
You're getting 401 errors because you have **conflicting tokens from other projects** in localStorage.

## Quick Fix (Choose One)

### Option 1: Use Fix Tool (Recommended)
1. Go to: **http://localhost:5173/fix-storage.html**
2. Click "Fix Storage"
3. Refresh the page

### Option 2: Browser Console (Fast)
1. Press **F12** to open browser console
2. Paste this code and press Enter:

```javascript
// ZyloCover Storage Fix
const zylocoverKeys = ['access_token', 'admin_token', 'user_id', 'user_data', 'onboarded'];
const allKeys = Object.keys(localStorage);

// Remove conflicting keys
allKeys.forEach(key => {
  if (!zylocoverKeys.includes(key)) {
    console.log('Removing:', key);
    localStorage.removeItem(key);
  }
});

// Fix adminToken → admin_token
if (localStorage.getItem('adminToken')) {
  localStorage.setItem('admin_token', localStorage.getItem('adminToken'));
  localStorage.removeItem('adminToken');
}

console.log('✅ Fixed! Refreshing...');
setTimeout(() => location.reload(), 1000);
```

### Option 3: Clear Everything (Nuclear Option)
1. Press **F12** to open browser console
2. Run: `localStorage.clear(); location.reload();`
3. Login again

## Why This Happens

Your localStorage has tokens from multiple projects:
- ❌ `token` (from another project)
- ❌ `authState` (from another project)
- ❌ `faceattend_auth_token` (from FaceAttend project)
- ❌ `user` (from another project)
- ❌ `adminToken` (wrong key name - should be `admin_token`)

ZyloCover only needs:
- ✅ `access_token`
- ✅ `admin_token`
- ✅ `user_id`
- ✅ `user_data`
- ✅ `onboarded`

## After Fixing

1. Refresh the page
2. If still getting errors, login again:
   - Email: `demo@zylocover.com`
   - Password: (your password)

## Prevention

Use different browsers or incognito mode for different projects to avoid localStorage conflicts.
