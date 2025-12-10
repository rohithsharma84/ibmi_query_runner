/**
 * Test Run Controller
 * Handles HTTP requests for test run operations
 */

const testRunService = require('../services/testRunService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a new test run
 * POST /api/test-runs
 * Body: { setId, runLabel, iterationCount, metricsLevel }
 */
async function create(req, res, next) {
  try {
    const { setId, runLabel, iterationCount, metricsLevel } = req.body;
    
    // Validate required fields
    if (!setId || !runLabel || !iterationCount || !metricsLevel) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'setId, runLabel, iterationCount, and metricsLevel are required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    logger.info('Creating test run:', {
      userId: req.user.userId,
      setId,
      runLabel,
    });
    
    const testRun = await testRunService.create({
      setId,
      runLabel,
      iterationCount,
      metricsLevel,
      createdBy: req.user.userId,
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      testRun,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all test runs
 * GET /api/test-runs
 * Query params: status, createdBy
 */
async function getAll(req, res, next) {
  try {
    const filters = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.createdBy) {
      filters.createdBy = req.query.createdBy;
    }
    
    logger.info('Getting test runs:', {
      userId: req.user.userId,
      filters,
    });
    
    const testRuns = await testRunService.getAll(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: testRuns.length,
      testRuns,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get test run by ID
 * GET /api/test-runs/:runId
 */
async function getById(req, res, next) {
  try {
    const { runId } = req.params;
    
    logger.info('Getting test run:', {
      userId: req.user.userId,
      runId,
    });
    
    const testRun = await testRunService.getById(runId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      testRun,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get test runs for a query set
 * GET /api/test-runs/set/:setId
 */
async function getBySetId(req, res, next) {
  try {
    const { setId } = req.params;
    
    logger.info('Getting test runs for set:', {
      userId: req.user.userId,
      setId,
    });
    
    const testRuns = await testRunService.getBySetId(setId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: testRuns.length,
      testRuns,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Execute a test run
 * POST /api/test-runs/:runId/execute
 */
async function execute(req, res, next) {
  try {
    const { runId } = req.params;
    
    logger.info('Executing test run:', {
      userId: req.user.userId,
      runId,
    });
    
    // Start execution asynchronously
    // In a real implementation, this would use a job queue or background worker
    testRunService.execute(runId).catch(error => {
      logger.error('Test run execution failed:', {
        runId,
        error: error.message,
      });
    });
    
    res.status(HTTP_STATUS.ACCEPTED).json({
      success: true,
      message: 'Test run execution started',
      runId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel a running test run
 * POST /api/test-runs/:runId/cancel
 */
async function cancel(req, res, next) {
  try {
    const { runId } = req.params;
    
    logger.info('Cancelling test run:', {
      userId: req.user.userId,
      runId,
    });
    
    await testRunService.cancel(runId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Test run cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a test run
 * DELETE /api/test-runs/:runId
 */
async function remove(req, res, next) {
  try {
    const { runId } = req.params;
    
    logger.info('Deleting test run:', {
      userId: req.user.userId,
      runId,
    });
    
    await testRunService.remove(runId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Test run deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get test run results
 * GET /api/test-runs/:runId/results
 */
async function getResults(req, res, next) {
  try {
    const { runId } = req.params;
    
    logger.info('Getting test run results:', {
      userId: req.user.userId,
      runId,
    });
    
    const results = await testRunService.getResults(runId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  getAll,
  getById,
  getBySetId,
  execute,
  cancel,
  remove,
  getResults,
};