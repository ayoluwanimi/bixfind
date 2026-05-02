// BixFind API - Updated with SMTP and OAuth
const functions = require('firebase-functions');
const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Simple CORS middleware
const allowedOrigins = [
  'https://bixfind-3055a.web.app',
  'https://www.bixfind-3055a.web.app',
  'https://bixfind.indevs.in',
  'https://www.bixfind.indevs.in'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'https://bixfind-3055a.web.app');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  next();
});

let db;
let dbInitialized = false;

async function initDb() {
  if (dbInitialized && db) return db;
  
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://bixfind-3055a-default-rtdb.firebaseio.com'
      });
    }
    db = admin.database();
    dbInitialized = true;
    console.log('Firebase Admin initialized successfully');
    return db;
  } catch (e) {
    console.error('Firebase Admin init error:', e.message);
    throw e;
  }
}

const _a = process.env.ADMIN_EMAIL || 'ayoluwanimi@gmail.com';
const _b = process.env.ADMIN_PASSWORD || 'Community@1997';
const _emailUser = process.env.SMTP_USER || '';
const _emailPass = process.env.SMTP_PASS || '';

// Input sanitization
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim().slice(0, 254);
}

function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return url.slice(0, 2048);
    }
  } catch (e) {}
  return '';
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 8 && password.length <= 128;
}

function simpleHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getDb() {
  if (!db) {
    try {
      db = await initDb();
    } catch (e) {
      console.error('Failed to get database:', e);
      throw new Error('Database connection failed');
    }
  }
  return db;
}

async function saveUser(user) {
  const database = await getDb();
  await database.ref(`users/${user.id}`).set(user);
  return user;
}

async function getUser(userId) {
  const database = await getDb();
  const snapshot = await database.ref(`users/${userId}`).once('value');
  return snapshot.val();
}

async function getUserByEmail(email) {
  const database = await getDb();
  const snapshot = await database.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
  const data = snapshot.val();
  if (data) {
    const keys = Object.keys(data);
    return data[keys[0]];
  }
  return null;
}

async function saveWebsite(website) {
  const database = await getDb();
  await database.ref(`websites/${website.id}`).set(website);
  return website;
}

async function getWebsite(websiteId) {
  const database = await getDb();
  const snapshot = await database.ref(`websites/${websiteId}`).once('value');
  return snapshot.val();
}

async function getAllUsers() {
  const database = await getDb();
  const snapshot = await database.ref('users').once('value');
  return snapshot.val() || {};
}

async function getAllWebsites() {
  const database = await getDb();
  const snapshot = await database.ref('websites').once('value');
  return snapshot.val() || {};
}

async function getStats() {
  const users = await getAllUsers();
  const websites = await getAllWebsites();
  const usersArray = Object.values(users);
  
  return {
    totalUsers: usersArray.length,
    activeUsers: usersArray.filter(u => u.isActive && !u.isSuspended).length,
    totalProviders: usersArray.filter(u => u.userType === 'provider').length,
    verifiedProviders: usersArray.filter(u => u.userType === 'provider' && u.isVerified).length,
    totalWebsites: Object.keys(websites).length,
    publishedWebsites: Object.values(websites).filter(w => w.isPublished).length
  };
}

async function logActivity(userId, action, entityType, entityId, details) {
  const database = await getDb();
  const logRef = database.ref('activity').push();
  await logRef.set({
    id: logRef.key,
    userId,
    action,
    entityType,
    entityId,
    details,
    timestamp: Date.now()
  });
}

const serviceKeywords = {
  'plumbing': ['leak', 'pipe', 'drain', 'water', 'bathroom', 'kitchen', 'toilet', 'sink', 'faucet', 'repair'],
  'electrical': ['wiring', 'light', 'power', 'outlet', 'switch', 'circuit', 'fan', 'ac', 'generator'],
  'cleaning': ['house', 'office', 'deep', 'carpet', 'window', 'floor', 'maid', 'sanitization'],
  'painting': ['wall', 'house', 'interior', 'exterior', 'paint', 'texture', 'design'],
  'car repairs': ['car', 'vehicle', 'auto', 'engine', 'tire', 'oil', 'brake', 'battery'],
  'hair salon': ['haircut', 'hairstyle', 'salon', 'beauty', 'barber', 'styling', 'treatment'],
  'tutoring': ['math', 'english', 'science', 'physics', 'chemistry', 'tutor', 'lesson', 'teaching'],
  'fitness': ['gym', 'trainer', 'workout', 'yoga', 'fitness', 'personal', 'training'],
};

const serviceDescriptions = {
  'plumbing': 'Professional plumbing services for all your water and drainage needs.',
  'electrical': 'Certified electrical services for residential and commercial properties.',
  'cleaning': 'Professional cleaning services for homes and offices.',
  'painting': 'Expert painting services to transform your space.',
  'car repairs': 'Reliable car repair and maintenance services.',
  'hair salon': 'Premium hair styling and beauty services.',
  'tutoring': 'Personalized tutoring services for all ages and subjects.',
  'fitness': 'Professional fitness training and wellness services.',
};

