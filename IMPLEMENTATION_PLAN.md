# IBM i Query Runner - Implementation Plan

## Project Summary

A full-stack web application for IBM i that allows users to:
1. Import SQL queries from the plan cache into organized query sets
2. Execute query sets multiple times with configurable iterations
3. Record detailed performance metrics
4. Compare test runs before and after system changes (patches, OS upgrades)
5. Identify performance regressions and improvements

## Key Requirements Gathered

### Core Functionality
- **Query Sets**: Organize queries by user profile and import date
- **Query Set Refresh**: Sync with plan cache to add/remove/update queries
- **Test Runs**: Execute query sets with configurable iterations
- **Metrics Collection**: User-configurable detail levels (Basic, Standard, Comprehensive)
- **Comparison Analysis**: Compare two test runs with configurable deviation threshold (default 20%)
- **Results Viewing**: Both set-level and query-level drill-down
- **HTML Export**: Generate printable comparison reports

### Technical Stack
- **Backend**: Node.js with Express.js
- **Database**: Db2 for i with node-jt400 (JDBC)
- **Frontend**: Vue.js 3 with Tailwind CSS
- **Authentication**: IBM i user profiles with access control
- **Real-time Updates**: WebSocket for execution progress

### Configuration Flexibility
- **Database Library**: User-configurable (use SET SCHEMA, not hard-coded)
- **IFS Installation Path**: User-configurable root directory
- **Deviation Threshold**: User-configurable percentage (default 20%)
- **Metrics Level**: User-selectable per test run

### Error Handling
- Continue execution on query failures
- Log all errors for review
- Track failures in comparison reports

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vue.js Frontend                          │
│  (Query Set Management, Test Runs, Comparisons, Reports)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                  Express.js Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Query Set    │  │ Execution    │  │ Comparison   │      │
│  │ Manager      │  │ Engine       │  │ Engine       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │ JDBC (node-jt400)
┌─────────────────────▼───────────────────────────────────────┐
│                    Db2 for i                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Query Sets   │  │ Test Runs    │  │ Comparisons  │      │
│  │ & Queries    │  │ & Executions │  │ & Details    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         QSYS2.PLAN_CACHE Views                   │      │
│  └──────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables (9 tables)
1. **QRYRUN_USERS** - Authorized users
2. **QRYRUN_QUERY_SETS** - Query set definitions
3. **QRYRUN_QUERIES** - Individual queries in sets
4. **QRYRUN_SET_REFRESH_LOG** - Refresh operation history
5. **QRYRUN_TEST_RUNS** - Test run configurations
6. **QRYRUN_EXECUTIONS** - Individual query executions
7. **QRYRUN_METRICS** - Detailed performance metrics
8. **QRYRUN_COMPARISONS** - Comparison results
9. **QRYRUN_COMPARISON_DETAILS** - Per-query comparison details
10. **QRYRUN_CONFIG** - Application configuration

### Key Features
- Library-agnostic (uses SET SCHEMA)
- Foreign key constraints for referential integrity
- Comprehensive indexing for performance
- Audit trails for all operations
- Support for CLOB fields for large queries

## Implementation Phases

### Phase 1: Foundation (Backend Core)
**Goal**: Set up backend infrastructure and database connectivity

**Tasks**:
1. Initialize Node.js project structure
2. Configure node-jt400 database connection
3. Implement database utility functions
4. Create base models for all tables
5. Set up logging and error handling
6. Implement JWT-based authentication
7. Create user management endpoints

**Deliverables**:
- Working backend server
- Database connection established
- Authentication working
- User CRUD operations

### Phase 2: Query Set Management
**Goal**: Implement query set creation and refresh functionality

**Tasks**:
1. Create plan cache service to query QSYS2 views
2. Implement query set creation logic
3. Build query hash generation for duplicate detection
4. Implement query set refresh algorithm
5. Create query set CRUD endpoints
6. Build query management endpoints
7. Implement refresh history tracking

**Deliverables**:
- Query set creation from plan cache
- Query set refresh functionality
- Complete query set API

### Phase 3: Test Run Execution
**Goal**: Implement query execution engine

**Tasks**:
1. Build query execution service
2. Implement iteration logic
3. Create metrics collection (3 levels)
4. Build execution progress tracking
5. Implement WebSocket for real-time updates
6. Create test run CRUD endpoints
7. Build results aggregation logic

**Deliverables**:
- Working execution engine
- Real-time progress updates
- Set and query-level results

### Phase 4: Comparison Engine
**Goal**: Implement comparison and analysis functionality

**Tasks**:
1. Build comparison service
2. Implement deviation detection algorithm
3. Create set-level comparison logic
4. Build query-level comparison logic
5. Implement comparison endpoints
6. Create HTML report generator

**Deliverables**:
- Comparison functionality
- Deviation detection
- HTML report export

### Phase 5: Frontend Foundation
**Goal**: Set up Vue.js frontend with core components

**Tasks**:
1. Initialize Vue.js project with Vite
2. Configure Tailwind CSS
3. Set up Vue Router
4. Configure Pinia stores
5. Create API service layer
6. Build common components (header, sidebar, etc.)
7. Implement authentication UI

**Deliverables**:
- Working frontend application
- Navigation structure
- Login functionality

### Phase 6: Query Set UI
**Goal**: Build query set management interface

