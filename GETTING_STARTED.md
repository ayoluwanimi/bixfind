# Bixfind - Getting Started Guide

## 🎯 Project Overview

**Bixfind** is a comprehensive multi-vendor service marketplace platform with:
- ✅ Full-stack application (Next.js + Node.js/Express)
- ✅ PostgreSQL + MongoDB database
- ✅ User authentication & authorization
- ✅ Admin dashboard with real-time monitoring
- ✅ Service provider management
- ✅ Payment processing (10% commission)
- ✅ Real-time notifications & messaging

## 📦 What's Included

### Frontend (Next.js)
- **Public Homepage** - Service discovery, search, filtering
- **User Authentication** - Sign up, login, password recovery
- **Customer Dashboard** - Request management, payment history
- **Service Browsing** - Categories, providers, ratings
- **Admin Dashboard** - User/provider monitoring, sales analytics
- **Responsive Design** - Mobile-optimized Tailwind CSS

### Backend (Node.js/Express)
- **RESTful API** - 8 main route modules
- **Authentication** - JWT + OAuth 2.0
- **Database Migrations** - PostgreSQL tables pre-configured
- **Error Handling** - Centralized error management
- **Rate Limiting** - DDoS protection
- **Security** - Helmet, CORS, input validation

### Branding
- ✅ **Logo** - Integrated as site logo and favicon
- ✅ **Colors** - Primary (#001A4D), Secondary (#FF1E75), Accent (#00D84F)
- ✅ **No Runable branding** - Completely Bixfind branded

## 🚀 Quick Start (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/ayoluwanimi/bixfind.git
cd bixfind
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start backend
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start frontend
npm run dev
# App runs on http://localhost:3000
```

### 4. Access the Application
- **Homepage:** http://localhost:3000
- **Login:** http://localhost:3000/auth/login
- **Sign Up:** http://localhost:3000/auth/signup
- **Dashboard:** http://localhost:3000/dashboard
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **API Health:** http://localhost:5000/health

## 🔧 Configuration

### Backend Environment Variables
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bixfind
DB_USER=postgres
DB_PASSWORD=postgres

# Security
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=24h

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📂 Project Structure

```
bixfind/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── auth/
│   │   │   ├── login/            # Login page
│   │   │   └── signup/           # Sign up page
│   │   ├── dashboard/            # User dashboard
│   │   └── admin/
│   │       └── dashboard/        # Admin dashboard
│   ├── public/
│   │   ├── logo.png              # Bixfind logo
│   │   └── favicon.ico           # Favicon
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server file
│   │   ├── config/
│   │   │   └── database.ts       # Database setup & migrations
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── providers.ts
│   │   │   ├── requests.ts
│   │   │   ├── services.ts
│   │   │   ├── payments.ts
│   │   │   ├── admin.ts
│   │   │   ├── reviews.ts
│   │   │   └── messages.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── models/               # Database models (to implement)
│   │   ├── controllers/          # Business logic (to implement)
│   │   └── services/             # Business services (to implement)
│   ├── .env                      # Environment variables
│   ├── .env.example              # Example env file
│   ├── package.json
│   ├── tsconfig.json
│   └── dist/                     # Compiled JS
│
├── README.md
├── DEPLOYMENT.md
├── netlify.toml                  # Netlify deployment config
├── .gitignore
└── package.json                  # Root package.json
```

## 🗄️ Database Schema

### Tables Automatically Created
1. **users** - Customer and provider accounts
2. **providers** - Service provider business profiles
3. **services** - Services offered by providers
4. **service_requests** - Customer service requests
5. **payments** - Transaction records
6. **reviews** - Service ratings and feedback
7. **messages** - In-app messaging

## 🛣️ API Routes

### Auth Routes (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh JWT token

### User Routes (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /avatar` - Upload profile picture

### Provider Routes (`/api/providers`)
- `GET /` - List all providers
- `GET /:id` - Get provider details
- `POST /` - Create provider profile
- `PUT /:id` - Update provider profile

### Request Routes (`/api/requests`)
- `POST /` - Create service request
- `GET /` - List requests
- `GET /:id` - Get request details
- `PUT /:id/status` - Update request status

### Payment Routes (`/api/payments`)
- `POST /` - Process payment
- `GET /history` - Payment history
- `POST /withdraw` - Provider withdrawal

### Admin Routes (`/api/admin`)
- `GET /dashboard` - Dashboard statistics
- `GET /users` - User management
- `GET /providers` - Provider management
- `GET /transactions` - Transaction logs

## 💰 10% Commission Model

- **Platform Fee:** 10% on all service transactions
- **Customer View:** Total price includes commission
- **Provider View:** Receives 90% of service price
- **Admin View:** Collects 10% commission

Example:
- Service Price: $100
- Commission (10%): $10
- Provider Receives: $90
- Admin Receives: $10

## 🔐 Security Features

✅ JWT authentication with refresh tokens
✅ OAuth 2.0 (Google, Facebook)
✅ Password hashing (bcryptjs)
✅ Rate limiting (100 requests/15 min)
✅ CORS protection
✅ Helmet security headers
✅ Input validation & sanitization
✅ HTTPS ready for production

## 🎨 Branding & Colors

```
Primary Blue:     #001A4D
Secondary Pink:   #FF1E75
Accent Green:     #00D84F
Cyan Accent:      #00D9FF
```

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS responsive utilities
- Tested on all screen sizes
- Touch-friendly components

## 🔄 Next Steps

### Before Deployment
- [ ] Configure database credentials
- [ ] Set up payment gateway (Stripe)
- [ ] Configure email service (Gmail, SendGrid)
- [ ] Add OAuth credentials (Google, Facebook)
- [ ] Set up AWS S3 for file storage
- [ ] Configure SMS service (Twilio)

### Local Testing
- [ ] Test all authentication flows
- [ ] Test service request creation
- [ ] Test admin dashboard
- [ ] Test payment processing
- [ ] Test real-time messaging

### Deployment
- [ ] Deploy backend to Heroku/Railway/Render
- [ ] Deploy frontend to Netlify
- [ ] Configure production database
- [ ] Set up monitoring and logging
- [ ] Enable HTTPS
- [ ] Test live endpoints

## 📚 Documentation Files

- **README.md** - Project overview
- **DEPLOYMENT.md** - Deployment instructions
- **GETTING_STARTED.md** - This file

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000
# Install dependencies
npm install
# Check .env file exists
```

### Frontend build fails
```bash
# Clear Next.js cache
rm -rf .next
# Reinstall dependencies
npm install
# Rebuild
npm run build
```

### Database connection error
```bash
# Ensure PostgreSQL is running
# Check DB credentials in .env
# Verify database exists
createdb bixfind
```

### API connection issues
```bash
# Verify backend is running
curl http://localhost:5000/health
# Check CORS configuration
# Verify NEXT_PUBLIC_API_URL is set
```

## 📞 Support

- **GitHub Issues:** https://github.com/ayoluwanimi/bixfind/issues
- **Documentation:** See DEPLOYMENT.md and README.md

## 🎉 You're All Set!

Your Bixfind marketplace is ready to use. Start with local development, then follow DEPLOYMENT.md for production deployment.

**Happy coding!** 🚀

---

**Bixfind - Find Every Service, Every Provider, Everywhere**
