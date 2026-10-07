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
import CloseIcon from "@mui/icons-material/Close";


function ChatInput({
  onSend,
  disabled = false,
}) {

  // ============================================================
  // STATE
  // ============================================================

  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState(null);

  const [imageMode, setImageMode] = useState(false);

  const [imageResolution, setImageResolution] = useState("SD");

  const [resolutionAnchor, setResolutionAnchor] = useState(null);

  const [thinkMode, setThinkMode] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);


  // ============================================================
  // REFS
  // ============================================================

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);


  // ============================================================
  // IMAGE PREVIEW
  // ============================================================




  // ============================================================
  // AUTO RESIZE TEXTAREA
  // ============================================================

  useEffect(() => {

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const maxHeight = 150;

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      maxHeight
    )}px`;

  }, [message]);


  // ============================================================
  // VOICE RECOGNITION
  // ============================================================

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


  // ============================================================
  // SUBMIT
  // ============================================================

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


    // ----------------------------------------------------------
    // Convert selected image into Base64 data URL
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // Send message + generation options
    // ----------------------------------------------------------

    onSend(trimmedMessage, {

      think: thinkMode,

      mode: imageMode
        ? "image"
        : "chat",

      image: imageData,

      resolution: imageResolution,

    });


    // ----------------------------------------------------------
    // Reset message + image
    // ----------------------------------------------------------

    setMessage("");

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);

  };


  // ============================================================
  // KEYBOARD
  // ============================================================

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSubmit();

    }

  };


  // ============================================================
  // VOICE
  // ============================================================

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


  // ============================================================
  // ADD MENU
  // ============================================================

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


  // ============================================================
  // IMAGE GENERATION MODE
  // ============================================================

  const handleImageModeToggle = () => {

    if (disabled) {
      return;
    }

    setImageMode(
      (previous) => !previous
    );

  };


  // ============================================================
  // IMAGE UPLOAD
  // ============================================================

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


    // ----------------------------------------------------------
    // Validate image
    // ----------------------------------------------------------

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


    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);


    // ----------------------------------------------------------
    // Uploading an image does NOT
    // automatically enable Image mode.
    // ----------------------------------------------------------

    // Reset input so the same image
    // can be selected again later.

    event.target.value = "";

  };


  // ============================================================
  // REMOVE IMAGE
  // ============================================================

  const handleRemoveImage = () => {

  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }

  setSelectedImage(null);
  setImagePreview(null);
};


  // ============================================================
  // THINK MODE
  // ============================================================

  const handleThinkToggle = () => {

    if (disabled) {
      return;
    }

    setThinkMode(
      (previous) => !previous
    );

  };


  // ============================================================
  // RENDER
  // ============================================================

  const hasContent =
    Boolean(
      message.trim() ||
      selectedImage
    );


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

          display: "flex",

          flexDirection: "column",

          border: "1px solid",

          borderColor:
            listening
              ? "primary.main"
              : "divider",

          borderRadius: {
            xs: "24px",
            sm: "28px",
          },

          backgroundColor:
            "background.paper",

          backdropFilter:
            "blur(18px)",

          WebkitBackdropFilter:
            "blur(18px)",

          boxShadow: {
            xs:
              "0 8px 30px rgba(0,0,0,0.22)",

            sm:
              "0 8px 35px rgba(0,0,0,0.18)",
          },

          transition:
            "border-color 0.2s ease, box-shadow 0.2s ease",

          "&:hover": {

            borderColor:
              "text.secondary",

          },

          "&:focus-within": {

            borderColor:
              "primary.main",

            boxShadow:
              "0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(139,92,246,0.12)",

          },

        }}
      >

        {/* =====================================================
            IMAGE PREVIEW
            ===================================================== */}

        {selectedImage && imagePreview && (

          <Box
            sx={{
              px: 1.5,
              pt: 1.5,
              pb: 0.5,

              display: "flex",

              alignItems: "flex-start",

            }}
          >

            <Box
              sx={{
                position: "relative",

                width: {
                  xs: 72,
                  sm: 84,
                },

                height: {
                  xs: 72,
                  sm: 84,
                },

                borderRadius: "14px",

                overflow: "hidden",

                border: "1px solid",

                borderColor:
                  "divider",

                backgroundColor:
                  "action.hover",

                boxShadow:
                  "0 4px 14px rgba(0,0,0,0.18)",
              }}
            >

              <Box
                component="img"

                src={imagePreview}

                alt="Uploaded image"

                sx={{
                  width: "100%",

                  height: "100%",

                  objectFit: "cover",

                  display: "block",
                }}
              />


              {/* REMOVE IMAGE */}

              <IconButton
                type="button"

                onClick={
                  handleRemoveImage
                }

                disabled={disabled}

                size="small"

                sx={{
                  position: "absolute",

                  top: 5,

                  right: 5,

                  width: 24,

                  height: 24,

                  p: 0,

                  color: "#fff",

                  backgroundColor:
                    "rgba(0,0,0,0.65)",

                  backdropFilter:
                    "blur(6px)",

                  "&:hover": {
                    backgroundColor:
                      "rgba(0,0,0,0.85)",
                  },
                }}
              >

                <CloseIcon
                  sx={{
                    fontSize: 15,
                  }}
                />

              </IconButton>

            </Box>

          </Box>

        )}


        {/* =====================================================
            MESSAGE AREA
            ===================================================== */}

        <Box
          sx={{
            px: {
              xs: 1.5,
              sm: 2,
            },

            pt: selectedImage
              ? 0.5
              : 1.25,

            pb: 0.5,
          }}
        >

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
              display: "block",

              width: "100%",

              resize: "none",

              overflowY: "auto",

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

              lineHeight: 1.55,

              minHeight: "28px",

              maxHeight: "150px",

              py: 0.5,

              "&::placeholder": {

                color:
                  "text.secondary",

                opacity: 0.85,

              },

              "&::-webkit-scrollbar": {
                width: "5px",
              },

              "&::-webkit-scrollbar-thumb": {

                backgroundColor:
                  "rgba(128,128,128,0.35)",

                borderRadius: "10px",

              },
            }}
          />

        </Box>


        {/* =====================================================
            BOTTOM TOOLBAR
            ===================================================== */}

        <Box
          sx={{

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: 0.5,

            px: {
              xs: 1,
              sm: 1.25,
            },

            pb: {
              xs: 0.9,
              sm: 1,
            },

          }}
        >


          {/* LEFT CONTROLS */}

          <Box
            sx={{
              display: "flex",

              alignItems: "center",

              gap: {
                xs: 0.25,
                sm: 0.5,
              },

              minWidth: 0,
            }}
          >


            {/* ADD */}

            <Tooltip
              title="Add files and tools"
            >

              <IconButton

                type="button"

                size="medium"

                onClick={
                  handleAddClick
                }

                disabled={disabled}

                sx={{
                  width: 40,

                  height: 40,

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


            {/* ADD MENU */}

            <Menu

              anchorEl={menuAnchor}

              open={
                Boolean(menuAnchor)
              }

              onClose={
                handleMenuClose
              }

              anchorOrigin={{
                vertical: "top",
                horizontal: "left",
              }}

              transformOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}

              slotProps={{
                paper: {
                  sx: {

                    mt: -1,

                    minWidth: 190,

                    borderRadius: "14px",

                    backgroundColor:
                      "background.paper",

                    backgroundImage:
                      "none",

                    border: "1px solid",

                    borderColor:
                      "divider",

                    boxShadow:
                      "0 12px 35px rgba(0,0,0,0.35)",

                    backdropFilter:
                      "blur(20px)",

                    overflow: "hidden",

                  },
                },
              }}
            >

              <MenuItem
                onClick={
                  handleUploadImage
                }

                sx={{
                  borderRadius:
                    "10px",

                  mx: 0.5,

                  my: 0.25,

                  py: 1,

                  "&:hover": {
                    backgroundColor:
                      "action.hover",
                  },
                }}
              >

                <ListItemIcon>

                  <ImageOutlinedIcon
                    fontSize="small"
                  />

                </ListItemIcon>

                <Typography
                  variant="body2"
                >
                  Upload image
                </Typography>

              </MenuItem>

            </Menu>


            {/* HIDDEN FILE INPUT */}

            <input

              ref={fileInputRef}

              type="file"

              accept="image/*"

              hidden

              onChange={
                handleImageChange
              }

            />


            {/* IMAGE GENERATION */}

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

                  width: 40,

                  height: 40,

                  color:
                    imageMode
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


            {/* IMAGE RESOLUTION */}

            {imageMode && (

              <>

                <Tooltip
                  title="Image resolution"
                >

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

                      minWidth: 44,

                      height: 34,

                      px: 1,

                      borderRadius:
                        "17px",

                      color:
                        "text.secondary",

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

                  anchorEl={
                    resolutionAnchor
                  }

                  open={
                    Boolean(
                      resolutionAnchor
                    )
                  }

                  onClose={() =>
                    setResolutionAnchor(
                      null
                    )
                  }

                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}

                  transformOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}

                  slotProps={{
                    paper: {
                      sx: {

                        mt: -1,

                        borderRadius:
                          "14px",

                        backgroundColor:
                          "background.paper",

                        backgroundImage:
                          "none",

                        border: "1px solid",

                        borderColor:
                          "divider",

                        boxShadow:
                          "0 12px 35px rgba(0,0,0,0.35)",

                      },
                    },
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
                  ].map(
                    (option) => (

                      <MenuItem

                        key={
                          option.resolution
                        }

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

                        sx={{
                          borderRadius:
                            "10px",

                          mx: 0.5,

                          my: 0.25,

                          "&:hover": {

                            backgroundColor:
                              "action.hover",

                          },
                        }}
                      >

                        <Typography
                          variant="body2"
                        >
                          {option.label}
                        </Typography>

                      </MenuItem>

                    )
                  )}

                </Menu>

              </>

            )}


            {/* THINK */}

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

                  width: 40,

                  height: 40,

                  color:
                    thinkMode
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

          </Box>


          {/* RIGHT CONTROLS */}

          <Box
            sx={{
              display: "flex",

              alignItems: "center",

              gap: 0.5,
            }}
          >


            {/* VOICE */}

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

                  width: 40,

                  height: 40,

                  color:
                    listening
                      ? "primary.main"
                      : "text.secondary",

                  backgroundColor:
                    listening
                      ? "action.hover"
                      : "transparent",

                  borderRadius:
                    "50%",

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


            {/* SEND */}

            <Tooltip title="Send">

              <IconButton

                type="submit"

                disabled={
                  !hasContent ||
                  disabled
                }

                sx={{

                  width: 40,

                  height: 40,

                  borderRadius:
                    "50%",

                  backgroundColor:
                    hasContent &&
                    !disabled

                      ? "primary.main"

                      : "action.disabledBackground",

                  color:
                    hasContent &&
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

      </Box>

    </Box>

  );

}


export default ChatInput;