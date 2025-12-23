# Query Runner - Deployment Guide

## Prerequisites

- CentOS 10 Linux system
- Root access for initial setup
- At least 2GB RAM
- 10GB disk space
- Network access to:
  - IBM i Host Server (port 9050 for JDBC)
  - PostgreSQL server (port 5432)
  - HashiCorp Vault (port 8200)

## Quick Start - Automated Setup

```bash
# Run as root
sudo bash deployment/setup.sh

# This installs:
# - Node.js 24
# - Java 21
# - PostgreSQL 15
# - HashiCorp Vault 1.16
# - Creates log directory
```

## Manual Setup Steps

### 1. Install Node.js 24

```bash
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Install Java 21

```bash
sudo yum install -y java-21-openjdk java-21-openjdk-devel
```

### 3. Install PostgreSQL

```bash
sudo yum install -y postgresql-server postgresql-contrib
sudo /usr/bin/postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Create PostgreSQL Database

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE query_runner;
CREATE USER qrapp WITH PASSWORD 'your_secure_password';
ALTER ROLE qrapp SET client_encoding TO 'utf8';
ALTER ROLE qrapp SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE query_runner TO qrapp;
EOF
```

### 5. Install HashiCorp Vault

```bash
# Download and install
wget https://releases.hashicorp.com/vault/1.16.0/vault_1.16.0_linux_amd64.zip
unzip vault_1.16.0_linux_amd64.zip
sudo mv vault /usr/local/bin/
sudo chmod +x /usr/local/bin/vault

# For development/testing, run in dev mode:
vault server -dev

# For production, configure with proper storage backend
# See: https://www.vaultproject.io/docs
```

## Application Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ibmi_query_runner.git
cd ibmi_query_runner
```

### 2. Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Install dependencies
npm install

# Build for production
npm run build
```

### 3. Java Microservice Setup

```bash
cd ../javaservice

# Build with Maven
mvn clean package

# JAR location: target/jt400-query-service-1.0.0.jar
```

### 4. Initialize Application

```bash
cd ../backend

# Set up Vault, Database, Admin User
npm run init

# Check initial admin password
cat /var/log/query_runner/qradmin_password.log
```

## Systemd Service Installation

### 1. Create Service User

```bash
sudo useradd -r -m -d /opt/query-runner -s /sbin/nologin queryrunner
```

### 2. Install Application

```bash
sudo mkdir -p /opt/query-runner
sudo cp -r backend javaservice /opt/query-runner/
sudo chown -R queryrunner:queryrunner /opt/query-runner
```

### 3. Install Service Files

```bash
sudo cp deployment/query-runner-backend.service /etc/systemd/system/
sudo cp deployment/query-runner-javaservice.service /etc/systemd/system/
sudo systemctl daemon-reload
```

### 4. Create Log Directory

```bash
sudo mkdir -p /var/log/query_runner
sudo chown -R queryrunner:queryrunner /var/log/query_runner
sudo chmod 755 /var/log/query_runner
```

### 5. Enable and Start Services

```bash
# Enable on boot
sudo systemctl enable query-runner-backend
sudo systemctl enable query-runner-javaservice

# Start services
sudo systemctl start query-runner-backend
sudo systemctl start query-runner-javaservice

# Check status
sudo systemctl status query-runner-backend
sudo systemctl status query-runner-javaservice
```

### 6. Monitor Logs

```bash
# View logs
sudo tail -f /var/log/query_runner/backend.log
sudo tail -f /var/log/query_runner/javaservice.log

# Full log files
sudo journalctl -u query-runner-backend -f
sudo journalctl -u query-runner-javaservice -f
```

## Configuration

### Environment Variables (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=query_runner
DB_USER=qrapp
DB_PASSWORD=your_secure_password

# Vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=s.your_root_token
VAULT_MOUNT_PATH=secret

# Security
SESSION_SECRET=generate_with_crypto
JWT_SECRET=generate_with_crypto
JAVA_SERVICE_JWT_SECRET=generate_with_crypto

# Services
JAVA_SERVICE_URL=http://localhost:8080
LOG_LEVEL=info
DEBUG_MODE=false

# Configuration
MAX_CONCURRENT_RUNS=5
```

### Concurrency Configuration

Edit `backend/config/concurrency.conf`:

