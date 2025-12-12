/**
 * User Model
 * Database operations for user management
 */

const { query, getTableName, transaction } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Find user by user ID
 * @param {string} userId - IBM i user profile
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(userId) {
  try {
    const sql = `
      SELECT USER_ID, USER_NAME, EMAIL, IS_ADMIN, CREATED_AT, LAST_LOGIN
      FROM ${getTableName('QRYRUN_USERS')}
      WHERE USER_ID = ?
    `;
    
    const results = await query(sql, [userId.toUpperCase()]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    logger.error('Error finding user by ID:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find user',
      ERROR_CODES.DB_CONNECTION_ERROR
    );
  }
}

/**
 * Find all users
 * @returns {Promise<Array>} Array of user objects
 */
async function findAll() {
  try {
    const sql = `
      SELECT USER_ID, USER_NAME, EMAIL, IS_ADMIN, CREATED_AT, LAST_LOGIN
      FROM ${getTableName('QRYRUN_USERS')}
      ORDER BY USER_ID
    `;
    
    return await query(sql);
  } catch (error) {
    logger.error('Error finding all users:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve users',
      ERROR_CODES.DB_CONNECTION_ERROR
    );
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.userId - IBM i user profile
 * @param {string} userData.userName - Full name
 * @param {string} userData.email - Email address
 * @param {boolean} userData.isAdmin - Admin flag
 * @returns {Promise<Object>} Created user object
 */
async function create(userData) {
  try {
    const { userId, userName, email, isAdmin } = userData;

    const created = await transaction(async (conn) => {
      // Check if user already exists using same connection
      const checkSql = `
        SELECT USER_ID FROM ${getTableName('QRYRUN_USERS')} WHERE USER_ID = ?
      `;
      const existingRows = await conn.execute(checkSql, [userId.toUpperCase()]);
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'User already exists',
          ERROR_CODES.DUPLICATE_ENTRY
        );
      }

      const insertSql = `
        INSERT INTO ${getTableName('QRYRUN_USERS')} 
          (USER_ID, USER_NAME, EMAIL, IS_ADMIN, CREATED_AT)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await conn.execute(insertSql, [
        userId.toUpperCase(),
        userName,
        email,
        isAdmin ? 'Y' : 'N'
      ]);

      // Return newly created user
      const selectSql = `
        SELECT USER_ID, USER_NAME, EMAIL, IS_ADMIN, CREATED_AT, LAST_LOGIN
        FROM ${getTableName('QRYRUN_USERS')}
        WHERE USER_ID = ?
      `;
      const rows = await conn.execute(selectSql, [userId.toUpperCase()]);
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    });

    logger.info('User created:', { userId });
    return created;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating user:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create user',
      ERROR_CODES.DB_CONNECTION_ERROR
    );
  }
}

/**
 * Update user's last login timestamp
 * @param {string} userId - IBM i user profile
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
  try {
    const sql = `
      UPDATE ${getTableName('QRYRUN_USERS')}
      SET LAST_LOGIN = CURRENT_TIMESTAMP
      WHERE USER_ID = ?
    `;
    
    await query(sql, [userId.toUpperCase()]);
    logger.debug('Updated last login for user:', { userId });
  } catch (error) {
    logger.error('Error updating last login:', error);
    // Don't throw error - this is not critical
  }
}

/**
 * Delete a user
 * @param {string} userId - IBM i user profile
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteUser(userId) {
  try {
    // Don't allow deleting QSECOFR
    if (userId.toUpperCase() === 'QSECOFR') {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Cannot delete QSECOFR user',
        ERROR_CODES.AUTHORIZATION_FAILED
      );
    }
    
    const sql = `
      DELETE FROM ${getTableName('QRYRUN_USERS')}
      WHERE USER_ID = ?
    `;
    
    const result = await query(sql, [userId.toUpperCase()]);
    logger.info('User deleted:', { userId });
    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    logger.error('Error deleting user:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete user',
      ERROR_CODES.DB_CONNECTION_ERROR
    );
  }
}

/**
 * Check if user is authorized (exists in QRYRUN_USERS table)
 * @param {string} userId - IBM i user profile
 * @returns {Promise<boolean>} True if authorized
 */
async function isAuthorized(userId) {
  try {
    const user = await findById(userId);
    return user !== null;
  } catch (error) {
    logger.error('Error checking user authorization:', error);
    return false;
  }
}

/**
 * Check if user is admin
 * @param {string} userId - IBM i user profile
 * @returns {Promise<boolean>} True if admin
 */
async function isAdmin(userId) {
  try {
    const user = await findById(userId);
    return user && user.IS_ADMIN === 'Y';
  } catch (error) {
    logger.error('Error checking admin status:', error);
    return false;
  }
}

module.exports = {
  findById,
  findAll,
  create,
  updateLastLogin,
  deleteUser,
  isAuthorized,
  isAdmin,
};