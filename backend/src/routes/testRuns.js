/**
 * Test Run Routes
 * Routes for managing test runs and execution
 */

const express = require('express');
const router = express.Router();
const testRunController = require('../controllers/testRunController');
const { authenticate } = require('../middleware/auth');

// All test run routes require authentication
router.use(authenticate);

/**
 * POST /api/test-runs
 * Create a new test run
 * Body: { setId, runLabel, iterationCount, metricsLevel }
 */
router.post('/', testRunController.create);

/**
 * GET /api/test-runs
 * Get all test runs
 * Query params: status, createdBy
 */
router.get('/', testRunController.getAll);

/**
 * GET /api/test-runs/set/:setId
 * Get all test runs for a specific query set
 */
router.get('/set/:setId', testRunController.getBySetId);

/**
 * GET /api/test-runs/:runId
 * Get a specific test run with summary
 */
router.get('/:runId', testRunController.getById);

/**
 * POST /api/test-runs/:runId/execute
 * Execute a test run
 */
router.post('/:runId/execute', testRunController.execute);

/**
 * POST /api/test-runs/:runId/cancel
 * Cancel a running test run
 */
router.post('/:runId/cancel', testRunController.cancel);

/**
 * GET /api/test-runs/:runId/results
 * Get detailed results for a test run
 */
router.get('/:runId/results', testRunController.getResults);

/**
 * DELETE /api/test-runs/:runId
 * Delete a test run
 */
router.delete('/:runId', testRunController.remove);

module.exports = router;