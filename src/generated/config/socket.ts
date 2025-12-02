import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { verifyToken } from "../../utils/auth";

let io: IOServer | null = null;

export const initSocket = (server: HTTPServer) => {
  if (io) return io;

  io = new IOServer(server, {
    cors: { origin: "http://localhost:3000", credentials: true },
  });

  io.on("connection", (socket) => {
    // Prefer JWT token sent via `auth` (socket handshake)
    const token = (socket.handshake.auth &&
      (socket.handshake.auth as any).token) as string | undefined;
    let userId: string | undefined;

    if (token) {
      try {
        const payload: any = verifyToken(token);
        userId = String(
          payload?.id ?? payload?.userId ?? payload?.sub ?? undefined
        );
      } catch (e) {
        // invalid token; ignore
      }
    }

    // Fallback: allow legacy query param userId
    if (!userId) {
      userId = socket.handshake.query.userId as string | undefined;
    }

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
