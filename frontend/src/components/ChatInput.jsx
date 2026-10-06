import { useEffect, useRef, useState } from "react";

import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

function ChatInput({
  onSend,
  disabled = false,
}) {
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState(null);

  const [imageMode, setImageMode] =
  useState(false);

const [imageResolution, setImageResolution] =
  useState("SD");

const [resolutionAnchor, setResolutionAnchor] =
  useState(null);

const [thinkMode, setThinkMode] =
  useState(false);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const recognitionRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | VOICE RECOGNITION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition =
      new SpeechRecognition();

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
            previous &&
            !previous.endsWith(" ")
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

    recognitionRef.current =
      recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async () => {
    const trimmedMessage =
      message.trim();

    if (
      (!trimmedMessage &&
        !selectedImage) ||
      disabled
    ) {
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
    }

    let imageData = null;

    /*
     * Convert selected image into a
     * base64 data URL.
     */

    if (selectedImage) {
      try {
        imageData =
          await new Promise(
            (resolve, reject) => {
              const reader =
                new FileReader();

              reader.onload = () => {
                resolve(
                  reader.result
                );
              };

              reader.onerror = () => {
                reject(
                  new Error(
                    "Failed to read the selected image."
                  )
                );
              };

              reader.readAsDataURL(
                selectedImage
              );
            }
          );
      } catch (error) {
        console.error(
          "Image reading failed:",
          error
        );

        return;
      }
    }

    /*
     * Send message + generation options
     * to ChatPage.
     *
     * imageMode = true
     *   -> Text-to-Image
     *   -> Image-to-Image if image exists
     *
     * imageMode = false
     *   -> Normal chat / image attachment
     */

    onSend(trimmedMessage, {
  think: thinkMode,
  mode: imageMode
    ? "image"
    : "chat",
  image: imageData,
  resolution: imageResolution,
});

    /*
     * Reset message and uploaded image.
     *
     * Image mode itself remains selected,
     * just like Think mode.
     */

    setMessage("");
    setSelectedImage(null);
  };

  /*
  |--------------------------------------------------------------------------
  | KEYBOARD
  |--------------------------------------------------------------------------
  */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VOICE
  |--------------------------------------------------------------------------
  */

  const handleVoice = () => {
    if (disabled) {
      return;
    }

    const recognition =
      recognitionRef.current;

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

  /*
  |--------------------------------------------------------------------------
  | ADD MENU
  |--------------------------------------------------------------------------
  */

  const handleAddClick = (event) => {
    if (disabled) {
      return;
    }

    setMenuAnchor(
      event.currentTarget
    );
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE GENERATION MODE
  |--------------------------------------------------------------------------
  */

  const handleImageModeToggle = () => {
    if (disabled) {
      return;
    }

    setImageMode(
      (previous) => !previous
    );
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleUploadImage = () => {
    setMenuAnchor(null);

    fileInputRef.current?.click();
  };

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Make sure the selected file
     * is actually an image.
     */

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      console.error(
        "Selected file is not an image."
      );

      event.target.value = "";

      return;
    }

    setSelectedImage(file);

    /*
     * IMPORTANT:
     * Uploading an image does NOT
     * automatically enable Image mode.
     *
     * This allows normal image
     * attachments independently.
     */

    /*
     * Reset input value so the same
     * image can be selected again later.
     */

    event.target.value = "";
  };

  /*
  |--------------------------------------------------------------------------
  | THINK MODE
  |--------------------------------------------------------------------------
  */

  const handleThinkToggle = () => {
    if (disabled) {
      return;
    }

    setThinkMode(
      (previous) => !previous
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Box
      sx={{
        width: "100%",
        px: {
          xs: 1,
          sm: 2.5,
        },
        backgroundColor:
          "transparent",
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

          display: "grid",

          /*
           * Desktop:
           *
           * + | image | think | textarea | mic | send
           *
           * Mobile:
           *
           * textarea
           * + | image | think | mic | send
           */

          gridTemplateColumns: {
  xs: "auto auto auto auto auto auto",
  sm: "auto auto auto auto minmax(0, 1fr) auto auto",
},

          gridTemplateRows: {
            xs: "auto auto",
            sm: "auto",
          },

          alignItems: "center",

          minHeight: {
            xs: 88,
            sm: 64,
          },

          px: {
            xs: 1,
            sm: 1,
          },

          py: {
            xs: 0.75,
            sm: 0.75,
          },

          border: "1px solid",

          borderColor: listening
            ? "primary.main"
            : "divider",

          borderRadius: {
            xs: "24px",
            sm: "34px",
          },

          backgroundColor:
            "background.paper",

          backdropFilter:
            "blur(18px)",

          WebkitBackdropFilter:
            "blur(18px)",

          boxShadow: {
            xs: "0 8px 30px rgba(0, 0, 0, 0.22)",
            sm: "0 8px 35px rgba(0, 0, 0, 0.18)",
          },

          transition:
            "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",

          "&:hover": {
            borderColor:
              "text.secondary",
          },

          "&:focus-within": {
            borderColor:
              "primary.main",

            boxShadow: {
              xs: "0 8px 32px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(139, 92, 246, 0.12)",

              sm: "0 8px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.12)",
            },

            transform:
              "translateY(-1px)",
          },
        }}
      >
        {/* =================================================
            MESSAGE
           ================================================= */}

        <Box
          ref={textareaRef}
          component="textarea"
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask something unexpected..."
          rows={1}
          sx={{
            /*
             * Mobile:
             * full-width first row
             *
             * Desktop:
             * fourth grid column
             */

            gridColumn: {
  xs: "1 / -1",
  sm: "5",
},

            gridRow: {
              xs: "1",
              sm: "1",
            },

            width: "100%",

            resize: "none",

            border: "none",

            outline: "none",

            background:
              "transparent",

            color:
              "text.primary",

            fontFamily:
              "inherit",

            fontSize: {
              xs: "0.95rem",
              sm: "1rem",
            },

            lineHeight: 1.5,

            mx: {
              xs: 0,
              sm: 1,
            },

            py: {
              xs: 0.5,
              sm: 1,
            },

            px: {
              xs: 0.5,
              sm: 0,
            },

            minHeight: {
              xs: "32px",
              sm: "24px",
            },

            maxHeight: "140px",

            "&::placeholder": {
              color:
                "text.secondary",

              opacity: 0.9,
            },
          }}
        />

        {/* =================================================
            ADD / UPLOAD
           ================================================= */}

        <Tooltip title="Add files and tools">
          <IconButton
            type="button"
            size="medium"
            onClick={handleAddClick}
            disabled={disabled}
            sx={{
              gridColumn: {
                xs: "1",
                sm: "1",
              },

              gridRow: {
                xs: "2",
                sm: "1",
              },

              justifySelf: {
                xs: "start",
                sm: "center",
              },

              width: {
                xs: 38,
                sm: 42,
              },

              height: {
                xs: 38,
                sm: 42,
              },

              flexShrink: 0,

              color:
                "text.secondary",

              "&:hover": {
                backgroundColor:
                  "action.hover",

                color:
                  "text.primary",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <MenuItem
            onClick={
              handleUploadImage
            }
          >
            <ListItemIcon>
              <ImageOutlinedIcon
                fontSize="small"
              />
            </ListItemIcon>

            <Typography variant="body2">
              Upload image
            </Typography>
          </MenuItem>
        </Menu>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={
            handleImageChange
          }
        />

        {/* =================================================
            IMAGE GENERATION
           ================================================= */}

        <Tooltip
          title={
            imageMode
              ? "Image generation enabled"
              : "Generate an image"
          }
        >
          <IconButton
            type="button"
            size="medium"
            onClick={
              handleImageModeToggle
            }
            disabled={disabled}
            sx={{
              gridColumn: {
  xs: "2",
  sm: "2",
},

              gridRow: {
                xs: "2",
                sm: "1",
              },

              width: {
                xs: 38,
                sm: 42,
              },

              height: {
                xs: 38,
                sm: 42,
              },

              flexShrink: 0,

              borderRadius: "50%",

              color: imageMode
                ? "primary.main"
                : "text.secondary",

              backgroundColor:
                imageMode
                  ? "action.selected"
                  : "transparent",

              "&:hover": {
                backgroundColor:
                  "action.hover",
              },
            }}
          >
            <ImageOutlinedIcon />
          </IconButton>
        </Tooltip>

        {/* =================================================
    IMAGE RESOLUTION
   ================================================= */}

{imageMode && (
  <>
    <Tooltip title="Image resolution">
      <IconButton
        type="button"
        size="small"
        onClick={(event) =>
          setResolutionAnchor(
            event.currentTarget
          )
        }
        disabled={disabled}
        sx={{
          gridColumn: {
            xs: "3",
            sm: "3",
          },

          gridRow: {
            xs: "2",
            sm: "1",
          },

          minWidth: {
            xs: 42,
            sm: 48,
          },

          height: {
            xs: 34,
            sm: 38,
          },

          px: 1,

          borderRadius: "18px",

          color:
            "text.secondary",

          backgroundColor:
            "transparent",

          "&:hover": {
            backgroundColor:
              "action.hover",
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
          }}
        >
          {imageResolution}
        </Typography>
      </IconButton>
    </Tooltip>

    <Menu
      anchorEl={resolutionAnchor}
      open={Boolean(resolutionAnchor)}
      onClose={() =>
        setResolutionAnchor(null)
      }
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
    >
      {[
  {
    label: "HD",
    resolution: "HD",
  },
  {
    label: "SD",
    resolution: "SD",
  },
  {
    label: "LD",
    resolution: "LD",
  },
].map((option) => (
        <MenuItem
          key={option.resolution}
          selected={
            imageResolution ===
            option.resolution
          }
          onClick={() => {
            setImageResolution(
              option.resolution
            );

            setResolutionAnchor(
              null
            );
          }}
        >
          <Typography variant="body2">
            {option.label}
          </Typography>
        </MenuItem>
      ))}
    </Menu>
  </>
)}

{/* =================================================
    THINK
   ================================================= */}

        <Tooltip
          title={
            thinkMode
              ? "Heavy reasoning enabled"
              : "Ask Ashani to think deeply"
          }
        >
          <IconButton
            type="button"
            size="medium"
            onClick={
              handleThinkToggle
            }
            disabled={disabled}
            sx={{
              gridColumn: {
  xs: "4",
  sm: "4",
},

              gridRow: {
                xs: "2",
                sm: "1",
              },

              width: {
                xs: 38,
                sm: 42,
              },

              height: {
                xs: 38,
                sm: 42,
              },

              flexShrink: 0,

              borderRadius: "50%",

              color: thinkMode
                ? "primary.main"
                : "text.secondary",

              backgroundColor:
                thinkMode
                  ? "action.selected"
                  : "transparent",

              "&:hover": {
                backgroundColor:
                  "action.hover",
              },
            }}
          >
            <PsychologyOutlinedIcon />
          </IconButton>
        </Tooltip>

        {/* =================================================
            VOICE
           ================================================= */}

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
              gridColumn: {
  xs: "5",
  sm: "6",
},

              gridRow: {
                xs: "2",
                sm: "1",
              },

              width: {
                xs: 38,
                sm: 42,
              },

              height: {
                xs: 38,
                sm: 42,
              },

              flexShrink: 0,

              color: listening
                ? "primary.main"
                : "text.secondary",

              backgroundColor:
                listening
                  ? "action.hover"
                  : "transparent",

              borderRadius: "50%",

              "&:hover": {
                backgroundColor:
                  "action.hover",
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

        {/* =================================================
            SEND
           ================================================= */}

        <Tooltip title="Send">
          <IconButton
            type="submit"
            disabled={
              (!message.trim() &&
                !selectedImage) ||
              disabled
            }
            sx={{
              gridColumn: {
  xs: "6",
  sm: "7",
},
              gridRow: {
                xs: "2",
                sm: "1",
              },

              width: {
                xs: 38,
                sm: 42,
              },

              height: {
                xs: 38,
                sm: 42,
              },

              flexShrink: 0,

              borderRadius: "50%",

              backgroundColor:
                (message.trim() ||
                  selectedImage) &&
                !disabled
                  ? "primary.main"
                  : "action.disabledBackground",

              color:
                (message.trim() ||
                  selectedImage) &&
                !disabled
                  ? "primary.contrastText"
                  : "text.disabled",

              transition:
                "transform 0.15s ease, background-color 0.2s ease",

              "&:hover": {
                backgroundColor:
                  "primary.dark",

                transform:
                  "scale(1.04)",
              },

              "&:active": {
                transform:
                  "scale(0.96)",
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