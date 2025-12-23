# Query Runner - Quick Installation Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites Check
```bash
node --version    # Should be 24.x or higher
java --version    # Should be 17 or higher
psql --version    # Should be 15 or higher
vault --version   # Should be 1.16 or higher
```

If any are missing, run the automated setup:
```bash
cd deployment
sudo bash setup.sh
```

---

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Build Java Microservice
```bash
cd ../javaservice
mvn clean package
cd ..
```

### 3. Configure Environment
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=query_runner
DATABASE_USER=qrapp
DATABASE_PASSWORD=your_password

# Vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your_vault_token

# JWT
JWT_SECRET=your_secret_key_minimum_32_characters_long

# Java Service
JAVA_SERVICE_URL=http://localhost:8080
```

### 4. Initialize Database and Vault
```bash
npm run init
```

This will:
- Create database schema
- Initialize Vault mount
- Create admin user (qradmin)
- Save admin password to `/var/log/query_runner/qradmin_password.log`

### 5. Start Services

**Terminal 1 - Backend + Frontend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Java Service:**
```bash
cd javaservice
java -jar target/jt400-query-service-1.0.0.jar
```

### 6. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

Login with:
- **Username**: `qradmin`
- **Password**: Check `/var/log/query_runner/qradmin_password.log`

---

## Production Deployment (CentOS 10)

### Automated Deployment
```bash
# Run setup script (installs all prerequisites)
sudo bash deployment/setup.sh

# Deploy application
sudo bash deployment/deploy.sh

# Start services
sudo systemctl start query-runner-backend
sudo systemctl start query-runner-javaservice

# Enable auto-start on boot
sudo systemctl enable query-runner-backend
sudo systemctl enable query-runner-javaservice
```

### Manual Deployment

#### 1. Prerequisites
```bash
# Install Node.js 24
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo dnf install -y nodejs

# Install Java 17
sudo dnf install -y java-17-openjdk java-17-openjdk-devel

# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install HashiCorp Vault
wget https://releases.hashicorp.com/vault/1.16.0/vault_1.16.0_linux_amd64.zip
sudo unzip vault_1.16.0_linux_amd64.zip -d /usr/local/bin/
```

#### 2. Database Setup
```bash
sudo -u postgres psql << EOF
CREATE DATABASE query_runner;
CREATE USER qrapp WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE query_runner TO qrapp;
\c query_runner
CREATE EXTENSION IF NOT EXISTS pgcrypto;
EOF
```

#### 3. Create Application User
```bash
sudo useradd -r -s /bin/bash -d /opt/query-runner queryrunner
sudo mkdir -p /opt/query-runner
sudo chown queryrunner:queryrunner /opt/query-runner
```

#### 4. Deploy Application
```bash
# Clone repository
cd /opt/query-runner
sudo -u queryrunner git clone https://github.com/your-org/query-runner.git .

# Install backend
cd backend
sudo -u queryrunner npm install
sudo -u queryrunner npm run build

# Build Java service
cd ../javaservice
sudo -u queryrunner mvn clean package
```

#### 5. Configure Environment
```bash
cd /opt/query-runner/backend
sudo -u queryrunner nano .env
# (Add production configuration)
```

#### 6. Initialize Application
```bash
cd /opt/query-runner/backend
sudo -u queryrunner npm run init
```

#### 7. Install Systemd Services
```bash
# Copy service files
sudo cp /opt/query-runner/deployment/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Start services
sudo systemctl start query-runner-backend
sudo systemctl start query-runner-javaservice

# Enable auto-start
sudo systemctl enable query-runner-backend
sudo systemctl enable query-runner-javaservice
```

---

## Verification

### Check Services
```bash
# Backend status
sudo systemctl status query-runner-backend

# Java service status
sudo systemctl status query-runner-javaservice

# View logs
sudo journalctl -u query-runner-backend -f
sudo journalctl -u query-runner-javaservice -f
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Login (should return JWT token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"qradmin","password":"your_password"}'

# Java service health
curl http://localhost:8080/actuator/health
```

### Test Frontend
Open browser:
```
http://your-server-ip:3000
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u query-runner-backend -n 50

# Common issues:
# 1. Port 3001 already in use
sudo lsof -i :3001
# Kill conflicting process or change PORT in .env

