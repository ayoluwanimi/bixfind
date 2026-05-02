# Bixfind Deployment Guide

## GitHub Repository
✅ **Repository:** https://github.com/ayoluwanimi/bixfind
- All code is committed and pushed
- Main branch is ready for deployment

## Frontend Deployment on Netlify

### Option 1: Deploy with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Authenticate with Netlify
netlify login

# Navigate to frontend directory
cd frontend

# Deploy
netlify deploy --prod
```

### Option 2: Deploy with GitHub Integration (Recommended)

1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Connect your GitHub account
4. Select repository: `ayoluwanimi/bixfind`
5. Configure build settings:
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/.next`
6. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```
7. Click "Deploy site"

### Netlify Configuration File
The `netlify.toml` file is already configured with:
- Build command for Next.js
- Redirect rules
- Environment variables for different contexts

## Backend Deployment

### Option 1: Deploy to Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create Heroku app
heroku create bixfind-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET="your_secure_secret"
heroku config:set STRIPE_SECRET_KEY="your_stripe_key"
# ... add other required env vars

# Deploy backend
cd backend
git push heroku main
```

### Option 2: Deploy to Railway.app

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repository
4. Add PostgreSQL plugin
5. Set environment variables
6. Deploy

### Option 3: Deploy to Render.com

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub
4. Select `bixfind` repository
5. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Add PostgreSQL database
7. Deploy

## Database Setup

### PostgreSQL
```bash
# Local setup
createdb bixfind
createuser postgres

# Remote setup (Heroku/Railway/Render)
# Provided automatically when you add the addon
```

### MongoDB (Optional - for logs)
- Atlas: https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string
- Add to `MONGODB_URI` env var

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=production

# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=bixfind
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=https://your-frontend-url.netlify.app
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Domain Setup

### Frontend (Netlify)
1. Go to Netlify dashboard
2. Select your site
3. Go to Domain settings
4. Add custom domain or use Netlify subdomain
5. Configure DNS if using custom domain

### Backend
Point your domain to your hosting provider (Heroku, Railway, Render)

## SSL/HTTPS
- Netlify: Automatic with Let's Encrypt
- Heroku: Automatic with certificate
- Railway: Automatic with certificate
- Render: Automatic with certificate

## CI/CD Pipeline

GitHub Actions workflow is automatically triggered on:
- Push to main branch
- Pull requests

Current setup:
- Tests run on PR
- Deploy on merge to main

## Monitoring & Logs

### Frontend (Netlify)
- Netlify Dashboard → Site settings → Logs
- Check for build errors and deployment status

### Backend
- Heroku: `heroku logs --tail`
- Railway: `railway logs`
- Render: Dashboard logs section

## Security Checklist

✅ Environment variables configured
✅ JWT secrets set (use strong random values)
✅ CORS configured for frontend URL
✅ Database credentials secure
✅ SSL/HTTPS enabled
✅ Rate limiting enabled
✅ Helmet security headers enabled
✅ Input validation enabled

## First Run Checklist

1. ✅ Clone repository
2. ✅ Install dependencies (frontend & backend)
3. ✅ Create PostgreSQL database
4. ✅ Configure .env files
5. ✅ Run database migrations
6. ✅ Start backend: `npm run dev`
7. ✅ Start frontend: `npm run dev`
8. ✅ Test API endpoints
9. ✅ Deploy frontend to Netlify
10. ✅ Deploy backend to hosting
11. ✅ Configure production env vars
12. ✅ Test live deployment

## Support & Troubleshooting

### Common Issues

**Build fails on Netlify**
- Check `netlify.toml` configuration
- Verify Node.js version (18+)
- Check for missing dependencies

**API connection issues**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration in backend
- Ensure backend is running

**Database connection errors**
- Verify `DB_HOST`, `DB_PORT`, `DB_NAME`
- Check database credentials
- Ensure PostgreSQL is running (local dev)

**Payment integration issues**
- Verify Stripe keys are correct
- Check Stripe webhook configuration
- Review Stripe test/live mode

## Quick Links

- GitHub: https://github.com/ayoluwanimi/bixfind
- Netlify: https://app.netlify.com
- Heroku: https://dashboard.heroku.com
- Stripe: https://dashboard.stripe.com
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Deployment Status:**
- ✅ Code on GitHub
- ⏳ Frontend ready for Netlify
- ⏳ Backend ready for deployment
- ⏳ Databases need configuration
- ⏳ Environment variables need setup
