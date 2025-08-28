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
      // Reauthenticate user
      const cred = EmailAuthProvider.credential(user.email, form.currentPassword);
      await reauthenticateWithCredential(user, cred);

      const usernameLower = form.username.toLowerCase();
      const emailLower = form.email.toLowerCase();

      const encodedUsername = encodeKey(usernameLower);
      const encodedEmail = encodeKey(emailLower);
      const oldUsername = user.displayName ? encodeKey(user.displayName.toLowerCase()) : "";
      const oldEmail = user.email ? encodeKey(user.email.toLowerCase()) : "";

      // Check username uniqueness
      const nameSnap = await get(ref(database, "usernames/" + encodedUsername));
      if (nameSnap.exists() && nameSnap.val() !== user.uid) {
        setError("Username is already used");
        return;
      }

      // Check email uniqueness
      const emailSnap = await get(ref(database, "emails/" + encodedEmail));
      if (emailSnap.exists() && emailSnap.val() !== user.uid) {
        setError("Email is already used");
        return;
      }

      // Update username mapping
      if (oldUsername && oldUsername !== encodedUsername) {
        await remove(ref(database, "usernames/" + oldUsername));
      }
      await set(ref(database, "usernames/" + encodedUsername), user.uid);

      // Update email mapping
      if (oldEmail && oldEmail !== encodedEmail) {
        await remove(ref(database, "emails/" + oldEmail));
      }
      await set(ref(database, "emails/" + encodedEmail), user.uid);

      // Update user profile
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-indigo-100 p-6">
      {/* ✅ Use navigate instead of onBack */}
      <button
        onClick={() => navigate("/taskmanager")}
        className="self-start mb-4 text-indigo-500 hover:underline"
      >
        ← Back
      </button>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <div>
          <label className="block text-gray-600 mb-1">Username</label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Current Password*</label>
          <input
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 rounded-xl hover:bg-indigo-600"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
