import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";


function Sidebar({
  open,
  onClose,
  conversations = [],
  activeConversationId,
  onNewChat,
  onSelectConversation,
}) {

  return (

    <Drawer

      variant="temporary"

      open={open}

      onClose={onClose}

      ModalProps={{
        keepMounted: true,
      }}

      sx={{

        "& .MuiDrawer-paper": {

          width: 280,

          boxSizing: "border-box",

          backgroundColor:
            "background.paper",

          borderRight: 1,

          borderColor:
            "divider",

        },

      }}

    >

      <Box
        sx={{
          p: 2,
          mt: 8,
        }}
      >

        {/* =====================================================
            NEW CHAT
        ====================================================== */}

        <Button

          fullWidth

          variant="contained"

          onClick={onNewChat}

          sx={{

            py: 1.2,

            textTransform: "none",

            fontWeight: 600,

          }}

        >

          + New Chat

        </Button>


        {/* =====================================================
            RECENT CHATS
        ====================================================== */}

        <Typography

          variant="caption"

          color="text.secondary"

          sx={{

            display: "block",

            mt: 3,

            mb: 1,

            px: 1,

          }}

        >

          Recent Chats

        </Typography>


        <Divider />


        <List>

          {conversations.length === 0 ? (

            <Typography

              variant="body2"

              color="text.secondary"

              sx={{

                px: 1,

                py: 2,

                textAlign: "center",

              }}

            >

              No conversations yet.

            </Typography>

          ) : (

            conversations.map(
              (conversation) => (

                <ListItemButton

                  key={
                    conversation.id
                  }

                  selected={
                    conversation.id ===
                    activeConversationId
                  }

                  onClick={() =>
                    onSelectConversation?.(
                      conversation.id
                    )
                  }

                  sx={{

                    borderRadius: 2,

                    mb: 0.5,

                  }}

                >

                  <ListItemText

                    primary={
                      conversation.title ||
                      "New conversation"
                    }

                    primaryTypographyProps={{
                      noWrap: true,
                    }}

                  />

                </ListItemButton>

              )
            )

          )}

        </List>

      </Box>

    </Drawer>

  );

}


export default Sidebar;