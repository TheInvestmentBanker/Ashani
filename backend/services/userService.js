const { db } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Get user
|--------------------------------------------------------------------------
*/

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT
        id,
        username,
        email,
        nickname
      FROM users
      WHERE id = ?
      `,
      [userId],
      (error, user) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(user || null);
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Update nickname
|--------------------------------------------------------------------------
*/

function updateNickname(
  userId,
  nickname
) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE users
      SET nickname = ?
      WHERE id = ?
      `,
      [nickname, userId],
      function (error) {
        if (error) {
          reject(error);
          return;
        }

        resolve(this.changes > 0);
      }
    );
  });
}

module.exports = {
  getUserById,
  updateNickname,
};