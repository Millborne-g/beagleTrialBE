const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const cheerio = require("cheerio");

// MRMS RALA data URL
const MRMS_BASE_URL =
    "https://mrms.ncep.noaa.gov/data/2D/ReflectivityAtLowestAltitude/";

// Data directory
const DATA_DIR = path.join(__dirname, "..", "data");

/**
 * Fetch list of available GRIB2 files from MRMS
 * @returns {Promise<Array>} - Array of file objects with name and url
 */
async function fetchAvailableFiles() {
    try {
        const response = await axios.get(MRMS_BASE_URL, {
            timeout: 10000,
        });

        // Parse HTML to extract file links
        const $ = cheerio.load(response.data);
        const files = [];

        $("a").each((i, elem) => {
            const href = $(elem).attr("href");
            if (href && href.endsWith(".grib2.gz")) {
                files.push({
                    name: href,
                    url: MRMS_BASE_URL + href,
                    timestamp: extractTimestampFromFilename(href),
                });
            }
        });

        // Sort by timestamp (newest first)
        files.sort((a, b) => b.timestamp - a.timestamp);

        return files;
    } catch (error) {
        console.error("Error fetching MRMS file list:", error.message);
        throw new Error("Failed to fetch MRMS data list");
    }
}

/**
 * Extract timestamp from MRMS filename
 * Format: MRMS_ReflectivityAtLowestAltitude_00.50_20231108-120000.grib2.gz
 * @param {string} filename - MRMS filename
 * @returns {Date} - Extracted timestamp
 */
function extractTimestampFromFilename(filename) {
    try {
        // Extract date-time portion: 20231108-120000
        const match = filename.match(/(\d{8})-(\d{6})/);
        if (!match) {
            return new Date();
        }

        const dateStr = match[1]; // YYYYMMDD
        const timeStr = match[2]; // HHMMSS

        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = timeStr.substring(0, 2);
        const minute = timeStr.substring(2, 4);
        const second = timeStr.substring(4, 6);

        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    } catch (error) {
        console.error("Error parsing timestamp from filename:", error);
        return new Date();
    }
}

/**
 * Download GRIB2 file from MRMS
 * @param {string} fileUrl - URL of the file to download
 * @param {string} filename - Local filename to save as
 * @returns {Promise<string>} - Path to downloaded file
 */
async function downloadFile(fileUrl, filename) {
    try {
        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        const filePath = path.join(DATA_DIR, filename);

        // Check if file already exists
        try {
            await fs.access(filePath);
            console.log(`File already exists: ${filename}`);
            return filePath;
        } catch {
            // File doesn't exist, proceed with download
        }

        console.log(`Downloading file from: ${fileUrl}`);

        const response = await axios({
            method: "get",
            url: fileUrl,
            responseType: "arraybuffer",
            timeout: 30000,
            maxContentLength: 100 * 1024 * 1024, // 100MB max
        });

        await fs.writeFile(filePath, response.data);
        console.log(`File downloaded successfully: ${filename}`);

        return filePath;
    } catch (error) {
        console.error("Error downloading file:", error.message);
        throw new Error("Failed to download MRMS data file");
    }
}

/**
 * Get the latest MRMS RALA file
 * @returns {Promise<Object>} - Object with file info and path
 */
async function getLatestFile() {
    try {
        const files = await fetchAvailableFiles();

        if (files.length === 0) {
            throw new Error("No MRMS files available");
        }

        const latestFile = files[0];
        const filePath = await downloadFile(latestFile.url, latestFile.name);

        return {
            filename: latestFile.name,
            path: filePath,
            timestamp: latestFile.timestamp,
            url: latestFile.url,
        };
    } catch (error) {
        console.error("Error getting latest file:", error.message);
        throw error;
    }
}

/**
 * Clean up old data files (keep only last N files)
 * @param {number} keepCount - Number of files to keep
 */
async function cleanupOldFiles(keepCount = 10) {
    try {
        const files = await fs.readdir(DATA_DIR);

        // Filter GRIB2 files and sort by modification time
        const gribFiles = [];
        for (const file of files) {
            if (file.endsWith(".grib2.gz")) {
                const filePath = path.join(DATA_DIR, file);
                const stats = await fs.stat(filePath);
                gribFiles.push({
                    name: file,
                    path: filePath,
                    mtime: stats.mtime,
                });
            }
        }

        // Sort by modification time (newest first)
        gribFiles.sort((a, b) => b.mtime - a.mtime);

        // Delete files beyond keepCount
        for (let i = keepCount; i < gribFiles.length; i++) {
            await fs.unlink(gribFiles[i].path);
            console.log(`Deleted old file: ${gribFiles[i].name}`);
        }
    } catch (error) {
        console.error("Error cleaning up old files:", error.message);
    }
}

module.exports = {
    fetchAvailableFiles,
    downloadFile,
    getLatestFile,
    cleanupOldFiles,
    extractTimestampFromFilename,
};
