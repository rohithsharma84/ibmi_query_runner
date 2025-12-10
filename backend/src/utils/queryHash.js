/**
 * Query Hash Utility
 * Generate consistent hashes for SQL queries to detect duplicates
 */

const crypto = require('crypto');

/**
 * Normalize SQL query text for hashing
 * Removes extra whitespace, comments, and standardizes formatting
 * @param {string} queryText - SQL query text
 * @returns {string} Normalized query text
 */
function normalizeQuery(queryText) {
  if (!queryText) return '';
  
  return queryText
    // Remove SQL comments (-- style)
    .replace(/--[^\n]*/g, '')
    // Remove SQL comments (/* */ style)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Trim leading/trailing whitespace
    .trim()
    // Convert to uppercase for case-insensitive comparison
    .toUpperCase();
}

/**
 * Generate SHA-256 hash for a SQL query
 * @param {string} queryText - SQL query text
 * @returns {string} 64-character hex hash
 */
function generateQueryHash(queryText) {
  const normalized = normalizeQuery(queryText);
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Compare two queries for equality
 * @param {string} query1 - First query text
 * @param {string} query2 - Second query text
 * @returns {boolean} True if queries are equivalent
 */
function queriesEqual(query1, query2) {
  return generateQueryHash(query1) === generateQueryHash(query2);
}

module.exports = {
  normalizeQuery,
  generateQueryHash,
  queriesEqual,
};