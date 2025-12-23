import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: 'config/concurrency.conf' });

export const getConfigValue = (
  key: string,
  defaultValue: any = null
): any => {
  const envKey = key.toUpperCase();
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    // Try to parse as number
    if (!isNaN(Number(envValue))) {
      return Number(envValue);
    }
    // Try to parse as boolean
    if (envValue === 'true') return true;
    if (envValue === 'false') return false;
    return envValue;
  }

  return defaultValue;
};

export const getMaxConcurrentRuns = (): number => {
  return getConfigValue('MAX_CONCURRENT_RUNS', 5);
};

export const getConnectionTimeout = (): number => {
  return getConfigValue('CONNECTION_TIMEOUT', 30000);
};

export const getQueryTimeout = (): number => {
  return getConfigValue('QUERY_TIMEOUT', 0);
};