# 2. Database connection failed
psql -h localhost -U qrapp -d query_runner
# Verify credentials in .env

# 3. Vault connection failed
vault status
export VAULT_ADDR=http://localhost:8200
vault login
```

### Java Service won't start
```bash
# Check logs
sudo journalctl -u query-runner-javaservice -n 50

# Common issues:
# 1. Port 8080 already in use
sudo lsof -i :8080

# 2. JAR file not found
ls -la /opt/query-runner/javaservice/target/*.jar

# 3. Java version
java -version  # Must be 17+
```

### Frontend shows errors
```bash
# Check browser console (F12)
# Common issues:
# 1. API endpoint wrong
# Verify backend is running on port 3001

# 2. CORS errors
# Check server.ts CORS configuration

# 3. JWT token expired
# Clear localStorage and re-login
```

### Database connection issues
```bash
# Test connection
psql -h localhost -U qrapp -d query_runner

# Check pg_hba.conf
sudo nano /var/lib/pgsql/15/data/pg_hba.conf
# Add: host query_runner qrapp 127.0.0.1/32 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Performance Tuning

### PostgreSQL
```sql
-- In postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
max_connections = 100
```

### Node.js
```bash
# Increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Java
```bash
# Edit javaservice systemd service
ExecStart=/usr/bin/java -Xms512m -Xmx2048m -jar /opt/query-runner/javaservice/target/jt400-query-service-1.0.0.jar
```

---

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall (allow only 443, block 3001/8080 externally)
- [ ] Set up PostgreSQL password policy
- [ ] Enable Vault auto-unseal
- [ ] Rotate Vault tokens regularly
- [ ] Enable audit logging
- [ ] Set up backup procedures
- [ ] Configure fail2ban for brute force protection

---

## Monitoring

### Log Locations
```bash
# Application logs
/var/log/query_runner/backend.log
/var/log/query_runner/javaservice.log
/var/log/query_runner/qradmin_password.log

# Systemd logs
sudo journalctl -u query-runner-backend
sudo journalctl -u query-runner-javaservice

# PostgreSQL logs
/var/lib/pgsql/15/data/log/
```

### Health Checks
```bash
# Add to cron for monitoring
*/5 * * * * curl -f http://localhost:3001/health || systemctl restart query-runner-backend
*/5 * * * * curl -f http://localhost:8080/actuator/health || systemctl restart query-runner-javaservice
```

---

## Backup Procedures

### Database Backup
```bash
# Create backup directory
sudo mkdir -p /backups/query_runner
sudo chown queryrunner:queryrunner /backups/query_runner

# Backup script
sudo -u queryrunner pg_dump -h localhost -U qrapp query_runner > /backups/query_runner/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
sudo -u postgres psql query_runner < /backups/query_runner/backup_YYYYMMDD_HHMMSS.sql
```

### Vault Backup
```bash
# Snapshot
vault operator raft snapshot save /backups/query_runner/vault_$(date +%Y%m%d_%H%M%S).snap

# Restore
vault operator raft snapshot restore /backups/query_runner/vault_YYYYMMDD_HHMMSS.snap
```

### Configuration Backup
```bash
# Backup .env and config files
tar -czf /backups/query_runner/config_$(date +%Y%m%d_%H%M%S).tar.gz \
  /opt/query-runner/backend/.env \
  /opt/query-runner/backend/config/
```

---

## Update Procedures

### Application Update
```bash
# Stop services
sudo systemctl stop query-runner-backend query-runner-javaservice

# Backup current version
cd /opt/query-runner
sudo -u queryrunner git stash

# Pull updates
sudo -u queryrunner git pull origin main

# Install dependencies
cd backend
sudo -u queryrunner npm install
sudo -u queryrunner npm run build

cd ../javaservice
sudo -u queryrunner mvn clean package

# Restart services
sudo systemctl start query-runner-backend query-runner-javaservice
```

---

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u query-runner-backend -f`
2. Review documentation: `README.md`, `DEPLOYMENT.md`
3. Verify prerequisites: All versions match requirements
4. Check firewall: Ports 3000, 3001, 8080 accessible

---

**Installation Complete!** 🎉

Your Query Runner application is now ready to test IBM i DB2 queries!
