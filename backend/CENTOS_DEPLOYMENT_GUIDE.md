# CentOS Linux Deployment Guide

## Overview

Deploy the IBM i Query Runner on CentOS Linux with secure JDBC connection to IBM i Db2.

## Architecture

```
┌─────────────────────────────────────┐
│   CentOS Linux Server                │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Frontend (Vue.js + Nginx)     │ │
│  │  Port: 80/443                  │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Backend (Node.js + Express)   │ │
│  │  Port: 3000                    │ │
│  │  Uses: node-jt400 (JT400 JDBC)│ │
│  └────────────────────────────────┘ │
│              │                       │
└──────────────┼───────────────────────┘
               │
               │ Secure JDBC (SSL/TLS)
               │ Port: 9471
               ▼
┌─────────────────────────────────────┐
│   IBM i System                      │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Db2 for i Database            │ │
│  │  Secure JDBC Port: 9471        │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Prerequisites

### CentOS Server Requirements
- CentOS 7 or 8 (or Rocky Linux 8/9, AlmaLinux 8/9)
- Minimum 2GB RAM
- 20GB disk space
- Network access to IBM i system
- Root or sudo access

### IBM i Requirements
- IBM i 7.3 or higher
- Db2 for i
- Secure JDBC server running on port 9471
- User with appropriate database permissions

## Installation Steps

### 1. Update System and Install Prerequisites

```bash
# Update system
sudo yum update -y

# Install development tools
sudo yum groupinstall "Development Tools" -y

# Install required packages
sudo yum install -y git curl wget openssl
```

### 2. Install Node.js

```bash
# Install Node.js 22.x (Current LTS - Recommended)
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Alternative: Install Node.js 20.x (Previous LTS - Still supported until 2026)
# curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
# sudo yum install -y nodejs

# Verify installation
node --version  # Should show v22.x.x (or v20.x.x)
npm --version   # Should show 10.x.x or higher
```

### 3. Install Java (Required for JT400)

```bash
# Install OpenJDK 11
sudo yum install -y java-11-openjdk java-11-openjdk-devel

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk' | sudo tee -a /etc/profile.d/java.sh
echo 'export PATH=$JAVA_HOME/bin:$PATH' | sudo tee -a /etc/profile.d/java.sh
source /etc/profile.d/java.sh

# Verify Java installation
java -version
echo $JAVA_HOME
```

### 4. Create Application User

```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash ibmiapp
sudo passwd ibmiapp

# Add to sudoers if needed
# sudo usermod -aG wheel ibmiapp
```

### 5. Clone and Setup Application

```bash
# Switch to application user
sudo su - ibmiapp

# Clone repository (or upload files)
cd ~
git clone <your-repo-url> ibmi_query_runner
# OR upload files via scp/sftp

cd ibmi_query_runner/backend
```

### 6. Install Backend Dependencies

```bash
# Ensure JAVA_HOME is set
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH=$JAVA_HOME/bin:$PATH

# Install dependencies
npm install

# This should complete successfully on CentOS!
```

### 7. Configure Environment

```bash
# Create .env file
cp .env.example .env
nano .env
```

Edit `.env` with your IBM i connection details:

```env
# Database Configuration - Secure JDBC
DB_HOST=your-ibmi-hostname.example.com
DB_PORT=9471
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_LIBRARY=YOURLIB
DB_SECURE=true

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Authentication
JWT_SECRET=generate-a-strong-random-secret-here
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGINS=http://your-centos-server,https://your-centos-server

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 8. Test Backend

```bash
# Start backend in development mode
npm run dev

# In another terminal, test the connection
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "production"
}
```

### 9. Install Frontend

```bash
cd ~/ibmi_query_runner/frontend

# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with static files
```

### 10. Install and Configure Nginx

