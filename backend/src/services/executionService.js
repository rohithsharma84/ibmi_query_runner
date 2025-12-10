/**
 * Execution Service
 * Handles query execution with metrics collection
 */

const { query: executeQuery } = require('../config/database');
const Execution = require('../models/Execution');
const Metrics = require('../models/Metrics');
const TestRun = require('../models/TestRun');
const QuerySet = require('../models/QuerySet');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, RUN_STATUS, EXECUTION_STATUS, METRICS_LEVELS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Execute a single query and collect metrics
 * @param {string} runId - Test run ID
 * @param {string} queryId - Query ID
 * @param {string} queryText - SQL query text
 * @param {number} iterationNumber - Iteration number
 * @param {string} metricsLevel - Metrics collection level
 * @returns {Promise<Object>} Execution results
 */
async function executeSingleQuery(runId, queryId, queryText, iterationNumber, metricsLevel) {
  let execution = null;
  
  try {
    // Create execution record
    execution = await Execution.create({
      runId,
      queryId,
      iterationNumber,
    });
    
    const startTime = Date.now();
    let result;
    let rowsAffected = 0;
    
    try {
      // Execute the query
      result = await executeQuery(queryText);
      
      // Get rows affected (for DML statements)
      if (Array.isArray(result)) {
        rowsAffected = result.length;
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Complete execution successfully
      await Execution.complete(execution.executionId, {
        status: EXECUTION_STATUS.COMPLETED,
        executionTime,
        rowsAffected,
      });
      
      // Collect metrics based on level
      if (metricsLevel !== METRICS_LEVELS.BASIC) {
        await collectMetrics(execution.executionId, queryText, metricsLevel);
      }
      
      logger.info('Query executed successfully:', {
        executionId: execution.executionId,
        queryId,
        iterationNumber,
        executionTime,
      });
      
      return {
        success: true,
        executionId: execution.executionId,
        executionTime,
        rowsAffected,
      };
      
    } catch (queryError) {
      // Query execution failed
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      await Execution.complete(execution.executionId, {
        status: EXECUTION_STATUS.FAILED,
        executionTime,
        errorMessage: queryError.message,
      });
      
      logger.error('Query execution failed:', {
        executionId: execution.executionId,
        queryId,
        iterationNumber,
        error: queryError.message,
      });
      
      return {
        success: false,
        executionId: execution.executionId,
        executionTime,
        errorMessage: queryError.message,
      };
    }
    
  } catch (error) {
    logger.error('Error in query execution:', error);
    throw error;
  }
}

/**
 * Collect metrics for an execution
 * @param {string} executionId - Execution ID
 * @param {string} queryText - SQL query text
 * @param {string} metricsLevel - Metrics collection level
 * @returns {Promise<void>}
 */
async function collectMetrics(executionId, queryText, metricsLevel) {
  try {
    // For STANDARD level, collect basic metrics
    if (metricsLevel === METRICS_LEVELS.STANDARD) {
      // Query system catalog for basic metrics
      // This is a simplified version - in production, you'd query actual IBM i system views
      const metricsData = {
        executionId,
        rowsRead: null,
        rowsWritten: null,
      };
      
      await Metrics.create(metricsData);
    }
    
    // For COMPREHENSIVE level, collect detailed metrics
    if (metricsLevel === METRICS_LEVELS.COMPREHENSIVE) {
      // Query system catalog for comprehensive metrics
      // This would query IBM i performance views like QSYS2.SYSTABLESTAT, etc.
      const metricsData = {
        executionId,
        cpuTime: null,
        ioWaitTime: null,
        lockWaitTime: null,
        rowsRead: null,
        rowsWritten: null,
        tempStorageUsed: null,
        sortOperations: null,
        indexScans: null,
        tableScans: null,
      };
      
      await Metrics.create(metricsData);
    }
    
  } catch (error) {
    // Don't fail the execution if metrics collection fails
    logger.warn('Failed to collect metrics:', {
      executionId,
      error: error.message,
    });
  }
}

/**
 * Execute all queries in a test run
 * @param {string} runId - Test run ID
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} Execution results
 */
async function executeTestRun(runId, progressCallback = null) {
  try {
    // Get test run details
    const testRun = await TestRun.findById(runId);
    
    if (!testRun) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Test run not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    if (testRun.STATUS !== RUN_STATUS.PENDING) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Test run is not in pending status',
        ERROR_CODES.INVALID_OPERATION
      );
    }
    
    // Get queries from the query set
    const queries = await QuerySet.getQueries(testRun.SET_ID);
    
    if (queries.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Query set has no queries',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Update status to running
    await TestRun.updateStatus(runId, RUN_STATUS.RUNNING);
    
    logger.info('Starting test run execution:', {
      runId,
      queryCount: queries.length,
      iterationCount: testRun.ITERATION_COUNT,
    });
    
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalExecutionTime = 0;
    
    // Execute each query for the specified number of iterations
    for (const query of queries) {
      for (let iteration = 1; iteration <= testRun.ITERATION_COUNT; iteration++) {
        const result = await executeSingleQuery(
          runId,
          query.QUERY_ID,
          query.QUERY_TEXT,
          iteration,
          testRun.METRICS_LEVEL
        );
        
        totalExecutions++;
        
        if (result.success) {
          successfulExecutions++;
        } else {
          failedExecutions++;
        }
        
        totalExecutionTime += result.executionTime;
        
        // Call progress callback if provided
        if (progressCallback) {
          progressCallback({
            runId,
            totalQueries: queries.length,
            currentQuery: query.SEQUENCE_NUMBER,
            currentIteration: iteration,
            totalIterations: testRun.ITERATION_COUNT,
            totalExecutions,
            successfulExecutions,
            failedExecutions,
          });
        }
      }
    }
    
    // Update test run statistics
    await TestRun.updateStatistics(runId, {
      totalQueries: queries.length,
      successfulQueries: queries.length - (failedExecutions > 0 ? 1 : 0),
      failedQueries: failedExecutions > 0 ? 1 : 0,
      totalExecutionTime,
    });
    
    // Update status to completed
    await TestRun.updateStatus(runId, RUN_STATUS.COMPLETED);
    
    logger.info('Test run execution completed:', {
      runId,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      totalExecutionTime,
    });
    
    return {
      success: true,
      runId,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      totalExecutionTime,
    };
    
  } catch (error) {
    // Update status to failed
    try {
      await TestRun.updateStatus(runId, RUN_STATUS.FAILED);
    } catch (updateError) {
      logger.error('Failed to update test run status:', updateError);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error executing test run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to execute test run',
      ERROR_CODES.QUERY_EXECUTION_ERROR,
      error.message
    );
  }
}

