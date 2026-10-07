require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const usageRoutes = require("./routes/usageRoutes");
const conversationRoutes =
  require("./routes/conversationRoutes");

const {
  initializeDatabase,
} = require("./config/database");
const searchRoutes =
  require("./routes/searchRoutes");

const express = require("express");
const cors = require("cors");


const chatRoutes = require("./routes/chatRoutes");

const app = express();
initializeDatabase();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://ashani.online",
  "https://www.ashani.online",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.json({
    name: "Ashani AI",
    status: "online",
    message: "Ashani backend is running."
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
app.use(
  "/api/search",
  searchRoutes
);

app.listen(PORT, () => {
  console.log(`Ashani backend running on http://localhost:${PORT}`);
});