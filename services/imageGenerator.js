const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const { getColorForDBZ } = require("../utils/colorScale");

// Images directory
const IMAGES_DIR = path.join(__dirname, "..", "images");

/**
 * Generate radar overlay image from parsed data
 * @param {Object} radarData - Parsed radar data with dataPoints and bounds
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - Path to generated image
 */
async function generateRadarImage(radarData, filename) {
    try {
        console.log("Generating radar image:", filename);

        // Ensure images directory exists
        await fs.mkdir(IMAGES_DIR, { recursive: true });

        const { dataPoints, bounds } = radarData;

        // Image dimensions - High resolution for professional appearance
        const width = 4000;
        const height = 3000;

        // Create a buffer for the image data (RGBA)
        const buffer = Buffer.alloc(width * height * 4);

        // Initialize with transparent pixels
        for (let i = 0; i < buffer.length; i += 4) {
            buffer[i] = 0; // R
            buffer[i + 1] = 0; // G
            buffer[i + 2] = 0; // B
            buffer[i + 3] = 0; // A (transparent)
        }

        // Calculate lat/lon to pixel conversion
        const latRange = bounds.north - bounds.south;
        const lonRange = bounds.east - bounds.west;

        // Draw each data point with larger radius for smooth coverage
        for (const point of dataPoints) {
            // Convert lat/lon to pixel coordinates
            const x = Math.floor(
                ((point.lon - bounds.west) / lonRange) * width
            );
            const y = Math.floor(
                ((bounds.north - point.lat) / latRange) * height
            );

            // Ensure coordinates are within bounds
            if (x >= 0 && x < width && y >= 0 && y < height) {
                // Get color for this dBZ value
                const color = getColorForDBZ(point.dbz);

                // Draw larger points for thick, solid radar coverage
                // Higher resolution allows larger radius for smooth appearance
                drawPoint(buffer, x, y, width, height, color, 15);
            }
        }

        // Create image using sharp with enhanced smoothing for professional appearance
        const outputPath = path.join(IMAGES_DIR, filename);

        await sharp(buffer, {
            raw: {
                width,
                height,
                channels: 4,
            },
        })
            .blur(2.0) // Enhanced blur for smooth, professional radar appearance
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
            })
            .toFile(outputPath);

        console.log("Radar image generated successfully:", filename);

        return outputPath;
    } catch (error) {
        console.error("Error generating radar image:", error.message);
        throw new Error("Failed to generate radar image");
    }
}

/**
 * Draw a point with radius and smooth blending (for professional radar appearance)
 * @param {Buffer} buffer - Image buffer
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Array} color - RGBA color array
 * @param {number} radius - Point radius
 */
function drawPoint(buffer, centerX, centerY, width, height, color, radius = 1) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if within circle
            if (distance <= radius) {
                const x = centerX + dx;
                const y = centerY + dy;

                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const pixelIndex = (y * width + x) * 4;

                    // Calculate fade factor for smoother edges (minimal fade for solid coverage)
                    const fadeFactor = 1 - (distance / radius) * 0.15; // Less fade = more solid
                    const adjustedAlpha = Math.floor(color[3] * fadeFactor);

                    // Blend with existing pixel for smooth overlaps
                    const existingAlpha = buffer[pixelIndex + 3];

                    if (existingAlpha === 0) {
                        // Empty pixel, just set it
                        buffer[pixelIndex] = color[0]; // R
                        buffer[pixelIndex + 1] = color[1]; // G
                        buffer[pixelIndex + 2] = color[2]; // B
                        buffer[pixelIndex + 3] = adjustedAlpha; // A
                    } else {
                        // Always blend colors for thick, smooth coverage
                        const blendFactor = 0.8; // 80% new, 20% old for more solid appearance
                        buffer[pixelIndex] = Math.floor(
                            color[0] * blendFactor +
                                buffer[pixelIndex] * (1 - blendFactor)
                        );
                        buffer[pixelIndex + 1] = Math.floor(
                            color[1] * blendFactor +
                                buffer[pixelIndex + 1] * (1 - blendFactor)
                        );
                        buffer[pixelIndex + 2] = Math.floor(
                            color[2] * blendFactor +
                                buffer[pixelIndex + 2] * (1 - blendFactor)
                        );
                        buffer[pixelIndex + 3] = Math.max(
                            existingAlpha,
                            adjustedAlpha
                        );
                    }
                }
            }
        }
    }
}

/**
 * Generate thumbnail image (smaller version for preview)
 * @param {string} imagePath - Path to original image
 * @param {string} thumbnailFilename - Output thumbnail filename
 * @returns {Promise<string>} - Path to thumbnail
 */
async function generateThumbnail(imagePath, thumbnailFilename) {
    try {
        const thumbnailPath = path.join(IMAGES_DIR, thumbnailFilename);

        await sharp(imagePath)
            .resize(400, 300, { fit: "contain" })
            .png()
            .toFile(thumbnailPath);

        return thumbnailPath;
    } catch (error) {
        console.error("Error generating thumbnail:", error.message);
        throw error;
    }
}

/**
 * Clean up old images (keep only last N images)
 * @param {number} keepCount - Number of images to keep
 */
async function cleanupOldImages(keepCount = 20) {
    try {
        const files = await fs.readdir(IMAGES_DIR);

        // Filter PNG files and sort by modification time
        const imageFiles = [];
        for (const file of files) {
            if (file.endsWith(".png") && !file.includes("thumbnail")) {
                const filePath = path.join(IMAGES_DIR, file);
                const stats = await fs.stat(filePath);
                imageFiles.push({
                    name: file,
                    path: filePath,
                    mtime: stats.mtime,
                });
            }
        }

        // Sort by modification time (newest first)
        imageFiles.sort((a, b) => b.mtime - a.mtime);

        // Delete files beyond keepCount
        for (let i = keepCount; i < imageFiles.length; i++) {
            await fs.unlink(imageFiles[i].path);

            // Also delete corresponding thumbnail if exists
            const thumbnailPath = imageFiles[i].path.replace(
                ".png",
                "_thumbnail.png"
            );
            await fs.unlink(thumbnailPath).catch(() => {});

            console.log(`Deleted old image: ${imageFiles[i].name}`);
        }
    } catch (error) {
        console.error("Error cleaning up old images:", error.message);
    }
}

/**
 * Get URL for image file
 * @param {string} filename - Image filename
 * @param {string} baseUrl - Base URL of the server
 * @returns {string} - Full URL to image
 */
function getImageUrl(filename, baseUrl) {
    return `${baseUrl}/images/${filename}`;
}

module.exports = {
    generateRadarImage,
    generateThumbnail,
    cleanupOldImages,
    getImageUrl,
};
