const express = require("express");

const {
  chat,
  streamChat,
} = require("../controllers/chatController");

const {
  optionalAuth,
} = require("../middleware/optionalAuth");

const router = express.Router();

router.post(
  "/",
  optionalAuth,
  chat
);

router.post(
  "/stream",
  optionalAuth,
  streamChat
);

module.exports = router;