import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import AuthScreen from "./AuthScreen";
import EditProfile from "./EditProfile";
import TaskManager from "./TaskManager";
import ChangePassword from "./ChangePassword";

// ✅ Reusable fade animation wrapper
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

// ✅ Main routes
function AppRoutes() {
  const location = useLocation();  // 👈 needed for AnimatePresence
  const navigate = useNavigate();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Screen (login page) */}
        <Route
          path="/"
          element={
            <AnimatedPage>
              <AuthScreen onAuthSuccess={() => navigate("/TaskManager")} />
            </AnimatedPage>
          }
        />

        {/* Task Manager (main app) */}
        <Route
          path="/TaskManager"
          element={
            <AnimatedPage>
              <TaskManager />
            </AnimatedPage>
          }
        />

        {/* Profile Page */}
        <Route
          path="/EditProfile"
          element={
            <AnimatedPage>
              <EditProfile />
            </AnimatedPage>
          }
        />

        {/* Change Password Page */}
        <Route
          path="/ChangePassword"
          element={
            <AnimatedPage>
              <ChangePassword />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
