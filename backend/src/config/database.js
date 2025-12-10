/**
 * Database Configuration
 * Manages connection to Db2 for i using node-jt400
 */

require('dotenv').config();
const jt400 = require('node-jt400');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  library: process.env.DB_LIBRARY || 'YOURLIB',
  port: parseInt(process.env.DB_PORT, 10) || 8471,
};

// Create connection pool
const pool = jt400.pool({
  host: config.host,
  user: config.user,
  password: config.password,
});

/**
 * Get a database connection from the pool
 * @returns {Promise<Object>} Database connection
 */
async function getConnection() {
  try {
    return await pool.connect();
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  const connection = await getConnection();
  try {
    // Replace YOURLIB placeholder with actual library
    const finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
    return await connection.execute(finalSql, params);
  } finally {
    if (connection) {
      await connection.close();
    }
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
  const finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
  return await connection.execute(finalSql, params);
}

/**
 * Begin a transaction
 * @returns {Promise<Object>} Database connection with transaction started
 */
async function beginTransaction() {
  const connection = await getConnection();
  await connection.execute('BEGIN TRANSACTION');
  return connection;
}

/**
 * Commit a transaction
 * @param {Object} connection - Database connection
 */
async function commit(connection) {
  await connection.execute('COMMIT');
  await connection.close();
}

/**
 * Rollback a transaction
 * @param {Object} connection - Database connection
 */
async function rollback(connection) {
  try {
    await connection.execute('ROLLBACK');
  } finally {
    await connection.close();
  }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const result = await query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
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
  commit,
  rollback,
  testConnection,
  getTableName,
};