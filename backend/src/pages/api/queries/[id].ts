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
    if (req.method === 'PUT') {
      // Update query
      const { queryName, sqlText, description } = req.body;

      // Verify ownership
      const queryResult = await query(
        `SELECT q.id, qs.created_by_user_id
         FROM queries q
         JOIN query_sets qs ON q.query_set_id = qs.id
         WHERE q.id = $1`,
        [id]
      );

      if (queryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query not found' });
      }

      if (queryResult.rows[0].created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await query(
        `UPDATE queries
         SET query_name = COALESCE($1, query_name),
             sql_text = COALESCE($2, sql_text),
             description = COALESCE($3, description),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, query_name, sql_text, description, updated_at`,
        [queryName || null, sqlText || null, description || null, id]
      );

      await auditLog(decoded.userId, 'UPDATE_QUERY', 'query', parseInt(id as string), {
        queryName,
      });

      logger.info(`Query updated: ID ${id}`);

      return res.status(200).json({
        success: true,
        query: result.rows[0],
      });
    } else if (req.method === 'DELETE') {
      // Delete query
      const queryResult = await query(
        `SELECT q.id, qs.created_by_user_id
         FROM queries q
         JOIN query_sets qs ON q.query_set_id = qs.id
         WHERE q.id = $1`,
        [id]
      );

      if (queryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query not found' });
      }

      if (queryResult.rows[0].created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await query('DELETE FROM queries WHERE id = $1', [id]);

      await auditLog(decoded.userId, 'DELETE_QUERY', 'query', parseInt(id as string), {});

      logger.info(`Query deleted: ID ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Query deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Query detail endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
