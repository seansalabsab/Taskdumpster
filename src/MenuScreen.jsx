export default function MenuScreen({ onNavigate }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-indigo-200">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📚 Student Task Manager</h1>
      <button
        onClick={() => onNavigate("taskManager")}
        className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 animate-bounce"
      >
        Start Managing Tasks
      </button>
    </div>
  );
}
