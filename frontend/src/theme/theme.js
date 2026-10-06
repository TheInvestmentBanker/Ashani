import { createTheme } from "@mui/material/styles";

export const colors = {
  dark: {
    primary: "#8B5CF6",
    secondary: "#06B6D4",

    background: "#0B0B0F",
    surface: "#141419",
    surfaceHover: "#1C1C24",

    text: "#F5F5F5",
    textSecondary: "#A1A1AA",

    border: "#27272A",
    userMessage: "#25252D",
    aiMessage: "#141419",
  },

  light: {
  primary: "#6D28D9",
  secondary: "#0891B2",

  background: "#FAF8F2",
  surface: "#FFFEFA",
  surfaceHover: "#F3F0E8",

  text: "#18181B",
  textSecondary: "#71717A",

  border: "#E5E1D8",
  userMessage: "#F1EEE7",
  aiMessage: "#FFFEFA",
},
}

export const getTheme = (mode = "dark") => {
  const palette = colors[mode];

  return createTheme({
    palette: {
      mode,

      primary: {
        main: palette.primary,
      },

      secondary: {
        main: palette.secondary,
      },

      background: {
        default: palette.background,
        paper: palette.surface,
      },

      text: {
        primary: palette.text,
        secondary: palette.textSecondary,
      },

      divider: palette.border,
    },

    typography: {
      fontFamily: [
        "Inter",
        "Roboto",
        "Arial",
        "sans-serif",
      ].join(","),
    },

    shape: {
      borderRadius: 10,
    },
  });
};