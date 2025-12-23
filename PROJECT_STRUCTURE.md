# Query Runner - Project Structure

```
ibmi_query_runner/
├── README.md                           # Main documentation
├── backend/                            # Next.js + Express backend
│   ├── package.json                    # Dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── next.config.js                  # Next.js config
│   ├── server.ts                       # Express server entry point
│   ├── .env.example                    # Environment variables template
│   ├── .gitignore
│   ├── config/
│   │   ├── concurrency.conf            # Max concurrent runs (5)
│   │   └── debug.conf                  # Debug mode & log level
│   ├── scripts/
│   │   ├── init-app.ts                 # Initialize Vault, DB, admin user
│   │   └── init-db.ts                  # Initialize database schema
│   ├── src/
│   │   ├── db/
│   │   │   └── pool.ts                 # PostgreSQL connection pool
│   │   ├── services/
│   │   │   ├── vaultService.ts         # Vault credential management
│   │   │   ├── databaseService.ts      # Database initialization
│   │   │   ├── executionService.ts     # Query execution orchestration
│   │   │   └── comparisonService.ts    # Run comparison & CSV export
│   │   ├── utils/
│   │   │   ├── encryption.ts           # AES-256-GCM encryption
│   │   │   ├── jwt.ts                  # JWT token generation
│   │   │   ├── logger.ts               # Redacted audit logging
│   │   │   └── config.ts               # Configuration loading
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # JWT authentication
│   │   │   └── errorHandler.ts         # Error handling
│   │   ├── pages/
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login.ts        # User login
│   │   │   │   │   ├── change-password.ts
│   │   │   │   │   ├── logout.ts
│   │   │   │   │   └── me.ts           # Get current user
│   │   │   │   ├── credentials/
│   │   │   │   │   ├── index.ts        # Create/list/update/delete credentials
│   │   │   │   │   └── usage.ts        # Show query sets using credential
│   │   │   │   ├── query-sets/
│   │   │   │   │   ├── index.ts        # List/create query sets
│   │   │   │   │   ├── [id].ts         # Get/update/delete query set
│   │   │   │   │   └── [id]/duplicate.ts # Duplicate query set
│   │   │   │   ├── queries/
│   │   │   │   │   ├── [setId].ts      # Add/list queries
│   │   │   │   │   └── [id].ts         # Update/delete query
│   │   │   │   ├── runs/
│   │   │   │   │   └── index.ts        # Execute/list runs
│   │   │   │   └── comparisons/
│   │   │   │       └── index.ts        # Compare runs, CSV export
│   │   │   ├── components/             # React components (TBD)
│   │   │   └── pages/                  # Frontend pages (TBD)
│
├── javaservice/                        # Spring Boot Java microservice
│   ├── pom.xml                         # Maven dependencies
│   ├── README.md
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/queryrunner/jt400/
│   │   │   │   ├── JT400QueryServiceApplication.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── JT400DataSourceConfig.java
│   │   │   │   │   ├── JwtConfig.java
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   ├── security/
│   │   │   │   │   └── JwtAuthenticationFilter.java
│   │   │   │   ├── controller/
│   │   │   │   │   └── QueryController.java
│   │   │   │   ├── service/
│   │   │   │   │   └── JT400QueryService.java
│   │   │   │   └── model/
│   │   │   │       ├── QueryExecutionRequest.java
│   │   │   │       └── QueryExecutionResponse.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                       # Unit tests (TBD)

## Key Features

### Backend
- ✅ User authentication with Argon2 hashing
- ✅ Session management with PostgreSQL store
- ✅ JWT token generation and validation
- ✅ Vault integration for credential storage
- ✅ Admin credential management
- ✅ Query set management with duplication
- ✅ Query CRUD operations
- ✅ Per-user concurrent run enforcement (max 5)
- ✅ Query execution orchestration
- ✅ Run comparison engine
- ✅ CSV export functionality
- ✅ Comprehensive audit logging
- ✅ Redactable sensitive data in logs
- ✅ Configuration management

### Frontend
- ⏳ Login/password change UI
- ⏳ Query set management UI
- ⏳ Query editor
- ⏳ Execution monitoring
- ⏳ Result visualization
- ⏳ Comparison interface
- ⏳ Admin panel for credentials
- ⏳ Audit log viewer

### Java Microservice
- ✅ JT400 JDBC driver integration
- ✅ HikariCP connection pooling
- ✅ TLS/SSL support
- ✅ JWT authentication
- ✅ Query execution with timeout
- ✅ Error handling and reporting
- ✅ Health check endpoints
- ✅ Request/response logging

### Database
- ✅ PostgreSQL schema
- ✅ Row-level security
- ✅ Audit logging table
- ✅ Session store table
- ✅ Connection indexes

## Environment Variables

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=query_runner
DB_USER=qrapp
DB_PASSWORD=your_secure_password

# Vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your_vault_token
VAULT_MOUNT_PATH=secret

# Session & JWT
SESSION_SECRET=your_session_secret_key
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# Services
JAVA_SERVICE_URL=http://localhost:8080
JAVA_SERVICE_JWT_SECRET=your_java_service_jwt_secret

# Logging
LOG_LEVEL=info
DEBUG_MODE=false

# Configuration
MAX_CONCURRENT_RUNS=5
```

## Technology Stack

- **Frontend**: React 19, Next.js 15
- **Backend**: Express.js 5, Node.js 24
- **Database**: PostgreSQL 15
- **Java Service**: Spring Boot 3.2, Java 17
- **Database Driver**: JT400 21.0.6
- **Connection Pool**: HikariCP 7.0.2
- **Authentication**: JWT, Argon2
- **Encryption**: Native Node.js crypto (AES-256-GCM)
- **Vault**: HashiCorp Vault 1.16+
- **Session Store**: PostgreSQL

## API Response Format

All API endpoints return JSON:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors return appropriate HTTP status codes (400, 401, 403, 404, 500, etc.)

## Next Steps

1. Create frontend React components
2. Implement SQL Plan Cache import
3. Set up comprehensive integration tests
4. Create deployment scripts
5. Set up CI/CD pipeline
6. Create user documentation
7. Performance optimization
8. Production monitoring and alerting
```

This structure provides a complete, scalable foundation for the Query Runner application.
