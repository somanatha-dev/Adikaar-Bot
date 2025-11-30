# Troubleshooting Guide - Frontend Not Working

## Issue: Login/Register not functioning on https://adikaar-bot-front.onrender.com

### Root Causes & Solutions

## 1. Cookie Settings for Cross-Origin (FIXED)
**Problem**: Cookies aren't being set cross-origin between different Render domains.

**Solution Applied**: Updated `auth.controller.js` to use proper cookie settings:
```javascript
res.cookie("token", token, { 
    httpOnly: true,
    secure: true,  // Required for HTTPS
    sameSite: 'none',  // Required for cross-origin
    maxAge: 24 * 60 * 60 * 1000
});
```

## 2. Environment Variables Not Loading (CHECK THIS)

### In Render Dashboard - Frontend Service:

**Navigate to**: Environment tab

**Verify these are set**:
```
VITE_API_URL=https://adikaar-bot-back.onrender.com
VITE_SOCKET_URL=https://adikaar-bot-back.onrender.com
```

**Important**: After adding env vars, click "Save Changes" - this will trigger a rebuild.

### In Render Dashboard - Backend Service:

**Add this new variable**:
```
NODE_ENV=production
```

This enables secure cookies.

## 3. Deploy Steps

### Backend:
```bash
cd Backend
git add src/controllers/auth.controller.js
git commit -m "Fix cookie settings for cross-origin production deployment"
git push origin main
```

In Render:
1. Add `NODE_ENV=production` to environment variables
2. Wait for auto-deploy or trigger manual deploy

### Frontend:
The `.env.production` file is already in your repo, but Render needs the env vars in the dashboard.

In Render Dashboard → Frontend Service → Environment:
1. Add both VITE variables
2. Click "Save Changes" (triggers rebuild)
3. Wait 3-5 minutes for rebuild to complete

## 4. Testing Checklist

Open https://adikaar-bot-front.onrender.com in browser:

### Step 1: Check Console (F12)
Look for errors related to:
- CORS
- Network requests failing
- "import.meta.env" showing correct URLs

### Step 2: Check Network Tab
1. Try to login
2. Look for POST request to `/api/auth/login`
3. Check:
   - Request URL should be `https://adikaar-bot-back.onrender.com/api/auth/login`
   - Response should be 200 OK
   - Response Headers should include `set-cookie`

### Step 3: Check Application Tab
1. Go to Application → Cookies
2. Check if cookie named "token" is set for backend domain
3. Cookie attributes should show:
   - HttpOnly: ✓
   - Secure: ✓
   - SameSite: None

## 5. Common Issues

### Issue: API calls go to localhost
**Symptom**: Network tab shows requests to `http://localhost:3000`
**Fix**: Environment variables not loaded. Rebuild frontend after setting env vars in Render.

### Issue: CORS error
**Symptom**: Console shows "blocked by CORS policy"
**Fix**: Backend CORS already configured. Make sure backend is deployed with latest changes.

### Issue: Cookie not set
**Symptom**: Login succeeds (200 OK) but subsequent requests fail with 401
**Fix**: Cookie settings need `secure: true` and `sameSite: 'none'` for cross-origin HTTPS. Already fixed in code.

### Issue: "Duplicate keys" error in Render
**Fix**: Delete duplicate environment variable entries in Render dashboard.

## 6. Quick Verification Commands

### Test Backend Directly:
```bash
curl -X POST https://adikaar-bot-back.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -v
```

Look for `set-cookie` in response headers.

### Check Frontend Build:
After deployment, the built files should reference your backend URL. You can verify by:
1. View page source on https://adikaar-bot-front.onrender.com
2. Look at the JavaScript bundle
3. Search for "adikaar-bot-back" - it should appear in the code

## 7. Final Checklist

- [ ] Backend: `NODE_ENV=production` set in Render
- [ ] Backend: Latest code with cookie fixes deployed
- [ ] Frontend: `VITE_API_URL` set in Render dashboard
- [ ] Frontend: `VITE_SOCKET_URL` set in Render dashboard
- [ ] Frontend: Rebuilt after adding env vars
- [ ] Both services showing "Live" status in Render
- [ ] No CORS errors in browser console
- [ ] Network requests go to backend URL (not localhost)
- [ ] Cookie is set after login

## Need More Help?

Share:
1. Browser console errors (full text)
2. Network tab screenshot showing the failed request
3. Render deployment logs if services aren't starting
