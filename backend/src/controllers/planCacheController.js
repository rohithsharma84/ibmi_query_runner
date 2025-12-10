/**
 * Plan Cache Controller
 * Handles HTTP requests for plan cache operations
 */

const planCacheService = require('../services/planCacheService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get available plan cache views
 * GET /api/plan-cache/views
 */
async function getViews(req, res, next) {
  try {
    const views = await planCacheService.getAvailableViews();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      views,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Query plan cache with filters
 * POST /api/plan-cache/query
 * Body: { view, userProfile, dateFrom, dateTo, minExecutionCount, limit }
 */
async function queryCache(req, res, next) {
  try {
    const filters = {
      view: req.body.view,
      userProfile: req.body.userProfile,
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      minExecutionCount: req.body.minExecutionCount,
      limit: req.body.limit,
    };
    
    logger.info('Plan cache query request:', { 
      userId: req.user.userId, 
      filters 
    });
    
    const results = await planCacheService.queryPlanCache(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: results.length,
      queries: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Preview queries before importing
 * POST /api/plan-cache/preview
 * Body: { view, userProfile, dateFrom, dateTo, minExecutionCount, limit }
 */
async function previewQueries(req, res, next) {
  try {
    const filters = {
      view: req.body.view,
      userProfile: req.body.userProfile,
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      minExecutionCount: req.body.minExecutionCount,
      limit: req.body.limit,
    };
    
    logger.info('Plan cache preview request:', { 
      userId: req.user.userId, 
      filters 
    });
    
    const preview = await planCacheService.previewQueries(filters);
    
    res.status(HTTP_STATUS.OK).json(preview);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getViews,
  queryCache,
  previewQueries,
};