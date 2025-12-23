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

  try {
    if (req.method === 'GET') {
      // List all query sets for the user
      const result = await query(
        `SELECT qs.id, qs.query_set_name, qs.description, qs.db_credential_id, 
                dc.credential_name, qs.created_at, qs.updated_at,
                COUNT(q.id) as query_count
         FROM query_sets qs
         LEFT JOIN db_credentials dc ON qs.db_credential_id = dc.id
         LEFT JOIN queries q ON qs.id = q.query_set_id
         WHERE qs.created_by_user_id = $1
         GROUP BY qs.id, qs.query_set_name, qs.description, qs.db_credential_id, 
                  dc.credential_name, qs.created_at, qs.updated_at
         ORDER BY qs.created_at DESC`,
        [decoded.userId]
      );

      return res.status(200).json({
        success: true,
        querySets: result.rows,
      });
    } else if (req.method === 'POST') {
      // Create new query set
      const { querySetName, description, dbCredentialId } = req.body;

      if (!querySetName) {
        return res.status(400).json({ error: 'Query set name is required' });
      }

      if (!dbCredentialId) {
        return res.status(400).json({ error: 'Database credential is required' });
      }

      try {
        const result = await query(
          `INSERT INTO query_sets (created_by_user_id, query_set_name, description, db_credential_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, query_set_name, description, db_credential_id, created_at`,
          [decoded.userId, querySetName, description || null, dbCredentialId]
        );

        await auditLog(decoded.userId, 'CREATE_QUERY_SET', 'query_set', result.rows[0].id, {
          querySetName,
        });

        logger.info(`Query set created: ${querySetName} by user ${decoded.username}`);

        return res.status(201).json({
          success: true,
          querySet: result.rows[0],
        });
      } catch (error: any) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Query set name already exists' });
        }
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Query sets endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
