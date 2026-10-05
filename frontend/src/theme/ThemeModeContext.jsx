import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  ThemeProvider,
  CssBaseline,
} from "@mui/material";

import { getTheme } from "./theme";

const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const savedMode =
      localStorage.getItem("ashani_theme");

    return savedMode === "light"
      ? "light"
      : "dark";
  });

  const toggleTheme = () => {
    setMode((currentMode) => {
      const nextMode =
        currentMode === "dark"
          ? "light"
          : "dark";

      localStorage.setItem(
        "ashani_theme",
        nextMode
      );

      return nextMode;
    });
  };

  const theme = useMemo(
    () => getTheme(mode),
    [mode]
  );

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
  const context =
    useContext(ThemeModeContext);

  if (!context) {
    throw new Error(
      "useThemeMode must be used inside ThemeModeProvider"
    );
  }

  return context;
}