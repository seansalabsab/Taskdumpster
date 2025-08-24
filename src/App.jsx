import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MenuScreen from "./MenuScreen";
import TaskManager from "./TaskManager";

export default function App() {
  const [screen, setScreen] = useState("menu");

  return (
    <div className="min-h-screen bg-gray-100">
      <AnimatePresence mode="wait">
        {screen === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <MenuScreen onNavigate={setScreen} />
          </motion.div>
        )}

        {screen === "taskManager" && (
          <motion.div
            key="taskManager"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <TaskManager onNavigate={setScreen} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
