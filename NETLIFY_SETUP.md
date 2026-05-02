# Bixfind Netlify Deployment Checklist

## Step 1: Prepare Frontend
- ✅ Next.js app configured
- ✅ Tailwind CSS integrated
- ✅ Logo and favicon set
- ✅ netlify.toml created
- ✅ Environment variables template ready

## Step 2: Connect to Netlify

### Option A: Netlify UI (Easiest)
1. Go to https://app.netlify.com
2. Click **"New site from Git"**
3. Select **GitHub** as provider
4. Authorize Netlify to access your GitHub
5. Choose repository: **ayoluwanimi/bixfind**
6. Configure build:
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `.next`

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
cd frontend
netlify deploy --prod
```

## Step 3: Configure Environment Variables

In Netlify Dashboard → Site Settings → Build & Deploy → Environment:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

(Backend URL will be obtained after deploying backend)

## Step 4: Set up Backend

Choose one deployment platform:

### **Option 1: Heroku** (Easy, $7/month minimum)
```bash
heroku login
heroku create bixfind-api
heroku addons:create heroku-postgresql:hobby-dev
cd backend
heroku config:set JWT_SECRET="$(openssl rand -hex 32)"
git push heroku main
```

### **Option 2: Railway** (Simple, pay-as-you-go)
1. Go to railway.app
2. Create new project
3. Connect GitHub
4. Add PostgreSQL plugin
5. Deploy

### **Option 3: Render** (Free tier available)
1. Go to render.com
2. Create new Web Service
3. Connect GitHub (bixfind)
4. Render will handle deployment
5. Add PostgreSQL database

## Step 5: Update Frontend Environment

After backend is deployed, update Netlify environment variable:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then trigger a rebuild in Netlify Dashboard.

## Step 6: Test Live Site

1. Visit your Netlify domain (e.g., `bixfind.netlify.app`)
2. Test homepage loads ✓
3. Test login page ✓
4. Test signup page ✓
5. Test API connection ✓

## Expected URLs After Deployment

- **Frontend:** `https://bixfind.netlify.app` (or custom domain)
- **Backend:** `https://bixfind-api.herokuapp.com` (or chosen platform)
- **GitHub:** `https://github.com/ayoluwanimi/bixfind`

## Troubleshooting

### Build fails on Netlify
- Check build logs: Dashboard → Deploys → Failed deploy
- Verify Node version: Settings → Build image selection
- Try: `npm ci` instead of `npm install`

### API connection errors
- Verify backend is running
- Check NEXT_PUBLIC_API_URL is correct
- Verify CORS enabled in backend

### Performance optimization
- Enable Netlify Analytics
- Set up Cache Control headers
- Use Netlify Edge Functions for redirects

## Continuous Deployment

✅ Automatic: Every push to `main` triggers rebuild
- Changes made → Push to GitHub → Netlify auto-deploys
- Takes ~2-3 minutes for build and deploy

## Domain Setup

### For custom domain:
1. In Netlify: Settings → Domain Management
2. Add custom domain
3. Update DNS records (Netlify will show you how)
4. SSL certificate auto-generated

### Use Netlify subdomain:
- No setup needed
- URL: `something.netlify.app`

## Next Steps After Deployment

1. ✅ Connect custom domain (optional)
2. ✅ Set up monitoring
3. ✅ Configure backups
4. ✅ Add team members
5. ✅ Set up analytics

---

**You're ready to deploy!** 🚀

See DEPLOYMENT.md for more detailed instructions.
