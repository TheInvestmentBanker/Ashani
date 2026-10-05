/*
|--------------------------------------------------------------------------
| Ashani Greeting System
|--------------------------------------------------------------------------
|
| Guests:
|   Randomly combines:
|   - Opening
|   - Friendly name
|   - Prompt
|
| Logged-in users:
|   Uses nickname if available.
|   Otherwise uses username.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Guest Greeting Parts
|--------------------------------------------------------------------------
*/

const guestOpenings = [
  "Hi",
  "Hello",
  "Hey",
  "Namaste",
  "Howdy",
  "Yo",
  "Sup",
  "Greetings",
];

const guestNames = [
  "friend",
  "buddy",
  "mate",
  "fella",
  "bhai",
  "there",
];

const guestPrompts = [
  "What's up?",
  "What's on your mind?",
  "How are things?",
  "Wanna know something cool?",
  "Wanna hear a joke?",
  "What are you curious about?",
  "Got something on your mind?",
  "What can I help you with?",
  "What shall we talk about?",
  "What are we exploring today?",
  "What's happening?",
  "What brings you here today?",
  "Ready to explore something interesting?",
  "Got a question for me?",
  "What are you thinking about?",
];

/*
|--------------------------------------------------------------------------
| Special Guest Greetings
|--------------------------------------------------------------------------
|
| These don't follow the three-part formula and allow more variety.
|
*/

const specialGuestGreetings = [
  "Namaste! Aaj kya scene hai?",
  "Arre bhai, kya chal raha hai?",
  "Oii! What's on your mind?",
  "Hey hey! What are we cooking today?",
  "Hello there! Fancy learning something cool?",
  "Well hello there! What shall we talk about?",
  "Ah, you're here! What's up?",
  "Hey! Got a question for me?",
  "Namaste! What shall we explore today?",
  "Sup? What's poppin'?",
  "Howdy! What brings you here?",
  "Hello friend! What are we getting into today?",
  "Hey there! Ready for a little adventure?",
  "Welcome! What are you curious about?",
];

/*
|--------------------------------------------------------------------------
| Personalized Greetings
|--------------------------------------------------------------------------
|
| {name} is replaced with the user's nickname or username.
|
|--------------------------------------------------------------------------
*/

