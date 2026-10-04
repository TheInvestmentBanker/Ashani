import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Message({ role, content }) {
  const isUser = role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: "75%",
          px: 2,
          py: 1.5,
          borderRadius: 3,
          backgroundColor: isUser
            ? "primary.main"
            : "background.paper",
          color: isUser
            ? "primary.contrastText"
            : "text.primary",
          border: isUser ? 0 : 1,
          borderColor: "divider",

          "& p": {
            margin: 0,
            mb: 1.5,
            lineHeight: 1.7,
          },

          "& p:last-child": {
            mb: 0,
          },

          "& ul, & ol": {
            pl: 3,
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
            backgroundColor: "action.hover",
            px: 0.6,
            py: 0.2,
            borderRadius: 1,
          },

          "& a": {
            color: "inherit",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            cursor: "pointer",
          },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </Box>
    </Box>
  );
}

export default Message;