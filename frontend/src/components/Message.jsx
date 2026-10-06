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


function CodeBlock({
  inline,
  className,
  children,
  ...props
}) {
  const [copied, setCopied] = useState(false);

  const code = String(children).replace(/\n$/, "");

  /*
   * Inline code
   *
   * Example:
   * Use `npm install`
   */
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


  /*
   * Copy entire code block
   */
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


  /*
   * Detect language
   *
   * language-python
   * language-javascript
   * language-js
   * etc.
   */
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

      {/* =========================
          CODE HEADER
         ========================= */}

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


        {/* =========================
            COPY BUTTON
           ========================= */}

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


      {/* =========================
          CODE CONTENT
         ========================= */}

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



function Message({
  role,
  content,
}) {
  const isUser =
    role === "user";


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

          /* =========================
             MARKDOWN STYLING
             ========================= */

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

          /*
           * Inline code
           *
           * IMPORTANT:
           * CodeBlock handles fenced code.
           * This handles only inline `code`.
           */
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

          /*
           * Links
           */
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

      </Box>

    </Box>
  );
}


export default Message;