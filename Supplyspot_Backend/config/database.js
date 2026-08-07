const knex = require('knex');
const logger = require('./logger');

const knexConfig = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const dbConfig = knexConfig[environment];

const db = knex(dbConfig);

const connectDB = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');
    return db;
  } catch (error) {
    logger.warn('Database connection unavailable (PostgreSQL not running locally): ' + error.message);
    return db;
  }
};

const disconnectDB = async () => {
  try {
    await db.destroy();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await db.raw('SELECT 1');
    logger.info('Database test successful');
    return true;
  } catch (error) {
    logger.error('Database test failed:', error);
    return false;
  }
};

// Health check
const healthCheck = async () => {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

module.exports = {
  db,
  connectDB,
  disconnectDB,
  testConnection,
  healthCheck
};
