const {
  generateResponse,
  streamResponse,
  buildWebSearchContext,
} = require("../services/ollamaService");

const {
  getUsage,
  recordUsage,
} = require("../services/usageService");

const {
  getUserById,
  updateNickname,
} = require("../services/userService");

const {
  getConversationCount,
} = require("../services/conversationService");

const {
  performWebSearch,
} = require("../services/webSearchService");

const {
  shouldSearchWeb,
} = require("../services/searchRouter");


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
| Get last user message
|--------------------------------------------------------------------------
*/

function getLastUserMessage(messages) {
  for (
    let i = messages.length - 1;
    i >= 0;
    i--
  ) {
    if (
      messages[i]?.role === "user" &&
      typeof messages[i]?.content === "string"
    ) {
      return messages[i];
    }
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| Prepare Web Search Context
|--------------------------------------------------------------------------
*/

async function prepareWebSearch(messages) {
  const lastUserMessage =
    getLastUserMessage(messages);

  if (!lastUserMessage) {
    return {
      messages,
      searched: false,
      searchData: null,
    };
  }

  const query =
    lastUserMessage.content.trim();

  const shouldSearch =
    shouldSearchWeb(query);

  if (!shouldSearch) {
    console.log(
      "WEB SEARCH: Not required"
    );

    return {
      messages,
      searched: false,
      searchData: null,
    };
  }

  console.log(
    "WEB SEARCH: Required"
  );

  console.log(
    "WEB SEARCH QUERY:",
    query
  );

  try {
    const searchData =
      await performWebSearch(query, {
        categories: "general",
        language: "en",
        safesearch: 0,
      });

    console.log(
      `WEB SEARCH: ${searchData.resultCount} results`
    );

    if (
      !searchData.results ||
      searchData.results.length === 0
    ) {
      console.log(
        "WEB SEARCH: No results found"
      );

      return {
        messages,
        searched: true,
        searchData,
      };
    }

    /*
    ----------------------------------------------------------------------
    Add web results to the latest user message.

    This keeps the search context attached to the
    current request rather than permanently adding
    search results to the conversation history.
    ----------------------------------------------------------------------
    */

    const webContext =
      buildWebSearchContext(
        searchData
      );

    const enrichedMessages =
      messages.map(
        (message, index) => {
          if (
            index ===
              messages.length - 1 &&
            message.role === "user"
          ) {
            return {
              ...message,
              content:
                `${message.content}\n\n${webContext}`,
            };
          }

          return message;
        }
      );

    return {
      messages: enrichedMessages,
      searched: true,
      searchData,
    };

  } catch (error) {
    /*
    ----------------------------------------------------------------------
    Search failure should NOT destroy normal chat.

    If SearXNG fails, Ashani continues without web
    search instead of returning a completely broken
    chat response.
    ----------------------------------------------------------------------
    */

    console.error(
      "WEB SEARCH ERROR:",
      error
    );

    return {
      messages,
      searched: false,
      searchData: null,
    };
  }
}


/*
|--------------------------------------------------------------------------
| Normal Chat
|--------------------------------------------------------------------------
*/

async function chat(req, res) {
  try {
    const { messages } =
      req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        error:
          "Messages are required.",
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
        messages[
          messages.length - 1
        ];

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

          console.log(
            `Nickname updated for user ${userId}: ${nickname}`
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


    /*
    |--------------------------------------------------------------------------
    | Get conversation count
    |--------------------------------------------------------------------------
    */

    const conversationCount =
      userId
        ? await getConversationCount(
            userId
          )
        : 0;


    /*
    |--------------------------------------------------------------------------
    | Web Search
    |--------------------------------------------------------------------------
    */

    const searchResult =
      await prepareWebSearch(
        messages
      );


    /*
    |--------------------------------------------------------------------------
    | Generate response
    |--------------------------------------------------------------------------
    */

    const reply =
      await generateResponse(
        searchResult.messages,
        user,
        conversationCount
      );


    res.json({
      reply,

      /*
      Useful for the frontend later.
      We can use this to display a
      "Web Search" indicator.
      */
      searched:
        searchResult.searched,
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
    const { messages } =
      req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        error:
          "Messages are required.",
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
        messages[
          messages.length - 1
        ];

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

          } catch (
            nicknameError
          ) {
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
    | Get conversation count
    |--------------------------------------------------------------------------
    */

    const conversationCount =
      userId
        ? await getConversationCount(
            userId
          )
        : 0;


    /*
    |--------------------------------------------------------------------------
    | Web Search
    |--------------------------------------------------------------------------
    */

    const searchResult =
      await prepareWebSearch(
        messages
      );


    /*
    |--------------------------------------------------------------------------
    | Start Ollama stream
    |--------------------------------------------------------------------------
    */

    const stream =
      await streamResponse(
        searchResult.messages,
        user,
        conversationCount
      );


    /*
    |--------------------------------------------------------------------------
    | SSE headers
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Tell frontend whether web search was used
    |--------------------------------------------------------------------------
    */

    res.write(
      `data: ${JSON.stringify({
        type: "meta",
        searched:
          searchResult.searched,
      })}\n\n`
    );


    /*
    |--------------------------------------------------------------------------
    | Read Ollama stream
    |--------------------------------------------------------------------------
    */

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
          decoder.decode(
            value,
            {
              stream: true,
            }
          );


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


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  chat,
  streamChat,
};