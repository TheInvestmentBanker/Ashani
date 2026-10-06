import { useEffect, useState } from "react";

import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { getUser, logout } from "../services/auth";
import { getUsage } from "../services/api";

import { useThemeMode } from "../theme/ThemeModeContext";

function Header({ onMenuClick }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] =
    useState(false);

  const { mode, toggleTheme } =
    useThemeMode();

  const user = getUser();
  const userId = user?.id;

  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (!menuOpen || !user) {
      return;
    }

    async function loadUsage() {
      try {
        setUsageLoading(true);

        const data = await getUsage();

        setUsage(data);
      } catch (error) {
        console.error(
          "Failed to load usage:",
          error
        );
      } finally {
        setUsageLoading(false);
      }
    }

    loadUsage();
  }, [menuOpen, userId]);

  const handleAccountClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    window.location.href = "/";
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  const usagePercent =
    usage && usage.limit > 0
      ? Math.min(
          (usage.used / usage.limit) * 100,
          100
        )
      : 0;

  const formatNumber = (number) =>
    new Intl.NumberFormat().format(number);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor:
          "background.default",

        backdropFilter:
          "blur(16px)",

        WebkitBackdropFilter:
          "blur(16px)",

        borderBottom: 1,
        borderColor: "divider",

        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          minHeight: {
            xs: "56px !important",
            sm: "64px !important",
          },

          px: {
            xs: 0.75,
            sm: 2.5,
          },
        }}
      >

        {/* =================================================
            MENU
           ================================================= */}

        <IconButton
          color="inherit"
          onClick={onMenuClick}
          aria-label="Open menu"
          sx={{
            mr: {
              xs: 0.5,
              sm: 1,
            },

            color: "text.primary",

            width: {
              xs: 40,
              sm: 44,
            },

            height: {
              xs: 40,
              sm: 44,
            },
          }}
        >
          <MenuIcon />
        </IconButton>


        {/* =================================================
            ASHANI BRAND
           ================================================= */}

        <Typography
          sx={{
            fontWeight: 700,
            fontFamily: 'Garet' & 'sans-serif',
            fontSize: {
              xs: "1.05rem",
              sm: "1.25rem",
            },

            color: "text.primary",

            letterSpacing:
              "-0.025em",

            lineHeight: 1,
          }}
        >
          Ashani
        </Typography>


        {/* =================================================
            FLEXIBLE SPACE
           ================================================= */}

        <Box
          sx={{
            flexGrow: 1,
          }}
        />


        {/* =================================================
            THEME TOGGLE
           ================================================= */}

        <IconButton
          onClick={toggleTheme}
          aria-label={
            mode === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            mode === "dark"
              ? "Light mode"
              : "Dark mode"
          }
          sx={{
            width: {
              xs: 38,
              sm: 40,
            },

            height: {
              xs: 38,
              sm: 40,
            },

            mr: {
              xs: 0.25,
              sm: 1,
            },

            color: "text.secondary",

            "&:hover": {
              color:
                "text.primary",

              backgroundColor:
                "action.hover",
            },

            transition:
              "transform 0.2s ease, color 0.2s ease",

            "&:active": {
              transform:
                "scale(0.9)",
            },
          }}
        >
          {mode === "dark" ? (
            <LightModeIcon
              fontSize="small"
            />
          ) : (
            <DarkModeIcon
              fontSize="small"
            />
          )}
        </IconButton>


        {/* =================================================
            LOGGED-IN USER
           ================================================= */}

        {user ? (
          <>
            <IconButton
              onClick={
                handleAccountClick
              }
              aria-label="Account menu"
              sx={{
                p: 0.25,

                color:
                  "text.secondary",
              }}
            >
              <Avatar
                sx={{
                  width: {
                    xs: 32,
                    sm: 34,
                  },

                  height: {
                    xs: 32,
                    sm: 34,
                  },

                  bgcolor:
                    "action.hover",

                  color:
                    "text.secondary",
                }}
              >
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

            {/* =============================================
                ACCOUNT MENU
               ============================================= */}

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,

                    width: {
                      xs: "calc(100vw - 24px)",
                      sm: 270,
                    },

                    maxWidth: 320,

                    borderRadius: 2.5,

                    maxHeight:
                      "calc(100vh - 80px)",

                    overflowY: "auto",
                  },
                },
              }}
            >

              {/* Account information */}

              <Box
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 1.25,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  @{user.username}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                    wordBreak:
                      "break-word",
                  }}
                >
                  {user.email}
                </Typography>
              </Box>


              {/* Usage */}

              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    mb: 0.75,
                  }}
                >
                  ⚡ Usage today
                </Typography>

                {usageLoading ? (
                  <LinearProgress
                    sx={{
                      borderRadius: 999,
                      height: 5,
                    }}
                  />
                ) : usage ? (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        mb: 0.75,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatNumber(
                          usage.used
                        )}{" "}
                        used
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatNumber(
                          usage.limit
                        )}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={
                        usagePercent
                      }
                      sx={{
                        height: 6,
                        borderRadius: 999,
                      }}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mt: 0.75,
                      }}
                    >
                      {formatNumber(
                        usage.remaining
                      )}{" "}
                      tokens remaining
                    </Typography>
                  </>
                ) : (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Usage unavailable
                  </Typography>
                )}
              </Box>


              {/* Divider */}

              <Box
                sx={{
                  borderTop: 1,
                  borderColor:
                    "divider",
                }}
              />


              {/* Menu items */}

              <MenuItem
                onClick={handleClose}
              >
                Profile
              </MenuItem>

              <MenuItem
                onClick={handleClose}
              >
                Settings
              </MenuItem>

              <MenuItem
                onClick={handleLogout}
              >
                Log out
              </MenuItem>

            </Menu>
          </>
        ) : (

          /* =================================================
             GUEST
             ================================================= */

          <Box
            sx={{
              display: "flex",

              alignItems: "center",

              gap: {
                xs: 0.25,
                sm: 1,
              },
            }}
          >

            {/* Login */}

            <Typography
              component="button"
              onClick={handleLogin}
              sx={{
                border: "none",

                background:
                  "transparent",

                color:
                  "text.secondary",

                cursor: "pointer",

                font: "inherit",

                fontSize: {
                  xs: "0.82rem",
                  sm: "0.95rem",
                },

                px: {
                  xs: 0.75,
                  sm: 1.5,
                },

                py: 0.75,

                borderRadius: 2,

                "&:hover": {
                  color:
                    "text.primary",

                  backgroundColor:
                    "action.hover",
                },
              }}
            >
              Log in
            </Typography>


            {/* Sign up */}

            <Typography
              component="button"
              onClick={handleRegister}
              sx={{
                border: "none",

                background:
                  "transparent",

                color:
                  "primary.main",

                cursor: "pointer",

                font: "inherit",

                fontSize: {
                  xs: "0.82rem",
                  sm: "0.95rem",
                },

                fontWeight: 600,

                px: {
                  xs: 0.75,
                  sm: 1.5,
                },

                py: 0.75,

                borderRadius: 2,

                "&:hover": {
                  backgroundColor:
                    "action.hover",
                },
              }}
            >
              Sign up
            </Typography>

          </Box>
        )}

      </Toolbar>
    </AppBar>
  );
}

export default Header;