```bash
# Exit from ibmiapp user
exit

# Install Nginx
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 11. Configure Nginx for Application

```bash
# Create Nginx configuration
sudo nano /etc/nginx/conf.d/ibmi-query-runner.conf
```

Add this configuration:

```nginx
# Frontend - Serve Vue.js static files
server {
    listen 80;
    server_name your-server-hostname;
    
    root /home/ibmiapp/ibmi_query_runner/frontend/dist;
    index index.html;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 12. Setup Backend as System Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/ibmi-query-runner.service
```

Add this content:

```ini
[Unit]
Description=IBM i Query Runner Backend
After=network.target

[Service]
Type=simple
User=ibmiapp
WorkingDirectory=/home/ibmiapp/ibmi_query_runner/backend
Environment="NODE_ENV=production"
Environment="JAVA_HOME=/usr/lib/jvm/java-11-openjdk"
Environment="PATH=/usr/lib/jvm/java-11-openjdk/bin:/usr/bin:/bin"
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ibmi-query-runner

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ibmi-query-runner
sudo systemctl start ibmi-query-runner

# Check status
sudo systemctl status ibmi-query-runner

# View logs
sudo journalctl -u ibmi-query-runner -f
```

### 13. Configure IBM i for Secure JDBC

On IBM i, ensure secure JDBC is configured:

```
# Start secure JDBC server
STRHOSTSVR SERVER(*DATABASE) PORT(9471) SSLMODE(*REQUIRED)

# Verify it's running
NETSTAT OPTION(*CNN) LOCALPORT(9471)

# Configure SSL certificate if needed
WRKCERTSTORE CERTSTORE(*SYSTEM)
```

### 14. Setup SSL/TLS for Nginx (Optional but Recommended)

```bash
# Install certbot for Let's Encrypt
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-server-hostname

# Auto-renewal is configured automatically
sudo systemctl status certbot-renew.timer
```

## Verification

### 1. Check Backend Service
```bash
sudo systemctl status ibmi-query-runner
curl http://localhost:3000/health
```

### 2. Check Frontend
```bash
curl http://your-server-hostname
```

### 3. Check Database Connection
```bash
# View backend logs
sudo journalctl -u ibmi-query-runner -n 50
```

### 4. Access Application
Open browser: `http://your-server-hostname` or `https://your-server-hostname`

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
sudo journalctl -u ibmi-query-runner -n 100

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000

# Test manually
sudo su - ibmiapp
cd ~/ibmi_query_runner/backend
npm start
```

### Database Connection Issues
```bash
# Test network connectivity to IBM i
telnet your-ibmi-host 9471

# Check IBM i JDBC server
# On IBM i: NETSTAT OPTION(*CNN) LOCALPORT(9471)

# Verify credentials in .env file
cat ~/ibmi_query_runner/backend/.env
```

### Nginx Issues
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

## Maintenance

### Update Application
```bash
sudo su - ibmiapp
cd ~/ibmi_query_runner

# Pull latest changes
git pull

# Update backend
cd backend
npm install
cd ..

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart backend service
exit
sudo systemctl restart ibmi-query-runner
```

### View Logs
```bash
# Backend logs
sudo journalctl -u ibmi-query-runner -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Backup
```bash
# Backup application files
sudo tar -czf /backup/ibmi-query-runner-$(date +%Y%m%d).tar.gz \
  /home/ibmiapp/ibmi_query_runner

# Backup database (if using local SQLite for app data)
# Not applicable for this app as it uses IBM i Db2
```

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   # Only allow necessary ports
   sudo firewall-cmd --permanent --add-service=http
   sudo firewall-cmd --permanent --add-service=https
   sudo firewall-cmd --permanent --add-port=3000/tcp  # Only if needed externally
   sudo firewall-cmd --reload
   ```

2. **SELinux** (if enabled)
   ```bash
   # Allow Nginx to connect to backend
   sudo setsebool -P httpd_can_network_connect 1
   ```

3. **Regular Updates**
   ```bash
   sudo yum update -y
   ```

4. **Strong Passwords**
   - Use strong JWT_SECRET
   - Use strong database passwords
   - Rotate credentials regularly

5. **SSL/TLS**
   - Always use HTTPS in production
   - Use Let's Encrypt for free SSL certificates

## Performance Tuning

### Node.js
```bash
# Increase Node.js memory limit if needed
# Edit /etc/systemd/system/ibmi-query-runner.service
Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

### Nginx
```bash
# Edit /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;
```

## Advantages of CentOS Deployment

✅ **Stable and Reliable** - Enterprise-grade Linux distribution  
✅ **Easy Installation** - node-jt400 compiles without issues  
✅ **Production Ready** - Systemd service management  
✅ **Secure** - SELinux, firewall, SSL/TLS support  
✅ **Scalable** - Can handle multiple concurrent users  
✅ **Cost Effective** - Free and open source  
✅ **Well Documented** - Large community support  

## Conclusion

CentOS Linux provides an excellent platform for deploying the IBM i Query Runner with:
- Reliable Node.js and Java support
- Easy node-jt400 installation
- Secure JDBC connection to IBM i
- Production-ready service management
- Professional web server (Nginx)
- Strong security features

The application will run smoothly and securely on CentOS!