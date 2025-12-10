/**
 * Plan Cache Routes
 * Routes for querying IBM i SQL plan cache
 */

const express = require('express');
const router = express.Router();
const planCacheController = require('../controllers/planCacheController');
const { authenticate } = require('../middleware/auth');

// All plan cache routes require authentication
router.use(authenticate);

/**
 * GET /api/plan-cache/views
 * Get available plan cache views
 */
router.get('/views', planCacheController.getViews);

/**
 * POST /api/plan-cache/query
 * Query plan cache with filters
 * Body: { view, userProfile, dateFrom, dateTo, minExecutionCount, limit }
 */
router.post('/query', planCacheController.queryCache);

/**
 * POST /api/plan-cache/preview
 * Preview queries before importing to a query set
 * Body: { view, userProfile, dateFrom, dateTo, minExecutionCount, limit }
 */
router.post('/preview', planCacheController.previewQueries);

module.exports = router;