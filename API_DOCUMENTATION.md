# IBM i Query Runner - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All API endpoints (except `/health` and `/api/auth/login`) require JWT authentication.

### Headers
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Login
Authenticate with IBM i credentials and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "userId": "MYUSER",
  "password": "mypassword"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "MYUSER",
    "userName": "My User",
    "email": "myuser@example.com",
    "isAdmin": false
  }
}
```

### Logout
Invalidate current session.

**Endpoint:** `POST /api/auth/logout`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Check Session
Verify current session is valid.

**Endpoint:** `GET /api/auth/session`

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "userId": "MYUSER",
    "userName": "My User",
    "isAdmin": false
  }
}
```

---

## User Management Endpoints

### List Users
Get all users (admin only) or current user.

**Endpoint:** `GET /api/users`

**Query Parameters:**
- `userId` (optional) - Get specific user

**Response:** `200 OK`
```json
{
  "success": true,
  "users": [
    {
      "USER_ID": "MYUSER",
      "USER_NAME": "My User",
      "EMAIL": "myuser@example.com",
      "IS_ADMIN": 0,
      "CREATED_AT": "2024-01-01T00:00:00.000Z",
      "LAST_LOGIN": "2024-01-02T10:30:00.000Z"
    }
  ]
}
```

### Create User
Create a new user (admin only).

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "userId": "NEWUSER",
  "userName": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "isAdmin": false
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "user": {
    "userId": "NEWUSER",
    "userName": "New User",
    "email": "newuser@example.com",
    "isAdmin": false
  }
}
```

### Delete User
Delete a user (admin only).

**Endpoint:** `DELETE /api/users/:userId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Plan Cache Endpoints

### Get Available Views
List available plan cache views.

**Endpoint:** `GET /api/plan-cache/views`

**Response:** `200 OK`
```json
{
  "success": true,
  "views": [
    {
      "name": "PLAN_CACHE_INFO",
      "description": "Detailed plan cache information including statement text",
      "schema": "QSYS2"
    },
    {
      "name": "PLAN_CACHE",
      "description": "Basic plan cache information",
      "schema": "QSYS2"
    }
  ]
}
```

### Query Plan Cache
Query plan cache with filters.

**Endpoint:** `POST /api/plan-cache/query`

**Request Body:**
```json
{
  "view": "PLAN_CACHE_INFO",
  "userProfile": "MYUSER",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-01-31",
  "minExecutionCount": 10,
  "limit": 100
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 25,
  "queries": [
    {
      "STATEMENT_TEXT": "SELECT * FROM MYTABLE WHERE...",
      "USER_NAME": "MYUSER",
      "LAST_RUN_TIMESTAMP": "2024-01-15T14:30:00.000Z",
      "NUMBER_RUNS": 150,
      "AVERAGE_ELAPSED_TIME": 250.5,
      "STATEMENT_TYPE": "SELECT"
    }
  ]
}
```

### Preview Queries
Preview queries with statistics before importing.

**Endpoint:** `POST /api/plan-cache/preview`

**Request Body:** Same as Query Plan Cache

**Response:** `200 OK`
```json
{
  "success": true,
  "queries": [...],
  "statistics": {
    "totalQueries": 25,
    "uniqueStatementTypes": ["SELECT", "UPDATE", "INSERT"],
    "dateRange": {
      "earliest": "2024-01-01T00:00:00.000Z",
      "latest": "2024-01-31T23:59:59.000Z"
    },
    "totalExecutions": 5000
  },
  "filters": {...}
}
```

---

## Query Set Endpoints

### Create Query Set from Plan Cache
Import queries from plan cache into a new query set.

**Endpoint:** `POST /api/query-sets/from-plan-cache`

**Request Body:**
```json
{
  "setName": "Pre-Patch Baseline",
  "description": "Queries before system patch",
  "userProfile": "MYUSER",
  "planCacheFilters": {
    "view": "PLAN_CACHE_INFO",
    "userProfile": "MYUSER",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31",
    "minExecutionCount": 10,
    "limit": 100
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "querySet": {
    "setId": "QS1704067200000",
    "setName": "Pre-Patch Baseline",
    "description": "Queries before system patch",
    "userProfile": "MYUSER",
    "createdBy": "MYUSER",
    "queryCount": 25
  }
}
```

### Create Query Set Manually
Create a query set with manually provided queries.

**Endpoint:** `POST /api/query-sets/manual`

**Request Body:**
```json
{
  "setName": "Custom Query Set",
  "description": "Manually created queries",
  "userProfile": "MYUSER",
  "queries": [
    {
      "statementText": "SELECT * FROM TABLE1",
      "statementType": "SELECT"
    },
    {
      "statementText": "UPDATE TABLE2 SET COL1 = 'value'",
      "statementType": "UPDATE"
    }
  ]
}
```

**Response:** `201 Created`

### List Query Sets
Get all query sets with optional filters.

**Endpoint:** `GET /api/query-sets`

