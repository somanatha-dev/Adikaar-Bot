# Deployment Guide

## Deployed URLs
- **Frontend**: https://adikaar-bot-front.onrender.com
- **Backend**: https://adikaar-bot-back.onrender.com

## Backend Deployment (Render)

### Environment Variables to Set in Render Dashboard
```
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
GEMINI_API_KEY=<your-gemini-api-key>
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_INDEX=chatbot
PORT=3000
```

### Build & Start Commands
- **Build Command**: `npm install`
- **Start Command**: `node server.js` or `npm run dev` (use node for production)

### Important Notes
- CORS is configured for `https://adikaar-bot-front.onrender.com`
- Socket.IO is configured for the same origin
- Cookies must work cross-origin (credentials: true)

## Frontend Deployment (Render)

### Environment Variables to Set in Render Dashboard
```
VITE_API_URL=https://adikaar-bot-back.onrender.com
VITE_SOCKET_URL=https://adikaar-bot-back.onrender.com
```

### Build & Publish Commands
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Static Site Settings
- Make sure "Redirects/Rewrites" are configured for SPA:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

## Testing After Deployment

1. Visit https://adikaar-bot-front.onrender.com
2. Register a new account
3. Check browser console for any CORS errors
4. Try sending a message to test Socket.IO connection
5. Verify JWT cookie is set (check Application > Cookies in DevTools)

## Common Issues

### CORS Errors
- Backend CORS origin must exactly match frontend URL (no trailing slash)
- Socket.IO CORS must also include the frontend URL
- Ensure `credentials: true` is set on both client and server

### Cookie Issues
- Render uses HTTPS, so cookies with `Secure` flag should work
- If using custom domains, ensure they're on the same root domain or configure SameSite=None

### Socket.IO Connection Failures
- Check that backend is listening on PORT from environment (Render assigns it)
- Verify Socket.IO client is connecting to correct backend URL
- Check Network tab for WebSocket connection attempts

## Local Development
Backend runs on `http://localhost:3000`
Frontend runs on `http://localhost:5173`

Both are configured to work with localhost by default.

## Deploy Steps

1. **Commit changes:**
```bash
git add .
git commit -m "Configure production URLs for Render deployment"
git push origin main
```

2. **Backend Render Setup:**
   - Set all environment variables listed above
   - Deploy will trigger automatically

3. **Frontend Render Setup:**
   - Set `VITE_API_URL` and `VITE_SOCKET_URL` environment variables
   - Configure redirects for SPA routing
   - Deploy will trigger automatically

4. **Verify Connection:**
   - Open frontend URL in browser
   - Open DevTools Console and Network tabs
   - Register/login and send a test message
