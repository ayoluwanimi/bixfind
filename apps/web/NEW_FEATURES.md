# Bixfind - Updated Features

## New Features Added:

### 1. ✅ Map Integration
- Interactive map showing service providers
- Click "Show Map" on homepage to see providers
- Uses OpenStreetMap (free, no API key needed)

### 2. ✅ Email/Phone Validation
- Real-time validation on signup
- Checks email format and disposable emails
- Validates phone number format

### 3. ✅ AI Features
- AI-powered search on homepage
- Click categories for AI-generated descriptions
- Smart service suggestions

### 4. ✅ Push Notifications (Firebase)
- Firebase Cloud Messaging setup
- Can send notifications to users

---

## To Deploy:

Run these commands in the frontend folder:

```bash
cd bixfind-main/frontend

# Install new dependencies
npm install firebase leaflet react-leaflet

# Build and deploy
npm run build
firebase deploy --project bixfind-3055a
```

---

## Website URLs:

- **Custom Domain**: https://bixfind.indevs.in
- **Firebase URL**: https://bixfind-3055a.web.app

---

## Custom Domain:

Your custom domain **bixfind.indevs.in** should work automatically. If it redirects:
1. Go to Firebase Console → Hosting
2. Check the "Connect domain" section
3. Follow the steps to verify ownership

The website is now live with all new features!
