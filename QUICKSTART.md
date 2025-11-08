# Quick Start Guide

Get your Weather Radar Backend up and running in 5 minutes!

## Step 1: Verify Installation

```bash
cd c:\Users\User\Documents\GitHub\beagleTrialBE
npm install
```

## Step 2: Configure Environment

The `.env` file should already exist. Verify it contains:

```env
PORT=5000
BASE_URL=http://localhost:5000
```

## Step 3: Start the Server

### For Development (with auto-restart):
```bash
npm run dev
```

### For Production:
```bash
npm start
```

You should see:
```
Server is running on port 5000
Base URL: http://localhost:5000
Radar data scheduler started (runs every 2 minutes)
```

## Step 4: Test the API

Open a new terminal/PowerShell window and test:

### Health Check
```powershell
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Weather Radar API",
  "timestamp": "2025-11-08T..."
}
```

### Get Latest Radar Data
```powershell
curl http://localhost:5000/api/radar/latest
```

Expected response:
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-08T...",
    "imageUrl": "http://localhost:5000/images/radar_....png",
    "bounds": {
      "north": 49,
      "south": 25,
      "east": -66,
      "west": -125
    },
    "metadata": {
      "dataType": "RALA",
      "updateInterval": 2,
      "source": "MRMS",
      "units": "dBZ"
    }
  }
}
```

## Step 5: View the Radar Image

Copy the `imageUrl` from the response above and paste it into your browser, or use:

```powershell
# Get the image URL and open in browser
$response = Invoke-RestMethod -Uri http://localhost:5000/api/radar/latest
Start-Process $response.data.imageUrl
```

You should see a radar image showing weather patterns!

## Step 6: Test Auto-Refresh

The backend automatically fetches new data every 2 minutes. Check the server logs:

```
Initial radar data fetch...
Generating sample radar data for testing...
Generating radar image: radar_1762609308328.png
...
```

## What's Running?

- ✅ **Express Server**: Serving API on port 5000
- ✅ **Scheduler**: Auto-updates radar data every 2 minutes
- ✅ **Static Files**: Serving images from `/images` directory
- ✅ **CORS**: Enabled for frontend integration
- ✅ **Caching**: In-memory cache for faster responses

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/radar/latest` | Latest radar data |
| `GET /api/radar/timestamps` | Available timestamps |
| `GET /api/radar/timestamp/:ts` | Specific timestamp |
| `GET /images/*.png` | Radar images |

## Next Steps

### 1. **Integrate with Frontend**
See `FRONTEND_INTEGRATION.md` for React examples with Leaflet/Mapbox

### 2. **Deploy to Production**
See `DEPLOYMENT.md` for Render.com deployment instructions

### 3. **Customize**
- Adjust update interval in `services/scheduler.js`
- Change image size in `services/imageGenerator.js`
- Modify color scale in `utils/colorScale.js`

## Common Issues

### Port Already in Use
```bash
# Find and kill process on port 5000 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Permission Errors
- Run terminal as Administrator
- Check folder permissions for `data/` and `images/` directories

### Module Not Found
```bash
npm install
```

## Monitoring

Watch the server logs for:
- Initial data fetch (5 seconds after start)
- Scheduled updates (every 2 minutes)
- API requests (logged in real-time)
- Errors and warnings

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

The server will:
- Stop the scheduler gracefully
- Complete any in-progress operations
- Exit cleanly

## Development Tips

### Watch Logs
The server prints detailed logs for debugging:
```
Processing latest radar data...
Latest file: MRMS_...
Parsed data points: 12500
Generated image: radar_....png
```

### Clear Cache
Restart the server to clear the in-memory cache.

### Test Different Timestamps
```powershell
curl http://localhost:5000/api/radar/timestamps
# Then use one of the timestamps:
curl http://localhost:5000/api/radar/timestamp/2025-11-08T13:41:48.000Z
```

## File Structure

```
beagleTrialBE/
├── data/          # Downloaded GRIB2 files (auto-generated)
├── images/        # Generated radar images (auto-generated)
├── services/      # Core business logic
├── routes/        # API endpoints
├── utils/         # Helper functions
└── index.js       # Main server file
```

## Performance

- **API Response Time**: ~50-100ms (cached) / ~2-5s (fresh)
- **Image Size**: ~40KB per image
- **Memory Usage**: ~50-100MB
- **Disk Usage**: ~5-10MB (with auto-cleanup)

## Support

- Check `README.md` for full documentation
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- Review `FRONTEND_INTEGRATION.md` for React examples

---

**You're all set!** 🎉

The backend is now running and ready to serve radar data to your frontend.

