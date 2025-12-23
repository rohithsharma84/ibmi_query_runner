import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { compareRuns, exportComparisonToCSV, createComparisonSnapshot } from '@/services/comparisonService';

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
      // Compare two runs
      const { run1Id, run2Id, percentageDiffThreshold, exportAsCSV, snapshotName } = req.body;

      if (!run1Id || !run2Id) {
        return res.status(400).json({ error: 'Both run IDs are required' });
      }

      const threshold = percentageDiffThreshold || 20;

      const comparison = await compareRuns(run1Id, run2Id, threshold);

      let csvData = null;
      if (exportAsCSV) {
        csvData = await exportComparisonToCSV(comparison.comparisons);
      }

      let snapshotId = null;
      if (snapshotName) {
        snapshotId = await createComparisonSnapshot(decoded.userId, snapshotName, run1Id, run2Id);
        logger.info(`Comparison snapshot created: ${snapshotId}`);
      }

      return res.status(200).json({
        success: true,
        comparison: comparison.comparisons,
        csvData: csvData || undefined,
        snapshotId: snapshotId || undefined,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Comparison endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
