# Weather Radar Backend API

This is the backend API for the Weather Radar Display application. It fetches MRMS (Multi-Radar Multi-Sensor) RALA (Reflectivity at Lowest Altitude) data from NOAA, processes it, and serves it via RESTful API endpoints.

## Features

- Fetches real-time MRMS RALA radar data from NOAA
- Processes GRIB2 files and generates radar overlay images
- Serves radar data via RESTful API
- Automatic data updates every 2 minutes
- Caching for improved performance
- CORS enabled for frontend integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 5000 (or the port specified in your `.env` file).

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server health status.

### Get Latest Radar Data
```
GET /api/radar/latest
```
Returns the most recent radar data with image URL.

### Get Available Timestamps
```
GET /api/radar/timestamps
```
Returns a list of available radar data timestamps.

### Get Radar Data by Timestamp
```
GET /api/radar/timestamp/:timestamp
```
Returns radar data for a specific ISO 8601 timestamp.

## Response Format

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-08T12:34:56.000Z",
    "imageUrl": "http://localhost:5000/images/radar_1699445696000.png",
    "bounds": {
      "north": 49.0,
      "south": 25.0,
      "east": -66.0,
      "west": -125.0
    },
    "metadata": {
      "dataType": "RALA",
      "updateInterval": 2,
      "source": "MRMS",
      "units": "dBZ"
    }
  },
  "timestamp": "2025-11-08T12:34:56.789Z"
}
```

## Project Structure

```
backend/
├── controllers/        # Request handlers (legacy)
├── middleware/         # Middleware functions (legacy)
├── models/            # Database models (legacy)
├── routes/            # API routes
│   └── RadarRoutes.js # Radar API endpoints
├── services/          # Business logic
│   ├── mrmsService.js      # Fetch MRMS data
│   ├── gribParser.js       # Parse GRIB2 files
│   ├── imageGenerator.js   # Generate radar images
│   ├── radarService.js     # Main radar orchestration
│   └── scheduler.js        # Automatic updates
├── utils/             # Utility functions
│   ├── cache.js           # In-memory caching
│   └── colorScale.js      # dBZ color mapping
├── data/              # Downloaded GRIB2 files
├── images/            # Generated radar images
├── index.js           # Main application entry
├── .env               # Environment variables
├── .env.example       # Environment variables template
└── package.json       # Dependencies
```

## Data Source

This application fetches data from:
- **MRMS**: https://mrms.ncep.noaa.gov/data/2D/ReflectivityAtLowestAltitude/

The data is updated approximately every 2 minutes.

## Deployment

### Render.com (Free Tier)

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Set the build command: `npm install`
4. Set the start command: `npm start`
5. Add environment variables:
   - `PORT`: (Render provides this automatically)
   - `BASE_URL`: Your Render app URL (e.g., `https://your-app.onrender.com`)
6. Deploy

### Other Platforms

The application can be deployed to any platform that supports Node.js applications (Heroku, Railway, DigitalOcean, etc.).

## Notes

- The application uses sample data if GRIB2 parsing tools (wgrib2) are not available
- Data files and images are automatically cleaned up to save disk space
- CORS is enabled for all origins by default (configure for production)

## License

ISC

