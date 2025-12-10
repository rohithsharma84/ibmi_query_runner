/**
 * User Controller
 * Handles user management HTTP requests
 */

const User = require('../models/User');
const authService = require('../services/authService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { isValidUserProfile, isValidEmail } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * GET /api/users
 * Get all users (admin only)
 */
async function getAllUsers(req, res) {
  const users = await User.findAll();
  
  // Transform data for response
  const usersData = users.map(user => ({
    userId: user.USER_ID,
    userName: user.USER_NAME,
    email: user.EMAIL,
    isAdmin: user.IS_ADMIN === 'Y',
    createdAt: user.CREATED_AT,
    lastLogin: user.LAST_LOGIN,
  }));
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    users: usersData,
  });
}

/**
 * GET /api/users/:userId
 * Get specific user
 */
async function getUser(req, res) {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      'User not found',
      ERROR_CODES.NOT_FOUND
    );
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    user: {
      userId: user.USER_ID,
      userName: user.USER_NAME,
      email: user.EMAIL,
      isAdmin: user.IS_ADMIN === 'Y',
      createdAt: user.CREATED_AT,
      lastLogin: user.LAST_LOGIN,
    },
  });
}

/**
 * POST /api/users
 * Create new user (admin only)
 */
async function createUser(req, res) {
  const { userId, userName, email, isAdmin } = req.body;
  
  // Validate input
  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'User ID is required',
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  if (!isValidUserProfile(userId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid IBM i user profile format',
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  if (email && !isValidEmail(email)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid email format',
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  // Validate that IBM i user exists
  const ibmiUserExists = await authService.validateIBMiUser(userId);
  if (!ibmiUserExists) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'IBM i user profile does not exist',
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  // Create user
  const user = await User.create({
    userId,
    userName: userName || userId,
    email,
    isAdmin: isAdmin || false,
  });
  
  logger.info('User created by admin:', { 
    userId: user.USER_ID, 
    createdBy: req.user.userId 
  });
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User created successfully',
    user: {
      userId: user.USER_ID,
      userName: user.USER_NAME,
      email: user.EMAIL,
      isAdmin: user.IS_ADMIN === 'Y',
      createdAt: user.CREATED_AT,
    },
  });
}

/**
 * DELETE /api/users/:userId
 * Delete user (admin only)
 */
async function deleteUser(req, res) {
  const { userId } = req.params;
  
  // Don't allow deleting yourself
  if (userId.toUpperCase() === req.user.userId.toUpperCase()) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Cannot delete your own user account',
      ERROR_CODES.AUTHORIZATION_FAILED
    );
  }
  
  await User.deleteUser(userId);
  
  logger.info('User deleted by admin:', { 
    userId, 
    deletedBy: req.user.userId 
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deleted successfully',
  });
/**
 * PUT /api/users/:userId
 * Update user (admin only)
 */
async function updateUser(req, res) {
  const { userId } = req.params;
  const { is_admin, is_active } = req.body;
  
  // Don't allow changing your own admin status
  if (userId.toUpperCase() === req.user.userId.toUpperCase() && is_admin === false) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Cannot remove your own admin privileges',
      ERROR_CODES.AUTHORIZATION_FAILED
    );
  }
  
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      'User not found',
      ERROR_CODES.NOT_FOUND
    );
  }
  
  // Update user
  await User.update(userId, {
    isAdmin: is_admin,
    isActive: is_active
  });
  
  logger.info('User updated by admin:', { 
    userId, 
    updatedBy: req.user.userId 
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully',
  });
}

}

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  deleteUser,
};