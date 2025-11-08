# Frontend Integration Guide

This guide shows how to integrate the Weather Radar Backend API with your React frontend.

## Backend URL Configuration

### Development
```javascript
const API_BASE_URL = 'http://localhost:5000';
```

### Production (After Deployment)
```javascript
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

## Basic API Integration

### 1. Fetch Latest Radar Data

```javascript
// services/radarApi.js
export async function getLatestRadarData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/radar/latest`);
    if (!response.ok) {
      throw new Error('Failed to fetch radar data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching radar data:', error);
    throw error;
  }
}

export async function getAvailableTimestamps() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/radar/timestamps`);
    if (!response.ok) {
      throw new Error('Failed to fetch timestamps');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching timestamps:', error);
    throw error;
  }
}

export async function getRadarByTimestamp(timestamp) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/radar/timestamp/${timestamp}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch radar data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching radar data:', error);
    throw error;
  }
}
```

### 2. React Component with Auto-Refresh

```javascript
import React, { useState, useEffect } from 'react';
import { getLatestRadarData } from './services/radarApi';

function RadarDisplay() {
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch radar data
  const fetchRadarData = async () => {
    try {
      setLoading(true);
      const data = await getLatestRadarData();
      setRadarData(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRadarData();
  }, []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRadarData();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !radarData) {
    return <div>Loading radar data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div>
        <button onClick={fetchRadarData}>Refresh Now</button>
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (every 2 minutes)
        </label>
      </div>
      
      {radarData && (
        <div>
          <p>Last Updated: {new Date(radarData.timestamp).toLocaleString()}</p>
          <img 
            src={radarData.imageUrl} 
            alt="Radar Data"
            style={{ maxWidth: '100%' }}
          />
        </div>
      )}
    </div>
  );
}

export default RadarDisplay;
```

## Integration with Leaflet

### 3. Display Radar Overlay on Map

```javascript
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLatestRadarData } from './services/radarApi';

function RadarMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [radarLayer, setRadarLayer] = useState(null);
  const [radarData, setRadarData] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = L.map(mapRef.current).setView([37.8, -96], 4);

      // Add base map layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      setMap(newMap);
    }
  }, []);

  // Fetch and display radar data
  useEffect(() => {
    if (!map) return;

    const fetchAndDisplayRadar = async () => {
      try {
        const response = await getLatestRadarData();
        const data = response.data;
        setRadarData(data);

        // Remove existing radar layer
        if (radarLayer) {
          map.removeLayer(radarLayer);
        }

        // Add new radar overlay
        const bounds = [
          [data.bounds.south, data.bounds.west],
          [data.bounds.north, data.bounds.east]
        ];

        const newRadarLayer = L.imageOverlay(
          data.imageUrl,
          bounds,
          {
            opacity: 0.7,
            interactive: false
          }
        ).addTo(map);

        setRadarLayer(newRadarLayer);
      } catch (error) {
        console.error('Error fetching radar:', error);
      }
    };

    fetchAndDisplayRadar();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAndDisplayRadar, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [map]);

  return (
    <div>
      <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
      {radarData && (
        <div style={{ padding: '10px' }}>
          <p>Last Updated: {new Date(radarData.timestamp).toLocaleString()}</p>
          <p>Source: {radarData.metadata.source}</p>
          <p>Data Type: {radarData.metadata.dataType}</p>
        </div>
      )}
    </div>
  );
}

export default RadarMap;
```

## Integration with Mapbox

### 4. Display Radar Overlay on Mapbox

```javascript
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getLatestRadarData } from './services/radarApi';

mapboxgl.accessToken = 'your-mapbox-token';

