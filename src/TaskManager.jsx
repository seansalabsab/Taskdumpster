import { useState } from "react";
import { PlusCircle, ListTodo } from "lucide-react";
import { motion } from "framer-motion";

export default function TaskManager({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("add");
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [tasks, setTasks] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description,
      dueDate,
      priority,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    resetForm();
    // ⭐️ New Line: Switch to the 'view' tab after a new task is added
    setActiveTab("view"); 
  };

  const resetForm = () => {
    setTaskTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 flex flex-col items-center justify-start py-10">
      {/* 🔙 Back Button */}
      <button
        onClick={() => onNavigate("menu")}
        className="mb-6 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
      >
        🔙 Back to Menu
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student Task Manager</h1>
        <p className="text-gray-500">Stay organized and boost your productivity</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <motion.button
          onClick={() => setActiveTab("view")}
          whileTap={{ scale: 0.95 }}
          animate={{
            backgroundColor: activeTab === "view" ? "rgb(99 102 241)" : "rgb(255 255 255)",
            color: activeTab === "view" ? "rgb(255 255 255)" : "rgb(75 85 99)",
          }}
          transition={{ duration: 0.2 }}
          className="px-6 py-2 rounded-full shadow-md flex items-center gap-2"
        >
          <ListTodo size={18} /> View Tasks
        </motion.button>

        <motion.button
          onClick={() => setActiveTab("add")}
          whileTap={{ scale: 0.95 }}
          animate={{
            backgroundColor: activeTab === "add" ? "rgb(99 102 241)" : "rgb(255 255 255)",
            color: activeTab === "add" ? "rgb(255 255 255)" : "rgb(75 85 99)",
          }}
          transition={{ duration: 0.2 }}
          className="px-6 py-2 rounded-full shadow-md flex items-center gap-2"
        >
          <PlusCircle size={18} /> Add Task
        </motion.button>
      </div>

      {/* Card */}
      <motion.div
        key={activeTab} // triggers re-animation on tab change
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-8"
      >
        {activeTab === "add" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              ➕ Add New Task
            </h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter your task title..."
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task details (optional)..."
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-400">
                {description.length}/500 characters
              </p>
            </div>

            {/* Date + Priority */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">
      Due Date & Time
    </label>
    <input
      type="datetime-local"
      value={dueDate}
      onChange={(e) => setDueDate(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Priority Level
                </label>
                <div className="flex space-x-2">
                  {["Low", "Medium", "High"].map((level) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setPriority(level)}
                      className={`px-4 py-2 rounded-lg border ${
                        priority === level
                          ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 rounded-lg border hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              📋 Task List
            </h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet. Add one to get started!</p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-sm text-gray-500">{task.description}</p>
                      <p className="text-xs text-gray-400">
                        Due: {task.dueDate || "No deadline"} | Priority:{" "}
                        <span className="font-semibold">{task.priority}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}