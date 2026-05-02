# Bixfind - Multi-Vendor Service Marketplace Platform

**Tagline:** "Find Every Service, Every Provider, Everywhere"

A comprehensive full-stack marketplace platform connecting consumers with service providers globally. Features service discovery, booking, payments, and comprehensive admin dashboards.

## Project Structure

```
bixfind/
├── frontend/          # Next.js React application
│   ├── app/          # App router pages
│   ├── components/   # Reusable components
│   ├── public/       # Static assets (logo, favicon)
│   └── styles/       # Global styles
├── backend/          # Node.js Express API
│   ├── src/
│   │   ├── config/   # Database and configuration
│   │   ├── routes/   # API endpoints
│   │   ├── models/   # Database models
│   │   └── middleware/
│   └── package.json
└── README.md
```

## Technology Stack

### Frontend
- **Framework:** Next.js 15+ (React 18)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **HTTP Client:** Axios
- **UI Components:** Custom components with Tailwind

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (primary) + MongoDB (logs/analytics)
- **Authentication:** JWT + OAuth 2.0
- **Real-time:** Socket.io
- **Payment:** Stripe integration
- **Storage:** AWS S3 / Cloudinary

## Features

### Public Website
- Homepage with hero section and category browsing
- Advanced search with filters (category, price, rating, distance)
- Provider discovery with map and list views
- Provider profiles with ratings and reviews
- How it works guide
- Featured providers carousel
- Testimonials section

### User/Customer Features
- User registration and authentication
- Email and phone verification
- Service request creation and tracking
- Provider booking and scheduling
- Payment processing (with 10% platform fee)
- In-app messaging with providers
- Reviews and ratings system
- Favorites/saved providers
- Request history and analytics
- User dashboard with request management

### Service Provider Features
- Provider registration and verification
- Complete business profile management
- Service and product catalog creation
- Request management and acceptance
- Quote system
- Earnings tracking and payouts
- Analytics and performance metrics
- Availability calendar
- Portfolio/gallery management
- Review responses
- Provider dashboard with KPIs

### Admin Dashboard
- Complete platform oversight
- User management and monitoring
- Provider verification and management
- Commission tracking (10% model)
- Financial reports and analytics
- Transaction history
- Support ticket management
- Platform health monitoring
- Content moderation
- Category management
- System configuration

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 12+
- MongoDB (optional, for logs)
- Redis (optional, for caching)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your credentials
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` for the frontend and `http://localhost:5000` for the backend API.

## Environment Variables

See `backend/.env.example` for required environment variables:
- Database credentials
- JWT secrets
- OAuth credentials
- Stripe API keys
- AWS S3 credentials
- Email configuration
- Payment gateway setup

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

### Providers
- `GET /api/providers` - List all providers
- `GET /api/providers/:id` - Get provider details
- `POST /api/providers` - Create provider profile
- `PUT /api/providers/:id` - Update provider profile

### Requests
- `POST /api/requests` - Create service request
- `GET /api/requests` - List user requests
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id/status` - Update request status

### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/withdraw` - Provider withdrawal

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - User management
- `GET /api/admin/providers` - Provider management
- `GET /api/admin/transactions` - Transaction logs

## Deployment

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Deploy via Netlify CLI or GitHub integration
```

### Backend
- Deploy to Heroku, Railway, or any Node.js hosting
- Set up environment variables in hosting platform
- Configure PostgreSQL database
- Enable CORS for frontend URL

## Commission Model
- **Platform Fee:** 10% on all service requests
- **User Pays:** Includes 10% commission in payment
- **Provider Receives:** 90% of service price
- **Admin Receives:** 10% commission

## Security Features
- JWT authentication with refresh tokens
- OAuth 2.0 integration (Google, Facebook)
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- CORS protection
- Helmet for HTTP headers
- Input validation and sanitization
- HTTPS enforcement in production

## License

Proprietary - All rights reserved.

---

**Built for the Bixfind Team** - "Find Every Service, Every Provider, Everywhere"
