import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { SUPER_ADMIN_ROLE } from "../role/role.constant";
import { User } from "../user/user.model";
import { Project, ProjectMessage } from "./project.model";

/**
 * Project chat is private to its members. Anyone with `projects.manage` (or
 * super-admin) can see every project; everyone else only sees projects they
 * are a member or lead of.
 */
export const canAccessProject = async (
  projectId: string,
  user: { _id: string; permissions: string[]; isSuperAdmin?: boolean }
): Promise<boolean> => {
  if (user.isSuperAdmin || user.permissions.includes("projects.manage")) {
    return true;
  }

  const project = await Project.findById(projectId).select("members lead");
  if (!project) return false;

  return (
    project.members.some((m) => String(m) === user._id) ||
    String(project.lead) === user._id
  );
};

/** Same check, but resolving the user's role from the database. */
export const canUserAccessProject = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  const user = await User.findById(userId).populate<{
    role: { name: string; permissions: string[] };
  }>("role", "name permissions");
  if (!user) return false;

  return canAccessProject(projectId, {
    _id: userId,
    permissions: user.role?.permissions ?? [],
    isSuperAdmin: user.role?.name === SUPER_ADMIN_ROLE,
  });
};

const assertAccess = async (projectId: string, userId: string) => {
  const allowed = await canUserAccessProject(projectId, userId);
  if (!allowed) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You don't have access to this project"
    );
  }
};

const getMessages = async (
  projectId: string,
  userId: string,
  options: { before?: string; limit?: number }
) => {
  await assertAccess(projectId, userId);

  const filter: Record<string, unknown> = { project: projectId };
  // Cursor pagination: older messages are fetched by createdAt.
  if (options.before) {
    filter.createdAt = { $lt: new Date(options.before) };
  }

  const limit = Math.min(options.limit ?? 30, 100);

  const messages = await ProjectMessage.find(filter)
    .populate("sender", "name email avatar")
    .sort("-createdAt")
    .limit(limit + 1);

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;

  return {
    // Oldest first, so the UI can append without reversing.
    messages: page.reverse(),
    hasMore,
    nextCursor: hasMore ? page[0]?.createdAt : null,
  };
};

const sendMessage = async (
  projectId: string,
  senderId: string,
  payload: { body?: string; attachments?: unknown[]; system?: boolean }
) => {
  if (!payload.body?.trim() && !payload.attachments?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "The message is empty");
  }

  await assertAccess(projectId, senderId);

  const message = await ProjectMessage.create({
    project: projectId,
    sender: senderId,
    body: payload.body?.trim() ?? "",
    attachments: payload.attachments ?? [],
    system: payload.system ?? false,
    readBy: [senderId],
  });

  return message.populate("sender", "name email avatar");
};

/** Posts a system note into the chat, e.g. when the status changes. */
const postSystemMessage = async (
  projectId: string,
  senderId: string,
  body: string
) => {
  const message = await ProjectMessage.create({
    project: projectId,
    sender: senderId,
    body,
    system: true,
    readBy: [senderId],
  });

  return message.populate("sender", "name email avatar");
};

const markRead = async (projectId: string, userId: string) => {
  await ProjectMessage.updateMany(
    { project: projectId, readBy: { $ne: new Types.ObjectId(userId) } },
    { $addToSet: { readBy: userId } }
  );
};

/** Unread counts per project for the sidebar badges. */
const getUnreadCounts = async (userId: string) => {
  const rows = await ProjectMessage.aggregate([
    {
      $match: {
        readBy: { $ne: new Types.ObjectId(userId) },
        sender: { $ne: new Types.ObjectId(userId) },
      },
    },
    { $group: { _id: "$project", count: { $sum: 1 } } },
  ]);

  return Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
};

export const ProjectService = {
  canAccessProject,
  canUserAccessProject,
  getMessages,
  sendMessage,
  postSystemMessage,
  markRead,
  getUnreadCounts,
};
