import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ChangePassword() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["Weak", "Fair", "Good", "Strong"];
    const colors = [
      "text-red-500",
      "text-yellow-500",
      "text-blue-500",
      "text-green-500",
    ];

    return {
      strength: (strength / 4) * 100,
      label: labels[strength - 1] || "Weak",
      color: colors[strength - 1] || "text-red-500",
    };
  };

  const passwordStrength = getPasswordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        form.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, form.newPassword);

      setSuccess("Password updated successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("The new password is too weak.");
      } else {
        setError(err.message || "Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/taskmanager")}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back</span>
          </button>

          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/50 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-indigo-600">
            <h2 className="text-2xl font-bold text-white text-center">
              Change Password
            </h2>
            <p className="text-indigo-100 text-center mt-1">
              Update your account security
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Success/Error Messages */}
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

            {/* Current Password Field */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 font-medium">
                <Lock className="h-4 w-4 text-indigo-500" />
                <span>Current Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter your current password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 font-medium">
                <Lock className="h-4 w-4 text-indigo-500" />
                <span>New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.newPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Password strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-400 via-yellow-400 via-blue-400 to-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 font-medium">
                <Lock className="h-4 w-4 text-indigo-500" />
                <span>Confirm New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Confirm your new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.confirmPassword &&
                form.newPassword !== form.confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Passwords do not match</span>
                  </p>
                )}
              {form.confirmPassword &&
                form.newPassword === form.confirmPassword &&
                form.newPassword.length > 0 && (
                  <p className="text-xs text-green-500 flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>Passwords match</span>
                  </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() =>
                  setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                }
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !form.currentPassword ||
                  !form.newPassword ||
                  !form.confirmPassword ||
                  form.newPassword !== form.confirmPassword
                }
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Change Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}