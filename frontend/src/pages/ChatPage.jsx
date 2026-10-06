import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

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

import {
  getGuestGreeting,
  getUserGreeting,
} from "../utils/greeting";


/*
|--------------------------------------------------------------------------
| GUEST CONVERSATION STORAGE
|--------------------------------------------------------------------------
*/

const GUEST_STORAGE_PREFIX =
  "ashani_guest_conversation_";


function createGuestConversation() {
  return {
    id: `guest-${crypto.randomUUID()}`,
    title: "New conversation",
    messages: [],
    persistent: false,
  };
}


function getGuestStorageKey(id) {
  return `${GUEST_STORAGE_PREFIX}${id}`;
}


function saveGuestConversation(conversation) {
  try {
    localStorage.setItem(
      getGuestStorageKey(conversation.id),
      JSON.stringify(conversation)
    );
  } catch (error) {
    console.error(
      "Failed to save guest conversation:",
      error
    );
  }
}


function loadGuestConversation(id) {
  try {
    const raw = localStorage.getItem(
      getGuestStorageKey(id)
    );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);

  } catch (error) {

    console.error(
      "Failed to load guest conversation:",
      error
    );

    return null;
  }
}


function guestConversationExists(conversation) {
  return Boolean(
    conversation &&
    Array.isArray(conversation.messages)
  );
}


/*
|--------------------------------------------------------------------------
| CHAT PAGE
|--------------------------------------------------------------------------
*/

function ChatPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const { conversationId: rawConversationId } =
  useParams();

