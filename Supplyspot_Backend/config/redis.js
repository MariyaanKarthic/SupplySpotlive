const logger = require('./logger');

let memoryStore = new Map();

const connectRedis = async () => {
  logger.info('Mock Redis client connected');
  return true;
};

const disconnectRedis = async () => {
  logger.info('Mock Redis disconnected successfully');
};

const set = async (key, value, ttl = 3600) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  const expiry = ttl ? Date.now() + (ttl * 1000) : null;
  memoryStore.set(key, { value: stringValue, expiry });
  return true;
};

const get = async (key) => {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiry && item.expiry < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  
  try {
    return JSON.parse(item.value);
  } catch {
    return item.value;
  }
};

const del = async (key) => {
  memoryStore.delete(key);
  return true;
};

const exists = async (key) => {
  const item = memoryStore.get(key);
  if (!item) return false;
  if (item.expiry && item.expiry < Date.now()) {
    memoryStore.delete(key);
    return false;
  }
  return true;
};

const expire = async (key, ttl) => {
  const item = memoryStore.get(key);
  if (item) {
    item.expiry = Date.now() + (ttl * 1000);
    return true;
  }
  return false;
};

const incr = async (key, ttl = 3600) => {
  const item = memoryStore.get(key);
  let val = 1;
  if (item && (!item.expiry || item.expiry >= Date.now())) {
    val = parseInt(item.value) + 1 || 1;
  }
  await set(key, val.toString(), ttl);
  return val;
};

const cacheResponse = async (key, data, ttl = 3600) => {
  return await set(key, {
    data,
    timestamp: Date.now(),
    cached: true
  }, ttl);
};

const getCachedResponse = async (key, maxAge = 3600) => {
  const cached = await get(key);
  if (!cached || !cached.cached) return null;
  
  const age = (Date.now() - cached.timestamp) / 1000;
  if (age > maxAge) {
    await del(key);
    return null;
  }
  
  return cached.data;
};

const checkRateLimit = async (key, limit, windowMs) => {
  const current = await incr(key, Math.ceil(windowMs / 1000));
  const item = memoryStore.get(key);
  const ttl = item && item.expiry ? (item.expiry - Date.now()) / 1000 : 0;
  
  return {
    allowed: current <= limit,
    count: current,
    remaining: Math.max(0, limit - current),
    resetTime: Date.now() + (ttl * 1000)
  };
};

const setSession = async (sessionId, sessionData, ttl = 86400) => {
  return await set(`session:${sessionId}`, sessionData, ttl);
};

const getSession = async (sessionId) => {
  return await get(`session:${sessionId}`);
};

const deleteSession = async (sessionId) => {
  return await del(`session:${sessionId}`);
};

const addToBlacklist = async (token, ttl = 604800) => {
  return await set(`blacklist:${token}`, true, ttl);
};

const isBlacklisted = async (token) => {
  return await exists(`blacklist:${token}`);
};

const removeFromBlacklist = async (token) => {
  return await del(`blacklist:${token}`);
};

const healthCheck = async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
};

const redisClient = null;

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
  set,
  get,
  del,
  exists,
  expire,
  incr,
  cacheResponse,
  getCachedResponse,
  checkRateLimit,
  setSession,
  getSession,
  deleteSession,
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist,
  healthCheck
};
