import {
  getGuestId,
  getToken,
} from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/*
|--------------------------------------------------------------------------
| Stream AI response
|--------------------------------------------------------------------------
*/

export async function streamMessage(
  messages,
  onToken,
  onComplete,
  onMeta,
  onImage,
  generationOptions = {}
) {
  const token = getToken();
  const guestId = getGuestId();

  const headers = {
    "Content-Type": "application/json",
    "X-Guest-ID": guestId,
  };

  // Send JWT when logged in
  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  console.log("CHAT REQUEST AUTH:", {
    hasToken: Boolean(token),
    guestId,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/chat/stream`,
    {
      method: "POST",
      headers,

      body: JSON.stringify({
  messages,
  generationOptions,
}),
    }
  );

  if (!response.ok) {
    let errorMessage =
      "Failed to connect to Ashani.";

    try {
      const data =
        await response.json();

      errorMessage =
        data.error ||
        errorMessage;
    } catch {
      // Ignore JSON parsing failure
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error(
      "Streaming is not supported by this browser."
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";
  let fullResponse = "";

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );

    const events =
      buffer.split("\n\n");

    buffer =
      events.pop() || "";

    for (const event of events) {
      const line = event
        .split("\n")
        .find((line) =>
          line.startsWith("data: ")
        );

      if (!line) {
        continue;
      }

      const data =
        line.slice(6);

      // Stream finished
      if (data === "[DONE]") {
        continue;
      }

      try {
        const parsed =
          JSON.parse(data);

        if (parsed.error) {
          console.error(
            "Ashani stream error:",
            parsed.error
          );

          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | Stream metadata
        |--------------------------------------------------------------------------
        */

        if (parsed.type === "meta") {
  onMeta?.(parsed);
  continue;
}

if (parsed.type === "image") {
  onImage?.(parsed);
  continue;
}

        /*
        |--------------------------------------------------------------------------
        | Stream content
        |--------------------------------------------------------------------------
        */

        if (parsed.content) {
          fullResponse +=
            parsed.content;

          onToken?.(
            parsed.content
          );
        }
      } catch (error) {
        console.error(
          "Failed to parse stream:",
          error
        );
      }
    }
  }

  onComplete?.();

  return fullResponse;
}

/*
|--------------------------------------------------------------------------
| Get current usage
|--------------------------------------------------------------------------
*/

export async function getUsage() {
  const token = getToken();
  const guestId = getGuestId();

  const headers = {
    "X-Guest-ID": guestId,
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/usage`,
    {
      method: "GET",
      headers,
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to retrieve usage."
    );
  }

  return data.usage;
}

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

export async function registerUser(
  username,
  email,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        username,
        email,
        password,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Registration failed."
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export async function loginUser(
  identifier,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        identifier,
        password,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Login failed."
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Create conversation
|--------------------------------------------------------------------------
*/

export async function createConversation(
  title = "New conversation"
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Login required to create a conversation."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        title,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to create conversation."
    );
  }

  return data.conversation;
}

/*
|--------------------------------------------------------------------------
| Get conversations
|--------------------------------------------------------------------------
*/

export async function getConversations() {
  const token = getToken();

  if (!token) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to retrieve conversations."
    );
  }

  return data.conversations;
}

/*
|--------------------------------------------------------------------------
| Get one conversation
|--------------------------------------------------------------------------
*/

export async function getConversation(
  conversationId
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Login required."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to retrieve conversation."
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Save message
|--------------------------------------------------------------------------
*/

export async function saveMessage(
  conversationId,
  role,
  content,
  tokenCount = 0
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Login required."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/messages`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        role,
        content,
        tokenCount,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to save message."
    );
  }

  return data.message;
}

/*
|--------------------------------------------------------------------------
| Rename conversation
|--------------------------------------------------------------------------
*/

export async function renameConversation(
  conversationId,
  title
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Login required."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/title`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        title,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to rename conversation."
    );
  }

  return data;
}