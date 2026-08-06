import { Server, Socket } from "socket.io";
import { ProjectService } from "../app/modules/project/project.service";
import { roomForProject } from "./index";

type TSocketUser = {
  _id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
};

type AuthedSocket = Socket & { data: { user?: TSocketUser } };

/**
 * Realtime chat for project rooms.
 *
 * Membership is verified on every join and on every send — a client could
 * otherwise emit into a room it was never allowed to enter.
 */
export const registerProjectChat = (io: Server, socket: AuthedSocket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on("project:join", async (projectId: string, ack?: (ok: boolean) => void) => {
    try {
      const allowed = await ProjectService.canAccessProject(projectId, user);
      if (!allowed) {
        ack?.(false);
        socket.emit("project:error", { message: "No access to that project" });
        return;
      }

      await socket.join(roomForProject(projectId));
      ack?.(true);
    } catch {
      ack?.(false);
    }
  });

  socket.on("project:leave", (projectId: string) => {
    void socket.leave(roomForProject(projectId));
  });

  socket.on(
    "message:send",
    async (
      payload: { projectId: string; body?: string; attachments?: unknown[] },
      ack?: (result: { ok: boolean; error?: string }) => void
    ) => {
      try {
        const message = await ProjectService.sendMessage(
          payload.projectId,
          user._id,
          { body: payload.body, attachments: payload.attachments }
        );

        io.to(roomForProject(payload.projectId)).emit("message:new", {
          projectId: payload.projectId,
          message,
        });

        ack?.({ ok: true });
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Could not send the message";
        ack?.({ ok: false, error });
        socket.emit("project:error", { message: error });
      }
    }
  );

  socket.on("message:read", async (projectId: string) => {
    try {
      if (!(await ProjectService.canAccessProject(projectId, user))) return;
      await ProjectService.markRead(projectId, user._id);
    } catch {
      // Read receipts are best-effort.
    }
  });

  // Typing indicators are broadcast to everyone else in the room.
  socket.on("typing", async (payload: { projectId: string; typing: boolean }) => {
    if (!(await ProjectService.canAccessProject(payload.projectId, user))) return;

    socket.to(roomForProject(payload.projectId)).emit("typing", {
      projectId: payload.projectId,
      userId: user._id,
      name: user.name,
      typing: payload.typing,
    });
  });
};
