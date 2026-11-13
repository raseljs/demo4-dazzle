// Entry point (cPanel "Application startup file": server.js · on Vercel the exported app is used)
const config = require('./src/config');
const express = require('express');
const path = require('path');
const { cors, notFound, errorHandler } = require('./src/middleware/common');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(cors);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  immutable: true,
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // payment gateway callbacks

app.use('/api', require('./src/routes'));
app.get('/', (req, res) => res.json({ name: 'eshop-api', ok: true }));

app.use(notFound);
app.use(errorHandler);

async function start() {
  const db = require('./src/db');
  if (config.dbClient === 'sqlite' && !db.pool.hasTable('settings')) {
    // Local SQLite mode: create tables + starter data automatically on the first run
    console.log('First run: creating the local SQLite database with starter data…');
    await require('./scripts/migrate')({ close: false });
    await require('./scripts/seed')({ close: false });
  } else {
    // Every start: create any tables added by an update (safe to repeat, existing data is untouched)
    await require('./scripts/migrate')({ close: false, quiet: true });
  }
  app.listen(config.port, () => {
    console.log(`API running on port ${config.port} (database: ${config.dbClient})`);
    require('./src/services/scheduler').start(); // flash sales + daily backups
  });
}

if (process.env.VERCEL) {
  // Vercel runs the API as a function: no app.listen and no background timers there.
  // Tables are created once from your computer (npm run push-to-cloud), flash sales are
  // checked on incoming requests (see src/routes/index.js) and photos go to Vercel Blob.
} else {
  start().catch((e) => {
    console.error('Could not start the API:', e.message);
    process.exit(1);
  });
}

module.exports = app;
