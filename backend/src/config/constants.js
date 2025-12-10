/**
 * Application Constants
 * Shared constants used throughout the application
 */

module.exports = {
  // Metrics levels
  METRICS_LEVELS: {
    BASIC: 'BASIC',
    STANDARD: 'STANDARD',
    COMPREHENSIVE: 'COMPREHENSIVE',
  },
  
  // Test run statuses
  RUN_STATUS: {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
  },
  
  // Execution statuses
  EXECUTION_STATUS: {
    RUNNING: 'RUNNING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
  },
  
  // Comparison statuses
  COMPARISON_STATUS: {
    IMPROVED: 'IMPROVED',
    DEGRADED: 'DEGRADED',
    UNCHANGED: 'UNCHANGED',
    FAILED: 'FAILED',
    NEW_FAILURE: 'NEW_FAILURE',
    RESOLVED: 'RESOLVED',
  },
  
  // Refresh statuses
  REFRESH_STATUS: {
    SUCCESS: 'SUCCESS',
    PARTIAL: 'PARTIAL',
    FAILED: 'FAILED',
  },
  
  // Plan cache views
  PLAN_CACHE_VIEWS: {
    PLAN_CACHE_INFO: 'PLAN_CACHE_INFO',
    PLAN_CACHE: 'PLAN_CACHE',
  },
  
  // Configuration types
  CONFIG_TYPES: {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    JSON: 'JSON',
  },
  
  // Default values
  DEFAULTS: {
    DEVIATION_THRESHOLD: 20.0,
    METRICS_LEVEL: 'STANDARD',
    ITERATION_COUNT: 1,
    MAX_ITERATIONS: 100,
    QUERY_TIMEOUT: 300, // seconds
  },
  
  // WebSocket events
  WS_EVENTS: {
    EXECUTION_STARTED: 'execution:started',
    EXECUTION_PROGRESS: 'execution:progress',
    EXECUTION_COMPLETED: 'execution:completed',
    EXECUTION_FAILED: 'execution:failed',
    QUERY_STARTED: 'query:started',
    QUERY_COMPLETED: 'query:completed',
    QUERY_FAILED: 'query:failed',
  },
  
  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  // Error codes
  ERROR_CODES: {
    DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    QUERY_EXECUTION_ERROR: 'QUERY_EXECUTION_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  },
};