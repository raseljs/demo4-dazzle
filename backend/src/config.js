require('./env');
const path = require('path');

const env = process.env;
const strip = (u) => (u || '').replace(/\/+$/, '');
const frontendUrl = strip(env.FRONTEND_URL) || 'http://localhost:3000';
// Testing on one computer without .env files: backend and storefront share a built-in key,
// so admin changes still show on the storefront instantly. Live sites must set REVALIDATE_SECRET.
const LOCAL_FRONTEND = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(frontendUrl);

// On Vercel a missing JWT_SECRET would let anyone forge an admin login, so refuse to run without it
if (env.VERCEL && !env.JWT_SECRET) throw new Error('Set JWT_SECRET in the Vercel project settings (Environment Variables).');

module.exports = {
  port: Number(env.PORT) || 5000,
  tzOffsetHours: env.TZ_OFFSET_HOURS !== undefined ? Number(env.TZ_OFFSET_HOURS) : 6,
  // 'mysql' (production / cPanel) or 'sqlite' (local testing, no MySQL needed).
  // When no database is configured at all, fall back to a local SQLite file.
  dbClient: (env.DB_CLIENT || (env.DB_HOST || env.DB_NAME || env.DB_USER ? 'mysql' : 'sqlite')).toLowerCase(),
  sqliteFile: env.SQLITE_FILE || path.join(__dirname, '..', 'database', 'local.sqlite'),
  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'eshop',
    // Cloud databases (TiDB Cloud, Aiven, PlanetScale…) need an encrypted connection: DB_SSL=true
    ssl: /^(1|true|yes)$/i.test(env.DB_SSL || '') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  },
  jwtSecret: env.JWT_SECRET || 'dev-secret-change-me',
  revalidateSecret: env.REVALIDATE_SECRET || (LOCAL_FRONTEND ? 'local-revalidate' : ''),
  backendUrl: strip(env.BACKEND_URL) || `http://localhost:${Number(env.PORT) || 5000}`,
  frontendUrl,
  admin: {
    name: env.ADMIN_NAME || 'Admin',
    phone: env.ADMIN_PHONE || '01700000000',
    password: env.ADMIN_PASSWORD || 'admin12345',
  },
};
