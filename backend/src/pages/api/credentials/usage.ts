import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { verifyToken } from '@/utils/jwt';
import { logger, auditLog } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    if (req.method === 'GET') {
      // Get usage information for a credential
      const { credentialId } = req.query;

      if (!credentialId) {
        return res.status(400).json({ error: 'Credential ID is required' });
      }

      // Get query sets using this credential
      const usageResult = await query(
        `SELECT qs.id, qs.query_set_name, qs.created_by_user_id, u.username, qs.created_at
         FROM query_sets qs
         LEFT JOIN users u ON qs.created_by_user_id = u.id
         WHERE qs.db_credential_id = $1
         ORDER BY qs.created_at DESC`,
        [credentialId]
      );

      return res.status(200).json({
        success: true,
        usedBy: usageResult.rows,
        count: usageResult.rows.length,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Credential usage endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
