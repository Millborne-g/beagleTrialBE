const mrmsService = require("./mrmsService");
const gribParser = require("./gribParser");
const imageGenerator = require("./imageGenerator");
const cache = require("../utils/cache");

/**
 * Process latest radar data
 * Fetches MRMS data, parses it, and generates overlay image
 * @param {string} baseUrl - Base URL for image serving
 * @returns {Promise<Object>} - Processed radar data with image URL
 */
async function processLatestRadarData(baseUrl) {
    try {
        console.log("Processing latest radar data...");

        // Check cache first
        const cachedData = cache.get("latest_radar");
        if (cachedData) {
            console.log("Returning cached radar data");
            return cachedData;
        }

        // Fetch latest MRMS file
        const fileInfo = await mrmsService.getLatestFile();
        console.log("Latest file:", fileInfo.filename);

        // Parse GRIB2 file
        const radarData = await gribParser.parseGRIB2File(fileInfo.path);
        console.log("Parsed data points:", radarData.dataPoints.length);

        // Generate image filename based on timestamp
        const imageFilename = `radar_${fileInfo.timestamp.getTime()}.png`;

        // Generate radar overlay image
        const imagePath = await imageGenerator.generateRadarImage(
            radarData,
            imageFilename
        );
        console.log("Generated image:", imagePath);

        // Build response
        const result = {
            success: true,
            data: {
                timestamp: fileInfo.timestamp.toISOString(),
                imageUrl: imageGenerator.getImageUrl(imageFilename, baseUrl),
                bounds: radarData.bounds,
                metadata: {
                    dataType: "RALA",
                    updateInterval: 2,
                    source: "MRMS",
                    units: "dBZ",
                    ...radarData.metadata,
                },
            },
            timestamp: new Date().toISOString(),
        };

        // Cache the result for 2 minutes
        cache.set("latest_radar", result, 2 * 60 * 1000);

        // Clean up old files
        await mrmsService.cleanupOldFiles(10);
        await imageGenerator.cleanupOldImages(20);

        return result;
    } catch (error) {
        console.error("Error processing radar data:", error.message);

        // Return fallback/sample data if processing fails
        return await generateFallbackData(baseUrl);
    }
}

/**
 * Generate fallback data when real data is unavailable
 * @param {string} baseUrl - Base URL for image serving
 * @returns {Promise<Object>} - Fallback radar data
 */
async function generateFallbackData(baseUrl) {
    console.log("Generating fallback radar data...");

    try {
        // Generate sample data
        const radarData = await gribParser.generateSampleData("fallback");

        // Generate image
        const timestamp = new Date();
        const imageFilename = `radar_fallback_${timestamp.getTime()}.png`;
        await imageGenerator.generateRadarImage(radarData, imageFilename);

        return {
            success: true,
            data: {
                timestamp: timestamp.toISOString(),
                imageUrl: imageGenerator.getImageUrl(imageFilename, baseUrl),
                bounds: radarData.bounds,
                metadata: {
                    dataType: "RALA",
                    updateInterval: 2,
                    source: "MRMS (Sample Data)",
                    units: "dBZ",
                    ...radarData.metadata,
                    isFallback: true,
                },
            },
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error generating fallback data:", error.message);
        throw error;
    }
}

/**
 * Get available timestamps
 * @returns {Promise<Array>} - Array of available timestamps
 */
async function getAvailableTimestamps() {
    try {
        const files = await mrmsService.fetchAvailableFiles();
        return files.slice(0, 20).map((file) => file.timestamp.toISOString());
    } catch (error) {
        console.error("Error fetching available timestamps:", error.message);
        // Return sample timestamps if fetch fails
        const now = new Date();
        const timestamps = [];
        for (let i = 0; i < 10; i++) {
            const time = new Date(now.getTime() - i * 2 * 60 * 1000); // 2 minute intervals
            timestamps.push(time.toISOString());
        }
        return timestamps;
    }
}

/**
 * Get radar data by specific timestamp
 * @param {string} timestamp - ISO timestamp string
 * @param {string} baseUrl - Base URL for image serving
 * @returns {Promise<Object>} - Radar data for specific timestamp
 */
async function getRadarDataByTimestamp(timestamp, baseUrl) {
    try {
        // For now, return the latest data
        // In a full implementation, you would fetch and process the specific timestamp
        console.log("Fetching radar data for timestamp:", timestamp);

        // Check cache
        const cacheKey = `radar_${timestamp}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        // For simplicity, return latest data
        // TODO: Implement specific timestamp fetching
        return await processLatestRadarData(baseUrl);
    } catch (error) {
        console.error("Error fetching radar data by timestamp:", error.message);
        throw error;
    }
}

/**
 * Initialize radar service
 * Performs initial setup and data fetch
 */
async function initialize(baseUrl) {
    try {
        console.log("Initializing radar service...");

        // Fetch and process initial data
        await processLatestRadarData(baseUrl);

        console.log("Radar service initialized successfully");
    } catch (error) {
        console.error("Error initializing radar service:", error.message);
        // Continue even if initialization fails
    }
}

/**
 * Get multiple radar frames for animation
 * @param {number} count - Number of frames to retrieve
 * @param {string} baseUrl - Base URL for image serving
 * @returns {Promise<Array>} - Array of radar frame data
 */
async function getRadarFrames(count = 10, baseUrl) {
    try {
        console.log(`Fetching ${count} radar frames for animation...`);
        
        const imageGenerator = require("./imageGenerator");
        const path = require("path");
        const fs = require("fs").promises;
        
        // Get all available image files
        const IMAGES_DIR = path.join(__dirname, "..", "images");
        const files = await fs.readdir(IMAGES_DIR);
        
        // Filter radar images (not thumbnails or fallback)
        const radarFiles = [];
        for (const file of files) {
            if (file.startsWith("radar_") && file.endsWith(".png") && !file.includes("thumbnail") && !file.includes("fallback")) {
                const filePath = path.join(IMAGES_DIR, file);
                const stats = await fs.stat(filePath);
                
                // Extract timestamp from filename: radar_<timestamp>.png
                const timestampStr = file.replace("radar_", "").replace(".png", "");
                const timestamp = new Date(parseInt(timestampStr));
                
                radarFiles.push({
                    filename: file,
                    path: filePath,
                    timestamp: timestamp,
                    mtime: stats.mtime,
                });
            }
        }
        
        // Sort by timestamp (newest first)
        radarFiles.sort((a, b) => b.timestamp - a.timestamp);
        
        // Take requested count
        const selectedFiles = radarFiles.slice(0, count);
        
        // Build frame data
        const frames = selectedFiles.map(file => ({
            timestamp: file.timestamp.toISOString(),
            imageUrl: imageGenerator.getImageUrl(file.filename, baseUrl),
            bounds: {
                north: 49.0,
                south: 25.0,
                east: -66.0,
                west: -125.0,
            },
            metadata: {
                dataType: "RALA",
                source: "MRMS",
                units: "dBZ",
            },
        }));
        
        console.log(`Retrieved ${frames.length} frames for animation`);
        return frames;
    } catch (error) {
        console.error("Error fetching radar frames:", error.message);
        // Return empty array if no frames available
        return [];
    }
}

module.exports = {
    processLatestRadarData,
    getAvailableTimestamps,
    getRadarDataByTimestamp,
    initialize,
    getRadarFrames,
};
