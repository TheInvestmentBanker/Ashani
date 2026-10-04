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

function Sidebar({ open, onClose }) {
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
          backgroundColor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ p: 2, mt: 8 }}>
        <Button
          fullWidth
          variant="contained"
          sx={{
            py: 1.2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          + New Chat
        </Button>

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
          <ListItemButton>
            <ListItemText
              primary="Welcome to Ashani"
              primaryTypographyProps={{
                noWrap: true,
              }}
            />
          </ListItemButton>

          <ListItemButton>
            <ListItemText
              primary="Test conversation"
              primaryTypographyProps={{
                noWrap: true,
              }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;