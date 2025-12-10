/**
 * Comparison Service
 * Business logic for comparing test runs and detecting deviations
 */

const Comparison = require('../models/Comparison');
const TestRun = require('../models/TestRun');
const Execution = require('../models/Execution');
const QuerySet = require('../models/QuerySet');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, RUN_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a comparison between two test runs
 * @param {Object} comparisonData - Comparison data
 * @param {string} comparisonData.baselineRunId - Baseline test run ID
 * @param {string} comparisonData.comparisonRunId - Comparison test run ID
 * @param {number} comparisonData.deviationThreshold - Deviation threshold percentage (default 20)
 * @param {string} comparisonData.createdBy - User who created the comparison
 * @returns {Promise<Object>} Created comparison with analysis
 */
async function create(comparisonData) {
  try {
    const {
      baselineRunId,
      comparisonRunId,
      deviationThreshold = 20,
      createdBy,
    } = comparisonData;
    
    // Validate both test runs exist and are completed
    const baselineRun = await TestRun.findById(baselineRunId);
    const comparisonRun = await TestRun.findById(comparisonRunId);
    
    if (!baselineRun) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Baseline test run not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    if (!comparisonRun) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Comparison test run not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    if (baselineRun.STATUS !== RUN_STATUS.COMPLETED) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Baseline test run is not completed',
        ERROR_CODES.INVALID_OPERATION
      );
    }
    
    if (comparisonRun.STATUS !== RUN_STATUS.COMPLETED) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Comparison test run is not completed',
        ERROR_CODES.INVALID_OPERATION
      );
    }
    
    // Validate both runs are from the same query set
    if (baselineRun.SET_ID !== comparisonRun.SET_ID) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Test runs must be from the same query set',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Validate deviation threshold
    if (deviationThreshold < 0 || deviationThreshold > 100) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Deviation threshold must be between 0 and 100',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    // Create comparison record
    const comparison = await Comparison.create({
      baselineRunId,
      comparisonRunId,
      deviationThreshold,
      createdBy,
    });
    
    // Perform comparison analysis
    await analyzeComparison(comparison.comparisonId, deviationThreshold);
    
    // Get updated comparison with statistics
    const updatedComparison = await Comparison.findById(comparison.comparisonId);
    
    logger.info('Comparison created and analyzed:', {
      comparisonId: comparison.comparisonId,
      baselineRunId,
      comparisonRunId,
    });
    
    return updatedComparison;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error creating comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create comparison',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Analyze comparison and calculate statistics
 * @param {string} comparisonId - Comparison ID
 * @param {number} deviationThreshold - Deviation threshold percentage
 * @returns {Promise<void>}
 */
