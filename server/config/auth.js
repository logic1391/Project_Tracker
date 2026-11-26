// Centralised JWT configuration. Set JWT_SECRET in the environment (or a .env file) for production.
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is not set. Using the insecure development default.');
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };
