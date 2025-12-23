import * as dotenv from 'dotenv';
import { initializeDatabase } from '../src/services/databaseService';
import { logger } from '../src/utils/logger';

dotenv.config();

const initializeDB = async () => {
  try {
    logger.info('Initializing database schema...');
    await initializeDatabase();
    logger.info('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed', error);
    process.exit(1);
  }
};

initializeDB();
