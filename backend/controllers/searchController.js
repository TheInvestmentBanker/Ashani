const {
  searchWeb,
} = require("../services/searchService");

async function search(req, res) {
  try {
    const { q } = req.query;

    if (
      typeof q !== "string" ||
      !q.trim()
    ) {
      return res.status(400).json({
        error: "Search query is required.",
      });
    }

    console.log(
      "Searching SearXNG for:",
      q
    );

    const results =
      await searchWeb(q);

    return res.json({
      query: q.trim(),
      results,
    });

  } catch (error) {
    console.error(
      "========== SEARCH ERROR =========="
    );

    console.error(
      error
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "=================================="
    );

    return res.status(500).json({
      error:
        "Failed to search the web.",
      details:
        error.message,
    });
  }
}

module.exports = {
  search,
};