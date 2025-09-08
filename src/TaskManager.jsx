import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, database } from "./firebase";
import { ref, push, onValue, update, remove } from "firebase/database";
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
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [archiveTasks, setArchiveTasks] = useState([]);
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDoneModal, setShowDoneModal] = useState(null);
  const [showUndoModal, setShowUndoModal] = useState(null);
  
  const [editingTask, setEditingTask] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showArchiveDeleteModal, setShowArchiveDeleteModal] = useState(null);
  const [showRetrieveModal, setShowRetrieveModal] = useState(null);

  
  // Track which tasks have been notified already
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());


  

  const autoArchiveOverdue = async () => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;

  const now = new Date();

  for (const task of tasks) {
    if (task.dueDate && new Date(task.dueDate) < now) {
      // ⏰ Move to archive if overdue
      await push(ref(database, `archiveTasks/${userId}`), {
        ...task,
        archivedAt: new Date().toISOString(),
        reason: "Overdue",
      });

      // Remove from active tasks
      await remove(ref(database, `tasks/${userId}/${task.firebaseKey}`));
    }
  }
  };

  const [activeTab, setActiveTab] = useState(() => {
  return localStorage.getItem("activeTab") || "home";
  });


  const retrieveTask = async (task) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;

  let updatedTask = { ...task };

  // If overdue → set new due date to next hour
  if (task.reason === "Overdue") {
    const newDue = new Date();
    newDue.setHours(newDue.getHours() + 1);
    updatedTask.dueDate = newDue.toISOString();
  }

  try {
    await push(ref(database, `tasks/${userId}`), {
      ...updatedTask,
      retrievedAt: new Date().toISOString(),
    });
    await remove(ref(database, `archiveTasks/${userId}/${task.firebaseKey}`));
  } catch (err) {
    console.error("Error retrieving task:", err);
  }
  };



  const moveToArchive = async (task) => {
  if (!auth.currentUser) return;
  try {
    const userId = auth.currentUser.uid;
    await push(ref(database, `archiveTasks/${userId}`), {
      ...task,
      archivedAt: new Date().toISOString(),
      reason: task.dueDate && new Date(task.dueDate) < new Date() 
        ? "Overdue" 
        : "Deleted"
    });

    // remove from tasks or doneTasks
    const path = task.completed
      ? `doneTasks/${userId}/${task.firebaseKey}`
      : `tasks/${userId}/${task.firebaseKey}`;
    await remove(ref(database, path));
  } catch (err) {
    console.error("Error archiving task:", err);
  }
  };

  // Load tasks
  useEffect(() => {
    if (!auth.currentUser) return;
    

    const userId = auth.currentUser.uid;
    const tasksRef = ref(database, `tasks/${userId}`);
    const doneTasksRef = ref(database, `doneTasks/${userId}`);

    const unsubTasks = onValue(tasksRef, (snap) => {
      const data = snap.val();
      setTasks(data
        ? Object.entries(data).map(([k, v]) => ({ ...v, firebaseKey: k }))
        : []
      );
    });

    const unsubDone = onValue(doneTasksRef, (snap) => {
      const data = snap.val();
      setDoneTasks(data
        ? Object.entries(data).map(([k, v]) => ({ ...v, firebaseKey: k }))
        : []
      );
    });
    const archiveRef = ref(database, `archiveTasks/${userId}`);
    const unsubArchive = onValue(archiveRef, (snap) => {
  const data = snap.val();
  setArchiveTasks(
    data ? Object.entries(data).map(([k, v]) => ({ ...v, firebaseKey: k })) : []
  );
    });

    return () => {
      unsubTasks();
      unsubDone();
      unsubArchive();
    };
  }, []);

  // Ask for Notification permission once
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Periodic check for upcoming deadlines
  // Periodic check for overdue + reminders
  // Periodic check for overdue + reminders
  useEffect(() => {
    if (!tasks.length) return;

    const checkTasks = () => {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const fifteenMinFromNow = new Date(now.getTime() + 15 * 60 * 1000);

      // 🔹 Archive overdue tasks immediately
      autoArchiveOverdue();

      // 🔹 Notifications
      tasks.forEach((task) => {
        if (!task.dueDate) return;
        const due = new Date(task.dueDate);
        const taskId = task.id || task.firebaseKey;

        // 1 hour before
        if (
          due > now &&
          due <= oneHourFromNow &&
          Notification.permission === "granted" &&
          !notifiedTasks.has(`${taskId}-1h`)
        ) {
          new Notification("⏰ Task Reminder!", {
            body: `${task.title} is due in 1 hour (at ${due.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })})`,
            icon: "/NNlogo.png",
          });
          setNotifiedTasks((prev) => new Set(prev).add(`${taskId}-1h`));
        }

        // 15 minutes before
        if (
          due > now &&
          due <= fifteenMinFromNow &&
          Notification.permission === "granted" &&
          !notifiedTasks.has(`${taskId}-15m`)
        ) {
          new Notification("⚠️ Task Reminder!", {
            body: `${task.title} is due in 15 minutes (at ${due.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })})`,
            icon: "/NNlogo.png",
          });
          setNotifiedTasks((prev) => new Set(prev).add(`${taskId}-15m`));
        }
      });
    };

    // 🔹 Run once immediately on mount
    checkTasks();

    // 🔹 Then run every 1 minute
    const interval = setInterval(checkTasks, 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, notifiedTasks]);



  // Tab change with a fade
  const handleTabChange = (newTab) => {
  if (newTab === activeTab) return;
  setIsTransitioning(true);
  setShowProfileMenu(false);
  setTimeout(() => {
    setActiveTab(newTab);
    localStorage.setItem("activeTab", newTab); // 👈 save tab
    setTimeout(() => setIsTransitioning(false), 50);
  }, 150);
  };

  // Add Task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    //due date
    if (dueDate) {
      const selected = new Date(dueDate);
      const minAllowed = new Date();
      minAllowed.setHours(minAllowed.getHours() + 1);

      if (selected < minAllowed) {
        alert("⚠️ Please choose a time at least 1 hour from now.");
        return;
      }
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description,
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (!auth.currentUser) {
      setTasks((prev) => [...prev, newTask]);
    } else {
      try {
        const refTasks = ref(database, `tasks/${auth.currentUser.uid}`);
        await push(refTasks, newTask);
      } catch (err) {
        console.error("Add task error:", err);
        setTasks((prev) => [...prev, newTask]);
      }
    }

    resetForm();
    setActiveTab("view");
  };

  // Update Task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !auth.currentUser) return;

    const updated = {
      ...editingTask,
      title: taskTitle,
      description,
      dueDate,
      priority,
      updatedAt: new Date().toISOString(),
    };

    try {
      const taskRef = ref(
        database,
        `tasks/${auth.currentUser.uid}/${editingTask.firebaseKey}`
      );
      await update(taskRef, updated);
      setEditingTask(null);
      setActiveTab("view");
      resetForm();
    } catch (err) {
      console.error("Update task error:", err);
    }
  };

  const resetForm = () => {
    setTaskTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  const markAsDone = async (task) => {
    if (!auth.currentUser) return;
    try {
      const userId = auth.currentUser.uid;
      const updated = { ...task, completed: true, completedAt: new Date().toISOString() };
      await push(ref(database, `doneTasks/${userId}`), updated);
      await remove(ref(database, `tasks/${userId}/${task.firebaseKey}`));
    } catch (err) {
      console.error("Error marking done:", err);
    }
    setShowDoneModal(null);
  };

  const markAsUndone = async (task) => {
    if (!auth.currentUser) return;
    try {
      const userId = auth.currentUser.uid;
      const updated = { ...task, completed: false };
      delete updated.completedAt;
      await push(ref(database, `tasks/${userId}`), updated);
      await remove(ref(database, `doneTasks/${userId}/${task.firebaseKey}`));
    } catch (err) {
      console.error("Error undoing:", err);
    }
    setShowUndoModal(null);
  };

  const handleDelete = (task) => {
  moveToArchive(task);
  setShowDeleteModal(null);
  };


  // UI helpers
  const getPriorityColor = (level) => ({
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
  }[level] || "bg-gray-100 text-gray-700 border-gray-200");

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleDateString() + " " + new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "No deadline";


  // const getMinDateTime = () => {
  //   const now = new Date();
  //   return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  //     .toISOString()
  //     .slice(0, 16);
  // };

  function getMinDateTime() {
  const now = new Date();
  now.setHours(now.getHours() + 1); // add 1 hour
  return now.toISOString().slice(0, 16); // format for datetime-local
  }


  const renderTaskList = (list, showDone = true, showUndo = false) => {
    if (!list.length) {
      return (
        <div className="text-center py-12 animate-fadeIn">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-500 text-lg">No tasks in this category</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((task, idx) => (
          <div
            key={task.firebaseKey || task.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 animate-slideInUp"
            style={{ animationDelay: `${idx * 100}ms` }}
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
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{task.description}</p>
                )}

                <p className="text-xs text-gray-500 mb-4">📅 Due: {formatDate(task.dueDate)}</p>

                <div className="flex flex-wrap gap-2">
                  {showDone && (
                    <button
                      onClick={() => setShowDoneModal(task)}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle size={16} /> Mark as Done
                    </button>
                  )}
                  {showUndo && (
                    <button
                      onClick={() => setShowUndoModal(task)}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      ↩️ Undo
                    </button>
                  )}
                  {showDone && (
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
                      <Edit3 size={16} /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteModal(task)}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100">
      <style>{`
      @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .animate-slideInUp { animation: slideInUp 0.4s ease-out forwards; }
      .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
    `}</style>


      {/* Header */}
      <div className="bg-white shadow-sm border-b border-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/NNlogo.png" alt="Note Nudge Logo" className="h-13 w-20" />
            <div>
              <h1 className="text-3xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 tracking-wide">
                Note Nudge.
              </h1>
              <p className="text-sm sm:text-base text-gray-500 hidden sm:block">Task Management System</p>
            </div>
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
                  onClick={async () => { await signOut(auth); navigate("/"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-2" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Nav Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2">
          {["home", "view", "add", "done", "archive"].map((tab) => {
            const icons = { home: <Menu size={14} />, view: <ListTodo size={14} />, add: <PlusCircle size={14} />, done: <CheckCircle size={14} />,  archive: <Trash2 size={14} /> };
            const labels = { home: "Home", view: "Tasks", add: "Add", done: "Done", archive: "Archive" };
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
                {icons[tab]} <span>{labels[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* Panels */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {activeTab === "home" && (
              <div className="text-center space-y-6 animate-fadeIn">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome!!</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  This is Note Nudge your personal task manager. Use the tabs above to get started.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  <div className="p-4 bg-indigo-50 rounded-xl text-center">
                    <ListTodo className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">View Tasks</h3>
                    <p className="text-sm text-gray-600">Check upcoming tasks</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <PlusCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">Add Task</h3>
                    <p className="text-sm text-gray-600">Create new tasks</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">Done Tasks</h3>
                    <p className="text-sm text-gray-600">Review completed</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">Archive</h3>
                    <p className="text-sm text-gray-600">View deleted/overdue tasks</p>
                  </div>
                </div>
                <div className="mt-8 text-left bg-indigo-50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-indigo-700 mb-3 text-center">📌 About "Note Nudge Mind Board"</h3>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                        placeholder="Enter task title..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="Add description (optional)..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date & Time</label>
                        <input
                          type="datetime-local"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={getMinDateTime()}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Low", "Medium", "High"].map((lvl) => (
                            <button
                              type="button"
                              key={lvl}
                              onClick={() => setPriority(lvl)}
                              className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                priority === lvl ? getPriorityColor(lvl) : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-200 hover:scale-105"
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
            {activeTab === "archive" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  🗄️ Archived Tasks ({archiveTasks.length})
                </h2>
                {archiveTasks.length === 0 ? (
                  <p className="text-gray-500 text-center">No archived tasks.</p>
                ) : (
                  <div className="space-y-3">
                    {archiveTasks.map((task, idx) => (
                      <div
                        key={task.firebaseKey}
                        className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 animate-slideInUp"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="p-4">
                          {/* Header with title + collapse toggle */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                {task.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Reason: <span className="font-medium">{task.reason}</span>
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedTask(expandedTask === task.firebaseKey ? null : task.firebaseKey)
                              }
                              className="sm:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <ChevronDown
                                size={20}
                                className={`transition-transform duration-200 ${
                                  expandedTask === task.firebaseKey ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {/* Expandable details */}
                          <div
                            className={`${
                              expandedTask === task.firebaseKey ? "block" : "hidden"
                            } sm:block transition-all duration-200`}
                          >
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            <p className="text-xs text-gray-500">
                              📅 Archived At: {new Date(task.archivedAt).toLocaleString()}
                            </p>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => setShowRetrieveModal(task)}
                                className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                ♻️ Retrieve
                              </button>
                              <button
                                onClick={() => setShowArchiveDeleteModal(task)}
                                className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                🗑️ Delete Permanently
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


          </div>
        </div>
      </div>

      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}

      {/* Confirmation Modals */}
      {showDoneModal && (
        <ConfirmationModal
          title="Mark as Done?"
          message={`Are you sure you want to mark "${showDoneModal.title}" as completed?`}
          onConfirm={() => markAsDone(showDoneModal)}
          onCancel={() => setShowDoneModal(null)}
        />
      )}
      {showUndoModal && (
        <ConfirmationModal
          title="Mark as Undone?"
          message={`Do you want to move "${showUndoModal.title}" back to active tasks?`}
          onConfirm={() => markAsUndone(showUndoModal)}
          onCancel={() => setShowUndoModal(null)}
        />
      )}
            {showDeleteModal && (
        <ConfirmationModal
          title="Delete Task?"
          message={`Are you sure you want to delete "${showDeleteModal.title}"? This cannot be undone.`}
          onConfirm={() => handleDelete(showDeleteModal)}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}

      {/* 🔹 Retrieve Confirmation */}
      {showRetrieveModal && (
        <ConfirmationModal
          title="Retrieve Task?"
          message={`Do you want to restore "${showRetrieveModal.title}" back to your active tasks?`}
          onConfirm={() => {
            retrieveTask(showRetrieveModal);
            setShowRetrieveModal(null);
          }}
          onCancel={() => setShowRetrieveModal(null)}
        />
      )}

      {/* 🔹 Permanent Delete Confirmation */}
      {showArchiveDeleteModal && (
        <ConfirmationModal
          title="Delete Task?"
          message={`Are you sure you want to permanently delete "${showArchiveDeleteModal.title}"? This cannot be undone.`}
          onConfirm={async () => {
            await remove(
              ref(
                database,
                `archiveTasks/${auth.currentUser.uid}/${showArchiveDeleteModal.firebaseKey}`
              )
            );
            setShowArchiveDeleteModal(null);
          }}
          onCancel={() => setShowArchiveDeleteModal(null)}
        />
      )}
    </div>
  );
}

// Reusable confirmation dialog component
function ConfirmationModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm animate-fadeIn">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
