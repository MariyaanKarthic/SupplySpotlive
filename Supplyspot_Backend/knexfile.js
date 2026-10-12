require('dotenv').config();
const { types } = require('pg');

// Return Postgres numbers and dates the way SQLite does, so API responses keep the same shape:
// NUMERIC/DECIMAL and COUNT(*) as JS numbers, DATE columns as 'YYYY-MM-DD' strings
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v))); // numeric
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10))); // int8 / bigint
types.setTypeParser(1082, (v) => v); // date

// DB selection:
// - DATABASE_URL set            -> PostgreSQL from that URL (Neon, Render, etc.)
// - DB_CLIENT=sqlite3           -> local ./dev.sqlite3
// - otherwise                   -> PostgreSQL from DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD

const shared = {
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true,
  ...shared
};

// DATABASE_URL: SSL on for hosted databases (Neon requires it), off for localhost or ?sslmode=disable.
// DB_HOST settings: SSL only when SSL=true.
const urlSsl = (url) => {
  if (/sslmode=disable/.test(url)) return false;
  return /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : { rejectUnauthorized: false };
};
const hostSsl = () => (process.env.SSL === 'true' ? { rejectUnauthorized: false } : false);

const pgConfig = () => ({
  client: 'pg',
  connection: process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: urlSsl(process.env.DATABASE_URL) }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'supplier_spot',
      user: process.env.DB_USER || 'supplier_spot_user',
      password: process.env.DB_PASSWORD || 'password123',
      ssl: hostSsl()
    },
  pool: {
    min: 0,
    max: parseInt(process.env.DB_POOL_MAX) || 10
  },
  acquireConnectionTimeout: 60000,
  ...shared
});

const pickConfig = () => {
  if (process.env.DATABASE_URL) return pgConfig();
  if (process.env.DB_CLIENT === 'sqlite3') return sqliteConfig;
  return pgConfig();
};

module.exports = {
  development: pickConfig(),
  test: pickConfig(),
  staging: pickConfig(),
  production: pickConfig()
};
