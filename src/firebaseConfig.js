// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, push, remove, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAHq06bgLaXq6C33DOo4YIz6fNUFZYnQSQ",
  authDomain: "shiritori4-1ed50.firebaseapp.com",
  databaseURL: "https://shiritori4-1ed50-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shiritori4-1ed50",
  storageBucket: "shiritori4-1ed50.firebasestorage.app",
  messagingSenderId: "728138928118",
  appId: "1:728138928118:web:b9f1c023accf18d2af41d7",
  measurementId: "G-F7D4VR8T8P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, get, onValue, push, remove, update };