/**
 * Cancel a running test run
 * @param {string} runId - Test run ID
 * @returns {Promise<boolean>} Success status
 */
async function cancelTestRun(runId) {
  try {
    const testRun = await TestRun.findById(runId);
    
    if (!testRun) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Test run not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    if (testRun.STATUS !== RUN_STATUS.RUNNING) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Test run is not currently running',
        ERROR_CODES.INVALID_OPERATION
      );
    }
    
    await TestRun.updateStatus(runId, RUN_STATUS.CANCELLED);
    
    logger.info('Test run cancelled:', { runId });
    return true;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error cancelling test run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to cancel test run',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get execution results for a test run
 * @param {string} runId - Test run ID
 * @returns {Promise<Object>} Execution results with statistics
 */
async function getExecutionResults(runId) {
  try {
    const testRun = await TestRun.getSummary(runId);
    
    if (!testRun) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Test run not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    // Get all executions
    const executions = await Execution.findByRunId(runId);
    
    // Get failed executions
    const failedExecutions = await Execution.getFailedExecutions(runId);
    
    // Get metrics if available
    let metrics = null;
    if (testRun.METRICS_LEVEL !== METRICS_LEVELS.BASIC) {
      metrics = await Metrics.getRunAggregatedMetrics(runId);
    }
    
    return {
      testRun,
      executions,
      failedExecutions,
      metrics,
    };
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting execution results:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve execution results',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  executeSingleQuery,
  executeTestRun,
  cancelTestRun,
  getExecutionResults,
};