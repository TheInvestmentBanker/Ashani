import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import ChatPage from "./pages/ChatPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

import {
  ThemeModeProvider,
} from "./theme/ThemeModeContext";

function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter>
        <Routes>

          <Route
            path="/"
            element={<ChatPage />}
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