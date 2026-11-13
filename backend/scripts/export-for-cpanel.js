// Turns the shop on this computer (local SQLite database) into one MySQL file for cPanel.
//   npm run export-for-cpanel   →   backend/backups/shop-for-cpanel.sql
// Import that file in cPanel → phpMyAdmin (select your database → Import), and upload the
// backend/uploads folder too, so the photo links keep working.
// The file contains your customers, orders and admin login, so it never goes to GitHub (backups/ is ignored).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'backups');
const OUT = path.join(OUT_DIR, 'shop-for-cpanel.sql');

function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return `X'${Buffer.from(v).toString('hex')}'`;
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\0/g, '\\0')}'`;
}

async function main() {
  const localFile = require('../src/config').sqliteFile;
  if (!fs.existsSync(localFile)) { console.error(`Local database not found: ${localFile}`); process.exit(1); }
  const local = require('../src/sqlite').createPool(localFile);
  const q = async (sql) => (await local.query(sql))[0];

  // The same table definitions the app uses on MySQL
  const schema = fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    .split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  const createFor = Object.fromEntries(schema.map((s) => [(s.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i) || [])[1], s]).filter(([t]) => t));

  const localTables = new Set((await q("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")).map((r) => r.name));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = fs.createWriteStream(OUT);
  out.write(`-- Dream Shop data for cPanel MySQL (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)\n`);
  out.write('SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n');

  const summary = [];
  for (const [table, create] of Object.entries(createFor)) {
    out.write(`DROP TABLE IF EXISTS \`${table}\`;\n${create};\n`);
    if (!localTables.has(table)) { out.write('\n'); continue; }
    const rows = await q(`SELECT * FROM "${table}"`);
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const cols = Object.keys(chunk[0]).map((c) => `\`${c}\``).join(', ');
      out.write(`INSERT INTO \`${table}\` (${cols}) VALUES\n${chunk.map((r) => `(${Object.values(r).map(sqlValue).join(', ')})`).join(',\n')};\n`);
    }
    out.write('\n');
    if (rows.length) summary.push(`${table}: ${rows.length}`);
  }
  out.write('SET FOREIGN_KEY_CHECKS = 1;\n');
  await new Promise((ok) => out.end(ok));

  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`✓ Saved ${path.relative(process.cwd(), OUT)} (${kb} KB)\n  ${summary.join(' · ')}`);
  console.log('\nNext: cPanel → phpMyAdmin → your database → Import → choose this file.');
  console.log('Also upload the backend/uploads folder, so the photos are there too.');
}

main().catch((e) => { console.error('Stopped:', e.message); process.exit(1); });
