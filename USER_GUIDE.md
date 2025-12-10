# IBM i Query Runner - User Guide

Welcome to the IBM i Query Runner! This guide will help you understand and use the application to test and compare SQL query performance on your IBM i system.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Working with Query Sets](#working-with-query-sets)
4. [Running Performance Tests](#running-performance-tests)
5. [Comparing Test Results](#comparing-test-results)
6. [Understanding Metrics](#understanding-metrics)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Introduction

### What is IBM i Query Runner?

IBM i Query Runner is a performance testing tool designed to help you:
- **Capture** SQL queries from the IBM i plan cache
- **Organize** queries into manageable sets
- **Execute** queries multiple times to gather performance data
- **Compare** results before and after system changes
- **Identify** performance improvements or degradations

### When to Use This Tool

Use IBM i Query Runner when you need to:
- Test query performance before/after OS upgrades
- Evaluate the impact of PTF applications
- Compare performance before/after database changes
- Identify queries affected by system modifications
- Establish performance baselines

### Key Concepts

- **Query Set**: A collection of SQL queries grouped together for testing
- **Test Run**: An execution of all queries in a set, repeated multiple times
- **Iteration**: A single execution of a query within a test run
- **Metrics Level**: The amount of performance data collected (BASIC, STANDARD, COMPREHENSIVE)
- **Comparison**: An analysis of two test runs to identify performance changes
- **Deviation**: A performance change that exceeds your configured threshold

---

## Getting Started

### Logging In

1. Navigate to the application URL (e.g., `http://your-ibmi:3000`)
2. Enter your IBM i user profile credentials
3. Click "Login"

**Note**: Your IBM i user profile must be authorized in the application. Contact your administrator if you cannot log in.

### Understanding User Roles

**Regular User:**
- Create and manage your own query sets
- Run performance tests
- View and compare results
- Cannot manage other users

**Administrator:**
- All regular user capabilities
- Manage user access
- View all query sets and test runs
- Configure system settings

### Navigation Overview

The application is organized into main sections:
- **Dashboard**: Overview of recent activity
- **Query Sets**: Manage collections of queries
- **Test Runs**: Execute and monitor performance tests
- **Comparisons**: Analyze performance differences
- **Users** (Admin only): Manage user access

---

## Working with Query Sets

### What is a Query Set?

A query set is a collection of SQL queries that you want to test together. Typically, you create query sets based on:
- User profile (queries run by a specific user)
- Application (queries from a specific application)
- Time period (queries from a specific date range)
- Purpose (baseline, post-patch, etc.)

### Creating a Query Set from Plan Cache

The plan cache contains information about SQL statements that have been executed on your system.

**Steps:**

1. Click "Query Sets" → "Create from Plan Cache"
2. Enter query set details:
   - **Name**: Descriptive name (e.g., "Pre-Patch Baseline")
   - **Description**: Optional details about the set
   - **User Profile**: IBM i user whose queries to import
3. Configure filters:
   - **Date Range**: Start and end dates
   - **Minimum Execution Count**: Only include queries run at least X times
   - **Limit**: Maximum number of queries to import
4. Click "Preview" to see which queries will be imported
5. Review the preview statistics
6. Click "Create Query Set"

**Example:**
```
Name: January 2024 Baseline
Description: Production queries before OS upgrade
User Profile: PRODUSER
Date From: 2024-01-01
Date To: 2024-01-31
Min Execution Count: 10
Limit: 100
```

### Creating a Manual Query Set

If you want to test specific queries not in the plan cache:

1. Click "Query Sets" → "Create Manual"
2. Enter query set details
3. Add queries one at a time:
   - Paste SQL statement
   - Specify statement type (SELECT, UPDATE, etc.)
4. Click "Add Query"
5. Repeat for all queries
6. Click "Create Query Set"

### Viewing Query Set Details

1. Click on a query set name
2. View:
   - Query set metadata
   - List of all queries
   - Query sequence numbers
   - Statement types
3. Actions available:
   - Edit query set name/description
   - Add new queries
   - Edit existing queries
   - Reorder queries
   - Delete queries
   - Refresh from plan cache

### Refreshing a Query Set

Over time, the queries in the plan cache may change. Refresh your query set to:
- Add new queries that appeared in the plan cache
- Remove queries no longer in the plan cache
- Update query text if it changed

**Steps:**

1. Open the query set
2. Click "Refresh from Plan Cache"
3. Configure the same filters used when creating the set
4. Review the refresh summary:
   - Queries added
   - Queries removed
   - Total queries after refresh
5. Click "Confirm Refresh"

**Note**: Refreshing does not affect existing test runs or comparisons.

### Managing Queries

**Reorder Queries:**
1. Open query set
2. Click "Reorder"
3. Drag and drop queries to new positions
4. Click "Save Order"

**Edit a Query:**
1. Click the edit icon next to a query
2. Modify the SQL text
3. Click "Save"

**Delete a Query:**
1. Click the delete icon next to a query
2. Confirm deletion
3. Query is soft-deleted (not permanently removed)

---

## Running Performance Tests

### Creating a Test Run

A test run executes all queries in a query set multiple times to gather performance data.

**Steps:**

1. Open a query set
2. Click "Create Test Run"
3. Configure the test run:
   - **Run Label**: Descriptive name (e.g., "Pre-Patch Test")
   - **Iteration Count**: How many times to run each query (1-1000)
   - **Metrics Level**: Amount of data to collect
4. Click "Create and Execute"

### Choosing Iteration Count

**Guidelines:**
- **1-5 iterations**: Quick test, less reliable
- **10-20 iterations**: Good balance (recommended)
- **50-100 iterations**: Very reliable, takes longer
- **100+ iterations**: Statistical analysis, very time-consuming

**Recommendation**: Start with 10 iterations for most use cases.

### Understanding Metrics Levels

**BASIC** (Fastest)
- Execution time
- Rows affected
- Best for: Quick tests, large query sets

**STANDARD** (Recommended)
- Everything in BASIC
- Rows read
- Rows written
- Best for: Most use cases

**COMPREHENSIVE** (Slowest)
- Everything in STANDARD
- CPU time
- I/O wait time
- Lock wait time
- Temporary storage used
- Sort operations
- Index scans
- Table scans
- Best for: Detailed performance analysis

### Monitoring Test Execution

1. After creating a test run, you'll see the execution monitor
2. Watch real-time progress:
   - Current query being executed
   - Current iteration
   - Successful executions
   - Failed executions
3. You can cancel a running test if needed

### Viewing Test Results

After a test run completes:

1. Click on the test run name
2. View summary statistics:
   - Total execution time
   - Average execution time per query
   - Success rate
   - Failed queries (if any)
3. Drill down into individual queries:
   - Click on a query to see detailed results
   - View all iterations
   - See min/max/average times
   - View standard deviation

### Handling Failed Queries

If queries fail during execution:
- The test run continues with remaining queries
- Failed queries are logged with error messages
- View failed queries in the results section
- Investigate error messages to determine cause

**Common Causes:**
- Query timeout
- Lock conflicts
- Insufficient authority
- Invalid SQL syntax
- Referenced objects don't exist

---

## Comparing Test Results

### Why Compare Test Runs?

Comparisons help you:
- Identify performance changes after system modifications
- Detect queries that got faster or slower
- Quantify the impact of changes
- Make informed decisions about system changes

### Creating a Comparison

**Prerequisites:**
- Two completed test runs from the same query set
- Typically: one "before" and one "after" a system change

**Steps:**

1. Click "Comparisons" → "Create New"
2. Select:
   - **Baseline Run**: The "before" test run
   - **Comparison Run**: The "after" test run
   - **Deviation Threshold**: Percentage change to flag (default: 20%)
3. Click "Create Comparison"
4. Wait for analysis to complete

### Understanding Deviation Threshold

The deviation threshold determines which queries are flagged as having significant changes.

**Examples:**
- **10%**: Very sensitive, flags small changes
- **20%**: Recommended for most cases
- **50%**: Only flags major changes

**Formula:**
```
Percent Change = ((New Time - Old Time) / Old Time) × 100

If |Percent Change| >= Threshold, then flagged as deviation
```

### Reading Comparison Results

**Overall Summary:**
- Total queries compared
- Queries with deviations
- Queries improved (faster)
- Queries degraded (slower)
- Overall trend (IMPROVED/DEGRADED/UNCHANGED)
- Average time change

**Query-Level Details:**
- Each query's performance change
- Percent change
- Time difference (milliseconds)
- Improvement or degradation indicator
- Deviation flag

**Example Interpretation:**
```
Query: SELECT * FROM CUSTOMERS WHERE...
Baseline Avg: 500ms
Comparison Avg: 450ms
Time Difference: -50ms
Percent Change: -10%
Status: IMPROVED (10% faster)
Has Deviation: No (below 20% threshold)
```

### Viewing Queries with Deviations

1. Open a comparison
2. Click "Show Deviations Only"
3. See only queries that exceeded the threshold
4. Sorted by magnitude of change (largest first)

### Exporting Comparison Results

1. Open a comparison
2. Click "Export Report"
3. Choose format:
   - HTML (recommended for sharing)
   - PDF (requires additional setup)
   - CSV (for further analysis)
4. Save or print the report

---

## Understanding Metrics

### Execution Time

**What it measures**: Total time from query start to completion

**Interpretation:**
- Lower is better
- Includes all processing time
- Most important metric for user experience

**Typical Values:**
- < 100ms: Very fast
- 100-1000ms: Acceptable
- 1-10 seconds: Slow
- > 10 seconds: Very slow

### Rows Affected

**What it measures**: Number of rows returned (SELECT) or modified (UPDATE/INSERT/DELETE)

**Interpretation:**
- Helps explain execution time
- More rows = typically longer time
- Useful for validating query results

### Rows Read

**What it measures**: Number of rows examined to produce results

**Interpretation:**
- Higher than rows affected = inefficient query
- Indicates table scans or missing indexes
- Target: Close to rows affected

**Example:**
```
Rows Affected: 10
Rows Read: 10,000
Interpretation: Query is reading 1000x more rows than needed
Action: Add index or improve WHERE clause
```

### CPU Time

**What it measures**: Processor time used by the query

**Interpretation:**
- High CPU = computation-intensive query
- May indicate complex calculations or sorts
- Consider query optimization

### I/O Wait Time

**What it measures**: Time waiting for disk reads/writes

**Interpretation:**
- High I/O wait = disk bottleneck
- May indicate missing indexes
- Consider adding indexes or caching

### Lock Wait Time

**What it measures**: Time waiting for locks on database objects

**Interpretation:**
- High lock wait = contention with other jobs
- May indicate need for better transaction management
- Consider query timing or isolation level

### Temporary Storage

**What it measures**: Disk space used for temporary results

**Interpretation:**
- High temp storage = complex query
- May indicate sorts or joins
- Consider query optimization or more memory

### Sort Operations

**What it measures**: Number of sort operations performed

**Interpretation:**
- Sorts are expensive
- May indicate missing indexes
- Consider adding indexes on ORDER BY columns

### Index vs Table Scans

**Index Scans**: Using indexes to find data (good)
**Table Scans**: Reading entire table (bad)

**Interpretation:**
- More index scans = better performance
- Table scans on large tables = slow
- Add indexes to reduce table scans

---

## Best Practices

### Planning Your Tests

1. **Establish a Baseline**
   - Run tests before any system changes
   - Use consistent iteration counts
   - Document system state

2. **Test at Representative Times**
   - Run during typical workload periods
   - Avoid extreme low or high activity times
   - Consider running multiple times

3. **Use Consistent Settings**
   - Same iteration count for comparisons
   - Same metrics level
   - Same deviation threshold

### Creating Effective Query Sets

1. **Group Related Queries**
   - By application
   - By user profile
   - By business function

2. **Include Representative Queries**
   - Mix of simple and complex queries
   - Different statement types
   - Frequently-run queries

3. **Keep Sets Manageable**
   - 20-100 queries per set (recommended)
   - Too few = not representative
   - Too many = long execution time

### Running Tests

1. **Choose Appropriate Iteration Counts**
   - More iterations = more reliable
   - Balance reliability vs. time
   - 10-20 iterations for most cases

2. **Select the Right Metrics Level**
   - BASIC for quick tests
   - STANDARD for most cases
   - COMPREHENSIVE for deep analysis

3. **Monitor System Load**
   - Don't run during peak hours
   - Ensure consistent system state
   - Document any concurrent activity

### Comparing Results

1. **Compare Apples to Apples**
   - Same query set
   - Similar system load
   - Same time of day (if possible)

2. **Set Appropriate Thresholds**
   - 20% for general use
   - Lower for critical queries
   - Higher for less critical queries

3. **Investigate Deviations**
   - Don't just note them
   - Understand the cause
   - Take action if needed

### Maintaining Query Sets

1. **Refresh Regularly**
   - Monthly or quarterly
   - After application changes
   - When queries change

2. **Remove Obsolete Queries**
   - Queries no longer in use
   - Deprecated functionality
   - Keep sets current

3. **Document Changes**
   - Note why queries were added/removed
   - Track query set evolution
   - Maintain history

---

## Troubleshooting

### Login Issues

**Problem**: Cannot log in
**Solutions**:
- Verify IBM i user profile exists
- Check password is correct
- Confirm user is authorized in application
- Contact administrator

**Problem**: "Unauthorized" error after login
**Solutions**:
- User may not be in QRYRUN_USERS table
- Contact administrator to grant access

### Query Set Issues

**Problem**: No queries found in plan cache
**Solutions**:
- Verify user profile has run queries
- Check date range is correct
- Lower minimum execution count
- Verify access to QSYS2.PLAN_CACHE views

**Problem**: Query set refresh fails
**Solutions**:
- Check plan cache filters
- Verify user profile still exists
- Ensure database connection is active

### Test Run Issues

**Problem**: Test run fails to start
**Solutions**:
- Verify query set has queries
- Check iteration count is valid (1-1000)
- Ensure no other test run is running for same set

**Problem**: Many queries failing
**Solutions**:
- Check query syntax
- Verify referenced objects exist
- Ensure sufficient authority
- Review error messages in results

**Problem**: Test run takes too long
**Solutions**:
- Reduce iteration count
- Use BASIC metrics level
- Reduce number of queries in set
- Run during off-peak hours

### Comparison Issues

**Problem**: Cannot create comparison
**Solutions**:
- Verify both test runs are completed
- Ensure test runs are from same query set
- Check test runs have successful executions

**Problem**: All queries show as deviations
**Solutions**:
- Deviation threshold may be too low
- System state may be very different
- Check for system changes between runs

---

## FAQ

### General Questions

**Q: How long does a test run take?**
A: Depends on:
- Number of queries in set
- Iteration count
- Query complexity
- Metrics level
- System load

Example: 50 queries × 10 iterations × 1 second average = ~8 minutes

**Q: Can I run multiple test runs simultaneously?**
A: Yes, but they should be for different query sets to avoid resource contention.

**Q: How much disk space do I need?**
A: Depends on:
- Number of query sets
- Number of test runs
- Metrics level
- Retention period

Estimate: 1-10 MB per test run

**Q: How long should I keep test results?**
A: Recommended:
- Baseline tests: Keep indefinitely
- Regular tests: 90 days
- Comparison tests: 1 year

### Technical Questions

**Q: What is the plan cache?**
A: The plan cache stores information about SQL statements that have been executed, including execution statistics.

**Q: Why do execution times vary between iterations?**
A: Normal variation due to:
- System load
- Cache state
- Lock contention
- I/O patterns

This is why multiple iterations are important.

**Q: What's a good deviation threshold?**
A: 20% is recommended for most cases. Adjust based on:
- Query criticality
- Acceptable performance variation
- System stability

**Q: Can I test queries that modify data?**
A: Yes, but be careful:
- Use test data
- Understand the impact
- Consider using transactions
- May need to reset data between iterations

**Q: How accurate are the metrics?**
A: Very accurate for:
- Execution time
- Row counts

Approximate for:
- CPU time
- I/O wait time
- Other system metrics

### Best Practice Questions

**Q: When should I create a baseline?**
A: Before:
- OS upgrades
- PTF applications
- Database changes
- Application updates
- Hardware changes

**Q: How often should I run tests?**
A: Recommended:
- Baseline: Before any major change
- Validation: After any major change
- Regular monitoring: Monthly or quarterly

**Q: Should I test in production?**
A: Considerations:
- **Pros**: Real data, real performance
- **Cons**: May impact users
- **Recommendation**: Test during off-peak hours or in test environment

**Q: What queries should I include in a set?**
A: Include:
- Frequently-run queries
- Business-critical queries
- Known slow queries
- Representative sample of all query types

---

## Getting Help

### Resources

- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`
- **Database Schema**: `DATABASE_SCHEMA.md`

### Support

For technical issues:
1. Check this user guide
2. Review error messages in application logs
3. Contact your system administrator
4. Consult IBM i documentation

### Feedback

We welcome feedback on:
- Feature requests
- Bug reports
- Documentation improvements
- Usability suggestions

---

## Appendix

### Glossary

- **Baseline**: Initial performance measurement before changes
- **Deviation**: Performance change exceeding threshold
- **Iteration**: Single execution of a query
- **Metrics**: Performance measurements
- **Plan Cache**: IBM i system view of executed SQL
- **Query Set**: Collection of queries for testing
- **Test Run**: Execution of all queries in a set
- **Threshold**: Percentage change to flag as significant

### Keyboard Shortcuts

(To be implemented in frontend)

### Tips and Tricks

1. **Name query sets descriptively**: Include date and purpose
2. **Use consistent naming**: Makes comparisons easier
3. **Document system changes**: Note what changed between tests
4. **Review deviations promptly**: Don't let issues accumulate
5. **Share results**: Communicate findings to stakeholders

---

## Conclusion

The IBM i Query Runner is a powerful tool for managing and monitoring SQL query performance. By following the practices in this guide, you can:
- Establish reliable performance baselines
- Detect performance changes early
- Make informed decisions about system changes
- Maintain optimal query performance

Happy testing!