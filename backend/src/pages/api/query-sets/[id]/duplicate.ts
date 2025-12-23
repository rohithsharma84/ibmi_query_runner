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
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { id } = req.query;

  try {
    if (req.method === 'POST') {
      // Duplicate query set
      const { newQuerySetName } = req.body;

      if (!newQuerySetName) {
        return res.status(400).json({ error: 'New query set name is required' });
      }

      // Verify ownership
      const checkResult = await query('SELECT * FROM query_sets WHERE id = $1', [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query set not found' });
      }

      if (checkResult.rows[0].created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const original = checkResult.rows[0];

      // Create new query set with same properties
      const newSetResult = await query(
        `INSERT INTO query_sets (created_by_user_id, query_set_name, description, db_credential_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, query_set_name, description, db_credential_id, created_at`,
        [decoded.userId, newQuerySetName, original.description, original.db_credential_id]
      );

      const newQuerySetId = newSetResult.rows[0].id;

      // Copy all queries from original to new set
      const queriesResult = await query(
        `SELECT query_name, sql_text, description, imported_from_plan_cache, 
                import_date, qro_hash, parameters
         FROM queries
         WHERE query_set_id = $1`,
        [id]
      );

      for (const q of queriesResult.rows) {
        await query(
          `INSERT INTO queries (query_set_id, query_name, sql_text, description, 
                              imported_from_plan_cache, import_date, qro_hash, parameters)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newQuerySetId,
            q.query_name,
            q.sql_text,
            q.description,
            q.imported_from_plan_cache,
            q.import_date,
            q.qro_hash,
            q.parameters,
          ]
        );
      }

      await auditLog(decoded.userId, 'DUPLICATE_QUERY_SET', 'query_set', newQuerySetId, {
        originalId: id,
        newQuerySetName,
        queryCopied: queriesResult.rows.length,
      });

      logger.info(`Query set duplicated: ${id} -> ${newQuerySetId}`);

      return res.status(201).json({
        success: true,
        querySet: newSetResult.rows[0],
        queriesCopied: queriesResult.rows.length,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Query set name already exists' });
    }
    logger.error('Query set duplicate endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
