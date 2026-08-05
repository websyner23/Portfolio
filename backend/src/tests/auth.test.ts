import request from "supertest";
import app from "../app";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { AuditLog } from "../app/modules/auditLog/auditLog.model";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const SUPER_EMAIL = "super@websyner.test";
const SUPER_PASSWORD = "super12345";
const LIMITED_EMAIL = "limited@websyner.test";
const LIMITED_PASSWORD = "limited12345";

beforeAll(async () => {
  await connectTestDb();

  const superRole = await Role.create({
    name: SUPER_ADMIN_ROLE,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  });
  const limitedRole = await Role.create({
    name: "employee",
    permissions: ["attendance.punch"],
    isSystem: true,
  });

  await User.create({
    name: "Super Admin",
    email: SUPER_EMAIL,
    password: SUPER_PASSWORD,
    role: superRole._id,
    needsPasswordChange: false,
  });
  await User.create({
    name: "Limited User",
    email: LIMITED_EMAIL,
    password: LIMITED_PASSWORD,
    role: limitedRole._id,
    needsPasswordChange: false,
  });
});

afterAll(async () => {
  await closeTestDb();
});

const login = async (email: string, password: string) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

describe("Health", () => {
  it("responds on /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Auth", () => {
  it("rejects a bad password without leaking which field was wrong", async () => {
    const res = await login(SUPER_EMAIL, "wrong-password");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("rejects an unknown email with the same message", async () => {
    const res = await login("nobody@websyner.test", SUPER_PASSWORD);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("logs in, returns an access token + user, and sets the refresh cookie", async () => {
    const res = await login(SUPER_EMAIL, SUPER_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(SUPER_EMAIL);
    expect(res.body.data.user.role.name).toBe(SUPER_ADMIN_ROLE);

    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
  });

  it("validates the login payload with zod", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.errorSources.length).toBeGreaterThan(0);
  });

  it("exchanges the refresh cookie for a fresh access token", async () => {
    const loginRes = await login(SUPER_EMAIL, SUPER_PASSWORD);
    const cookies = loginRes.headers["set-cookie"] as unknown as string[];

    const res = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it("returns the current profile from /auth/me", async () => {
    const { body } = await login(SUPER_EMAIL, SUPER_PASSWORD);
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(SUPER_EMAIL);
    expect(res.body.data.role.permissions).toContain("cms.manage");
  });

  it("records login and logout in the audit trail with device info", async () => {
    const loginRes = await login(SUPER_EMAIL, SUPER_PASSWORD);
    const cookies = loginRes.headers["set-cookie"] as unknown as string[];

    await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookies)
      .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120");

    // recordAudit is fire-and-forget; give it a tick to flush.
    await new Promise((r) => setTimeout(r, 250));

    const loginEntry = await AuditLog.findOne({ action: "auth.login" });
    const logoutEntry = await AuditLog.findOne({ action: "auth.logout" });

    expect(loginEntry).not.toBeNull();
    expect(loginEntry?.module).toBe("auth");
    expect(loginEntry?.device?.browser).toBeTruthy();
    expect(logoutEntry).not.toBeNull();
  });
});

describe("Authorization (RBAC)", () => {
  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/v1/roles");
    expect(res.status).toBe(401);
  });

  it("rejects a tampered token", async () => {
    const res = await request(app)
      .get("/api/v1/roles")
      .set("Authorization", "Bearer not.a.real.token");
    expect(res.status).toBe(401);
  });

  it("forbids a user whose role lacks the permission", async () => {
    const { body } = await login(LIMITED_EMAIL, LIMITED_PASSWORD);
    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${body.data.accessToken}`);

    expect(res.status).toBe(403);
  });

  it("allows super-admin through every permission gate", async () => {
    const { body } = await login(SUPER_EMAIL, SUPER_PASSWORD);
    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta).toHaveProperty("totalPage");
  });
});

describe("Roles", () => {
  let token: string;

  beforeAll(async () => {
    const { body } = await login(SUPER_EMAIL, SUPER_PASSWORD);
    token = body.data.accessToken;
  });

  it("serves the permission catalog for the admin matrix", async () => {
    const res = await request(app)
      .get("/api/v1/roles/permissions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.all).toEqual(expect.arrayContaining(["cms.manage"]));
    expect(Object.keys(res.body.data.groups).length).toBeGreaterThan(5);
  });

  it("creates a role and rejects unknown permissions", async () => {
    const ok = await request(app)
      .post("/api/v1/roles")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "content-editor", permissions: ["cms.manage"] });
    expect(ok.status).toBe(201);

    const bad = await request(app)
      .post("/api/v1/roles")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "bogus-role", permissions: ["not.a.permission"] });
    expect(bad.status).toBe(400);
  });

  it("refuses to modify the super-admin role", async () => {
    const role = await Role.findOne({ name: SUPER_ADMIN_ROLE });
    const res = await request(app)
      .patch(`/api/v1/roles/${role?._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ permissions: [] });

    expect(res.status).toBe(403);
  });

  it("paginates with QueryBuilder meta", async () => {
    const res = await request(app)
      .get("/api/v1/roles?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
  });

  it("searches roles by name", async () => {
    const res = await request(app)
      .get("/api/v1/roles?searchTerm=content")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("content-editor");
  });
});

describe("Not found handler", () => {
  it("returns a structured 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
