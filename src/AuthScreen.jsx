import { useState } from "react";
import { auth, database } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  // ✅ Separate states
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

  // ✅ Input change handlers
  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // ✅ Auth handler
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

      onAuthSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-indigo-200">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isRegister ? "📝 Register" : "🔑 Login"}
      </h1>

      <div className="w-80 bg-white p-6 rounded-2xl shadow-lg">
        {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

        {isRegister ? (
          <>
            <input
              name="username"
              type="text"
              placeholder="Username"
              value={registerData.username}
              onChange={handleRegisterChange}
              className="w-full px-4 py-2 mb-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={registerData.email}
              onChange={handleRegisterChange}
              className="w-full px-4 py-2 mb-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={registerData.password}
              onChange={handleRegisterChange}
              className="w-full px-4 py-2 mb-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={registerData.confirmPassword}
              onChange={handleRegisterChange}
              className="w-full px-4 py-2 mb-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </>
        ) : (
          <>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleLoginChange}
              className="w-full px-4 py-2 mb-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              className="w-full px-4 py-2 mb-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </>
        )}

        <button
          onClick={handleAuth}
          className="w-full px-6 py-2 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition"
        >
          {isRegister ? "Register" : "Login"}
        </button>

        <p
          className="mt-4 text-sm text-gray-600 cursor-pointer hover:underline text-center"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
}
