import { useEffect, useRef } from "react";
import {
  Box,
  Typography,
  useTheme,
} from "@mui/material";

import Message from "./Message";
import ChatInput from "./ChatInput";

import galaxyDark from "../assets/ashani-galaxy-dark.png";
import galaxyLight from "../assets/ashani-galaxy-light.png";

function Chat({
  messages,
  onSend,
  loading,
  greeting,
}) {
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  const isDarkMode =
    theme.palette.mode === "dark";

  const galaxyImage = isDarkMode
    ? galaxyDark
    : galaxyLight;

  const isHome = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <Box
      sx={{
        height: {
          xs: "100dvh",
          md: "100%",
        },

        minHeight: {
          xs: "100dvh",
          md: 0,
        },

        display: "flex",
        flexDirection: "column",

        position: "relative",

        overflow: "hidden",

        backgroundColor:
          "background.default",
      }}
    >

      {/* =====================================================
          HOME SCREEN
         ===================================================== */}

      {isHome ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,

            position: "relative",

            overflow: "hidden",

            display: "flex",
            flexDirection: "column",

            alignItems: "center",
            justifyContent: "center",

            px: {
              xs: 1.5,
              sm: 2,
            },
          }}
        >

          {/* =================================================
              GALAXY
             ================================================= */}

          <Box
            component="img"
            src={galaxyImage}
            alt=""
            aria-hidden="true"
            sx={{
              position: "absolute",

              width: {
                xs: "145%",
                sm: "110%",
                md: "700px",
                lg: "780px",
              },

              maxWidth: "none",

              left: "50%",

              top: {
                xs: "42%",
                sm: "43%",
                md: "43%",
              },

              transform:
                "translate(-50%, -50%)",

              opacity: {
                xs: isDarkMode
                  ? 0.20
                  : 0.055,

                md: isDarkMode
                  ? 0.30
                  : 0.40,
              },

              pointerEvents: "none",
              userSelect: "none",

              zIndex: 0,

              filter: isDarkMode
                ? "saturate(1.05)"
                : "contrast(1.05)",
            }}
          />

          {/* =================================================
              GREETING + INPUT
             ================================================= */}

          <Box
            sx={{
              position: "relative",

              zIndex: 2,

              width: "100%",

              maxWidth: 820,

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              transform: {
                xs: "translateY(-35px)",
                sm: "translateY(-45px)",
                md: "translateY(-65px)",
              },
            }}
          >

            {/* =================================================
                GREETING
               ================================================= */}

            <Typography
              sx={{
                fontSize: {
                  xs: "1.75rem",
                  sm: "2.4rem",
                  md: "2.8rem",
                },

                fontWeight: 400,

                letterSpacing:
                  "-0.035em",

                lineHeight: 1.2,

                textAlign: "center",

                color: "text.primary",

                px: {
                  xs: 1,
                  sm: 0,
                },

                mb: {
                  xs: 2.5,
                  sm: 3,
                  md: 4,
                },

                textShadow: isDarkMode
                  ? "0 2px 25px rgba(0,0,0,0.35)"
                  : "0 2px 20px rgba(255,255,255,0.8)",
              }}
            >
              {greeting}
            </Typography>

            {/* =================================================
                HOME CHAT INPUT
               ================================================= */}

            <Box
              sx={{
                width: "100%",
              }}
            >
              <ChatInput
                onSend={onSend}
                disabled={loading}
              />
            </Box>

          </Box>
        </Box>
      ) : (

        /* =====================================================
           NORMAL CHAT
           ===================================================== */

        <Box
          sx={{
            flex: 1,

            minHeight: 0,

            overflowY: "auto",

            px: {
              xs: 1.5,
              sm: 3,
              md: 4,
            },

            py: {
              xs: 2.5,
              sm: 3,
              md: 4,
            },

            scrollbarWidth: "thin",

            scrollbarColor:
              "rgba(255,255,255,0.18) transparent",

            "&::-webkit-scrollbar": {
              width: "6px",
            },

            "&::-webkit-scrollbar-track": {
              background:
                "transparent",
            },

            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                "rgba(255,255,255,0.18)",

              borderRadius: "999px",
            },

            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor:
                "rgba(255,255,255,0.30)",
            },
          }}
        >

          {/* =================================================
              CENTERED CONVERSATION
             ================================================= */}

          <Box
            sx={{
              width: "100%",

              maxWidth: 900,

              mx: "auto",
            }}
          >

            {messages.map(
              (message, index) => (
                <Message
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              )
            )}

            <div
              ref={messagesEndRef}
            />

          </Box>

        </Box>
      )}

      {/* =====================================================
          THINKING INDICATOR
         ===================================================== */}

      {loading && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            px: 2,

            pb: {
              xs: 0.75,
              sm: 1,
            },

            textAlign: "center",

            fontSize: {
              xs: "0.75rem",
              sm: "0.875rem",
            },
          }}
        >
          Ashani is thinking...
        </Typography>
      )}

      {/* =====================================================
          MOBILE DISCLAIMER
          Only shown during conversations
         ===================================================== */}

      {!isHome && (
        <Typography
          variant="caption"
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            textAlign: "center",

            color: "text.secondary",

            fontSize: "0.68rem",

            mb: 0.75,

            px: 2,

            opacity: 0.85,
          }}
        >
          Ashani can make mistakes.
          Check important information.
        </Typography>
      )}

      {/* =====================================================
          NORMAL CHAT INPUT
          Only appears after conversation starts
         ===================================================== */}

      {!isHome && (
        <Box
          sx={{
            width: "100%",

            pb: {
              xs: 1,
              sm: 2,
              md: 2.5,
            },
          }}
        >
          <ChatInput
            onSend={onSend}
            disabled={loading}
          />
        </Box>
      )}

    </Box>
  );
}

export default Chat;