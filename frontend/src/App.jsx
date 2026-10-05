import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { useCallback, useState } from "react";

import ChatPage from "./pages/ChatPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AshaniSplash from "./components/AshaniSplash";

import {
  ThemeModeProvider,
} from "./theme/ThemeModeContext";

function HomeWithSplash() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && (
        <AshaniSplash
          onComplete={handleSplashComplete}
        />
      )}

      <ChatPage />
    </>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter>
        <Routes>

          <Route
  path="/"
  element={<HomeWithSplash />}
/>

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

        </Routes>
      </BrowserRouter>
    </ThemeModeProvider>
  );
}

export default App;