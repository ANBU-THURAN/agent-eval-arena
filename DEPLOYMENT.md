# Agent Evaluation Arena - Railway.app Deployment Guide

This guide covers deploying the Agent Evaluation Arena application to Railway.app with full support for WebSockets, persistent database storage, and long-running trading sessions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Setup](#railway-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Frontend Deployment](#frontend-deployment)
6. [SSL/HTTPS Verification](#sslhttps-verification)
7. [Database Backup Strategy](#database-backup-strategy)
8. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
9. [GitHub Actions CI/CD](#github-actions-cicd)

## Prerequisites

- Node.js 20+ installed locally
- Git repository hosted on GitHub
- Railway.app account (sign up at https://railway.app)
- Google API key for Gemini models

## Railway Setup

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

### Step 3: Initialize Railway Project

In your project directory:

```bash
railway init
```

Select "Create new project" and name it `agent-eval-arena`.

### Step 4: Link GitHub Repository (Optional but Recommended)

You can link your GitHub repository for automatic deployments:

1. Go to Railway dashboard (https://railway.app/dashboard)
2. Select your project
3. Click "Settings" → "Connect GitHub"
4. Select your repository

Alternatively, use CLI:

```bash
railway link
```

### Step 5: Create Backend Service

The `railway.toml` file is already configured. Deploy the backend:

```bash
railway up
```

### Step 6: Add Persistent Volume

In the Railway dashboard:

1. Select your backend service
2. Go to "Settings" → "Volumes"
3. Click "Add Volume"
4. Set mount path: `/app/data`
5. Click "Create"

## Environment Configuration

Set the following environment variables in Railway dashboard (Settings → Variables):

### Required Variables

```bash
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=production
DATABASE_PATH=/app/data/arena.db
```

### Optional Variables (with defaults)

```bash
PORT=3000                    # Railway auto-assigns this
SESSION_START_TIME=14:00     # Daily session start time (24h format)
TIMEZONE=UTC                 # Timezone for scheduling
```

### Setting Variables via CLI

```bash
railway variables set GOOGLE_API_KEY="your-api-key"
railway variables set NODE_ENV="production"
railway variables set DATABASE_PATH="/app/data/arena.db"
```

## Database Setup

### Step 1: Run Database Migrations

After initial deployment, run migrations:

```bash
railway run npm run migrate:prod --workspace=backend
```

### Step 2: Seed Initial Data

Seed the database with initial agents, models, and goods:

```bash
railway run npm run db:seed --workspace=backend
```

### Verify Database

Check that the database was created successfully:

```bash
railway connect
ls /app/data/
# Should show: arena.db, arena.db-shm, arena.db-wal
```

## Frontend Deployment

You have two options for deploying the frontend:

### Option A: Serve from Backend (Simpler)

Modify `backend/src/index.ts` to serve static frontend files:

```typescript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... after API routes ...

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
```

Update `backend/Dockerfile` to include frontend build (already included in provided Dockerfile).

Update `frontend/.env.production`:

```env
VITE_API_URL=/api
VITE_WS_URL=wss://your-backend.railway.app/ws
```

### Option B: Deploy to Vercel (Better Performance)

Deploy frontend separately to Vercel for edge caching:

1. Update `frontend/.env.production` with Railway backend URL:

```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_WS_URL=wss://your-backend.railway.app/ws
```

2. Deploy to Vercel:

```bash
cd frontend
vercel --prod
```

3. Update backend CORS to allow Vercel domain:

```typescript
// backend/src/index.ts
app.use(cors({
  origin: ['https://your-frontend.vercel.app'],
  credentials: true
}));
```

## SSL/HTTPS Verification

Railway automatically provides SSL certificates for your deployments.

### Get Your Deployment URL

```bash
railway domain
```

This will show your Railway-assigned domain (e.g., `https://your-app.railway.app`).

### Custom Domain (Optional)

To use a custom domain:

1. Go to Railway dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `arena.yourdomain.com`)
4. Add the provided DNS records to your domain registrar:
   - Type: CNAME
   - Name: arena
   - Value: your-app.railway.app

SSL certificates are automatically provisioned for custom domains.

### Verify SSL

Test your deployment:

```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Database Backup Strategy

### Manual Backup

Use the provided backup script:

```bash
railway run bash /app/scripts/backup-db.sh
```

### Download Backup

```bash
railway connect
# Inside Railway shell:
ls /app/backups/
# Download the latest backup file (use Railway dashboard or scp)
```

### Automated Backups (Optional)

Add a cron job to your backend to run backups automatically.

Install `node-cron` (already included) and add to `backend/src/index.ts`:

```typescript
import cron from 'node-cron';
import { exec } from 'child_process';

// Backup database daily at 2 AM UTC
cron.schedule('0 2 * * *', () => {
  console.log('Running daily database backup...');
  exec('bash /app/scripts/backup-db.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup error: ${error.message}`);
      return;
    }
    console.log(`Backup output: ${stdout}`);
  });
});
```

### Restore from Backup

```bash
railway connect
# Inside Railway shell:
cd /app/data
sqlite3 arena.db ".restore /app/backups/arena_backup_YYYYMMDD_HHMMSS.db"
```

### Cloud Storage (Recommended for Production)

Modify `scripts/backup-db.sh` to upload to AWS S3, Google Cloud Storage, or similar:

```bash
# AWS S3 example
aws s3 cp ${BACKUP_FILE}.gz s3://your-bucket/backups/

# Google Cloud Storage example
gsutil cp ${BACKUP_FILE}.gz gs://your-bucket/backups/
```

## Monitoring & Troubleshooting

### View Logs

Real-time logs:

```bash
railway logs --follow
```

View specific number of recent lines:

```bash
railway logs --tail 100
```

### Health Check

The application exposes a health check endpoint:

```bash
curl https://your-backend.railway.app/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Railway Dashboard Metrics

Monitor in Railway dashboard:

- CPU usage
- Memory usage
- Network traffic
- Deployment history

### Common Issues

#### Issue: Database Locked

**Symptoms**: `SQLITE_BUSY: database is locked` errors

**Solution**:
- Check for concurrent connections
- Increase SQLite timeout in database configuration
- Consider using WAL mode (Write-Ahead Logging)

#### Issue: WebSocket Connection Fails

**Symptoms**: Frontend can't connect to WebSocket

**Solution**:
- Ensure `VITE_WS_URL` uses `wss://` (not `ws://`)
- Check CORS configuration in backend
- Verify Railway domain is correct

#### Issue: Out of Memory

**Symptoms**: Application crashes with OOM errors

**Solution**:
- Upgrade Railway plan for more memory
- Optimize agent execution concurrency
- Add memory limits to Docker container

#### Issue: 404 on Frontend Routes

**Symptoms**: Direct navigation to routes returns 404

**Solution**:
- Check SPA fallback configuration in Express
- Ensure static files are being served correctly

### Debugging

Connect to Railway shell:

```bash
railway connect
```

Inside the shell, you can:

```bash
# Check environment variables
env | grep -i database

# Check database file
ls -lah /app/data/

# Check running processes
ps aux

# Test database connection
sqlite3 /app/data/arena.db "SELECT COUNT(*) FROM agents;"
```

## GitHub Actions CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployments.

### Setup

1. Get your Railway token:

```bash
railway whoami --token
```

2. Add the token to GitHub repository secrets:

   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `RAILWAY_TOKEN`
   - Value: (paste your token)

### Workflow Triggers

The workflow runs on:

- **Pull Requests**: Runs tests and builds (does not deploy)
- **Main Branch Push**: Runs tests, builds, and deploys to Railway

### Manual Deployment

Trigger a deployment manually:

```bash
railway up
```

Or via GitHub Actions:

1. Go to repository → Actions
2. Select "Deploy to Railway" workflow
3. Click "Run workflow"

## Cost Estimation

**Railway.app Pricing**:

- Free tier: $5/month credit (usage-based)
- Estimated usage for this app:
  - Compute: $3-5/month (1 service, moderate traffic)
  - Storage (1GB volume): $0.25/month
  - Network: Minimal (within free allowance)

**Total estimated cost**: $0-5/month (within free tier for low traffic)

For production with higher traffic, consider the Pro plan ($20/month) with more resources.

## Rollback Strategy

### Via Railway Dashboard

1. Go to your service in Railway dashboard
2. Click "Deployments"
3. Find the previous working deployment
4. Click "Redeploy"

### Via CLI

```bash
# List deployments
railway deployments list

# Rollback to specific deployment
railway rollback <deployment-id>
```

### Database Rollback

If you need to restore the database:

```bash
railway connect
cd /app/data
# Backup current database first
cp arena.db arena.db.backup
# Restore from backup
sqlite3 arena.db ".restore /app/backups/arena_backup_YYYYMMDD_HHMMSS.db"
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with secrets
2. **API Key Rotation**: Regularly rotate `GOOGLE_API_KEY` in Railway dashboard
3. **CORS Configuration**: Restrict allowed origins in production
4. **Database Access**: Volume is private to your service only
5. **HTTPS**: All traffic is encrypted via Railway's automatic SSL
6. **Rate Limiting**: Consider adding rate limiting for API endpoints

## Next Steps

After successful deployment:

1. ✅ Verify health check endpoint
2. ✅ Test WebSocket connections
3. ✅ Trigger a trading session manually (if applicable)
4. ✅ Monitor logs for any errors
5. ✅ Set up database backups
6. ✅ Configure custom domain (optional)
7. ✅ Set up monitoring alerts (Railway integrations)

## Support

For issues specific to:

- **Railway Platform**: https://railway.app/help
- **Application Issues**: Open an issue in the GitHub repository
- **Railway CLI**: `railway help`

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [WebSocket Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