**Tasks**:
1. Create query set list view
2. Build plan cache filter interface
3. Implement query preview dialog
4. Create query set detail view
5. Build query set refresh UI
6. Implement refresh history view

**Deliverables**:
- Complete query set management UI
- Plan cache import interface
- Refresh functionality

### Phase 7: Test Run UI
**Goal**: Build test run and execution interface

**Tasks**:
1. Create test run list view
2. Build test run configuration form
3. Implement execution monitoring dashboard
4. Create results viewer (set-level)
5. Build query-level results drill-down
6. Implement real-time progress display

**Deliverables**:
- Test run management UI
- Execution monitoring
- Results viewing

### Phase 8: Comparison UI
**Goal**: Build comparison and reporting interface

**Tasks**:
1. Create comparison list view
2. Build comparison configuration form
3. Implement comparison results display
4. Create deviation visualization
5. Build HTML report preview
6. Implement report export

**Deliverables**:
- Comparison UI
- Report generation
- Export functionality

### Phase 9: Polish and Documentation
**Goal**: Finalize application and create documentation

**Tasks**:
1. Implement user management UI (admin)
2. Create settings/configuration UI
3. Add error handling and validation
4. Write API documentation
5. Create user guide
6. Write deployment guide
7. Create installation scripts

**Deliverables**:
- Complete application
- Full documentation
- Deployment scripts

### Phase 10: Testing and Deployment
**Goal**: Test and deploy to IBM i

**Tasks**:
1. Unit testing (backend)
2. Integration testing
3. UI testing
4. Performance testing
5. Security review
6. Create deployment package
7. Deploy to IBM i
8. User acceptance testing

**Deliverables**:
- Tested application
- Deployed to IBM i
- Production-ready

## Key Workflows

### 1. Query Set Creation Workflow
```
User → Select Filters → Preview Queries → Name Set → Import
  ↓
System queries plan cache → Calculates hashes → Creates set → Imports queries
  ↓
Query set created with all queries
```

### 2. Query Set Refresh Workflow
```
User → Initiates Refresh
  ↓
System queries plan cache with original filters
  ↓
Compares with existing queries:
  - Add new queries
  - Mark removed queries as inactive
  - Update changed queries
  - Keep unchanged queries
  ↓
Logs refresh operation → Updates set
```

### 3. Test Run Execution Workflow
```
User → Creates Test Run → Configures (iterations, metrics) → Starts
  ↓
For each query in set:
  For each iteration:
    Execute query → Record metrics → Update progress
  ↓
Calculate statistics → Update run status → Notify user
```

### 4. Comparison Workflow
```
User → Selects two runs → Sets threshold → Creates comparison
  ↓
System calculates:
  - Set-level average change
  - Per-query statistics
  - Deviation categorization
  ↓
Displays results → Allows export to HTML
```

## Success Criteria

### Functional Requirements
- ✓ Import queries from plan cache by user profile
- ✓ Organize queries into sets
- ✓ Refresh query sets from plan cache
- ✓ Execute query sets with configurable iterations
- ✓ Collect performance metrics at multiple levels
- ✓ Compare test runs before/after changes
- ✓ Identify performance deviations
- ✓ Export comparison reports
- ✓ View results at set and query levels

### Non-Functional Requirements
- ✓ Configurable database library
- ✓ Configurable IFS installation path
- ✓ IBM i user profile authentication
- ✓ Access control (QSECOFR always granted)
- ✓ Continue on query failures
- ✓ Real-time execution progress
- ✓ Responsive web interface
- ✓ Comprehensive error logging

## Risk Mitigation

### Technical Risks
1. **node-jt400 Performance**: Mitigate with connection pooling
2. **Large Query Sets**: Implement pagination and streaming
3. **Long-Running Queries**: Add timeout configuration
4. **WebSocket Reliability**: Implement reconnection logic

### Operational Risks
1. **Plan Cache Access**: Ensure proper authorities
2. **Database Growth**: Implement data retention policies
3. **Concurrent Executions**: Add execution queue management
4. **Resource Usage**: Monitor and limit parallel executions

## Next Steps

1. **Review this plan** - Confirm all requirements are captured
2. **Approve architecture** - Validate technical approach
3. **Switch to Code mode** - Begin implementation
4. **Start with Phase 1** - Build foundation first

## Questions for Consideration

Before starting implementation, consider:

1. Should we add query timeout configuration?
2. Do you want email notifications when test runs complete?
3. Should we support exporting to CSV in addition to HTML?
4. Do you want to track query execution history over time (trending)?
5. Should we add a dashboard with summary statistics?

## Estimated Timeline

- **Phase 1-2**: 2-3 weeks (Backend foundation + Query sets)
- **Phase 3-4**: 2-3 weeks (Execution + Comparison)
- **Phase 5-6**: 2 weeks (Frontend foundation + Query set UI)
- **Phase 7-8**: 2 weeks (Test run + Comparison UI)
- **Phase 9-10**: 1-2 weeks (Polish + Testing)

**Total**: 9-12 weeks for complete implementation

## Resources Required

- IBM i system with Db2 for i access
- Node.js runtime on IBM i (or separate server)
- Access to QSYS2.PLAN_CACHE views
- User profiles for testing
- Development environment

---

**Ready to proceed?** Review this plan and let me know if you'd like any changes before we switch to Code mode to begin implementation.