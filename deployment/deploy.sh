#!/bin/bash
# Query Runner - Production Deployment Script
# Deploy to systemd services on CentOS 10

set -e

INSTALL_DIR="/opt/query-runner"
SERVICE_USER="queryrunner"
SERVICE_GROUP="queryrunner"

echo "======================================"
echo "Query Runner - Production Deployment"
echo "======================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Creating service user: $SERVICE_USER"
    useradd -r -m -d /opt/query-runner -s /sbin/nologin $SERVICE_USER
fi

# Create installation directory
mkdir -p $INSTALL_DIR
chown -R $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR

# Copy application files
echo "Copying application files..."
cp -r /path/to/source/backend $INSTALL_DIR/
cp -r /path/to/source/javaservice $INSTALL_DIR/

chown -R $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR

# Install backend dependencies
echo "Installing backend dependencies..."
cd $INSTALL_DIR/backend
npm ci --production

# Build backend
echo "Building backend..."
npm run build

# Build Java service
echo "Building Java microservice..."
cd $INSTALL_DIR/javaservice
mvn clean package -DskipTests

# Set permissions
chown -R $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR
chmod -R 755 $INSTALL_DIR

# Copy systemd service files
echo "Installing systemd service files..."
cp /path/to/deployment/query-runner-backend.service /etc/systemd/system/
cp /path/to/deployment/query-runner-javaservice.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Create .env file from template
if [ ! -f $INSTALL_DIR/backend/.env ]; then
    echo "Creating .env file..."
    cp $INSTALL_DIR/backend/.env.example $INSTALL_DIR/backend/.env
    echo "Please edit $INSTALL_DIR/backend/.env with your configuration"
fi

# Create log directory
mkdir -p /var/log/query_runner
chown -R $SERVICE_USER:$SERVICE_GROUP /var/log/query_runner
chmod 755 /var/log/query_runner

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit configuration: $INSTALL_DIR/backend/.env"
echo "2. Initialize application: sudo -u $SERVICE_USER npm run init"
echo "3. Start services:"
echo "   systemctl start query-runner-backend"
echo "   systemctl start query-runner-javaservice"
echo "4. Enable on boot:"
echo "   systemctl enable query-runner-backend"
echo "   systemctl enable query-runner-javaservice"
echo ""
echo "Check logs:"
echo "   tail -f /var/log/query_runner/backend.log"
echo "   tail -f /var/log/query_runner/javaservice.log"
echo ""
