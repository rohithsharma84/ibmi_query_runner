/**
 * Execution Model
 * Handles database operations for query executions
 */

const { query, getTableName } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, EXECUTION_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a new execution record
 * @param {Object} execData - Execution data
 * @param {string} execData.runId - Test run ID
 * @param {string} execData.queryId - Query ID
 * @param {number} execData.iterationNumber - Iteration number
 * @returns {Promise<Object>} Created execution
 */
async function create(execData) {
  try {
    const { runId, queryId, iterationNumber } = execData;
    
    // Insert execution and let DB generate EXECUTION_ID (IDENTITY)
    const sql = `
      INSERT INTO ${getTableName('QRYRUN_EXECUTIONS')}
      (RUN_ID, QUERY_ID, ITERATION_NUM, STATUS, START_TIME)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await query(sql, [
      runId,
      queryId,
      iterationNumber,
      EXECUTION_STATUS.RUNNING,
    ]);

    // Retrieve generated EXECUTION_ID
    const idRes = await query("SELECT IDENTITY_VAL_LOCAL() AS EXECUTION_ID FROM SYSIBM.SYSDUMMY1");
    const executionId = idRes && idRes.length > 0 ? idRes[0].EXECUTION_ID : null;

    return {
      executionId,
      runId,
      queryId,
      iterationNumber,
      status: EXECUTION_STATUS.RUNNING,
    };
    
  } catch (error) {
    logger.error('Error creating execution:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create execution record',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Complete an execution with results
 * @param {string} executionId - Execution ID
 * @param {Object} results - Execution results
 * @param {number} results.executionTime - Execution time in milliseconds
 * @param {number} results.rowsAffected - Number of rows affected
 * @param {string} results.status - Execution status (COMPLETED or FAILED)
 * @param {string} results.errorMessage - Error message if failed
 * @returns {Promise<boolean>} Success status
 */
async function complete(executionId, results) {
  try {
    const sql = `
      UPDATE ${getTableName('QRYRUN_EXECUTIONS')}
      SET 
        STATUS = ?,
        END_TIME = CURRENT_TIMESTAMP,
        DURATION_MS = ?,
        ROWS_AFFECTED = ?,
        ERROR_MESSAGE = ?
      WHERE EXECUTION_ID = ?
    `;

    await query(sql, [
      results.status,
      results.executionTime,
      results.rowsAffected || null,
      results.errorMessage || null,
      executionId,
    ]);
    
    return true;
    
  } catch (error) {
    logger.error('Error completing execution:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to complete execution',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Find execution by ID
 * @param {string} executionId - Execution ID
 * @returns {Promise<Object|null>} Execution or null
 */
async function findById(executionId) {
  try {
    const sql = `
      SELECT 
        EXECUTION_ID,
        RUN_ID,
        QUERY_ID,
        ITERATION_NUM AS ITERATION_NUMBER,
        STATUS,
        START_TIME AS STARTED_AT,
        END_TIME AS COMPLETED_AT,
        DURATION_MS AS EXECUTION_TIME,
        ROWS_AFFECTED,
        ERROR_MESSAGE
      FROM ${getTableName('QRYRUN_EXECUTIONS')}
      WHERE EXECUTION_ID = ?
    `;
    
    const results = await query(sql, [executionId]);
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    logger.error('Error finding execution:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find execution',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all executions for a test run
 * @param {string} runId - Test run ID
 * @returns {Promise<Array>} Array of executions
 */
async function findByRunId(runId) {
  try {
    const sql = `
      SELECT 
        e.EXECUTION_ID,
        e.RUN_ID,
        e.QUERY_ID,
        e.ITERATION_NUM AS ITERATION_NUMBER,
        e.STATUS,
        e.START_TIME AS STARTED_AT,
        e.END_TIME AS COMPLETED_AT,
        e.DURATION_MS AS EXECUTION_TIME,
        e.ROWS_AFFECTED,
        e.ERROR_MESSAGE,
        q.SEQUENCE_NUM AS SEQUENCE_NUMBER,
        q.QUERY_NAME AS STATEMENT_TYPE
      FROM ${getTableName('QRYRUN_EXECUTIONS')} e
      JOIN ${getTableName('QRYRUN_QUERIES')} q ON e.QUERY_ID = q.QUERY_ID
      WHERE e.RUN_ID = ?
      ORDER BY q.SEQUENCE_NUM, e.ITERATION_NUM
    `;
    
    return await query(sql, [runId]);
    
  } catch (error) {
    logger.error('Error finding executions by run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve executions',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get executions for a specific query in a test run
 * @param {string} runId - Test run ID
 * @param {string} queryId - Query ID
 * @returns {Promise<Array>} Array of executions
 */
async function findByRunAndQuery(runId, queryId) {
  try {
    const sql = `
      SELECT 
        EXECUTION_ID,
        RUN_ID,
        QUERY_ID,
        ITERATION_NUM AS ITERATION_NUMBER,
        STATUS,
        START_TIME AS STARTED_AT,
        END_TIME AS COMPLETED_AT,
        DURATION_MS AS EXECUTION_TIME,
        ROWS_AFFECTED,
        ERROR_MESSAGE
      FROM ${getTableName('QRYRUN_EXECUTIONS')}
      WHERE RUN_ID = ? AND QUERY_ID = ?
      ORDER BY ITERATION_NUM
    `;
    
    return await query(sql, [runId, queryId]);
    
  } catch (error) {
    logger.error('Error finding executions by run and query:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve executions',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get execution statistics for a query in a test run
 * @param {string} runId - Test run ID
 * @param {string} queryId - Query ID
 * @returns {Promise<Object>} Execution statistics
 */
async function getQueryStatistics(runId, queryId) {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS TOTAL_EXECUTIONS,
        SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) AS SUCCESSFUL_EXECUTIONS,
        SUM(CASE WHEN STATUS = 'FAILED' THEN 1 ELSE 0 END) AS FAILED_EXECUTIONS,
        AVG(DURATION_MS) AS AVG_EXECUTION_TIME,
        MIN(DURATION_MS) AS MIN_EXECUTION_TIME,
        MAX(DURATION_MS) AS MAX_EXECUTION_TIME,
        STDDEV(DURATION_MS) AS STDDEV_EXECUTION_TIME,
        SUM(ROWS_AFFECTED) AS TOTAL_ROWS_AFFECTED
      FROM ${getTableName('QRYRUN_EXECUTIONS')}
      WHERE RUN_ID = ? AND QUERY_ID = ? AND STATUS = 'COMPLETED'
    `;
    
    const results = await query(sql, [runId, queryId]);
    return results[0];
    
  } catch (error) {
    logger.error('Error getting query statistics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve query statistics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get execution statistics for entire test run
 * @param {string} runId - Test run ID
 * @returns {Promise<Object>} Test run execution statistics
 */
async function getRunStatistics(runId) {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS TOTAL_EXECUTIONS,
        SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) AS SUCCESSFUL_EXECUTIONS,
        SUM(CASE WHEN STATUS = 'FAILED' THEN 1 ELSE 0 END) AS FAILED_EXECUTIONS,
        AVG(DURATION_MS) AS AVG_EXECUTION_TIME,
        SUM(DURATION_MS) AS TOTAL_EXECUTION_TIME,
        MIN(DURATION_MS) AS MIN_EXECUTION_TIME,
        MAX(DURATION_MS) AS MAX_EXECUTION_TIME
      FROM ${getTableName('QRYRUN_EXECUTIONS')}
      WHERE RUN_ID = ?
    `;
    
    const results = await query(sql, [runId]);
    return results[0];
    
  } catch (error) {
    logger.error('Error getting run statistics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve run statistics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get failed executions for a test run
 * @param {string} runId - Test run ID
 * @returns {Promise<Array>} Array of failed executions
 */
async function getFailedExecutions(runId) {
  try {
    const sql = `
      SELECT 
        e.EXECUTION_ID,
        e.QUERY_ID,
        e.ITERATION_NUM AS ITERATION_NUMBER,
        e.ERROR_MESSAGE,
        e.START_TIME AS STARTED_AT,
        e.END_TIME AS COMPLETED_AT,
        q.QUERY_TEXT,
        q.SEQUENCE_NUM AS SEQUENCE_NUMBER
      FROM ${getTableName('QRYRUN_EXECUTIONS')} e
      JOIN ${getTableName('QRYRUN_QUERIES')} q ON e.QUERY_ID = q.QUERY_ID
      WHERE e.RUN_ID = ? AND e.STATUS = 'FAILED'
      ORDER BY q.SEQUENCE_NUM, e.ITERATION_NUM
    `;
    
    return await query(sql, [runId]);
    
  } catch (error) {
    logger.error('Error getting failed executions:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve failed executions',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  create,
  complete,
  findById,
  findByRunId,
  findByRunAndQuery,
  getQueryStatistics,
  getRunStatistics,
  getFailedExecutions,
};