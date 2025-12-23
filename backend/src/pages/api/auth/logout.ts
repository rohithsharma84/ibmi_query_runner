import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear token cookie
    res.setHeader('Set-Cookie', 'token=; HttpOnly; Secure; Path=/; Max-Age=0');

    logger.info('User logged out');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
