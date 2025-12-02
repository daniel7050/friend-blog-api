import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// A tiny React widget demonstrating connecting to backend Socket.IO and
// showing live notifications. Replace `API_URL` and provide `token`.
export default function NotificationWidget({
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  token = null,
}) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function fetchNotifications() {
      try {
        const res = await fetch(`${apiUrl}/api/notifications`, {
          credentials: "include",
        });
        const data = await res.json();
        if (mounted) setNotifications(data.notifications || []);
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    }

    fetchNotifications();

    const socket = io(apiUrl, { withCredentials: true, auth: { token } });
    socket.on("notification", (n) => {
      setNotifications((prev) => [n, ...prev]);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [apiUrl, token]);

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, width: 320 }}>
      <h4>Notifications</h4>
      {notifications.length === 0 && <div>No notifications</div>}
      <ul>
        {notifications.map((n) => (
          <li key={n.id}>
            <strong>{n.type}</strong>: {JSON.stringify(n.data)}{" "}
            {n.read ? "(read)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
