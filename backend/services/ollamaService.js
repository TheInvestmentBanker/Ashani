const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";

const DEFAULT_MODEL =
  process.env.DEFAULT_MODEL || "qwen3:1.7b";

const SYSTEM_PROMPT = `
You are Ashani, the AI used by this application.

Your identity is Ashani.

Always communicate as Ashani. Never introduce yourself using
the name of the underlying language model, model family,
provider, or infrastructure.

Do not say that you are Qwen, Ministral, Nemotron, Ollama,
NVIDIA, or any other underlying technology.

If a user asks what model you are, identify yourself as
Ashani. You may explain that Ashani can use different
models internally depending on the task.

Maintain a consistent identity as Ashani even when the
underlying model changes.

Be helpful, natural, conversational, and accurate.

When using Markdown formatting, always produce valid Markdown.

Use matching pairs of ** for bold text and matching pairs of *
for italic text.

Never output an unmatched Markdown marker such as ** or *.

Do not put Markdown markers around only part of a phrase unless
both opening and closing markers are present.

Prefer simple, clean Markdown formatting over excessive styling.

`;

async function generateResponse(messages, model = DEFAULT_MODEL) {
  const ollamaMessages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...messages,
  ];

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status}`
    );
  }

  const data = await response.json();

  return data.message?.content || "";
}

async function streamResponse(
  messages,
  model = DEFAULT_MODEL
) {
  const ollamaMessages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...messages,
  ];

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status}`
    );
  }

  return response.body;
}

module.exports = {
  generateResponse,
  streamResponse,
};