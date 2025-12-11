/**
 * QuerySet Model
 * Handles database operations for query sets
 */

const { query, getTableName, transaction } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { generateQueryHash } = require('../utils/queryHash');
const logger = require('../utils/logger');

/**
 * Create a new query set
 * @param {Object} setData - Query set data
 * @param {string} setData.setName - Name of the query set
 * @param {string} setData.description - Description
 * @param {string} setData.userProfile - User profile queries were imported from
 * @param {string} setData.createdBy - User who created the set
 * @param {Array} queries - Array of query objects to add
 * @returns {Promise<Object>} Created query set with ID
 */
async function create(setData, queries = []) {
  try {
    // Use pool.transaction(callback) via transaction(callback) so all statements
    // run on the same connection and transaction is handled by the pool.
    const result = await transaction(async (conn) => {
      const { setName, description, userProfile, createdBy, importDateFrom, importDateTo, planCacheView, additionalFilters } = setData;

      // Use a sensible default for planCacheView if not provided
      const { PLAN_CACHE_VIEWS } = require('../config/constants');
      const effectiveView = planCacheView || PLAN_CACHE_VIEWS.PLAN_CACHE_INFO;

      // Insert query set (SET_ID is an IDENTITY column, let the DB generate it)
      const insertSetSql = `
        INSERT INTO ${getTableName('QRYRUN_QUERY_SETS')}
        (SET_NAME, SET_DESCRIPTION, SOURCE_USER_PROFILE, IMPORT_DATE_FROM, IMPORT_DATE_TO, PLAN_CACHE_VIEW, ADDITIONAL_FILTERS, CREATED_BY, CREATED_AT, IS_ACTIVE, QUERY_COUNT)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Y', 0)
      `;

      await conn.execute(insertSetSql, [
        setName,
        description || null,
        userProfile.toUpperCase(),
        importDateFrom || null,
        importDateTo || null,
        effectiveView,
        additionalFilters || null,
        createdBy.toUpperCase(),
      ]);

      // Retrieve the generated SET_ID (IDENTITY) on the same connection
      const idRes = await conn.execute("SELECT IDENTITY_VAL_LOCAL() AS SET_ID FROM SYSIBM.SYSDUMMY1");
      // Debug: log raw identity result to diagnose driver behavior
      logger.debug('QuerySet.create identity raw result', { idRes });
      // Dump the keys returned by the driver result (debug-only)
      try {
        const idResKeys = Object.keys(idRes || {});
        logger.debug('QuerySet.create identity keys', { idResKeys });
      } catch (keyErr) {
        logger.debug('QuerySet.create identity keys error', { error: keyErr.message });
      }

      // node-jt400 / driver may return column keys in different cases or shapes; handle several variants
      let setId = null;
      if (idRes && idRes.length > 0) {
        const idRow = idRes[0];
        logger.debug('QuerySet.create identity row', { idRow });
        setId = idRow.SET_ID ?? idRow.Set_Id ?? idRow.set_id ?? idRow['IDENTITY_VAL_LOCAL()'] ?? idRow.IDENTITY_VAL_LOCAL ?? idRow.ID ?? idRow[Object.keys(idRow)[0]];
        if (setId !== null && setId !== undefined) {
          // coerce to number when possible
          const numeric = Number(setId);
          setId = Number.isFinite(numeric) ? numeric : setId;
        }
      }

      // Fallback: if identity was not returned, try to look up the row by unique combination
      if (setId === null || setId === undefined) {
        try {
          const fallbackSql = `SELECT SET_ID FROM ${getTableName('QRYRUN_QUERY_SETS')} WHERE SET_NAME = ? AND CREATED_BY = ? ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`;
          const fallbackRes = await conn.execute(fallbackSql, [setName, createdBy.toUpperCase()]);
          logger.debug('QuerySet.create fallback raw result', { fallbackRes });
          // Dump the keys returned by the fallback result (debug-only)
          try {
            const fallbackKeys = Object.keys(fallbackRes || {});
            logger.debug('QuerySet.create fallback keys', { fallbackKeys });
          } catch (fkErr) {
            logger.debug('QuerySet.create fallback keys error', { error: fkErr.message });
          }
          if (fallbackRes && fallbackRes.length > 0) {
            const r = fallbackRes[0];
            logger.debug('QuerySet.create fallback row', { fallbackRow: r });
            setId = r.SET_ID ?? r.set_id ?? r.Set_Id ?? r.ID ?? r[Object.keys(r)[0]] ?? null;
            const numeric = Number(setId);
            setId = Number.isFinite(numeric) ? numeric : setId;
          }
        } catch (fbErr) {
          // ignore fallback errors here; we'll let the main flow return without id if unavoidable
          logger.warn('Fallback lookup for SET_ID failed', { error: fbErr.message });
        }
      }

      // Add queries if provided
      if (queries && queries.length > 0) {
        await addQueriesToSet(conn, setId, queries);
      }

      logger.info('Query set created:', { setId, setName, queryCount: queries.length });

      return {
        setId,
        setName,
        description,
        userProfile: userProfile.toUpperCase(),
        createdBy: createdBy.toUpperCase(),
        importDateFrom: importDateFrom || null,
        importDateTo: importDateTo || null,
        planCacheView: effectiveView,
        additionalFilters: additionalFilters || null,
        queryCount: queries.length,
      };
    });

    return result;
  } catch (error) {
    logger.error('Error creating query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create query set',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

/**
 * Add queries to a query set
 * @param {Object} conn - Database connection
 * @param {string} setId - Query set ID
 * @param {Array} queries - Array of query objects
 * @returns {Promise<number>} Number of queries added
 */
async function addQueriesToSet(conn, setId, queries) {
  let addedCount = 0;
  
  for (let i = 0; i < queries.length; i++) {
    const queryObj = queries[i];
    const queryText = queryObj.statementText || queryObj.STATEMENT_TEXT;
    const queryHash = generateQueryHash(queryText);
    
    // Check if query already exists in this set
    const checkSql = `
      SELECT QUERY_ID FROM ${getTableName('QRYRUN_QUERIES')}
      WHERE SET_ID = ? AND QUERY_HASH = ? AND IS_ACTIVE = 1
    `;
    
    const existing = await conn.execute(checkSql, [setId, queryHash]);
    
    if (existing.length === 0) {
      // Generate unique query ID
      const queryId = `Q${Date.now()}${i}`;

      // Insert query (map fields to DB schema)
      const insertQuerySql = `
        INSERT INTO ${getTableName('QRYRUN_QUERIES')}
        (QUERY_ID, SET_ID, QUERY_TEXT, QUERY_NAME, QUERY_HASH, SOURCE_USER, PLAN_CACHE_KEY, ADDED_AT, LAST_SEEN_IN_CACHE, IS_ACTIVE, SEQUENCE_NUM)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, 'Y', ?)
      `;

      await conn.execute(insertQuerySql, [
        queryId,
        setId,
        queryText,
        queryObj.queryName || queryObj.QUERY_NAME || null,
        queryHash,
        queryObj.userName || queryObj.USER_NAME || null,
        queryObj.planCacheKey || queryObj.PLAN_CACHE_KEY || null,
        i + 1,
      ]);
      
      addedCount++;
    }
  }
  
  return addedCount;
}

/**
 * Find query set by ID
 * @param {string} setId - Query set ID
 * @returns {Promise<Object|null>} Query set or null
 */
async function findById(setId) {
  try {
    const sql = `
      SELECT 
        SET_ID ,
        SET_NAME,
        SET_DESCRIPTION AS description,
        SOURCE_USER_PROFILE AS user_profile,
        CREATED_BY ,
        CREATED_AT ,
        LAST_REFRESHED AS last_refreshed_at,
        IS_ACTIVE 
      FROM ${getTableName('QRYRUN_QUERY_SETS')}
      WHERE SET_ID = ? AND IS_ACTIVE = 'Y'
    `;
  logger.debug('QuerySet.findById SQL', { sql: sql.replace(/\s+/g, ' ').trim(), setId });
  const results = await query(sql, [setId]);
  logger.debug('QuerySet.findById result count', { setId, count: Array.isArray(results) ? results.length : 0 });
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    logger.error('Error finding query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find query set',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get all query sets
 * @param {Object} filters - Optional filters
 * @param {string} filters.userProfile - Filter by user profile
 * @param {string} filters.createdBy - Filter by creator
 * @returns {Promise<Array>} Array of query sets
 */
async function findAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        qs.SET_ID,
        qs.SET_NAME,
        qs.SET_DESCRIPTION,
        qs.SOURCE_USER_PROFILE,
        qs.CREATED_BY,
        qs.CREATED_AT,
        qs.LAST_REFRESHED,
        COUNT(q.QUERY_ID) AS query_count
      FROM ${getTableName('QRYRUN_QUERY_SETS')} qs
      LEFT JOIN ${getTableName('QRYRUN_QUERIES')} q 
        ON qs.SET_ID = q.SET_ID AND q.IS_ACTIVE = 'Y'
      WHERE qs.IS_ACTIVE = 'Y'
    `;
    
    const params = [];
    
    if (filters.userProfile) {
      sql += ` AND qs.USER_PROFILE = ?`;
      params.push(filters.userProfile.toUpperCase());
    }
    
    if (filters.createdBy) {
      sql += ` AND qs.CREATED_BY = ?`;
      params.push(filters.createdBy.toUpperCase());
    }
    
    sql += `
      GROUP BY qs.SET_ID, qs.SET_NAME, qs.SET_DESCRIPTION, qs.SOURCE_USER_PROFILE, 
               qs.CREATED_BY, qs.CREATED_AT, qs.LAST_REFRESHED
      ORDER BY qs.CREATED_AT DESC
    `;
    
    return await query(sql, params);
    
  } catch (error) {
    logger.error('Error finding query sets:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve query sets',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Get queries in a query set
 * @param {string} setId - Query set ID
 * @returns {Promise<Array>} Array of queries
 */
async function getQueries(setId) {
  try {
    const sql = `
      SELECT 
        QUERY_ID,
        SET_ID,
        QUERY_TEXT,
        QUERY_HASH,
        SEQUENCE_NUM AS SEQUENCE_NUMBER,
        QUERY_NAME,
        SOURCE_USER AS ORIGINAL_USER,
        0 AS ORIGINAL_RUN_COUNT,
        ADDED_AT
      FROM ${getTableName('QRYRUN_QUERIES')}
      WHERE SET_ID = ? AND IS_ACTIVE = 1
      ORDER BY SEQUENCE_NUMBER
    `;
    
    return await query(sql, [setId]);
    
  } catch (error) {
    logger.error('Error getting queries for set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve queries',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Update query set
 * @param {string} setId - Query set ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
async function update(setId, updates) {
  try {
    const allowedFields = ['SET_NAME', 'DESCRIPTION'];
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (setClauses.length === 0) {
      return false;
    }
    
    params.push(setId);
    
    const sql = `
      UPDATE ${getTableName('QRYRUN_QUERY_SETS')}
      SET ${setClauses.join(', ')}
      WHERE SET_ID = ? AND IS_ACTIVE = 1
    `;
    
    await query(sql, params);
    
    logger.info('Query set updated:', { setId, updates });
    return true;
    
  } catch (error) {
    logger.error('Error updating query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update query set',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Delete query set (soft delete)
 * @param {string} setId - Query set ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(setId) {
  const conn = await transaction();
  
  try {
    // Soft delete query set
    const deleteSetSql = `
      UPDATE ${getTableName('QRYRUN_QUERY_SETS')}
      SET IS_ACTIVE = 0
      WHERE SET_ID = ?
    `;
    
    await conn.execute(deleteSetSql, [setId]);
    
    // Soft delete all queries in the set
    const deleteQueriesSql = `
      UPDATE ${getTableName('QRYRUN_QUERIES')}
      SET IS_ACTIVE = 0
      WHERE SET_ID = ?
    `;
    
    await conn.execute(deleteQueriesSql, [setId]);
    
    await conn.commit();
    
    logger.info('Query set deleted:', { setId });
    return true;
    
  } catch (error) {
    await conn.rollback();
    logger.error('Error deleting query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete query set',
      ERROR_CODES.DATABASE_ERROR
    );
  } finally {
    await conn.close();
  }
}

/**
 * Refresh query set from plan cache
 * @param {string} setId - Query set ID
 * @param {Array} newQueries - New queries from plan cache
 * @returns {Promise<Object>} Refresh statistics
 */
async function refresh(setId, newQueries) {
  const conn = await transaction();
  
  try {
    // Get existing queries
    const existingQueriesSql = `
      SELECT QUERY_ID, QUERY_HASH, QUERY_TEXT
      FROM ${getTableName('QRYRUN_QUERIES')}
      WHERE SET_ID = ? AND IS_ACTIVE = 1
    `;
    
    const existingQueries = await conn.execute(existingQueriesSql, [setId]);
    const existingHashes = new Set(existingQueries.map(q => q.QUERY_HASH));
    
    // Process new queries
    const newHashes = new Set();
    const queriesToAdd = [];
    
    for (const queryObj of newQueries) {
      const queryText = queryObj.statementText || queryObj.STATEMENT_TEXT;
      const queryHash = generateQueryHash(queryText);
      newHashes.add(queryHash);
      
      if (!existingHashes.has(queryHash)) {
        queriesToAdd.push(queryObj);
      }
    }
    
    // Find queries to deactivate (no longer in plan cache)
    const hashesToDeactivate = [...existingHashes].filter(h => !newHashes.has(h));
    
    let deactivatedCount = 0;
    if (hashesToDeactivate.length > 0) {
      const deactivateSql = `
        UPDATE ${getTableName('QRYRUN_QUERIES')}
        SET IS_ACTIVE = 0
        WHERE SET_ID = ? AND QUERY_HASH = ?
      `;
      
      for (const hash of hashesToDeactivate) {
        await conn.execute(deactivateSql, [setId, hash]);
        deactivatedCount++;
      }
    }
    
    // Add new queries
    const addedCount = await addQueriesToSet(conn, setId, queriesToAdd);
    
    // Update last refreshed timestamp
    const updateSetSql = `
      UPDATE ${getTableName('QRYRUN_QUERY_SETS')}
      SET LAST_REFRESHED_AT = CURRENT_TIMESTAMP
      WHERE SET_ID = ?
    `;
    
    await conn.execute(updateSetSql, [setId]);
    
    // Log refresh operation
    const logSql = `
      INSERT INTO ${getTableName('QRYRUN_SET_REFRESH_LOG')}
      (SET_ID, REFRESHED_AT, QUERIES_ADDED, QUERIES_REMOVED)
      VALUES (?, CURRENT_TIMESTAMP, ?, ?)
    `;
    
    await conn.execute(logSql, [setId, addedCount, deactivatedCount]);
    
    await conn.commit();
    
    logger.info('Query set refreshed:', { 
      setId, 
      addedCount, 
      deactivatedCount,
      totalQueries: existingQueries.length - deactivatedCount + addedCount,
    });
    
    return {
      success: true,
      addedCount,
      deactivatedCount,
      totalQueries: existingQueries.length - deactivatedCount + addedCount,
    };
    
  } catch (error) {
    await conn.rollback();
    logger.error('Error refreshing query set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to refresh query set',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  } finally {
    await conn.close();
  }
}

module.exports = {
  create,
  findById,
  findAll,
  getQueries,
  update,
  remove,
  refresh,
};