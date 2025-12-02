// Minimal Socket.IO client example for the frontend
// Usage: include this in the browser app (e.g., Next.js page) or run as a small script

import { io } from "socket.io-client";

// Replace with your API URL and set `token` (e.g., current user's JWT)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const token = window.__JWT_TOKEN || null; // set by your app (recommended)

// Send token in `auth` so the server can validate it and join the correct room
const socket = io(API_URL, {
  withCredentials: true,
  auth: { token },
});

socket.on("connect", () => {
  console.log("Socket connected", socket.id);
});

socket.on("notification", (payload) => {
  console.log("Received notification:", payload);
  // Optionally fetch latest notifications via API and show UI
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

export default socket;
