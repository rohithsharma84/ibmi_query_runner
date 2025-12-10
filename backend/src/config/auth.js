/**
 * Authentication Configuration
 * JWT and authentication settings
 */

require('dotenv').config();

module.exports = {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  
  // Password hashing
  bcryptRounds: 10,
  
  // Session configuration
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  
  // Default admin user
  defaultAdmin: 'QSECOFR',
};