/**
 * Test Run Model
 * Handles database operations for test runs
 */

const { query, getTableName, transaction } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, RUN_STATUS, METRICS_LEVELS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a new test run
 * @param {Object} runData - Test run data
 * @param {string} runData.setId - Query set ID
 * @param {string} runData.runLabel - Label for this test run
 * @param {number} runData.iterationCount - Number of times to execute each query
 * @param {string} runData.metricsLevel - Metrics collection level (BASIC, STANDARD, COMPREHENSIVE)
 * @param {string} runData.createdBy - User who created the run
 * @returns {Promise<Object>} Created test run
 */
async function create(runData) {
  try {
    const { setId, runLabel, iterationCount, metricsLevel, createdBy } = runData;
    
    // Insert test run (RUN_ID is an IDENTITY column)
    const sql = `
      INSERT INTO ${getTableName('QRYRUN_TEST_RUNS')}
      (SET_ID, RUN_NAME, RUN_DESCRIPTION, ITERATION_COUNT, METRICS_LEVEL,
       STATUS, CREATED_BY, CREATED_AT)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await query(sql, [
      setId,
      runLabel,
      runDescription || null,
      iterationCount,
      metricsLevel,
      RUN_STATUS.PENDING,
      createdBy.toUpperCase(),
    ]);

    // Retrieve generated RUN_ID
    const idRes = await query("SELECT IDENTITY_VAL_LOCAL() AS RUN_ID FROM SYSIBM.SYSDUMMY1");
    const runId = idRes && idRes.length > 0 ? idRes[0].RUN_ID : null;
    
    logger.info('Test run created:', { runId, setId, runLabel });
    
    return {
      runId,
      setId,
      runLabel,
      iterationCount,
      metricsLevel,
      status: RUN_STATUS.PENDING,
      createdBy: createdBy.toUpperCase(),
    };
    
  } catch (error) {
    logger.error('Error creating test run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create test run',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Find test run by ID
 * @param {string} runId - Test run ID
 * @returns {Promise<Object|null>} Test run or null
 */
async function findById(runId) {
  try {
    const sql = `
      SELECT 
        RUN_ID,
        SET_ID,
        RUN_NAME AS RUN_NAME,
        RUN_DESCRIPTION AS RUN_DESCRIPTION,
        ITERATION_COUNT,
        METRICS_LEVEL,
        STATUS,
        STARTED_AT,
        COMPLETED_AT,
        TOTAL_QUERIES,
        SUCCESSFUL_QUERIES,
        FAILED_QUERIES,
        TOTAL_EXECUTIONS,
        AVG_DURATION_MS AS AVG_EXECUTION_TIME,
        CREATED_BY,
        CREATED_AT
      FROM ${getTableName('QRYRUN_TEST_RUNS')}
      WHERE RUN_ID = ?
    `;
    
    const results = await query(sql, [runId]);
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    logger.error('Error finding test run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find test run',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all test runs for a query set
 * @param {string} setId - Query set ID
 * @returns {Promise<Array>} Array of test runs
 */
async function findBySetId(setId) {
  try {
    const sql = `
      SELECT 
        RUN_ID,
        SET_ID,
        RUN_NAME AS RUN_NAME,
        RUN_DESCRIPTION AS RUN_DESCRIPTION,
        ITERATION_COUNT,
        METRICS_LEVEL,
        STATUS,
        STARTED_AT,
        COMPLETED_AT,
        TOTAL_QUERIES,
        SUCCESSFUL_QUERIES,
        FAILED_QUERIES,
        TOTAL_EXECUTIONS,
        AVG_DURATION_MS AS AVG_EXECUTION_TIME,
        CREATED_BY,
        CREATED_AT
      FROM ${getTableName('QRYRUN_TEST_RUNS')}
      WHERE SET_ID = ?
      ORDER BY CREATED_AT DESC
    `;
    
    return await query(sql, [setId]);
    
  } catch (error) {
    logger.error('Error finding test runs by set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test runs',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all test runs with optional filters
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.createdBy - Filter by creator
 * @returns {Promise<Array>} Array of test runs
 */
async function findAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        tr.RUN_ID,
        tr.SET_ID,
        tr.RUN_NAME AS RUN_NAME,
        tr.ITERATION_COUNT,
        tr.METRICS_LEVEL,
        tr.STATUS,
        tr.STARTED_AT,
        tr.COMPLETED_AT,
        tr.TOTAL_QUERIES,
        tr.SUCCESSFUL_QUERIES,
        tr.FAILED_QUERIES,
        tr.TOTAL_EXECUTIONS,
        tr.AVG_DURATION_MS AS AVG_EXECUTION_TIME,
        tr.CREATED_BY,
        tr.CREATED_AT,
        qs.SET_NAME
      FROM ${getTableName('QRYRUN_TEST_RUNS')} tr
      JOIN ${getTableName('QRYRUN_QUERY_SETS')} qs ON tr.SET_ID = qs.SET_ID
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      sql += ` AND tr.STATUS = ?`;
      params.push(filters.status);
    }
    
    if (filters.createdBy) {
      sql += ` AND tr.CREATED_BY = ?`;
      params.push(filters.createdBy.toUpperCase());
    }
    
    sql += ` ORDER BY tr.CREATED_AT DESC`;
    
    return await query(sql, params);
    
  } catch (error) {
    logger.error('Error finding test runs:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test runs',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Update test run status
 * @param {string} runId - Test run ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<boolean>} Success status
 */
async function updateStatus(runId, status, additionalData = {}) {
  try {
    const setClauses = ['STATUS = ?'];
    const params = [status];
    
    // Add timestamp based on status
    if (status === RUN_STATUS.RUNNING && !additionalData.STARTED_AT) {
      setClauses.push('STARTED_AT = CURRENT_TIMESTAMP');
    }
    
    if ([RUN_STATUS.COMPLETED, RUN_STATUS.FAILED, RUN_STATUS.CANCELLED].includes(status)) {
      setClauses.push('COMPLETED_AT = CURRENT_TIMESTAMP');
    }
    
    // Add any additional fields
    for (const [key, value] of Object.entries(additionalData)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
    
    params.push(runId);
    
    const sql = `
      UPDATE ${getTableName('QRYRUN_TEST_RUNS')}
      SET ${setClauses.join(', ')}
      WHERE RUN_ID = ?
    `;
    
    await query(sql, params);
    
    logger.info('Test run status updated:', { runId, status });
    return true;
    
  } catch (error) {
    logger.error('Error updating test run status:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update test run status',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Update test run statistics
 * @param {string} runId - Test run ID
 * @param {Object} stats - Statistics to update
 * @returns {Promise<boolean>} Success status
 */
async function updateStatistics(runId, stats) {
  try {
    // Map provided stats to DB columns. AVG_DURATION_MS will be computed if totalExecutionTime and totalExecutions provided.
    let avgMs = null;
    if (stats.totalExecutionTime !== undefined) {
      const denom = stats.totalExecutions || stats.totalQueries || 1;
      avgMs = stats.totalExecutionTime / Math.max(denom, 1);
    }

    const sql = `
      UPDATE ${getTableName('QRYRUN_TEST_RUNS')}
      SET 
        TOTAL_QUERIES = ?,
        SUCCESSFUL_QUERIES = ?,
        FAILED_QUERIES = ?,
        AVG_DURATION_MS = COALESCE(?, AVG_DURATION_MS)
      WHERE RUN_ID = ?
    `;

    await query(sql, [
      stats.totalQueries || 0,
      stats.successfulQueries || 0,
      stats.failedQueries || 0,
      avgMs,
      runId,
    ]);
    
    logger.info('Test run statistics updated:', { runId, stats });
    return true;
    
  } catch (error) {
    logger.error('Error updating test run statistics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update test run statistics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Delete test run (soft delete by marking as cancelled)
 * @param {string} runId - Test run ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(runId) {
  try {
    // Check if run is in progress
    const testRun = await findById(runId);
    
    if (testRun && testRun.STATUS === RUN_STATUS.RUNNING) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Cannot delete a test run that is currently running',
        ERROR_CODES.INVALID_OPERATION
      );
    }
    
    // Mark as cancelled
    await updateStatus(runId, RUN_STATUS.CANCELLED);
    
    logger.info('Test run deleted:', { runId });
    return true;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error deleting test run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete test run',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get test run summary with execution details
 * @param {string} runId - Test run ID
 * @returns {Promise<Object>} Test run with execution summary
 */
async function getSummary(runId) {
  try {
    const testRun = await findById(runId);
    
    if (!testRun) {
      return null;
    }
    
    // Get execution summary
    const execSql = `
      SELECT 
        COUNT(*) AS TOTAL_EXECUTIONS,
        SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) AS SUCCESSFUL_EXECUTIONS,
        SUM(CASE WHEN STATUS = 'FAILED' THEN 1 ELSE 0 END) AS FAILED_EXECUTIONS,
        AVG(DURATION_MS) AS AVG_EXECUTION_TIME,
        MIN(DURATION_MS) AS MIN_EXECUTION_TIME,
        MAX(DURATION_MS) AS MAX_EXECUTION_TIME
      FROM ${getTableName('QRYRUN_EXECUTIONS')}
      WHERE RUN_ID = ?
    `;
    
    const execResults = await query(execSql, [runId]);
    
    return {
      ...testRun,
      executionSummary: execResults[0],
    };
    
  } catch (error) {
    logger.error('Error getting test run summary:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test run summary',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  create,
  findById,
  findBySetId,
  findAll,
  updateStatus,
  updateStatistics,
  remove,
  getSummary,
};