/**
 * Plan Cache Service
 * Handles querying IBM i SQL plan cache views
 */

const { query } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, PLAN_CACHE_VIEWS } = require('../config/constants');
const { isValidPlanCacheView, isValidUserProfile, isValidDateString } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Get available plan cache views
 * @returns {Promise<Array>} List of available views
 */
async function getAvailableViews() {
  return [
    {
      name: PLAN_CACHE_VIEWS.PLAN_CACHE_INFO,
      description: 'Detailed plan cache information including statement text',
      schema: 'QSYS2',
    },
    {
      name: PLAN_CACHE_VIEWS.PLAN_CACHE,
      description: 'Basic plan cache information',
      schema: 'QSYS2',
    },
  ];
}

/**
 * Query plan cache with filters
 * @param {Object} filters - Filter criteria
 * @param {string} filters.view - Plan cache view to query
 * @param {string} filters.userProfile - User profile filter
 * @param {string} filters.dateFrom - Start date (YYYY-MM-DD)
 * @param {string} filters.dateTo - End date (YYYY-MM-DD)
 * @param {number} filters.minExecutionCount - Minimum execution count
 * @param {number} filters.limit - Maximum number of results
 * @returns {Promise<Array>} Query results
 */
async function queryPlanCache(filters) {
  try {
    const {
      view = PLAN_CACHE_VIEWS.PLAN_CACHE_INFO,
      userProfile,
      dateFrom,
      dateTo,
      minExecutionCount,
      limit = 100,
    } = filters;
    
    // Validate inputs
    if (!isValidPlanCacheView(view)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid plan cache view',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    if (!userProfile || !isValidUserProfile(userProfile)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Valid user profile is required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    if (dateFrom && !isValidDateString(dateFrom)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid date format for dateFrom (use YYYY-MM-DD)',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    if (dateTo && !isValidDateString(dateTo)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid date format for dateTo (use YYYY-MM-DD)',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Build SQL query based on view
    let sql;
    const params = [];
    
    if (view === PLAN_CACHE_VIEWS.PLAN_CACHE_INFO) {
      sql = `
        SELECT 
          STATEMENT_TEXT,
          USER_NAME,
          LAST_RUN_TIMESTAMP,
          NUMBER_RUNS,
          AVERAGE_ELAPSED_TIME,
          TOTAL_ELAPSED_TIME,
          STATEMENT_TYPE,
          PROGRAM_LIBRARY,
          PROGRAM_NAME
        FROM QSYS2.PLAN_CACHE_INFO
        WHERE USER_NAME = ?
      `;
      params.push(userProfile.toUpperCase());
      
      // Add date filters
      if (dateFrom) {
        sql += ` AND LAST_RUN_TIMESTAMP >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND LAST_RUN_TIMESTAMP <= ?`;
        params.push(dateTo + ' 23:59:59');
      }
      
      // Add execution count filter
      if (minExecutionCount && minExecutionCount > 0) {
        sql += ` AND NUMBER_RUNS >= ?`;
        params.push(minExecutionCount);
      }
      
      // Order by most recent first
      sql += ` ORDER BY LAST_RUN_TIMESTAMP DESC`;
      
      // Add limit
      sql += ` FETCH FIRST ? ROWS ONLY`;
      params.push(limit);
      
    } else {
      // PLAN_CACHE view
      sql = `
        SELECT 
          SQL_STATEMENT_TEXT AS STATEMENT_TEXT,
          USER_NAME,
          LAST_USE_TIMESTAMP AS LAST_RUN_TIMESTAMP,
          NUMBER_USES AS NUMBER_RUNS,
          STATEMENT_TYPE
        FROM QSYS2.PLAN_CACHE
        WHERE USER_NAME = ?
      `;
      params.push(userProfile.toUpperCase());
      
      if (dateFrom) {
        sql += ` AND LAST_USE_TIMESTAMP >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND LAST_USE_TIMESTAMP <= ?`;
        params.push(dateTo + ' 23:59:59');
      }
      
      if (minExecutionCount && minExecutionCount > 0) {
        sql += ` AND NUMBER_USES >= ?`;
        params.push(minExecutionCount);
      }
      
      sql += ` ORDER BY LAST_USE_TIMESTAMP DESC`;
      sql += ` FETCH FIRST ? ROWS ONLY`;
      params.push(limit);
    }
    
    logger.info('Querying plan cache:', { view, userProfile, filters });
    
    const results = await query(sql, params);
    
    logger.info('Plan cache query results:', { 
      view, 
      userProfile, 
      resultCount: results.length 
    });
    
    return results;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error querying plan cache:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to query plan cache',
      ERROR_CODES.QUERY_EXECUTION_ERROR,
      error.message
    );
  }
}

/**
 * Preview queries from plan cache before importing
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Preview results with statistics
 */
async function previewQueries(filters) {
  try {
    const queries = await queryPlanCache(filters);
    
    // Calculate statistics
    const stats = {
      totalQueries: queries.length,
      uniqueStatementTypes: [...new Set(queries.map(q => q.STATEMENT_TYPE))],
      dateRange: {
        earliest: queries.length > 0 ? 
          queries[queries.length - 1].LAST_RUN_TIMESTAMP : null,
        latest: queries.length > 0 ? 
          queries[0].LAST_RUN_TIMESTAMP : null,
      },
      totalExecutions: queries.reduce((sum, q) => sum + (q.NUMBER_RUNS || 0), 0),
    };
    
    return {
      success: true,
      queries: queries.map(q => ({
        statementText: q.STATEMENT_TEXT,
        userName: q.USER_NAME,
        lastRunTimestamp: q.LAST_RUN_TIMESTAMP,
        numberRuns: q.NUMBER_RUNS,
        averageElapsedTime: q.AVERAGE_ELAPSED_TIME,
        statementType: q.STATEMENT_TYPE,
      })),
      statistics: stats,
      filters: filters,
    };
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error previewing queries:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to preview queries',
      ERROR_CODES.QUERY_EXECUTION_ERROR
    );
  }
}

module.exports = {
  getAvailableViews,
  queryPlanCache,
  previewQueries,
};