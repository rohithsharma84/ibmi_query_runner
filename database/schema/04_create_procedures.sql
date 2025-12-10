-- ============================================================================
-- IBM i Query Runner - Database Schema
-- Stored Procedure Creation Script
-- ============================================================================
--
-- Run this script after creating tables, indexes, and views
--
-- ============================================================================

-- Procedure 1: SP_CALCULATE_RUN_STATISTICS
-- Calculate and update test run statistics
CREATE PROCEDURE SP_CALCULATE_RUN_STATISTICS (
    IN P_RUN_ID INTEGER
)
LANGUAGE SQL
BEGIN
    DECLARE V_TOTAL_QUERIES INTEGER;
    DECLARE V_SUCCESSFUL_QUERIES INTEGER;
    DECLARE V_FAILED_QUERIES INTEGER;
    DECLARE V_TOTAL_EXECUTIONS INTEGER;
    DECLARE V_AVG_DURATION DECIMAL(15,3);
    
    -- Calculate statistics from executions
    SELECT 
        COUNT(DISTINCT QUERY_ID),
        SUM(CASE WHEN STATUS = 'SUCCESS' THEN 1 ELSE 0 END),
        SUM(CASE WHEN STATUS = 'FAILED' THEN 1 ELSE 0 END),
        COUNT(*),
        AVG(DURATION_MS)
    INTO 
        V_TOTAL_QUERIES,
        V_SUCCESSFUL_QUERIES,
        V_FAILED_QUERIES,
        V_TOTAL_EXECUTIONS,
        V_AVG_DURATION
    FROM QRYRUN_EXECUTIONS
    WHERE RUN_ID = P_RUN_ID
        AND STATUS IN ('SUCCESS', 'FAILED');
    
    -- Update test run record
    UPDATE QRYRUN_TEST_RUNS
    SET 
        TOTAL_QUERIES = V_TOTAL_QUERIES,
        SUCCESSFUL_QUERIES = V_SUCCESSFUL_QUERIES,
        FAILED_QUERIES = V_FAILED_QUERIES,
        TOTAL_EXECUTIONS = V_TOTAL_EXECUTIONS,
        AVG_DURATION_MS = V_AVG_DURATION
    WHERE RUN_ID = P_RUN_ID;
END;

LABEL ON SPECIFIC PROCEDURE SP_CALCULATE_RUN_STATISTICS IS 'Calculate Test Run Statistics';

-- Success message
SELECT 'All stored procedures created successfully!' AS MESSAGE FROM SYSIBM.SYSDUMMY1;