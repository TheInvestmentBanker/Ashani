function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


/*
|--------------------------------------------------------------------------
| Questions that can be answered locally
|--------------------------------------------------------------------------
*/

function isDateTimeQuestion(text) {

  const patterns = [

    /\bwhat('?s| is) (today'?s )?date\b/,
    /\bwhat day is (it|today)\b/,
    /\bwhat time is it\b/,
    /\bcurrent time\b/,
    /\bcurrent date\b/,
    /\btoday'?s date\b/,
    /\bday of the week\b/,
    /\bwhat day will\b/,
    /\bwhich day will\b/,
    /\bhow many days (until|between)\b/,

  ];

  return patterns.some(
    (pattern) => pattern.test(text)
  );
}


/*
|--------------------------------------------------------------------------
| Explicit freshness signals
|--------------------------------------------------------------------------
*/

function hasFreshnessIntent(text) {

  const patterns = [

    /\blatest\b/,
    /\bcurrently\b/,
    /\bcurrent\b/,
    /\bright now\b/,
    /\btoday\b/,
    /\btonight\b/,
    /\byesterday\b/,
    /\btomorrow\b/,
    /\brecent\b/,
    /\brecently\b/,
    /\bthis week\b/,
    /\bthis month\b/,
    /\bthis year\b/,
    /\bupcoming\b/,
    /\btrending\b/,
    /\bbreaking\b/,
    /\bnews\b/,
    /\bnew release\b/,
    /\blatest release\b/,
    /\bnewly released\b/,
    /\bjust released\b/,
    /\bannounced\b/,
    /\brecent announcement\b/,
    /\bwho won\b/,
    /\bscore\b/,
    /\bscores\b/,
    /\bstandings\b/,
    /\bschedule\b/,
    /\bprice\b/,
    /\bprices\b/,
    /\bstock price\b/,
    /\bmarket cap\b/,
    /\bweather\b/,
    /\bforecast\b/,

  ];

  return patterns.some(
    (pattern) => pattern.test(text)
  );
}


/*
|--------------------------------------------------------------------------
| Future / dated entities
|--------------------------------------------------------------------------
*/

function hasFutureEventIntent(text) {

  const patterns = [

    /\b20\d{2}\b/,
    /\bnext year\b/,
    /\bnext month\b/,
    /\bnext week\b/,
    /\bupcoming event\b/,
    /\bupcoming games\b/,
    /\bupcoming movie\b/,
    /\bupcoming release\b/,
    /\b2027\b/,
    /\b2028\b/,
    /\b2029\b/,

  ];

  return patterns.some(
    (pattern) => pattern.test(text)
  );
}


/*
|--------------------------------------------------------------------------
| Current entity categories
|--------------------------------------------------------------------------
*/

function hasCurrentEntityIntent(text) {

  const patterns = [

    /\bpresident\b/,
    /\bprime minister\b/,
    /\bceo\b/,
    /\bcompany\b.*\bnow\b/,
    /\bmodel\b.*\brelease\b/,
    /\bversion\b/,
    /\bsoftware\b.*\bversion\b/,
    /\bai model\b/,
    /\biphone\b/,
    /\bnvidia\b/,
    /\bopenai\b/,
    /\bgoogle\b/,
    /\btesla\b/,
    /\bspacex\b/,

  ];

  return patterns.some(
    (pattern) => pattern.test(text)
  );
}


/*
|--------------------------------------------------------------------------
| Main router
|--------------------------------------------------------------------------
*/

function getSearchIntent(message) {

  if (
    typeof message !== "string" ||
    !message.trim()
  ) {
    return "NO_SEARCH";
  }

  const text =
    normalize(message);


  /*
  |--------------------------------------------------------------------------
  | Date/time gets priority over web search
  |--------------------------------------------------------------------------
  */

  if (
    isDateTimeQuestion(text)
  ) {
    return "LOCAL_TIME";
  }


  /*
  |--------------------------------------------------------------------------
  | Explicit freshness
  |--------------------------------------------------------------------------
  */

  if (
    hasFreshnessIntent(text)
  ) {
    return "WEB_SEARCH";
  }


  /*
  |--------------------------------------------------------------------------
  | Future/current entities
  |--------------------------------------------------------------------------
  */

  if (
    hasFutureEventIntent(text)
  ) {
    return "WEB_SEARCH";
  }


  /*
  |--------------------------------------------------------------------------
  | Current entity questions
  |--------------------------------------------------------------------------
  */

  if (
    hasCurrentEntityIntent(text)
  ) {
    return "WEB_SEARCH";
  }


  return "NO_SEARCH";
}


function shouldSearchWeb(message) {

  return (
    getSearchIntent(message) ===
    "WEB_SEARCH"
  );

}


module.exports = {
  getSearchIntent,
  shouldSearchWeb,
};