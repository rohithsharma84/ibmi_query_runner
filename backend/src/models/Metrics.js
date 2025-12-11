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
      ioOperations,
      logicalReads,
      physicalReads,
      tempStorageKb,
      estimatedCost,
      actualRows,
    } = metricsData;

    // DDL columns: CPU_TIME_MS, IO_OPERATIONS, LOGICAL_READS, PHYSICAL_READS, TEMP_STORAGE_KB, ESTIMATED_COST, ACTUAL_ROWS
    const sql = `
      INSERT INTO ${getTableName('QRYRUN_METRICS')}
      (EXECUTION_ID, CPU_TIME_MS, IO_OPERATIONS, LOGICAL_READS, PHYSICAL_READS,
       TEMP_STORAGE_KB, ESTIMATED_COST, ACTUAL_ROWS)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      executionId,
      cpuTime || null,
      ioOperations || null,
      logicalReads || null,
      physicalReads || null,
      tempStorageKb || null,
      estimatedCost || null,
      actualRows || null,
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
        CPU_TIME_MS AS CPU_TIME,
        IO_OPERATIONS AS IO_OPERATIONS,
        LOGICAL_READS AS LOGICAL_READS,
        PHYSICAL_READS AS PHYSICAL_READS,
        TEMP_STORAGE_KB AS TEMP_STORAGE_KB,
        ESTIMATED_COST AS ESTIMATED_COST,
        ACTUAL_ROWS AS ACTUAL_ROWS
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
        AVG(m.CPU_TIME_MS) AS AVG_CPU_TIME,
        MIN(m.CPU_TIME_MS) AS MIN_CPU_TIME,
        MAX(m.CPU_TIME_MS) AS MAX_CPU_TIME,
        AVG(m.IO_OPERATIONS) AS AVG_IO_OPERATIONS,
        AVG(m.LOGICAL_READS) AS AVG_LOGICAL_READS,
        AVG(m.PHYSICAL_READS) AS AVG_PHYSICAL_READS,
        AVG(m.TEMP_STORAGE_KB) AS AVG_TEMP_STORAGE_KB,
        SUM(m.ESTIMATED_COST) AS TOTAL_ESTIMATED_COST,
        SUM(m.ACTUAL_ROWS) AS TOTAL_ACTUAL_ROWS
      FROM ${getTableName('QRYRUN_METRICS')} m
      JOIN ${getTableName('QRYRUN_EXECUTIONS')} e ON m.EXECUTION_ID = e.EXECUTION_ID
      WHERE e.RUN_ID = ? AND e.QUERY_ID = ? AND e.STATUS = 'SUCCESS'
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
        AVG(m.CPU_TIME_MS) AS AVG_CPU_TIME,
        SUM(m.CPU_TIME_MS) AS TOTAL_CPU_TIME,
        AVG(m.IO_OPERATIONS) AS AVG_IO_OPERATIONS,
        SUM(m.IO_OPERATIONS) AS TOTAL_IO_OPERATIONS,
        AVG(m.LOGICAL_READS) AS AVG_LOGICAL_READS,
        SUM(m.LOGICAL_READS) AS TOTAL_LOGICAL_READS,
        SUM(m.PHYSICAL_READS) AS TOTAL_PHYSICAL_READS,
        SUM(m.TEMP_STORAGE_KB) AS TOTAL_TEMP_STORAGE_KB,
        SUM(m.ESTIMATED_COST) AS TOTAL_ESTIMATED_COST,
        SUM(m.ACTUAL_ROWS) AS TOTAL_ACTUAL_ROWS
      FROM ${getTableName('QRYRUN_METRICS')} m
      JOIN ${getTableName('QRYRUN_EXECUTIONS')} e ON m.EXECUTION_ID = e.EXECUTION_ID
      WHERE e.RUN_ID = ? AND e.STATUS = 'SUCCESS'
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
        e.ITERATION_NUM AS ITERATION_NUMBER,
        m.CPU_TIME_MS AS CPU_TIME,
        m.IO_OPERATIONS AS IO_OPERATIONS,
        m.LOGICAL_READS AS LOGICAL_READS,
        m.PHYSICAL_READS AS PHYSICAL_READS,
        m.TEMP_STORAGE_KB AS TEMP_STORAGE_KB,
        m.ESTIMATED_COST AS ESTIMATED_COST,
        m.ACTUAL_ROWS AS ACTUAL_ROWS
      FROM ${getTableName('QRYRUN_METRICS')} m
      JOIN ${getTableName('QRYRUN_EXECUTIONS')} e ON m.EXECUTION_ID = e.EXECUTION_ID
      WHERE e.RUN_ID = ? AND e.QUERY_ID = ?
      ORDER BY e.ITERATION_NUM
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
        cpuTimeDiff: (metrics2.CPU_TIME || 0) - (metrics1.CPU_TIME || 0),
        cpuTimePercent: (metrics1.CPU_TIME && metrics1.CPU_TIME !== 0)
          ? (((metrics2.CPU_TIME || 0) - (metrics1.CPU_TIME || 0)) / metrics1.CPU_TIME) * 100
          : null,
        ioOperationsDiff: (metrics2.IO_OPERATIONS || 0) - (metrics1.IO_OPERATIONS || 0),
        logicalReadsDiff: (metrics2.LOGICAL_READS || 0) - (metrics1.LOGICAL_READS || 0),
        physicalReadsDiff: (metrics2.PHYSICAL_READS || 0) - (metrics1.PHYSICAL_READS || 0),
        actualRowsDiff: (metrics2.ACTUAL_ROWS || 0) - (metrics1.ACTUAL_ROWS || 0),
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