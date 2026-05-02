// Supabase configuration for BixFind
// Sign up at: https://supabase.com (free account)

export const supabaseConfig = {
  // These will be set when you create your Supabase project
  NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key',
}

// Local fallback data (for demo/development)
export const fallbackUsers = {
  'test_user': {
    id: 'test_user',
    email: 'test@bixfind.com',
    password: '07480fb9e85b9396af06f006cf1c95024af2531c65fb505cfbd0add1e2f31573', // SHA256 of 'Test1234'
    fullName: 'Test User',
    phone: '1234567890',
    userType: 'user',
    isActive: true,
    isVerified: false,
    wallet: { balance: 0 }
  },
  'admin_user': {
    id: 'admin_user',
    email: 'admin@bixfind.com',
    password: '07480fb9e85b9396af06f006cf1c95024af2531c65fb505cfbd0add1e2f31573', // SHA256 of 'Test1234'
    fullName: 'Admin User',
    phone: '1234567890',
    userType: 'admin',
    isActive: true,
    isVerified: true,
    wallet: { balance: 0 }
  }
}

// Hardcoded admin (for quick access)
export const ADMIN_CREDENTIALS = {
  email: 'ayoluwanimi@gmail.com',
  password: 'Community@1997'
}

// Database schema expected by the app
export const tableSchemas = {
  users: `
    id text primary key,
    email text unique not null,
    password text,
    fullName text,
    phone text,
    userType text,
    category text,
    service text,
    isActive boolean default true,
    isVerified boolean default false,
    isSuspended boolean default false,
    wallet jsonb,
    createdAt timestamp with time zone,
    updatedAt timestamp with time zone
  `,
  websites: `
    id text primary key,
    userId text not null,
    companyName text,
    displayName text,
    heroTitle text,
    tagline text,
    category text,
    services text[],
    phone text,
    email text,
    address text,
    logoUrl text,
    bannerUrl text,
    isPublished boolean default false,
    createdAt timestamp with time zone,
    updatedAt timestamp with time zone
  `,
  comments: `
    id text primary key,
    userId text not null,
    name text,
    rating integer,
    text text,
    approved boolean default false,
    createdAt timestamp with time zone
  `
}

// Sample data for initial import
export const sampleWebsites = [
  {
    id: 'site_001',
    userId: 'user_1774346477722_oavtg2sj4',
    companyName: 'Adesew Pharmacy',
    displayName: 'Adesew Pharmacy',
    heroTitle: 'Your Trusted Pharmacy in Nigeria',
    category: 'Pharmacy',
    services: ['Pharmacy', 'Supplements'],
    phone: '9071093349',
    email: 'adesewaoloyede15@gmail.com',
    isPublished: true
  }
]