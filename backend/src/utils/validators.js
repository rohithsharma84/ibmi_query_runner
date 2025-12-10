/**
 * Validation Utility Functions
 * Common validation functions used throughout the application
 */

const { METRICS_LEVELS, PLAN_CACHE_VIEWS } = require('../config/constants');

/**
 * Validate metrics level
 * @param {string} level - Metrics level to validate
 * @returns {boolean} True if valid
 */
function isValidMetricsLevel(level) {
  return Object.values(METRICS_LEVELS).includes(level);
}

/**
 * Validate plan cache view name
 * @param {string} view - View name to validate
 * @returns {boolean} True if valid
 */
function isValidPlanCacheView(view) {
  return Object.values(PLAN_CACHE_VIEWS).includes(view);
}

/**
 * Validate iteration count
 * @param {number} count - Iteration count
 * @param {number} max - Maximum allowed iterations
 * @returns {boolean} True if valid
 */
function isValidIterationCount(count, max = 100) {
  return Number.isInteger(count) && count > 0 && count <= max;
}

/**
 * Validate deviation threshold
 * @param {number} threshold - Threshold percentage
 * @returns {boolean} True if valid
 */
function isValidDeviationThreshold(threshold) {
  return typeof threshold === 'number' && threshold >= 0 && threshold <= 100;
}

/**
 * Validate IBM i user profile name
 * @param {string} userProfile - User profile name
 * @returns {boolean} True if valid
 */
function isValidUserProfile(userProfile) {
  // IBM i user profiles: 1-10 characters, alphanumeric, starts with letter
  const regex = /^[A-Z][A-Z0-9]{0,9}$/i;
  return regex.test(userProfile);
}

/**
 * Validate SQL query text
 * @param {string} queryText - SQL query text
 * @returns {boolean} True if valid
 */
function isValidQueryText(queryText) {
  return typeof queryText === 'string' && queryText.trim().length > 0;
}

/**
 * Validate date string (YYYY-MM-DD format)
 * @param {string} dateStr - Date string
 * @returns {boolean} True if valid
 */
function isValidDateString(dateStr) {
  if (!dateStr) return true; // Optional field
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email) return true; // Optional field
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sanitize SQL input to prevent injection
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeSqlInput(input) {
  if (typeof input !== 'string') return input;
  // Remove or escape potentially dangerous characters
  return input.replace(/['";\\]/g, '');
}

/**
 * Validate query set name
 * @param {string} name - Query set name
 * @returns {boolean} True if valid
 */
function isValidQuerySetName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
}

/**
 * Validate test run name
 * @param {string} name - Test run name
 * @returns {boolean} True if valid
 */
function isValidTestRunName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
}

module.exports = {
  isValidMetricsLevel,
  isValidPlanCacheView,
  isValidIterationCount,
  isValidDeviationThreshold,
  isValidUserProfile,
  isValidQueryText,
  isValidDateString,
  isValidEmail,
  sanitizeSqlInput,
  isValidQuerySetName,
  isValidTestRunName,
};