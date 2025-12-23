#!/bin/bash

set -e

echo "========================================="
echo "Query Runner - Automated Setup Script"
echo "========================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

echo "Step 1: Installing Node.js 24..."
curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
yum install -y nodejs
echo "✓ Node.js installed: $(node --version)"
echo ""

echo "Step 2: Installing Java 21..."
yum install -y java-21-openjdk java-21-openjdk-devel
echo "✓ Java installed: $(java -version 2>&1 | head -1)"
echo ""

echo "Step 3: Installing PostgreSQL 15..."
yum install -y postgresql-server postgresql-contrib

# Initialize database if not already done
if [ ! -d /var/lib/pgsql/data/base ]; then
    /usr/bin/postgresql-setup initdb
    if [ $? -ne 0 ]; then
        echo "Error: Failed to initialize PostgreSQL database"
        exit 1
    fi
fi

systemctl start postgresql
systemctl enable postgresql

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
        echo "✓ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: PostgreSQL failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done
echo ""

echo "Step 4: Creating PostgreSQL database and user..."
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE query_runner;
CREATE USER qrapp WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER ROLE qrapp SET client_encoding TO 'utf8';
ALTER ROLE qrapp SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE query_runner TO qrapp;
EOF

if [ $? -ne 0 ]; then
    echo "Error: Failed to create database and user"
    exit 1
fi
mkdir -p /var/log/query_runner
echo "$POSTGRES_PASSWORD" > /var/log/query_runner/postgres_password.log
chmod 600 /var/log/query_runner/postgres_password.log
echo "✓ PostgreSQL database and user created"
echo "  Database: query_runner"
echo "  User: qrapp"
echo "  Password saved to: /var/log/query_runner/postgres_password.log"
echo ""

echo "Step 5: Installing HashiCorp Vault 1.16..."
VAULT_VERSION="1.16.0"
VAULT_URL="https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip"
cd /tmp
wget -q "$VAULT_URL"
unzip -o "vault_${VAULT_VERSION}_linux_amd64.zip"
mv vault /usr/local/bin/
chmod +x /usr/local/bin/vault
rm "vault_${VAULT_VERSION}_linux_amd64.zip"
echo "✓ Vault installed: $(vault version)"
echo ""

echo "Step 6: Setting up Vault..."
mkdir -p /opt/vault
mkdir -p /var/log/query_runner

# Create Vault configuration file
mkdir -p /etc/vault
cat > /etc/vault/vault.hcl <<'VAULT_CONFIG'
storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address       = "127.0.0.1:8200"
  tls_disable   = 1
}

api_addr = "http://127.0.0.1:8200"
cluster_addr = "http://127.0.0.1:8201"
ui = true
VAULT_CONFIG

mkdir -p /opt/vault/data
chmod 700 /opt/vault/data

# Create Vault systemd service file
cat > /etc/systemd/system/vault.service <<'VAULT_SERVICE'
[Unit]
Description=HashiCorp Vault
Requires=network-online.target
After=network-online.target
ConditionFileNotEmpty=/etc/vault/vault.hcl

[Service]
ProtectSystem=full
ProtectHome=yes
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
AmbientCapabilities=CAP_IPC_LOCK
CapabilityBoundingSet=CAP_SYSLOG CAP_IPC_LOCK
LimitNOFILE=65536
LimitNPROC=512
KillMode=process
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
ExecStart=/usr/local/bin/vault server -config=/etc/vault/vault.hcl
ExecReload=/bin/kill -HUP $MAINPID
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vault

[Install]
WantedBy=multi-user.target
VAULT_SERVICE

systemctl daemon-reload
systemctl enable vault
systemctl start vault

# Wait for Vault to start
echo "Waiting for Vault to start..."
sleep 3

# Initialize Vault
export VAULT_ADDR="http://127.0.0.1:8200"
echo "✓ Vault started at $VAULT_ADDR"
echo ""

