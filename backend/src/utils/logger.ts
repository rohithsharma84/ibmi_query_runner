import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: 'config/debug.conf' });

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

const getCurrentLogLevel = (): number => {
  return LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.info;
};

const redactSensitiveData = (data: any): any => {
  if (DEBUG_MODE) {
    return data;
  }

  const redacted = JSON.parse(JSON.stringify(data));

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'credential',
    'apiKey',
    'username',
  ];

  const redactObject = (obj: any) => {
    for (const key in obj) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactObject(obj[key]);
      }
    }
  };

  redactObject(redacted);
  return redacted;
};

export const logger = {
  debug: (message: string, data?: any) => {
    if (LOG_LEVELS.debug >= getCurrentLogLevel()) {
      console.log(
        `[${new Date().toISOString()}] DEBUG: ${message}`,
        data ? redactSensitiveData(data) : ''
      );
    }
  },

  info: (message: string, data?: any) => {
    if (LOG_LEVELS.info >= getCurrentLogLevel()) {
      console.log(
        `[${new Date().toISOString()}] INFO: ${message}`,
        data ? redactSensitiveData(data) : ''
      );
    }
  },

  warn: (message: string, data?: any) => {
    if (LOG_LEVELS.warn >= getCurrentLogLevel()) {
      console.warn(
        `[${new Date().toISOString()}] WARN: ${message}`,
        data ? redactSensitiveData(data) : ''
      );
    }
  },

  error: (message: string, error?: any) => {
    if (LOG_LEVELS.error >= getCurrentLogLevel()) {
      console.error(
        `[${new Date().toISOString()}] ERROR: ${message}`,
        error ? redactSensitiveData(error) : ''
      );
    }
  },
};

export const auditLog = async (
  userId: number,
  action: string,
  resourceType: string,
  resourceId: number | null,
  details: any
) => {
  try {
    const detailsToLog = redactSensitiveData(details);
    logger.info(`AUDIT: User ${userId} performed ${action} on ${resourceType}:${resourceId}`, {
      userId,
      action,
      resourceType,
      resourceId,
      details: detailsToLog,
    });
    
    // Store in database (implemented later)
  } catch (error) {
    logger.error('Failed to log audit event', error);
  }
};
