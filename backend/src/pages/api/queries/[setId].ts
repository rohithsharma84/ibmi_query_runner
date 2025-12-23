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

  const { setId } = req.query;

  try {
    if (req.method === 'POST') {
      // Add query to query set
      const { queryName, sqlText, description, qroHash, importedFromPlanCache, importDate } = req.body;

      if (!queryName || !sqlText) {
        return res.status(400).json({ error: 'Query name and SQL text are required' });
      }

      // Verify ownership of query set
      const setResult = await query('SELECT created_by_user_id FROM query_sets WHERE id = $1', [
        setId,
      ]);

      if (setResult.rows.length === 0) {
        return res.status(404).json({ error: 'Query set not found' });
      }

      if (setResult.rows[0].created_by_user_id !== decoded.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await query(
        `INSERT INTO queries (query_set_id, query_name, sql_text, description, 
                             qro_hash, imported_from_plan_cache, import_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, query_name, sql_text, description, qro_hash, imported_from_plan_cache, import_date, created_at`,
        [
          setId,
          queryName,
          sqlText,
          description || null,
          qroHash || null,
          importedFromPlanCache || false,
          importDate || null,
        ]
      );

      await auditLog(decoded.userId, 'CREATE_QUERY', 'query', result.rows[0].id, {
        querySetId: setId,
        queryName,
      });

      logger.info(`Query created: ${queryName} in set ${setId}`);

      return res.status(201).json({
        success: true,
        query: result.rows[0],
      });
    } else if (req.method === 'GET') {
      // Get all queries in a query set
      const result = await query(
        `SELECT id, query_name, sql_text, description, qro_hash, imported_from_plan_cache, 
                import_date, created_at, updated_at
         FROM queries
         WHERE query_set_id = $1
         ORDER BY created_at ASC`,
        [setId]
      );

      return res.status(200).json({
        success: true,
        queries: result.rows,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Queries endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
