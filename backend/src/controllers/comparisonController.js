/**
 * Comparison Controller
 * Handles HTTP requests for comparison operations
 */

const comparisonService = require('../services/comparisonService');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a new comparison
 * POST /api/comparisons
 * Body: { baselineRunId, comparisonRunId, deviationThreshold }
 */
async function create(req, res, next) {
  try {
    const { baselineRunId, comparisonRunId, deviationThreshold } = req.body;
    
    // Validate required fields
    if (!baselineRunId || !comparisonRunId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'baselineRunId and comparisonRunId are required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    logger.info('Creating comparison:', {
      userId: req.user.userId,
      baselineRunId,
      comparisonRunId,
    });
    
    const comparison = await comparisonService.create({
      baselineRunId,
      comparisonRunId,
      deviationThreshold: deviationThreshold || 20,
      createdBy: req.user.userId,
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      comparison,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all comparisons
 * GET /api/comparisons
 * Query params: baselineRunId, comparisonRunId, createdBy
 */
async function getAll(req, res, next) {
  try {
    const filters = {};
    
    if (req.query.baselineRunId) {
      filters.baselineRunId = req.query.baselineRunId;
    }
    
    if (req.query.comparisonRunId) {
      filters.comparisonRunId = req.query.comparisonRunId;
    }
    
    if (req.query.createdBy) {
      filters.createdBy = req.query.createdBy;
    }
    
    logger.info('Getting comparisons:', {
      userId: req.user.userId,
      filters,
    });
    
    const comparisons = await comparisonService.getAll(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: comparisons.length,
      comparisons,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get comparison by ID
 * GET /api/comparisons/:comparisonId
 */
async function getById(req, res, next) {
  try {
    const { comparisonId } = req.params;
    
    logger.info('Getting comparison:', {
      userId: req.user.userId,
      comparisonId,
    });
    
    const comparison = await comparisonService.getById(comparisonId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      comparison,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get comparison summary
 * GET /api/comparisons/:comparisonId/summary
 */
async function getSummary(req, res, next) {
  try {
    const { comparisonId } = req.params;
    
    logger.info('Getting comparison summary:', {
      userId: req.user.userId,
      comparisonId,
    });
    
    const summary = await comparisonService.getSummary(comparisonId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get queries with deviations
 * GET /api/comparisons/:comparisonId/deviations
 */
async function getDeviations(req, res, next) {
  try {
    const { comparisonId } = req.params;
    
    logger.info('Getting comparison deviations:', {
      userId: req.user.userId,
      comparisonId,
    });
    
    const deviations = await comparisonService.getDeviations(comparisonId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: deviations.length,
      deviations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a comparison
 * DELETE /api/comparisons/:comparisonId
 */
async function remove(req, res, next) {
  try {
    const { comparisonId } = req.params;
    
    logger.info('Deleting comparison:', {
      userId: req.user.userId,
      comparisonId,
    });
    
    await comparisonService.remove(comparisonId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Comparison deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  getAll,
  getById,
  getSummary,
  getDeviations,
  remove,
};