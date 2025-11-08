// Simple in-memory cache for radar data
const cache = new Map();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Set a value in the cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (optional)
 */
function set(key, value, ttl = CACHE_TTL) {
    const expiresAt = Date.now() + ttl;
    cache.set(key, { value, expiresAt });
}

/**
 * Get a value from the cache
 * @param {string} key - Cache key
 * @returns {*} - Cached value or null if not found/expired
 */
function get(key) {
    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }

    return entry.value;
}

/**
 * Delete a value from the cache
 * @param {string} key - Cache key
 */
function del(key) {
    cache.delete(key);
}

/**
 * Clear all cache entries
 */
function clear() {
    cache.clear();
}

/**
 * Get all non-expired keys
 * @returns {Array} - Array of cache keys
 */
function keys() {
    const now = Date.now();
    const validKeys = [];

    for (const [key, entry] of cache.entries()) {
        if (now <= entry.expiresAt) {
            validKeys.push(key);
        } else {
            cache.delete(key);
        }
    }

    return validKeys;
}

/**
 * Clean up expired entries
 */
function cleanup() {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
            cache.delete(key);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

module.exports = {
    set,
    get,
    del,
    clear,
    keys,
};
