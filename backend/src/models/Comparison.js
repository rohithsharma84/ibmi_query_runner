/**
 * Comparison Model
 * Handles database operations for test run comparisons
 */

const { query, getTableName, transaction } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a new comparison between two test runs
 * @param {Object} comparisonData - Comparison data
 * @param {string} comparisonData.baselineRunId - Baseline test run ID
 * @param {string} comparisonData.comparisonRunId - Comparison test run ID
 * @param {number} comparisonData.deviationThreshold - Deviation threshold percentage
 * @param {string} comparisonData.createdBy - User who created the comparison
 * @returns {Promise<Object>} Created comparison
 */
async function create(comparisonData) {
  const conn = await transaction();
  
  try {
    const { baselineRunId, comparisonRunId, deviationThreshold, createdBy } = comparisonData;
    
    // Generate unique comparison ID
    const comparisonId = `CMP${Date.now()}`;
    
    // Insert comparison record
    const sql = `
      INSERT INTO ${getTableName('QRYRUN_COMPARISONS')}
      (COMPARISON_ID, BASELINE_RUN_ID, COMPARISON_RUN_ID, 
       DEVIATION_THRESHOLD, CREATED_BY, CREATED_AT)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    await conn.execute(sql, [
      comparisonId,
      baselineRunId,
      comparisonRunId,
      deviationThreshold,
      createdBy.toUpperCase(),
    ]);
    
    await conn.commit();
    
    logger.info('Comparison created:', {
      comparisonId,
      baselineRunId,
      comparisonRunId,
    });
    
    return {
      comparisonId,
      baselineRunId,
      comparisonRunId,
      deviationThreshold,
      createdBy: createdBy.toUpperCase(),
    };
    
  } catch (error) {
    await conn.rollback();
    logger.error('Error creating comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create comparison',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  } finally {
    await conn.close();
  }
}

/**
 * Find comparison by ID
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<Object|null>} Comparison or null
 */
async function findById(comparisonId) {
  try {
    const sql = `
      SELECT 
        COMPARISON_ID,
        BASELINE_RUN_ID,
        COMPARISON_RUN_ID,
        DEVIATION_THRESHOLD,
        TOTAL_QUERIES_COMPARED,
        QUERIES_WITH_DEVIATION,
        QUERIES_IMPROVED,
        QUERIES_DEGRADED,
        AVG_BASELINE_TIME,
        AVG_COMPARISON_TIME,
        OVERALL_CHANGE_PERCENT,
        CREATED_BY,
        CREATED_AT
      FROM ${getTableName('QRYRUN_COMPARISONS')}
      WHERE COMPARISON_ID = ?
    `;
    
    const results = await query(sql, [comparisonId]);
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    logger.error('Error finding comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find comparison',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all comparisons with optional filters
 * @param {Object} filters - Optional filters
 * @param {string} filters.baselineRunId - Filter by baseline run
 * @param {string} filters.comparisonRunId - Filter by comparison run
 * @param {string} filters.createdBy - Filter by creator
 * @returns {Promise<Array>} Array of comparisons
 */
async function findAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        c.COMPARISON_ID,
        c.BASELINE_RUN_ID,
        c.COMPARISON_RUN_ID,
        c.DEVIATION_THRESHOLD,
        c.TOTAL_QUERIES_COMPARED,
        c.QUERIES_WITH_DEVIATION,
        c.QUERIES_IMPROVED,
        c.QUERIES_DEGRADED,
        c.AVG_BASELINE_TIME,
        c.AVG_COMPARISON_TIME,
        c.OVERALL_CHANGE_PERCENT,
        c.CREATED_BY,
        c.CREATED_AT,
        br.RUN_LABEL AS BASELINE_LABEL,
        cr.RUN_LABEL AS COMPARISON_LABEL
      FROM ${getTableName('QRYRUN_COMPARISONS')} c
      JOIN ${getTableName('QRYRUN_TEST_RUNS')} br ON c.BASELINE_RUN_ID = br.RUN_ID
      JOIN ${getTableName('QRYRUN_TEST_RUNS')} cr ON c.COMPARISON_RUN_ID = cr.RUN_ID
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.baselineRunId) {
      sql += ` AND c.BASELINE_RUN_ID = ?`;
      params.push(filters.baselineRunId);
    }
    
    if (filters.comparisonRunId) {
      sql += ` AND c.COMPARISON_RUN_ID = ?`;
      params.push(filters.comparisonRunId);
    }
    
    if (filters.createdBy) {
      sql += ` AND c.CREATED_BY = ?`;
      params.push(filters.createdBy.toUpperCase());
    }
    
    sql += ` ORDER BY c.CREATED_AT DESC`;
    
    return await query(sql, params);
    
  } catch (error) {
    logger.error('Error finding comparisons:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve comparisons',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Update comparison statistics
 * @param {string} comparisonId - Comparison ID
 * @param {Object} stats - Statistics to update
 * @returns {Promise<boolean>} Success status
 */
async function updateStatistics(comparisonId, stats) {
  try {
    const sql = `
      UPDATE ${getTableName('QRYRUN_COMPARISONS')}
      SET 
        TOTAL_QUERIES_COMPARED = ?,
        QUERIES_WITH_DEVIATION = ?,
        QUERIES_IMPROVED = ?,
        QUERIES_DEGRADED = ?,
        AVG_BASELINE_TIME = ?,
        AVG_COMPARISON_TIME = ?,
        OVERALL_CHANGE_PERCENT = ?
      WHERE COMPARISON_ID = ?
    `;
    
    await query(sql, [
      stats.totalQueriesCompared || 0,
      stats.queriesWithDeviation || 0,
      stats.queriesImproved || 0,
      stats.queriesDegraded || 0,
      stats.avgBaselineTime || 0,
      stats.avgComparisonTime || 0,
      stats.overallChangePercent || 0,
      comparisonId,
    ]);
    
    logger.info('Comparison statistics updated:', { comparisonId, stats });
    return true;
    
  } catch (error) {
    logger.error('Error updating comparison statistics:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update comparison statistics',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Delete comparison
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(comparisonId) {
  const conn = await transaction();
  
  try {
    // Delete comparison details first
    const deleteDetailsSql = `
      DELETE FROM ${getTableName('QRYRUN_COMPARISON_DETAILS')}
      WHERE COMPARISON_ID = ?
    `;
    
    await conn.execute(deleteDetailsSql, [comparisonId]);
    
    // Delete comparison
    const deleteComparisonSql = `
      DELETE FROM ${getTableName('QRYRUN_COMPARISONS')}
      WHERE COMPARISON_ID = ?
    `;
    
    await conn.execute(deleteComparisonSql, [comparisonId]);
    
    await conn.commit();
    
    logger.info('Comparison deleted:', { comparisonId });
    return true;
    
  } catch (error) {
    await conn.rollback();
    logger.error('Error deleting comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete comparison',
      ERROR_CODES.DATABASE_ERROR
    );
  } finally {
    await conn.close();
  }
}

/**
 * Add comparison detail for a query
 * @param {Object} detailData - Comparison detail data
 * @returns {Promise<Object>} Created detail
 */
async function addDetail(detailData) {
  try {
    const {
      comparisonId,
      queryId,
      baselineAvgTime,
      comparisonAvgTime,
      timeDifference,
      percentChange,
      hasDeviation,
      isImprovement,
    } = detailData;
    
    const sql = `
      INSERT INTO ${getTableName('QRYRUN_COMPARISON_DETAILS')}
      (COMPARISON_ID, QUERY_ID, BASELINE_AVG_TIME, COMPARISON_AVG_TIME,
       TIME_DIFFERENCE, PERCENT_CHANGE, HAS_DEVIATION, IS_IMPROVEMENT)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      comparisonId,
      queryId,
      baselineAvgTime,
      comparisonAvgTime,
      timeDifference,
      percentChange,
      hasDeviation ? 1 : 0,
      isImprovement ? 1 : 0,
    ]);
    
    return detailData;
    
  } catch (error) {
    logger.error('Error adding comparison detail:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to add comparison detail',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Get comparison details for a comparison
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<Array>} Array of comparison details
 */
async function getDetails(comparisonId) {
  try {
    const sql = `
      SELECT 
        cd.COMPARISON_ID,
        cd.QUERY_ID,
        cd.BASELINE_AVG_TIME,
        cd.COMPARISON_AVG_TIME,
        cd.TIME_DIFFERENCE,
        cd.PERCENT_CHANGE,
        cd.HAS_DEVIATION,
        cd.IS_IMPROVEMENT,
        q.QUERY_TEXT,
        q.SEQUENCE_NUMBER,
        q.STATEMENT_TYPE
      FROM ${getTableName('QRYRUN_COMPARISON_DETAILS')} cd
      JOIN ${getTableName('QRYRUN_QUERIES')} q ON cd.QUERY_ID = q.QUERY_ID
      WHERE cd.COMPARISON_ID = ?
      ORDER BY q.SEQUENCE_NUMBER
    `;
    
    return await query(sql, [comparisonId]);
    
  } catch (error) {
    logger.error('Error getting comparison details:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve comparison details',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get queries with deviations
 * @param {string} comparisonId - Comparison ID
 * @returns {Promise<Array>} Array of queries with deviations
 */
async function getQueriesWithDeviations(comparisonId) {
  try {
    const sql = `
      SELECT 
        cd.QUERY_ID,
        cd.BASELINE_AVG_TIME,
        cd.COMPARISON_AVG_TIME,
        cd.TIME_DIFFERENCE,
        cd.PERCENT_CHANGE,
        cd.IS_IMPROVEMENT,
        q.QUERY_TEXT,
        q.SEQUENCE_NUMBER,
        q.STATEMENT_TYPE
      FROM ${getTableName('QRYRUN_COMPARISON_DETAILS')} cd
      JOIN ${getTableName('QRYRUN_QUERIES')} q ON cd.QUERY_ID = q.QUERY_ID
      WHERE cd.COMPARISON_ID = ? AND cd.HAS_DEVIATION = 1
      ORDER BY ABS(cd.PERCENT_CHANGE) DESC
    `;
    
    return await query(sql, [comparisonId]);
    
  } catch (error) {
    logger.error('Error getting queries with deviations:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve queries with deviations',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

module.exports = {
  create,
  findById,
  findAll,
  updateStatistics,
  remove,
  addDetail,
  getDetails,
  getQueriesWithDeviations,
};