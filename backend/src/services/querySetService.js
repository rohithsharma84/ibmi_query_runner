/**
 * Query Set Service
 * Business logic for query set operations
 */

const QuerySet = require('../models/QuerySet');
const planCacheService = require('./planCacheService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a new query set from plan cache
 * @param {Object} setData - Query set data
 * @param {Object} planCacheFilters - Filters for plan cache query
 * @returns {Promise<Object>} Created query set
 */
async function createFromPlanCache(setData, planCacheFilters) {
  try {
    // Query plan cache to get queries
    const queries = await planCacheService.queryPlanCache(planCacheFilters);
    
    if (queries.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No queries found in plan cache with the specified filters',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Create query set with queries
    const querySet = await QuerySet.create(setData, queries);
    
    logger.info('Query set created from plan cache:', {
      setId: querySet.setId,
      queryCount: queries.length,
    });
    
    return querySet;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error creating query set from plan cache:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create query set from plan cache',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Create a query set with manual queries
 * @param {Object} setData - Query set data
 * @param {Array} queries - Array of query objects
 * @returns {Promise<Object>} Created query set
 */
async function createManual(setData, queries) {
  try {
    // Allow creating an empty query set. If queries is undefined, default to empty array.
    if (queries === undefined) {
      queries = [];
    } else if (!Array.isArray(queries)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'queries must be an array',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const querySet = await QuerySet.create(setData, queries);
    
    logger.info('Query set created manually:', {
      setId: querySet.setId,
      queryCount: queries.length,
    });
    
    return querySet;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error creating manual query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create query set',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Get query set by ID with queries
 * @param {string} setId - Query set ID
 * @returns {Promise<Object>} Query set with queries
 */
async function getById(setId) {
  try {
    const querySet = await QuerySet.findById(setId);
    
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    const queries = await QuerySet.getQueries(setId);
    
    return {
      ...querySet,
      queries,
    };
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve query set',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all query sets with optional filters
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of query sets
 */
async function getAll(filters = {}) {
  try {
    return await QuerySet.findAll(filters);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting query sets:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve query sets',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Update query set
 * @param {string} setId - Query set ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated query set
 */
async function update(setId, updates) {
  try {
    // Check if query set exists
    const querySet = await QuerySet.findById(setId);
    
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    await QuerySet.update(setId, updates);
    
    return await getById(setId);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error updating query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update query set',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Delete query set
 * @param {string} setId - Query set ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(setId) {
  try {
    // Check if query set exists
    const querySet = await QuerySet.findById(setId);
    
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    return await QuerySet.remove(setId);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error deleting query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete query set',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Refresh query set from plan cache
 * @param {string} setId - Query set ID
 * @param {Object} planCacheFilters - Filters for plan cache query
 * @returns {Promise<Object>} Refresh statistics
 */
async function refresh(setId, planCacheFilters) {
  try {
    // Check if query set exists
    const querySet = await QuerySet.findById(setId);
    
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    // Query plan cache to get current queries
    const newQueries = await planCacheService.queryPlanCache(planCacheFilters);
    
    // Refresh the query set
    const refreshStats = await QuerySet.refresh(setId, newQueries);
    
    logger.info('Query set refreshed:', {
      setId,
      ...refreshStats,
    });
    
    return refreshStats;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error refreshing query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to refresh query set',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

module.exports = {
  createFromPlanCache,
  createManual,
  getById,
  getAll,
  update,
  remove,
  refresh,
};