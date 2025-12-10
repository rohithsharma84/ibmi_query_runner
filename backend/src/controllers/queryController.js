/**
 * Query Controller
 * Handles HTTP requests for individual query operations
 */

const Query = require('../models/Query');
const QuerySet = require('../models/QuerySet');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get query by ID
 * GET /api/queries/:queryId
 */
async function getById(req, res, next) {
  try {
    const { queryId } = req.params;
    
    logger.info('Getting query:', {
      userId: req.user.userId,
      queryId,
    });
    
    const queryData = await Query.findById(queryId);
    
    if (!queryData) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      query: queryData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add query to set
 * POST /api/queries/sets/:setId
 * Body: { queryText, statementType, sequenceNumber }
 */
async function addToSet(req, res, next) {
  try {
    const { setId } = req.params;
    const { queryText, statementType, sequenceNumber } = req.body;
    
    // Validate required fields
    if (!queryText) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'queryText is required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Check if query set exists
    const querySet = await QuerySet.findById(setId);
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    logger.info('Adding query to set:', {
      userId: req.user.userId,
      setId,
    });
    
    const queryData = await Query.addToSet(setId, {
      queryText,
      statementType,
      sequenceNumber,
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      query: queryData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update query
 * PUT /api/queries/:queryId
 * Body: { queryText, sequenceNumber }
 */
async function update(req, res, next) {
  try {
    const { queryId } = req.params;
    const updates = {};
    
    if (req.body.queryText !== undefined) {
      updates.QUERY_TEXT = req.body.queryText;
    }
    
    if (req.body.sequenceNumber !== undefined) {
      updates.SEQUENCE_NUMBER = req.body.sequenceNumber;
    }
    
    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No valid fields to update',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Check if query exists
    const queryData = await Query.findById(queryId);
    if (!queryData) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    logger.info('Updating query:', {
      userId: req.user.userId,
      queryId,
      updates,
    });
    
    await Query.update(queryId, updates);
    
    // Get updated query
    const updatedQuery = await Query.findById(queryId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      query: updatedQuery,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete query
 * DELETE /api/queries/:queryId
 */
async function remove(req, res, next) {
  try {
    const { queryId } = req.params;
    
    // Check if query exists
    const queryData = await Query.findById(queryId);
    if (!queryData) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    logger.info('Deleting query:', {
      userId: req.user.userId,
      queryId,
    });
    
    await Query.remove(queryId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reorder queries in a set
 * POST /api/queries/sets/:setId/reorder
 * Body: { queryOrder: [queryId1, queryId2, ...] }
 */
async function reorder(req, res, next) {
  try {
    const { setId } = req.params;
    const { queryOrder } = req.body;
    
    // Validate required fields
    if (!queryOrder || !Array.isArray(queryOrder) || queryOrder.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'queryOrder must be a non-empty array',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Check if query set exists
    const querySet = await QuerySet.findById(setId);
    if (!querySet) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Query set not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    logger.info('Reordering queries:', {
      userId: req.user.userId,
      setId,
      count: queryOrder.length,
    });
    
    await Query.reorder(setId, queryOrder);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Queries reordered successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getById,
  addToSet,
  update,
  remove,
  reorder,
};