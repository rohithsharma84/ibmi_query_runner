import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { generateToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import argon2 from 'argon2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user by username
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      logger.warn(`Login attempt for non-existent user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await argon2.verify(user.password_hash, password);
    if (!passwordMatch) {
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password change is required
    if (user.password_change_required) {
      logger.info(`User ${username} must change password on first login`);
      return res.status(200).json({
        requiresPasswordChange: true,
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin,
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.username, user.is_admin);

    logger.info(`User ${username} logged in successfully`);

    // Set secure HTTP-only cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; Path=/; Max-Age=604800`);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    logger.error('Login error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
