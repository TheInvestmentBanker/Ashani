const { db } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Create conversation
|--------------------------------------------------------------------------
*/

function createConversation(userId, title = "New conversation") {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO conversations
      (
        user_id,
        title
      )
      VALUES (?, ?)
      `,
      [userId, title],
      function (error) {
        if (error) {
          return reject(error);
        }

        resolve({
          id: this.lastID,
          userId,
          title,
        });
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Get user's conversations
|--------------------------------------------------------------------------
*/

function getConversations(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        id,
        title,
        created_at,
        updated_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC, id DESC
      `,
      [userId],
      (error, rows) => {
        if (error) {
          return reject(error);
        }

        resolve(rows || []);
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Get one conversation
|--------------------------------------------------------------------------
*/

function getConversation(
  conversationId,
  userId
) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT
        id,
        title,
        created_at,
        updated_at
      FROM conversations
      WHERE id = ?
        AND user_id = ?
      `,
      [
        conversationId,
        userId,
      ],
      (error, row) => {
        if (error) {
          return reject(error);
        }

        resolve(row || null);
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Add message
|--------------------------------------------------------------------------
*/

function addMessage(
  conversationId,
  userId,
  role,
  content,
  tokenCount = 0
) {
  return new Promise((resolve, reject) => {
    /*
    |--------------------------------------------------------------------------
    | First verify ownership
    |--------------------------------------------------------------------------
    */

    db.get(
      `
      SELECT id
      FROM conversations
      WHERE id = ?
        AND user_id = ?
      `,
      [
        conversationId,
        userId,
      ],
      (error, conversation) => {
        if (error) {
          return reject(error);
        }

        if (!conversation) {
          return reject(
            new Error(
              "Conversation not found."
            )
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Insert message
        |--------------------------------------------------------------------------
        */

        db.run(
          `
          INSERT INTO messages
          (
            conversation_id,
            role,
            content,
            token_count
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            conversationId,
            role,
            content,
            tokenCount,
          ],
          function (insertError) {
            if (insertError) {
              return reject(insertError);
            }

            /*
            |--------------------------------------------------------------------------
            | Update conversation timestamp
            |--------------------------------------------------------------------------
            */

            db.run(
              `
              UPDATE conversations
              SET updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
              `,
              [conversationId],
              (updateError) => {
                if (updateError) {
                  return reject(
                    updateError
                  );
                }

                resolve({
                  id: this.lastID,
                  conversationId,
                  role,
                  content,
                  tokenCount,
                });
              }
            );
          }
        );
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Get conversation messages
|--------------------------------------------------------------------------
*/

function getMessages(
  conversationId,
  userId
) {
  return new Promise((resolve, reject) => {
    /*
    |--------------------------------------------------------------------------
    | Verify ownership first
    |--------------------------------------------------------------------------
    */

    db.get(
      `
      SELECT id
      FROM conversations
      WHERE id = ?
        AND user_id = ?
      `,
      [
        conversationId,
        userId,
      ],
      (error, conversation) => {
        if (error) {
          return reject(error);
        }

        if (!conversation) {
          return reject(
            new Error(
              "Conversation not found."
            )
          );
        }

        db.all(
          `
          SELECT
            id,
            role,
            content,
            token_count,
            created_at
          FROM messages
          WHERE conversation_id = ?
          ORDER BY id ASC
          `,
          [conversationId],
          (messageError, rows) => {
            if (messageError) {
              return reject(
                messageError
              );
            }

            resolve(rows || []);
          }
        );
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Update conversation title
|--------------------------------------------------------------------------
*/

function updateConversationTitle(
  conversationId,
  userId,
  title
) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE conversations
      SET
        title = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND user_id = ?
      `,
      [
        title,
        conversationId,
        userId,
      ],
      function (error) {
        if (error) {
          return reject(error);
        }

        if (this.changes === 0) {
          return reject(
            new Error(
              "Conversation not found."
            )
          );
        }

        resolve();
      }
    );
  });
}

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  addMessage,
  getMessages,
  updateConversationTitle,
  getConversationCount,
};
async function getConversationCount(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT COUNT(*) AS count
      FROM conversations
      WHERE user_id = ?
      `,
      [userId],
      (error, row) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(row?.count || 0);
      }
    );
  });
}