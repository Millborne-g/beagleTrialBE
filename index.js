const express = require("express");
const cors = require("cors");
const path = require("path");
const RadarRoutes = require("./routes/RadarRoutes");
const scheduler = require("./services/scheduler");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: "*", // Allow all origins for now
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from images directory
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes
app.use("/api/radar", RadarRoutes);

// Health check endpoint at root
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Weather Radar API",
        timestamp: new Date().toISOString(),
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Weather Radar API",
        version: "1.0.0",
        endpoints: {
            health: "/api/health",
            latestRadar: "/api/radar/latest",
            timestamps: "/api/radar/timestamps",
            radarByTimestamp: "/api/radar/timestamp/:timestamp",
        },
    });
});

// Start server
const startServer = async () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);

        // Get base URL for the server
        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
        console.log(`Base URL: ${baseUrl}`);

        // Start the scheduler for automatic radar data updates
        scheduler.startScheduler(baseUrl);
    });
};

// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("Shutting down gracefully...");
    scheduler.stopScheduler();
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Shutting down gracefully...");
    scheduler.stopScheduler();
    process.exit(0);
});

startServer();
