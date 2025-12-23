import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { verifyToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from cookie or header
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      const cookieToken = req.headers.cookie?.split('token=')[1]?.split(';')[0];
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database
    const result = await query('SELECT id, username, email, is_admin FROM users WHERE id = $1', [
      decoded.userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    logger.error('Me endpoint error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
