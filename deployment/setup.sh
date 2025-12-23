#!/bin/bash
# Query Runner - CentOS 10 Setup Script
# This script sets up all prerequisites for Query Runner

set -e

echo "======================================"
echo "Query Runner - CentOS 10 Setup"
echo "======================================"

# Check if running as root for system packages
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root for system package installation"
   exit 1
fi

# Update system
echo "Updating system packages..."
yum update -y

# Install Node.js 24
echo "Installing Node.js 24..."
curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
yum install -y nodejs

# Install Java 17
echo "Installing Java 17..."
yum install -y java-17-openjdk java-17-openjdk-devel

# Install PostgreSQL
echo "Installing PostgreSQL..."
yum install -y postgresql-server postgresql-contrib

# Install Git (if not already installed)
echo "Installing Git..."
yum install -y git

# Install wget and unzip
yum install -y wget unzip

# Install HashiCorp Vault
echo "Installing HashiCorp Vault..."
VAULT_VERSION="1.16.0"
wget https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip
unzip vault_${VAULT_VERSION}_linux_amd64.zip
mv vault /usr/local/bin/
chmod +x /usr/local/bin/vault
rm vault_${VAULT_VERSION}_linux_amd64.zip

# Verify installations
echo ""
echo "Verifying installations..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Java version: $(java -version 2>&1 | head -n 1)"
echo "Vault version: $(vault version)"
echo "PostgreSQL version: $(psql --version)"

# Initialize PostgreSQL
echo ""
echo "Initializing PostgreSQL..."
if [ ! -d /var/lib/pgsql/data ]; then
    /usr/bin/postgresql-setup initdb
fi

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create app user and database
echo "Creating PostgreSQL database and user..."
sudo -u postgres psql <<EOF
CREATE DATABASE IF NOT EXISTS query_runner;
CREATE USER IF NOT EXISTS qrapp WITH PASSWORD 'CHANGE_ME_IN_ENV_FILE';
ALTER ROLE qrapp SET client_encoding TO 'utf8';
ALTER ROLE qrapp SET default_transaction_isolation TO 'read committed';
ALTER ROLE qrapp SET default_transaction_deferrable TO off;
ALTER ROLE qrapp SET default_transaction_read_only TO off;
ALTER ROLE qrapp SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE query_runner TO qrapp;
EOF

# Create log directory
echo "Creating log directory..."
mkdir -p /var/log/query_runner
chmod 700 /var/log/query_runner

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update database password in .env file"
echo "2. Set up Vault (dev or production mode)"
echo "3. Run: cd backend && npm install"
echo "4. Run: cd ../javaservice && mvn clean package"
echo "5. Run: cd ../backend && npm run init"
echo ""
