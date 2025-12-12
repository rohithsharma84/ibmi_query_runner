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
  try {
    const { baselineRunId, comparisonRunId, deviationThreshold, createdBy } = comparisonData;

    const result = await transaction(async (conn) => {
      // Use FINAL TABLE INSERT to reliably get identity
      const insertSelectSql = `
        SELECT COMPARISON_ID
          FROM FINAL TABLE (
            INSERT INTO ${getTableName('QRYRUN_COMPARISONS')}
              (BASELINE_RUN_ID, COMPARISON_RUN_ID, DEVIATION_THRESHOLD, CREATED_BY, CREATED_AT)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          )
      `;

      let rows = await conn.execute(insertSelectSql, [
        baselineRunId,
        comparisonRunId,
        deviationThreshold,
        createdBy.toUpperCase(),
      ]);

      // Materialize jt400 results if a handle is returned
      try {
        if (rows && typeof rows.asArray === 'function') {
          rows = await rows.asArray();
        } else if (rows && typeof rows.asObjectStream === 'function') {
          const arr = [];
          for await (const obj of rows.asObjectStream()) arr.push(obj);
          rows = arr;
        }
      } catch {}

      let comparisonId = null;
      if (Array.isArray(rows) && rows.length > 0) {
        const r = rows[0];
        comparisonId = r.COMPARISON_ID ?? r.comparison_id ?? r.Id ?? r[Object.keys(r)[0]] ?? null;
        const numeric = Number(comparisonId);
        comparisonId = Number.isFinite(numeric) ? numeric : comparisonId;
      }

      return { comparisonId };
    });

    logger.info('Comparison created:', {
      comparisonId: result.comparisonId,
      baselineRunId,
      comparisonRunId,
    });

    return {
      comparisonId: result.comparisonId,
      baselineRunId,
      comparisonRunId,
      deviationThreshold,
      createdBy: createdBy.toUpperCase(),
    };
  } catch (error) {
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
        SET_LEVEL_CHANGE AS OVERALL_CHANGE_PERCENT,
        SET_LEVEL_CHANGE AS AVG_DURATION_CHANGE,
        QUERIES_ANALYZED AS TOTAL_QUERIES,
        QUERIES_ANALYZED AS TOTAL_QUERIES_COMPARED,
        QUERIES_IMPROVED AS QUERIES_IMPROVED,
        QUERIES_DEGRADED AS QUERIES_DEGRADED,
        QUERIES_UNCHANGED AS QUERIES_UNCHANGED,
        QUERIES_FAILED_BASELINE AS QUERIES_FAILED_BASELINE,
        QUERIES_FAILED_COMPARISON AS QUERIES_FAILED_COMPARISON,
        (COALESCE(QUERIES_IMPROVED,0) + COALESCE(QUERIES_DEGRADED,0)) AS QUERIES_WITH_DEVIATIONS,
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
        c.SET_LEVEL_CHANGE AS OVERALL_CHANGE_PERCENT,
        c.SET_LEVEL_CHANGE AS AVG_DURATION_CHANGE,
        c.QUERIES_ANALYZED AS TOTAL_QUERIES,
        c.QUERIES_ANALYZED AS TOTAL_QUERIES_COMPARED,
        c.QUERIES_IMPROVED AS QUERIES_IMPROVED,
        c.QUERIES_DEGRADED AS QUERIES_DEGRADED,
        c.QUERIES_UNCHANGED AS QUERIES_UNCHANGED,
        c.QUERIES_FAILED_BASELINE AS QUERIES_FAILED_BASELINE,
        c.QUERIES_FAILED_COMPARISON AS QUERIES_FAILED_COMPARISON,
        (COALESCE(c.QUERIES_IMPROVED,0) + COALESCE(c.QUERIES_DEGRADED,0)) AS QUERIES_WITH_DEVIATIONS,
        c.CREATED_BY,
        c.CREATED_AT,
        br.RUN_NAME AS BASELINE_RUN_NAME,
        cr.RUN_NAME AS COMPARISON_RUN_NAME
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
        SET_LEVEL_CHANGE = ?,
        QUERIES_ANALYZED = ?,
        QUERIES_IMPROVED = ?,
        QUERIES_DEGRADED = ?,
        QUERIES_UNCHANGED = ?,
        QUERIES_FAILED_BASELINE = ?,
        QUERIES_FAILED_COMPARISON = ?
      WHERE COMPARISON_ID = ?
    `;

    await query(sql, [
      stats.setLevelChange || null,
      stats.totalQueriesCompared || 0,
      stats.queriesImproved || 0,
      stats.queriesDegraded || 0,
      stats.queriesUnchanged || 0,
      stats.queriesFailedBaseline || 0,
      stats.queriesFailedComparison || 0,
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
  try {
    const ok = await transaction(async (conn) => {
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

      return true;
    });

    logger.info('Comparison deleted:', { comparisonId });
    return ok;
  } catch (error) {
    logger.error('Error deleting comparison:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete comparison',
      ERROR_CODES.DATABASE_ERROR
    );
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
      baselineMin,
      comparisonMin,
      baselineMax,
      comparisonMax,
      percentChange,
      hasDeviation,
      isImprovement,
      baselineFailures,
      comparisonFailures,
    } = detailData;

    const status = isImprovement ? 'IMPROVED' : (hasDeviation ? 'DEGRADED' : 'UNCHANGED');

    const sql = `
      INSERT INTO ${getTableName('QRYRUN_COMPARISON_DETAILS')}
      (COMPARISON_ID, QUERY_ID, BASELINE_AVG_MS, COMPARISON_AVG_MS,
       BASELINE_MIN_MS, COMPARISON_MIN_MS, BASELINE_MAX_MS, COMPARISON_MAX_MS,
       PERCENT_CHANGE, STATUS, BASELINE_FAILURES, COMPARISON_FAILURES)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      comparisonId,
      queryId,
      baselineAvgTime || null,
      comparisonAvgTime || null,
      baselineMin || null,
      comparisonMin || null,
      baselineMax || null,
      comparisonMax || null,
      percentChange || null,
      status,
      baselineFailures || 0,
      comparisonFailures || 0,
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
  cd.BASELINE_AVG_MS AS BASELINE_AVG_DURATION,
  cd.COMPARISON_AVG_MS AS COMPARISON_AVG_DURATION,
  cd.BASELINE_MIN_MS AS BASELINE_MIN_DURATION,
  cd.COMPARISON_MIN_MS AS COMPARISON_MIN_DURATION,
  cd.BASELINE_MAX_MS AS BASELINE_MAX_DURATION,
  cd.COMPARISON_MAX_MS AS COMPARISON_MAX_DURATION,
        cd.PERCENT_CHANGE AS PERCENT_CHANGE,
        cd.STATUS AS STATUS,
        cd.BASELINE_FAILURES AS BASELINE_FAILURES,
        cd.COMPARISON_FAILURES AS COMPARISON_FAILURES,
        q.QUERY_TEXT,
        q.SEQUENCE_NUM AS SEQUENCE_NUMBER,
        NULL AS STATEMENT_TYPE
      FROM ${getTableName('QRYRUN_COMPARISON_DETAILS')} cd
      JOIN ${getTableName('QRYRUN_QUERIES')} q ON cd.QUERY_ID = q.QUERY_ID
      WHERE cd.COMPARISON_ID = ?
      ORDER BY q.SEQUENCE_NUM
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
        cd.PERCENT_CHANGE AS PERCENT_CHANGE,
        cd.STATUS AS STATUS,
        q.QUERY_TEXT,
        q.SEQUENCE_NUM AS SEQUENCE_NUMBER,
        NULL AS STATEMENT_TYPE,
        cd.BASELINE_AVG_MS AS BASELINE_AVG_DURATION,
        cd.COMPARISON_AVG_MS AS COMPARISON_AVG_DURATION
      FROM ${getTableName('QRYRUN_COMPARISON_DETAILS')} cd
      JOIN ${getTableName('QRYRUN_QUERIES')} q ON cd.QUERY_ID = q.QUERY_ID
      WHERE cd.COMPARISON_ID = ? AND cd.STATUS <> 'UNCHANGED'
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