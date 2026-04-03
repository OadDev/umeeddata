# Umeed Now Foundation - Railway Deployment Guide
## Domain: umeeddata.in

---

## Architecture
Single container deployment — FastAPI serves both the API (`/api/*`) and the React frontend (all other routes). MongoDB is provisioned as a separate Railway service.

---

## Step 1: Push Code to GitHub

Make sure your repository has this structure at the root:
```
/
├── Dockerfile
├── railway.toml
├── .dockerignore
├── backend/
│   ├── server.py
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── package.json
    └── yarn.lock
```

> Use the "Save to GitHub" button in Emergent, or push manually.

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub Repo"**
4. Connect your GitHub account and select the repository

---

## Step 3: Add MongoDB

1. In your Railway project, click **"+ New"** → **"Database"** → **"MongoDB"**
2. Railway will provision a MongoDB instance
3. Once created, click the MongoDB service → **"Variables"** tab
4. Copy the **`MONGO_URL`** value (it looks like `mongodb://mongo:PASSWORD@HOST:PORT/railway`)

---

## Step 4: Set Environment Variables

Click on your **app service** (not MongoDB) → **"Variables"** tab → Add these:

| Variable | Value |
|---|---|
| `MONGO_URL` | Paste the MongoDB connection string from Step 3 |
| `DB_NAME` | `umeed_now_finance` |
| `JWT_SECRET` | Generate one: run `python3 -c "import secrets; print(secrets.token_hex(32))"` locally |
| `ADMIN_EMAIL` | `admin@umeed.org` |
| `ADMIN_PASSWORD` | `admin123` (change to something strong for production) |
| `FRONTEND_URL` | `https://umeeddata.in` |
| `CORS_ORIGINS` | `https://umeeddata.in,https://www.umeeddata.in` |
| `REACT_APP_BACKEND_URL` | *(leave empty — see note below)* |
| `PORT` | `8001` |

> **Note on REACT_APP_BACKEND_URL**: Leave it as an empty string `""`. Since FastAPI serves both frontend and API from the same origin, the frontend will call `/api/*` on the same domain. This is already handled in the Dockerfile build arg.

---

## Step 5: Deploy

Railway will auto-detect the `Dockerfile` and `railway.toml` and start building.

Watch the build logs. It will:
1. Build the React frontend (`yarn build`)
2. Install Python dependencies
3. Copy the static build into the backend
4. Start uvicorn

The deploy takes ~3-5 minutes on first build.

---

## Step 6: Get Your Railway URL

Once deployed:
1. Click your app service → **"Settings"** tab
2. Under **"Networking"**, click **"Generate Domain"**
3. You'll get a URL like `your-app-name.up.railway.app`
4. Test it: open `https://your-app-name.up.railway.app` in your browser

---

## Step 7: Connect Custom Domain (umeeddata.in)

1. In Railway, go to your app service → **"Settings"** → **"Networking"**
2. Click **"+ Custom Domain"**
3. Enter `umeeddata.in`
4. Railway will show you a **CNAME** record to add
5. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
6. Add a **CNAME** record:
   - **Name**: `@` (or leave blank for root domain)
   - **Value**: The value Railway provided (e.g., `your-app.up.railway.app`)
7. If your registrar doesn't support CNAME on root, add for `www`:
   - **Name**: `www`
   - **Value**: The Railway CNAME value
8. Wait for DNS propagation (5 min to 48 hours)
9. Railway auto-provisions SSL — no manual certificate needed

> **After connecting domain**, update these environment variables:
> - `FRONTEND_URL` = `https://umeeddata.in`
> - `CORS_ORIGINS` = `https://umeeddata.in,https://www.umeeddata.in`
> Railway will auto-redeploy after variable changes.

---

## Step 8: Verify

```bash
# Health check
curl https://umeeddata.in/api/health

# Login
curl -X POST https://umeeddata.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@umeed.org","password":"admin123"}'
```

Open `https://umeeddata.in` — you should see the login page.

---

## Updating the App

Just push to GitHub. Railway auto-deploys on every push to the main branch.

```bash
git add .
git commit -m "update: description"
git push origin main
```

Railway will rebuild and deploy automatically (~2-3 minutes).

---

## Monitoring & Logs

- **Logs**: Click your service → **"Deployments"** → Click latest deployment → View logs
- **Metrics**: Railway dashboard shows CPU, memory, and network usage
- **MongoDB**: Click the MongoDB service to see connection stats

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Build fails at `yarn install` | Check `frontend/package.json` is committed |
| Build fails at `pip install` | Check `backend/requirements.txt` is committed |
| "Application Error" after deploy | Check logs for Python errors |
| Login fails with "Something went wrong" | Verify `MONGO_URL` env var is correct |
| Static files not loading | Ensure Dockerfile copies `build/` to `static/` |
| Custom domain not working | Check CNAME in your registrar, wait for DNS propagation |
| MongoDB connection error | Check Railway MongoDB service is running, check `MONGO_URL` |

---

## Cost Estimate

Railway pricing (as of 2026):
- **Starter plan**: $5/month includes $5 of usage
- **App service**: ~$2-5/month for low traffic
- **MongoDB**: ~$2-5/month (usage-based)
- **Total**: ~$5-10/month for a small team

---

## Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@umeed.org | admin123 |
| User | user@umeed.org | user123 |
