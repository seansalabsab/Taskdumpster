import { useState } from "react";
import { User, Lock, Mail, Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "./firebase";

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleAuth = async () => {
    setError("");
    try {
      if (isRegister) {
        const { email, password, confirmPassword, username } = registerData;

        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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

      onAuthSuccess(); // Navigate to TaskManager.jsx
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Welcome Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-400 via-indigo-500 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/90 via-indigo-500/90 to-blue-600/90"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Welcome to Note Nudge</h1>
            <p className="text-lg text-white/90">
              {isRegister ? "Create an account to start managing tasks" : "Your Personal Task Manager."}
            </p>
          </div>
        </div>
        {/* Decorations */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Title */}
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

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
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
          </div>

          {/* Forgot Password */}
          {!isRegister && (
            <div className="text-right mb-6">
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleAuth}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isRegister ? "CREATE ACCOUNT" : "LOGIN"}
          </button>

          {/* Switch to Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
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
  );
}
