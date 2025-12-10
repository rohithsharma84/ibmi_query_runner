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
  return pool.connect();
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  let connection;
  try {
    // Replace YOURLIB placeholder with actual library
    let finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
    
    // Handle parameterized queries
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
        finalSql = finalSql.replace(placeholder, value);
      });
    }

    connection = await getConnection();
    const result = await connection.execute(finalSql);
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Failed to execute query: ${error.message}`);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
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
  return connection.execute(sql, params);
}

/**
 * Begin a transaction
 * @returns {Promise<Object>} Connection object
 */
async function beginTransaction() {
  const connection = await getConnection();
  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  return connection;
}

/**
 * Commit a transaction
 * @param {Object} connection - Connection object
 */
async function commit(connection) {
  try {
    await connection.execute('COMMIT');
    await connection.close();
  } catch (error) {
    console.error('Commit error:', error);
    throw error;
  }
}

/**
 * Rollback a transaction
 * @param {Object} connection - Connection object
 */
async function rollback(connection) {
  try {
    await connection.execute('ROLLBACK');
    await connection.close();
  } catch (error) {
    console.error('Rollback error:', error);
  }
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
  commit,
  rollback,
  testConnection,
  getTableName,
};