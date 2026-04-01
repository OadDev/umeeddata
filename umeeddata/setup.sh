#!/bin/bash
# Quick setup script for Umeed Now Foundation on VPS
# Domain: umeeddata.in
# Run as root: sudo bash setup.sh

set -e

echo "================================"
echo "Umeed Now Foundation - VPS Setup"
echo "Domain: umeeddata.in"
echo "================================"

# Update system
echo "[1/9] Updating system..."
apt update && apt upgrade -y

# Install essentials
echo "[2/9] Installing essentials..."
apt install -y curl wget git build-essential software-properties-common ufw nginx

# Install Node.js 20
echo "[3/9] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn

# Install Python 3.11
echo "[4/9] Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt install -y python3.11 python3.11-venv python3.11-dev

# Install MongoDB 7.0
echo "[5/9] Installing MongoDB 7.0..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Setup backend
echo "[6/9] Setting up backend..."
cd /umeeddata/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Build frontend
echo "[7/9] Building frontend..."
cd /umeeddata/frontend
cp .env.production .env
yarn install
yarn build

# Setup Nginx
echo "[8/9] Configuring Nginx..."
cp /umeeddata/nginx/umeeddata.conf /etc/nginx/sites-available/umeeddata.in
ln -sf /etc/nginx/sites-available/umeeddata.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Setup systemd service
echo "[9/9] Setting up backend service..."
cp /umeeddata/systemd/umeeddata-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable umeeddata-backend
systemctl start umeeddata-backend

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

echo ""
echo "================================"
echo "Setup complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Edit /umeeddata/backend/.env - change JWT_SECRET and ADMIN_PASSWORD"
echo "2. Restart backend: sudo systemctl restart umeeddata-backend"
echo "3. Install SSL: sudo apt install certbot python3-certbot-nginx"
echo "4. Run: sudo certbot --nginx -d umeeddata.in -d www.umeeddata.in"
echo "5. Open https://umeeddata.in in your browser"
echo "================================"
