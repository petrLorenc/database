# Local Admin Panel Testing Guide

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the local development environment**:
   ```bash
   # Option 1: Start both servers together
   npm run dev:full
   
   # Option 2: Start servers separately (in different terminals)
   npm run admin:local    # Terminal 1
   npm start             # Terminal 2
   ```

3. **Access the admin panel**:
   - Open: http://localhost:3000/admin-panel-secret
   - Login with password: `admin123`

## What This Sets Up

- **React App**: http://localhost:3000
- **Local Admin API**: http://localhost:3001
- **Admin Panel**: http://localhost:3000/admin-panel-secret

## Testing Flow

1. **Login to Admin Panel**:
   - Use password: `admin123`
   - This will authenticate you with the local API

2. **Add/Edit Activities**:
   - Click "Přidat aktivitu" to add new activities
   - Fill in all fields (title, descriptions, tags, etc.)
   - Click "Uložit změny" to save

3. **Verify Data Persistence**:
   - Data is stored in memory during the session
   - Refresh the admin panel to see if data persists
   - Check the main app to see protected data loading

## Local vs Production Differences

### Local Testing:
- Uses in-memory storage (data lost on restart)
- Runs on localhost:3001 API
- No Vercel Blob required
- Simple password: `admin123`

### Production:
- Uses Vercel Blob storage (persistent)
- Uses Vercel serverless functions
- Real environment variables
- Secure admin password

## Environment Files

- `.env.local` - Used for local development
- `.env.example` - Template for production setup

## Troubleshooting

### "Failed to fetch" errors:
```bash
# Make sure local API is running
npm run admin:local
```

### "Unauthorized" errors:
- Check password is `admin123`
- Clear localStorage and try again:
  ```js
  // In browser console:
  localStorage.clear()
  ```

### Port conflicts:
- API runs on port 3001
- React app runs on port 3000
- Change ports in `local-admin-api.js` if needed

## Testing Checklist

- [ ] Local API starts without errors
- [ ] React app starts and loads
- [ ] Admin panel accessible at `/admin-panel-secret`
- [ ] Login works with `admin123`
- [ ] Can add new activities
- [ ] Can edit existing activities
- [ ] Can save changes
- [ ] Changes persist during session
- [ ] Main app continues to work with protected data

## Next Steps

Once local testing works:
1. Deploy to Vercel
2. Enable Vercel Blob storage
3. Set production environment variables
4. Test admin panel in production