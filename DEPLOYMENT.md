# 🚀 Sportfolio Deployment Guide

## Overview
This guide will help you deploy Sportfolio as a production web app with automated daily data updates.

## Architecture
- **Frontend**: Vercel (React/Vite)
- **Backend API**: Railway (FastAPI/Python)
- **Database**: Supabase (PostgreSQL)
- **Cron Jobs**: GitHub Actions
- **Domain**: sportfolio.app

---

## 📦 Prerequisites

1. GitHub account (for code hosting and Actions)
2. Vercel account (sign up at vercel.com)
3. Railway account (sign up at railway.app)
4. Domain registrar account (Namecheap, GoDaddy, etc.) - Optional

---

## 🔧 Step 1: Prepare Repository

### 1.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sportfolio.git
git push -u origin main
```

### 1.2 Set Repository to Public
- Go to Settings → Danger Zone → Change visibility → Public
- (Required for free GitHub Actions)

---

## 🖥️ Step 2: Deploy Backend API (Railway)

### 2.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `sportfolio` repository
4. Choose "Deploy from root directory"

### 2.2 Configure Build Settings
1. In Railway dashboard, click your service
2. Go to "Settings" → "Build"
3. Set:
   - **Root Directory**: `api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.3 Add Environment Variables
1. Go to "Variables" tab
2. Add these variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   PORT=8000
   ```

### 2.4 Get Your API URL
- Copy the public URL (e.g., `https://sportfolio-api.railway.app`)
- Save this for frontend configuration

---

## 🌐 Step 3: Deploy Frontend (Vercel)

### 3.1 Update API URL
1. Edit `client/src/App.jsx`
2. Change `apiUrl` to your Railway URL:
   ```javascript
   const apiUrl = 'https://sportfolio-api.railway.app'
   ```

### 3.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

### 3.3 Configure Custom Domain (Optional)
1. Buy `sportfolio.app` from Namecheap (~$12/year)
2. In Vercel, go to "Settings" → "Domains"
3. Add `sportfolio.app` and `www.sportfolio.app`
4. Update DNS records at Namecheap:
   ```
   Type: A
   Host: @
   Value: 76.76.21.21
   
   Type: CNAME
   Host: www
   Value: cname.vercel-dns.com
   ```
5. Wait 24-48 hours for DNS propagation

---

## ⏰ Step 4: Setup Automated Scraper (GitHub Actions)

### 4.1 Add GitHub Secrets
1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Add secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase service key

### 4.2 Enable GitHub Actions
1. Go to "Actions" tab in your repo
2. Enable workflows
3. The scraper will run automatically at 3 AM EST daily

### 4.3 Test Manual Run
1. Go to Actions → "Daily NBA Data Scraper"
2. Click "Run workflow" → "Run workflow"
3. Check logs to ensure it works

---

## 🔒 Security Checklist

### ✅ Environment Variables
- [ ] Never commit `.env` files
- [ ] Use Railway/Vercel environment variables
- [ ] Rotate Supabase keys if exposed

### ✅ API Security
- [ ] Add CORS restrictions in `api/main.py`:
  ```python
  allow_origins=["https://sportfolio.app", "https://www.sportfolio.app"]
  ```
- [ ] Add rate limiting (optional)
- [ ] Enable Supabase Row Level Security

### ✅ Database
- [ ] Backup Supabase data regularly
- [ ] Monitor usage (free tier: 500MB, 50K rows)
- [ ] Set up alerts for quota limits

---

## 📊 Monitoring & Maintenance

### Check Scraper Status
- GitHub Actions → View workflow runs
- Check for failed runs and debug

### Monitor API Health
- Railway dashboard → Metrics
- Check response times and errors

### Database Health
- Supabase dashboard → Database
- Monitor storage and row count

### Update ML Model
Run this monthly to retrain with new data:
```bash
cd scraper
python ml_trade_advisor.py
```
Then commit the updated `ml_trade_model.pkl` file.

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| Vercel | ✅ Unlimited | $20/month Pro |
| Railway | ✅ $5/month credit | $5/month |
| Supabase | ✅ 500MB, 50K rows | $25/month Pro |
| GitHub Actions | ✅ 2000 min/month | $4/month |
| Domain | ❌ $12/year | - |
| **Total** | **$12/year** | **$54/month** |

---

## 🐛 Troubleshooting

### Frontend not loading
- Check Vercel deployment logs
- Verify API URL is correct
- Check browser console for errors

### API returning 500 errors
- Check Railway logs
- Verify environment variables
- Test endpoints manually

### Scraper failing
- Check GitHub Actions logs
- Verify Supabase credentials
- Test scraper locally first

### Database full
- Upgrade Supabase plan ($25/month)
- Or delete old data:
  ```sql
  DELETE FROM player_value_index WHERE value_date < NOW() - INTERVAL '90 days';
  ```

---

## 🚀 Going Live Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] GitHub Actions scraper working
- [ ] All environment variables set
- [ ] CORS configured
- [ ] Test all features in production
- [ ] Monitor for 24 hours
- [ ] Share with users! 🎉

---

## 📱 Future: Mobile App

When ready to build mobile app:
1. Use **React Native** or **Flutter**
2. Reuse same Railway API
3. Deploy to:
   - iOS: Apple App Store ($99/year)
   - Android: Google Play Store ($25 one-time)

---

## 🆘 Support

If you encounter issues:
1. Check deployment logs
2. Review this guide
3. Test locally first
4. Check service status pages

Good luck with your deployment! 🚀
