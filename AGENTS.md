# AGENTS.md - BixFind Platform

## Project Overview
- **Platform**: BixFind - Service provider marketplace
- **Frontend**: Next.js 15 (React, TypeScript, TailwindCSS)
- **Backend**: Google Cloud Run APIs + Firebase Realtime Database
- **Deployment**: Firebase Hosting

## Critical Commands

### Build & Deploy
```bash
cd "C:\Users\user\Downloads\bixfind (2)\bixfind\bixfind-main\frontend"

# Build
npm run build
# or use node directly:
& "C:\Program Files\nodejs\node.exe" ".\node_modules\next\dist\bin\next" build

# Deploy to Firebase
firebase deploy --only hosting
firebase deploy --only database
```

### Common Issues
- **Lockfile warning**: Set `outputFileTracingRoot` in next.config.js to silence
- **Firebase auth expired**: Run `firebase login --reauth` to re-authenticate

## Architecture

### Data Flow (IMPORTANT)
1. **Provider publishes website** → Data saves to:
   - Firebase `/websites/{websiteId}` (primary)
   - Firebase `/published/{websiteId}` 
   - localStorage (cache)

2. **Admin Dashboard loads**:
   - First: Firebase `/websites` (primary source)
   - Fallback: API
   - Cache: localStorage

3. **Homepage loads**:
   - Firebase `/websites` first
   - API fallback
   - localStorage cache

### Key Files
- `app/page.tsx` - Homepage with providers
- `app/admin/dashboard/page.tsx` - Admin panel
- `app/website-builder/page.tsx` - Website builder
- `app/profile-site/page.tsx` - Provider profile sites
- `lib/realtime.ts` - Firebase integration with offline queue
- `lib/storage.ts` - LocalStorage utilities

## Important Conventions

### Firebase Integration
- Always use offline-first: save to localStorage first, then Firebase
- Use `realtimeDb.set()` for saves (handles offline queue automatically)
- Check `realtimeDb.getOfflineQueueStatus()` for pending operations

### Admin Dashboard
- Uses cached localStorage data for instant display
- Falls back to API if Firebase is slow/empty
- Refresh button directly calls `loadData()`

### Website Publishing
- Websites saved to Firebase `/websites/{id}` with `isPublished: true`
- Products saved to `/products/{userId}` and `/websites/{id}/products`
- Profile-site loads from cache first, then Firebase

## Current Known Issues

1. **Firebase connection can timeout** - Use longer timeouts or retry
2. **API may be slow** - Always show cached data first
3. **Network resilience** - Implemented offline queue for bad networks

## Environment
- Working dir: `C:\Users\user\Downloads\bixfind (2)\bixfind\bixfind-main\frontend`
- Firebase project: bixfind-3055a
- Live URLs: https://bixfind-3055a.web.app, https://bixfind.indevs.in
