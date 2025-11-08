// Reflectivity color scale mapping for dBZ values
// Based on standard weather radar color scale

const colorScale = [
    { min: -Infinity, max: 5, color: [0, 0, 0, 0] }, // Transparent below 5 dBZ
    { min: 5, max: 10, color: [4, 233, 231, 180] }, // #04e9e7 - Very Light
    { min: 10, max: 20, color: [1, 159, 244, 200] }, // #019ff4 - Light
    { min: 20, max: 30, color: [3, 0, 244, 220] }, // #0300f4 - Light
    { min: 30, max: 40, color: [2, 253, 2, 230] }, // #02fd02 - Moderate
    { min: 40, max: 45, color: [1, 197, 1, 240] }, // #01c501 - Moderate
    { min: 45, max: 50, color: [0, 142, 0, 250] }, // #008e00 - Heavy
    { min: 50, max: 55, color: [253, 248, 2, 255] }, // #fdf802 - Heavy
    { min: 55, max: 60, color: [229, 188, 0, 255] }, // #e5bc00 - Very Heavy
    { min: 60, max: 65, color: [253, 149, 0, 255] }, // #fd9500 - Very Heavy
    { min: 65, max: 70, color: [253, 0, 0, 255] }, // #fd0000 - Intense
    { min: 70, max: Infinity, color: [212, 0, 0, 255] }, // #d40000 - Extreme
];

/**
 * Get color for a given dBZ value
 * @param {number} dbz - The reflectivity value in dBZ
 * @returns {Array} - RGBA color array [r, g, b, a]
 */
function getColorForDBZ(dbz) {
    // Handle invalid values
    if (dbz === null || dbz === undefined || isNaN(dbz)) {
        return [0, 0, 0, 0]; // Transparent
    }

    // Find the appropriate color range
    for (let i = 0; i < colorScale.length; i++) {
        if (dbz >= colorScale[i].min && dbz < colorScale[i].max) {
            return colorScale[i].color;
        }
    }

    // Default to transparent if no match
    return [0, 0, 0, 0];
}

/**
 * Get color legend for display
 * @returns {Array} - Array of legend entries
 */
function getColorLegend() {
    return colorScale
        .filter((entry) => entry.min !== -Infinity && entry.max !== Infinity)
        .map((entry) => ({
            minDbz: entry.min,
            maxDbz: entry.max,
            color: `rgba(${entry.color[0]}, ${entry.color[1]}, ${
                entry.color[2]
            }, ${entry.color[3] / 255})`,
        }));
}

module.exports = {
    getColorForDBZ,
    getColorLegend,
    colorScale,
};
