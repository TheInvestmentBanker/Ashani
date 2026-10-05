const {
  generateResponse,
  streamResponse,
} = require("../services/ollamaService");

const {
  getUsage,
  recordUsage,
} = require("../services/usageService");

const {
  getUserById,
  updateNickname,
} = require("../services/userService");

/*
|--------------------------------------------------------------------------
| Nickname detection
|--------------------------------------------------------------------------
*/

function detectNickname(message) {
  if (
    typeof message !== "string" ||
    !message.trim()
  ) {
    return null;
  }

  const text = message.trim();

  const patterns = [
    /^(?:please\s+)?call\s+me\s+["']?([^"'.,!?]+)["']?[\s.!?]*$/i,

    /^you\s+can\s+call\s+me\s+["']?([^"'.,!?]+)["']?[\s.!?]*$/i,

    /^from\s+now\s+on\s*,?\s*call\s+me\s+["']?([^"'.,!?]+)["']?[\s.!?]*$/i,

    /^i\s+(?:prefer|would\s+prefer)\s+to\s+be\s+called\s+["']?([^"'.,!?]+)["']?[\s.!?]*$/i,

    /^just\s+call\s+me\s+["']?([^"'.,!?]+)["']?[\s.!?]*$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      const nickname = match[1]
        .trim()
        .replace(/\s+/g, " ");

      if (
        nickname.length >= 1 &&
        nickname.length <= 30
      ) {
        return nickname;
      }
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Normal Chat
|--------------------------------------------------------------------------
*/

async function chat(req, res) {
  try {
    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        error: "Messages are required.",
      });
    }

    const userId =
      req.user?.userId || null;

    const guestId =
      userId ? null : req.guestId;

    const usage =
      await getUsage(
        userId,
        guestId
      );

    if (usage.remaining <= 0) {
      return res.status(429).json({
        error:
          "Daily token limit reached.",
        usage,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update nickname if requested
    |--------------------------------------------------------------------------
    */

    if (userId) {
      const lastMessage =
        messages[messages.length - 1];

      if (
        lastMessage?.role === "user"
      ) {
        const nickname =
          detectNickname(
            lastMessage.content
          );

        if (nickname) {
          await updateNickname(
            userId,
            nickname
          );
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Get current user
    |--------------------------------------------------------------------------
    */

    const user =
      userId
        ? await getUserById(userId)
        : null;

    const reply =
      await generateResponse(
        messages,
        user
      );

    res.json({
      reply,
    });
  } catch (error) {
    console.error(
      "Chat error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to generate AI response.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Streaming Chat
|--------------------------------------------------------------------------
*/

async function streamChat(req, res) {
  try {
    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        error: "Messages are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Identify user
    |--------------------------------------------------------------------------
    */

    const userId =
      req.user?.userId || null;

    const guestId =
      userId ? null : req.guestId;

    console.log(
      "CHAT IDENTITY:",
      {
        userId,
        guestId,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Check daily quota
    |--------------------------------------------------------------------------
    */

    const usage =
      await getUsage(
        userId,
        guestId
      );

    if (usage.remaining <= 0) {
      return res.status(429).json({
        error:
          "Daily token limit reached.",
        usage,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update nickname if requested
    |--------------------------------------------------------------------------
    */

    if (userId) {
      const lastMessage =
        messages[messages.length - 1];

      if (
        lastMessage?.role === "user"
      ) {
        const nickname =
          detectNickname(
            lastMessage.content
          );

        if (nickname) {
          try {
            await updateNickname(
              userId,
              nickname
            );

            console.log(
              `Nickname updated for user ${userId}: ${nickname}`
            );
          } catch (nicknameError) {
            console.error(
              "Failed to update nickname:",
              nicknameError
            );
          }
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Get current user
    |--------------------------------------------------------------------------
    */

    const user =
      userId
        ? await getUserById(userId)
        : null;

    /*
    |--------------------------------------------------------------------------
    | Start Ollama stream
    |--------------------------------------------------------------------------
    */

    const stream =
      await streamResponse(
        messages,
        user
      );

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    const reader =
      stream.getReader();

    const decoder =
      new TextDecoder();

    let buffer = "";

    let promptTokens = 0;
    let completionTokens = 0;

    try {
      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer +=
          decoder.decode(value, {
            stream: true,
          });

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() || "";

        for (
          const line of lines
        ) {
          const trimmedLine =
            line.trim();

          if (!trimmedLine) {
            continue;
          }

          try {
            const data =
              JSON.parse(
                trimmedLine
              );

            /*
            |--------------------------------------------------------------------------
            | Stream generated text
            |--------------------------------------------------------------------------
            */

            if (
              data.message?.content
            ) {
              res.write(
                `data: ${JSON.stringify({
                  content:
                    data.message.content,
                })}\n\n`
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Capture token usage
            |--------------------------------------------------------------------------
            */

            if (
              data.prompt_eval_count
            ) {
              promptTokens =
                data.prompt_eval_count;
            }

            if (
              data.eval_count
            ) {
              completionTokens =
                data.eval_count;
            }

            /*
            |--------------------------------------------------------------------------
            | Ollama finished
            |--------------------------------------------------------------------------
            */

            if (data.done) {
              const totalTokens =
                promptTokens +
                completionTokens;

              if (
                totalTokens > 0
              ) {
                try {
                  await recordUsage(
                    totalTokens,
                    userId,
                    guestId
                  );

                  console.log(
                    `Usage recorded: ${totalTokens} tokens`
                  );
                } catch (
                  usageError
                ) {
                  console.error(
                    "Failed to record usage:",
                    usageError
                  );
                }
              }

              res.write(
                "data: [DONE]\n\n"
              );
            }
          } catch (error) {
            console.error(
              "Failed to parse Ollama stream line:",
              trimmedLine
            );
          }
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Process final buffered line
      |--------------------------------------------------------------------------
      */

      if (buffer.trim()) {
        try {
          const data =
            JSON.parse(
              buffer.trim()
            );

          if (
            data.message?.content
          ) {
            res.write(
              `data: ${JSON.stringify({
                content:
                  data.message.content,
              })}\n\n`
            );
          }

          if (
            data.prompt_eval_count
          ) {
            promptTokens =
              data.prompt_eval_count;
          }

          if (
            data.eval_count
          ) {
            completionTokens =
              data.eval_count;
          }

          if (data.done) {
            const totalTokens =
              promptTokens +
              completionTokens;

            if (
              totalTokens > 0
            ) {
              try {
                await recordUsage(
                  totalTokens,
                  userId,
                  guestId
                );

                console.log(
                  `Usage recorded: ${totalTokens} tokens`
                );
              } catch (
                usageError
              ) {
                console.error(
                  "Failed to record usage:",
                  usageError
                );
              }
            }

            res.write(
              "data: [DONE]\n\n"
            );
          }
        } catch (error) {
          console.error(
            "Failed to parse final Ollama chunk:",
            buffer
          );
        }
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    console.error(
      "Streaming error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error:
          "Failed to stream AI response.",
      });
    }

    res.write(
      `data: ${JSON.stringify({
        error:
          "Failed to generate AI response.",
      })}\n\n`
    );

    res.end();
  }
}

module.exports = {
  chat,
  streamChat,
};