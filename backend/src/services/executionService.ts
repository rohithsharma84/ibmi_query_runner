import axios from 'axios';
import { retrieveCredential } from '@/services/vaultService';
import { generateServiceToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { getMaxConcurrentRuns } from '@/utils/config';

interface RunContext {
  userId: number;
  username: string;
  runId: number;
  querySetId: number;
}

const activeRuns = new Map<number, Set<number>>(); // Map of userId -> Set of running query set ids

export const checkConcurrentLimit = (userId: number): boolean => {
  if (!activeRuns.has(userId)) {
    activeRuns.set(userId, new Set());
  }

  const maxConcurrent = getMaxConcurrentRuns();
  return activeRuns.get(userId)!.size < maxConcurrent;
};

export const executeQuerySet = async (
  context: RunContext,
  queries: any[],
  dbCredentialId: number,
  iterations: number,
  concurrentRuns: number,
  javaServiceUrl: string
): Promise<any> => {
  const runStartTime = Date.now();

  try {
    // Add run to active set
    if (!activeRuns.has(context.userId)) {
      activeRuns.set(context.userId, new Set());
    }
    activeRuns.get(context.userId)!.add(context.runId);

    // Retrieve credential from Vault
    let credential;
    try {
      credential = await retrieveCredential(dbCredentialId.toString());
    } catch (error) {
      logger.error(`Failed to retrieve credential for execution: ${dbCredentialId}`, error);
      throw new Error('Unable to retrieve database credentials');
    }

    // Prepare result array
    const allResults = [];

    // Execute queries for each iteration
    for (let iter = 0; iter < iterations; iter++) {
      const iterationResults = [];

      // Execute queries with concurrency control
      const queryPromises = queries.map(async (q) => {
        const queryStartTime = Date.now();

        try {
          const serviceToken = generateServiceToken();

          const response = await axios.post(
            `${javaServiceUrl}/api/query/execute`,
            {
              host: credential.host,
              port: credential.port,
              database: credential.database,
              username: credential.username,
              password: credential.password,
              secure: credential.secure,
              sql: q.sql_text,
              libraryList: credential.libraryList,
              defaultSchema: credential.defaultSchema,
            },
            {
              headers: {
                'Authorization': `Bearer ${serviceToken}`,
                'Content-Type': 'application/json',
              },
              timeout: 300000, // 5 minute timeout for query execution
            }
          );

          const executionTime = Date.now() - queryStartTime;

          return {
            queryId: q.id,
            queryName: q.query_name,
            qroHash: q.qro_hash,
            iterationNumber: iter + 1,
            executionTimeMs: executionTime,
            rowCount: response.data.rowCount || 0,
            status: response.data.success ? 'success' : 'error',
            errorMessage: response.data.error || null,
            resultData: response.data.data || [],
          };
        } catch (error: any) {
          const executionTime = Date.now() - queryStartTime;
          logger.error(`Query execution failed: ${q.id}`, error);

          return {
            queryId: q.id,
            queryName: q.query_name,
            qroHash: q.qro_hash,
            iterationNumber: iter + 1,
            executionTimeMs: executionTime,
            rowCount: 0,
            status: 'error',
            errorMessage: error.message || 'Unknown error',
            resultData: [],
          };
        }
      });

      const iterResults = await Promise.all(queryPromises);
      iterationResults.push(...iterResults);
    }

    allResults.push(...iterationResults);

    const totalExecutionTime = Date.now() - runStartTime;

    return {
      success: true,
      totalExecutionTimeMs: totalExecutionTime,
      results: allResults,
    };
  } catch (error) {
    const totalExecutionTime = Date.now() - runStartTime;
    logger.error(`Query set execution failed: ${context.runId}`, error);

    return {
      success: false,
      totalExecutionTimeMs: totalExecutionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Remove run from active set
    if (activeRuns.has(context.userId)) {
      activeRuns.get(context.userId)!.delete(context.runId);
    }
  }
};

export const generateRunName = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `Run_${year}-${month}-${day}_${hours}:${minutes}:${seconds}.${milliseconds}`;
};
