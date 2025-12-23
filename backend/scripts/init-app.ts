import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import argon2 from 'argon2';
import { initializeVault } from '../src/services/vaultService';
import { initializeDatabase, seedInitialAdminUser } from '../src/services/databaseService';
import { generateSecurePassword } from '../src/utils/encryption';
import { logger } from '../src/utils/logger';

dotenv.config();

const initializeApp = async () => {
  try {
    logger.info('Starting application initialization...');

    // Step 1: Initialize Vault
    logger.info('Step 1: Initializing Vault...');
    await initializeVault();

    // Step 2: Initialize Database
    logger.info('Step 2: Initializing Database...');
    await initializeDatabase();

    // Step 3: Seed qradmin user
    logger.info('Step 3: Creating default admin user...');
    const adminUsername = process.env.INITIAL_ADMIN_USER || 'qradmin';
    const initialPassword = generateSecurePassword(16);
    const passwordHash = await argon2.hash(initialPassword);

    const adminUserId = await seedInitialAdminUser(adminUsername, passwordHash);

    // Step 4: Log initial password
    logger.info('Step 4: Logging initial password...');
    const logDir = path.dirname(
      process.env.INITIAL_ADMIN_PASSWORD_LOG_FILE || '/var/log/query_runner/qradmin_password.log'
    );

    // Create log directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = process.env.INITIAL_ADMIN_PASSWORD_LOG_FILE || '/var/log/query_runner/qradmin_password.log';
    const logContent = `Query Runner - Initial Admin Password\n` +
      `=====================================\n` +
      `Username: ${adminUsername}\n` +
      `Temporary Password: ${initialPassword}\n` +
      `User ID: ${adminUserId}\n` +
      `Generated: ${new Date().toISOString()}\n` +
      `\n` +
      `IMPORTANT: This password will be required to change on first login.\n` +
      `After changing, you will not be able to recover this temporary password.\n`;

    fs.writeFileSync(logFile, logContent, { mode: 0o600 });
    logger.info(`Initial password logged to: ${logFile}`);

    logger.info('Application initialization completed successfully!');
    logger.info(`\nInitial Setup Complete:`);
    logger.info(`Username: ${adminUsername}`);
    logger.info(`Initial password is stored in: ${logFile}`);
    logger.info(`User ID: ${adminUserId}`);

    process.exit(0);
  } catch (error) {
    logger.error('Application initialization failed', error);
    process.exit(1);
  }
};

initializeApp();
