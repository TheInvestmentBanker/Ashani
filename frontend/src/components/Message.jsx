import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Message({ role, content }) {
  const isUser = role === "user";

  return (
    <Box
      sx={{
        display: "flex",

        justifyContent: isUser
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

          backgroundColor: isUser
            ? "primary.main"
            : "background.paper",

          color: isUser
            ? "primary.contrastText"
            : "text.primary",

          border: isUser ? 0 : 1,

          borderColor: "divider",

          wordBreak: "break-word",

          overflowWrap: "anywhere",

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

          "& code": {
            fontFamily: "monospace",

            backgroundColor:
              "action.hover",

            px: 0.6,
            py: 0.2,

            borderRadius: 1,

            fontSize: "0.9em",
          },

          /*
           * Links
           *
           * Ashani uses subtle underlined links
           * instead of the default bright browser blue.
           */
          "& a": {
            color: "inherit",

            textDecoration:
              "underline",

            textUnderlineOffset: "3px",

            textDecorationThickness:
              "1px",

            cursor: "pointer",

            transition:
              "opacity 0.2s ease",

            "&:hover": {
              opacity: 0.75,
            },
          },
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </Box>
    </Box>
  );
}

export default Message;