const personalizedGreetings = [
  // English
  "Hi {name}, what's on your mind?",
  "Hello {name}, how are things?",
  "Hey {name}, what's up?",
  "Hi {name}, what are you thinking about?",
  "Hello {name}, what can I help you with?",
  "Hey {name}, got something interesting for me?",
  "Hi {name}, what shall we explore today?",
  "Hello {name}, what are you curious about?",
  "Hey {name}, wanna know something cool?",
  "Hi {name}, got a question for me?",
  "Hello {name}, what brings you here today?",
  "Hey {name}, what's happening?",
  "Hi {name}, what's cooking?",
  "Hello {name}, what are we working on today?",
  "Hey {name}, anything interesting on your mind?",

  // Hindi
  "Namaste {name}, aap kaise hain?",
  "Namaste {name}, kya haal hai?",
  "Namaste {name}, aaj kya chal raha hai?",
  "Namaste {name}, aaj kya baat karein?",
  "Namaste {name}, sab badhiya?",
  "Arre {name}, kya haal chaal hai?",
  "Arre {name}, aaj kaise yaad kiya?",
  "Hello {name}, aaj kaise yaad kiya?",
  "Hello {name}, aap aaye bahar aayi!",
  "Hey {name}, kya scene hai?",
  "Oii {name}, kya chal raha hai?",
  "Bhai {name}, kya haal hai?",
  "Arre bhai {name}, aaj kya plan hai?",
  "Namaste {name}, aaj mausam kaisa hai?",
  "Hi {name}, aaj ka mausam kaisa hai?",
  "Hello {name}, aaj ka din kaisa jaa raha hai?",
  "Hey {name}, aaj kya scene hai?",
  "Namaste {name}, kuch naya seekhne aaye ho?",
  "Arre {name}, kuch interesting baat karte hain?",

  // Hinglish
  "Hey {name}, kya scene hai?",
  "Hi {name}, kya chal raha hai?",
  "Sup {name}? What's poppin'?",
  "Hey {name}, kya kar rahe ho?",
  "Hello {name}, aaj kya plan hai?",
  "Yo {name}, what's the scene?",
  "Hey {name}, aaj kis topic pe dimaag lagana hai?",
  "Hi {name}, kuch interesting discuss karein?",
  "Hey {name}, aaj kya explore karein?",
  "Yo {name}, ready for some brain food? 🧠",
  "Hey {name}, dimaag mein kya chal raha hai?",
  "Hi {name}, koi interesting sawaal hai?",
  "Arre {name}, aaj kya adventure hai?",
  "Hey {name}, kuch crazy soch rahe ho kya?",
  "Hello {name}, batao kya scene hai?",


  // Russian
  "Привет, {name}! Как дела?",
  "Здравствуйте, {name}! Как ваши дела?",
  "Привет, {name}! Как жизнь?",
  "Эй, {name}! Как дела?",
  "Добрый день, {name}! Как настроение?",
  "Привет, {name}! Что нового?",
  "Ну привет, {name}! Что будем делать?",
  "Привет, {name}! О чём думаешь?",
  "Как дела, {name}? Что сегодня обсуждаем?",
  "Привет, {name}! Чем займёмся сегодня?",

  // Slang
  "Hey {name}, howdy ya?",
  "Howdy {name}! What's going on?",
  "Sup {name}? What's poppin'?",
  "Yo {name}, what's good?",
  "Yo {name}, what's happening?",
  "Hey {name}, what's the vibe today?",
  "What's good, {name}?",
  "Yo {name}, ready to cook? 🔥",
  "Hey {name}, what's the word?",
  "What's crackin', {name}?",
  "Hey {name}, long time no brainstorm. 😄",

  // Quirky / playful
  "My lord {name}, what's on the agenda?",
  "My lord {name}, what's the Tea?",
  "My lord {name}, what shall we investigate today?",
  "Ah, {name} has arrived. What is the mission?",
  "Welcome back, {name}. What are we plotting today? 😄",
  "Ahoy, {name}! What's on the agenda?",
  "Greetings, {name}! What mystery shall we solve today?",
  "Well well well, if it isn't {name}. What's up?",
  "Look who's here — {name}! What's happening?",
  "{name}! You're here. What are we getting into today?",
  "Ah, {name}! What has your curiosity discovered today?",
  "The legend {name} has entered the chat. 😎",
  "Welcome, {name}. The floor is yours.",
  "Alright {name}, hit me with your best question.",
  "Alright {name}, what are we breaking our brains over today?",
  "Okay {name}, what rabbit hole are we going down today?",
  "So, {name}... what trouble are we getting into today?",
  "Commander {name}, what's today's mission?",
  "Agent {name}, we have a new mission. What's the objective?",
];

/*
|--------------------------------------------------------------------------
| Random Item
|--------------------------------------------------------------------------
*/

function randomItem(array) {
  return array[
    Math.floor(
      Math.random() * array.length
    )
  ];
}

/*
|--------------------------------------------------------------------------
| Guest Greeting
|--------------------------------------------------------------------------
*/

export function getGuestGreeting() {
  /*
   * 30% chance of using a completely custom greeting.
   * 70% chance of combining opening + name + prompt.
   */

  if (Math.random() < 0.3) {
    return randomItem(
      specialGuestGreetings
    );
  }

  return `${randomItem(
    guestOpenings
  )} ${randomItem(
    guestNames
  )}, ${randomItem(
    guestPrompts
  )}`;
}

/*
|--------------------------------------------------------------------------
| Personalized Greeting
|--------------------------------------------------------------------------
*/

export function getUserGreeting(user) {
  const name =
    user?.nickname ||
    user?.username ||
    "friend";

  const greeting =
    randomItem(
      personalizedGreetings
    );

  return greeting.replace(
    /\{name\}/g,
    name
  );
}