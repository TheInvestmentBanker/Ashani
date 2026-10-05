const guestOpenings = [
  "Hi",
  "Hello",
  "Hey",
  "Namaste",
];

const guestNames = [
  "friend",
  "buddy",
  "mate",
  "fella",
  "bhai",
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
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getGuestGreeting() {
  return `${randomItem(guestOpenings)} ${randomItem(guestNames)}, ${randomItem(guestPrompts)}`;
}

export function getUserGreeting(user) {
  const name = user?.nickname || user?.firstName || "friend";
  return `Hi ${name}, what's on your mind?`;
}