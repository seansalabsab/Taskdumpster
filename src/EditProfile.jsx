import { useState, useEffect } from "react";
import {
  getAuth,
  updateProfile,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { database } from "./firebase";
import { ref, get, set, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Check, AlertCircle } from "lucide-react";

function encodeKey(str) {
  return str.replace(/[.#$\[\]]/g, ",");
}

export default function EditProfile() {
  const user = getAuth().currentUser;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    currentPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setForm({
        username: user.displayName || "",
        email: user.email || "",
        currentPassword: "",
      });
      setLoading(false);
    }
    load();
  }, [user]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const cred = EmailAuthProvider.credential(
        user.email,
        form.currentPassword
      );
      await reauthenticateWithCredential(user, cred);

      const usernameLower = form.username.toLowerCase();
      const emailLower = form.email.toLowerCase();

      const encodedUsername = encodeKey(usernameLower);
      const encodedEmail = encodeKey(emailLower);
      const oldUsername = user.displayName
        ? encodeKey(user.displayName.toLowerCase())
        : "";
      const oldEmail = user.email ? encodeKey(user.email.toLowerCase()) : "";

      // Check uniqueness
      const nameSnap = await get(ref(database, "usernames/" + encodedUsername));
      if (nameSnap.exists() && nameSnap.val() !== user.uid) {
        setError("Username is already used");
        return;
      }

      const emailSnap = await get(ref(database, "emails/" + encodedEmail));
      if (emailSnap.exists() && emailSnap.val() !== user.uid) {
        setError("Email is already used");
        return;
      }

      if (oldUsername && oldUsername !== encodedUsername) {
        await remove(ref(database, "usernames/" + oldUsername));
      }
      await set(ref(database, "usernames/" + encodedUsername), user.uid);

      if (oldEmail && oldEmail !== encodedEmail) {
        await remove(ref(database, "emails/" + oldEmail));
      }
      await set(ref(database, "emails/" + encodedEmail), user.uid);

      await updateProfile(user, { displayName: form.username });
      await set(ref(database, "users/" + user.uid + "/username"), form.username);

      if (emailLower !== user.email.toLowerCase()) {
        await updateEmail(user, form.email);
        await set(ref(database, "users/" + user.uid + "/email"), form.email);
      }

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/taskmanager")}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back</span>
          </button>

          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/50 overflow-hidden"
        >
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-indigo-600">
            <h2 className="text-2xl font-bold text-white text-center">
              Edit Profile
            </h2>
            <p className="text-indigo-100 text-center mt-1">
              Update your account information
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Error / Success */}
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-xl border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 font-medium">
                <User className="h-4 w-4 text-indigo-500" />
                <span>Username</span>
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 font-medium">
                <Mail className="h-4 w-4 text-indigo-500" />
                <span>Email</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 font-medium">
                <Lock className="h-4 w-4 text-indigo-500" />
                <span>Current Password</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                name="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your current password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Required to verify your identity before making changes
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/taskmanager")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-gray-300 focus:outline-none"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-indigo-400 shadow-lg shadow-indigo-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Make sure your information is accurate and up to date
          </p>
        </div>
      </div>
    </div>
  );
}