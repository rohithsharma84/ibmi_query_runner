/**
 * Query Set Routes
 * Routes for managing query sets
 */

const express = require('express');
const router = express.Router();
const querySetController = require('../controllers/querySetController');
const { authenticate } = require('../middleware/auth');

// All query set routes require authentication
router.use(authenticate);

/**
 * POST /api/query-sets/from-plan-cache
 * Create a new query set from plan cache
 * Body: { setName, description, userProfile, planCacheFilters }
 */
router.post('/from-plan-cache', querySetController.createFromPlanCache);

/**
 * POST /api/query-sets/manual
 * Create a new query set with manual queries
 * Body: { setName, description, userProfile, queries }
 */
router.post('/manual', querySetController.createManual);

/**
 * GET /api/query-sets
 * Get all query sets
 * Query params: userProfile, createdBy
 */
router.get('/', querySetController.getAll);

/**
 * GET /api/query-sets/:setId
 * Get a specific query set with all its queries
 */
router.get('/:setId', querySetController.getById);

/**
 * PUT /api/query-sets/:setId
 * Update a query set
 * Body: { setName, description }
 */
router.put('/:setId', querySetController.update);

/**
 * DELETE /api/query-sets/:setId
 * Delete a query set (soft delete)
 */
router.delete('/:setId', querySetController.remove);

/**
 * POST /api/query-sets/:setId/refresh
 * Refresh a query set from plan cache
 * Body: { planCacheFilters }
 */
router.post('/:setId/refresh', querySetController.refresh);

module.exports = router;