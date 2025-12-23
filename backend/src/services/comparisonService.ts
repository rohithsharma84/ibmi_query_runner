import { query } from '@/db/pool';
import { logger } from '@/utils/logger';
import { Parser } from 'json2csv';

interface QueryResult {
  queryId: number;
  qroHash: string;
  executionTimeMs: number;
  rowCount: number;
  status: string;
  errorMessage: string | null;
}

export const compareRuns = async (
  run1Id: number,
  run2Id: number,
  percentageDiffThreshold: number = 20
): Promise<any> => {
  try {
    // Get results for both runs
    const run1Results = await query(
      `SELECT query_id, qro_hash, execution_time_ms, row_count, status, error_message
       FROM query_results
       WHERE run_id = $1
       ORDER BY query_id`,
      [run1Id]
    );

    const run2Results = await query(
      `SELECT query_id, qro_hash, execution_time_ms, row_count, status, error_message
       FROM query_results
       WHERE run_id = $2
       ORDER BY query_id`,
      [run2Id]
    );

    // Map results by QRO hash
    const run1Map = new Map<string, QueryResult[]>();
    const run2Map = new Map<string, QueryResult[]>();

    for (const row of run1Results.rows) {
      const hash = row.qro_hash || `query_${row.query_id}`;
      if (!run1Map.has(hash)) {
        run1Map.set(hash, []);
      }
      run1Map.get(hash)!.push(row);
    }

    for (const row of run2Results.rows) {
      const hash = row.qro_hash || `query_${row.query_id}`;
      if (!run2Map.has(hash)) {
        run2Map.set(hash, []);
      }
      run2Map.get(hash)!.push(row);
    }

    // Compare results
    const comparisons = [];
    const allHashes = new Set([...run1Map.keys(), ...run2Map.keys()]);

    for (const hash of allHashes) {
      const run1Data = run1Map.get(hash) || [];
      const run2Data = run2Map.get(hash) || [];

      // Calculate average execution time for each run
      const run1AvgTime =
        run1Data.reduce((sum, r) => sum + r.execution_time_ms, 0) / Math.max(run1Data.length, 1);
      const run2AvgTime =
        run2Data.reduce((sum, r) => sum + r.execution_time_ms, 0) / Math.max(run2Data.length, 1);

      const percentageDiff = ((run2AvgTime - run1AvgTime) / run1AvgTime) * 100;
      const meetsThreshold = Math.abs(percentageDiff) >= percentageDiffThreshold;

      comparisons.push({
        qroHash: hash,
        queryId: run1Data[0]?.query_id || run2Data[0]?.query_id,
        run1AvgTimeMs: Math.round(run1AvgTime),
        run2AvgTimeMs: Math.round(run2AvgTime),
        percentageDiff: Math.round(percentageDiff * 10) / 10,
        meetsThreshold,
        run1Status: run1Data[0]?.status || 'not_executed',
        run2Status: run2Data[0]?.status || 'not_executed',
      });
    }

    return {
      success: true,
      comparisons: comparisons.sort((a, b) => Math.abs(b.percentageDiff) - Math.abs(a.percentageDiff)),
    };
  } catch (error) {
    logger.error('Error comparing runs', error);
    throw error;
  }
};

export const exportComparisonToCSV = async (
  comparisons: any[],
  fileName: string = 'comparison.csv'
): Promise<string> => {
  try {
    const json2csvParser = new Parser({
      fields: [
        'qroHash',
        'queryId',
        'run1AvgTimeMs',
        'run2AvgTimeMs',
        'percentageDiff',
        'run1Status',
        'run2Status',
      ],
      header: true,
    });

    const csv = json2csvParser.parse(comparisons);
    return csv;
  } catch (error) {
    logger.error('Error exporting comparison to CSV', error);
    throw error;
  }
};

export const createComparisonSnapshot = async (
  userId: number,
  snapshotName: string,
  run1Id: number,
  run2Id: number
): Promise<number> => {
  try {
    // Get run data
    const runs = await query(
      `SELECT id, run_name, total_execution_time_ms FROM runs WHERE id IN ($1, $2)`,
      [run1Id, run2Id]
    );

    if (runs.rows.length !== 2) {
      throw new Error('One or both runs not found');
    }

    // Create comparison
    const comparison = await compareRuns(run1Id, run2Id);

    const result = await query(
      `INSERT INTO comparison_snapshots (created_by_user_id, snapshot_name, first_run_id, second_run_id, snapshot_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        userId,
        snapshotName,
        run1Id,
        run2Id,
        JSON.stringify({
          comparisons: comparison.comparisons,
          run1: runs.rows[0],
          run2: runs.rows[1],
        }),
      ]
    );

    return result.rows[0].id;
  } catch (error) {
    logger.error('Error creating comparison snapshot', error);
    throw error;
  }
};