const defaultTemplates = [
  { id: 'modern', name: 'Modern Elegant', description: 'Clean, professional design', layoutType: 'modern' },
  { id: 'classic', name: 'Classic Business', description: 'Traditional corporate look', layoutType: 'classic' },
  { id: 'creative', name: 'Creative Portfolio', description: 'Bold, artistic design', layoutType: 'creative' },
  { id: 'minimal', name: 'Minimal Clean', description: 'Simple, elegant focus', layoutType: 'minimal' },
  { id: 'bold', name: 'Bold Statement', description: 'High-impact design', layoutType: 'bold' },
  { id: 'custom', name: 'Custom Design', description: 'Build your own', layoutType: 'custom' }
];

// Security headers middleware
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Debug endpoint - check database connection
app.get('/debug', async (req, res) => {
  try {
    const database = await getDb();
    const usersSnapshot = await database.ref('users').once('value');
    const websitesSnapshot = await database.ref('websites').once('value');
    const servicesSnapshot = await database.ref('services').once('value');
    
    const users = usersSnapshot.val() || {};
    const websites = websitesSnapshot.val() || {};
    const services = servicesSnapshot.val() || {};
    
    const usersArray = Object.values(users);
    const providers = usersArray.filter(u => u.userType === 'provider');
    const verifiedProviders = providers.filter(u => u.isVerified);
    
    res.json({
      success: true,
      database: 'connected',
      userCount: Object.keys(users).length,
      websiteCount: Object.keys(websites).length,
      serviceCount: Object.keys(services).length,
      providerCount: providers.length,
      verifiedProviderCount: verifiedProviders.length,
      sampleUsers: Object.keys(users).slice(0, 3),
      sampleWebsites: Object.keys(websites).slice(0, 3)
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, phone, userType } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Validate and sanitize input
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFullName = sanitizeString(fullName, 100);
    const sanitizedPhone = sanitizeString(phone, 20);
    const sanitizedUserType = sanitizeString(userType, 20);

    if (!sanitizedEmail || !sanitizedFullName) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const existingUser = await getUserByEmail(sanitizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = simpleHash(password);
    const userId = generateId('user');

    const user = {
      id: userId,
      email: sanitizedEmail,
      password: hashedPassword,
      fullName: sanitizedFullName,
      phone: sanitizedPhone,
      userType: ['provider', 'customer'].includes(sanitizedUserType) ? sanitizedUserType : 'customer',
      isVerified: true,
      isActive: true,
      isSuspended: false,
      wallet: { balance: 0, currency: 'NGN' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveUser(user);
    const token = generateToken();
    const { password: _, ...safeUser } = user;
    
    try {
      await logActivity(userId, 'user_registered', 'user', userId, { email: user.email });
    } catch (logErr) {}

    res.json({
      success: true,
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (sanitizedEmail.toLowerCase() === _a && password === _b) {
      const token = generateToken();
      try {
        await logActivity('admin_001', 'admin_login', 'admin', 'admin_001', {});
      } catch (logErr) {}
      return res.json({
        success: true,
        user: {
          id: 'admin_001',
          email: _a,
          fullName: 'Administrator',
          userType: 'admin',
          phone: '',
          avatar: null,
          wallet: { balance: 0, currency: 'NGN' }
        },
        token
      });
    }

    const user = await getUserByEmail(sanitizedEmail);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const hashedPassword = simpleHash(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken();
    const { password: _, ...safeUser } = user;
    
    try {
      await logActivity(user.id, 'user_login', 'user', user.id, {});
    } catch (logErr) {}

    res.json({
      success: true,
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth authentication
app.post('/auth/google', async (req, res) => {
  try {
    const { googleId, email, fullName, avatar, userType } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFullName = sanitizeString(fullName, 100);
    const sanitizedUserType = sanitizeString(userType, 20);

    // Check if user exists by email or googleId
    let user = await getUserByEmail(sanitizedEmail);
    let isNewUser = false;

    if (!user) {
      // Create new user with pending userType (will be set when they choose)
      isNewUser = true;
      const userId = generateId('user');
      user = {
        id: userId,
        googleId: googleId,
        email: sanitizedEmail,
        fullName: sanitizedFullName,
        avatar: avatar || '',
        phone: '',
        password: '',
        userType: 'pending', // Temporary until user chooses
        isVerified: true,
        isActive: true,
        isSuspended: false,
        wallet: { balance: 0, currency: 'NGN' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUser(user);
    } else {
      // Update existing user with Google info if needed
      if (user.googleId !== googleId) {
        const database = await getDb();
        await database.ref(`users/${user.id}/googleId`).set(googleId);
      }
      if (avatar && !user.avatar) {
        const database = await getDb();
        await database.ref(`users/${user.id}/avatar`).set(avatar);
      }
    }

    const token = generateToken();
    const { password: _, ...safeUser } = user;

    if (isNewUser) {
      try {
        await logActivity(user.id, 'user_registered_google', 'user', user.id, { email: user.email });
      } catch (logErr) {}
    } else {
      try {
        await logActivity(user.id, 'user_login_google', 'user', user.id, {});
      } catch (logErr) {}
    }

    res.json({
      success: true,
      user: safeUser,
      token,
      isNewUser
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Check if user needs to choose user type
app.post('/auth/google/check', async (req, res) => {
  try {
    const { googleId, email } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    const sanitizedEmail = sanitizeEmail(email);
    const user = await getUserByEmail(sanitizedEmail);
    const isNewUser = !user;

    if (isNewUser) {
      res.json({
        success: true,
        needsUserType: true,
        isNewUser: true,
        user: null
      });
    } else {
      const hasValidUserType = user.userType === 'provider' || user.userType === 'customer';
      
      if (!hasValidUserType) {
        const token = generateToken();
        const { password: _, ...safeUser } = user;
        
        res.json({
          success: true,
          needsUserType: true,
          isNewUser: false,
          user: safeUser,
          token
        });
      } else {
        const token = generateToken();
        const { password: _, ...safeUser } = user;
        
        try {
          await logActivity(user.id, 'user_login_google', 'user', user.id, {});
        } catch (logErr) {}
        
        res.json({
          success: true,
          needsUserType: false,
          isNewUser: false,
          user: safeUser,
          token
        });
      }
    }
  } catch (error) {
    console.error('Google check error:', error);
    res.status(500).json({ error: 'Google check failed' });
  }
});

// Register with Google and set user type (after user selects Provider or Customer)
app.post('/auth/google/register', async (req, res) => {
  try {
    const { googleId, email, fullName, avatar, userType } = req.body;

    if (!googleId || !email || !userType) {
      return res.status(400).json({ error: 'Google ID, email, and user type are required' });
    }

    if (!['provider', 'customer'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFullName = sanitizeString(fullName, 100);

    // Check if user exists by email
    let user = await getUserByEmail(sanitizedEmail);

    if (!user) {
      // Create new user with selected userType
      const userId = generateId('user');
      user = {
        id: userId,
        googleId: googleId,
        email: sanitizedEmail,
        fullName: sanitizedFullName,
        avatar: avatar || '',
        phone: '',
        password: '',
        userType: userType,
        isVerified: true,
        isActive: true,
        isSuspended: false,
        wallet: { balance: 0, currency: 'NGN' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUser(user);
      
      try {
        await logActivity(user.id, 'user_registered_google', 'user', user.id, { email: user.email, userType: userType });
      } catch (logErr) {}
    } else {
      // Update existing user's userType
      const database = await getDb();
      await database.ref(`users/${user.id}/userType`).set(userType);
      await database.ref(`users/${user.id}/googleId`).set(googleId);
      if (avatar && !user.avatar) {
        await database.ref(`users/${user.id}/avatar`).set(avatar);
      }
      user.userType = userType;
      
      try {
        await logActivity(user.id, 'user_updated_userType_google', 'user', user.id, { userType: userType });
      } catch (logErr) {}
    }

    const token = generateToken();
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      user: safeUser,
      token,
      isNewUser: true
    });
  } catch (error) {
    console.error('Google register error:', error);
    res.status(500).json({ error: 'Google registration failed' });
  }
});

app.post('/validate', async (req, res) => {
  try {
    const { email, phone, companyName } = req.body;
    const results = {};

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com'];
      const isDisposable = disposableDomains.some(domain => email.toLowerCase().includes(domain));
      
      results.email = {
        valid: isValid && !isDisposable,
        message: isValid ? (isDisposable ? 'Please use a permanent email' : 'Valid email') : 'Invalid email format'
      };
    }

    if (phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const isValid = phoneRegex.test(cleanPhone);
      
      results.phone = {
        valid: isValid,
        message: isValid ? 'Valid phone number' : 'Invalid phone number format'
      };
    }

    if (companyName) {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const websites = await getAllWebsites();
      const isAvailable = !Object.values(websites).some(w => w.companyName === slug);
      results.companyName = {
        valid: isAvailable,
        message: isAvailable ? 'URL is available' : 'URL already taken'
      };
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.post('/ai', (req, res) => {
  const { type, query, category, serviceName } = req.body;

  if (type === 'search') {
    const searchTerms = query.toLowerCase().split(' ');
    const matchedCategories = [];

    for (const [cat, keywords] of Object.entries(serviceKeywords)) {
      let score = 0;
      for (const term of searchTerms) {
        if (keywords.some(k => k.includes(term) || term.includes(k))) {
          score++;
        }
      }
      if (score > 0) matchedCategories.push({ name: cat, score });
    }

    matchedCategories.sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      results: matchedCategories.slice(0, 5).map(c => c.name),
      suggestion: matchedCategories.length > 0 
        ? `Try searching in: ${matchedCategories[0].name}`
        : 'No specific category found. Browse all services.'
    });
  }

  if (type === 'description') {
    const categoryKey = category?.toLowerCase() || 'general';
    const description = serviceDescriptions[categoryKey] || 
      `Professional ${serviceName || 'service'} provided by verified experts.`;

    const tags = Object.keys(serviceKeywords)
      .filter(cat => categoryKey.includes(cat) || categoryKey.includes(cat.split(' ')[0]))
      .slice(0, 5);

    return res.json({
      success: true,
      description,
      tags: tags.length > 0 ? tags : ['service', 'professional', 'quality'],
      estimatedDuration: '1-2 hours',
      priceRange: '$50 - $200'
    });
  } else {
    res.status(400).json({ error: 'Invalid type' });
  }
});

// AI Generate endpoint for website builder
app.post('/ai/generate', (req, res) => {
  try {
    const { businessName, category, section } = req.body;
    
    const name = businessName || 'Your Business';
    const cat = category || 'service';
    
    let content = {};
    
    switch(section) {
      case 'hero':
        content = {
          title: `Welcome to ${name}`,
          tagline: `Professional ${cat} services near you`
        };
        break;
      case 'about':
        content = `At ${name}, we are committed to providing exceptional ${cat} services to our clients in Nigeria. With years of experience and a dedicated team, we ensure quality and satisfaction in every project. Our commitment to excellence sets us apart.`;
        break;
      case 'services':
        content = `• Professional ${cat} consultation\n• Expert ${cat} services\n• Quick and reliable turnaround\n• Affordable pricing\n• Customer satisfaction guaranteed`;
        break;
      case 'cta':
        content = {
          text: `Ready to get started? Contact ${name} today!`,
          link: '#contact'
        };
        break;
      default:
        content = `Professional ${cat} services provided by ${name}`;
    }
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('AI generate error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

app.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: defaultTemplates
  });
});

app.get('/websites', async (req, res) => {
  try {
    const websites = await getAllWebsites();
    res.json({ success: true, websites: Object.values(websites) });
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({ error: 'Failed to get websites' });
  }
});

// Lightweight summary endpoint - returns essential fields only, no large image data
app.get('/websites/summary', async (req, res) => {
  try {
    const database = await getDb();
    const snapshot = await database.ref('websites').once('value');
    const allWebsites = snapshot.val() || {};
    
    // Return minimal data to prevent timeouts
    const websites = Object.values(allWebsites).map((w) => ({
      id: w.id,
      userId: w.userId,
      companyName: w.companyName,
      displayName: w.displayName,
      tagline: w.tagline || '',
      category: w.category || '',
      service: w.service || '',
      niche: w.niche || '',
      rating: w.rating || 4.5,
      reviews: w.reviews || 0,
      phone: w.phone || '',
      email: w.email || '',
      address: w.address || '',
      logoUrl: w.logoUrl ? (w.logoUrl.length > 200 ? w.logoUrl.substring(0, 200) : w.logoUrl) : '',
      isPublished: w.isPublished || false,
      isActive: w.isActive !== false,
      views: w.views || 0,
      createdAt: w.createdAt,
      sectionContent: w.sectionContent ? {
        heroTitle: w.sectionContent.heroTitle || '',
        heroTagline: w.sectionContent.heroTagline || '',
        servicesContent: w.sectionContent.servicesContent || '',
        aboutContent: w.sectionContent.aboutContent ? w.sectionContent.aboutContent.substring(0, 500) : '',
        ctaText: w.sectionContent.ctaText || '',
        ctaLink: w.sectionContent.ctaLink || ''
      } : {}
    }));
    
    res.json({ success: true, websites, count: websites.length });
  } catch (error) {
    console.error('Get websites summary error:', error);
    res.status(500).json({ error: 'Failed to get websites summary' });
  }
});

app.post('/websites', async (req, res) => {
  try {
    const { userId, companyName, displayName, tagline, templateId, services } = req.body;

    if (!companyName || !displayName) {
      return res.status(400).json({ error: 'Company name and display name are required' });
    }

    // Sanitize input
    const sanitizedCompanyName = sanitizeString(companyName, 50);
    const sanitizedDisplayName = sanitizeString(displayName, 100);
    const sanitizedTagline = sanitizeString(tagline, 200);
    const sanitizedTemplateId = sanitizeString(templateId, 50);
    
    // Process services - ensure it's an array of strings
    let sanitizedServices = [];
    if (Array.isArray(services)) {
      sanitizedServices = services.map(s => sanitizeString(s, 100)).filter(Boolean);
    } else if (typeof services === 'string') {
      // Split by newlines if services is a string
      sanitizedServices = services.split('\n').map(s => sanitizeString(s, 100)).filter(Boolean);
    }

    if (!sanitizedCompanyName || !sanitizedDisplayName) {
      return res.status(400).json({ error: 'Invalid company name or display name' });
    }

    const slug = sanitizedCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug || slug.length < 2) {
      return res.status(400).json({ error: 'Invalid company name' });
    }

    const websites = await getAllWebsites();
    
    // Check if user already has a website
    const existingWebsite = Object.values(websites).find(w => w.userId === userId);
    if (existingWebsite) {
      // Update existing website instead of creating new
      const updatedWebsite = {
        ...existingWebsite,
        companyName: slug,
        displayName: sanitizedDisplayName,
        tagline: sanitizedTagline,
        services: sanitizedServices,
        templateId: sanitizedTemplateId || existingWebsite.templateId || 'modern',
        updatedAt: new Date().toISOString()
      };
      await saveWebsite(updatedWebsite);
      await logActivity(userId, 'website_updated', 'mini_website', existingWebsite.id, { companyName: slug });
      return res.json({ success: true, website: updatedWebsite, updated: true });
    }

    // Check URL already taken
    if (Object.values(websites).some(w => w.companyName === slug)) {
      return res.status(400).json({ error: 'URL already taken' });
    }

    const websiteId = generateId('site');
    const template = defaultTemplates.find(t => t.id === (sanitizedTemplateId || 'modern'));
    
    // Determine category from services
    const category = sanitizedServices[0] || 'Service Provider';
    
    const website = {
      id: websiteId,
      userId: sanitizeString(userId, 100),
      companyName: slug,
      displayName: sanitizedDisplayName,
      tagline: sanitizedTagline,
      description: '',
      category: category, // Primary service category
      services: sanitizedServices, // Array of all services
      logoUrl: '',
      bannerUrl: '',
      phone: '',
      email: '',
      address: '',
      socialLinks: { website: '', twitter: '', facebook: '', instagram: '', linkedin: '' },
      themeColor: '#FF1E75',
      secondaryColor: '#333333',
      fontFamily: 'Inter',
      templateId: sanitizedTemplateId || 'modern',
      layoutType: template?.layoutType || 'modern',
      sections: [],
      isPublished: false,
      isActive: true,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveWebsite(website);
    await logActivity(userId, 'website_created', 'mini_website', websiteId, { companyName: slug, services: sanitizedServices });

    res.json({ success: true, website });
  } catch (error) {
    console.error('Create website error:', error);
    res.status(500).json({ error: 'Failed to create website' });
  }
});

app.get('/websites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const website = await getWebsite(id);
    
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({ success: true, website });
  } catch (error) {
    console.error('Get website error:', error);
    res.status(500).json({ error: 'Failed to get website' });
  }
});

app.put('/websites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    let website = await getWebsite(id);
    
    // If website doesn't exist, create it with the given ID
    if (!website) {
      website = {
        id,
        userId: updates.userId || '',
        companyName: updates.companyName || '',
        displayName: updates.displayName || '',
        tagline: updates.tagline || '',
        description: updates.description || '',
        category: updates.category || '',
        services: updates.services || [],
        logoUrl: updates.logoUrl || '',
        bannerUrl: updates.bannerUrl || '',
        phone: updates.phone || '',
        email: updates.email || '',
        address: updates.address || '',
        socialLinks: updates.socialLinks || { website: '', twitter: '', facebook: '', instagram: '', linkedin: '' },
        themeColor: updates.themeColor || '#0066FF',
        secondaryColor: updates.secondaryColor || '#00D4AA',
        fontFamily: updates.fontFamily || 'Poppins',
        templateId: updates.templateId || 'modern',
        layoutType: updates.layoutType || 'modern',
        sections: updates.sections || [],
        images: updates.images || [],
        videos: updates.videos || [],
        isPublished: updates.isPublished || false,
        isActive: true,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveWebsite(website);
      await logActivity(website.userId, 'website_created_from_update', 'mini_website', id, {});
      return res.json({ success: true, website, created: true });
    }

    // Sanitize and update fields
    const sanitizedUpdates = {};
    if (updates.displayName) sanitizedUpdates.displayName = sanitizeString(updates.displayName, 100);
    if (updates.tagline) sanitizedUpdates.tagline = sanitizeString(updates.tagline, 200);
    if (updates.description) sanitizedUpdates.description = sanitizeString(updates.description, 1000);
    if (updates.phone) sanitizedUpdates.phone = sanitizeString(updates.phone, 20);
    if (updates.email) sanitizedUpdates.email = sanitizeEmail(updates.email);
    if (updates.address) sanitizedUpdates.address = sanitizeString(updates.address, 300);
    if (updates.logoUrl) sanitizedUpdates.logoUrl = updates.logoUrl; // Allow data URLs for uploaded images
    if (updates.bannerUrl) sanitizedUpdates.bannerUrl = updates.bannerUrl; // Allow data URLs for uploaded images
    if (updates.themeColor) sanitizedUpdates.themeColor = sanitizeString(updates.themeColor, 20);
    if (updates.secondaryColor) sanitizedUpdates.secondaryColor = sanitizeString(updates.secondaryColor, 20);
    if (updates.fontFamily) sanitizedUpdates.fontFamily = sanitizeString(updates.fontFamily, 50);
    if (updates.templateId) sanitizedUpdates.templateId = sanitizeString(updates.templateId, 50);
    if (updates.layoutType) sanitizedUpdates.layoutType = sanitizeString(updates.layoutType, 50);
    if (updates.isPublished !== undefined) sanitizedUpdates.isPublished = !!updates.isPublished;
    if (updates.sections !== undefined) sanitizedUpdates.sections = updates.sections;
    if (updates.socialLinks !== undefined) sanitizedUpdates.socialLinks = updates.socialLinks;
    if (updates.publishedAt !== undefined) sanitizedUpdates.publishedAt = updates.publishedAt;
    
    // Handle services - properly sanitize array
    if (updates.services !== undefined) {
      if (Array.isArray(updates.services)) {
        sanitizedUpdates.services = updates.services.map(s => sanitizeString(s, 100)).filter(Boolean);
        // Set category to first service
        if (sanitizedUpdates.services.length > 0) {
          sanitizedUpdates.category = sanitizedUpdates.services[0];
        }
      } else if (typeof updates.services === 'string') {
        // Split by newlines
        const serviceList = updates.services.split('\n').map(s => sanitizeString(s, 100)).filter(Boolean);
        sanitizedUpdates.services = serviceList;
        if (serviceList.length > 0) {
          sanitizedUpdates.category = serviceList[0];
        }
      }
    }
    
    // Handle category separately
    if (updates.category !== undefined) {
      sanitizedUpdates.category = sanitizeString(updates.category, 100);
    }

    const updatedWebsite = { 
      ...website, 
      ...sanitizedUpdates, 
      id,
      updatedAt: new Date().toISOString() 
    };
    
    await saveWebsite(updatedWebsite);
    try {
      await logActivity(website.userId, 'website_updated', 'mini_website', id, sanitizedUpdates);
    } catch (logErr) {}

    res.json({ success: true, website: updatedWebsite });
  } catch (error) {
    console.error('Update website error:', error);
    res.status(500).json({ error: 'Failed to update website' });
  }
});

app.delete('/websites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const website = await getWebsite(id);
    
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const database = await getDb();
    await database.ref(`websites/${id}`).remove();
    await logActivity(website.userId, 'website_deleted', 'mini_website', id, {});

    res.json({ success: true });
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({ error: 'Failed to delete website' });
  }
});

// Admin: Delete all websites (for restructuring)
app.post('/admin/delete-all-websites', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Simple admin key check
    if (adminKey !== 'bixfind-admin-2024') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const database = await getDb();
    const snapshot = await database.ref('websites').once('value');
    const websites = snapshot.val() || {};
    const websiteIds = Object.keys(websites);
    
    // Delete all websites
    for (const id of websiteIds) {
      await database.ref(`websites/${id}`).remove();
    }
    
    res.json({ success: true, deletedCount: websiteIds.length });
  } catch (error) {
    console.error('Delete all websites error:', error);
    res.status(500).json({ error: 'Failed to delete websites' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    const safeUsers = Object.values(users).map(({ password, ...user }) => user);
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const user = await getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = { 
      ...user, 
      ...updates, 
      id: userId,
      updatedAt: new Date().toISOString() 
    };
    
    if (updates.password) {
      updatedUser.password = simpleHash(updates.password);
    }
    
    await saveUser(updatedUser);
    await logActivity(req.body.adminId || 'admin', 'user_updated', 'user', userId, updates);

    const { password, ...safeUser } = updatedUser;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    
    const database = await getDb();
    const activitySnapshot = await database.ref('activity').orderByChild('timestamp').limitToLast(50).once('value');
    const activityLogs = [];
    activitySnapshot.forEach(child => {
      activityLogs.unshift(child.val());
    });
    
    stats.activityLogs = activityLogs;
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const database = await getDb();
    const snapshot = await database.ref('activity').orderByChild('timestamp').limitToLast(limit).once('value');
    const logs = [];
    snapshot.forEach(child => {
      logs.unshift(child.val());
    });
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

app.post('/support', async (req, res) => {
  try {
    const { userId, subject, description, priority } = req.body;
    
    const ticketId = generateId('ticket');
    const database = await getDb();
    
    const ticket = {
      id: ticketId,
      userId,
      subject,
      description,
      status: 'open',
      priority: priority || 'medium',
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await database.ref(`support/${ticketId}`).set(ticket);
    await logActivity(userId, 'ticket_created', 'support', ticketId, { subject });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.put('/support/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, response } = req.body;
    
    const database = await getDb();
    const snapshot = await database.ref(`support/${ticketId}`).once('value');
    const ticket = snapshot.val();
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (response) ticket.responses.push({ text: response, timestamp: Date.now() });
    ticket.updatedAt = new Date().toISOString();

    await database.ref(`support/${ticketId}`).set(ticket);
    await logActivity(req.body.adminId || 'admin', 'ticket_updated', 'support', ticketId, { status });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.post('/services', async (req, res) => {
  try {
    const { userId, service } = req.body;
    
    if (!userId || !service) {
      return res.status(400).json({ error: 'User ID and service data are required' });
    }

    const database = await getDb();
    const serviceId = service.id || generateId('service');
    
    const serviceData = {
      ...service,
      id: serviceId,
      userId,
      createdAt: service.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await database.ref(`services/${serviceId}`).set(serviceData);
    
    const userServicesSnapshot = await database.ref('users/' + userId + '/services').once('value');
    const userServices = userServicesSnapshot.val() || [];
    if (!Array.isArray(userServices)) {
      await database.ref('users/' + userId + '/services').set([serviceId]);
    } else if (!userServices.includes(serviceId)) {
      await database.ref('users/' + userId + '/services').set([...userServices, serviceId]);
    }

    await logActivity(userId, 'service_created', 'service', serviceId, { title: service.title });

    res.json({ success: true, service: serviceData });
  } catch (error) {
    console.error('Save service error:', error);
    res.status(500).json({ error: 'Failed to save service' });
  }
});

app.get('/services/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const database = await getDb();
    const snapshot = await database.ref('services').orderByChild('userId').equalTo(userId).once('value');
    const services = [];
    snapshot.forEach(child => {
      services.push(child.val());
    });
    res.json({ success: true, services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// Get all services from all providers
app.get('/all-services', async (req, res) => {
  try {
    const database = await getDb();
    const snapshot = await database.ref('services').once('value');
    const servicesObj = snapshot.val() || {};
    const services = Object.values(servicesObj);
    res.json({ success: true, services, count: services.length });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

app.put('/services/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;
    const database = await getDb();
    
    const snapshot = await database.ref(`services/${serviceId}`).once('value');
    const service = snapshot.val();
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updatedService = {
      ...service,
      ...updates,
      id: serviceId,
      updatedAt: new Date().toISOString()
    };

    await database.ref(`services/${serviceId}`).set(updatedService);
    await logActivity(service.userId, 'service_updated', 'service', serviceId, updates);

    res.json({ success: true, service: updatedService });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/services/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const database = await getDb();
    
    const snapshot = await database.ref(`services/${serviceId}`).once('value');
    const service = snapshot.val();
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await database.ref(`services/${serviceId}`).remove();
    await logActivity(service.userId, 'service_deleted', 'service', serviceId, {});

    res.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Email notification endpoint
app.post('/notify-verification', async (req, res) => {
  try {
    const { subject, message, targetUserType } = req.body;
    
    const database = await getDb();
    const snapshot = await database.ref('users').once('value');
    const users = snapshot.val();
    
    if (!users) {
      return res.json({ success: true, sent: 0 });
    }

    const sanitizedSubject = sanitizeString(subject || 'Important Update from Bixfind', 200);
    const sanitizedMessage = sanitizeString(message || 'Please complete your verification to earn a Trust Badge.', 2000);
    
    let sentCount = 0;
    const notifications = [];
    
    Object.values(users).forEach((user) => {
      if (user && user.email && user.id) {
        // Create in-app notification
        const notifId = generateId('notif');
        notifications.push({
          id: notifId,
          userId: user.id,
          type: 'verification',
          title: sanitizedSubject,
          message: sanitizedMessage,
          read: false,
          createdAt: new Date().toISOString()
        });
        sentCount++;
      }
    });
    
    // Save notifications to database
    if (notifications.length > 0) {
      const notifRef = database.ref('notifications');
      notifications.forEach(notif => {
        notifRef.child(notif.id).set(notif);
      });
    }
    
    await logActivity('admin', 'verification_emails_sent', 'system', 'all_users', { 
      subject: sanitizedSubject, 
      count: sentCount 
    });
    
    res.json({ success: true, sent: sentCount, message: `Notification sent to ${sentCount} users` });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Delete duplicate/cleanup endpoint
app.post('/cleanup-users', async (req, res) => {
  try {
    const database = await getDb();
    
    // Get all users
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val();
    
    if (!users) {
      return res.json({ success: true, removed: 0 });
    }

    const seen = new Set();
    const duplicates = [];
    const toRemove = [];
    
    Object.values(users).forEach((user) => {
      if (!user || !user.id) return;
      
      // Check for duplicates by email or id
      const key = user.email || user.id;
      if (seen.has(key)) {
        duplicates.push(user.id);
        toRemove.push(user.id);
      } else {
        seen.add(key);
      }
    });
    
    // Remove duplicates
    for (const userId of toRemove) {
      await database.ref(`users/${userId}`).remove();
    }
    
    // Get all websites
    const websitesSnapshot = await database.ref('websites').once('value');
    const websites = websitesSnapshot.val();
    
    const websiteSeen = new Set();
    const websiteDuplicates = [];
    const websiteToRemove = [];
    
    if (websites) {
      Object.values(websites).forEach((website) => {
        if (!website || !website.id) return;
        
        const key = website.id;
        if (websiteSeen.has(key)) {
          websiteDuplicates.push(website.id);
          websiteToRemove.push(website.id);
        } else {
          websiteSeen.add(key);
        }
      });
      
      for (const websiteId of websiteToRemove) {
        await database.ref(`websites/${websiteId}`).remove();
      }
    }
    
    await logActivity('admin', 'cleanup_performed', 'system', 'admin', { 
      usersRemoved: toRemove.length,
      websitesRemoved: websiteToRemove.length
    });
    
    res.json({ 
      success: true, 
      usersRemoved: toRemove.length,
      websitesRemoved: websiteToRemove.length,
      message: `Removed ${toRemove.length} duplicate users and ${websiteToRemove.length} duplicate websites`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup' });
  }
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, message, isHtml } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'Recipient, subject, and message are required' });
    }

    const sanitizedTo = sanitizeEmail(to);
    const sanitizedSubject = sanitizeString(subject, 200);
    const sanitizedMessage = sanitizeString(message, 5000);
    
    if (!sanitizedTo || !sanitizedSubject || !sanitizedMessage) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Create nodemailer transport dynamically
    let transporter = null;
    let emailSent = false;
    let emailError = null;

    try {
      const nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: _emailUser,
          pass: _emailPass
        }
      });

      const mailOptions = {
        from: `"Bixfind" <${_emailUser}>`,
        to: sanitizedTo,
        subject: sanitizedSubject,
        [isHtml ? 'html' : 'text']: sanitizedMessage
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (smtpErr) {
      console.log('Email sending not configured:', smtpErr.message);
      emailError = smtpErr.message;
    }

    // Always create in-app notification as fallback
    if (transporter) {
      const database = await getDb();
      const notifId = generateId('notif');
      await database.ref(`notifications/${notifId}`).set({
        id: notifId,
        userId: 'email_' + sanitizedTo,
        type: 'email',
        title: 'Email Sent: ' + sanitizedSubject,
        message: sanitizedMessage.slice(0, 500),
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    await logActivity('admin', 'email_sent', 'system', 'admin', { 
      to: sanitizedSubject,
      subject: sanitizedSubject,
      sent: emailSent
    });

    res.json({ 
      success: true, 
      sent: emailSent,
      message: emailSent ? `Email sent to ${sanitizedTo}` : 'Email not configured. Notification created instead.',
      error: emailError
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send bulk email endpoint
app.post('/send-bulk-email', async (req, res) => {
  try {
    const { subject, message, isHtml, userType, filterVerified } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const sanitizedSubject = sanitizeString(subject, 200);
    const sanitizedMessage = sanitizeString(message, 5000);
    
    if (!sanitizedSubject || !sanitizedMessage) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const database = await getDb();
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val();
    
    if (!users) {
      return res.json({ success: true, sent: 0, message: 'No users found' });
    }

    let filteredUsers = Object.values(users);
    
    // Filter by userType
    if (userType) {
      filteredUsers = filteredUsers.filter((u) => u.userType === userType);
    }
    
    // Filter by verified status
    if (filterVerified !== undefined) {
      filteredUsers = filteredUsers.filter((u) => u.isVerified === filterVerified);
    }

    const emails = filteredUsers
      .filter((u) => u && u.email)
      .map((u) => u.email);

    let emailSent = false;
    let nodemailer = null;
    let transporter = null;

    try {
      nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: _emailUser,
          pass: _emailPass
        }
      });
      emailSent = true;
    } catch (smtpErr) {
      console.log('Email not configured:', smtpErr.message);
    }

    const sentCount = emailSent ? emails.length : 0;
    
    // Create in-app notifications for all recipients
    const notifications = [];
    for (const email of emails) {
      const notifId = generateId('notif');
      notifications.push({
        id: notifId,
        userId: 'bulk_' + email,
        type: 'bulk_email',
        title: sanitizedSubject,
        message: sanitizedMessage.slice(0, 500),
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    if (notifications.length > 0) {
      const notifRef = database.ref('notifications');
      notifications.forEach(notif => {
        notifRef.child(notif.id).set(notif);
      });
    }

    await logActivity('admin', 'bulk_email_sent', 'system', 'admin', { 
      subject: sanitizedSubject,
      recipients: emails.length,
      sent: sentCount
    });

    res.json({ 
      success: true, 
      recipients: emails.length,
      sent: sentCount,
      message: emailSent ? `Email sent to ${emails.length} users` : `Notifications created for ${emails.length} users (email not configured)`
    });
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ error: 'Failed to send bulk email' });
  }
});

// Forgot Password - Send OTP
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const sanitizedEmail = sanitizeEmail(email);
    const database = await getDb();
    
    // Find user by email
    const usersSnapshot = await database.ref('users')
      .orderByChild('email')
      .equalTo(sanitizedEmail)
      .once('value');
    
    let userData = null;
    let userId = null;
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      userId = Object.keys(users)[0];
      userData = users[userId];
    }
    
    if (!userData) {
      // Don't reveal if user exists or not for security
      return res.json({ success: true, message: 'If email exists, OTP will be sent' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store OTP in database
    await database.ref(`passwordReset/${userId}`).set({
      otp: otp,
      email: sanitizedEmail,
      expiresAt: otpExpiry,
      createdAt: new Date().toISOString()
    });
    
    // Try to send email (if configured)
    let emailSent = false;
    try {
      if (_emailPass !== 'App-SpecificPasswordHere') {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: _emailUser,
            pass: _emailPass
          }
        });
        
        await transporter.sendMail({
          from: `"Bixfind" <${_emailUser}>`,
          to: sanitizedEmail,
          subject: 'Password Reset OTP',
          html: `<h2>Password Reset</h2><p>Your OTP is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p><p>If you didn't request this, please ignore.</p>`
        });
        emailSent = true;
      }
    } catch (e) {
      console.log('Email not sent:', e.message);
    }
    
    res.json({ 
      success: true, 
      message: emailSent ? 'OTP sent to your email' : 'OTP generated (email not configured)'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }
    
    const database = await getDb();
    
    // Find user
    const usersSnapshot = await database.ref('users')
      .orderByChild('email')
      .equalTo(sanitizeEmail(email))
      .once('value');
    
    if (!usersSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const users = usersSnapshot.val();
    const userId = Object.keys(users)[0];
    
    // Check OTP
    const resetRef = await database.ref(`passwordReset/${userId}`).once('value');
    if (!resetRef.exists()) {
      return res.status(400).json({ error: 'No OTP found. Request new OTP.' });
    }
    
    const resetData = resetRef.val();
    
    if (resetData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    if (Date.now() > resetData.expiresAt) {
      return res.status(400).json({ error: 'OTP expired. Request new OTP.' });
    }
    
    res.json({ valid: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Reset Password
app.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password required' });
    }
    
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const database = await getDb();
    
    // Find user
    const usersSnapshot = await database.ref('users')
      .orderByChild('email')
      .equalTo(sanitizeEmail(email))
      .once('value');
    
    if (!usersSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const users = usersSnapshot.val();
    const userId = Object.keys(users)[0];
    
    // Verify OTP
    const resetRef = await database.ref(`passwordReset/${userId}`).once('value');
    if (!resetRef.exists()) {
      return res.status(400).json({ error: 'No OTP found. Request new OTP.' });
    }
    
    const resetData = resetRef.val();
    
    if (resetData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    if (Date.now() > resetData.expiresAt) {
      return res.status(400).json({ error: 'OTP expired. Request new OTP.' });
    }
    
    // Update password
    const passwordHash = simpleHash(newPassword);
    await database.ref(`users/${userId}/password`).set(passwordHash);
    
    // Clear OTP
    await database.ref(`passwordReset/${userId}`).remove();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update user email (admin)
app.post('/admin/update-email', async (req, res) => {
  try {
    const { userId, newEmail, adminKey } = req.body;
    
    // Simple admin check (in production, use proper auth)
    if (adminKey !== 'bixfind-admin-2024') {
      return res.status(403).json({ error: 'Invalid admin key' });
    }
    
    if (!userId || !newEmail) {
      return res.status(400).json({ error: 'User ID and new email required' });
    }
    
    const sanitizedEmail = sanitizeEmail(newEmail);
    const database = await getDb();
    
    // Get current user data
    const userRef = database.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userSnapshot.val();
    
    // Update email only, keep password unchanged
    await userRef.update({
      email: sanitizedEmail,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

exports.api = functions.https.onRequest(app);
