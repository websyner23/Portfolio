import { model, Schema } from "mongoose";

export const PROJECT_STATUSES = [
  "proposal",
  "active",
  "on-hold",
  "review",
  "completed",
  "cancelled",
] as const;

export const TASK_STATUSES = ["todo", "in-progress", "review", "done"] as const;

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, trim: true },
    client: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      company: { type: String, default: "" },
    },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "proposal",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    startDate: { type: String, default: "" }, // YYYY-MM-DD
    deadline: { type: String, default: "" },
    budgetAmount: { type: Number, default: 0 },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lead: { type: Schema.Types.ObjectId, ref: "User" },
    tasks: [
      {
        title: { type: String, required: true },
        status: { type: String, enum: TASK_STATUSES, default: "todo" },
        assignee: { type: Schema.Types.ObjectId, ref: "User" },
        dueDate: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: { type: [String], default: [] },
    // Publish a finished project to the public portfolio.
    portfolioItem: { type: Schema.Types.ObjectId, ref: "Portfolio" },
    // Projects are archived rather than deleted so their chat history survives.
    archivedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/** Progress is derived from tasks so it can never contradict the board. */
projectSchema.virtual("progress").get(function () {
  if (!this.tasks?.length) return 0;
  const done = this.tasks.filter((t) => t.status === "done").length;
  return Math.round((done / this.tasks.length) * 100);
});

projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

export const Project = model("Project", projectSchema);

/** Generates the next project code, e.g. PRJ-001 → PRJ-002. */
export const nextProjectCode = async (): Promise<string> => {
  const latest = await Project.findOne({ code: /^PRJ-\d+$/ })
    .sort({ code: -1 })
    .select("code");

  const current = latest?.code ? Number(latest.code.split("-")[1]) : 0;
  return `PRJ-${String(current + 1).padStart(3, "0")}`;
};

const projectMessageSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, default: "" },
    attachments: [
      { _id: false, url: String, name: String, mime: String, size: Number },
    ],
    // Set when the server posts on someone's behalf, e.g. status changes.
    system: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

projectMessageSchema.index({ project: 1, createdAt: -1 });

export const ProjectMessage = model("ProjectMessage", projectMessageSchema);
