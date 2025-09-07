import { useState } from "react";
import { User, Lock, Mail, Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "./firebase";

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetBox, setShowResetBox] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
  if (e) e.preventDefault();
  setError("");
  setMessage("");

  try {
    if (isRegister) {
      const { email, password, confirmPassword, username } = registerData;

      // Username validation (no spaces)
      if (/\s/.test(username)) {
        setError("Username should not contain spaces.");
        return;
      }
      if (username.length < 6) {
        setError("Username must be at least 6 characters long.");
        return;
      }

      // Email validation (basic regex check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      // Password validation
      const passwordRegex =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError(
          "Password must be at least 8 characters long, include one uppercase letter, one number, and one special character."
        );
        return;
      }

      // Confirm password check
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      // Firebase register
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      await set(ref(database, "users/" + user.uid), {
        username,
        email,
        createdAt: new Date().toISOString(),
      });
    } else {
      const { email, password } = loginData;
      await signInWithEmailAndPassword(auth, email, password);
    }

    onAuthSuccess();
  } catch (err) {
    setError(err.message);
  }
};


  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!resetEmail) {
      setError("Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage("Password reset email sent! Please check your inbox.");
      setShowResetBox(false);
      setResetEmail("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative">
      {/* Main Content Wrapper - Apply blur when modal is open */}
      <div
        className={`min-h-screen flex bg-gray-50 transition-all duration-300 ${
          showResetBox ? "filter blur-sm pointer-events-none select-none" : ""
        }`}
      >
        {/* Left Side - Welcome Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-400 via-indigo-500 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/90 via-indigo-500/90 to-blue-600/90"></div>
          <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-2">Welcome to Note Nudge</h1>
              <p className="text-lg text-white/90">
                {isRegister
                  ? "Create an account to start managing tasks"
                  : "Your Personal Task Manager."}
              </p>
            </div>
          </div>
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center">
                <img
                  src="/NNlogo.png"
                  alt="Note Nudge Logo"
                  className="w-33 h-20 mb-4"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isRegister ? "CREATE ACCOUNT" : "LOGIN"}
              </h2>
              <p className="text-gray-600">
                {isRegister ? "Sign up to get started" : "Sign in to your account"}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4 mb-6">
              {isRegister && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={isRegister ? registerData.email : loginData.email}
                  onChange={isRegister ? handleRegisterChange : handleLoginChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={isRegister ? registerData.password : loginData.password}
                  onChange={isRegister ? handleRegisterChange : handleLoginChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {isRegister && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {!isRegister && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetBox(true);
                      setError("");
                      setMessage("");
                    }}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isRegister ? "CREATE ACCOUNT" : "LOGIN"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isRegister
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                    setMessage("");
                  }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  {isRegister ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetBox && (
        <div
          onClick={() => setShowResetBox(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Reset Password
            </h3>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetBox(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
