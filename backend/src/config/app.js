/**
 * Application Configuration
 * Central configuration for the application
 */

require('dotenv').config();

module.exports = {
  // Server configuration
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // Installation paths
  installRoot: process.env.INSTALL_ROOT || '/opt/ibmi-query-runner',
  logsPath: process.env.INSTALL_ROOT ? `${process.env.INSTALL_ROOT}/logs` : './logs',
  
  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  // Query execution
  queryExecution: {
    defaultTimeout: parseInt(process.env.DEFAULT_QUERY_TIMEOUT, 10) || 300, // seconds
    maxParallelQueries: parseInt(process.env.MAX_PARALLEL_QUERIES, 10) || 5,
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // WebSocket
  wsPort: parseInt(process.env.WS_PORT, 10) || 3001,
};