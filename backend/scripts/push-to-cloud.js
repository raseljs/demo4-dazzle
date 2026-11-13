// Copies the shop from this computer to the cloud, for a Vercel deployment:
//   • every table of the local SQLite database  →  the online MySQL database (TiDB Cloud etc.)
//   • every photo the data points to (/uploads/...)  →  Vercel Blob, with the links updated
//
// 1. Put the cloud details in backend/.env.cloud (it never goes to GitHub):
//      DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
//      DB_PORT=4000
//      DB_USER=xxxx.root
//      DB_PASSWORD=xxxx
//      DB_NAME=eshop
//      DB_SSL=true
//      BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxx
// 2. Run:  npm run push-to-cloud
//
// The online database is replaced by the local one. Safe to run again (it starts from scratch each time).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CLOUD_ENV = path.join(ROOT, '.env.cloud');
const UPLOADS = path.join(ROOT, 'uploads');
const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', ico: 'image/x-icon', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm' };

function readEnvFile(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

async function main() {
  if (!fs.existsSync(CLOUD_ENV)) {
    console.error('Missing backend/.env.cloud — see the instructions at the top of scripts/push-to-cloud.js');
    process.exit(1);
  }
  const cloud = readEnvFile(CLOUD_ENV);
  for (const k of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'BLOB_READ_WRITE_TOKEN']) {
    if (!cloud[k]) { console.error(`backend/.env.cloud is missing ${k}`); process.exit(1); }
  }

  // Local database (read before the cloud settings are applied)
  const localFile = require('../src/config').sqliteFile;
  if (!fs.existsSync(localFile)) { console.error(`Local database not found: ${localFile}`); process.exit(1); }
  const local = require('../src/sqlite').createPool(localFile);
  const lq = async (sql, params) => (await local.query(sql, params))[0];

  // From here on the app code talks to the cloud database
  Object.assign(process.env, { DB_CLIENT: 'mysql', DB_PORT: '4000' }, cloud);
  for (const k of Object.keys(require.cache)) if (k.includes(`${path.sep}src${path.sep}`)) delete require.cache[k];
  const db = require('../src/db');
  const { put } = require('@vercel/blob');

  console.log('1/3  Creating the tables in the online database…');
  await require('./migrate')({ close: false, quiet: true });

  // Photos: upload each /uploads/... file once and remember its new address
  const moved = new Map();
  const missing = new Set();
  async function moveFile(link) {
    if (moved.has(link)) return;
    const rel = link.replace(/^https?:\/\/[^/]+/, ''); // http://localhost:5000/uploads/x.jpg → /uploads/x.jpg
    const file = path.join(UPLOADS, ...rel.replace(/^\/uploads\//, '').split('/').map(decodeURIComponent));
    if (!file.startsWith(UPLOADS) || !fs.existsSync(file)) { missing.add(rel); moved.set(link, link); return; }
    const ext = path.extname(file).slice(1).toLowerCase();
    const blob = await put(rel.slice(1), fs.readFileSync(file), {
      access: 'public', contentType: TYPES[ext] || 'application/octet-stream', addRandomSuffix: false, allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365, token: cloud.BLOB_READ_WRITE_TOKEN,
    });
    moved.set(link, blob.url);
    process.stdout.write('.');
  }
  // "/uploads/..." paths (also "http://localhost:5000/uploads/..."), but not other websites' /uploads/ links
  const UPLOAD_LINK = /(?<![A-Za-z0-9.\-:\/])(?:https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)?\/uploads\/[^\s"'()<>\\]+/g;
  async function fixLinks(value) {
    if (typeof value !== 'string' || !value.includes('/uploads/')) return value;
    const links = value.match(UPLOAD_LINK);
    if (!links) return value;
    for (const link of new Set(links)) await moveFile(link);
    return value.replace(UPLOAD_LINK, (link) => moved.get(link) || link);
  }

  console.log('2/3  Copying the data and moving the photos to Vercel Blob…');
  const tables = (await lq("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
  const conn = await db.pool.getConnection();
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  const summary = [];
  for (const t of tables) {
    let cloudCols;
    try { cloudCols = new Set((await conn.query(`SHOW COLUMNS FROM \`${t}\``))[0].map((c) => c.Field)); } catch { summary.push(`${t}: skipped (not in the online database)`); continue; }
    const rows = await lq(`SELECT * FROM "${t}"`);
    await conn.query(`DELETE FROM \`${t}\``);
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]).filter((c) => cloudCols.has(c));
    for (let i = 0; i < rows.length; i += 200) {
      const batch = [];
      for (const r of rows.slice(i, i + 200)) {
        const vals = [];
        for (const c of cols) vals.push(await fixLinks(r[c]));
        batch.push(vals);
      }
      await conn.query(`INSERT INTO \`${t}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES ?`, [batch]);
    }
    summary.push(`${t}: ${rows.length}`);
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  conn.release();

  console.log(`\n3/3  Done.\n  Rows copied → ${summary.join(' · ')}\n  Photos moved → ${[...moved.values()].filter((u) => u.includes('blob.vercel-storage.com')).length}`);
  if (missing.size) console.log(`  Not found on this computer (left as they were): ${[...missing].join(', ')}`);
  console.log('\n  Log in to the admin panel on the live site with the same phone and password as on this computer, then change the password.');
  await db.pool.end();
}

main().catch((e) => {
  console.error('\nStopped:', e.message);
  process.exit(1);
});
