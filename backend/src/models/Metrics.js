/**
 * Metrics Model
 * Handles database operations for execution metrics
 */

const { query, getTableName } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create metrics record for an execution
 * @param {Object} metricsData - Metrics data
 * @param {string} metricsData.executionId - Execution ID
 * @param {number} metricsData.cpuTime - CPU time in milliseconds
 * @param {number} metricsData.ioWaitTime - I/O wait time in milliseconds
 * @param {number} metricsData.lockWaitTime - Lock wait time in milliseconds
 * @param {number} metricsData.rowsRead - Number of rows read
 * @param {number} metricsData.rowsWritten - Number of rows written
 * @param {number} metricsData.tempStorageUsed - Temporary storage used in KB
 * @param {number} metricsData.sortOperations - Number of sort operations
 * @param {number} metricsData.indexScans - Number of index scans
 * @param {number} metricsData.tableScans - Number of table scans
 * @returns {Promise<Object>} Created metrics
 */
async function create(metricsData) {
  try {
    const {
      executionId,
      cpuTime,
      ioWaitTime,
      lockWaitTime,
      rowsRead,
      rowsWritten,
      tempStorageUsed,
      sortOperations,
      indexScans,
      tableScans,
    } = metricsData;
    
    const sql = `
      INSERT INTO ${getTableName('QRYRUN_METRICS')}
      (EXECUTION_ID, CPU_TIME, IO_WAIT_TIME, LOCK_WAIT_TIME, 
       ROWS_READ, ROWS_WRITTEN, TEMP_STORAGE_USED, 
       SORT_OPERATIONS, INDEX_SCANS, TABLE_SCANS, COLLECTED_AT)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    await query(sql, [
      executionId,
      cpuTime || null,
      ioWaitTime || null,
      lockWaitTime || null,
      rowsRead || null,
      rowsWritten || null,
      tempStorageUsed || null,
      sortOperations || null,
      indexScans || null,
      tableScans || null,
    ]);
    
    return {
      executionId,
      ...metricsData,
    };
    
  } catch (error) {
    logger.error('Error creating metrics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create metrics record',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Find metrics by execution ID
 * @param {string} executionId - Execution ID
 * @returns {Promise<Object|null>} Metrics or null
 */
async function findByExecutionId(executionId) {
  try {
    const sql = `
      SELECT 
        EXECUTION_ID,
        CPU_TIME,
        IO_WAIT_TIME,
        LOCK_WAIT_TIME,
        ROWS_READ,
        ROWS_WRITTEN,
        TEMP_STORAGE_USED,
        SORT_OPERATIONS,
        INDEX_SCANS,
        TABLE_SCANS,
        COLLECTED_AT
      FROM ${getTableName('QRYRUN_METRICS')}
      WHERE EXECUTION_ID = ?
    `;
    
    const results = await query(sql, [executionId]);
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    logger.error('Error finding metrics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find metrics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get aggregated metrics for a query across all iterations
 * @param {string} runId - Test run ID
 * @param {string} queryId - Query ID
 * @returns {Promise<Object>} Aggregated metrics
 */
async function getQueryAggregatedMetrics(runId, queryId) {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS METRIC_COUNT,
        AVG(m.CPU_TIME) AS AVG_CPU_TIME,
        MIN(m.CPU_TIME) AS MIN_CPU_TIME,
        MAX(m.CPU_TIME) AS MAX_CPU_TIME,
        AVG(m.IO_WAIT_TIME) AS AVG_IO_WAIT_TIME,
        AVG(m.LOCK_WAIT_TIME) AS AVG_LOCK_WAIT_TIME,
        AVG(m.ROWS_READ) AS AVG_ROWS_READ,
        AVG(m.ROWS_WRITTEN) AS AVG_ROWS_WRITTEN,
        AVG(m.TEMP_STORAGE_USED) AS AVG_TEMP_STORAGE_USED,
        SUM(m.SORT_OPERATIONS) AS TOTAL_SORT_OPERATIONS,
        SUM(m.INDEX_SCANS) AS TOTAL_INDEX_SCANS,
        SUM(m.TABLE_SCANS) AS TOTAL_TABLE_SCANS
      FROM ${getTableName('QRYRUN_METRICS')} m
      JOIN ${getTableName('QRYRUN_EXECUTIONS')} e ON m.EXECUTION_ID = e.EXECUTION_ID
      WHERE e.RUN_ID = ? AND e.QUERY_ID = ? AND e.STATUS = 'COMPLETED'
    `;
    
    const results = await query(sql, [runId, queryId]);
    return results[0];
    
  } catch (error) {
    logger.error('Error getting aggregated metrics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve aggregated metrics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get aggregated metrics for entire test run
 * @param {string} runId - Test run ID
 * @returns {Promise<Object>} Aggregated metrics for run
 */
async function getRunAggregatedMetrics(runId) {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS METRIC_COUNT,
        AVG(m.CPU_TIME) AS AVG_CPU_TIME,
        SUM(m.CPU_TIME) AS TOTAL_CPU_TIME,
        AVG(m.IO_WAIT_TIME) AS AVG_IO_WAIT_TIME,
        SUM(m.IO_WAIT_TIME) AS TOTAL_IO_WAIT_TIME,
        AVG(m.LOCK_WAIT_TIME) AS AVG_LOCK_WAIT_TIME,
        SUM(m.LOCK_WAIT_TIME) AS TOTAL_LOCK_WAIT_TIME,
        SUM(m.ROWS_READ) AS TOTAL_ROWS_READ,
        SUM(m.ROWS_WRITTEN) AS TOTAL_ROWS_WRITTEN,
        SUM(m.TEMP_STORAGE_USED) AS TOTAL_TEMP_STORAGE_USED,
        SUM(m.SORT_OPERATIONS) AS TOTAL_SORT_OPERATIONS,
        SUM(m.INDEX_SCANS) AS TOTAL_INDEX_SCANS,
        SUM(m.TABLE_SCANS) AS TOTAL_TABLE_SCANS
      FROM ${getTableName('QRYRUN_METRICS')} m
      JOIN ${getTableName('QRYRUN_EXECUTIONS')} e ON m.EXECUTION_ID = e.EXECUTION_ID
      WHERE e.RUN_ID = ? AND e.STATUS = 'COMPLETED'
    `;
    
    const results = await query(sql, [runId]);
    return results[0];
    
  } catch (error) {
    logger.error('Error getting run aggregated metrics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve run aggregated metrics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get metrics for all executions of a query
 * @param {string} runId - Test run ID
 * @param {string} queryId - Query ID
 * @returns {Promise<Array>} Array of metrics
 */
async function getQueryMetrics(runId, queryId) {
  try {
    const sql = `
      SELECT 
        m.EXECUTION_ID,
        e.ITERATION_NUMBER,
        m.CPU_TIME,
        m.IO_WAIT_TIME,
        m.LOCK_WAIT_TIME,
        m.ROWS_READ,
        m.ROWS_WRITTEN,
        m.TEMP_STORAGE_USED,
        m.SORT_OPERATIONS,
        m.INDEX_SCANS,
        m.TABLE_SCANS,
        m.COLLECTED_AT
      FROM ${getTableName('QRYRUN_METRICS')} m
      JOIN ${getTableName('QRYRUN_EXECUTIONS')} e ON m.EXECUTION_ID = e.EXECUTION_ID
      WHERE e.RUN_ID = ? AND e.QUERY_ID = ?
      ORDER BY e.ITERATION_NUMBER
    `;
    
    return await query(sql, [runId, queryId]);
    
  } catch (error) {
    logger.error('Error getting query metrics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve query metrics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Compare metrics between two executions
 * @param {string} executionId1 - First execution ID
 * @param {string} executionId2 - Second execution ID
 * @returns {Promise<Object>} Comparison results
 */
async function compareExecutions(executionId1, executionId2) {
  try {
    const metrics1 = await findByExecutionId(executionId1);
    const metrics2 = await findByExecutionId(executionId2);
    
    if (!metrics1 || !metrics2) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Metrics not found for one or both executions',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    const comparison = {
      execution1: metrics1,
      execution2: metrics2,
      differences: {
        cpuTimeDiff: metrics2.CPU_TIME - metrics1.CPU_TIME,
        cpuTimePercent: ((metrics2.CPU_TIME - metrics1.CPU_TIME) / metrics1.CPU_TIME) * 100,
        ioWaitTimeDiff: metrics2.IO_WAIT_TIME - metrics1.IO_WAIT_TIME,
        lockWaitTimeDiff: metrics2.LOCK_WAIT_TIME - metrics1.LOCK_WAIT_TIME,
        rowsReadDiff: metrics2.ROWS_READ - metrics1.ROWS_READ,
        rowsWrittenDiff: metrics2.ROWS_WRITTEN - metrics1.ROWS_WRITTEN,
      },
    };
    
    return comparison;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error comparing executions:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to compare executions',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  create,
  findByExecutionId,
  getQueryAggregatedMetrics,
  getRunAggregatedMetrics,
  getQueryMetrics,
  compareExecutions,
};