const { verifyToken } = require("../services/authService");

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  // No JWT → guest
  if (!header || !header.startsWith("Bearer ")) {
    req.user = null;
  } else {
    const token = header.split(" ")[1];

    try {
      req.user = verifyToken(token);
    } catch (error) {
      // Invalid/expired JWT → treat as guest
      req.user = null;
    }
  }

  // Guest ID supplied by the browser
  req.guestId = req.headers["x-guest-id"] || null;

  next();
}

module.exports = {
  optionalAuth,
};