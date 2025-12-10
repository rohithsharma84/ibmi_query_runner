/**
 * Database Configuration
 * Manages connection to Db2 for i using itoolkit
 */

require('dotenv').config();
const { Connection, CommandCall, Toolkit } = require('itoolkit');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  library: process.env.DB_LIBRARY || 'YOURLIB',
  port: parseInt(process.env.DB_PORT, 10) || 9471,
  secure: process.env.DB_SECURE === 'true',
};

/**
 * Create a connection to IBM i
 * @returns {Connection} itoolkit Connection object
 */
function createConnection() {
  const transportOptions = {
    host: config.host,
    username: config.user,
    password: config.password,
    port: config.port,
  };

  // Use SSH transport for secure connections
  const transport = config.secure ? 'ssh' : 'ssh';
  
  return new Connection({
    transport,
    transportOptions,
  });
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const connection = createConnection();
    
    // Replace YOURLIB placeholder with actual library
    let finalSql = sql.replace(/YOURLIB\./g, `${config.library}.`);
    
    // Handle parameterized queries
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        const value = typeof param === 'string' ? `'${param}'` : param;
        finalSql = finalSql.replace(placeholder, value);
      });
    }

    const toolkit = new Toolkit(connection);
    
    // Execute SQL using iSql
    toolkit.iSql(finalSql, (error, result) => {
      if (error) {
        console.error('Database query error:', error);
        return reject(new Error(`Failed to execute query: ${error.message}`));
      }
      
      try {
        // Parse XML result
        parseXML(result, (parseError, parsed) => {
          if (parseError) {
            return reject(new Error(`Failed to parse query result: ${parseError.message}`));
          }
          
          // Extract rows from parsed XML
          const rows = extractRows(parsed);
          resolve(rows);
        });
      } catch (err) {
        reject(new Error(`Error processing query result: ${err.message}`));
      }
    });
  });
}

/**
 * Extract rows from parsed XML result
 * @param {Object} parsed - Parsed XML object
 * @returns {Array} Array of row objects
 */
function extractRows(parsed) {
  try {
    if (!parsed || !parsed.myscript || !parsed.myscript.sql) {
      return [];
    }

    const sqlResult = parsed.myscript.sql[0];
    
    if (!sqlResult.row) {
      return [];
    }

    const rows = Array.isArray(sqlResult.row) ? sqlResult.row : [sqlResult.row];
    
    return rows.map(row => {
      const rowData = {};
      if (row.data) {
        row.data.forEach(field => {
          const fieldName = field.$.desc || field.$.name;
          const fieldValue = field._ || null;
          rowData[fieldName] = fieldValue;
        });
      }
      return rowData;
    });
  } catch (error) {
    console.error('Error extracting rows:', error);
    return [];
  }
}

/**
 * Execute a SQL query with a specific connection (for transactions)
 * Note: itoolkit handles connections differently, this is a wrapper for compatibility
 * @param {Object} connection - Not used with itoolkit, kept for API compatibility
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function queryWithConnection(connection, sql, params = []) {
  // For itoolkit, we just execute the query normally
  // Transactions are handled differently in IBM i
  return query(sql, params);
}

/**
 * Begin a transaction
 * Note: IBM i handles transactions at the job level
 * @returns {Promise<Object>} Connection object (for API compatibility)
 */
async function beginTransaction() {
  // Execute SET TRANSACTION ISOLATION LEVEL
  await query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  return { transactionStarted: true };
}

/**
 * Commit a transaction
 * @param {Object} connection - Connection object
 */
async function commit(connection) {
  await query('COMMIT');
}

/**
 * Rollback a transaction
 * @param {Object} connection - Connection object
 */
async function rollback(connection) {
  try {
    await query('ROLLBACK');
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

/**
 * Get a database connection from the pool
 * Note: itoolkit doesn't use connection pooling in the same way
 * This is kept for API compatibility
 * @returns {Promise<Object>} Connection object
 */
async function getConnection() {
  return { 
    execute: query,
    close: async () => { /* itoolkit handles connection cleanup */ }
  };
}

// Export a pool object for API compatibility
const pool = {
  connect: getConnection,
};

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