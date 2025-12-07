# 🚂 Railway Deployment Guide - MSME Passport

Complete step-by-step guide to deploy your MSME Passport application to Railway for free.

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Neon Database** - Free PostgreSQL database (you're already using this)

---

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

If your code isn't on GitHub yet:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 1.2 Verify .gitignore

Make sure `.env` is in your `.gitignore` (it should be):
```
node_modules
dist
.env
.DS_Store
server/public
```

---

## Step 2: Set Up Neon Database (If Not Done)

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project
4. Copy your **Connection String** (looks like: `postgresql://user:pass@host/dbname`)
5. Save this - you'll need it for Railway

---

## Step 3: Deploy to Railway

### 3.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with GitHub (recommended) or email

### 3.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your repository
5. Railway will auto-detect it's a Node.js project

### 3.3 Configure Build Settings

Railway should auto-detect, but verify:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Root Directory**: `/` (root of your repo)

If not auto-detected, go to **Settings** → **Build & Deploy** and set:
- Build Command: `npm run build`
- Start Command: `npm run start`

---

## Step 4: Set Environment Variables

Go to your Railway project → **Variables** tab and add:

### Required Variables:

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Environment
NODE_ENV=production

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-random-string-here-min-32-chars

# App URLs (Railway will provide your app URL)
APP_BASE_URL=https://your-app-name.railway.app
SERVER_BASE_URL=https://your-app-name.railway.app
```

### Optional Variables (for email):

```env
# Email Configuration (optional - uses Ethereal test emails if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### How to Get Your Railway URL:

1. After deployment, Railway gives you a URL like: `your-app-name.railway.app`
2. Use this for `APP_BASE_URL` and `SERVER_BASE_URL`
3. Update the variables and redeploy

### Generate SESSION_SECRET:

```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use an online generator:
# https://randomkeygen.com/
```

---

## Step 5: Run Database Migrations

After first deployment, you need to set up your database schema:

### Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run npm run db:push
   ```

### Option B: Using Railway Dashboard

1. Go to your project → **Deployments**
2. Click on the latest deployment
3. Open **Shell** tab
4. Run:
   ```bash
   npm run db:push
   ```

---

## Step 6: Verify Deployment

1. **Check Deployment Status**:
   - Go to Railway dashboard
   - Check **Deployments** tab
   - Should show "Active" status

2. **Test Your App**:
   - Click on your service
   - Click **"Generate Domain"** to get a public URL
   - Visit the URL in your browser
   - Should see your MSME Passport app!

3. **Check Logs**:
   - Go to **Deployments** → Click on deployment → **View Logs**
   - Look for any errors

---

## Step 7: Set Up Custom Domain (Optional)

1. Go to your service → **Settings** → **Networking**
2. Click **"Generate Domain"** (if not done)
3. Or add your custom domain:
   - Click **"Custom Domain"**
   - Add your domain
   - Update DNS records as instructed

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Build command failed"**
- Check build logs in Railway
- Make sure `package.json` has correct build script
- Verify all dependencies are in `package.json`

**Solution:**
```bash
# Test build locally first
npm run build
```

### App Crashes on Start

**Error: "Application error"**
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Check logs for specific errors

**Solution:**
1. Go to **Deployments** → **Logs**
2. Look for error messages
3. Common issues:
   - Missing `DATABASE_URL`
   - Wrong `SESSION_SECRET` format
   - Database connection failed

### Database Connection Issues

**Error: "Connection refused" or "Database error"**
- Verify `DATABASE_URL` is correct
- Check Neon database is running
- Ensure SSL mode is enabled: `?sslmode=require`

**Solution:**
1. Go to Neon dashboard
2. Copy connection string again
3. Make sure it includes `?sslmode=require`
4. Update `DATABASE_URL` in Railway
5. Redeploy

### Port Issues

**Error: "Port already in use"**
- Railway sets `PORT` automatically
- Your code already uses `process.env.PORT || '5000'`
- This should work automatically ✅

### Email Not Working

**Emails not sending:**
- If SMTP not configured, uses Ethereal (test emails)
- Check logs for email preview URLs
- For production, set up real SMTP (Gmail, SendGrid, etc.)

---

## 📊 Monitoring & Management

### View Logs
- **Dashboard** → **Deployments** → Click deployment → **Logs**
- Real-time logs available

### Restart Service
- **Dashboard** → **Deployments** → **Redeploy**

### Update Environment Variables
- **Dashboard** → **Variables** → Edit → **Redeploy**

### View Metrics
- **Dashboard** → **Metrics** tab
- CPU, Memory, Network usage

---

## 💰 Free Tier Limits

Railway Free Tier ($5 credit/month):
- ✅ Usually enough for small apps
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Spins down after inactivity (cold starts)
- ⚠️ Limited to $5 worth of usage

**Tips to stay free:**
- Use Neon for database (separate free tier)
- Monitor usage in Railway dashboard
- Upgrade only if needed

---

## 🎉 You're Live!

Your app should now be accessible at:
- `https://your-app-name.railway.app`

### Next Steps:

1. ✅ Test all features
2. ✅ Set up email (SMTP) for production
3. ✅ Add custom domain (optional)
4. ✅ Set up monitoring
5. ✅ Configure backups (Neon has automatic backups)

---

## 🔄 Updating Your App

To update your app:

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Update app"
   git push
   ```

2. **Railway auto-deploys:**
   - Railway watches your GitHub repo
   - Automatically builds and deploys on push
   - Check **Deployments** tab for status

3. **Manual deploy:**
   - Go to Railway dashboard
   - Click **"Redeploy"**

---

## 📝 Quick Reference

### Important URLs:
- **Railway Dashboard**: [railway.app](https://railway.app)
- **Neon Dashboard**: [neon.tech](https://neon.tech)
- **Your App**: `https://your-app-name.railway.app`

### Key Commands:
```bash
# Local build test
npm run build

# Local start test
npm run start

# Database migration (on Railway)
railway run npm run db:push
```

### Environment Variables Checklist:
- [ ] `DATABASE_URL` (from Neon)
- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` (random string)
- [ ] `APP_BASE_URL` (your Railway URL)
- [ ] `SERVER_BASE_URL` (your Railway URL)
- [ ] `SMTP_*` (optional, for email)

---

## 🆘 Need Help?

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Check Logs**: Railway dashboard → Deployments → Logs

---

**Happy Deploying! 🚀**

