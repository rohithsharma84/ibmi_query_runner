/**
 * Comparison Routes
 * Routes for comparing test runs and analyzing deviations
 */

const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');
const { authenticate } = require('../middleware/auth');

// All comparison routes require authentication
router.use(authenticate);

/**
 * POST /api/comparisons
 * Create a new comparison between two test runs
 * Body: { baselineRunId, comparisonRunId, deviationThreshold }
 */
router.post('/', comparisonController.create);

/**
 * GET /api/comparisons
 * Get all comparisons
 * Query params: baselineRunId, comparisonRunId, createdBy
 */
router.get('/', comparisonController.getAll);

/**
 * GET /api/comparisons/:comparisonId
 * Get a specific comparison with details
 */
router.get('/:comparisonId', comparisonController.getById);

/**
 * GET /api/comparisons/:comparisonId/summary
 * Get comparison summary with insights
 */
router.get('/:comparisonId/summary', comparisonController.getSummary);

/**
 * GET /api/comparisons/:comparisonId/deviations
 * Get queries with deviations for a comparison
 */
router.get('/:comparisonId/deviations', comparisonController.getDeviations);

/**
 * DELETE /api/comparisons/:comparisonId
 * Delete a comparison
 */
router.delete('/:comparisonId', comparisonController.remove);

module.exports = router;