import request from "supertest";
import app from "../app";
import { AttendanceSettings } from "../app/modules/attendance/attendance.model";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const PASSWORD = "dashboard12345";

let superToken: string;
let hrToken: string;
let noDashboardToken: string;

const login = async (email: string) => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: PASSWORD });
  return res.body.data.accessToken as string;
};

beforeAll(async () => {
  await connectTestDb();
  await AttendanceSettings.create({ key: "default", timezone: "Asia/Dhaka" });

  const superRole = await Role.create({
    name: SUPER_ADMIN_ROLE,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  });
  // Sees the dashboard and attendance, but no money and no leads.
  const hrRole = await Role.create({
    name: "hr",
    permissions: ["dashboard.view", "attendance.view", "employees.manage"],
    isSystem: true,
  });
  const punchOnlyRole = await Role.create({
    name: "employee",
    permissions: ["attendance.punch"],
    isSystem: true,
  });

  await User.create({
    name: "Super",
    email: "super@websyner.test",
    password: PASSWORD,
    role: superRole._id,
    needsPasswordChange: false,
  });
  await User.create({
    name: "HR",
    email: "hr@websyner.test",
    password: PASSWORD,
    role: hrRole._id,
    needsPasswordChange: false,
  });
  await User.create({
    name: "Employee",
    email: "employee@websyner.test",
    password: PASSWORD,
    role: punchOnlyRole._id,
    needsPasswordChange: false,
  });

  superToken = await login("super@websyner.test");
  hrToken = await login("hr@websyner.test");
  noDashboardToken = await login("employee@websyner.test");
});

afterAll(async () => {
  await closeTestDb();
});

describe("Dashboard", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/dashboard");
    expect(res.status).toBe(401);
  });

  it("requires dashboard.view", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${noDashboardToken}`);

    expect(res.status).toBe(403);
  });

  it("gives a super admin every section", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${superToken}`);

    expect(res.status).toBe(200);
    for (const key of [
      "leads",
      "meetings",
      "attendance",
      "finance",
      "projects",
      "activity",
    ]) {
      expect(res.body.data[key]).not.toBeNull();
    }
  });

  it("withholds sections the role has no permission for", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${hrToken}`);

    expect(res.status).toBe(200);

    // HR can see attendance…
    expect(res.body.data.attendance).not.toBeNull();
    // …but not money, leads, meetings, projects or the audit trail.
    expect(res.body.data.finance).toBeNull();
    expect(res.body.data.leads).toBeNull();
    expect(res.body.data.meetings).toBeNull();
    expect(res.body.data.projects).toBeNull();
    expect(res.body.data.activity).toBeNull();
  });

  it("returns a six-month finance trend for charting", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${superToken}`);

    expect(res.body.data.finance.trend).toHaveLength(6);
    expect(res.body.data.finance.trend[0]).toHaveProperty("income");
    expect(res.body.data.finance.trend[0]).toHaveProperty("expense");
  });

  it("reports today's shift date, not just the calendar date", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${superToken}`);

    expect(res.body.data.attendance.shiftDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.data.month).toBe(res.body.data.today.slice(0, 7));
  });
});
