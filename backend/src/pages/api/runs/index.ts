import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { verifyToken } from '@/utils/jwt';
import { logger, auditLog } from '@/utils/logger';
import {
  checkConcurrentLimit,
  executeQuerySet,
  generateRunName,
} from '@/services/executionService';
import * as dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    if (req.method === 'POST') {
      // Execute query set
      const { querySetId, iterations, concurrentRuns, runDescription } = req.body;

      if (!querySetId || !iterations || !concurrentRuns) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check concurrent run limit
      if (!checkConcurrentLimit(decoded.userId)) {
        return res.status(429).json({ error: 'Maximum concurrent runs exceeded' });
      }

      // Get query set
      const setResult = await query(
        `SELECT qs.id, qs.db_credential_id, qs.created_by_user_id
         FROM query_sets qs
         WHERE qs.id = $1`,
        [querySetId]
      );

      if (setResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query set not found' });
      }

      const querySet = setResult.rows[0];

      if (querySet.created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!querySet.db_credential_id) {
        return res.status(400).json({
          error: 'Query set does not have an associated database credential',
          action: 'SELECT_CREDENTIAL',
        });
      }

      // Get all queries in the set
      const queriesResult = await query(
        `SELECT id, query_name, sql_text, qro_hash FROM queries WHERE query_set_id = $1`,
        [querySetId]
      );

      if (queriesResult.rows.length === 0) {
        return res.status(400).json({ error: 'Query set has no queries' });
      }

      // Create run record
      const runName = generateRunName();
      const runResult = await query(
        `INSERT INTO runs (query_set_id, run_name, run_description, iterations, concurrent_runs, status)
         VALUES ($1, $2, $3, $4, $5, 'running')
         RETURNING id, run_name, created_at`,
        [querySetId, runName, runDescription || null, iterations, concurrentRuns]
      );

      const runId = runResult.rows[0].id;

      await auditLog(decoded.userId, 'START_QUERY_RUN', 'run', runId, {
        querySetId,
        iterations,
        concurrentRuns,
        queryCount: queriesResult.rows.length,
      });

      logger.info(`Query set execution started: Run ${runId}`);

      // Execute queries asynchronously
      const javaServiceUrl = process.env.JAVA_SERVICE_URL || 'http://localhost:8080';

      executeQuerySet(
        {
          userId: decoded.userId,
          username: decoded.username,
          runId,
          querySetId,
        },
        queriesResult.rows,
        querySet.db_credential_id,
        iterations,
        concurrentRuns,
        javaServiceUrl
      )
        .then(async (executionResult) => {
          // Store results
          if (executionResult.success) {
            for (const result of executionResult.results) {
              await query(
                `INSERT INTO query_results (run_id, query_id, iteration_number, execution_time_ms, 
                                           row_count, result_data, status, error_message)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  runId,
                  result.queryId,
                  result.iterationNumber,
                  result.executionTimeMs,
                  result.rowCount,
                  JSON.stringify(result.resultData || []),
                  result.status,
                  result.errorMessage,
                ]
              );
            }
          }

          // Update run status
          await query(
            `UPDATE runs
             SET status = $1, total_execution_time_ms = $2, completed_at = NOW()
             WHERE id = $3`,
            [executionResult.success ? 'completed' : 'failed', executionResult.totalExecutionTimeMs, runId]
          );

          logger.info(
            `Query set execution completed: Run ${runId}, Time: ${executionResult.totalExecutionTimeMs}ms`
          );
        })
        .catch((error) => {
          logger.error(`Query set execution error: Run ${runId}`, error);
          query(`UPDATE runs SET status = 'error', completed_at = NOW() WHERE id = $1`, [runId]);
        });

      return res.status(202).json({
        success: true,
        run: runResult.rows[0],
        message: 'Query execution started',
      });
    } else if (req.method === 'GET') {
      // Get runs for user
      const { querySetId } = req.query;

      let sqlQuery = `
        SELECT r.id, r.query_set_id, r.run_name, r.run_description, r.iterations, 
               r.concurrent_runs, r.total_execution_time_ms, r.status, r.created_at, r.completed_at,
               COUNT(DISTINCT qr.query_id) as query_count,
               COUNT(CASE WHEN qr.status = 'error' THEN 1 END) as error_count
        FROM runs r
        LEFT JOIN query_results qr ON r.id = qr.run_id
        WHERE r.query_set_id IN (SELECT id FROM query_sets WHERE created_by_user_id = $1)
      `;

      let params: any[] = [decoded.userId];

      if (querySetId) {
        sqlQuery += ' AND r.query_set_id = $2';
        params.push(querySetId);
      }

      sqlQuery += `
        GROUP BY r.id, r.query_set_id, r.run_name, r.run_description, r.iterations, 
                 r.concurrent_runs, r.total_execution_time_ms, r.status, r.created_at, r.completed_at
        ORDER BY r.created_at DESC
      `;

      const result = await query(sqlQuery, params);

      return res.status(200).json({
        success: true,
        runs: result.rows,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Runs endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
