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
  // Accept multiple payload shapes from frontend
  const userId = (req.body.userId || req.body.user_id || req.body.user_profile || '').toUpperCase();
  const userName = req.body.userName || req.body.user_name || userId;
  const email = req.body.email || null;
  const isAdmin = req.body.isAdmin ?? req.body.is_admin ?? false;
  const allowBypass = req.body.allowBypass === true || req.body.allow_bypass === true;
  
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
  
  // Validate that IBM i user exists (or caller has permission to check) unless bypass requested
  if (!allowBypass) {
    try {
      const ibmiUserExists = await authService.validateIBMiUser(userId);
      if (!ibmiUserExists) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'The IBM i user does not exist or you do not have permission to verify it',
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    } catch (e) {
      // Handle cases where system lookup fails due to insufficient permissions
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'The IBM i user does not exist or you do not have permission to verify it',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
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

  // Do not allow modifying QSECOFR
  if (userId.toUpperCase() === 'QSECOFR') {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Cannot modify QSECOFR user',
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