**Query Parameters:**
- `userProfile` (optional) - Filter by user profile
- `createdBy` (optional) - Filter by creator

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "querySets": [
    {
      "SET_ID": "QS1704067200000",
      "SET_NAME": "Pre-Patch Baseline",
      "DESCRIPTION": "Queries before system patch",
      "USER_PROFILE": "MYUSER",
      "CREATED_BY": "MYUSER",
      "CREATED_AT": "2024-01-01T00:00:00.000Z",
      "LAST_REFRESHED_AT": null,
      "QUERY_COUNT": 25
    }
  ]
}
```

### Get Query Set by ID
Get a specific query set with all its queries.

**Endpoint:** `GET /api/query-sets/:setId`

**Response:** `200 OK`
```json
{
  "success": true,
  "querySet": {
    "SET_ID": "QS1704067200000",
    "SET_NAME": "Pre-Patch Baseline",
    "queries": [
      {
        "QUERY_ID": "Q17040672000001",
        "QUERY_TEXT": "SELECT * FROM TABLE1",
        "QUERY_HASH": "abc123...",
        "SEQUENCE_NUMBER": 1,
        "STATEMENT_TYPE": "SELECT"
      }
    ]
  }
}
```

### Update Query Set
Update query set metadata.

**Endpoint:** `PUT /api/query-sets/:setId`

**Request Body:**
```json
{
  "setName": "Updated Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

### Delete Query Set
Delete a query set (soft delete).

**Endpoint:** `DELETE /api/query-sets/:setId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Query set deleted successfully"
}
```

### Refresh Query Set
Refresh query set from current plan cache state.

**Endpoint:** `POST /api/query-sets/:setId/refresh`

**Request Body:**
```json
{
  "planCacheFilters": {
    "view": "PLAN_CACHE_INFO",
    "userProfile": "MYUSER",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "addedCount": 5,
  "deactivatedCount": 2,
  "totalQueries": 28
}
```

---

## Query Endpoints

### Get Query by ID
Get a specific query.

**Endpoint:** `GET /api/queries/:queryId`

**Response:** `200 OK`

### Add Query to Set
Add a new query to an existing query set.

**Endpoint:** `POST /api/queries/sets/:setId`

**Request Body:**
```json
{
  "queryText": "SELECT * FROM NEWTABLE",
  "statementType": "SELECT",
  "sequenceNumber": 10
}
```

**Response:** `201 Created`

### Update Query
Update query text or sequence.

**Endpoint:** `PUT /api/queries/:queryId`

**Request Body:**
```json
{
  "queryText": "SELECT * FROM NEWTABLE WHERE...",
  "sequenceNumber": 5
}
```

**Response:** `200 OK`

### Delete Query
Delete a query (soft delete).

**Endpoint:** `DELETE /api/queries/:queryId`

**Response:** `200 OK`

### Reorder Queries
Reorder queries within a set.

**Endpoint:** `POST /api/queries/sets/:setId/reorder`

**Request Body:**
```json
{
  "queryOrder": ["Q1704067200001", "Q1704067200003", "Q1704067200002"]
}
```

**Response:** `200 OK`

---

## Test Run Endpoints

### Create Test Run
Create a new test run for a query set.

**Endpoint:** `POST /api/test-runs`

**Request Body:**
```json
{
  "setId": "QS1704067200000",
  "runLabel": "Pre-Patch Baseline Run",
  "iterationCount": 10,
  "metricsLevel": "STANDARD"
}
```

**Metrics Levels:**
- `BASIC` - Execution time and row counts only
- `STANDARD` - Adds rows read/written
- `COMPREHENSIVE` - Full performance metrics

**Response:** `201 Created`
```json
{
  "success": true,
  "testRun": {
    "runId": "TR1704067200000",
    "setId": "QS1704067200000",
    "runLabel": "Pre-Patch Baseline Run",
    "iterationCount": 10,
    "metricsLevel": "STANDARD",
    "status": "PENDING",
    "createdBy": "MYUSER"
  }
}
```

### List Test Runs
Get all test runs with optional filters.

**Endpoint:** `GET /api/test-runs`

**Query Parameters:**
- `status` (optional) - Filter by status
- `createdBy` (optional) - Filter by creator

**Response:** `200 OK`

### Get Test Runs for Query Set
Get all test runs for a specific query set.

**Endpoint:** `GET /api/test-runs/set/:setId`

**Response:** `200 OK`

### Get Test Run by ID
Get a specific test run with summary.

**Endpoint:** `GET /api/test-runs/:runId`

**Response:** `200 OK`
```json
{
  "success": true,
  "testRun": {
    "RUN_ID": "TR1704067200000",
    "SET_ID": "QS1704067200000",
    "RUN_LABEL": "Pre-Patch Baseline Run",
    "STATUS": "COMPLETED",
    "TOTAL_QUERIES": 25,
    "SUCCESSFUL_QUERIES": 24,
    "FAILED_QUERIES": 1,
    "TOTAL_EXECUTION_TIME": 125000,
    "executionSummary": {
      "TOTAL_EXECUTIONS": 250,
      "SUCCESSFUL_EXECUTIONS": 240,
      "FAILED_EXECUTIONS": 10,
      "AVG_EXECUTION_TIME": 500
    }
  }
}
```

### Execute Test Run
Start execution of a test run.

**Endpoint:** `POST /api/test-runs/:runId/execute`

**Response:** `202 Accepted`
```json
{
  "success": true,
  "message": "Test run execution started",
  "runId": "TR1704067200000"
}
```

### Cancel Test Run
Cancel a running test run.

**Endpoint:** `POST /api/test-runs/:runId/cancel`

**Response:** `200 OK`

### Get Test Run Results
Get detailed execution results.

**Endpoint:** `GET /api/test-runs/:runId/results`

**Response:** `200 OK`
```json
{
  "success": true,
  "results": {
    "testRun": {...},
    "executions": [...],
    "failedExecutions": [...],
    "metrics": {...}
  }
}
```

### Delete Test Run
Delete a test run.

**Endpoint:** `DELETE /api/test-runs/:runId`

**Response:** `200 OK`

---

## Comparison Endpoints

### Create Comparison
Compare two test runs.

**Endpoint:** `POST /api/comparisons`

**Request Body:**
```json
{
  "baselineRunId": "TR1704067200000",
  "comparisonRunId": "TR1704067300000",
  "deviationThreshold": 20
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "comparison": {
    "COMPARISON_ID": "CMP1704067400000",
    "BASELINE_RUN_ID": "TR1704067200000",
    "COMPARISON_RUN_ID": "TR1704067300000",
    "DEVIATION_THRESHOLD": 20,
    "TOTAL_QUERIES_COMPARED": 25,
    "QUERIES_WITH_DEVIATION": 5,
    "QUERIES_IMPROVED": 3,
    "QUERIES_DEGRADED": 2,
    "AVG_BASELINE_TIME": 500,
    "AVG_COMPARISON_TIME": 480,
    "OVERALL_CHANGE_PERCENT": -4.0
  }
}
```

### List Comparisons
Get all comparisons with optional filters.

**Endpoint:** `GET /api/comparisons`

**Query Parameters:**
- `baselineRunId` (optional)
- `comparisonRunId` (optional)
- `createdBy` (optional)

**Response:** `200 OK`

### Get Comparison by ID
Get a specific comparison with details.

**Endpoint:** `GET /api/comparisons/:comparisonId`

**Response:** `200 OK`
```json
{
  "success": true,
  "comparison": {
    "COMPARISON_ID": "CMP1704067400000",
    "baselineRun": {...},
    "comparisonRun": {...},
    "details": [
      {
        "QUERY_ID": "Q1704067200001",
        "BASELINE_AVG_TIME": 500,
        "COMPARISON_AVG_TIME": 450,
        "TIME_DIFFERENCE": -50,
        "PERCENT_CHANGE": -10.0,
        "HAS_DEVIATION": 0,
        "IS_IMPROVEMENT": 1,
        "QUERY_TEXT": "SELECT * FROM TABLE1",
        "SEQUENCE_NUMBER": 1
      }
    ]
  }
}
```

### Get Comparison Summary
Get comparison summary with insights.

**Endpoint:** `GET /api/comparisons/:comparisonId/summary`

**Response:** `200 OK`
```json
{
  "success": true,
  "summary": {
    ...comparison data...,
    "insights": {
      "overallTrend": "IMPROVED",
      "significantChanges": true,
      "improvementRate": 60.0,
      "degradationRate": 40.0
    }
  }
}
```

### Get Queries with Deviations
Get only queries that exceeded the deviation threshold.

**Endpoint:** `GET /api/comparisons/:comparisonId/deviations`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "deviations": [
    {
      "QUERY_ID": "Q1704067200005",
      "BASELINE_AVG_TIME": 1000,
      "COMPARISON_AVG_TIME": 1500,
      "TIME_DIFFERENCE": 500,
      "PERCENT_CHANGE": 50.0,
      "IS_IMPROVEMENT": 0,
      "QUERY_TEXT": "SELECT * FROM BIGTABLE",
      "SEQUENCE_NUMBER": 5
    }
  ]
}
```

### Delete Comparison
Delete a comparison.

**Endpoint:** `DELETE /api/comparisons/:comparisonId`

**Response:** `200 OK`

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource conflict
- `DATABASE_ERROR` - Database operation failed
- `QUERY_EXECUTION_ERROR` - Query execution failed
- `INVALID_OPERATION` - Operation not allowed in current state

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `202` - Accepted (async operation started)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

---

## Pagination

Endpoints that return lists support pagination through query parameters:
- `limit` - Number of results per page (default: 100, max: 1000)
- `offset` - Number of results to skip (default: 0)

Example:
```
GET /api/query-sets?limit=50&offset=100
```

---

## Health Check

Check API and database connectivity.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production"
}