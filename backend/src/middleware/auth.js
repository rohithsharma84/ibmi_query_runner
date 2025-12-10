/**
 * Authentication Middleware
 * JWT-based authentication and authorization
 */

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const authConfig = require('../config/auth');
const logger = require('../utils/logger');

/**
 * Verify JWT token and authenticate user
 */
function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'No token provided',
        ERROR_CODES.AUTHENTICATION_FAILED
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
    };
    
    logger.debug('User authenticated:', { userId: req.user.userId });
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid token',
        ERROR_CODES.AUTHENTICATION_FAILED
      ));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Token expired',
        ERROR_CODES.AUTHENTICATION_FAILED
      ));
    } else {
      next(error);
    }
  }
}

/**
 * Require admin privileges
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication required',
      ERROR_CODES.AUTHENTICATION_FAILED
    ));
  }
  
  if (!req.user.isAdmin) {
    return next(new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Admin privileges required',
      ERROR_CODES.AUTHORIZATION_FAILED
    ));
  }
  
  next();
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user.USER_ID,
    isAdmin: user.IS_ADMIN === 'Y',
  };
  
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiration,
  });
}

/**
 * Optional authentication - doesn't fail if no token
 * Used for routes that work differently for authenticated users
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, authConfig.jwtSecret);
      
      req.user = {
        userId: decoded.userId,
        isAdmin: decoded.isAdmin,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
    logger.debug('Optional auth failed:', error.message);
  }
  
  next();
}

module.exports = {
  authenticate,
  requireAdmin,
  generateToken,
  optionalAuth,
};