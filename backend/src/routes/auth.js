/**
 * Authentication Routes
 * Handles user login, logout, and session management
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

/**
 * POST /api/auth/login
 * Authenticate user with IBM i credentials
 * 
 * Request body:
 * {
 *   "userId": "USERNAME",
 *   "password": "password"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "token": "jwt-token",
 *   "user": {
 *     "userId": "USERNAME",
 *     "userName": "Full Name",
 *     "email": "email@example.com",
 *     "isAdmin": false
 *   }
 * }
 */
router.post('/login', asyncHandler(authController.login));

/**
 * POST /api/auth/logout
 * Logout current user
 * Requires authentication
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

/**
 * GET /api/auth/session
 * Get current session information
 * Requires authentication
 * 
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "userId": "USERNAME",
 *     "userName": "Full Name",
 *     "email": "email@example.com",
 *     "isAdmin": false,
 *     "lastLogin": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get('/session', authenticate, asyncHandler(authController.getSession));

module.exports = router;