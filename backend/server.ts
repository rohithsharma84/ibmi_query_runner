import express, { Express, Request, Response, NextFunction } from 'express';
import next from 'next';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import pgSession from 'connect-pg-simple';
import pool from './src/db/pool';
import { errorHandler } from './src/middleware/errorHandler';
import { logger } from './src/utils/logger';
import { initializeVault } from './src/services/vaultService';
import { initializeDatabase } from './src/services/databaseService';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000');

const startServer = async () => {
  try {
    // Initialize Vault
    logger.info('Initializing Vault...');
    await initializeVault();

    // Initialize Database
    logger.info('Initializing Database...');
    await initializeDatabase();

    await app.prepare();

    const server: Express = express();

    // Middleware
    server.use(helmet());
    server.use(cors());
    server.use(morgan('combined'));
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    server.use(cookieParser());

    // Session configuration
    const PgSession = pgSession(session);
    const sessionStore = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    });

    server.use(
      session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET || 'your_session_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      })
    );

    // Health check
    server.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes are handled by Next.js pages/api

    // All other routes go to Next.js
    server.all('*', (req: Request, res: Response) => {
      return handle(req, res);
    });

    // Error handling
    server.use(errorHandler);

    server.listen(PORT, () => {
      logger.info(`Query Runner backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
