# IBM i Query Runner - Deployment Guide

This guide provides step-by-step instructions for deploying the IBM i Query Runner application on your IBM i system.

---

## Prerequisites

### IBM i Requirements
- IBM i 7.3 or higher
- Db2 for IBM i
- Access to QSYS2 system views (PLAN_CACHE_INFO, PLAN_CACHE)
- User profile with sufficient authority (*ALLOBJ or specific authorities)

### Software Requirements
- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher
- **Git**: For cloning the repository (optional)

### Network Requirements
- Port 3000 available (or configure different port)
- Network access between client machines and IBM i
- Firewall rules allowing HTTP/HTTPS traffic

---

## Installation Steps

### Step 1: Prepare IBM i Environment

#### 1.1 Create Application Library
```sql
-- Connect to IBM i using your preferred SQL client
-- (ACS Run SQL Scripts, STRSQL, or JDBC client)

-- Create library for application data
CRTLIB LIB(QRYRUN) TEXT('Query Runner Application Data');

-- Verify library was created
SELECT * FROM QSYS2.SYSTABLES 
WHERE TABLE_SCHEMA = 'QRYRUN';
```

#### 1.2 Set Up IFS Directory
```bash
# Connect to IBM i via SSH or QSH

# Create application directory
mkdir -p /qryrun/app
mkdir -p /qryrun/logs

# Set permissions
chmod 755 /qryrun
chmod 755 /qryrun/app
chmod 755 /qryrun/logs

# Verify directories
ls -la /qryrun
```

### Step 2: Install Database Schema

#### 2.1 Set Schema Context
```sql
-- Set the schema to your library
SET SCHEMA QRYRUN;

-- Verify schema is set
VALUES CURRENT SCHEMA;
```

#### 2.2 Run DDL Scripts in Order

**Script 1: Create Tables**
```sql
-- Run: database/schema/01_create_tables.sql
-- This creates all 10 application tables
-- Expected result: 10 tables created successfully
```

**Script 2: Create Indexes**
```sql
-- Run: database/schema/02_create_indexes.sql
-- This creates performance indexes
-- Expected result: Multiple indexes created
```

**Script 3: Create Views**
```sql
-- Run: database/schema/03_create_views.sql
-- This creates reporting views
-- Expected result: 3 views created
```

**Script 4: Create Procedures**
```sql
-- Run: database/schema/04_create_procedures.sql
-- This creates stored procedures
-- Expected result: 1 procedure created
```

**Script 5: Initial Data**
```sql
-- Run: database/schema/05_initial_data.sql
-- This inserts default configuration and QSECOFR user
-- Expected result: Initial data inserted
```

#### 2.3 Verify Database Setup
```sql
-- Check tables
SELECT TABLE_NAME, TABLE_TEXT 
FROM QSYS2.SYSTABLES 
WHERE TABLE_SCHEMA = 'QRYRUN'
ORDER BY TABLE_NAME;

-- Should return 10 tables:
-- QRYRUN_COMPARISONS
-- QRYRUN_COMPARISON_DETAILS
-- QRYRUN_CONFIG
-- QRYRUN_EXECUTIONS
-- QRYRUN_METRICS
-- QRYRUN_QUERIES
-- QRYRUN_QUERY_SETS
-- QRYRUN_SET_REFRESH_LOG
-- QRYRUN_TEST_RUNS
-- QRYRUN_USERS

-- Check initial user
SELECT USER_ID, USER_NAME, IS_ADMIN 
FROM QRYRUN.QRYRUN_USERS;

-- Should return QSECOFR as admin user
```

### Step 3: Install Node.js Application

#### 3.1 Transfer Application Files

**Option A: Using Git**
```bash
# SSH to IBM i
cd /qryrun/app

# Clone repository
git clone <repository-url> .

# Or if already cloned elsewhere, copy files
cp -R /path/to/source/* /qryrun/app/
```

**Option B: Using FTP/SFTP**
```bash
# From your local machine
# Upload the entire backend directory to /qryrun/app/
sftp user@ibmi-hostname
put -r backend/* /qryrun/app/
```

**Option C: Using IBM i Access Client Solutions (ACS)**
- Use IFS File Systems feature
- Navigate to /qryrun/app
- Upload backend directory contents