const conversationId =
  rawConversationId
    ? (
        rawConversationId.startsWith("guest-")
          ? rawConversationId
          : Number(rawConversationId)
      )
    : null;


  /*
  |--------------------------------------------------------------------------
  | INITIAL NAVIGATION DATA
  |--------------------------------------------------------------------------
  |
  | When the first message is sent from "/",
  | we create the conversation and navigate to:
  |
  | /chat/:conversationId
  |
  | The newly-created conversation is passed
  | through React Router state.
  |
  | autoStart tells this page:
  |
  | "The user has just sent the first message.
  | Start Ashani's response immediately."
  |
  */

  const initialConversation =
    location.state?.initialConversation || null;

  const autoStart =
    location.state?.autoStart === true;


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [conversations, setConversations] =
    useState([]);

  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  /*
   * If we already received the newly-created
   * conversation through router state, there is
   * nothing to load.
   *
   * Otherwise, load the conversation normally.
   */

  const [initializing, setInitializing] =
    useState(!initialConversation);
  
  const autoStartStartedRef =
  useRef(false);

  /*
  |--------------------------------------------------------------------------
  | USER
  |--------------------------------------------------------------------------
  */

  const user = getUser();

  const userId =
    user?.id || null;


  /*
  |--------------------------------------------------------------------------
  | GREETING
  |--------------------------------------------------------------------------
  */

  const [greeting] = useState(() => {

    return user
      ? getUserGreeting(user)
      : getGuestGreeting();

  });


  /*
  |--------------------------------------------------------------------------
  | STREAM ASSISTANT RESPONSE
  |--------------------------------------------------------------------------
  |
  | This function is used by BOTH:
  |
  | 1. The first message from the home page
  | 2. Messages inside an existing conversation
  |
  */


  const startAssistantResponse =
    useCallback(
      async ({
        conversation,
        messagesForAI,
        conversationIdToUse,
        isPersistent,
      }) => {

        try {

          /*
          |--------------------------------------------------------------------------
          | Save user message
          |--------------------------------------------------------------------------
          */

          const lastUserMessage =
            [...messagesForAI]
              .reverse()
              .find(
                (message) =>
                  message.role === "user"
              );


          if (
            isPersistent &&
            lastUserMessage
          ) {

            await saveMessage(
              conversationIdToUse,
              "user",
              lastUserMessage.content
            );
          }


          /*
          |--------------------------------------------------------------------------
          | Generate title
          |--------------------------------------------------------------------------
          */

          if (
            conversation.title ===
            "New conversation"
          ) {

            const title =
              lastUserMessage?.content
                ?.trim()
                .replace(/\s+/g, " ")
                .slice(0, 50) ||
              "New conversation";


            if (isPersistent) {

              await renameConversation(
                conversationIdToUse,
                title
              );

            }


            setConversations(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    conversationIdToUse
                      ? {
                          ...item,
                          title,
                        }
                      : item
                )
            );


            /*
            |--------------------------------------------------------------------------
            | Guest title
            |--------------------------------------------------------------------------
            */

            if (!isPersistent) {

              const guestConversation =
                loadGuestConversation(
                  conversationIdToUse
                );


              if (
                guestConversationExists(
                  guestConversation
                )
              ) {

                saveGuestConversation({
                  ...guestConversation,
                  title,
                });

              }
            }

          }


          /*
          |--------------------------------------------------------------------------
          | STREAM
          |--------------------------------------------------------------------------
          */

          const assistantResponse =
            await streamMessage(

              messagesForAI,

              (token) => {

                setConversations(
                  (previous) =>
                    previous.map(
                      (item) => {

                        if (
                          item.id !==
                          conversationIdToUse
                        ) {
                          return item;
                        }


                        const updatedMessages =
                          [
                            ...(item.messages || []),
                          ];


                        /*
                        |--------------------------------------------------------------------------
                        | Find assistant placeholder
                        |--------------------------------------------------------------------------
                        */

                        let assistantIndex =
                          updatedMessages.length - 1;


                        if (
                          updatedMessages[
                            assistantIndex
                          ]?.role !== "assistant"
                        ) {

                          updatedMessages.push({
                            role: "assistant",
                            content: "",
                          });

                          assistantIndex =
                            updatedMessages.length - 1;
                        }


                        const assistantMessage =
                          updatedMessages[
                            assistantIndex
                          ];


                        updatedMessages[
                          assistantIndex
                        ] = {

                          ...assistantMessage,

                          content:
                            (
                              assistantMessage.content ||
                              ""
                            ) + token,

                        };


                        return {

                          ...item,

                          messages:
                            updatedMessages,

                          updated_at:
                            new Date().toISOString(),

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
          | SAVE ASSISTANT RESPONSE
          |--------------------------------------------------------------------------
          */

          if (
            isPersistent &&
            assistantResponse
          ) {

            await saveMessage(
              conversationIdToUse,
              "assistant",
              assistantResponse
            );

          }


          /*
          |--------------------------------------------------------------------------
          | GUEST SAVE
          |--------------------------------------------------------------------------
          */

          if (
            !isPersistent &&
            assistantResponse
          ) {

            const latestConversation =
              loadGuestConversation(
                conversationIdToUse
              );


            const baseConversation =
              guestConversationExists(
                latestConversation
              )
                ? latestConversation
                : conversation;


            saveGuestConversation({

              ...baseConversation,

              messages: [
                ...messagesForAI,

                {
                  role: "assistant",
                  content:
                    assistantResponse,
                },
              ],

              updated_at:
                new Date().toISOString(),

            });

          }


          /*
          |--------------------------------------------------------------------------
          | Update local timestamp
          |--------------------------------------------------------------------------
          */

          setConversations(
            (previous) => {

              const updated =
                previous.map(
                  (item) =>
                    item.id ===
                    conversationIdToUse
                      ? {
                          ...item,
                          updated_at:
                            new Date().toISOString(),
                        }
                      : item
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


          return assistantResponse;


        } catch (error) {

          console.error(
            "Chat error:",
            error
          );


          /*
          |--------------------------------------------------------------------------
          | Show error inside assistant bubble
          |--------------------------------------------------------------------------
          */

          setConversations(
            (previous) =>
              previous.map(
                (item) => {

                  if (
                    item.id !==
                    conversationIdToUse
                  ) {
                    return item;
                  }


                  const updatedMessages =
                    [
                      ...(item.messages || []),
                    ];


                  const lastIndex =
                    updatedMessages.length - 1;


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

                    ...item,

                    messages:
                      updatedMessages,

                  };

                }
              )
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | INITIALIZE PAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let cancelled = false;


    async function initialize() {

      setInitializing(true);


      try {

        /*
        |--------------------------------------------------------------------------
        | NEWLY CREATED CONVERSATION
        |--------------------------------------------------------------------------
        |
        | This happens immediately after the first message
        | is sent from the home page.
        |
        */

        if (
          conversationId &&
          initialConversation
        ) {

          if (cancelled) {
            return;
          }


          setActiveConversationId(
            conversationId
          );


          setConversations([
            initialConversation,
          ]);


          /*
          |--------------------------------------------------------------------------
          | Automatically start AI
          |--------------------------------------------------------------------------
          */

          /*
|--------------------------------------------------------------------------
| We already have the conversation.
|
| Stop the page-level loading screen immediately.
|--------------------------------------------------------------------------
*/

setInitializing(false);


/*
|--------------------------------------------------------------------------
| Automatically start AI
|--------------------------------------------------------------------------
*/

if (
  autoStart &&
  !autoStartStartedRef.current &&
  initialConversation.messages?.some(
    (message) =>
      message.role === "user"
  )
) {

  /*
  |--------------------------------------------------------------------------
  | Prevent React StrictMode / effect re-runs
  | from starting the first AI response twice.
  |--------------------------------------------------------------------------
  */

  autoStartStartedRef.current = true;

  setLoading(true);


  const messagesForAI =
    initialConversation.messages
      .filter(
        (message) =>
          message.role === "user"
      );


  startAssistantResponse({

    conversation:
      initialConversation,

    messagesForAI,

    conversationIdToUse:
      conversationId,

    isPersistent:
      initialConversation.persistent === true,

  });

}


return;
        }


        /*
        |--------------------------------------------------------------------------
        | HOME PAGE
        |--------------------------------------------------------------------------
        |
        | "/"
        |
        | There is deliberately NO active conversation.
        |
        */

        if (!conversationId) {

          if (user) {

            try {

              const savedConversations =
                await getConversations();


              if (cancelled) {
                return;
              }


              setConversations(
                savedConversations.map(
                  (conversation) => ({
                    ...conversation,

                    /*
                    | Only titles are needed
                    | in the sidebar.
                    |
                    | Messages are loaded when
                    | the conversation is opened.
                    */

                    messages: [],

                    persistent: true,

                  })
                )
              );


            } catch (error) {

              console.error(
                "Failed to load conversations:",
                error
              );

              setConversations([]);

            }

          } else {

            /*
            |--------------------------------------------------------------------------
            | Guest home page
            |--------------------------------------------------------------------------
            */

            setConversations([]);

          }


          setActiveConversationId(null);

          return;
        }


        /*
        |--------------------------------------------------------------------------
        | CONVERSATION PAGE
        |--------------------------------------------------------------------------
        */

        setActiveConversationId(
          conversationId
        );


        /*
        |--------------------------------------------------------------------------
        | GUEST CONVERSATION
        |--------------------------------------------------------------------------
        */

        if (
          conversationId.startsWith(
            "guest-"
          )
        ) {

          const guestConversation =
            loadGuestConversation(
              conversationId
            );


          if (
            !guestConversationExists(
              guestConversation
            )
          ) {

            console.warn(
              "Guest conversation not found:",
              conversationId
            );


            navigate("/", {
              replace: true,
            });


            return;
          }


          if (cancelled) {
            return;
          }


          setConversations([
            guestConversation,
          ]);


          return;
        }


        /*
        |--------------------------------------------------------------------------
        | REGISTERED USER CONVERSATION
        |--------------------------------------------------------------------------
        */

        const data =
          await getConversation(
            conversationId
          );


        if (cancelled) {
          return;
        }


        const loadedMessages =
          (data.messages || []).map(
            (message) => ({
              role:
                message.role,

              content:
                message.content,
            })
          );


        const loadedConversation = {

          ...data.conversation,

          messages:
            loadedMessages,

          persistent:
            true,

        };


        setConversations([
          loadedConversation,
        ]);


      } catch (error) {

        console.error(
          "Failed to initialize page:",
          error
        );


        /*
        |--------------------------------------------------------------------------
        | Invalid conversation URL
        |--------------------------------------------------------------------------
        */

        if (conversationId) {

          navigate("/", {
            replace: true,
          });

        }

      } finally {

        if (!cancelled) {

          setInitializing(false);

        }

      }

    }


    initialize();


    return () => {

      cancelled = true;

    };

  }, [
    conversationId,
    navigate,
    userId,
    initialConversation,
    autoStart,
    startAssistantResponse,
  ]);


  /*
  |--------------------------------------------------------------------------
  | ACTIVE CONVERSATION
  |--------------------------------------------------------------------------
  */

  const activeConversation =
  conversations.find(
    (conversation) =>
      String(conversation.id) ===
      String(activeConversationId)
  );


  const messages =
    activeConversation?.messages || [];


  /*
  |--------------------------------------------------------------------------
  | NEW CHAT
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | New Chat means:
  |
  | "/" = fresh Ashani home page.
  |
  | We do NOT create a conversation here.
  |
  */

  const handleNewChat = () => {

    if (loading) {
      return;
    }


    setSidebarOpen(false);


    navigate("/");

  };


  /*
  |--------------------------------------------------------------------------
  | SELECT CONVERSATION
  |--------------------------------------------------------------------------
  */

  const handleSelectConversation =
    (id) => {

      if (loading) {
        return;
      }


      setSidebarOpen(false);


      navigate(
        `/chat/${id}`
      );

    };


  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE
  |--------------------------------------------------------------------------
  */

  const handleSend = async (
    content
  ) => {

    if (
      loading ||
      !content ||
      !content.trim()
    ) {
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | HOME PAGE → FIRST MESSAGE
    |--------------------------------------------------------------------------
    */

    if (!conversationId) {

      const userMessage = {

        role: "user",

        content:
          content.trim(),

      };

/*
|--------------------------------------------------------------------------
| REGISTERED USER
|--------------------------------------------------------------------------
*/

if (user) {

  try {

    /*
    |--------------------------------------------------------------------------
    | Create conversation in backend
    |--------------------------------------------------------------------------
    */

    const conversation =
      await createConversation();


    /*
    |--------------------------------------------------------------------------
    | Build conversation WITH first user message
    |--------------------------------------------------------------------------
    */

    const currentConversation = {

  ...conversation,

  messages: [
    userMessage,

    {
      role: "assistant",
      content: "",
    },
  ],

  persistent: true,
};


    /*
    |--------------------------------------------------------------------------
    | Put conversation into React state
    |--------------------------------------------------------------------------
    */

    setConversations([
      currentConversation,
    ]);


    setActiveConversationId(
      conversation.id
    );


    /*
    |--------------------------------------------------------------------------
    | Navigate to the actual conversation
    |--------------------------------------------------------------------------
    */

    navigate(
      `/chat/${conversation.id}`,
      {
        state: {

          initialConversation:
            currentConversation,

          autoStart: true,

        },
      }
    );


    /*
    |--------------------------------------------------------------------------
    | STOP HOME PAGE
    |--------------------------------------------------------------------------
    |
    | The new /chat/:id page now owns the AI request.
    |
    */

    return;


  } catch (error) {

    console.error(
      "Failed to create conversation:",
      error
    );

    return;

  }

}
      /*
      |--------------------------------------------------------------------------
      | GUEST USER
      |--------------------------------------------------------------------------
      */

      const conversation =
        createGuestConversation();


      const newConversation = {

        ...conversation,

        messages: [

          userMessage,

          {
            role: "assistant",
            content: "",
          },

        ],

      };


      /*
      |--------------------------------------------------------------------------
      | Save BEFORE navigation.
      |--------------------------------------------------------------------------
      */

      saveGuestConversation(
        newConversation
      );


      /*
      |--------------------------------------------------------------------------
      | Navigate to conversation
      |--------------------------------------------------------------------------
      */

      navigate(
        `/chat/${newConversation.id}`,
        {
          state: {

            initialConversation:
              newConversation,

            autoStart:
              true,

          },
        }
      );


      /*
      |--------------------------------------------------------------------------
      | Stop the home page instance.
      |--------------------------------------------------------------------------
      */

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | EXISTING CONVERSATION
    |--------------------------------------------------------------------------
    */

    const currentConversation =
      activeConversation ||
      conversations.find(
        (conversation) =>
          conversation.id ===
          conversationId
      );


    if (!currentConversation) {

      console.error(
        "No active conversation available."
      );

      return;

    }


    const userMessage = {

      role: "user",

      content:
        content.trim(),

    };


    const previousMessages =
      currentConversation.messages || [];


    const messagesForAI = [

      ...previousMessages,

      userMessage,

    ];


    const isPersistent =
      currentConversation.persistent === true;


    /*
    |--------------------------------------------------------------------------
    | Immediately show user message + assistant placeholder
    |--------------------------------------------------------------------------
    */

    const uiMessages = [

      ...messagesForAI,

      {
        role: "assistant",
        content: "",
      },

    ];


    setConversations(
      (previous) =>
        previous.map(
          (conversation) =>
            conversation.id ===
            conversationId
              ? {

                  ...conversation,

                  messages:
                    uiMessages,

                }
              : conversation
        )
    );


    setLoading(true);


    /*
    |--------------------------------------------------------------------------
    | Guest: save immediately
    |--------------------------------------------------------------------------
    */

    if (!isPersistent) {

      saveGuestConversation({

        ...currentConversation,

        messages:
          uiMessages,

      });

    }


    /*
    |--------------------------------------------------------------------------
    | Start AI
    |--------------------------------------------------------------------------
    */

    await startAssistantResponse({

      conversation: {

        ...currentConversation,

        messages:
          uiMessages,

      },

      messagesForAI,

      conversationIdToUse:
        conversationId,

      isPersistent,

    });

  };


  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */

  if (initializing) {

    return (

      <Box
        sx={{
          height: "100vh",

          display: "flex",

          alignItems: "center",

          justifyContent:
            "center",

          backgroundColor:
            "background.default",

          color:
            "text.secondary",
        }}
      >
        Loading Ashani...
      </Box>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | RENDER
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

        open={
          sidebarOpen
        }

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

          messages={
            messages
          }

          onSend={
            handleSend
          }

          loading={
            loading
          }

          greeting={
            greeting
          }

        />

      </Box>

    </Box>

  );

}


export default ChatPage;