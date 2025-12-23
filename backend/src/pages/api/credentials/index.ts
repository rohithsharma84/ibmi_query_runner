import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { storeCredential, updateCredentialPassword, deleteCredential } from '@/services/vaultService';
import { verifyToken } from '@/utils/jwt';
import { logger, auditLog } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const requireAdmin = async (req: NextApiRequest, res: NextApiResponse): Promise<{ userId: number; username: string } | null> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }

  if (!decoded.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }

  return { userId: decoded.userId, username: decoded.username };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') {
      // List all DB credentials
      const result = await query(
        `SELECT id, credential_name, host, port, secure, created_at, updated_at
         FROM db_credentials
         ORDER BY created_at DESC`
      );

      return res.status(200).json({
        success: true,
        credentials: result.rows,
      });
    } else if (req.method === 'POST') {
      // Create new DB credential
      const { credentialName, host, port, database, username, password, secure, libraryList, defaultSchema } = req.body;

      if (!credentialName || !host || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const credentialId = uuidv4();
      const vaultSecretPath = `secret/data/ibmi/${credentialId}`;

      try {
        // Store credential in Vault
        await storeCredential(credentialId, {
          host,
          port: port || 9050,
          database: database || '',
          username,
          password,
          secure: secure !== false,
          libraryList: libraryList || '',
          defaultSchema: defaultSchema || '',
        });

        // Store metadata in PostgreSQL
        const dbResult = await query(
          `INSERT INTO db_credentials (created_by_user_id, credential_name, vault_secret_path, host, port, secure)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, credential_name, host, port, secure, created_at`,
          [admin.userId, credentialName, vaultSecretPath, host, port || 9050, secure !== false]
        );

        await auditLog(admin.userId, 'CREATE_CREDENTIAL', 'db_credential', dbResult.rows[0].id, {
          credentialName,
          host,
        });

        logger.info(`DB credential created: ${credentialName}`);

        return res.status(201).json({
          success: true,
          credential: dbResult.rows[0],
        });
      } catch (error) {
        logger.error('Failed to create credential', error);
        return res.status(500).json({ error: 'Failed to create credential' });
      }
    } else if (req.method === 'PUT') {
      // Update DB credential
      const { id, password } = req.body;

      if (!id || !password) {
        return res.status(400).json({ error: 'Credential ID and password are required' });
      }

      try {
        // Get credential metadata
        const credResult = await query(
          'SELECT vault_secret_path FROM db_credentials WHERE id = $1',
          [id]
        );

        if (credResult.rows.length === 0) {
          return res.status(404).json({ error: 'Credential not found' });
        }

        const credentialId = credResult.rows[0].vault_secret_path.split('/').pop();

        // Update password in Vault
        await updateCredentialPassword(credentialId, password);

        // Update timestamp in PostgreSQL
        await query('UPDATE db_credentials SET updated_at = NOW() WHERE id = $1', [id]);

        await auditLog(admin.userId, 'UPDATE_CREDENTIAL', 'db_credential', id, {
          action: 'password_updated',
        });

        logger.info(`DB credential password updated: ID ${id}`);

        return res.status(200).json({
          success: true,
          message: 'Credential password updated successfully',
        });
      } catch (error) {
        logger.error('Failed to update credential', error);
        return res.status(500).json({ error: 'Failed to update credential' });
      }
    } else if (req.method === 'DELETE') {
      // Delete DB credential
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Credential ID is required' });
      }

      try {
        // Get credential metadata
        const credResult = await query(
          'SELECT vault_secret_path FROM db_credentials WHERE id = $1',
          [id]
        );

        if (credResult.rows.length === 0) {
          return res.status(404).json({ error: 'Credential not found' });
        }

        const credentialId = credResult.rows[0].vault_secret_path.split('/').pop();

        // Check which query sets use this credential
        const usageResult = await query(
          'SELECT id, query_set_name FROM query_sets WHERE db_credential_id = $1',
          [id]
        );

        // Delete credential from Vault
        await deleteCredential(credentialId);

        // Delete credential from PostgreSQL
        await query('DELETE FROM db_credentials WHERE id = $1', [id]);

        await auditLog(admin.userId, 'DELETE_CREDENTIAL', 'db_credential', parseInt(id as string), {
          affectedQuerySets: usageResult.rows.map((r: any) => r.id),
        });

        logger.info(`DB credential deleted: ID ${id}`);

        return res.status(200).json({
          success: true,
          message: 'Credential deleted successfully',
          affectedQuerySets: usageResult.rows,
        });
      } catch (error) {
        logger.error('Failed to delete credential', error);
        return res.status(500).json({ error: 'Failed to delete credential' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('DB credentials endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
