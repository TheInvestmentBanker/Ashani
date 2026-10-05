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

function Chat({ messages, onSend, loading }) {
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  const isDarkMode = theme.palette.mode === "dark";

  const galaxyImage = isDarkMode
    ? galaxyDark
    : galaxyLight;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "background.default",
      }}
    >
      {/* =====================================================
          HOME SCREEN GALAXY
          Only visible before the first message is sent
         ===================================================== */}

      {messages.length === 0 && (
        <Box
          component="img"
          src={galaxyImage}
          alt=""
          aria-hidden="true"
          sx={{
            position: "absolute",

            width: {
              xs: "150%",
              sm: "120%",
              md: "1000px",
              lg: "1150px",
            },

            maxWidth: "none",

            left: "50%",
            top: "47%",

            transform: "translate(-50%, -50%)",

            opacity: isDarkMode ? 0.38 : 0.09,

            pointerEvents: "none",
            userSelect: "none",

            zIndex: 0,

            filter: isDarkMode
              ? "saturate(1.05)"
              : "contrast(1.05)",
          }}
        />
      )}

      {/* =====================================================
          CHAT / HOME CONTENT
         ===================================================== */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          zIndex: 1,

          overflowY: "auto",

          px: {
            xs: 2,
            md: 4,
          },

          py: messages.length === 0 ? 0 : 4,

          // Firefox
          scrollbarWidth: "thin",
          scrollbarColor:
            "rgba(255,255,255,0.18) transparent",

          // Chrome / Edge / Safari
          "&::-webkit-scrollbar": {
            width: "6px",
          },

          "&::-webkit-scrollbar-track": {
            background: "transparent",
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
        {messages.length === 0 ? (
          /* =================================================
             HOME / WELCOME SCREEN
             ================================================= */

          <Box
            sx={{
              height: "100%",
              minHeight: 400,

              display: "flex",
              flexDirection: "column",

              alignItems: "center",
              justifyContent: "center",

              textAlign: "center",

              position: "relative",
              zIndex: 2,

              pb: {
                xs: 4,
                md: 6,
              },
            }}
          >
            {/* Greeting */}

            <Typography
              sx={{
                fontSize: {
                  xs: "2rem",
                  sm: "2.5rem",
                  md: "3rem",
                },

                fontWeight: 400,

                letterSpacing: "-0.035em",

                lineHeight: 1.2,

                color: "text.primary",

                mb: {
                  xs: 3.5,
                  md: 4.5,
                },

                textShadow: isDarkMode
                  ? "0 2px 25px rgba(0,0,0,0.35)"
                  : "0 2px 20px rgba(255,255,255,0.8)",
              }}
            >
              Hi Rahul, what's on your mind?
            </Typography>
          </Box>
        ) : (
          /* =================================================
             CHAT MESSAGES
             ================================================= */

          messages.map((message, index) => (
            <Message
              key={index}
              role={message.role}
              content={message.content}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* =====================================================
          THINKING INDICATOR
         ===================================================== */}

      {loading && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            px: 2,
            pb: 1,
            textAlign: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          Ashani is thinking...
        </Typography>
      )}

      {/* =====================================================
          CHAT INPUT
         ===================================================== */}

      <Box
        sx={{
          position: "relative",
          zIndex: 3,

          width: "100%",

          pb: {
            xs: 1.5,
            md: 2.5,
          },
        }}
      >
        <ChatInput
          onSend={onSend}
          disabled={loading}
        />
      </Box>
    </Box>
  );
}

export default Chat;