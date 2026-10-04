const {
  createConversation,
  getConversations,
  getConversation,
  addMessage,
  getMessages,
  updateConversationTitle,
} = require("../services/conversationService");

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

async function create(req, res) {
  try {
    const userId = req.user.userId;

    const title =
      req.body?.title?.trim() ||
      "New conversation";

    const conversation =
      await createConversation(
        userId,
        title
      );

    res.status(201).json({
      conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to create conversation.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

async function list(req, res) {
  try {
    const userId = req.user.userId;

    const conversations =
      await getConversations(
        userId
      );

    res.json({
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to retrieve conversations.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Get conversation
|--------------------------------------------------------------------------
*/

async function getOne(req, res) {
  try {
    const userId = req.user.userId;

    const conversationId =
      Number(req.params.id);

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        error:
          "Invalid conversation ID.",
      });
    }

    const conversation =
      await getConversation(
        conversationId,
        userId
      );

    if (!conversation) {
      return res.status(404).json({
        error:
          "Conversation not found.",
      });
    }

    const messages =
      await getMessages(
        conversationId,
        userId
      );

    res.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error(
      "Get conversation error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to retrieve conversation.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Add message
|--------------------------------------------------------------------------
*/

async function add(req, res) {
  try {
    const userId = req.user.userId;

    const conversationId =
      Number(req.params.id);

    const {
      role,
      content,
      tokenCount,
    } = req.body;

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        error:
          "Invalid conversation ID.",
      });
    }

    if (
      !role ||
      !["user", "assistant"].includes(role)
    ) {
      return res.status(400).json({
        error:
          "Invalid message role.",
      });
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        error:
          "Message content is required.",
      });
    }

    const message =
      await addMessage(
        conversationId,
        userId,
        role,
        content,
        Number(tokenCount) || 0
      );

    res.status(201).json({
      message,
    });
  } catch (error) {
    console.error(
      "Add message error:",
      error
    );

    if (
      error.message ===
      "Conversation not found."
    ) {
      return res.status(404).json({
        error:
          "Conversation not found.",
      });
    }

    res.status(500).json({
      error:
        "Failed to save message.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Rename
|--------------------------------------------------------------------------
*/

async function rename(req, res) {
  try {
    const userId = req.user.userId;

    const conversationId =
      Number(req.params.id);

    const title =
      req.body?.title?.trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        error:
          "Invalid conversation ID.",
      });
    }

    if (!title) {
      return res.status(400).json({
        error:
          "Conversation title is required.",
      });
    }

    await updateConversationTitle(
      conversationId,
      userId,
      title
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Rename conversation error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to rename conversation.",
    });
  }
}

module.exports = {
  create,
  list,
  getOne,
  add,
  rename,
};