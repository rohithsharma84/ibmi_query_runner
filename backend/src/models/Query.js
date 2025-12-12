/**
 * Query Model
 * Handles database operations for individual queries within query sets
 */

const { query, getTableName } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { generateQueryHash } = require('../utils/queryHash');
const logger = require('../utils/logger');

/**
 * Find query by ID
 * @param {string} queryId - Query ID
 * @returns {Promise<Object|null>} Query or null
 */
async function findById(queryId) {
  try {
    const sql = `
      SELECT 
        QUERY_ID,
        SET_ID,
        QUERY_TEXT,
        QUERY_HASH,
        SEQUENCE_NUM AS SEQUENCE_NUMBER,
        QUERY_NAME AS STATEMENT_TYPE,
        SOURCE_USER AS ORIGINAL_USER,
        0 AS ORIGINAL_RUN_COUNT,
        ADDED_AT,
        IS_ACTIVE
      FROM ${getTableName('QRYRUN_QUERIES')}
      WHERE QUERY_ID = ? AND IS_ACTIVE = 'Y'
    `;
    
    const results = await query(sql, [queryId]);
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    logger.error('Error finding query:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to find query',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Update query
 * @param {string} queryId - Query ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
async function update(queryId, updates) {
  try {
    // Map public field names to actual DB columns
    const fieldMap = {
      QUERY_TEXT: 'QUERY_TEXT',
      SEQUENCE_NUMBER: 'SEQUENCE_NUM'
    };
    const allowedFields = Object.keys(fieldMap);
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        const dbCol = fieldMap[key];
        setClauses.push(`${dbCol} = ?`);

        // If updating query text, also update hash
        if (key === 'QUERY_TEXT') {
          params.push(value);
          setClauses.push('QUERY_HASH = ?');
          params.push(generateQueryHash(value));
        } else {
          params.push(value);
        }
      }
    }
    
    if (setClauses.length === 0) {
      return false;
    }
    
    params.push(queryId);
    
    const sql = `
      UPDATE ${getTableName('QRYRUN_QUERIES')}
      SET ${setClauses.join(', ')}
      WHERE QUERY_ID = ? AND IS_ACTIVE = 'Y'
    `;
    
    await query(sql, params);
    
    logger.info('Query updated:', { queryId, updates });
    return true;
    
  } catch (error) {
    logger.error('Error updating query:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update query',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Delete query (soft delete)
 * @param {string} queryId - Query ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(queryId) {
  try {
    const { transaction } = require('../config/database');
    // Use a single-connection transactional callback to avoid cursor/handle issues
    await transaction(async (conn) => {
      const sql = `
        UPDATE ${getTableName('QRYRUN_QUERIES')}
        SET IS_ACTIVE = 'N'
        WHERE QUERY_ID = ?
      `;
      await conn.execute(sql, [queryId]);
    });

    logger.info('Query deleted:', { queryId });
    return true;
    
  } catch (error) {
    logger.error('Error deleting query:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete query',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Reorder queries in a set
 * @param {string} setId - Query set ID
 * @param {Array} queryOrder - Array of query IDs in desired order
 * @returns {Promise<boolean>} Success status
 */
async function reorder(setId, queryOrder) {
  try {
    // Update sequence numbers for each query
    for (let i = 0; i < queryOrder.length; i++) {
      const sql = `
        UPDATE ${getTableName('QRYRUN_QUERIES')}
        SET SEQUENCE_NUM = ?
        WHERE QUERY_ID = ? AND SET_ID = ? AND IS_ACTIVE = 'Y'
      `;
      
      await query(sql, [i + 1, queryOrder[i], setId]);
    }
    
    logger.info('Queries reordered:', { setId, count: queryOrder.length });
    return true;
    
  } catch (error) {
    logger.error('Error reordering queries:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reorder queries',
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Add a single query to a set
 * @param {string} setId - Query set ID
 * @param {Object} queryData - Query data
 * @returns {Promise<Object>} Created query
 */
async function addToSet(setId, queryData) {
  try {
    const { queryText, statementType, sequenceNumber } = queryData;
    const queryHash = generateQueryHash(queryText);
    
    // Check if query already exists in this set
    const checkSql = `
      SELECT QUERY_ID FROM ${getTableName('QRYRUN_QUERIES')}
  WHERE SET_ID = ? AND QUERY_HASH = ? AND IS_ACTIVE = 'Y'
    `;
    
    const existing = await query(checkSql, [setId, queryHash]);
    
    if (existing.length > 0) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Query already exists in this set',
        ERROR_CODES.DUPLICATE_ENTRY
      );
    }
    
    // Get next sequence number if not provided
    let seqNum = sequenceNumber;
    if (!seqNum) {
      // Use correct DB column name SEQUENCE_NUM
      const maxSeqSql = `
        SELECT COALESCE(MAX(SEQUENCE_NUM), 0) AS MAX_SEQ
        FROM ${getTableName('QRYRUN_QUERIES')}
        WHERE SET_ID = ? AND IS_ACTIVE = 'Y'
      `;

      const maxSeqResult = await query(maxSeqSql, [setId]);
      seqNum = (maxSeqResult?.[0]?.MAX_SEQ || 0) + 1;
    }
    
    // Insert query and retrieve generated identity using FINAL TABLE
    const insertSql = `
      SELECT QUERY_ID FROM FINAL TABLE (
        INSERT INTO ${getTableName('QRYRUN_QUERIES')}
        (SET_ID, QUERY_TEXT, QUERY_NAME, QUERY_HASH, SOURCE_USER, PLAN_CACHE_KEY, ADDED_AT, LAST_SEEN_IN_CACHE, IS_ACTIVE, SEQUENCE_NUM)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, 'Y', ?)
      )
    `;

    const insertRes = await query(insertSql, [
      setId,
      queryText,
      queryData.queryName || queryData.QUERY_NAME || statementType || 'UNKNOWN',
      queryHash,
      queryData.userName || queryData.USER_NAME || null,
      queryData.planCacheKey || queryData.PLAN_CACHE_KEY || null,
      seqNum,
    ]);

    const queryId = insertRes?.[0]?.QUERY_ID;
    logger.info('Query added to set:', { queryId, setId });
    
    return {
      queryId,
      setId,
      queryText,
      queryHash,
      sequenceNumber: seqNum,
      statementType: statementType || 'UNKNOWN',
    };
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error adding query to set:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to add query to set',
      ERROR_CODES.DATABASE_ERROR,
      error.message
    );
  }
}

module.exports = {
  findById,
  update,
  remove,
  reorder,
  addToSet,
};