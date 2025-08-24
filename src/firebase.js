// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // ✅ Import Realtime DB

const firebaseConfig = {
  apiKey: "AIzaSyDQedFBniqkUqatgvOetJDIWs_c9iLabO0",
  authDomain: "studenttaskmanager-c3ee2.firebaseapp.com",
  projectId: "studenttaskmanager-c3ee2",
  storageBucket: "studenttaskmanager-c3ee2.appspot.com",
  messagingSenderId: "27610247126",
  appId: "1:27610247126:web:9a37d4a63a606c2d5f3e77",
  measurementId: "G-SE42WH8TVZ",
  databaseURL: "https://studenttaskmanager-c3ee2-default-rtdb.firebaseio.com", // ✅ Required
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app); // ✅ Export DB instance
export default app;
