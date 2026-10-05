const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(
  __dirname,
  "..",
  "ashani.db"
);

const db = new sqlite3.Database(
  databasePath,
  (error) => {
    if (error) {
      console.error(
        "SQLite connection error:",
        error.message
      );
    } else {
      console.log("SQLite database connected.");
    }
  }
);

function initializeDatabase() {
  db.serialize(() => {
    // Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversations
    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      )
    `);

    // Messages
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE
      )
    `);

    // Token usage
    db.run(`
      CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        guest_id TEXT,
        tokens_used INTEGER DEFAULT 0,
        period_start DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      )
    `);
  });
}

module.exports = {
  db,
  initializeDatabase,
};