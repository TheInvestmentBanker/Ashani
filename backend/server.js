const authRoutes = require("./routes/authRoutes");
const usageRoutes = require("./routes/usageRoutes");
const conversationRoutes =
  require("./routes/conversationRoutes");

const {
  initializeDatabase,
} = require("./config/database");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRoutes = require("./routes/chatRoutes");

const app = express();
initializeDatabase();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Aritraa AI",
    status: "online",
    message: "Aritraa backend is running."
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usage", usageRoutes);
app.use(
  "/api/conversations",
  conversationRoutes
);

app.listen(PORT, () => {
  console.log(`Aritraa backend running on http://localhost:${PORT}`);
});