async function analyzeComparison(comparisonId, deviationThreshold) {
  try {
    const comparison = await Comparison.findById(comparisonId);
    
    if (!comparison) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Comparison not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    // Get queries from the query set
    const baselineRun = await TestRun.findById(comparison.BASELINE_RUN_ID);
    const queries = await QuerySet.getQueries(baselineRun.SET_ID);
    
    let totalQueriesCompared = 0;
    let queriesWithDeviation = 0;
    let queriesImproved = 0;
    let queriesDegraded = 0;
    let totalBaselineTime = 0;
    let totalComparisonTime = 0;
    
    // Compare each query
    for (const query of queries) {
      const baselineStats = await Execution.getQueryStatistics(
        comparison.BASELINE_RUN_ID,
        query.QUERY_ID
      );
      
      const comparisonStats = await Execution.getQueryStatistics(
        comparison.COMPARISON_RUN_ID,
        query.QUERY_ID
      );
      
      // Skip if either run has no successful executions for this query
      if (!baselineStats.AVG_EXECUTION_TIME || !comparisonStats.AVG_EXECUTION_TIME) {
        continue;
      }
      
      totalQueriesCompared++;
      
      const baselineAvg = baselineStats.AVG_EXECUTION_TIME;
      const comparisonAvg = comparisonStats.AVG_EXECUTION_TIME;
      const timeDifference = comparisonAvg - baselineAvg;
      const percentChange = (timeDifference / baselineAvg) * 100;
      
      totalBaselineTime += baselineAvg;
      totalComparisonTime += comparisonAvg;
      
      // Check for deviation
      const hasDeviation = Math.abs(percentChange) >= deviationThreshold;
      const isImprovement = percentChange < 0; // Negative means faster
      
      if (hasDeviation) {
        queriesWithDeviation++;
        
        if (isImprovement) {
          queriesImproved++;
        } else {
          queriesDegraded++;
        }
      }
      
      // Add comparison detail
      await Comparison.addDetail({
        comparisonId,
        queryId: query.QUERY_ID,
        baselineAvgTime: baselineAvg,
        comparisonAvgTime: comparisonAvg,
        timeDifference,
        percentChange,
        hasDeviation,
        isImprovement,
      });
    }
    
    // Calculate overall statistics
    const avgBaselineTime = totalQueriesCompared > 0 ? 
      totalBaselineTime / totalQueriesCompared : 0;
    const avgComparisonTime = totalQueriesCompared > 0 ? 
      totalComparisonTime / totalQueriesCompared : 0;
    const overallChangePercent = avgBaselineTime > 0 ? 
      ((avgComparisonTime - avgBaselineTime) / avgBaselineTime) * 100 : 0;
    
    // Update comparison statistics
    await Comparison.updateStatistics(comparisonId, {
      totalQueriesCompared,
      queriesWithDeviation,
      queriesImproved,
      queriesDegraded,
      avgBaselineTime,
      avgComparisonTime,
      overallChangePercent,
    });
    
    logger.info('Comparison analysis completed:', {
      comparisonId,
      totalQueriesCompared,
      queriesWithDeviation,
      queriesImproved,
      queriesDegraded,
    });
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error analyzing comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to analyze comparison',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Get comparison by ID with details
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<Object>} Comparison with details
 */
async function getById(comparisonId) {
  try {
    const comparison = await Comparison.findById(comparisonId);
    
    if (!comparison) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Comparison not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    // Get comparison details
    const details = await Comparison.getDetails(comparisonId);
    
    // Get test run information
    const baselineRun = await TestRun.findById(comparison.BASELINE_RUN_ID);
    const comparisonRun = await TestRun.findById(comparison.COMPARISON_RUN_ID);
    
    return {
      ...comparison,
      baselineRun,
      comparisonRun,
      details,
    };
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve comparison',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all comparisons with optional filters
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of comparisons
 */
async function getAll(filters = {}) {
  try {
    return await Comparison.findAll(filters);
  } catch (error) {
    logger.error('Error getting comparisons:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve comparisons',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get queries with deviations for a comparison
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<Array>} Array of queries with deviations
 */
async function getDeviations(comparisonId) {
  try {
    const comparison = await Comparison.findById(comparisonId);
    
    if (!comparison) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Comparison not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    return await Comparison.getQueriesWithDeviations(comparisonId);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting deviations:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve deviations',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Delete a comparison
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(comparisonId) {
  try {
    const comparison = await Comparison.findById(comparisonId);
    
    if (!comparison) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Comparison not found',
        ERROR_CODES.NOT_FOUND
      );
    }
    
    return await Comparison.remove(comparisonId);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error deleting comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete comparison',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get comparison summary with key insights
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<Object>} Comparison summary
 */
async function getSummary(comparisonId) {
  try {
    const comparison = await getById(comparisonId);
    
    // Calculate insights
    const insights = {
      overallTrend: comparison.OVERALL_CHANGE_PERCENT < 0 ? 'IMPROVED' : 
                    comparison.OVERALL_CHANGE_PERCENT > 0 ? 'DEGRADED' : 'UNCHANGED',
      significantChanges: comparison.QUERIES_WITH_DEVIATION > 0,
      improvementRate: comparison.TOTAL_QUERIES_COMPARED > 0 ?
        (comparison.QUERIES_IMPROVED / comparison.TOTAL_QUERIES_COMPARED) * 100 : 0,
      degradationRate: comparison.TOTAL_QUERIES_COMPARED > 0 ?
        (comparison.QUERIES_DEGRADED / comparison.TOTAL_QUERIES_COMPARED) * 100 : 0,
    };
    
    return {
      ...comparison,
      insights,
    };
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting comparison summary:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve comparison summary',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  create,
  getById,
  getAll,
  getDeviations,
  remove,
  getSummary,
};