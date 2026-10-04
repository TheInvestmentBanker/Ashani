import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

import Message from "./Message";
import ChatInput from "./ChatInput";

function Chat({ messages, onSend, loading }) {
  const messagesEndRef = useRef(null);

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
      }}
    >
      <Box
  sx={{
    flex: 1,
    overflowY: "auto",
    px: { xs: 2, md: 4 },
    py: 4,

    // Firefox
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,255,255,0.18) transparent",

    // Chrome / Edge / Safari
    "&::-webkit-scrollbar": {
      width: "6px",
    },

    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },

    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: "999px",
    },

    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(255,255,255,0.30)",
    },
  }}
>
        {messages.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Aritraa
            </Typography>

            <Typography color="text.secondary">
              What can I help you with?
            </Typography>
          </Box>
        ) : (
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

      {loading && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            px: 2,
            pb: 1,
            textAlign: "center",
          }}
        >
          Aritraa is thinking...
        </Typography>
      )}

      <ChatInput
        onSend={onSend}
        disabled={loading}
      />
    </Box>
  );
}

export default Chat;