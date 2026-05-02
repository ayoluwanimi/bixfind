# BIXFIND - Database Setup Guide

## Prerequisites

1. **Neon Database Account**
   - Go to https://console.neon.tech
   - Create a new project
   - Get your connection string from the dashboard

2. **Node.js 18+**

## Setup Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# Database connection string from Neon (REQUIRED)
DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"

# JWT Secret for authentication (change this!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Google OAuth (optional - for Google login)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Generate Prisma Client & Push Schema
```bash
cd frontend
npx prisma generate
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Features Implemented

- ✅ Email/Password signup and login
- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Neon PostgreSQL database
- ✅ Google OAuth buttons (UI ready, requires Google Cloud setup)
- ✅ Beautiful, modern UI with animations
- ✅ Toast notifications
- ✅ Responsive design
- ✅ OTP removed - instant account creation

## Google OAuth (Optional)

To enable Google login:
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add the credentials to .env
4. Implement the full OAuth flow in the API

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── signup/    # Signup API
│   │       ├── login/     # Login API
│   │       ├── logout/    # Logout API
│   │       ├── google/    # Google auth
│   │       └── me/        # Current user
│   ├── auth/
│   │   ├── signup/        # Signup page
│   │   └── login/         # Login page
│   └── page.tsx           # Homepage
├── lib/
│   ├── auth.ts            # Auth utilities
│   ├── db/client.ts       # Prisma client
│   ├── storage.ts         # Local storage
│   └── validations.ts     # Form validations
├── prisma/
│   └── schema.prisma      # Database schema
└── components/
    ├── FormInput.tsx
    └── Toaster.tsx
```
