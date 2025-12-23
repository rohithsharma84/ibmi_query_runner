import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/db/pool';
import { logger } from '@/utils/logger';
import argon2 from 'argon2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, oldPassword, newPassword, confirmPassword } = req.body;

  if (!userId || !oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Get current user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify old password
    const passwordMatch = await argon2.verify(user.password_hash, oldPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword);

    // Update password and clear password_change_required flag
    await query(
      `UPDATE users 
       SET password_hash = $1, password_change_required = FALSE, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    logger.info(`Password changed for user: ${user.username}`);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Password change error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
