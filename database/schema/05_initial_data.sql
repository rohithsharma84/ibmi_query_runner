-- ============================================================================
-- IBM i Query Runner - Database Schema
-- Initial Data Script
-- ============================================================================
--
-- Run this script after creating all database objects
-- This script inserts initial configuration and user data
--
-- ============================================================================

-- Insert QSECOFR user (always granted access)
INSERT INTO QRYRUN_USERS (USER_ID, USER_NAME, IS_ADMIN)
VALUES ('QSECOFR', 'Security Officer', 'Y');

-- Insert default configuration values
INSERT INTO QRYRUN_CONFIG (CONFIG_KEY, CONFIG_VALUE, CONFIG_TYPE, DESCRIPTION) VALUES
('DEFAULT_DEVIATION_THRESHOLD', '20.00', 'NUMBER', 'Default percentage threshold for deviation detection'),
('DEFAULT_METRICS_LEVEL', 'STANDARD', 'STRING', 'Default metrics collection level'),
('MAX_ITERATION_COUNT', '100', 'NUMBER', 'Maximum iterations allowed per query'),
('QUERY_TIMEOUT_SECONDS', '300', 'NUMBER', 'Query execution timeout in seconds'),
('ENABLE_PARALLEL_EXECUTION', 'false', 'BOOLEAN', 'Enable parallel query execution'),
('MAX_PARALLEL_QUERIES', '5', 'NUMBER', 'Maximum queries to execute in parallel');

-- Success message
SELECT 'Initial data inserted successfully!' AS MESSAGE FROM SYSIBM.SYSDUMMY1;
SELECT 'Database setup complete!' AS MESSAGE FROM SYSIBM.SYSDUMMY1;