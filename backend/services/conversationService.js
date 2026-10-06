const {
  db,
} = require("../config/database");

const {
  readGeneratedImage,
  imageToDataUrl,
} = require("./imageStorageService");
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
  return new Promise(
    (resolve, reject) => {
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
            function (
              insertError
            ) {
              if (insertError) {
                return reject(
                  insertError
                );
              }

              db.run(
                `
                UPDATE conversations
                SET updated_at =
                  CURRENT_TIMESTAMP
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
    }
  );
}

function addImageMessage(
  conversationId,
  userId,
  imagePath,
  imageFilename,
  imageMimeType
) {
  return new Promise(
    (resolve, reject) => {
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

          db.run(
            `
            INSERT INTO messages
            (
              conversation_id,
              role,
              content,
              token_count,
              image_path,
              image_filename,
              image_mime_type
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
              conversationId,
              "assistant",
              "",
              0,
              imagePath,
              imageFilename,
              imageMimeType,
            ],
            function (
              insertError
            ) {
              if (insertError) {
                return reject(
                  insertError
                );
              }

              db.run(
                `
                UPDATE conversations
                SET updated_at =
                  CURRENT_TIMESTAMP
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
                    role: "assistant",
                    content: "",
                    imagePath,
                    imageFilename,
                    imageMimeType,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
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
  return new Promise(
    (resolve, reject) => {
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
              image_path,
              image_filename,
              image_mime_type,
              created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            `,
            [conversationId],
            (
              messageError,
              rows
            ) => {
              if (messageError) {
                return reject(
                  messageError
                );
              }

              const messages =
                (rows || []).map(
                  (message) => {
                    let image = null;

                    if (
                      message.image_path
                    ) {
                      try {
                        const buffer =
                          readGeneratedImage(
                            message.image_path
                          );

                        image =
                          imageToDataUrl(
                            buffer,
                            message.image_mime_type ||
                              "image/png"
                          );
                      } catch (
                        imageError
                      ) {
                        console.error(
                          "Failed to load stored image:",
                          imageError
                        );
                      }
                    }

                    return {
                      id:
                        message.id,
                      role:
                        message.role,
                      content:
                        message.content,
                      token_count:
                        message.token_count,
                      created_at:
                        message.created_at,
                      image,
                      image_filename:
                        message.image_filename ||
                        null,
                    };
                  }
                );

              resolve(
                messages
              );
            }
          );
        }
      );
    }
  );
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