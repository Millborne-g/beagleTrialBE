const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");
const { exec } = require("child_process");
const execAsync = promisify(exec);

/**
 * Parse GRIB2 file to extract reflectivity data
 * This is a simplified implementation that attempts to use wgrib2 if available,
 * or generates sample data for testing purposes
 *
 * @param {string} filePath - Path to GRIB2 file
 * @returns {Promise<Object>} - Parsed radar data
 */
async function parseGRIB2File(filePath) {
    try {
        console.log("Parsing GRIB2 file:", filePath);

        // Check if wgrib2 is available
        const hasWgrib2 = await checkWgrib2Available();

        if (hasWgrib2) {
            return await parseWithWgrib2(filePath);
        } else {
            console.warn("wgrib2 not available, using alternative method");
            // For now, generate sample data structure
            // In production, you would need proper GRIB2 parsing
            return await generateSampleData(filePath);
        }
    } catch (error) {
        console.error("Error parsing GRIB2 file:", error.message);
        throw new Error("Failed to parse GRIB2 file");
    }
}

/**
 * Check if wgrib2 is available in system PATH
 * @returns {Promise<boolean>}
 */
async function checkWgrib2Available() {
    try {
        await execAsync("wgrib2 -version");
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse GRIB2 file using wgrib2 tool
 * @param {string} filePath - Path to GRIB2 file
 * @returns {Promise<Object>} - Parsed data
 */
async function parseWithWgrib2(filePath) {
    return new Promise((resolve, reject) => {
        const outputFile = filePath + ".csv";

        // Use wgrib2 to convert GRIB2 to CSV
        const wgrib2 = spawn("wgrib2", [filePath, "-csv", outputFile]);

        wgrib2.on("close", async (code) => {
            if (code !== 0) {
                reject(new Error(`wgrib2 exited with code ${code}`));
                return;
            }

            try {
                const csvData = await fs.readFile(outputFile, "utf-8");
                const parsedData = parseCSVData(csvData);

                // Clean up CSV file
                await fs.unlink(outputFile).catch(() => {});

                resolve(parsedData);
            } catch (error) {
                reject(error);
            }
        });

        wgrib2.on("error", (error) => {
            reject(new Error(`Failed to spawn wgrib2: ${error.message}`));
        });
    });
}

/**
 * Parse CSV data from wgrib2 output
 * @param {string} csvData - CSV string
 * @returns {Object} - Parsed data structure
 */
function parseCSVData(csvData) {
    const lines = csvData.trim().split("\n");
    const dataPoints = [];

    let minLat = 90,
        maxLat = -90;
    let minLon = 180,
        maxLon = -180;
    let minDbz = Infinity,
        maxDbz = -Infinity;

    for (const line of lines) {
        const parts = line.split(",");
        if (parts.length >= 4) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            const dbz = parseFloat(parts[2]);

            if (!isNaN(lat) && !isNaN(lon) && !isNaN(dbz)) {
                dataPoints.push({ lat, lon, dbz });

                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLon = Math.min(minLon, lon);
                maxLon = Math.max(maxLon, lon);
                minDbz = Math.min(minDbz, dbz);
                maxDbz = Math.max(maxDbz, dbz);
            }
        }
    }

    return {
        dataPoints,
        bounds: {
            north: maxLat,
            south: minLat,
            east: maxLon,
            west: minLon,
        },
        metadata: {
            minDbz,
            maxDbz,
            pointCount: dataPoints.length,
        },
    };
}

/**
 * Generate sample radar data for testing
 * This creates a realistic-looking radar pattern for the continental US
 * with time-based variation to simulate moving storms
 * @param {string} filePath - Path to original file (for metadata)
 * @returns {Promise<Object>} - Sample data structure
 */
async function generateSampleData(filePath) {
    console.log("Generating sample radar data for testing...");

    // Continental US bounds
    const bounds = {
        north: 49.0,
        south: 25.0,
        east: -66.0,
        west: -125.0,
    };

    // Use time to create variation (storms "move" over time)
    const timeOffset = Date.now() / 60000; // Changes every minute
    const stormSeed = Math.floor(timeOffset / 5); // New storm pattern every 5 minutes

    // Generate sample data points in a grid
    const dataPoints = [];
    const gridSize = 0.5; // degrees

    // Create pseudo-random but consistent storm positions based on time
    const storm1X = 2 + Math.sin(stormSeed * 0.5) * 3;
    const storm1Y = 1 + Math.cos(stormSeed * 0.3) * 2;
    const storm2X = -3 + Math.cos(stormSeed * 0.7) * 4;
    const storm2Y = -2 + Math.sin(stormSeed * 0.4) * 3;
    const storm3X = 1 + Math.sin(stormSeed * 0.9) * 2;
    const storm3Y = -3 + Math.cos(stormSeed * 0.6) * 2;

    // Vary storm intensities over time
    const intensity1 = 60 + Math.sin(stormSeed * 0.2) * 15;
    const intensity2 = 45 + Math.cos(stormSeed * 0.3) * 15;
    const intensity3 = 35 + Math.sin(stormSeed * 0.4) * 15;

    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
        for (let lon = bounds.west; lon <= bounds.east; lon += gridSize) {
            // Create some variation in reflectivity
            // Simulate storm patterns with moving clusters
            const x = (lon + 95) / 10;
            const y = (lat - 37) / 10;

            // Multiple storm centers that move over time
            const storm1 =
                Math.exp(-((x - storm1X) ** 2 + (y - storm1Y) ** 2) / 2) *
                intensity1;
            const storm2 =
                Math.exp(-((x - storm2X) ** 2 + (y - storm2Y) ** 2) / 4) *
                intensity2;
            const storm3 =
                Math.exp(-((x - storm3X) ** 2 + (y - storm3Y) ** 2) / 3) *
                intensity3;

            // Add some randomness and temporal variation
            const noise = (Math.random() - 0.5) * 15;
            const temporalNoise = Math.sin(timeOffset * 0.1 + x + y) * 5;
            const dbz = storm1 + storm2 + storm3 + noise + temporalNoise;

            // Only include points with significant reflectivity
            if (dbz > 5) {
                dataPoints.push({
                    lat: parseFloat(lat.toFixed(4)),
                    lon: parseFloat(lon.toFixed(4)),
                    dbz: Math.min(75, Math.max(5, dbz)),
                });
            }
        }
    }

    console.log(
        `Generated ${dataPoints.length} sample data points (pattern seed: ${stormSeed})`
    );

    return {
        dataPoints,
        bounds,
        metadata: {
            minDbz: 5,
            maxDbz: 75,
            pointCount: dataPoints.length,
            isSampleData: true,
            stormSeed, // Include seed for debugging
        },
    };
}

/**
 * Extract basic metadata from GRIB2 file
 * @param {string} filePath - Path to GRIB2 file
 * @returns {Promise<Object>} - Metadata object
 */
async function extractMetadata(filePath) {
    try {
        const stats = await fs.stat(filePath);
        const filename = path.basename(filePath);

        return {
            filename,
            size: stats.size,
            modified: stats.mtime,
            dataType: "RALA",
            source: "MRMS",
            units: "dBZ",
        };
    } catch (error) {
        console.error("Error extracting metadata:", error.message);
        return {
            dataType: "RALA",
            source: "MRMS",
            units: "dBZ",
        };
    }
}

module.exports = {
    parseGRIB2File,
    extractMetadata,
    generateSampleData,
};
