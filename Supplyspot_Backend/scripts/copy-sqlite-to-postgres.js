/**
 * Copy all data from the local SQLite database (dev.sqlite3) into PostgreSQL.
 *
 * Usage (run migrations against Postgres first):
 *   DATABASE_URL=postgresql://... npx knex migrate:latest
 *   DATABASE_URL=postgresql://... node scripts/copy-sqlite-to-postgres.js
 *
 * Existing rows in the Postgres app tables are deleted before copying.
 */
require('dotenv').config();
const path = require('path');
const knex = require('knex');

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL to the target PostgreSQL connection string.');
  process.exit(1);
}

const sqlitePath = process.env.SQLITE_FILE || path.join(__dirname, '..', 'dev.sqlite3');
const src = knex({ client: 'sqlite3', connection: { filename: sqlitePath }, useNullAsDefault: true });
// Reuse the knexfile Postgres config (handles SSL for Neon)
delete process.env.DB_CLIENT;
const dst = knex(require('../knexfile').production);

const SKIP = new Set(['knex_migrations', 'knex_migrations_lock', 'sqlite_sequence']);

const toDate = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return new Date(v);
  if (/^\d+$/.test(String(v))) return new Date(Number(v));
  return v;
};

const convert = (value, type) => {
  if (value === null || value === undefined) return null;
  switch (type) {
    case 'boolean':
      return value === 1 || value === '1' || value === true || value === 'true';
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return toDate(value);
    case 'date': {
      const d = toDate(value);
      return d instanceof Date ? d.toISOString().slice(0, 10) : d;
    }
    case 'json':
    case 'jsonb':
      return typeof value === 'string' ? value : JSON.stringify(value);
    default:
      return value;
  }
};

const sortByDependencies = (tables, deps) => {
  const ordered = [];
  const seen = new Set();
  const visit = (t, stack = new Set()) => {
    if (seen.has(t) || stack.has(t)) return;
    stack.add(t);
    (deps[t] || []).forEach((d) => d !== t && tables.includes(d) && visit(d, stack));
    seen.add(t);
    ordered.push(t);
  };
  tables.forEach((t) => visit(t));
  return ordered;
};

(async () => {
  const srcTables = (await src.raw("SELECT name FROM sqlite_master WHERE type='table'"))
    .map((r) => r.name)
    .filter((n) => !SKIP.has(n));

  const { rows: cols } = await dst.raw(
    "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'"
  );
  const pgTypes = {};
  cols.forEach((c) => {
    pgTypes[c.table_name] = pgTypes[c.table_name] || {};
    pgTypes[c.table_name][c.column_name] = c.data_type;
  });

  const { rows: fks } = await dst.raw(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);
  const deps = {};
  const fkCols = {};
  fks.forEach((f) => {
    (deps[f.table_name] = deps[f.table_name] || []).push(f.ref_table);
    (fkCols[f.table_name] = fkCols[f.table_name] || []).push({ column: f.column_name, ref: f.ref_table });
  });

  const tables = sortByDependencies(srcTables.filter((t) => pgTypes[t]), deps);
  const missing = srcTables.filter((t) => !pgTypes[t]);
  if (missing.length) console.warn('Not in Postgres (run migrations?), skipped:', missing.join(', '));

  await dst.transaction(async (trx) => {
    for (const t of [...tables].reverse()) await trx(t).del();

    // Circular or self references: insert NULL first, fill in once every table is loaded
    const deferred = [];
    const loaded = new Set();
    for (const t of tables) {
      const lateCols = (fkCols[t] || []).filter((f) => !loaded.has(f.ref) || f.ref === t).map((f) => f.column);
      const rows = await src(t).select();
      if (!rows.length) { console.log(`${t}: 0 rows`); loaded.add(t); continue; }
      const types = pgTypes[t];
      const data = rows.map((row) => {
        const out = {};
        Object.keys(row).forEach((k) => {
          if (types[k]) out[k] = convert(row[k], types[k]);
        });
        lateCols.forEach((c) => {
          if (out[c] != null) deferred.push({ table: t, id: out.id, column: c, value: out[c] });
          if (c in out) out[c] = null;
        });
        return out;
      });
      await trx.batchInsert(t, data, 200).transacting(trx);
      console.log(`${t}: ${rows.length} rows`);
      loaded.add(t);
    }
    for (const d of deferred) {
      await trx(d.table).where('id', d.id).update({ [d.column]: d.value });
    }
    if (deferred.length) console.log(`Restored ${deferred.length} circular references`);
  });

  console.log('Done.');
  await src.destroy();
  await dst.destroy();
})().catch(async (err) => {
  console.error('Copy failed:', err.message);
  await src.destroy();
  await dst.destroy();
  process.exit(1);
});
