const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// In-memory storage for refresh tokens (use database in production)
const refreshTokens = [];

// Dummy user for demo (use database in production)
const users = [
    {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        password:
            "$2a$10$X3Lj5Z5Q8Z8Z8Z8Z8Z8Z8u5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8", // "password123"
    },
];

// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1m" }
    );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
        { expiresIn: "7d" }
    );
};

// Login Controller
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }

        // Find user (demo - use database query in production)
        const user = users.find((u) => u.username === username);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password (for demo, accept "password123")
        // In production: const isValidPassword = await bcrypt.compare(password, user.password);
        const isValidPassword = password === "password123";

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token (use database in production)
        refreshTokens.push(refreshToken);

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Refresh Token Controller
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        // Check if refresh token exists (use database in production)
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // Verify refresh token
        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
            (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: "Invalid or expired refresh token",
                    });
                }

                // Generate new access token
                const user = {
                    id: decoded.id,
                    username: decoded.username,
                    email: decoded.email,
                };

                const accessToken = generateAccessToken(user);

                res.json({
                    success: true,
                    message: "Token refreshed successfully",
                    data: {
                        accessToken,
                    },
                });
            }
        );
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Logout Controller (optional - to invalidate refresh token)
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        // Remove refresh token from storage
        const index = refreshTokens.indexOf(refreshToken);
        if (index > -1) {
            refreshTokens.splice(index, 1);
        }

        res.json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
