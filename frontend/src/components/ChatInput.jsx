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
        px: { xs: 1.5, sm: 2.5 },
        pb: { xs: 1.5, sm: 2.5 },
        pt: 1.5,
        backgroundColor: "background.default",
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
          maxWidth: 900,
          mx: "auto",

          display: "flex",
          alignItems: "center",

          minHeight: 60,

          px: 1,
          py: 0.75,

          border: 1,
          borderColor: listening
            ? "primary.main"
            : "divider",

          borderRadius: "32px",

          backgroundColor: "background.paper",

          transition:
            "border-color 0.2s ease, box-shadow 0.2s ease",

          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow:
              "0 0 0 1px rgba(139, 92, 246, 0.15)",
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
              opacity: 1,
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

              backgroundColor:
                message.trim() && !disabled
                  ? "primary.main"
                  : "action.disabledBackground",

              color:
                message.trim() && !disabled
                  ? "primary.contrastText"
                  : "text.disabled",

              "&:hover": {
                backgroundColor: "primary.dark",
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