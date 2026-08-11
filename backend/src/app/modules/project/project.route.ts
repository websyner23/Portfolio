import { Router } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SUPER_ADMIN_ROLE } from "../role/role.constant";
import { recordAudit } from "../auditLog/auditLog.utils";
import {
  Project,
  PROJECT_STATUSES,
  ProjectMessage,
  TASK_STATUSES,
  nextProjectCode,
} from "./project.model";
import { ProjectService } from "./project.service";

const router = Router();
const VIEW = ["projects.view", "projects.manage"] as const;
const MANAGE = "projects.manage";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));

const projectSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2).max(120),
    code: z.string().max(20).optional(),
    client: z
      .object({
        name: z.string().max(120).optional().or(z.literal("")),
        email: z.string().email().optional().or(z.literal("")),
        company: z.string().max(120).optional().or(z.literal("")),
      })
      .optional(),
    description: z.string().max(4000).optional().or(z.literal("")),
    status: z.enum(PROJECT_STATUSES).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    startDate: isoDate,
    deadline: isoDate,
    budgetAmount: z.number().min(0).optional(),
    members: z.array(z.string()).optional(),
    lead: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

/** Non-managers only ever see projects they belong to. */
const visibilityFilter = (user: {
  _id: string;
  role: { name: string; permissions: string[] };
}) => {
  const isManager =
    user.role.name === SUPER_ADMIN_ROLE ||
    user.role.permissions.includes("projects.manage");

  return isManager
    ? {}
    : { $or: [{ members: user._id }, { lead: user._id }] };
};

router.get(
  "/",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const query = { ...req.query };

    // Archived projects stay out of the way unless explicitly asked for.
    const includeArchived = query.archived === "true";
    delete query.archived;

    const filter = {
      ...visibilityFilter(req.user),
      ...(includeArchived ? {} : { archivedAt: { $exists: false } }),
    };

    const qb = new QueryBuilder(
      Project.find(filter)
        .populate("members", "name email avatar")
        .populate("lead", "name email avatar"),
      { limit: 50, sort: "-createdAt", ...query }
    )
      .search(["name", "code", "client.name", "client.company"])
      .filter()
      .sort()
      .paginate();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();
    const unread = await ProjectService.getUnreadCounts(req.user._id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Projects retrieved",
      meta,
      data: { projects: data, unread },
    });
  })
);

router.post(
  "/",
  auth(MANAGE),
  validateRequest(projectSchema),
  catchAsync(async (req, res) => {
    const project = await Project.create({
      ...req.body,
      code: req.body.code || (await nextProjectCode()),
      createdBy: req.user._id,
    });

    recordAudit(req, {
      user: req.user._id,
      action: "project.create",
      module: "projects",
      targetId: String(project._id),
      description: `Created project "${project.name}" (${project.code})`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Project created",
      data: project,
    });
  })
);

router.get(
  "/:id",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const allowed = await ProjectService.canUserAccessProject(
      req.params.id,
      req.user._id
    );
    if (!allowed) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You don't have access to this project"
      );
    }

    const project = await Project.findById(req.params.id)
      .populate("members", "name email avatar")
      .populate("lead", "name email avatar")
      .populate("tasks.assignee", "name avatar");
    if (!project) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Project retrieved",
      data: project,
    });
  })
);

router.patch(
  "/:id",
  auth(MANAGE),
  validateRequest(z.object({ body: projectSchema.shape.body.partial() })),
  catchAsync(async (req, res) => {
    const before = await Project.findById(req.params.id);
    if (!before) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("members", "name email avatar")
      .populate("lead", "name email avatar");

    // A status change is worth a note in the chat so members see it in context.
    if (req.body.status && req.body.status !== before.status) {
      await ProjectService.postSystemMessage(
        req.params.id,
        req.user._id,
        `${req.user.name} changed the status from ${before.status} to ${req.body.status}`
      );
    }

    recordAudit(req, {
      user: req.user._id,
      action: "project.update",
      module: "projects",
      targetId: req.params.id,
      description: `Updated project "${project?.name}"`,
      meta: { changes: Object.keys(req.body ?? {}) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Project updated",
      data: project,
    });
  })
);

router.delete(
  "/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    /**
     * Archived, not deleted. Chat is a record of what was said and decided —
     * destroying it with the project would lose history nobody can recover,
     * so the project is hidden from the active list instead and its messages
     * are left intact.
     */
    project.status = "cancelled";
    project.archivedAt = new Date();
    await project.save();

    const messageCount = await ProjectMessage.countDocuments({
      project: req.params.id,
    });

    recordAudit(req, {
      user: req.user._id,
      action: "project.archive",
      module: "projects",
      targetId: req.params.id,
      description: `Archived project "${project.name}" — ${messageCount} chat message(s) kept`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `Project archived — its ${messageCount} chat message(s) are preserved`,
      data: project,
    });
  })
);

/** Brings an archived project back into the active list. */
router.post(
  "/:id/restore",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    project.archivedAt = undefined;
    project.status = "active";
    await project.save();

    recordAudit(req, {
      user: req.user._id,
      action: "project.restore",
      module: "projects",
      targetId: req.params.id,
      description: `Restored project "${project.name}"`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Project restored",
      data: project,
    });
  })
);

/* --------------------------------- Tasks --------------------------------- */

const taskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).min(1).max(200),
    status: z.enum(TASK_STATUSES).optional(),
    assignee: z.string().optional(),
    dueDate: isoDate,
  }),
});

router.post(
  "/:id/tasks",
  auth(MANAGE),
  validateRequest(taskSchema),
  catchAsync(async (req, res) => {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { tasks: req.body } },
      { new: true, runValidators: true }
    ).populate("tasks.assignee", "name avatar");
    if (!project) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Task added",
      data: project,
    });
  })
);

router.patch(
  "/:id/tasks/:taskId",
  auth(MANAGE),
  validateRequest(z.object({ body: taskSchema.shape.body.partial() })),
  catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    const task = project.tasks.id(req.params.taskId);
    if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");

    Object.assign(task, req.body);
    await project.save();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Task updated",
      data: project,
    });
  })
);

router.delete(
  "/:id/tasks/:taskId",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { tasks: { _id: req.params.taskId } } },
      { new: true }
    );
    if (!project) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Task removed",
      data: project,
    });
  })
);

/* --------------------------------- Chat --------------------------------- */
/* Messages are sent over the socket; these endpoints load history. */

router.get(
  "/:id/messages",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const result = await ProjectService.getMessages(req.params.id, req.user._id, {
      before: req.query.before as string | undefined,
      limit: Number(req.query.limit) || 30,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Messages retrieved",
      data: result,
    });
  })
);

/** REST fallback for sending, so chat still works if the socket drops. */
router.post(
  "/:id/messages",
  auth(...VIEW),
  validateRequest(
    z.object({
      body: z.object({
        body: z.string().max(4000).optional(),
        attachments: z.array(z.record(z.unknown())).optional(),
      }),
    })
  ),
  catchAsync(async (req, res) => {
    const message = await ProjectService.sendMessage(
      req.params.id,
      req.user._id,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Message sent",
      data: message,
    });
  })
);

router.patch(
  "/:id/messages/read",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    await ProjectService.markRead(req.params.id, req.user._id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Messages marked as read",
    });
  })
);

export const ProjectRoutes = router;