```properties
MAX_CONCURRENT_RUNS=5
CONNECTION_TIMEOUT=30000
QUERY_TIMEOUT=0
```

### Java Microservice Configuration

Edit `javaservice/src/main/resources/application.properties`:

```properties
server.port=8080
jt400.max.connections=15
jt400.connection.timeout=30000
jt400.ssl.enabled=true
```

## Testing Deployment

```bash
# Test backend
curl http://localhost:3000/health

# Test Java service
curl http://localhost:8080/api/query/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"qradmin","password":"<initial_password>"}'
```

## Backup & Recovery

### Database Backup

```bash
# Full backup
sudo -u postgres pg_dump query_runner > query_runner_backup.sql

# Restore
sudo -u postgres psql query_runner < query_runner_backup.sql
```

### Vault Backup

```bash
# Raft storage backup (if using integrated storage)
vault operator raft snapshot save backup.snap

# Restore
vault operator raft snapshot restore backup.snap
```

### Configuration Backup

```bash
# Backup .env file
sudo cp /opt/query-runner/backend/.env /opt/query-runner/backend/.env.backup

# Keep in secure location
sudo chown root:root /opt/query-runner/backend/.env.backup
sudo chmod 600 /opt/query-runner/backend/.env.backup
```

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status query-runner-backend

# View error logs
sudo journalctl -u query-runner-backend -n 50

# Check if ports are in use
sudo netstat -tlnp | grep 3000
sudo netstat -tlnp | grep 8080
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U qrapp -d query_runner -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql.log
```

### Vault Connection Issues

```bash
# Check Vault health
curl http://localhost:8200/v1/sys/health

# View Vault logs
vault audit list
```

### Java Service Issues

```bash
# Check Java process
ps aux | grep java

# Check port binding
lsof -i :8080

# Increase Java heap size in systemd service
# Edit /etc/systemd/system/query-runner-javaservice.service
# ExecStart=/usr/bin/java -Xmx2048m -Xms1024m -jar ...
```

## Performance Tuning

### PostgreSQL Connection Pool

In `backend/src/db/pool.ts`:

```typescript
max: 20,              // Number of connections
idleTimeoutMillis: 30000,    // Idle timeout
connectionTimeoutMillis: 2000, // Connection timeout
```

### HikariCP Pool (Java)

In `javaservice/application.properties`:

```properties
jt400.max.connections=15
jt400.connection.timeout=30000
```

### Node.js

```bash
# Increase file descriptor limit
ulimit -n 65536

# Run with multiple worker processes
NODE_WORKERS=4 npm start
```

## Monitoring & Alerting

### Health Checks

```bash
# Create cron job to monitor services
*/5 * * * * curl -s http://localhost:3000/health || systemctl restart query-runner-backend
*/5 * * * * curl -s http://localhost:8080/api/query/health || systemctl restart query-runner-javaservice
```

### Log Monitoring

```bash
# Monitor for errors
tail -f /var/log/query_runner/*.log | grep -i error

# Monitor query execution times
tail -f /var/log/query_runner/backend.log | grep "execution"
```

## Updating the Application

```bash
# Stop services
sudo systemctl stop query-runner-backend
sudo systemctl stop query-runner-javaservice

# Pull latest code
cd /opt/query-runner
sudo git pull

# Rebuild
cd backend && npm run build
cd ../javaservice && mvn clean package

# Start services
sudo systemctl start query-runner-backend
sudo systemctl start query-runner-javaservice
```

## Security Hardening

1. **Change initial admin password immediately**
   - Password change required on first login

2. **Rotate JWT secrets periodically**
   - Update JWT_SECRET in .env
   - Restart services

3. **Configure firewall**
   - Allow only necessary ports
   - Restrict access by IP if possible

4. **Enable HTTPS**
   - Set up Nginx reverse proxy with SSL
   - Update NEXT_PUBLIC_API_URL to HTTPS

5. **Backup credentials**
   - Keep Vault backups secure
   - Maintain PostgreSQL backups

6. **Monitor logs**
   - Regular log review
   - Set up alerting for errors

## Support

For issues, see:
- README.md - Main documentation
- PROJECT_STRUCTURE.md - File organization
- IMPLEMENTATION_NOTES.md - Implementation details
