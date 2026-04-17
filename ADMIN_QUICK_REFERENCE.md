# Admin Dashboard - Quick Reference Card

## 🚀 Quick Start

### Login
```
URL: http://localhost:5173/admin-login
Email: admin@zylocover.com
Password: Admin1234!
```

### Access Dashboard
```
URL: http://localhost:5173/admin
```

## 📋 Tabs Overview

| Tab | Purpose | Key Features |
|-----|---------|--------------|
| **Dashboard** | Financial & operational metrics | Loss ratio, claims stats, forecasts |
| **Approvals** | Review new users | Job proof images, location data, approve/reject |
| **Users** | Manage all users | Search, blacklist, view details |
| **Claims** | View all claims | Filter by status, trigger type |
| **Fraud Queue** | Review flagged claims | AI fraud scores, approve/reject |
| **Config** | System settings | Fraud thresholds, income limits |
| **Simulator** | Test triggers | Simulate weather events |

## 🔍 Approvals Tab - Quick Guide

### View Pending Users
1. Click "Approvals" tab
2. See table of pending registrations
3. Shows: Name, Email, Platform, City, Income, Date

### Review User Profile
1. Click "Review" button
2. Modal opens with:
   - ✅ Job proof image (verify authenticity)
   - ✅ Personal info (name, email, phone)
   - ✅ Work details (platform, income, experience)
   - ✅ Location data (GPS, address)
   - ✅ Account stats (policies, claims, risk score)

### Approve User
1. Review all details
2. Click "Approve User" (green button)
3. Confirm action
4. User can now buy policies

### Reject User
1. Review details
2. Click "Reject User" (red button)
3. Enter rejection reason
4. Confirm action
5. User account deactivated

## 🔑 Key Shortcuts

| Action | Shortcut |
|--------|----------|
| Close Modal | ESC or Click X |
| Next Page | Click "Next" button |
| Previous Page | Click "Previous" button |
| Refresh Data | Reload page |

## 📊 What to Check During Approval

### ✅ Job Proof Image
- [ ] Image is clear and readable
- [ ] Shows employee ID or app screenshot
- [ ] Matches platform claimed (Zomato, Swiggy, etc.)
- [ ] Not a stock photo or fake

### ✅ Work Details
- [ ] Income is realistic (₹500-2000/day typical)
- [ ] Experience matches platform (3+ months minimum)
- [ ] City and zone make sense
- [ ] Platform is valid (Zomato, Swiggy, Blinkit, etc.)

### ✅ Location Data
- [ ] GPS coordinates match claimed city
- [ ] Address is complete and valid
- [ ] Not suspicious location (outside India, etc.)

### ✅ Red Flags
- ⚠️ Very high income (>₹3000/day)
- ⚠️ Very low experience (<1 month)
- ⚠️ Blurry or suspicious image
- ⚠️ Location doesn't match city
- ⚠️ Duplicate email/phone

## 🎯 Decision Guidelines

### APPROVE if:
- ✅ Job proof image is authentic
- ✅ Work details are reasonable
- ✅ Location matches claimed city
- ✅ No red flags present

### REJECT if:
- ❌ Fake or suspicious image
- ❌ Unrealistic income/experience
- ❌ Location mismatch
- ❌ Duplicate account
- ❌ Incomplete information

## 📱 Mobile View

- Approvals tab is responsive
- Table scrolls horizontally on mobile
- Modal adapts to screen size
- All features work on mobile

## 🔧 Troubleshooting

### Modal Won't Open
1. Check browser console for errors
2. Refresh page
3. Clear cache

### Images Not Loading
1. Check internet connection
2. Verify Cloudinary is configured
3. Check image URL is valid

### Can't Approve/Reject
1. Verify admin token is valid
2. Check backend is running
3. Look for API errors in console

### Data Not Updating
1. Refresh page
2. Check backend logs
3. Verify database connection

## 🚨 Emergency Actions

### Blacklist User
1. Go to "Users" tab
2. Find user
3. Click "Blacklist"
4. Enter reason
5. Confirm

### Whitelist User
1. Go to "Users" tab
2. Filter by "blacklisted"
3. Find user
4. Click "Whitelist"
5. Confirm

## 📞 Support

### Backend Issues
- Check: `Backend/` terminal for errors
- Restart: `python start.py`

### Frontend Issues
- Check: Browser console (F12)
- Restart: `npm run dev`

### Database Issues
- Check: MySQL is running
- Verify: `.env` has correct DATABASE_URL
- Reset: `python -m app.db.init_db`

## 📈 Metrics to Monitor

### Approval Queue
- **Target:** <24 hours approval time
- **Alert:** >50 pending users

### Approval Rate
- **Healthy:** 80-90% approval rate
- **Alert:** <70% or >95%

### Rejection Reasons
- Track common rejection reasons
- Improve signup flow if needed

## 🎓 Best Practices

1. **Review Thoroughly** - Don't rush approvals
2. **Check Images** - Verify authenticity
3. **Verify Location** - Match city with GPS
4. **Document Rejections** - Always add reason
5. **Monitor Patterns** - Watch for fraud trends
6. **Regular Reviews** - Check queue daily
7. **Communicate** - Note any concerns

## 📝 Notes Field

Use rejection notes to:
- Explain why user was rejected
- Document suspicious patterns
- Help user understand issue
- Track fraud attempts

Example notes:
- "Job proof image appears fake"
- "Location doesn't match claimed city"
- "Income unrealistically high"
- "Duplicate account detected"

---

**Quick Access:**
- Dashboard: `/admin`
- Approvals: `/admin` → Click "Approvals" tab
- Users: `/admin` → Click "Users" tab

**Need Help?** Check `TROUBLESHOOTING.md`

**Last Updated:** 2024-01-17
