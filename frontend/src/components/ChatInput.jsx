import { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        if (event.results[i].isFinal) {
          finalTranscript +=
            event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setMessage((previous) => {
          const separator =
            previous && !previous.endsWith(" ")
              ? " "
              : "";

          return (
            previous +
            separator +
            finalTranscript
          );
        });
      }
    };

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
    }

    onSend(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleVoice = () => {
    if (disabled) {
      return;
    }

    const recognition = recognitionRef.current;

    if (!recognition) {
      alert(
        "Voice input is not supported by this browser."
      );
      return;
    }

    if (listening) {
      recognition.stop();
      return;
    }

    recognition.start();
  };

  return (
    <Box
  sx={{
    width: "100%",
    px: { xs: 1.5, sm: 2.5 },
    backgroundColor: "transparent",
  }}
>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        sx={{
  width: "100%",
  maxWidth: 820,
  mx: "auto",

  display: "flex",
  alignItems: "center",

  minHeight: {
    xs: 58,
    sm: 64,
  },

  px: 1,
  py: 0.75,

  border: "1px solid",
  borderColor: listening
    ? "primary.main"
    : "divider",

  borderRadius: "34px",

  backgroundColor: "background.paper",

  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",

  boxShadow:
    "0 8px 35px rgba(0, 0, 0, 0.18)",

  transition:
    "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",

  "&:hover": {
    borderColor: "text.secondary",
  },

  "&:focus-within": {
    borderColor: "primary.main",

    boxShadow:
      "0 8px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.12)",

    transform: "translateY(-1px)",
  },
}}
      >
        {/* Add */}
        <Tooltip title="Add files and tools">
          <IconButton
            type="button"
            size="medium"
            disabled={disabled}
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              color: "text.secondary",
              opacity: 0.9,
              "&:hover": {
                backgroundColor: "action.hover",
                color: "text.primary",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        {/* Message */}
        <Box
          ref={textareaRef}
          component="textarea"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask something unexpected..."
          rows={1}
          sx={{
            flex: 1,
            resize: "none",

            border: "none",
            outline: "none",

            background: "transparent",

            color: "text.primary",

            fontFamily: "inherit",
            fontSize: "1rem",
            lineHeight: 1.5,

            mx: 1,
            py: 1,

            minHeight: "24px",
            maxHeight: "140px",

            "&::placeholder": {
              color: "text.secondary",
              opacity: 0.9,
            },
          }}
        />

        {/* Voice */}
        <Tooltip
          title={
            listening
              ? "Stop listening"
              : "Voice input"
          }
        >
          <IconButton
            type="button"
            size="medium"
            onClick={handleVoice}
            disabled={disabled}
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,

              color: listening
                ? "primary.main"
                : "text.secondary",

              backgroundColor: listening
                ? "action.hover"
                : "transparent",
              borderRadius: "50%",

              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            {listening ? (
              <StopIcon />
            ) : (
              <MicIcon />
            )}
          </IconButton>
        </Tooltip>

        {/* Send */}
        <Tooltip title="Send">
          <IconButton
            type="submit"
            disabled={
              !message.trim() || disabled
            }
            sx={{
  width: 42,
  height: 42,
  flexShrink: 0,

  borderRadius: "50%",

  backgroundColor:
    message.trim() && !disabled
      ? "primary.main"
      : "action.disabledBackground",

  color:
    message.trim() && !disabled
      ? "primary.contrastText"
      : "text.disabled",

  transition:
    "transform 0.15s ease, background-color 0.2s ease",

  "&:hover": {
    backgroundColor: "primary.dark",
    transform: "scale(1.04)",
  },

  "&:active": {
    transform: "scale(0.96)",
  },
}}
          >
            <ArrowUpwardIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default ChatInput;