#### 3.2 Install Dependencies
```bash
# SSH to IBM i
cd /qryrun/app

# Install Node.js dependencies
npm install

# This will install:
# - express
# - node-jt400
# - jsonwebtoken
# - bcryptjs
# - winston
# - cors
# - helmet
# - express-rate-limit
# - dotenv
```

#### 3.3 Configure Environment

Create `.env` file:
```bash
cd /qryrun/app
touch .env
chmod 600 .env  # Secure the file
```

Edit `.env` with your configuration:
```bash
# Use your preferred editor (edtf, vim, nano)
edtf .env

# Or create from template
cp .env.example .env
```

**Required Configuration:**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
INSTALL_ROOT=/qryrun/app

# Database Configuration
DB_HOST=localhost
DB_USER=QRYRUN_APP
DB_PASSWORD=YourSecurePassword123!
DB_LIBRARY=QRYRUN

# Authentication
JWT_SECRET=YourVerySecureRandomString123!@#
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=info
LOG_FILE=/qryrun/logs/app.log
```

**Security Notes:**
- Use a strong, unique JWT_SECRET (minimum 32 characters)
- Use a dedicated user profile for DB_USER (not QSECOFR)
- Never commit .env file to version control
- Restrict .env file permissions (chmod 600)

### Step 4: Create Application User Profile

#### 4.1 Create Dedicated User
```
CRTUSRPRF USRPRF(QRYRUN_APP) 
          PASSWORD(YourSecurePassword123!) 
          USRCLS(*USER) 
          TEXT('Query Runner Application User') 
          SPCAUT(*NONE) 
          INLPGM(*NONE) 
          INLMNU(*SIGNOFF)
```

#### 4.2 Grant Database Permissions
```sql
-- Grant necessary authorities to application user
GRANT ALL ON QRYRUN.QRYRUN_USERS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_QUERY_SETS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_QUERIES TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_SET_REFRESH_LOG TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_TEST_RUNS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_EXECUTIONS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_METRICS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_COMPARISONS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_COMPARISON_DETAILS TO QRYRUN_APP;
GRANT ALL ON QRYRUN.QRYRUN_CONFIG TO QRYRUN_APP;

-- Grant access to plan cache views
GRANT SELECT ON QSYS2.PLAN_CACHE_INFO TO QRYRUN_APP;
GRANT SELECT ON QSYS2.PLAN_CACHE TO QRYRUN_APP;
```

### Step 5: Test the Installation

#### 5.1 Start Application (Test Mode)
```bash
cd /qryrun/app

# Start in development mode for testing
npm run dev

# You should see:
# Server running on port 3000
# Database connected successfully
```

#### 5.2 Test Health Endpoint
```bash
# From another SSH session or terminal
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "database": "connected",
#   "environment": "production"
# }
```

#### 5.3 Test Authentication
```bash
# Test login with QSECOFR (default admin)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "QSECOFR",
    "password": "YourQSECOFRPassword"
  }'

# Expected response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {...}
# }
```

### Step 6: Set Up as Service

#### 6.1 Create Startup Script
```bash
# Create startup script
cat > /qryrun/app/start.sh << 'EOF'
#!/bin/sh
cd /qryrun/app
export NODE_ENV=production
npm start >> /qryrun/logs/startup.log 2>&1 &
echo $! > /qryrun/app/app.pid
EOF

chmod +x /qryrun/app/start.sh
```

#### 6.2 Create Shutdown Script
```bash
# Create shutdown script
cat > /qryrun/app/stop.sh << 'EOF'
#!/bin/sh
if [ -f /qryrun/app/app.pid ]; then
  kill $(cat /qryrun/app/app.pid)
  rm /qryrun/app/app.pid
  echo "Application stopped"
else
  echo "PID file not found"
fi
EOF

