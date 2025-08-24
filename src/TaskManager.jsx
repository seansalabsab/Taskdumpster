import { useState, useEffect } from "react";
import {
  PlusCircle,
  ListTodo,
  Menu,
  LogOut,
  User,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, database } from "./firebase";
import { ref, set, push, onValue, update, remove } from "firebase/database";

export default function TaskManager() {
  const [activeTab, setActiveTab] = useState("home");
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const tasksRef = ref(database, "tasks/" + user.uid);
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allTasks = Object.entries(data).map(([id, task]) => ({
          id,
          ...task,
        }));
        setTasks(allTasks.filter((task) => !task.completed));
        setDoneTasks(allTasks.filter((task) => task.completed));
      } else {
        setTasks([]);
        setDoneTasks([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !user) return;

    const newTask = {
      title: taskTitle,
      description,
      dueDate,
      priority,
      completed: false,
    };

    try {
      const tasksRef = ref(database, "tasks/" + user.uid);
      const newTaskRef = push(tasksRef);
      await set(newTaskRef, newTask);
      resetForm();
      setActiveTab("view");
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  const resetForm = () => {
    setTaskTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  const handleDelete = async (taskId) => {
    if (!user) return;
    await remove(ref(database, `tasks/${user.uid}/${taskId}`));
    setConfirmDelete(null);
  };

  const markAsDone = async (taskId) => {
    if (!user) return;
    const taskRef = ref(database, `tasks/${user.uid}/${taskId}`);
    await update(taskRef, { completed: true });
  };

  const renderTaskList = (taskList, showDoneButton = true) => {
    if (taskList.length === 0) {
      return <p className="text-gray-500">No tasks in this category.</p>;
    }

    return (
      <ul className="space-y-3">
        {taskList.map((task) => (
          <li
            key={task.id}
            className="p-4 border rounded-lg flex justify-between items-start"
          >
            <div>
              <h3 className="font-medium text-gray-800">{task.title}</h3>
              <p className="text-sm text-gray-500">{task.description}</p>
              <p className="text-xs text-gray-400">
                Due: {task.dueDate || "No deadline"} | Priority:{" "}
                <span className="font-semibold">{task.priority}</span>
              </p>
            </div>

            <div className="flex flex-col gap-2 items-end ml-4">
              {showDoneButton && (
                <button
                  onClick={() => markAsDone(task.id)}
                  className="text-green-600 hover:underline text-sm flex items-center gap-1"
                >
                  <CheckCircle size={16} /> Done
                </button>
              )}

              <button
                onClick={() =>
                  confirmDelete === task.id
                    ? handleDelete(task.id)
                    : setConfirmDelete(task.id)
                }
                className="text-red-500 hover:underline text-sm flex items-center gap-1"
              >
                <Trash2 size={16} />
                {confirmDelete === task.id ? "Confirm?" : "Delete"}
              </button>
              {confirmDelete === task.id && (
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 flex flex-col items-center justify-start py-10">
      <button
        onClick={() => navigate("/menu")}
        className="mb-6 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
      >
        🔙 Back to Menu
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student Task Manager</h1>
        <p className="text-gray-500">Stay organized and boost your productivity</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {["home", "view", "add", "done"].map((tab) => {
        const icons = {
          home: <Menu size={18} />,
          view: <ListTodo size={18} />,
          add: <PlusCircle size={18} />,
          done: <CheckCircle size={18} />,
        };
        const labels = {
          home: "Home",
          view: "View Tasks",
          add: "Add Task",
          done: "Done Tasks",
        };

          return (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileTap={{ scale: 0.95 }}
              animate={{
                backgroundColor:
                  activeTab === tab ? "rgb(99 102 241)" : "rgb(255 255 255)",
                color:
                  activeTab === tab ? "rgb(255 255 255)" : "rgb(75 85 99)",
              }}
              transition={{ duration: 0.2 }}
              className="px-6 py-2 rounded-full shadow-md flex items-center gap-2"
            >
              {icons[tab]} {labels[tab]}
            </motion.button>
          );
        })}
      </div>

      {/* Card Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-8"
      >
        {activeTab === "home" ? (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">👋 Welcome!</h2>
      <p className="text-gray-600">
        This is your personal student task manager. Use the tabs above to get started:
      </p>
      <ul className="text-gray-500 text-sm space-y-1">
        <li>📋 <strong>View Tasks</strong> – Check your upcoming tasks</li>
        <li>➕ <strong>Add Task</strong> – Create a new task with due date and priority</li>
        <li>✅ <strong>Done Tasks</strong> – Review your completed tasks</li>
      </ul>
    </div>
        ):activeTab === "add" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              ➕ Add New Task
            </h2>

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
        ) : activeTab === "view" ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              📋 Task List
            </h2>
            {renderTaskList(tasks, true)}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              ✅ Completed Tasks
            </h2>
            {renderTaskList(doneTasks, false)}
          </div>
        )}
      </motion.div>

      {/* Profile Dropdown */}
      <div className="absolute top-6 right-6">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow hover:bg-gray-50">
            <Menu size={18} />
            <span className="font-medium text-gray-700">Profile</span>
          </button>

          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User size={16} className="mr-2" /> Edit Profile
            </button>

            <button
              onClick={() => navigate("/changepassword")}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              🔒 Change Password
            </button>

            <button
              onClick={async () => {
                await signOut(auth);
                navigate("/");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <LogOut size={16} className="mr-2" /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

