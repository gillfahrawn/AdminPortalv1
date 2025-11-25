# Deployment Guide

## Quick Start (Local Development)

### Start Backend
```bash
cd backend
npm install
npm start
```
Backend will run on `http://localhost:3001`

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:5173`

### Access the Application
- Main App: `http://localhost:5173/`
- Admin Panel: `http://localhost:5173/admin`
- Data Table: `http://localhost:5173/data`

## Deploy to Vercel (Recommended)

### Backend Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy backend:
   ```bash
   cd backend
   vercel
   ```

3. Follow prompts and note the deployment URL (e.g., `https://your-backend.vercel.app`)

### Frontend Deployment

1. Update the API URL in frontend:
   ```bash
   cd frontend
   echo "VITE_API_URL=https://your-backend.vercel.app/api" > .env
   ```

2. Deploy frontend:
   ```bash
   vercel
   ```

3. Your app will be live at the provided Vercel URL

## Deploy to Render

### Backend Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `PORT`: (leave blank, Render will set it)
     - `NODE_ENV`: `production`

### Frontend Deployment

1. Create a new Static Site on Render
2. Configure:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     - `VITE_API_URL`: (your backend URL from step 1)

## Deploy to Heroku

### Backend

```bash
cd backend
echo "web: npm start" > Procfile
heroku create your-app-backend
git subtree push --prefix backend heroku main
```

### Frontend

```bash
cd frontend
heroku create your-app-frontend
heroku buildpacks:add heroku/nodejs
git subtree push --prefix frontend heroku main
```

## Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Testing Checklist

- [ ] Backend health check: `curl https://your-backend/api/health`
- [ ] Admin config loads: Visit `/admin`
- [ ] Create test user and complete onboarding
- [ ] Verify data appears in `/data` table
- [ ] Test progress persistence (logout and login mid-flow)
- [ ] Change admin config and verify it reflects in new onboarding

## Troubleshooting

**CORS Errors**: Update backend CORS settings in `backend/src/server.js` to allow your frontend domain

**Database Issues**: SQLite may not persist on some platforms. Consider:
- Using Vercel Postgres
- Railway PostgreSQL
- Supabase

**Build Failures**: Ensure Node.js version is 18 or higher in deployment settings
