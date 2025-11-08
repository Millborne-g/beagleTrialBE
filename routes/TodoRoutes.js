const express = require("express");
const router = express.Router();
const TodoController = require("../controllers/TodoController");
const { verifyToken } = require("../middleware/authMiddleware");

// Protected route - requires authentication
router.get("/api/todos", verifyToken, TodoController.getAllTodos);

module.exports = router;
