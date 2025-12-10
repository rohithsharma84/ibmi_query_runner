/**
 * Database Configuration
 * Manages connection to Db2 for i using JDBC (node-jt400)
 */

require('dotenv').config();
const jt400 = require('node-jt400');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  library: process.env.DB_LIBRARY || 'YOURLIB',
  port: parseInt(process.env.DB_PORT, 10) || 9471,
  secure: process.env.DB_SECURE === 'true',
};

// Create connection pool
const pool = jt400.pool({
  host: config.host,
  user: config.user,
  password: config.password,
});

/**
 * Get a connection from the pool
 * @returns {Promise<Object>} Database connection
 */
async function getConnection() {
  // node-jt400 pool manages connections internally
  // Return a wrapper object with execute method for compatibility
  return {
    execute: async (sql, params = []) => {
      return pool.query(sql, params);
    },
    close: async () => {
      // Connection is managed by pool, nothing to close
    },
  };
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  try {
    // Replace YOURLIB placeholder with actual library
    let finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
    
    // Handle parameterized queries - node-jt400 uses ? placeholders
    const finalParams = params || [];
    
    // Use pool.query directly - it handles connections automatically
    const result = await pool.query(finalSql, finalParams);
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Failed to execute query: ${error.message}`);
  }
}

/**
 * Execute a SQL query with a specific connection (for transactions)
 * @param {Object} connection - Database connection
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function queryWithConnection(connection, sql, params = []) {
  // Replace YOURLIB placeholder with actual library
  let finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
  return connection.execute(finalSql, params);
}

/**
 * Begin a transaction
 * @returns {Promise<Object>} Transaction connection object
 */
async function beginTransaction() {
  // Return a transaction wrapper that node-jt400 pool.transaction() expects
  let transactionCallback;
  const transactionPromise = new Promise((resolve) => {
    transactionCallback = resolve;
  });
  
  return {
    execute: async (sql, params = []) => {
      const finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
      return pool.query(finalSql, params);
    },
    commit: async () => {
      // Commit handled by pool.transaction
    },
    rollback: async () => {
      // Rollback handled by pool.transaction
    },
    close: async () => {
      // Connection cleanup handled by pool
    },
  };
}

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  // If no callback, return a transaction connection object
  if (!callback) {
    return beginTransaction();
  }
  
  // Otherwise, use pool.transaction with callback
  return pool.transaction(callback);
}

/**
 * Commit a transaction
 * @param {Object} connection - Connection object
 */
async function commit(connection) {
  // In node-jt400 v6, transactions auto-commit on success
  // This is kept for API compatibility
}

/**
 * Rollback a transaction
 * @param {Object} connection - Connection object
 */
async function rollback(connection) {
  // In node-jt400 v6, transactions auto-rollback on error
  // This is kept for API compatibility
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const result = await query('SELECT 1 AS TEST FROM SYSIBM.SYSDUMMY1');
    return result && result.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get table name with library prefix
 * @param {string} tableName - Table name without library
 * @returns {string} Fully qualified table name
 */
function getTableName(tableName) {
  return `${config.library}.${tableName}`;
}

module.exports = {
  config,
  pool,
  getConnection,
  query,
  queryWithConnection,
  beginTransaction,
  transaction,
  commit,
  rollback,
  testConnection,
  getTableName,
};