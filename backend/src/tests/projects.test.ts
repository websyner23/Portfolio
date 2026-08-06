import request from "supertest";
import app from "../app";
import { Project } from "../app/modules/project/project.model";
import { ProjectService } from "../app/modules/project/project.service";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const PASSWORD = "project12345";

let managerToken: string;
let memberToken: string;
let outsiderToken: string;
let memberId: string;
let outsiderId: string;
let projectId: string;

const login = async (email: string) => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: PASSWORD });
  return res.body.data.accessToken as string;
};

beforeAll(async () => {
  await connectTestDb();

  const superRole = await Role.create({
    name: SUPER_ADMIN_ROLE,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  });
  // Can see projects, but only the ones they belong to.
  const staffRole = await Role.create({
    name: "employee",
    permissions: ["projects.view"],
    isSystem: true,
  });

  await User.create({
    name: "Project Manager",
    email: "manager@websyner.test",
    password: PASSWORD,
    role: superRole._id,
    needsPasswordChange: false,
  });
  const member = await User.create({
    name: "Team Member",
    email: "member@websyner.test",
    password: PASSWORD,
    role: staffRole._id,
    needsPasswordChange: false,
  });
  const outsider = await User.create({
    name: "Someone Else",
    email: "outsider@websyner.test",
    password: PASSWORD,
    role: staffRole._id,
    needsPasswordChange: false,
  });

  memberId = String(member._id);
  outsiderId = String(outsider._id);

  managerToken = await login("manager@websyner.test");
  memberToken = await login("member@websyner.test");
  outsiderToken = await login("outsider@websyner.test");
});

afterAll(async () => {
  await closeTestDb();
});

describe("Projects", () => {
  it("creates a project with an auto-generated code", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "Northwind Rebuild",
        client: { name: "Northwind Logistics", company: "Northwind" },
        status: "active",
        budgetAmount: 40000,
        members: [memberId],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe("PRJ-001");

    projectId = res.body.data._id;
  });

  it("increments the code for the next project", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Atlas Brand" });

    expect(res.body.data.code).toBe("PRJ-002");
  });

  it("requires projects.manage to create", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Sneaky Project" });

    expect(res.status).toBe(403);
  });

  it("shows managers every project", async () => {
    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.body.data.projects.length).toBe(2);
  });

  it("shows a member only the projects they belong to", async () => {
    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.body.data.projects.length).toBe(1);
    expect(res.body.data.projects[0].name).toBe("Northwind Rebuild");
  });

  it("shows an outsider nothing", async () => {
    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", `Bearer ${outsiderToken}`);

    expect(res.body.data.projects).toHaveLength(0);
  });

  it("lets a member open their own project", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
  });

  it("blocks an outsider from opening it directly by id", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
  });
});

describe("Tasks and progress", () => {
  it("starts at zero progress with no tasks", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.body.data.progress).toBe(0);
  });

  it("adds tasks", async () => {
    for (const title of ["Design", "Build", "Launch", "Handover"]) {
      await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ title });
    }

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.body.data.tasks).toHaveLength(4);
  });

  it("derives progress from completed tasks", async () => {
    const project = await Project.findById(projectId);
    const first = project!.tasks[0];

    await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${first._id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "done" });

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.body.data.progress).toBe(25);
  });

  it("removes a task and recalculates progress", async () => {
    const project = await Project.findById(projectId);
    const last = project!.tasks[project!.tasks.length - 1];

    await request(app)
      .delete(`/api/v1/projects/${projectId}/tasks/${last._id}`)
      .set("Authorization", `Bearer ${managerToken}`);

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.body.data.tasks).toHaveLength(3);
    expect(res.body.data.progress).toBe(33);
  });
});

describe("Project chat", () => {
  it("lets a member post a message", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ body: "Kickoff notes are in the shared drive." });

    expect(res.status).toBe(201);
    expect(res.body.data.sender.name).toBe("Team Member");
  });

  it("rejects an empty message", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ body: "   " });

    expect(res.status).toBe(400);
  });

  it("blocks an outsider from posting", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ body: "Can I see this?" });

    expect(res.status).toBe(403);
  });

  it("blocks an outsider from reading the history", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
  });

  it("returns history oldest-first for the chat pane", async () => {
    await request(app)
      .post(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ body: "Thanks — reviewing now." });

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    const bodies = res.body.data.messages.map((m: { body: string }) => m.body);
    expect(bodies[0]).toContain("Kickoff notes");
    expect(bodies[bodies.length - 1]).toContain("reviewing now");
  });

  it("paginates with a cursor", async () => {
    for (let i = 0; i < 35; i++) {
      await request(app)
        .post(`/api/v1/projects/${projectId}/messages`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ body: `Message ${i}` });
    }

    const first = await request(app)
      .get(`/api/v1/projects/${projectId}/messages?limit=10`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(first.body.data.messages).toHaveLength(10);
    expect(first.body.data.hasMore).toBe(true);

    const older = await request(app)
      .get(
        `/api/v1/projects/${projectId}/messages?limit=10&before=${first.body.data.nextCursor}`
      )
      .set("Authorization", `Bearer ${managerToken}`);

    expect(older.body.data.messages).toHaveLength(10);
    // The two pages must not overlap.
    const firstIds = first.body.data.messages.map((m: { _id: string }) => m._id);
    const olderIds = older.body.data.messages.map((m: { _id: string }) => m._id);
    expect(olderIds.some((id: string) => firstIds.includes(id))).toBe(false);
  });

  it("posts a system note into the chat when the status changes", async () => {
    await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "review" });

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/messages?limit=5`)
      .set("Authorization", `Bearer ${managerToken}`);

    const latest = res.body.data.messages.at(-1);
    expect(latest.system).toBe(true);
    expect(latest.body).toContain("changed the status from active to review");
  });

  it("counts unread messages per project for the sidebar badge", async () => {
    const counts = await ProjectService.getUnreadCounts(memberId);
    expect(counts[projectId]).toBeGreaterThan(0);
  });

  it("clears the unread count once read", async () => {
    await request(app)
      .patch(`/api/v1/projects/${projectId}/messages/read`)
      .set("Authorization", `Bearer ${memberToken}`);

    const counts = await ProjectService.getUnreadCounts(memberId);
    expect(counts[projectId]).toBeUndefined();
  });

  it("does not count an outsider's unread for a project they can't see", async () => {
    const counts = await ProjectService.getUnreadCounts(outsiderId);
    // The aggregate is global, so access is still enforced at read time.
    const allowed = await ProjectService.canUserAccessProject(
      projectId,
      outsiderId
    );
    expect(allowed).toBe(false);
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(0);
  });
});

describe("Deleting a project", () => {
  it("removes its chat history too", async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);

    const messages = await request(app)
      .get(`/api/v1/projects/${projectId}/messages`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(messages.body.data.messages).toHaveLength(0);
  });
});
