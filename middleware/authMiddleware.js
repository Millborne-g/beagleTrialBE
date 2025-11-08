const jwt = require("jsonwebtoken");

// Middleware to verify access token
exports.verifyToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
            });
        }

        // Verify token
        jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key",
            (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: "Invalid or expired token",
                    });
                }

                // Attach user info to request
                req.user = decoded;
                next();
            }
        );
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