chmod +x /qryrun/app/stop.sh
```

#### 6.3 Create CL Program for Autostart

**Create source file:**
```
CRTSRCPF FILE(QRYRUN/QCLSRC) RCDLEN(112)
```

**Add member QRYRUN:**
```
ADDPFM FILE(QRYRUN/QCLSRC) MBR(QRYRUN) TEXT('Query Runner Startup')
```

**Edit member with CL code:**
```cl
PGM
  /* Query Runner Application Startup */
  
  CHGENVVAR ENVVAR(NODE_ENV) VALUE('production')
  CHGENVVAR ENVVAR(PATH) VALUE('/QOpenSys/pkgs/bin:/usr/bin')
  
  QSH CMD('cd /qryrun/app && npm start > /qryrun/logs/startup.log 2>&1 &')
  
  SNDPGMMSG MSG('Query Runner started') TOPGMQ(*EXT)
ENDPGM
```

**Create program:**
```
CRTCLPGM PGM(QRYRUN/QRYRUN) SRCFILE(QRYRUN/QCLSRC)
```

**Add to startup program:**
```
ADDAJE JOB(QRYRUN) CMD(CALL PGM(QRYRUN/QRYRUN))
```

### Step 7: Configure Firewall

#### 7.1 Add Firewall Rule
```bash
# Allow incoming connections on port 3000
# Using IBM i Navigator or command line

# Check current rules
NETSTAT *CNN

# Add rule (if using firewall)
# This varies by IBM i version and configuration
# Consult your security team
```

### Step 8: Set Up Log Rotation

#### 8.1 Create Log Rotation Script
```bash
cat > /qryrun/app/rotate-logs.sh << 'EOF'
#!/bin/sh
LOG_DIR=/qryrun/logs
DATE=$(date +%Y%m%d)

# Rotate application log
if [ -f $LOG_DIR/app.log ]; then
  mv $LOG_DIR/app.log $LOG_DIR/app-$DATE.log
  gzip $LOG_DIR/app-$DATE.log
fi

# Delete logs older than 30 days
find $LOG_DIR -name "app-*.log.gz" -mtime +30 -delete

# Restart application to create new log file
/qryrun/app/stop.sh
sleep 2
/qryrun/app/start.sh
EOF

chmod +x /qryrun/app/rotate-logs.sh
```

#### 8.2 Schedule Log Rotation
```
/* Add job schedule entry for weekly log rotation */
ADDJOBSCDE JOB(QRYRUNLOG) 
           CMD(QSH CMD('/qryrun/app/rotate-logs.sh')) 
           FRQ(*WEEKLY) 
           SCDDATE(*NONE) 
           SCDDAY(*SUN) 
           SCDTIME('020000')
```

---

## Post-Deployment Tasks

### 1. Create Additional Users
```sql
-- Add users who will access the application
INSERT INTO QRYRUN.QRYRUN_USERS 
  (USER_ID, USER_NAME, EMAIL, IS_ADMIN, CREATED_AT)
VALUES 
  ('JSMITH', 'John Smith', 'jsmith@company.com', 0, CURRENT_TIMESTAMP),
  ('MJONES', 'Mary Jones', 'mjones@company.com', 1, CURRENT_TIMESTAMP);
```

### 2. Configure Application Settings
```sql
-- Update configuration as needed
UPDATE QRYRUN.QRYRUN_CONFIG
SET CONFIG_VALUE = '30'
WHERE CONFIG_KEY = 'DEFAULT_DEVIATION_THRESHOLD';

UPDATE QRYRUN.QRYRUN_CONFIG
SET CONFIG_VALUE = '100'
WHERE CONFIG_KEY = 'MAX_ITERATION_COUNT';
```

### 3. Test Complete Workflow
1. Login as admin user
2. Create a query set from plan cache
3. Create a test run
4. Execute the test run
5. View results
6. Create a comparison

### 4. Monitor Application
```bash
# Check application status
ps -ef | grep node

# Check logs
tail -f /qryrun/logs/app.log

# Check database connections
SELECT * FROM QSYS2.NETSTAT_JOB_INFO 
WHERE LOCAL_PORT = 3000;
```

---

## Troubleshooting

### Application Won't Start

**Check Node.js installation:**
```bash
node --version
npm --version
```

**Check permissions:**
```bash
ls -la /qryrun/app
# Ensure files are readable and executable
```

**Check .env file:**
```bash
cat /qryrun/app/.env
# Verify all required variables are set
```

**Check logs:**
```bash
tail -100 /qryrun/logs/app.log
```

### Database Connection Errors

**Verify database user:**
```sql
SELECT * FROM QSYS2.USER_INFO 
WHERE AUTHORIZATION_NAME = 'QRYRUN_APP';
```

**Test JDBC connection:**
```bash
# From QSH
java -cp /path/to/jt400.jar com.ibm.as400.access.AS400JDBCDriver
```

**Check authorities:**
```sql
SELECT * FROM QSYS2.OBJECT_PRIVILEGES 
WHERE AUTHORIZATION_NAME = 'QRYRUN_APP'
  AND OBJECT_SCHEMA = 'QRYRUN';
