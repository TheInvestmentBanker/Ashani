import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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

          {/* =====================================================
              HOME
             ===================================================== */}

          <Route
            path="/"
            element={<HomeWithSplash />}
          />


          {/* =====================================================
              CONVERSATION
             ===================================================== */}

          <Route
            path="/chat/:conversationId"
            element={<ChatPage />}
          />


          {/* =====================================================
              AUTH
             ===================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* =====================================================
              FALLBACK
             ===================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>
    </ThemeModeProvider>
  );
}

export default App;