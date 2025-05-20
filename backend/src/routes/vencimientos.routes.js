const express = require("express");
const router = express.Router();
const { listVencimientos } = require("../controllers/vencimientos.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// 🔐 Protegida con token
router.get("/", authenticateToken, listVencimientos);

module.exports = router;
