const schedule = require("node-schedule");
const radarService = require("../services/radarService");

let scheduledJob = null;
let baseUrl = null;

/**
 * Start the scheduler to fetch radar data periodically
 * @param {string} url - Base URL for the server
 */
function startScheduler(url) {
    baseUrl = url;

    // Schedule job to run every 2 minutes
    // Cron pattern: */2 * * * * = every 2 minutes
    scheduledJob = schedule.scheduleJob("*/2 * * * *", async () => {
        console.log("Scheduled radar data update triggered...");
        try {
            await radarService.processLatestRadarData(baseUrl);
            console.log("Scheduled radar data update completed");
        } catch (error) {
            console.error("Error in scheduled radar update:", error.message);
        }
    });

    console.log("Radar data scheduler started (runs every 2 minutes)");

    // Also do an initial fetch
    setTimeout(async () => {
        try {
            console.log("Initial radar data fetch...");
            await radarService.processLatestRadarData(baseUrl);
            console.log("Initial radar data fetch completed");
        } catch (error) {
            console.error("Error in initial radar fetch:", error.message);
        }
    }, 5000); // Wait 5 seconds before first fetch
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
    if (scheduledJob) {
        scheduledJob.cancel();
        scheduledJob = null;
        console.log("Radar data scheduler stopped");
    }
}

/**
 * Get scheduler status
 * @returns {Object} - Scheduler status
 */
function getStatus() {
    return {
        running: scheduledJob !== null,
        nextRun: scheduledJob ? scheduledJob.nextInvocation() : null,
    };
}

/**
 * Manually trigger an update
 */
async function triggerUpdate() {
    if (!baseUrl) {
        throw new Error("Scheduler not initialized");
    }

    console.log("Manual radar data update triggered...");
    await radarService.processLatestRadarData(baseUrl);
    console.log("Manual radar data update completed");
}

module.exports = {
    startScheduler,
    stopScheduler,
    getStatus,
    triggerUpdate,
};
