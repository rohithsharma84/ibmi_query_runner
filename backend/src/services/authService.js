/**
 * Authentication Service
 * Handles user authentication with IBM i user profiles
 */

const jt400 = require('node-jt400');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');
const dbConfig = require('../config/database').config;

/**
 * Authenticate user with IBM i credentials
 * @param {string} userId - IBM i user profile
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result with token and user info
 */
async function login(userId, password) {
  try {
    // Validate input
    if (!userId || !password) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'User ID and password are required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    const userIdUpper = userId.toUpperCase();
    
    // Step 1: Authenticate with IBM i by attempting a connection
    logger.info('Attempting IBM i authentication:', { userId: userIdUpper });
    
    let authenticated = false;
    try {
      // Create a test connection with user credentials
      const testPool = jt400.pool({
        host: dbConfig.host,
        user: userIdUpper,
        password: password,
      });
      
      // Test the connection with a simple query
      await testPool.query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      
      authenticated = true;
      logger.info('IBM i authentication successful:', { userId: userIdUpper });
    } catch (error) {
      logger.warn('IBM i authentication failed:', { 
        userId: userIdUpper, 
        error: error.message 
      });
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid credentials',
        ERROR_CODES.AUTHENTICATION_FAILED
      );
    }
    
    // Step 2: Check if user is authorized in our application
    const isUserAuthorized = await User.isAuthorized(userIdUpper);
    
    if (!isUserAuthorized) {
      logger.warn('User not authorized in application:', { userId: userIdUpper });
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'User not authorized to access this application',
        ERROR_CODES.AUTHORIZATION_FAILED
      );
    }
    
    // Step 3: Get user details
    const user = await User.findById(userIdUpper);
    
    if (!user) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'User data not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    // Step 4: Update last login timestamp
    await User.updateLastLogin(userIdUpper);
    
    // Step 5: Generate JWT token
    const token = generateToken(user);
    
    logger.info('User logged in successfully:', { userId: userIdUpper });
    
    return {
      success: true,
      token,
      user: {
        userId: user.USER_ID,
        userName: user.USER_NAME,
        email: user.EMAIL,
        isAdmin: user.IS_ADMIN === 'Y',
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Login error:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Authentication failed',
      ERROR_CODES.AUTHENTICATION_FAILED
    );
  }
}

/**
 * Logout user (client-side token removal)
 * @param {string} userId - User ID from token
 * @returns {Promise<Object>} Logout result
 */
async function logout(userId) {
  try {
    logger.info('User logged out:', { userId });
    
    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    logger.error('Logout error:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Logout failed',
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Get current session information
 * @param {string} userId - User ID from token
 * @returns {Promise<Object>} Session information
 */
async function getSession(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'User not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    return {
      success: true,
      user: {
        userId: user.USER_ID,
        userName: user.USER_NAME,
        email: user.EMAIL,
        isAdmin: user.IS_ADMIN === 'Y',
        lastLogin: user.LAST_LOGIN,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Get session error:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to get session',
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Validate IBM i user profile exists (without password)
 * Used for adding users to the application
 * @param {string} userId - IBM i user profile
 * @returns {Promise<boolean>} True if user profile exists
 */
async function validateIBMiUser(userId) {
  try {
    // Query QSYS2.USER_INFO to check if user exists
    const { query } = require('../config/database');
    const sql = `
      SELECT AUTHORIZATION_NAME 
      FROM QSYS2.USER_INFO 
      WHERE AUTHORIZATION_NAME = ?
    `;
    
    const results = await query(sql, [userId.toUpperCase()]);
    return results.length > 0;
  } catch (error) {
    logger.error('Error validating IBM i user:', error);
    return false;
  }
}

module.exports = {
  login,
  logout,
  getSession,
  validateIBMiUser,
};