function RadarMapbox() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [radarData, setRadarData] = useState(null);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-96, 37.8],
      zoom: 4
    });
  }, []);

  // Fetch and display radar data
  useEffect(() => {
    if (!map.current) return;

    const fetchAndDisplayRadar = async () => {
      try {
        const response = await getLatestRadarData();
        const data = response.data;
        setRadarData(data);

        // Remove existing radar layer
        if (map.current.getLayer('radar-overlay')) {
          map.current.removeLayer('radar-overlay');
        }
        if (map.current.getSource('radar')) {
          map.current.removeSource('radar');
        }

        // Add new radar overlay
        map.current.addSource('radar', {
          type: 'image',
          url: data.imageUrl,
          coordinates: [
            [data.bounds.west, data.bounds.north],
            [data.bounds.east, data.bounds.north],
            [data.bounds.east, data.bounds.south],
            [data.bounds.west, data.bounds.south]
          ]
        });

        map.current.addLayer({
          id: 'radar-overlay',
          type: 'raster',
          source: 'radar',
          paint: {
            'raster-opacity': 0.7
          }
        });
      } catch (error) {
        console.error('Error fetching radar:', error);
      }
    };

    map.current.on('load', () => {
      fetchAndDisplayRadar();
    });

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAndDisplayRadar, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div ref={mapContainer} style={{ height: '600px', width: '100%' }} />
      {radarData && (
        <div style={{ padding: '10px' }}>
          <p>Last Updated: {new Date(radarData.timestamp).toLocaleString()}</p>
          <p>Source: {radarData.metadata.source}</p>
        </div>
      )}
    </div>
  );
}

export default RadarMapbox;
```

## Advanced Features

### 5. Timeline/Playback Feature

```javascript
import React, { useState, useEffect } from 'react';
import { getAvailableTimestamps, getRadarByTimestamp } from './services/radarApi';

function RadarTimeline() {
  const [timestamps, setTimestamps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [radarData, setRadarData] = useState(null);

  // Fetch available timestamps
  useEffect(() => {
    async function fetchTimestamps() {
      try {
        const response = await getAvailableTimestamps();
        setTimestamps(response.data);
      } catch (error) {
        console.error('Error fetching timestamps:', error);
      }
    }
    fetchTimestamps();
  }, []);

  // Fetch radar data for current timestamp
  useEffect(() => {
    if (timestamps.length === 0) return;

    async function fetchRadar() {
      try {
        const response = await getRadarByTimestamp(timestamps[currentIndex]);
        setRadarData(response.data);
      } catch (error) {
        console.error('Error fetching radar:', error);
      }
    }
    fetchRadar();
  }, [currentIndex, timestamps]);

  // Auto-play
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % timestamps.length);
    }, 500); // Change frame every 500ms

    return () => clearInterval(interval);
  }, [playing, timestamps.length]);

  return (
    <div>
      <div>
        <button onClick={() => setPlaying(!playing)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min="0"
          max={timestamps.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <p>
          {timestamps[currentIndex] &&
            new Date(timestamps[currentIndex]).toLocaleString()}
        </p>
      </div>

      {radarData && (
        <img 
          src={radarData.imageUrl} 
          alt="Radar Data"
          style={{ maxWidth: '100%' }}
        />
      )}
    </div>
  );
}

export default RadarTimeline;
```

### 6. Connection Status Indicator

```javascript
import React, { useState, useEffect } from 'react';

function BackendStatusIndicator() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          setStatus('connected');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    checking: 'gray',
    connected: 'green',
    disconnected: 'red',
    error: 'orange'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: statusColors[status]
        }}
      />
      <span>Backend: {status}</span>
    </div>
  );
}

export default BackendStatusIndicator;
```

## Environment Configuration

### Create `.env` file in your frontend:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### For production:

```env
REACT_APP_API_BASE_URL=https://your-app-name.onrender.com
```

### Use in code:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
```

## Error Handling Best Practices

```javascript
async function fetchRadarWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const data = await getLatestRadarData();
      return data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

## Testing the Integration

1. Start the backend: `npm start` (in backend directory)
2. Start the frontend: `npm start` (in frontend directory)
3. Open browser to `http://localhost:3000` (or your frontend port)
4. Check browser console for any errors
5. Verify radar overlay appears on map
6. Test auto-refresh by waiting 2 minutes

## Troubleshooting

### CORS Errors
- Verify backend CORS is enabled
- Check `Access-Control-Allow-Origin` headers in network tab

### Image Not Loading
- Check image URL is accessible
- Verify BASE_URL is correct in backend
- Check browser console for 404 errors

### Slow Loading
- Images are ~40KB, should load quickly
- Check network tab for actual load time
- Consider adding loading states

### Auto-Refresh Not Working
- Check if interval is being cleared on unmount
- Verify no JavaScript errors in console
- Check backend logs to see if requests are coming through

---

**You're all set!** The backend is ready to integrate with your React frontend using either Leaflet or Mapbox for map rendering.

