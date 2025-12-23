import pool, { query } from '@/db/pool';
import { logger } from '@/utils/logger';

export const initializeDatabase = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable pgcrypto extension
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    logger.info('pgcrypto extension enabled');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        password_change_required BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('users table created');

    // Create db_credentials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS db_credentials (
        id SERIAL PRIMARY KEY,
        created_by_user_id INTEGER NOT NULL REFERENCES users(id),
        credential_name VARCHAR(255) NOT NULL,
        vault_secret_path VARCHAR(500) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port INTEGER DEFAULT 9050,
        secure BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_credential_name UNIQUE(credential_name)
      )
    `);
    logger.info('db_credentials table created');

    // Create query_sets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_sets (
        id SERIAL PRIMARY KEY,
        created_by_user_id INTEGER NOT NULL REFERENCES users(id),
        db_credential_id INTEGER REFERENCES db_credentials(id),
        query_set_name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_user_queryset UNIQUE(created_by_user_id, query_set_name)
      )
    `);
    logger.info('query_sets table created');

    // Create queries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        query_set_id INTEGER NOT NULL REFERENCES query_sets(id) ON DELETE CASCADE,
        query_name VARCHAR(255) NOT NULL,
        sql_text TEXT NOT NULL,
        description TEXT,
        imported_from_plan_cache BOOLEAN DEFAULT FALSE,
        import_date TIMESTAMP,
        qro_hash VARCHAR(64),
        parameters JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('queries table created');

    // Create runs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS runs (
        id SERIAL PRIMARY KEY,
        query_set_id INTEGER NOT NULL REFERENCES query_sets(id),
        run_name VARCHAR(255) NOT NULL,
        run_description TEXT,
        iterations INTEGER DEFAULT 1,
        concurrent_runs INTEGER DEFAULT 1,
        total_execution_time_ms BIGINT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    logger.info('runs table created');

    // Create query_results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_results (
        id SERIAL PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        query_id INTEGER NOT NULL REFERENCES queries(id),
        iteration_number INTEGER,
        execution_time_ms BIGINT,
        row_count INTEGER,
        result_data JSONB,
        status VARCHAR(50) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('query_results table created');

    // Create comparison_snapshots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comparison_snapshots (
        id SERIAL PRIMARY KEY,
        created_by_user_id INTEGER NOT NULL REFERENCES users(id),
        snapshot_name VARCHAR(255) NOT NULL,
        first_run_id INTEGER REFERENCES runs(id),
        second_run_id INTEGER REFERENCES runs(id),
        snapshot_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('comparison_snapshots table created');

    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('audit_log table created');

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_queries_set ON queries(query_set_id);
      CREATE INDEX IF NOT EXISTS idx_query_results_run ON query_results(run_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_db_credentials_user ON db_credentials(created_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_query_sets_user ON query_sets(created_by_user_id);
    `);
    logger.info('indexes created');

    await client.query('COMMIT');
    logger.info('Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to initialize database', error);
    throw error;
  } finally {
    client.release();
  }
};

export const seedInitialAdminUser = async (
  username: string = 'qradmin',
  hashedPassword: string
): Promise<number> => {
  try {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, is_admin, password_change_required)
       VALUES ($1, $2, $3, TRUE, TRUE)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [username, `${username}@localhost`, hashedPassword]
    );

    if (result.rows.length > 0) {
      logger.info(`Admin user '${username}' created`);
      return result.rows[0].id;
    } else {
      logger.info(`Admin user '${username}' already exists`);
      // Get existing user's id
      const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
      return existing.rows[0].id;
    }
  } catch (error) {
    logger.error(`Failed to seed admin user`, error);
    throw error;
  }
};
