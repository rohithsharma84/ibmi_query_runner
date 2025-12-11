/**
 * Query Set Controller
 * Handles HTTP requests for query set operations
 */

const querySetService = require('../services/querySetService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { isValidUserProfile } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Create query set from plan cache
 * POST /api/query-sets/from-plan-cache
 * Body: { setName, description, userProfile, planCacheFilters }
 */
async function createFromPlanCache(req, res, next) {
  try {
    const { setName, description, userProfile, planCacheFilters } = req.body;
    
    // Validate required fields
    if (!setName || !userProfile || !planCacheFilters) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'setName, userProfile, and planCacheFilters are required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    if (!isValidUserProfile(userProfile)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid user profile format',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    const setData = {
      setName,
      description,
      userProfile,
      createdBy: req.user.userId,
    };
    
    logger.info('Creating query set from plan cache:', {
      userId: req.user.userId,
      setName,
      userProfile,
    });
    
    const querySet = await querySetService.createFromPlanCache(
      setData,
      planCacheFilters
    );
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      querySet,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create query set manually
 * POST /api/query-sets/manual
 * Body: { setName, description, userProfile, queries }
 */
async function createManual(req, res, next) {
  try {
    const { setName, description, userProfile, queries } = req.body;

    // Validate required fields (queries may be provided or added later)
    if (!setName || !userProfile) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'setName and userProfile are required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!isValidUserProfile(userProfile)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid user profile format',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // queries are optional for manual creation; default to empty array
    let queriesToUse = [];
    if (queries !== undefined) {
      if (!Array.isArray(queries)) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'queries must be an array',
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      queriesToUse = queries;
    }

    const setData = {
      setName,
      description,
      userProfile,
      createdBy: req.user.userId,
    };

    logger.info('Creating query set manually:', {
      userId: req.user.userId,
      setName,
      queryCount: queriesToUse.length,
    });

    const querySet = await querySetService.createManual(setData, queriesToUse);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      querySet,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all query sets
 * GET /api/query-sets
 * Query params: userProfile, createdBy
 */
async function getAll(req, res, next) {
  try {
    const filters = {};
    
    if (req.query.userProfile) {
      filters.userProfile = req.query.userProfile;
    }
    
    if (req.query.createdBy) {
      filters.createdBy = req.query.createdBy;
    }
    
    logger.info('Getting query sets:', {
      userId: req.user.userId,
      filters,
    });
    
    const querySets = await querySetService.getAll(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: querySets.length,
      querySets,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get query set by ID
 * GET /api/query-sets/:setId
 */
async function getById(req, res, next) {
  try {
    const { setId } = req.params;
    
    logger.info('Getting query set:', {
      userId: req.user.userId,
      setId,
    });
    
    const querySet = await querySetService.getById(setId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      querySet,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update query set
 * PUT /api/query-sets/:setId
 * Body: { setName, description }
 */
async function update(req, res, next) {
  try {
    const { setId } = req.params;
    const updates = {};
    
    if (req.body.setName !== undefined) {
      updates.SET_NAME = req.body.setName;
    }
    
    if (req.body.description !== undefined) {
      updates.DESCRIPTION = req.body.description;
    }
    
    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No valid fields to update',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    logger.info('Updating query set:', {
      userId: req.user.userId,
      setId,
      updates,
    });
    
    const querySet = await querySetService.update(setId, updates);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      querySet,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete query set
 * DELETE /api/query-sets/:setId
 */
async function remove(req, res, next) {
  try {
    const { setId } = req.params;
    
    logger.info('Deleting query set:', {
      userId: req.user.userId,
      setId,
    });
    
    await querySetService.remove(setId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Query set deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh query set from plan cache
 * POST /api/query-sets/:setId/refresh
 * Body: { planCacheFilters }
 */
async function refresh(req, res, next) {
  try {
    const { setId } = req.params;
    const { planCacheFilters } = req.body;
    
    if (!planCacheFilters) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'planCacheFilters is required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    logger.info('Refreshing query set:', {
      userId: req.user.userId,
      setId,
    });
    
    const refreshStats = await querySetService.refresh(setId, planCacheFilters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...refreshStats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createFromPlanCache,
  createManual,
  getAll,
  getById,
  update,
  remove,
  refresh,
};