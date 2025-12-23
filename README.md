# Query Runner - IBM i Db2 Query Testing Platform

A comprehensive web-based application for testing, running, and comparing queries against IBM i DB2 databases with secure credential management, multi-user support, and detailed execution analytics.

## Architecture

### Components

1. **Next.js + React Frontend** (Port 3000)
   - Browser-based UI for query management and execution
   - Session-based authentication with password change on first login
   - Query set management, editing, and duplication
   - Real-time execution monitoring and result visualization
   - Comparison analytics with +/- 20% threshold highlighting
   - CSV export of comparisons and results

2. **Express.js Backend** (Port 3000)
   - RESTful API for all operations
   - User authentication and authorization
   - Session management with PostgreSQL store
   - Query execution orchestration
   - Concurrent run enforcement (max 5 per user, configurable)

3. **Spring Boot Java Microservice** (Port 8080)
   - JT400 JDBC driver integration
   - Secure connections to IBM i DB2 via TLS
   - Connection pooling (HikariCP, 10-15 connections)
   - Query execution with timeout handling
   - Bearer token validation for inter-service communication

4. **PostgreSQL Database**
   - Users, credentials, query sets, queries
   - Execution runs and results
   - Comparison snapshots
   - Audit logging
   - Session store

5. **HashiCorp Vault**
   - AES256 encrypted credential storage
   - Auto-initialization on first deployment
   - Per-credential storage under `secret/data/ibmi/<credential_id>`

## System Requirements

### Development Environment
- **OS**: CentOS 10 (Linux)
- **Node.js**: v24.12.0 or higher
- **Java**: Java 17 (OpenJDK or Oracle)
- **PostgreSQL**: 15.x or higher
- **HashiCorp Vault**: 1.16.x or higher
- **Git**: For version control

### Network Requirements
- Port 3000: Next.js frontend + Express backend
- Port 8080: Spring Boot Java microservice
- Port 5432: PostgreSQL (local or remote)
- Port 8200: HashiCorp Vault (local or remote)
- Port 9050: IBM i Host Server (for JDBC connections)

## Installation

### 1. Prerequisites Setup

```bash
# Update system
sudo yum update -y

# Install Node.js 24
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo yum install -y nodejs

# Install Java 17
sudo yum install -y java-17-openjdk java-17-openjdk-devel

# Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib

# Install HashiCorp Vault
wget https://releases.hashicorp.com/vault/1.16.0/vault_1.16.0_linux_amd64.zip
unzip vault_1.16.0_linux_amd64.zip
sudo mv vault /usr/local/bin/
sudo chmod +x /usr/local/bin/vault
```

### 2. Clone Repository

```bash
git clone https://github.com/yourusername/ibmi_query_runner.git
cd ibmi_query_runner
```

### 3. Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Install dependencies
npm install

# Build for production
npm run build
```

### 4. Java Microservice Setup

```bash
cd ../javaservice

# Build with Maven
mvn clean package

# The built JAR will be in target/jt400-query-service-1.0.0.jar
```

### 5. PostgreSQL Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE query_runner;
CREATE USER qrapp WITH PASSWORD 'your_secure_password';
ALTER ROLE qrapp SET client_encoding TO 'utf8';
ALTER ROLE qrapp SET default_transaction_isolation TO 'read committed';
ALTER ROLE qrapp SET default_transaction_deferrable TO off;
ALTER ROLE qrapp SET default_transaction_read_only TO off;
ALTER ROLE qrapp SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE query_runner TO qrapp;
EOF
```

### 6. HashiCorp Vault Setup

```bash
# Start Vault in dev mode (for testing only)
vault server -dev

# Or configure for production
# See: https://www.vaultproject.io/docs

# Set VAULT_ADDR and VAULT_TOKEN in your .env
export VAULT_ADDR="http://localhost:8200"
export VAULT_TOKEN="your-root-token"
```

### 7. Application Initialization

```bash
cd backend

# Initialize app (Vault, Database, Admin user)
npm run init

# Check the log file for initial admin password
cat /var/log/query_runner/qradmin_password.log
```

## Running the Application

### Development Mode

```bash
# Terminal 1: Backend + Frontend
cd backend
npm run dev

# Terminal 2: Java Microservice
cd javaservice
java -jar target/jt400-query-service-1.0.0.jar
```

### Production Mode

