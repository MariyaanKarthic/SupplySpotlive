const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add request logging middleware
logger.httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// Add error logging helper
logger.logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };
  
  logger.error('Application Error', errorInfo);
};

// Add performance logging helper
logger.logPerformance = (operation, startTime, context = {}) => {
  const duration = Date.now() - startTime;
  const perfInfo = {
    operation,
    duration: `${duration}ms`,
    context,
    timestamp: new Date().toISOString()
  };
  
  if (duration > 1000) {
    logger.warn('Slow Operation Detected', perfInfo);
  } else {
    logger.info('Performance', perfInfo);
  }
};

// Add security logging helper
logger.logSecurity = (event, details = {}) => {
  const securityInfo = {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  };
  
  logger.warn('Security Event', securityInfo);
};

// Add audit logging helper
logger.logAudit = (action, userId, details = {}) => {
  const auditInfo = {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  };
  
  logger.info('Audit Log', auditInfo);
};

// Add business event logging helper
logger.logBusiness = (event, details = {}) => {
  const businessInfo = {
    event,
    details,
    timestamp: new Date().toISOString()
  };
  
  logger.info('Business Event', businessInfo);
};

// Stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
