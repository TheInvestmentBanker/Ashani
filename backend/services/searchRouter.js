function shouldSearchWeb(
  message
) {
  if (
    typeof message !== "string" ||
    !message.trim()
  ) {
    return false;
  }

  const text =
    message
      .toLowerCase()
      .trim();

  const searchPatterns = [
    /\blatest\b/,
    /\btoday\b/,
    /\btonight\b/,
    /\byesterday\b/,
    /\btomorrow\b/,
    /\bcurrently\b/,
    /\bcurrent\b/,
    /\bnow\b/,
    /\brecent\b/,
    /\brecently\b/,
    /\bthis week\b/,
    /\bthis month\b/,
    /\bthis year\b/,
    /\bnews\b/,
    /\bprice\b/,
    /\bstock price\b/,
    /\bweather\b/,
    /\bwho won\b/,
    /\bscore\b/,
    /\bsearch the web\b/,
    /\bsearch online\b/,
    /\blook online\b/,
    /\bonline\b/,
    /\baccording to\b/,
    /\bwhat happened\b/,
    /\bwhat's happening\b/,
  ];

  return searchPatterns.some(
    (pattern) =>
      pattern.test(text)
  );
}


module.exports = {
  shouldSearchWeb,
};