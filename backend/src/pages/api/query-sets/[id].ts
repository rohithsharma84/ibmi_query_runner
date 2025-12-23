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
    if (req.method === 'GET') {
      // Get query set details with all queries
      const result = await query(
        `SELECT qs.id, qs.query_set_name, qs.description, qs.db_credential_id, 
                dc.credential_name, qs.created_at, qs.updated_at
         FROM query_sets qs
         LEFT JOIN db_credentials dc ON qs.db_credential_id = dc.id
         WHERE qs.id = $1 AND qs.created_by_user_id = $2`,
        [id, decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Query set not found' });
      }

      const querySet = result.rows[0];

      // Get all queries in this set
      const queriesResult = await query(
        `SELECT id, query_name, sql_text, description, imported_from_plan_cache, 
                import_date, qro_hash, created_at, updated_at
         FROM queries
         WHERE query_set_id = $1
         ORDER BY created_at ASC`,
        [id]
      );

      return res.status(200).json({
        success: true,
        querySet: {
          ...querySet,
          queries: queriesResult.rows,
        },
      });
    } else if (req.method === 'PUT') {
      // Update query set
      const { querySetName, description, dbCredentialId } = req.body;

      // Verify ownership
      const checkResult = await query('SELECT created_by_user_id FROM query_sets WHERE id = $1', [
        id,
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query set not found' });
      }

      if (checkResult.rows[0].created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await query(
        `UPDATE query_sets
         SET query_set_name = COALESCE($1, query_set_name),
             description = COALESCE($2, description),
             db_credential_id = COALESCE($3, db_credential_id),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, query_set_name, description, db_credential_id, updated_at`,
        [querySetName || null, description || null, dbCredentialId || null, id]
      );

      await auditLog(decoded.userId, 'UPDATE_QUERY_SET', 'query_set', parseInt(id as string), {
        querySetName,
      });

      logger.info(`Query set updated: ID ${id}`);

      return res.status(200).json({
        success: true,
        querySet: result.rows[0],
      });
    } else if (req.method === 'DELETE') {
      // Delete query set
      const checkResult = await query('SELECT created_by_user_id FROM query_sets WHERE id = $1', [
        id,
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query set not found' });
      }

      if (checkResult.rows[0].created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await query('DELETE FROM query_sets WHERE id = $1', [id]);

      await auditLog(decoded.userId, 'DELETE_QUERY_SET', 'query_set', parseInt(id as string), {});

      logger.info(`Query set deleted: ID ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Query set deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Query set detail endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
