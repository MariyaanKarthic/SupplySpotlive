const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { isBlacklisted } = require('../config/redis');
const logger = require('../config/logger');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db('users')
      .where('id', decoded.id)
      .where('is_active', true)
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Remove password hash from user object
    delete user.password_hash;

    // Add user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      logger.logSecurity('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await db('users')
      .where('id', decoded.id)
      .where('is_active', true)
      .first();

    if (user) {
      delete user.password_hash;
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Silently continue for optional auth
    next();
  }
};

// Check if user can access specific resource
const canAccessResource = (resourceType, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Resource ID is required'
        });
      }

      let hasAccess = false;

      switch (resourceType) {
        case 'vendor':
          // Check if user created the vendor or has appropriate role
          const vendor = await db('vendors')
            .where('id', resourceId)
            .first();

          if (vendor) {
            hasAccess = vendor.created_by === req.user.id || 
                       ['procurement_manager', 'finance_manager'].includes(req.user.role);
          }
          break;

        case 'invoice':
          // Check if user created the invoice or has appropriate role
          const invoice = await db('invoices')
            .where('id', resourceId)
            .first();

          if (invoice) {
            hasAccess = invoice.created_by === req.user.id || 
                       ['finance_manager', 'ap_clerk'].includes(req.user.role);
          }
          break;

        case 'dispute':
          // Check if user is involved in dispute or has appropriate role
          const dispute = await db('disputes')
            .where('id', resourceId)
            .first();

          if (dispute) {
            const submittedBy = dispute.submitted_by?.id;
            const assignedTo = dispute.assigned_to?.id;
            
            hasAccess = submittedBy === req.user.id || 
                       assignedTo === req.user.id ||
                       ['admin', 'procurement_manager', 'finance_manager'].includes(req.user.role);
          }
          break;

        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        logger.logSecurity('Unauthorized resource access attempt', {
          userId: req.user.id,
          userRole: req.user.role,
          resourceType,
          resourceId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied to this resource'
        });
      }

      next();
    } catch (error) {
      logger.error('Resource access check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking resource access'
      });
    }
  };
};

// Rate limiting middleware for specific actions
const rateLimitAction = (maxRequests, windowMs) => {
  return async (req, res, next) => {
    try {
      const key = `rate_limit:${req.user?.id || req.ip}:${req.route.path}`;
      const { allowed, remaining, resetTime } = await require('../config/redis')
        .checkRateLimit(key, maxRequests, windowMs);

      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      });

      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      next(); // Continue if rate limiting fails
    }
  };
};

// Password utilities
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// JWT token generation
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    }
  );
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  canAccessResource,
  rateLimitAction,
  hashPassword,
  verifyPassword,
  validatePassword,
  generateToken
};
