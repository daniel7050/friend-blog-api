import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export const initSocket = (server: HTTPServer) => {
  if (io) return io;

  io = new IOServer(server, {
    cors: { origin: "http://localhost:3000", credentials: true },
  });

  io.on("connection", (socket) => {
    // If client provides a userId query param, join a room for that user
    const userId = socket.handshake.query.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {
      // noop for now
    });
  });

  return io;
};

export const getIO = () => io;

export const safeEmit = (room: string, event: string, payload: unknown) => {
  if (!io) return;
  io.to(room).emit(event, payload);
};
