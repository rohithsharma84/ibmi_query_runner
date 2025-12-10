/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  let { statusCode, message, errorCode, details } = err;
  
  // Default to 500 if no status code
  if (!statusCode) {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
  
  // Log error
  logger.error('Error occurred:', {
    statusCode,
    message,
    errorCode,
    details,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });
  
  // Send error response
  const response = {
    success: false,
    error: {
      message,
      code: errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
    },
  };
  
  // Include details in development mode
  if (process.env.NODE_ENV === 'development' && details) {
    response.error.details = details;
  }
  
  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new ApiError(
    HTTP_STATUS.NOT_FOUND,
    `Route ${req.originalUrl} not found`,
    ERROR_CODES.NOT_FOUND
  );
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};