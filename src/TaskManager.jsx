import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, database } from "./firebase";
import { ref, set, push, onValue, update, remove } from "firebase/database";
import {
  PlusCircle,
  ListTodo,
  Menu,
  LogOut,
  User,
  CheckCircle,
  Trash2,
  Edit3,
  ChevronDown,
} from "lucide-react";

export default function TaskManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDone, setConfirmDone] = useState(null);
  const [confirmUndone, setConfirmUndone] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load tasks from Firebase on component mount
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const tasksRef = ref(database, `tasks/${userId}`);
    const doneTasksRef = ref(database, `doneTasks/${userId}`);
    
    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      setTasks(data ? Object.entries(data).map(([key, value]) => ({ ...value, firebaseKey: key })) : []);
    });
    
    const unsubscribeDoneTasks = onValue(doneTasksRef, (snapshot) => {
      const data = snapshot.val();
      setDoneTasks(data ? Object.entries(data).map(([key, value]) => ({ ...value, firebaseKey: key })) : []);
    });
    
    return () => {
      unsubscribeTasks();
      unsubscribeDoneTasks();
    };
  }, []);

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    setShowProfileMenu(false);
    
    setTimeout(() => {
      setActiveTab(newTab);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description,
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // If Firebase is not available, use local state
    if (!auth.currentUser || !database) {
      setTasks(prevTasks => [...prevTasks, newTask]);
      resetForm();
      setActiveTab("view");
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const tasksRef = ref(database, `tasks/${userId}`);
      await push(tasksRef, newTask);
      
      resetForm();
      setActiveTab("view");
    } catch (error) {
      console.error("Error adding task:", error);
      // Fallback to local state if Firebase fails
      setTasks(prevTasks => [...prevTasks, newTask]);
      resetForm();
      setActiveTab("view");
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !auth.currentUser) return;

    const updatedTask = {
      ...editingTask,
      title: taskTitle,
      description,
      dueDate,
      priority,
      updatedAt: new Date().toISOString(),
    };

    try {
      const userId = auth.currentUser.uid;
      const taskRef = ref(database, `tasks/${userId}/${editingTask.firebaseKey}`);
      await update(taskRef, updatedTask);
      
      resetForm();
      setEditingTask(null);
      setActiveTab("view");
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const resetForm = () => {
    setTaskTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  const handleDelete = async (task) => {
    if (!auth.currentUser) return;
    
    try {
      const userId = auth.currentUser.uid;
      if (task.completed) {
        await remove(ref(database, `doneTasks/${userId}/${task.firebaseKey}`));
      } else {
        await remove(ref(database, `tasks/${userId}/${task.firebaseKey}`));
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
    setConfirmDelete(null);
  };

  const markAsDone = async (task) => {
    if (!auth.currentUser) return;
    
    try {
      const userId = auth.currentUser.uid;
      const updatedTask = { ...task, completed: true, completedAt: new Date().toISOString() };
      
      // Add to done tasks
      await push(ref(database, `doneTasks/${userId}`), updatedTask);
      
      // Remove from active tasks
      await remove(ref(database, `tasks/${userId}/${task.firebaseKey}`));
    } catch (error) {
      console.error("Error marking task as done:", error);
    }
    setConfirmDone(null);
  };

  const markAsUndone = async (task) => {
    if (!auth.currentUser) return;
    
    try {
      const userId = auth.currentUser.uid;
      const updatedTask = { ...task, completed: false };
      delete updatedTask.completedAt;
      
      // Add back to active tasks
      await push(ref(database, `tasks/${userId}`), updatedTask);
      
      // Remove from done tasks
      await remove(ref(database, `doneTasks/${userId}/${task.firebaseKey}`));
    } catch (error) {
      console.error("Error marking task as undone:", error);
    }
    setConfirmUndone(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderTaskList = (taskList, showDoneButton = true, showUndoneButton = false) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-12 animate-fadeIn">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-500 text-lg">No tasks in this category</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map((task, index) => (
          <div
            key={task.firebaseKey || task.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 animate-slideInUp"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  className="sm:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform duration-200 ${expandedTask === task.id ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              <div className={`${expandedTask === task.id ? 'block' : 'hidden'} sm:block transition-all duration-200`}>
                {task.description && (
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {task.description}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mb-4">
                  📅 Due: {formatDate(task.dueDate)}
                </p>

                <div className="flex flex-wrap gap-2">
                  {showDoneButton && (
                    <button
                      onClick={() =>
                        confirmDone === task.id
                          ? markAsDone(task)
                          : setConfirmDone(task.id)
                      }
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle size={16} />
                      {confirmDone === task.id ? "Confirm?" : "Done"}
                    </button>
                  )}

                  {showUndoneButton && (
                    <button
                      onClick={() =>
                        confirmUndone === task.id
                          ? markAsUndone(task)
                          : setConfirmUndone(task.id)
                      }
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      ↩️ {confirmUndone === task.id ? "Confirm?" : "Undo"}
                    </button>
                  )}

                  {showDoneButton && (
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setTaskTitle(task.title);
                        setDescription(task.description || "");
                        setDueDate(task.dueDate || "");
                        setPriority(task.priority || "Medium");
                        setActiveTab("edit");
                      }}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() =>
                      confirmDelete === task.id
                        ? handleDelete(task)
                        : setConfirmDelete(task.id)
                    }
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    {confirmDelete === task.id ? "Confirm?" : "Delete"}
                  </button>
                </div>

                {(confirmDone === task.id || confirmUndone === task.id || confirmDelete === task.id) && (
                  <button
                    onClick={() => {
                      setConfirmDone(null);
                      setConfirmUndone(null);
                      setConfirmDelete(null);
                    }}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100">
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="bg-white shadow-sm border-b border-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="sm:text-2xl lg:text-3xl font-extrabold text-3xl text-indigo-600 tracking-wide">
                Note Nudge.
              </h1>
              <p className="text-sm sm:text-base text-gray-500 hidden sm:block">
                Task Management System
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Menu size={16} />
                <span className="font-medium text-gray-700 hidden sm:inline">Profile</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => navigate("/editprofile")}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User size={16} className="mr-2" /> Edit Profile
                  </button>
                  <button
                    onClick={() => navigate("/changepassword")}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    🔒 Change Password
                  </button>
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      navigate("/");
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut size={16} className="mr-2" /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2">
          {["home", "view", "add", "done"].map((tab) => {
            const icons = {
              home: <Menu size={14} />,
              view: <ListTodo size={14} />,
              add: <PlusCircle size={14} />,
              done: <CheckCircle size={14} />,
            };
            const labels = {
              home: "Home",
              view: "Tasks",
              add: "Add",
              done: "Done",
            };

            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-sm border text-sm font-medium whitespace-nowrap transition-all duration-200 hover:scale-105 ${
                  activeTab === tab 
                    ? "bg-indigo-600 text-white border-indigo-600" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {icons[tab]} 
                <span>{labels[tab]}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div 
            className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out ${
              isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {activeTab === "home" && (
              <div className="text-center space-y-6 animate-fadeIn">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  This is Note Nudge your personal task manager. Use the tabs above to get started.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <ListTodo className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">View Tasks</h3>
                    <p className="text-sm text-gray-600">Check upcoming tasks</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <PlusCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">Add Task</h3>
                    <p className="text-sm text-gray-600">Create new tasks</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">Done Tasks</h3>
                    <p className="text-sm text-gray-600">Review completed</p>
                  </div>
                </div>

                <div className="mt-8 text-left bg-indigo-50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-indigo-700 mb-3">
                    📌 About "Note Nudge Mind Board"
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div><strong>Note</strong> → Writing reminders & memos</div>
                    <div><strong>Nudge</strong> → Gentle push to take action</div>
                    <div><strong>Mind</strong> → Focus on thoughts & memory</div>
                    <div><strong>Board</strong> → Organize & visualize tasks</div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "add" || activeTab === "edit") && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {activeTab === "add" ? "➕ Add New Task" : "✏️ Edit Task"}
                </h2>

                <form onSubmit={activeTab === "add" ? handleSubmit : handleUpdateTask}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter task title..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                        rows={4}
                        maxLength={500}
                        placeholder="Add description (optional)..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {description.length}/500 characters
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={getMinDateTime()}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Low", "Medium", "High"].map((level) => (
                            <button
                              type="button"
                              key={level}
                              onClick={() => setPriority(level)}
                              className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                priority === level
                                  ? getPriorityColor(level)
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      >
                        {activeTab === "add" ? "Add Task" : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          if (activeTab === "edit") {
                            setEditingTask(null);
                            handleTabChange("view");
                          }
                        }}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                      >
                        {activeTab === "add" ? "Clear" : "Cancel"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "view" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  📋 Your Tasks ({tasks.length})
                </h2>
                {renderTaskList(tasks, true, false)}
              </div>
            )}

            {activeTab === "done" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  ✅ Completed Tasks ({doneTasks.length})
                </h2>
                {renderTaskList(doneTasks, false, true)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
}