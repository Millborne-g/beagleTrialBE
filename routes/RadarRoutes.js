const express = require("express");
const router = express.Router();
const radarService = require("../services/radarService");

// Helper to get base URL
function getBaseUrl(req) {
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}`;
}

/**
 * GET /api/radar/latest
 * Get the latest radar data
 */
router.get("/latest", async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const data = await radarService.processLatestRadarData(baseUrl);
        res.json(data);
    } catch (error) {
        console.error("Error in /latest endpoint:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to fetch latest radar data",
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * GET /api/radar/timestamps
 * Get available timestamps
 */
router.get("/timestamps", async (req, res) => {
    try {
        const timestamps = await radarService.getAvailableTimestamps();
        res.json({
            success: true,
            data: timestamps,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error in /timestamps endpoint:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to fetch timestamps",
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * GET /api/radar/timestamp/:timestamp
 * Get radar data for specific timestamp
 */
router.get("/timestamp/:timestamp", async (req, res) => {
    try {
        const timestamp = req.params.timestamp;
        const baseUrl = getBaseUrl(req);

        // Validate timestamp format
        if (!timestamp || isNaN(Date.parse(timestamp))) {
            return res.status(400).json({
                success: false,
                error: "Invalid timestamp format",
                message: "Timestamp must be a valid ISO 8601 date string",
                timestamp: new Date().toISOString(),
            });
        }

        const data = await radarService.getRadarDataByTimestamp(
            timestamp,
            baseUrl
        );
        res.json(data);
    } catch (error) {
        console.error(
            "Error in /timestamp/:timestamp endpoint:",
            error.message
        );
        res.status(500).json({
            success: false,
            error: "Failed to fetch radar data for timestamp",
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Weather Radar API",
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
