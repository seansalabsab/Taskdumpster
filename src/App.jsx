import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import AuthScreen from "./AuthScreen";
import MenuScreen from "./MenuScreen";
import EditProfile from "./EditProfile";
import TaskManager from "./TaskManager";
import ChangePassword from "./ChangePassword";

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <AuthScreen onAuthSuccess={() => (window.location.href = "/menu")} />
              </AnimatedPage>
            }
          />

          <Route
            path="/menu"
            element={
              <AnimatedPage>
                <MenuScreen onNavigate={(page) => (window.location.href = `/${page}`)} />
              </AnimatedPage>
            }
          />

          <Route
            path="/taskmanager"
            element={
              <AnimatedPage>
                <TaskManager />
              </AnimatedPage>
            }
          />

          <Route
            path="/profile"
            element={
              <AnimatedPage>
                <EditProfile />
              </AnimatedPage>
            }
          />

          <Route
            path="/changepassword"
            element={
              <AnimatedPage>
                <ChangePassword />
              </AnimatedPage>
            }
          />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
