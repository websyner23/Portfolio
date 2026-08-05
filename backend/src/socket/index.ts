import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import config from "../config";
import { SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { User } from "../app/modules/user/user.model";
import { verifyToken } from "../app/utils/jwt";

export const ROOM_ADMINS = "admins";
export const roomForUser = (userId: string) => `user:${userId}`;
export const roomForProject = (projectId: string) => `project:${projectId}`;

type TSocketUser = {
  _id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
};

type AuthedSocket = Socket & { data: { user?: TSocketUser } };

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.frontendUrl, config.adminUrl],
      credentials: true,
    },
  });

  /**
   * The access token is sent on the handshake and re-sent on every reconnect,
   * so a rotated token doesn't leave a stale socket authenticated.
   */
  io.use(async (socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Authentication required"));

      const decoded = verifyToken(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.userId).populate<{
        role: { name: string; permissions: string[] };
      }>("role", "name permissions");

      if (!user || user.status === "blocked") {
        return next(new Error("Account is not active"));
      }

      socket.data.user = {
        _id: String(user._id),
        name: user.name,
        permissions: user.role?.permissions ?? [],
        isSuperAdmin: user.role?.name === SUPER_ADMIN_ROLE,
      };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    socket.join(roomForUser(user._id));

    // Anyone who can see the dashboard receives company-wide notifications.
    if (user.isSuperAdmin || user.permissions.includes("dashboard.view")) {
      socket.join(ROOM_ADMINS);
    }

    socket.on("disconnect", () => {
      // Rooms are cleaned up by socket.io automatically.
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io has not been initialized");
  return io;
};

/** Safe emit — no-ops when the socket server isn't running (e.g. in tests). */
export const emitTo = (room: string, event: string, payload: unknown) => {
  io?.to(room).emit(event, payload);
};

/** Notify every admin: fires both a generic bell event and a specific one. */
export const notifyAdmins = (event: string, payload: unknown) => {
  emitTo(ROOM_ADMINS, event, payload);
  emitTo(ROOM_ADMINS, "notification:new", payload);
};