echo "Step 7: Initializing Vault..."
VAULT_INIT=$(vault operator init -key-shares=5 -key-threshold=3 -format=json)

# Extract and save unseal keys and root token
UNSEAL_KEYS=$(echo "$VAULT_INIT" | jq -r '.unseal_keys_b64[]')
ROOT_TOKEN=$(echo "$VAULT_INIT" | jq -r '.root_token')

# Save to secure file
cat > /var/log/query_runner/vault_init.log <<EOF
=== VAULT INITIALIZATION KEYS ===
SAVE THESE IN A SECURE LOCATION - YOU WILL NEED THEM FOR RECOVERY
Keep the unseal keys and root token in a secure, offline location.

Root Token (used for app initialization):
$ROOT_TOKEN

Unseal Keys (need 3 of 5 to unseal):
$UNSEAL_KEYS

Vault Address:
$VAULT_ADDR

To unseal Vault after restart:
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

To login:
vault login $ROOT_TOKEN

=== END VAULT INITIALIZATION ===
EOF

chmod 600 /var/log/query_runner/vault_init.log
echo "✓ Vault initialized successfully"
echo "  Root token and unseal keys saved to: /var/log/query_runner/vault_init.log"
echo "  KEEP THIS FILE IN A SECURE LOCATION!"
echo ""

# Unseal Vault automatically for development (use first 3 keys)
echo "Step 8: Unsealing Vault..."
UNSEAL_KEY_1=$(echo "$UNSEAL_KEYS" | sed -n '1p')
UNSEAL_KEY_2=$(echo "$UNSEAL_KEYS" | sed -n '2p')
UNSEAL_KEY_3=$(echo "$UNSEAL_KEYS" | sed -n '3p')

vault operator unseal "$UNSEAL_KEY_1" > /dev/null
vault operator unseal "$UNSEAL_KEY_2" > /dev/null
vault operator unseal "$UNSEAL_KEY_3" > /dev/null

echo "✓ Vault unsealed"
echo ""

# Configure Vault for app
echo "Step 9: Configuring Vault for Query Runner..."
export VAULT_TOKEN="$ROOT_TOKEN"

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2 2>/dev/null || true

# Create app auth token with limited permissions
APP_TOKEN=$(vault token create -policy=default -ttl=720h -format=json | jq -r '.auth.client_token')

echo "✓ Vault configured for application"
echo "  App token: $APP_TOKEN"
echo ""

echo "Step 10: Creating application directories..."
mkdir -p /opt/query-runner
mkdir -p /var/log/query_runner
mkdir -p /opt/query-runner/backend
mkdir -p /opt/query-runner/javaservice

echo "✓ Directories created"
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Secure the vault initialization file:"
echo "   sudo cp /var/log/query_runner/vault_init.log /secure/location/"
echo "   sudo shred -vfz -n 3 /var/log/query_runner/vault_init.log"
echo ""
echo "2. Update backend .env file with:"
echo "   DB_PASSWORD=$POSTGRES_PASSWORD"
echo "   VAULT_TOKEN=$APP_TOKEN"
echo "   VAULT_ADDR=$VAULT_ADDR"
echo ""
echo "3. Continue with application setup:"
echo "   cd backend"
echo "   cp .env.example .env"
echo "   nano .env  # Add passwords and tokens"
echo "   npm install"
echo "   npm run init"
echo ""
echo "4. Check initial admin password:"
echo "   cat /var/log/query_runner/qradmin_password.log"
echo ""
echo "5. Start services:"
echo "   npm run dev  # for development"
echo "   sudo systemctl start query-runner-backend  # for production"
echo ""
echo "Important Security Notes:"
echo "- Keep /var/log/query_runner/vault_init.log in a secure, offline location"
echo "- Distribute unseal keys to 3+ trusted individuals"
echo "- Change qradmin password on first login"
echo "- Store PostgreSQL password securely"
echo "- Rotate secrets regularly in production"
echo ""
