const { db } = require("../config/database");

const {
  hashPassword,
  comparePassword,
  createToken,
} = require("../services/authService");

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

function register(req, res) {
  const {
    username,
    email,
    password,
  } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error:
        "Username, email, and password are required.",
    });
  }

  const normalizedUsername =
    username.trim();

  const normalizedEmail =
    email.trim().toLowerCase();

  // Username validation
  if (normalizedUsername.length < 3) {
    return res.status(400).json({
      error:
        "Username must be at least 3 characters.",
    });
  }

  if (normalizedUsername.length > 30) {
    return res.status(400).json({
      error:
        "Username cannot exceed 30 characters.",
    });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters.",
    });
  }

  // Check username OR email
  db.get(
    `
    SELECT id
    FROM users
    WHERE email = ?
       OR username = ?
    `,
    [
      normalizedEmail,
      normalizedUsername,
    ],
    async (error, existingUser) => {
      if (error) {
        console.error(
          "Registration lookup error:",
          error
        );

        return res.status(500).json({
          error: "Database error.",
        });
      }

      if (existingUser) {
        return res.status(409).json({
          error:
            "Username or email is already registered.",
        });
      }

      try {
        const passwordHash =
          await hashPassword(password);

        db.run(
          `
          INSERT INTO users
          (
            username,
            email,
            password_hash,
            nickname
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            normalizedUsername,
            normalizedEmail,
            passwordHash,
            null,
          ],
          function (insertError) {
            if (insertError) {
              console.error(
                "Registration insert error:",
                insertError
              );

              return res.status(500).json({
                error:
                  "Failed to create account.",
              });
            }

            const user = {
              id: this.lastID,
              username: normalizedUsername,
              email: normalizedEmail,
              nickname: null,
            };

            const token =
              createToken(user);

            res.status(201).json({
              token,
              user,
            });
          }
        );
      } catch (hashError) {
        console.error(
          "Password hashing error:",
          hashError
        );

        return res.status(500).json({
          error:
            "Failed to create account.",
        });
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

function login(req, res) {
  const {
    identifier,
    password,
  } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      error:
        "Username or email and password are required.",
    });
  }

  const normalizedIdentifier =
    identifier.trim();

  db.get(
    `
    SELECT
      id,
      username,
      email,
      password_hash,
      nickname
    FROM users
    WHERE username = ?
       OR email = ?
    `,
    [
      normalizedIdentifier,
      normalizedIdentifier.toLowerCase(),
    ],
    async (error, user) => {
      if (error) {
        console.error(
          "Login lookup error:",
          error
        );

        return res.status(500).json({
          error: "Database error.",
        });
      }

      if (!user) {
        return res.status(401).json({
          error:
            "Invalid username/email or password.",
        });
      }

      try {
        const validPassword =
          await comparePassword(
            password,
            user.password_hash
          );

        if (!validPassword) {
          return res.status(401).json({
            error:
              "Invalid username/email or password.",
          });
        }

        const token =
          createToken({
            id: user.id,
            username: user.username,
            email: user.email,
          });

        res.json({
          token,

          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname || null,
          },
        });
      } catch (loginError) {
        console.error(
          "Password verification error:",
          loginError
        );

        return res.status(500).json({
          error: "Login failed.",
        });
      }
    }
  );
}

module.exports = {
  register,
  login,
};