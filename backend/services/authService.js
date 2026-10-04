const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  createToken,
  verifyToken,
};