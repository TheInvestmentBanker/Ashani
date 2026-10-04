const express = require("express");

const {
  getCurrentUsage,
} = require("../controllers/usageController");

const {
  optionalAuth,
} = require("../middleware/optionalAuth");

const router = express.Router();

router.get(
  "/",
  optionalAuth,
  getCurrentUsage
);

module.exports = router;