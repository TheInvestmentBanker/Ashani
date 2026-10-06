const SEARXNG_URL =
  process.env.SEARXNG_URL ||
  "http://127.0.0.1:8080";

/**
 * Search the web through the local SearXNG instance.
 *
 * @param {string} query
 * @param {object} options
 * @returns {Promise<Array>}
 */
async function searchWeb(
  query,
  options = {}
) {
  if (
    typeof query !== "string" ||
    !query.trim()
  ) {
    throw new Error(
      "Search query is required."
    );
  }

  const {
    categories = "general",
    language = "en",
    safesearch = 0,
    page = 1,
    timeRange = null,
  } = options;

  const params =
    new URLSearchParams();

  params.set(
    "q",
    query.trim()
  );

  params.set(
    "format",
    "json"
  );

  params.set(
    "categories",
    categories
  );

  params.set(
    "language",
    language
  );

  params.set(
    "safesearch",
    String(safesearch)
  );

  params.set(
    "pageno",
    String(page)
  );

  if (timeRange) {
    params.set(
      "time_range",
      timeRange
    );
  }

  const url =
    `${SEARXNG_URL}/search?${params.toString()}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SearXNG request failed: ${response.status} ${response.statusText}`
    );
  }

  const data =
    await response.json();

  const results =
    Array.isArray(data.results)
      ? data.results
      : [];

  return results.map(
    (result) => ({
      title:
        result.title || "",

      url:
        result.url || "",

      content:
        result.content || "",

      engine:
        result.engine || "",

      engines:
        Array.isArray(result.engines)
          ? result.engines
          : [],

      category:
        result.category || "",

      publishedDate:
        result.publishedDate || null,

      thumbnail:
        result.thumbnail || null,
    })
  );
}


/**
 * Search the web and return
 * the complete SearXNG response.
 *
 * Useful later for Deep Search,
 * where we may need metadata.
 *
 * @param {string} query
 * @param {object} options
 * @returns {Promise<object>}
 */
async function searchWebRaw(
  query,
  options = {}
) {
  if (
    typeof query !== "string" ||
    !query.trim()
  ) {
    throw new Error(
      "Search query is required."
    );
  }

  const {
    categories = "general",
    language = "en",
    safesearch = 0,
    page = 1,
    timeRange = null,
  } = options;

  const params =
    new URLSearchParams();

  params.set(
    "q",
    query.trim()
  );

  params.set(
    "format",
    "json"
  );

  params.set(
    "categories",
    categories
  );

  params.set(
    "language",
    language
  );

  params.set(
    "safesearch",
    String(safesearch)
  );

  params.set(
    "pageno",
    String(page)
  );

  if (timeRange) {
    params.set(
      "time_range",
      timeRange
    );
  }

  const url =
    `${SEARXNG_URL}/search?${params.toString()}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SearXNG request failed: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}


module.exports = {
  searchWeb,
  searchWebRaw,
};