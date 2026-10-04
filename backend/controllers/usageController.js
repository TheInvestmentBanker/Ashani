const {
  getUsage,
} = require("../services/usageService");

async function getCurrentUsage(req, res) {
  try {
    const userId = req.user?.userId || null;
    const guestId = userId
      ? null
      : req.guestId;

    console.log("========== USAGE DEBUG ==========");
    console.log("req.user:", req.user);
    console.log("userId:", userId);
    console.log("guestId:", guestId);

    const usage = await getUsage(
      userId,
      guestId
    );

    console.log("usage returned:", usage);
    console.log("=================================");

    res.json({
      usage,
    });
  } catch (error) {
    console.error(
      "Usage error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to retrieve usage.",
    });
  }
}

module.exports = {
  getCurrentUsage,
};