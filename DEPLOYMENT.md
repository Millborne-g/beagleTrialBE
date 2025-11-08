# Deployment Guide

This guide explains how to deploy the Weather Radar Backend API.

## Quick Deploy to Render.com (Recommended)

Render.com offers a free tier that's perfect for this application.

### Step 1: Prepare Your Repository

1. Make sure all changes are committed and pushed to GitHub:
```bash
git add .
git commit -m "Add radar backend implementation"
git push origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with your GitHub account

### Step 3: Create New Web Service

1. Click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Select your `beagleTrialBE` repository

### Step 4: Configure Service

**Basic Settings:**
- Name: `weather-radar-api` (or your preferred name)
- Region: Choose closest to your users
- Branch: `main`
- Root Directory: Leave empty
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables:**
Click "Advanced" and add:
- Key: `BASE_URL`
- Value: `https://weather-radar-api.onrender.com` (replace with your actual Render URL)

**Note:** Render automatically provides the `PORT` environment variable.

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for the deployment to complete (usually 2-5 minutes)
3. Your API will be available at `https://your-app-name.onrender.com`

### Step 6: Test Your Deployment

Test the endpoints:
```bash
curl https://your-app-name.onrender.com/api/health
curl https://your-app-name.onrender.com/api/radar/latest
```

## Alternative: Deploy to Railway

Railway also offers a free tier and is very easy to use.

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js and deploy
6. Add environment variable `BASE_URL` in the Variables tab

## Alternative: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create weather-radar-api`
4. Set environment variables:
   ```bash
   heroku config:set BASE_URL=https://weather-radar-api.herokuapp.com
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

## Important Notes

### Free Tier Limitations

- **Render.com**: Services on free tier spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.
- **Railway**: 500 hours/month on free tier
- **Heroku**: Free tier has been discontinued (paid plans only)

### GRIB2 Processing

The application currently uses sample data generation because GRIB2 parsing tools (wgrib2) are not available in Node.js without native dependencies.

**For Production Use with Real MRMS Data:**

You have two options:

1. **Install wgrib2 on your server:**
   - This requires a Linux server with build tools
   - Install wgrib2: https://www.cpc.ncep.noaa.gov/products/wesley/wgrib2/
   - The application will automatically use it if available

2. **Use Python backend instead:**
   - Python has better GRIB2 support with `pygrib`
   - See the requirements document for Python implementation details

### Data Storage

The application stores:
- Downloaded GRIB2 files in `/data` directory
- Generated images in `/images` directory

These are automatically cleaned up to prevent disk space issues:
- Keeps last 10 GRIB2 files
- Keeps last 20 images

### CORS Configuration

The application allows all origins by default (`origin: "*"`). For production, you should restrict this:

In `index.js`, update:
```javascript
cors({
    origin: "https://your-frontend-domain.com",
    credentials: true,
})
```

## Troubleshooting

### Server won't start
- Check logs for errors
- Verify all dependencies are installed: `npm install`
- Check PORT configuration

### No radar data
- Check if MRMS website is accessible
- Review server logs for errors
- The app will use sample data as fallback

### Images not loading
- Verify `/images` directory exists and is writable
- Check BASE_URL environment variable is correct
- Ensure static file serving is working: test `{BASE_URL}/images/`

## Monitoring

- Check server status: `GET /api/health`
- View scheduler status in server logs
- Monitor disk space usage for data/images directories

## Updating Your Deployment

After making changes:

1. Commit and push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

2. On Render/Railway: The app will automatically redeploy

3. On Heroku:
```bash
git push heroku main
```

## Support

For issues or questions:
- Check server logs first
- Verify environment variables are set correctly
- Test endpoints using curl or Postman
- Review the README.md for API documentation

