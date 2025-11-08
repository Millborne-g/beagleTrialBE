const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

// Auth routes
router.post("/api/auth/login", AuthController.login);
router.post("/api/auth/refresh", AuthController.refreshToken);
router.post("/api/auth/logout", AuthController.logout);

module.exports = router;
