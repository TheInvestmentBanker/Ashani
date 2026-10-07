import { useState } from "react";

import {
  Box,
  Typography,
  IconButton,
} from "@mui/material";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";


/* =========================================================
   CODE BLOCK
   ========================================================= */

function CodeBlock({
  inline,
  className,
  children,
  ...props
}) {
  const [copied, setCopied] = useState(false);

  const code = String(children).replace(/\n$/, "");

  /* =======================================================
     INLINE CODE
     ======================================================= */

  if (inline) {
    return (
      <Box
        component="code"
        sx={{
          backgroundColor: "action.hover",
          px: 0.6,
          py: 0.2,
          borderRadius: 1,
          fontFamily:
            '"JetBrains Mono", "Fira Code", Consolas, monospace',
          fontSize: "0.9em",
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }

  /* =======================================================
     COPY ENTIRE CODE BLOCK
     ======================================================= */

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to copy code:",
        error
      );
    }
  };

  /* =======================================================
     DETECT LANGUAGE
     ======================================================= */

  const language =
    className
      ?.replace("language-", "")
      ?.trim() || "Code";

  return (
    <Box
      sx={{
        my: 2,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor:
          "rgba(0,0,0,0.35)",
      }}
    >

      {/* =================================================
          CODE HEADER
         ================================================= */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          px: 1.5,
          py: 0.75,
          borderBottom:
            "1px solid",
          borderColor:
            "divider",
          backgroundColor:
            "rgba(255,255,255,0.04)",
        }}
      >

        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color:
              "text.secondary",
            textTransform:
              "none",
          }}
        >
          {language}
        </Typography>

        {/* ===============================================
            COPY BUTTON
           =============================================== */}

        <IconButton
          size="small"
          onClick={copyCode}
          aria-label={
            copied
              ? "Copied"
              : "Copy code"
          }
          sx={{
            color:
              "text.secondary",

            "&:hover": {
              backgroundColor:
                "action.hover",
            },
          }}
        >
          {copied ? (
            <CheckIcon
              fontSize="small"
            />
          ) : (
            <ContentCopyIcon
              fontSize="small"
            />
          )}
        </IconButton>

      </Box>

      {/* =================================================
          CODE CONTENT
         ================================================= */}

      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflowX: "auto",
          fontFamily:
            '"JetBrains Mono", "Fira Code", Consolas, monospace',
          fontSize:
            "0.9rem",
          lineHeight: 1.6,

          "& code": {
            fontFamily:
              "inherit",
            background:
              "transparent",
            padding: 0,
            fontSize:
              "inherit",
          },
        }}
      >
        <code
          className={className}
          {...props}
        >
          {code}
        </code>
      </Box>

    </Box>
  );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function Message({
  role,
  content,
  image = null,
  image_filename = null,
  webSources = [],
}) {

  const isUser =
    role === "user";


  /* =======================================================
     DOWNLOAD GENERATED IMAGE
     ======================================================= */

  const handleDownloadImage = () => {

    if (!image) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = image;

    link.download =
      image_filename ||
      "ashani-generated.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };


  return (
    <Box
      sx={{
        display: "flex",

        justifyContent:
          isUser
            ? "flex-end"
            : "flex-start",

        mb: {
          xs: 1.5,
          sm: 2,
        },

        width: "100%",
      }}
    >

      <Box
        sx={{
          maxWidth: {
            xs: "92%",
            sm: "80%",
            md: "70%",
          },

          px: {
            xs: 1.5,
            sm: 2,
          },

          py: {
            xs: 1.25,
            sm: 1.5,
          },

          borderRadius: {
            xs: 2.5,
            sm: 3,
          },

          backgroundColor:
            isUser
              ? "primary.main"
              : "background.paper",

          color:
            isUser
              ? "primary.contrastText"
              : "text.primary",

          border:
            isUser
              ? 0
              : 1,

          borderColor:
            "divider",

          wordBreak:
            "break-word",

          overflowWrap:
            "anywhere",

          "& p": {
            margin: 0,

            mb: {
              xs: 1.25,
              sm: 1.5,
            },

            lineHeight: {
              xs: 1.6,
              sm: 1.7,
            },
          },

          "& p:last-child": {
            mb: 0,
          },

          "& ul, & ol": {
            pl: {
              xs: 2.5,
              sm: 3,
            },

            mb: 1.5,
          },

          "& li": {
            mb: 0.5,
          },

          "& strong": {
            fontWeight: 700,
          },

          "& :not(pre) > code": {
            fontFamily:
              '"JetBrains Mono", "Fira Code", Consolas, monospace',

            backgroundColor:
              "action.hover",

            px: 0.6,
            py: 0.2,

            borderRadius: 1,

            fontSize:
              "0.9em",
          },

          "& a": {
            color:
              "inherit",

            textDecoration:
              "underline",

            textUnderlineOffset:
              "3px",

            textDecorationThickness:
              "1px",

            cursor:
              "pointer",

            transition:
              "opacity 0.2s ease",

            "&:hover": {
              opacity: 0.75,
            },
          },
        }}
      >

        {/* =================================================
            USER UPLOADED IMAGE
            Small ChatGPT-style thumbnail
           ================================================= */}

        {isUser && image && (
          <Box
            sx={{
              position: "relative",

              width: {
                xs: "150px",
                sm: "180px",
              },

              maxWidth: "100%",

              mb:
                content
                  ? 1.25
                  : 0,

              borderRadius: 1.75,

              overflow: "hidden",

              backgroundColor:
                "rgba(0,0,0,0.12)",

              border:
                "1px solid",

              borderColor:
                "rgba(255,255,255,0.16)",
            }}
          >

            <Box
              component="img"
              src={image}
              alt={
                image_filename ||
                "Uploaded image"
              }
              sx={{
                display: "block",

                width: "100%",

                height: "auto",

                maxHeight: "180px",

                objectFit: "contain",

                borderRadius: 1.5,
              }}
            />

          </Box>
        )}


        {/* =================================================
            MESSAGE TEXT
           ================================================= */}

        {content && (
          <ReactMarkdown
            remarkPlugins={[
              remarkGfm,
            ]}
            components={{
              code: CodeBlock,
            }}
          >
            {content}
          </ReactMarkdown>
        )}


        {/* =================================================
            ASSISTANT / GENERATED IMAGE

            Keep generated images large.
           ================================================= */}

        {!isUser && image && (
          <Box
            sx={{
              position: "relative",

              mt:
                content
                  ? 1.5
                  : 0,

              mb:
                webSources.length > 0
                  ? 1.5
                  : 0,

              overflow: "hidden",

              borderRadius: 2,

              border: "1px solid",

              borderColor:
                "divider",

              backgroundColor:
                "background.default",
            }}
          >

            <Box
              component="img"
              src={image}
              alt="Generated by Ashani"
              sx={{
                display: "block",

                width: "100%",

                maxWidth: "1536px",

                height: "auto",

                maxHeight: "80vh",

                objectFit: "contain",
              }}
            />

            {/* ===========================================
                DOWNLOAD GENERATED IMAGE
               =========================================== */}

            <IconButton
              onClick={
                handleDownloadImage
              }
              aria-label="Download image"
              title="Download image"
              size="small"
              sx={{
                position: "absolute",

                right: 10,

                bottom: 10,

                backgroundColor:
                  "rgba(0, 0, 0, 0.65)",

                color: "#fff",

                "&:hover": {
                  backgroundColor:
                    "rgba(0, 0, 0, 0.8)",
                },
              }}
            >
              <DownloadIcon
                fontSize="small"
              />
            </IconButton>

          </Box>
        )}


        {/* =================================================
            WEB SOURCES
           ================================================= */}

        {webSources.length > 0 && (
          <Box
            sx={{
              mt: 2,

              pt: 1.5,

              borderTop:
                "1px solid",

              borderColor:
                "divider",
            }}
          >

            <Typography
              variant="caption"
              sx={{
                display: "block",

                fontWeight: 600,

                mb: 1,

                color:
                  "text.secondary",
              }}
            >
              Web sources
            </Typography>


            {webSources.map(
              (source, index) => (
                <Box
                  key={`${source.url}-${index}`}
                  component="a"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "block",

                    textDecoration:
                      "none",

                    color: "inherit",

                    mb:
                      index ===
                      webSources.length - 1
                        ? 0
                        : 1,

                    p: 1,

                    borderRadius: 1.5,

                    backgroundColor:
                      "action.hover",

                    transition:
                      "background-color 0.2s ease",

                    "&:hover": {
                      backgroundColor:
                        "action.selected",
                    },
                  }}
                >

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,

                      lineHeight: 1.35,
                    }}
                  >
                    {source.title ||
                      "Web source"}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",

                      mt: 0.25,

                      color:
                        "text.secondary",

                      overflow:
                        "hidden",

                      textOverflow:
                        "ellipsis",

                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {source.url}
                  </Typography>

                </Box>
              )
            )}

          </Box>
        )}

      </Box>

    </Box>
  );
}


export default Message;