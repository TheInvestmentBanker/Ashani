import { useEffect, useState } from "react";
import { Box } from "@mui/material";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";

import {
  streamMessage,
  createConversation,
  getConversations,
  getConversation,
  saveMessage,
  renameConversation,
} from "../services/api";

import { getUser } from "../services/auth";

function createGuestConversation() {
  return {
    id: `guest-${crypto.randomUUID()}`,
    title: "New conversation",
    messages: [],
    persistent: false,
  };
}

function ChatPage() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [conversations, setConversations] =
    useState([]);

  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [initializing, setInitializing] =
    useState(true);

  const user = getUser();

  /*
  |--------------------------------------------------------------------------
  | Initialize conversations
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function initialize() {
      try {
        /*
        |--------------------------------------------------------------------------
        | Registered user
        |--------------------------------------------------------------------------
        */

        if (user) {
          const savedConversations =
            await getConversations();

          if (savedConversations.length > 0) {
            setConversations(
              savedConversations.map(
                (conversation) => ({
                  ...conversation,
                  messages: [],
                  persistent: true,
                })
              )
            );

            setActiveConversationId(
              savedConversations[0].id
            );
          } else {
            /*
            |--------------------------------------------------------------------------
            | Create first conversation
            |--------------------------------------------------------------------------
            */

            const conversation =
              await createConversation();

            setConversations([
              {
                ...conversation,
                messages: [],
                persistent: true,
              },
            ]);

            setActiveConversationId(
              conversation.id
            );
          }
        } else {
          /*
          |--------------------------------------------------------------------------
          | Guest
          |--------------------------------------------------------------------------
          */

          const guestConversation =
            createGuestConversation();

          setConversations([
            guestConversation,
          ]);

          setActiveConversationId(
            guestConversation.id
          );
        }
      } catch (error) {
        console.error(
          "Failed to initialize conversations:",
          error
        );

        /*
        |--------------------------------------------------------------------------
        | Fallback
        |--------------------------------------------------------------------------
        */

        const fallback =
          createGuestConversation();

        setConversations([
          fallback,
        ]);

        setActiveConversationId(
          fallback.id
        );
      } finally {
        setInitializing(false);
      }
    }

    initialize();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Active conversation
  |--------------------------------------------------------------------------
  */

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        activeConversationId
    );

  const messages =
    activeConversation?.messages || [];

  /*
  |--------------------------------------------------------------------------
  | New Chat
  |--------------------------------------------------------------------------
  */

  const handleNewChat = async () => {
    if (loading) {
      return;
    }

    try {
      if (user) {
        const conversation =
          await createConversation();

        const newConversation = {
          ...conversation,
          messages: [],
          persistent: true,
        };

        setConversations(
          (previous) => [
            newConversation,
            ...previous,
          ]
        );

        setActiveConversationId(
          conversation.id
        );
      } else {
        const newConversation =
          createGuestConversation();

        setConversations(
          (previous) => [
            newConversation,
            ...previous,
          ]
        );

        setActiveConversationId(
          newConversation.id
        );
      }

      setSidebarOpen(false);
    } catch (error) {
      console.error(
        "Failed to create conversation:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Select conversation
  |--------------------------------------------------------------------------
  */

  const handleSelectConversation =
    async (id) => {
      if (loading) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Already loaded
      |--------------------------------------------------------------------------
      */

      const existing =
        conversations.find(
          (conversation) =>
            conversation.id === id
        );

      if (
        existing &&
        existing.messages.length > 0
      ) {
        setActiveConversationId(id);
        setSidebarOpen(false);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Guest conversation
      |--------------------------------------------------------------------------
      */

      if (
        typeof id === "string" &&
        id.startsWith("guest-")
      ) {
        setActiveConversationId(id);
        setSidebarOpen(false);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Load conversation from SQLite
      |--------------------------------------------------------------------------
      */

      try {
        const data =
          await getConversation(id);

        const loadedMessages =
          data.messages.map(
            (message) => ({
              role: message.role,
              content: message.content,
            })
          );

        setConversations(
          (previous) =>
            previous.map(
              (conversation) =>
                conversation.id === id
                  ? {
                      ...conversation,
                      title:
                        data.conversation.title,
                      messages:
                        loadedMessages,
                      persistent: true,
                    }
                  : conversation
            )
        );

        setActiveConversationId(id);
        setSidebarOpen(false);
      } catch (error) {
        console.error(
          "Failed to load conversation:",
          error
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  */

  const handleSend = async (
    content
  ) => {
    if (
      loading ||
      !activeConversation
    ) {
      return;
    }

    const conversationId =
      activeConversation.id;

    const isPersistent =
      activeConversation.persistent;

    const previousMessages =
      activeConversation.messages;

    const userMessage = {
      role: "user",
      content,
    };

    const messagesForAI = [
      ...previousMessages,
      userMessage,
    ];

    /*
    |--------------------------------------------------------------------------
    | Update UI immediately
    |--------------------------------------------------------------------------
    */

    setConversations(
      (previous) =>
        previous.map(
          (conversation) =>
            conversation.id ===
            conversationId
              ? {
                  ...conversation,
                  messages: [
                    ...messagesForAI,
                    {
                      role: "assistant",
                      content: "",
                    },
                  ],
                }
              : conversation
        )
    );

    setLoading(true);

    try {
      /*
      |--------------------------------------------------------------------------
      | Save user message
      |--------------------------------------------------------------------------
      */

      if (isPersistent) {
        await saveMessage(
          conversationId,
          "user",
          content
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Generate conversation title
      |--------------------------------------------------------------------------
      */

      if (
        activeConversation.title ===
        "New conversation"
      ) {
        const title =
          content
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 50);

        if (isPersistent) {
          await renameConversation(
            conversationId,
            title
          );
        }

        setConversations(
          (previous) =>
            previous.map(
              (conversation) =>
                conversation.id ===
                conversationId
                  ? {
                      ...conversation,
                      title,
                    }
                  : conversation
            )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Stream AI response
      |--------------------------------------------------------------------------
      */

      const assistantResponse =
        await streamMessage(
          messagesForAI,

          (token) => {
            setConversations(
              (previous) =>
                previous.map(
                  (conversation) => {
                    if (
                      conversation.id !==
                      conversationId
                    ) {
                      return conversation;
                    }

                    const updatedMessages =
                      [
                        ...conversation.messages,
                      ];

                    const lastIndex =
                      updatedMessages.length -
                      1;

                    const lastMessage =
                      updatedMessages[
                        lastIndex
                      ];

                    if (
                      !lastMessage ||
                      lastMessage.role !==
                        "assistant"
                    ) {
                      return conversation;
                    }

                    updatedMessages[
                      lastIndex
                    ] = {
                      ...lastMessage,
                      content:
                        lastMessage.content +
                        token,
                    };

                    return {
                      ...conversation,
                      messages:
                        updatedMessages,
                    };
                  }
                )
            );
          },

          () => {
            setLoading(false);
          }
        );

      /*
      |--------------------------------------------------------------------------
      | Save completed assistant response
      |--------------------------------------------------------------------------
      */

      if (
        isPersistent &&
        assistantResponse
      ) {
        await saveMessage(
          conversationId,
          "assistant",
          assistantResponse
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Move conversation to top
      |--------------------------------------------------------------------------
      */

      setConversations(
        (previous) => {
          const updated =
            previous.map(
              (conversation) =>
                conversation.id ===
                conversationId
                  ? {
                      ...conversation,
                      updated_at:
                        new Date().toISOString(),
                    }
                  : conversation
            );

          return updated.sort(
            (a, b) =>
              new Date(
                b.updated_at || 0
              ) -
              new Date(
                a.updated_at || 0
              )
          );
        }
      );
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Show error inside assistant message
      |--------------------------------------------------------------------------
      */

      setConversations(
        (previous) =>
          previous.map(
            (conversation) => {
              if (
                conversation.id !==
                conversationId
              ) {
                return conversation;
              }

              const updatedMessages =
                [
                  ...conversation.messages,
                ];

              const lastIndex =
                updatedMessages.length -
                1;

              const lastMessage =
                updatedMessages[
                  lastIndex
                ];

              if (
                lastMessage?.role ===
                "assistant"
              ) {
                updatedMessages[
                  lastIndex
                ] = {
                  ...lastMessage,
                  content:
                    error.message ||
                    "Sorry, I couldn't connect to Ashani's AI server.",
                };
              }

              return {
                ...conversation,
                messages:
                  updatedMessages,
              };
            }
          )
      );

      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading screen
  |--------------------------------------------------------------------------
  */

  if (initializing) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            "background.default",
          color: "text.secondary",
        }}
      >
        Loading Ashani...
      </Box>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor:
          "background.default",
      }}
    >
      <Header
        onMenuClick={() =>
          setSidebarOpen(true)
        }
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        conversations={
          conversations
        }
        activeConversationId={
          activeConversationId
        }
        onNewChat={
          handleNewChat
        }
        onSelectConversation={
          handleSelectConversation
        }
      />

      <Box
        sx={{
          height: "100%",
          pt: "64px",
        }}
      >
        <Chat
          messages={messages}
          onSend={handleSend}
          loading={loading}
        />
      </Box>
    </Box>
  );
}

export default ChatPage;