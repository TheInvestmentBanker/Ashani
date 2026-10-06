const {
  searchWeb,
} = require("./searchService");


async function performWebSearch(
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

  const results =
    await searchWeb(
      query,
      options
    );

  return {
    query: query.trim(),
    results,
    resultCount: results.length,
  };
}


function formatSearchResults(
  searchData
) {
  if (
    !searchData ||
    !Array.isArray(
      searchData.results
    )
  ) {
    return "";
  }

  return searchData.results
    .map((result, index) => {
      return `
SOURCE ${index + 1}

Title:
${result.title}

URL:
${result.url}

Content:
${result.content}

Search Engine:
${result.engine}
`;
    })
    .join("\n");
}


module.exports = {
  performWebSearch,
  formatSearchResults,
};