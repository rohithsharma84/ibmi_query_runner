/**
 * Test Run Service
 * Business logic for test run operations
 */

const TestRun = require('../models/TestRun');
const QuerySet = require('../models/QuerySet');
const executionService = require('./executionService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, METRICS_LEVELS } = require('../config/constants');
const { isValidMetricsLevel } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Create a new test run
 * @param {Object} runData - Test run data
 * @param {string} runData.setId - Query set ID
 * @param {string} runData.runLabel - Label for this test run
 * @param {number} runData.iterationCount - Number of iterations
 * @param {string} runData.metricsLevel - Metrics collection level
 * @param {string} runData.createdBy - User who created the run
 * @returns {Promise<Object>} Created test run
 */
async function create(runData) {
  try {
    const { setId, runLabel, iterationCount, metricsLevel, createdBy } = runData;
    
    // Validate query set exists
    const querySet = await QuerySet.findById(setId);
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    // Validate iteration count
    if (!iterationCount || iterationCount < 1 || iterationCount > 1000) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Iteration count must be between 1 and 1000',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Validate metrics level
    if (!isValidMetricsLevel(metricsLevel)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid metrics level',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Create test run
    const testRun = await TestRun.create({
      setId,
      runLabel,
      iterationCount,
      metricsLevel,
      createdBy,
    });
    
    logger.info('Test run created:', {
      runId: testRun.runId,
      setId,
      runLabel,
    });
    
    return testRun;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
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
 * Get test run by ID
 * @param {string} runId - Test run ID
 * @returns {Promise<Object>} Test run with summary
 */
async function getById(runId) {
  try {
    const testRun = await TestRun.getSummary(runId);
    
    if (!testRun) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Test run not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    return testRun;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting test run:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test run',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all test runs with optional filters
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of test runs
 */
async function getAll(filters = {}) {
  try {
    return await TestRun.findAll(filters);
  } catch (error) {
    logger.error('Error getting test runs:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test runs',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get test runs for a specific query set
 * @param {string} setId - Query set ID
 * @returns {Promise<Array>} Array of test runs
 */
async function getBySetId(setId) {
  try {
    // Validate query set exists
    const querySet = await QuerySet.findById(setId);
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    return await TestRun.findBySetId(setId);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting test runs by set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test runs',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Execute a test run
 * @param {string} runId - Test run ID
 * @param {Function} progressCallback - Optional progress callback
 * @returns {Promise<Object>} Execution results
 */
async function execute(runId, progressCallback = null) {
  try {
    logger.info('Starting test run execution:', { runId });
    
    const results = await executionService.executeTestRun(runId, progressCallback);
    
    logger.info('Test run execution completed:', {
      runId,
      ...results,
    });
    
    return results;
    
  } catch (error) {
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
async function cancel(runId) {
  try {
    return await executionService.cancelTestRun(runId);
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
 * Delete a test run
 * @param {string} runId - Test run ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(runId) {
  try {
    return await TestRun.remove(runId);
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
 * Get detailed results for a test run
 * @param {string} runId - Test run ID
 * @returns {Promise<Object>} Detailed execution results
 */
async function getResults(runId) {
  try {
    return await executionService.getExecutionResults(runId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting test run results:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve test run results',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  create,
  getById,
  getAll,
  getBySetId,
  execute,
  cancel,
  remove,
  getResults,
};