```bash
# Start Java Microservice
cd javaservice
java -jar target/jt400-query-service-1.0.0.jar &

# Start Backend + Frontend
cd backend
npm start
```

## Configuration Files

### Backend Configuration

- **`.env`** - Environment variables (database, Vault, Java service URLs)
- **`config/concurrency.conf`** - Max concurrent runs per user (default: 5)
- **`config/debug.conf`** - Debug mode and credential redaction

### Java Microservice Configuration

- **`src/main/resources/application.properties`** - Server port, JT400 settings, SSL/TLS

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password (required on first login)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Credentials (Admin only)
- `GET /api/credentials` - List all DB credentials
- `POST /api/credentials` - Create new credential
- `PUT /api/credentials` - Update credential password
- `DELETE /api/credentials?id=X` - Delete credential
- `GET /api/credentials/usage?credentialId=X` - Show query sets using credential

### Query Sets
- `GET /api/query-sets` - List user's query sets
- `POST /api/query-sets` - Create query set
- `GET /api/query-sets/[id]` - Get query set details
- `PUT /api/query-sets/[id]` - Update query set
- `DELETE /api/query-sets/[id]` - Delete query set
- `POST /api/query-sets/[id]/duplicate` - Duplicate query set

### Queries
- `GET /api/queries/[setId]` - List queries in set
- `POST /api/queries/[setId]` - Add query to set
- `PUT /api/queries/[id]` - Update query
- `DELETE /api/queries/[id]` - Delete query

### Runs & Execution
- `GET /api/runs` - List runs
- `POST /api/runs` - Start new run (max 5 concurrent per user)
- Runs auto-generate names: `Run_YYYY-MM-DD_HH:MM:SS.sss`

### Comparisons
- `POST /api/comparisons` - Compare two runs
- Supports CSV export and comparison snapshots

## Database Schema

### Key Tables
- **users** - User accounts, password hashes (Argon2)
- **db_credentials** - Database credentials (Vault references)
- **query_sets** - Grouped queries with associated credentials
- **queries** - Individual SQL queries with import tracking
- **runs** - Query set execution instances
- **query_results** - Individual query execution results
- **comparison_snapshots** - Saved comparison analyses
- **audit_log** - All actions (redacted by default, enableable via config)

## Security Features

1. **Encryption**
   - User passwords: Argon2 hashing
   - DB credentials: AES-256-GCM in Vault
   - Session data: HTTP-only, secure cookies
   - JWT tokens: Signed with RS256

2. **Access Control**
   - Role-based (Admin/Non-admin)
   - Row-level security (users see only their data)
   - Credential isolation (admin-managed, per-query-set)

3. **Audit Logging**
   - All actions logged (credential access, password changes, executions)
   - Sensitive data redaction by default
   - Debug mode option for troubleshooting

4. **TLS/SSL**
   - Production SSL certificates required
   - Optional unsecured connections per credential setting
   - Certificate validation in Java microservice

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Verify Vault is accessible: `curl http://localhost:8200/v1/sys/health`
- Verify Java service is running: `curl http://localhost:8080/api/query/health`

### Authentication Issues
- Check initial admin password: `cat /var/log/query_runner/qradmin_password.log`
- Verify JWT_SECRET is set correctly in .env
- Check session store in PostgreSQL: `SELECT * FROM session;`

### Query Execution Issues
- Verify IBM i host is reachable: `ping <ibmi_host>`
- Check credentials in Vault: `vault list secret/data/ibmi/`
- Enable debug mode for credential details: `DEBUG_MODE=true`
- Check Java microservice logs for JDBC errors

### Performance Issues
- Check concurrent run limit: `MAX_CONCURRENT_RUNS=5` in `config/concurrency.conf`
- Verify HikariCP pool settings in Java service
- Monitor PostgreSQL connections: `SELECT count(*) FROM pg_stat_activity;`

## Deployment Checklist

- [ ] CentOS 10 system prepared
- [ ] PostgreSQL installed and initialized
- [ ] HashiCorp Vault running and configured
- [ ] .env file created with all required values
- [ ] Production SSL certificates obtained
- [ ] Node.js and Java 17 installed
- [ ] Backend built: `npm run build`
- [ ] Java service packaged: `mvn clean package`
- [ ] App initialized: `npm run init`
- [ ] Initial admin password saved securely
- [ ] Background services configured (systemd)
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