```

### Authentication Failures

**Verify user exists:**
```sql
SELECT * FROM QRYRUN.QRYRUN_USERS 
WHERE USER_ID = 'USERID';
```

**Check IBM i user profile:**
```
DSPUSRPRF USRPRF(USERID)
```

**Verify JWT secret is set:**
```bash
grep JWT_SECRET /qryrun/app/.env
```

### Performance Issues

**Check database indexes:**
```sql
SELECT INDEX_NAME, INDEX_SCHEMA, TABLE_NAME 
FROM QSYS2.SYSINDEXES 
WHERE TABLE_SCHEMA = 'QRYRUN';
```

**Monitor query performance:**
```sql
SELECT * FROM QSYS2.PLAN_CACHE_INFO 
WHERE STATEMENT_TEXT LIKE '%QRYRUN%'
ORDER BY AVERAGE_ELAPSED_TIME DESC;
```

**Check system resources:**
```
WRKSYSSTS
WRKACTJOB
```

---

## Security Hardening

### 1. Use HTTPS
- Configure SSL/TLS certificates
- Update application to use HTTPS
- Redirect HTTP to HTTPS

### 2. Restrict Network Access
- Use firewall rules
- Limit to specific IP ranges
- Use VPN for remote access

### 3. Regular Updates
- Keep Node.js updated
- Update npm packages regularly
- Apply IBM i PTFs

### 4. Audit Logging
- Enable database audit logging
- Monitor application logs
- Review access patterns

### 5. Password Policy
- Enforce strong passwords
- Regular password rotation
- Multi-factor authentication (future enhancement)

---

## Backup and Recovery

### Database Backup
```
/* Save library */
SAVLIB LIB(QRYRUN) DEV(*SAVF) SAVF(QGPL/QRYRUNBKP)

/* Copy to tape or IFS */
CPYTOTAP DEV(TAP01) FROMFILE(QGPL/QRYRUNBKP)
```

### Application Backup
```bash
# Backup application files
tar -czf /qryrun/backups/app-$(date +%Y%m%d).tar.gz /qryrun/app

# Backup logs
tar -czf /qryrun/backups/logs-$(date +%Y%m%d).tar.gz /qryrun/logs
```

### Recovery Procedure
```
/* Restore library */
RSTLIB SAVLIB(QRYRUN) DEV(*SAVF) SAVF(QGPL/QRYRUNBKP)

/* Restore application files */
cd /qryrun
tar -xzf /qryrun/backups/app-YYYYMMDD.tar.gz
```

---

## Maintenance

### Weekly Tasks
- Review application logs
- Check disk space
- Monitor performance

### Monthly Tasks
- Update npm packages
- Review user access
- Backup database and application

### Quarterly Tasks
- Review security settings
- Update documentation
- Performance tuning

---

## Support and Resources

### Documentation
- API Documentation: `API_DOCUMENTATION.md`
- Architecture: `ARCHITECTURE.md`
- Database Schema: `DATABASE_SCHEMA.md`

### Logs Location
- Application logs: `/qryrun/logs/app.log`
- Startup logs: `/qryrun/logs/startup.log`
- Error logs: `/qryrun/logs/error.log`

### Common Commands
```bash
# Start application
/qryrun/app/start.sh

# Stop application
/qryrun/app/stop.sh

# View logs
tail -f /qryrun/logs/app.log

# Check status
ps -ef | grep node
```

---

## Conclusion

Your IBM i Query Runner application should now be fully deployed and operational. For questions or issues, refer to the troubleshooting section or consult the additional documentation files.

**Next Steps:**
1. Train users on the application
2. Set up monitoring and alerts
3. Plan regular maintenance windows
4. Consider deploying the frontend application