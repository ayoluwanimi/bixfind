# Firebase Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Firebase account (https://console.firebase.google.com)

---

## Easy Steps

### Step 1: Open Terminal
```bash
cd C:\Users\Gosht\Downloads\bixfind\bixfind-main\frontend
```

### Step 2: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 3: Login to Firebase
```bash
firebase login
```
(A browser will open - login with your Google account)

### Step 4: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: `bixfind-app`
4. Disable Google Analytics (optional)
5. Create project

### Step 5: Update Project ID
Edit `.firebaserc` and replace `YOUR_PROJECT_ID` with your actual project ID:
```json
{
  "projects": {
    "default": "bixfind-app"
  }
}
```

### Step 6: Set Environment Variables
In Firebase Console → Your Project → Environment Variables:
- Go to: Project Settings → Environment Variables
- Add:
  - `DATABASE_URL` = your Neon connection string
  - `JWT_SECRET` = any random string (e.g., `bixfind-secret-2024`)

### Step 7: Upgrade to Blaze Plan
1. Go to Firebase Console → Project Settings
2. Click "Usage and billing"
3. Upgrade to **Blaze Plan** (required for server-side features)
   - Free tier available, you won't be charged

### Step 8: Deploy
```bash
firebase deploy
```

---

## Troubleshooting

### "npm command not found"
Use full path or restart terminal after installing Node.js

### "Function region not supported"
Change region in firebase.json to `us-east1` or `europe-west1`

### Environment variables not working
Set them via Firebase CLI:
```bash
firebase functions:config:set database.url="your_neon_url" jwt.secret="your_secret"
```

---

## After Deploy
- Your app will be at: `https://bixfind-app.web.app`
- API will work at: `https://us-central1-bixfind-app.cloudfunctions.net`

---

## Cost Note
Blaze Plan has free tier:
- Cloud Functions: 2M invocations/month free
- Hosting: 1GB storage, 10GB bandwidth/month free

Most small sites stay under free limits.
