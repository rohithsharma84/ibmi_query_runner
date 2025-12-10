/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

const authService = require('../services/authService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Authenticate user with IBM i credentials
 */
async function login(req, res) {
  const { userId, password } = req.body;
  
  // Validate input
  if (!userId || !password) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'User ID and password are required',
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  const result = await authService.login(userId, password);
  
  res.status(HTTP_STATUS.OK).json(result);
}

/**
 * POST /api/auth/logout
 * Logout current user
 */
async function logout(req, res) {
  const userId = req.user.userId;
  
  const result = await authService.logout(userId);
  
  res.status(HTTP_STATUS.OK).json(result);
}

/**
 * GET /api/auth/session
 * Get current session information
 */
async function getSession(req, res) {
  const userId = req.user.userId;
  
  const result = await authService.getSession(userId);
  
  res.status(HTTP_STATUS.OK).json(result);
}

module.exports = {
  login,
  logout,
  getSession,
};