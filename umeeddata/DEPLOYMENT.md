# Umeed Now Foundation - VPS Deployment Guide
## Domain: umeeddata.in

---

## Prerequisites
- Ubuntu 22.04+ VPS (minimum 2GB RAM, 1 vCPU)
- Domain `umeeddata.in` pointed to your VPS IP (A record)
- SSH root access to the server

---

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential software-properties-common ufw
```

## Step 2: Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn

# Verify
node -v   # should be v20.x
yarn -v
```

## Step 3: Install Python 3.11+

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Verify
python3.11 --version
```

## Step 4: Install MongoDB 7.0

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.runCommand({ ping: 1 })"
```

## Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

## Step 6: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 7: Upload Application Code

```bash
# Create app directory
sudo mkdir -p /umeeddata
sudo chown $USER:$USER /umeeddata

# Option A: Clone from GitHub
cd /umeeddata
git clone <your-repo-url> .

# Option B: Upload via SCP from local machine
# scp -r ./backend ./frontend user@your-vps-ip:/umeeddata/
```

Your folder structure should look like:
```
/umeeddata/
  backend/
    server.py
    requirements.txt
    .env          <-- we create this below
  frontend/
    src/
    package.json
    .env          <-- we create this below
```

## Step 8: Create Environment Files

### Backend .env (`/umeeddata/backend/.env`)

```bash
cp /umeeddata/backend/.env.production /umeeddata/backend/.env
```

Or create manually — see the `backend/.env.production` file in this folder.

> **IMPORTANT**: Change `JWT_SECRET` to a unique random string. Generate one with:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```
> Also change `ADMIN_PASSWORD` to a strong password.

### Frontend .env (`/umeeddata/frontend/.env`)

```bash
cp /umeeddata/frontend/.env.production /umeeddata/frontend/.env
```

Or create manually — see the `frontend/.env.production` file in this folder.

## Step 9: Install Backend Dependencies

```bash
cd /umeeddata/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

## Step 10: Build Frontend

```bash
cd /umeeddata/frontend
yarn install
yarn build
```

This creates `/umeeddata/frontend/build/` with the static files.

## Step 11: Configure Nginx

```bash
sudo cp /umeeddata/nginx/umeeddata.conf /etc/nginx/sites-available/umeeddata.in
sudo ln -sf /etc/nginx/sites-available/umeeddata.in /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

See the `nginx/umeeddata.conf` file in this folder for the full config.

## Step 12: Install SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d umeeddata.in -d www.umeeddata.in

# Auto-renewal is set up automatically. Verify:
sudo certbot renew --dry-run
```

## Step 13: Create Systemd Service for Backend

```bash
sudo cp /umeeddata/systemd/umeeddata-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable umeeddata-backend
sudo systemctl start umeeddata-backend

# Check status
sudo systemctl status umeeddata-backend

# View logs
sudo journalctl -u umeeddata-backend -f
```

## Step 14: Verify Deployment

```bash
# Check backend is running
curl http://localhost:8001/api/auth/me

# Check frontend is served
curl -I https://umeeddata.in

# Check full flow
curl -X POST https://umeeddata.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@umeednow.org","password":"YOUR_ADMIN_PASSWORD"}'
```

---

## Maintenance Commands

```bash
# Restart backend
sudo systemctl restart umeeddata-backend

# View backend logs
sudo journalctl -u umeeddata-backend -f --no-pager -n 100

# Rebuild frontend after code changes
cd /umeeddata/frontend && yarn build && sudo systemctl reload nginx

# MongoDB shell
mongosh umeed_now_finance

# Check disk usage
df -h

# Check memory
free -h
```

## Updating the Application

```bash
cd /umeeddata

# Pull latest code
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart umeeddata-backend

# Update frontend
cd ../frontend
yarn install
yarn build
sudo systemctl reload nginx
```

## Troubleshooting

| Issue | Fix |
|---|---|
| Backend won't start | Check logs: `journalctl -u umeeddata-backend -n 50` |
| MongoDB connection error | Verify MongoDB running: `sudo systemctl status mongod` |
| 502 Bad Gateway | Backend not running or wrong port in Nginx config |
| SSL issues | Re-run: `sudo certbot --nginx -d umeeddata.in` |
| Frontend shows blank | Check build: `ls /umeeddata/frontend/build/index.html` |
| CORS errors | Verify `FRONTEND_URL` in backend `.env` matches domain |
