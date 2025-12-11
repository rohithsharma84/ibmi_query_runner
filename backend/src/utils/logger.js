/**
 * Logger Utility
 * Winston-based logging configuration
 */

const winston = require('winston');
const path = require('path');
const appConfig = require('../config/app');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Determine effective log level and whether debug is enabled
const effectiveLogLevel = (appConfig.logLevel || process.env.LOG_LEVEL || 'info').toLowerCase();
const isDebugEnabled = ['debug', 'silly', 'verbose'].includes(effectiveLogLevel);

// Create logger instance
const logger = winston.createLogger({
  level: effectiveLogLevel,
  format: logFormat,
  defaultMeta: { service: 'ibmi-query-runner' },
  transports: [
    // Write logs to console (respect configured level)
    new winston.transports.Console({
      level: effectiveLogLevel,
      format: consoleFormat,
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(appConfig.logsPath, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write logs to combined.log at configured level
    new winston.transports.File({
      filename: path.join(appConfig.logsPath, 'combined.log'),
      level: effectiveLogLevel,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Expose whether debug-level logging is enabled
logger.isDebugEnabled = isDebugEnabled;

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;