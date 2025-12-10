/**
 * Query Routes
 * Routes for managing individual queries within query sets
 */

const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const { authenticate } = require('../middleware/auth');

// All query routes require authentication
router.use(authenticate);

/**
 * GET /api/queries/:queryId
 * Get a specific query by ID
 */
router.get('/:queryId', queryController.getById);

/**
 * POST /api/queries/sets/:setId
 * Add a new query to a query set
 * Body: { queryText, statementType, sequenceNumber }
 */
router.post('/sets/:setId', queryController.addToSet);

/**
 * PUT /api/queries/:queryId
 * Update a query
 * Body: { queryText, sequenceNumber }
 */
router.put('/:queryId', queryController.update);

/**
 * DELETE /api/queries/:queryId
 * Delete a query (soft delete)
 */
router.delete('/:queryId', queryController.remove);

/**
 * POST /api/queries/sets/:setId/reorder
 * Reorder queries in a set
 * Body: { queryOrder: [queryId1, queryId2, ...] }
 */
router.post('/sets/:setId/reorder', queryController.reorder);

module.exports = router;