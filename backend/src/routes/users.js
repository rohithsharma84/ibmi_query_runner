/**
 * User Management Routes
 * Handles user CRUD operations (admin only)
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');

// All user routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Get all users
 * Requires admin privileges
 * 
 * Response:
 * {
 *   "success": true,
 *   "users": [
 *     {
 *       "userId": "USERNAME",
 *       "userName": "Full Name",
 *       "email": "email@example.com",
 *       "isAdmin": false,
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "lastLogin": "2024-01-01T00:00:00.000Z"
 *     }
 *   ]
 * }
 */
router.get('/', requireAdmin, asyncHandler(userController.getAllUsers));

/**
 * GET /api/users/:userId
 * Get specific user
 * 
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "userId": "USERNAME",
 *     "userName": "Full Name",
 *     "email": "email@example.com",
 *     "isAdmin": false,
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "lastLogin": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get('/:userId', asyncHandler(userController.getUser));

/**
 * POST /api/users
 * Create new user
 * Requires admin privileges
 * 
 * Request body:
 * {
 *   "userId": "USERNAME",
 *   "userName": "Full Name",
 *   "email": "email@example.com",
 *   "isAdmin": false
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User created successfully",
 *   "user": { ... }
 * }
 */
router.post('/', requireAdmin, asyncHandler(userController.createUser));

/**
 * DELETE /api/users/:userId
 * Delete user
 * Requires admin privileges
 * Cannot delete QSECOFR or yourself
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User deleted successfully"
 * }
 */
router.delete('/:userId', requireAdmin, asyncHandler(userController.deleteUser));

module.exports = router;