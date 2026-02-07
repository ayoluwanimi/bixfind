import { Pool } from 'pg';
import mongoose from 'mongoose';

const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export const initializeDatabase = async () => {
  try {
    // Test PostgreSQL connection
    const client = await pgPool.connect();
    console.log('✅ PostgreSQL connected');
    client.release();

    // Initialize MongoDB for logs/analytics
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    }

    // Run migrations
    await runMigrations();
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
};

const runMigrations = async () => {
  const client = await pgPool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        profile_picture VARCHAR(500),
        user_type VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Providers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        business_description TEXT,
        category VARCHAR(100),
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        verification_status VARCHAR(50) DEFAULT 'pending',
        business_license VARCHAR(500),
        profile_picture VARCHAR(500),
        years_experience INTEGER,
        service_areas TEXT,
        operating_hours JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10,2),
        pricing_type VARCHAR(50) DEFAULT 'fixed',
        duration_minutes INTEGER,
        image_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        quote_amount DECIMAL(10,2),
        payment_status VARCHAR(50) DEFAULT 'pending',
        platform_fee DECIMAL(10,2),
        scheduled_date TIMESTAMP,
        location VARCHAR(500),
        images TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        provider_id INTEGER REFERENCES providers(id),
        request_id INTEGER REFERENCES service_requests(id),
        amount DECIMAL(10,2) NOT NULL,
        platform_fee DECIMAL(10,2),
        payment_method VARCHAR(100),
        stripe_payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
        request_id INTEGER REFERENCES service_requests(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        images TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        request_id INTEGER REFERENCES service_requests(id),
        message TEXT NOT NULL,
        file_url VARCHAR(500),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database migrations completed');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
};

export default pgPool;
