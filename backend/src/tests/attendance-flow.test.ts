import request from "supertest";
import app from "../app";
import { Attendance, AttendanceSettings } from "../app/modules/attendance/attendance.model";
import { AttendanceService } from "../app/modules/attendance/attendance.service";
import {
  instantAt,
  localDateOf,
  resolveShiftDate,
} from "../app/modules/attendance/attendance.utils";
import { Employee } from "../app/modules/employee/employee.model";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const EMAIL = "hr@websyner.test";
const PASSWORD = "hr12345678";
const TZ = "Asia/Dhaka";

let token: string;
let employeeId: string;

/**
 * Employees are always created from a login account, so tests provision the
 * user first and let the employee inherit its name and email.
 */
const makeEmployee = async (
  fields: {
    fullName: string;
    email: string;
    password?: string;
  } & Record<string, unknown>
) => {
  const { fullName, email, password, ...employeeFields } = fields;

  const role =
    (await Role.findOne({ name: "employee" })) ??
    (await Role.create({
      name: "employee",
      permissions: ["attendance.punch"],
      isSystem: true,
    }));

  const user = await request(app)
    .post("/api/v1/users")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: fullName,
      email,
      role: String(role._id),
      password: password ?? "employee12345",
    });

  return request(app)
    .post("/api/v1/employees")
    .set("Authorization", `Bearer ${token}`)
    .send({ ...employeeFields, user: user.body.data.user._id });
};

/** Records a completed shift directly, as the punch flow would produce it. */
const recordShift = async (
  employee: string,
  shiftDate: string,
  inTime: string,
  outTime: string,
  outNextDay = true
) => {
  const rules = await AttendanceService.getRules();
  const outDate = outNextDay
    ? new Date(new Date(`${shiftDate}T00:00:00Z`).getTime() + 86400000)
        .toISOString()
        .slice(0, 10)
    : shiftDate;

  await AttendanceService.createRecord(
    {
      employee,
      shiftDate,
      sessions: [
        { in: instantAt(shiftDate, inTime, rules.timezone).toISOString(),
          out: instantAt(outDate, outTime, rules.timezone).toISOString() },
      ],
    },
    "000000000000000000000000"
  );
};

beforeAll(async () => {
  await connectTestDb();

  const role = await Role.create({
    name: SUPER_ADMIN_ROLE,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  });
  await User.create({
    name: "HR Admin",
    email: EMAIL,
    password: PASSWORD,
    role: role._id,
    needsPasswordChange: false,
  });

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: EMAIL, password: PASSWORD });
  token = login.body.data.accessToken;

  await AttendanceSettings.create({
    key: "default",
    timezone: TZ,
    shiftStart: "22:00",
    shiftEnd: "01:00",
    overnightCutoff: "06:00",
    graceMinutes: 10,
    requiredDailyMinutes: 180,
    optionalWeekdays: [5, 6],
    defaultBaseSalary: 4000,
    defaultPerfectBonus: 1000,
  });
});

afterAll(async () => {
  await closeTestDb();
});

describe("Employees", () => {
  it("creates an employee with an auto-generated id and salary defaults", async () => {
    const res = await makeEmployee({
        fullName: "Shadin",
        email: "shadin@websyner.test",
        designation: "Developer",
        joinDate: "2026-07-01",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.employeeId).toBe("WS-001");
    expect(res.body.data.baseSalary).toBe(4000);
    expect(res.body.data.perfectBonus).toBe(1000);

    employeeId = res.body.data._id;
  });

  it("increments the id for the next employee", async () => {
    const res = await makeEmployee({
        fullName: "Jahid",
        email: "jahid@websyner.test",
        joinDate: "2026-07-01",
      });

    expect(res.body.data.employeeId).toBe("WS-002");
  });

  it("refuses to give one login two employee records", async () => {
    const linkedUser = await User.findOne({ email: "shadin@websyner.test" });

    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({ user: String(linkedUser?._id), joinDate: "2026-07-01" });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already has an employee record");
  });

  it("takes name and email from the login rather than the request", async () => {
    const res = await makeEmployee({
      fullName: "Nadia Islam",
      email: "nadia@websyner.test",
      joinDate: "2026-07-01",
      // These are ignored — identity comes from the account.
      fullNameOverride: "Someone Else",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.fullName).toBe("Nadia Islam");
    expect(res.body.data.email).toBe("nadia@websyner.test");
    expect(res.body.data.user).toBeTruthy();
  });

  it("links the punch panel automatically on creation", async () => {
    const employee = await Employee.findOne({ email: "nadia@websyner.test" });
    const user = await User.findOne({ email: "nadia@websyner.test" });

    expect(String(user?.employee)).toBe(String(employee?._id));
    expect(String(employee?.user)).toBe(String(user?._id));
  });

  it("deactivates rather than deletes, preserving history", async () => {
    const list = await request(app)
      .get("/api/v1/employees?searchTerm=Jahid")
      .set("Authorization", `Bearer ${token}`);
    const id = list.body.data[0]._id;

    const res = await request(app)
      .delete(`/api/v1/employees/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
    expect(await Employee.findById(id)).not.toBeNull();
  });
});

describe("Monthly summary reproduces the HRM sheet's figures", () => {
  beforeAll(async () => {
    // July 2026: the 6th–9th are Mon–Thu; the 10th is a Friday (optional).
    await recordShift(employeeId, "2026-07-06", "22:00", "01:00"); // present
    await recordShift(employeeId, "2026-07-07", "22:30", "01:30"); // late but full
    await recordShift(employeeId, "2026-07-08", "22:00", "23:30", false); // incomplete
    await recordShift(employeeId, "2026-07-10", "22:00", "23:00", false); // optional Friday
  });

  it("classifies each day correctly", async () => {
    const records = await Attendance.find({ employee: employeeId }).sort("shiftDate");
    const byDate = Object.fromEntries(records.map((r) => [r.shiftDate, r]));

    expect(byDate["2026-07-06"].status).toBe("present");
    expect(byDate["2026-07-06"].workedMinutes).toBe(180);

    expect(byDate["2026-07-07"].status).toBe("late");
    expect(byDate["2026-07-07"].lateMinutes).toBe(20); // 22:30 minus 10 min grace

    expect(byDate["2026-07-08"].status).toBe("incomplete");
    expect(byDate["2026-07-08"].workedMinutes).toBe(90);

    // Friday work is never penalised
    expect(byDate["2026-07-10"].status).toBe("optional-off");
  });

  it("produces per-employee monthly totals", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/summary?month=2026-07")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const row = res.body.data.rows.find(
      (r: { employee: { _id: string } }) => r.employee._id === employeeId
    );

    expect(row.presentDays).toBe(1);
    expect(row.lateDays).toBe(1);
    expect(row.incompleteDays).toBe(1);
    // Optional-day minutes count toward hours but not scheduled days.
    expect(row.totalWorkMinutes).toBe(180 + 180 + 90 + 60);
    expect(row.bonusEligible).toBe(false);
    expect(row.netPayable).toBe(4000); // no bonus
  });

  it("formats work time as h:mm like the sheet", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/summary?month=2026-07")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.totals.totalWorkLabel).toMatch(/^\d+:\d{2}$/);
  });

  it("reports company-wide totals and payroll", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/summary?month=2026-07")
      .set("Authorization", `Bearer ${token}`);

    const totals = res.body.data.totals;
    // Counts cover every active employee, so assert the figures this suite
    // actually drives rather than a fixture-sensitive headcount.
    expect(totals.activeEmployees).toBeGreaterThanOrEqual(1);
    expect(totals.lateDays).toBe(1);
    expect(totals.totalPayroll).toBeGreaterThan(0);
    expect(res.body.data.currency).toBe("BDT");
  });
});

describe("In-progress days are never counted as absent", () => {
  it("stops the current month at the last fully-elapsed shift", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/summary")
      .set("Authorization", `Bearer ${token}`);

    const rules = await AttendanceService.getRules();
    const currentShift = resolveShiftDate(new Date(), rules);

    // Today's shift may still be running, so it must fall outside the window.
    expect(res.body.data.upTo < currentShift).toBe(true);
  });

  it("reports no absences for a brand-new employee joining today", async () => {
    const rules = await AttendanceService.getRules();
    const todayLocal = localDateOf(new Date(), rules.timezone);

    const created = await makeEmployee({
        fullName: "Fresh Start",
        email: "fresh@websyner.test",
        joinDate: todayLocal,
      });

    const res = await request(app)
      .get(`/api/v1/attendance/summary?month=${todayLocal.slice(0, 7)}`)
      .set("Authorization", `Bearer ${token}`);

    const row = res.body.data.rows.find(
      (r: { employee: { _id: string } }) =>
        r.employee._id === created.body.data._id
    );

    expect(row.scheduledDays).toBe(0);
    expect(row.absentDays).toBe(0);
  });
});

describe("Daily sheet and finalization", () => {
  it("shows every active employee for a date", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/daily?date=2026-07-06")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.shiftDate).toBe("2026-07-06");
    expect(res.body.data.rows.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.rows[0].workedLabel).toBe("3:00");
  });

  it("flags optional days on the daily sheet", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/daily?date=2026-07-10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.isOptionalDay).toBe(true);
  });

  it("marks employees absent when finalizing a day they missed", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/finalize")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-07-09" });

    expect(res.status).toBe(200);
    expect(res.body.data.absentMarked).toBeGreaterThanOrEqual(1);

    const record = await Attendance.findOne({
      employee: employeeId,
      shiftDate: "2026-07-09",
    });
    expect(record?.status).toBe("absent");
    expect(record?.source).toBe("system");
  });

  it("does not double-mark an already finalized day", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/finalize")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-07-09" });

    expect(res.body.data.absentMarked).toBe(0);
  });
});

describe("Perfect attendance bonus", () => {
  it("pays the bonus for a clean month", async () => {
    const clean = await makeEmployee({
        fullName: "Perfect Person",
        email: "perfect@websyner.test",
        // A short engagement, so the employment window is exactly the three
        // days below — every scheduled day is one they actually worked.
        joinDate: "2026-06-01",
        lastWorkingDate: "2026-06-03",
      });
    const id = clean.body.data._id;

    // June 2026: the 1st–3rd are Mon–Wed, all working days.
    await recordShift(id, "2026-06-01", "22:00", "01:00");
    await recordShift(id, "2026-06-02", "22:00", "01:00");
    await recordShift(id, "2026-06-03", "22:00", "01:00");

    const res = await request(app)
      .get("/api/v1/attendance/summary?month=2026-06")
      .set("Authorization", `Bearer ${token}`);

    const row = res.body.data.rows.find(
      (r: { employee: { _id: string } }) => r.employee._id === id
    );

    // Only days up to "today" count, so nothing after the 3rd is an absence.
    expect(row.lateDays).toBe(0);
    expect(row.incompleteDays).toBe(0);
    expect(row.scheduledDays).toBe(3);
    expect(row.absentDays).toBe(0);
    expect(row.bonusEligible).toBe(true);
    expect(row.netPayable).toBe(5000); // 4000 base + 1000 bonus
  });
});

describe("Leave", () => {
  it("records and approves leave, then counts it in the summary", async () => {
    const created = await request(app)
      .post("/api/v1/attendance/leaves")
      .set("Authorization", `Bearer ${token}`)
      .send({
        employee: employeeId,
        startDate: "2026-07-13",
        endDate: "2026-07-14",
        type: "sick",
        reason: "Flu",
      });

    expect(created.status).toBe(201);

    const approved = await request(app)
      .patch(`/api/v1/attendance/leaves/${created.body.data._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    expect(approved.body.data.status).toBe("approved");

    const summary = await request(app)
      .get("/api/v1/attendance/summary?month=2026-07")
      .set("Authorization", `Bearer ${token}`);

    const row = summary.body.data.rows.find(
      (r: { employee: { _id: string } }) => r.employee._id === employeeId
    );
    expect(row.leaveDays).toBe(2);
  });

  it("rejects an end date before the start date", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/leaves")
      .set("Authorization", `Bearer ${token}`)
      .send({
        employee: employeeId,
        startDate: "2026-07-15",
        endDate: "2026-07-14",
      });

    expect(res.status).toBe(400);
  });
});

describe("Punch panel access", () => {
  it("refuses to punch when the account has no linked employee", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/punch-in")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("linked");
  });
});

describe("Linking a login to an employee", () => {
  const PUNCH_PASSWORD = "punchuser12345";

  let employeeRoleId: string;
  let standaloneUserId: string;
  let targetEmployeeId: string;

  beforeAll(async () => {
    const employeeRole =
      (await Role.findOne({ name: "employee" })) ??
      (await Role.create({
        name: "employee",
        permissions: ["attendance.punch"],
        isSystem: true,
      }));
    employeeRoleId = String(employeeRole._id);

    // Creating an employee now always links a login, so the only way to reach
    // the unlinked state is to unlink one — which is exactly what an admin
    // does when someone's account changes.
    const employee = await makeEmployee({
      fullName: "Rakib Hasan",
      email: "rakib@websyner.test",
      password: PUNCH_PASSWORD,
      joinDate: "2026-07-01",
    });
    targetEmployeeId = employee.body.data._id;
    standaloneUserId = String(employee.body.data.user._id);

    await request(app)
      .delete(`/api/v1/employees/${targetEmployeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`);
  });

  const punchToken = async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "rakib@websyner.test", password: PUNCH_PASSWORD });
    return res.body.data.accessToken as string;
  };

  it("blocks the punch panel before the accounts are linked", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/punch-in")
      .set("Authorization", `Bearer ${await punchToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("linked");
  });

  it("offers the unlinked account in the linkable list", async () => {
    const res = await request(app)
      .get("/api/v1/employees/linkable-users")
      .set("Authorization", `Bearer ${token}`);

    const match = res.body.data.find(
      (u: { _id: string }) => u._id === standaloneUserId
    );
    expect(match).toBeDefined();
    expect(match.canPunch).toBe(true);
  });

  it("links an existing account and writes both sides of the link", async () => {
    const res = await request(app)
      .post(`/api/v1/employees/${targetEmployeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: standaloneUserId });

    expect(res.status).toBe(200);
    expect(res.body.data.canPunch).toBe(true);

    // Employee.user drives the admin display…
    const employee = await Employee.findById(targetEmployeeId);
    expect(String(employee?.user)).toBe(standaloneUserId);

    // …and User.employee is what the punch panel actually reads.
    const user = await User.findById(standaloneUserId);
    expect(String(user?.employee)).toBe(targetEmployeeId);
  });

  it("lets that user punch in once linked", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/punch-in")
      .set("Authorization", `Bearer ${await punchToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Punched in");
  });

  it("drops a linked account out of the linkable list", async () => {
    const res = await request(app)
      .get("/api/v1/employees/linkable-users")
      .set("Authorization", `Bearer ${token}`);

    expect(
      res.body.data.some((u: { _id: string }) => u._id === standaloneUserId)
    ).toBe(false);
  });

  it("refuses to link a second account over an existing one", async () => {
    const res = await request(app)
      .post(`/api/v1/employees/${targetEmployeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: standaloneUserId });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already has a login");
  });

  it("refuses to link one account to two employees", async () => {
    const other = await makeEmployee({
      fullName: "Another Person",
      email: "another@websyner.test",
      joinDate: "2026-07-01",
    });

    // Free this record's own login so the request reaches the guard we're
    // actually testing rather than "already has a login".
    await request(app)
      .delete(`/api/v1/employees/${other.body.data._id}/link-user`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`/api/v1/employees/${other.body.data._id}/link-user`)
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: standaloneUserId });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("another employee");
  });

  it("warns when the account's role can't actually punch", async () => {
    const viewerRole = await Role.create({
      name: "viewer",
      permissions: ["dashboard.view"],
    });
    const viewer = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Viewer Only",
        email: "viewer@websyner.test",
        role: String(viewerRole._id),
        password: "viewer12345",
      });

    // Linking is automatic on creation, so the warning has to come back on
    // the create response — otherwise nobody finds out until they can't punch.
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({ user: viewer.body.data.user._id, joinDate: "2026-07-01" });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain("attendance.punch");
  });

  it("unlinks and blocks the punch panel again, keeping the account", async () => {
    const res = await request(app)
      .delete(`/api/v1/employees/${targetEmployeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    // The login still exists — only the link was removed.
    const user = await User.findById(standaloneUserId);
    expect(user).not.toBeNull();
    expect(user?.employee).toBeUndefined();

    const punch = await request(app)
      .post("/api/v1/attendance/punch-in")
      .set("Authorization", `Bearer ${await punchToken()}`);
    expect(punch.status).toBe(400);
  });

  it("provisions a fresh login for an employee whose account was removed", async () => {
    const employee = await makeEmployee({
      fullName: "Brand New",
      email: "brandnew@websyner.test",
      joinDate: "2026-07-01",
    });
    const employeeId = employee.body.data._id;

    // Unlink, then delete the account entirely — the state you'd be in after
    // someone's login is removed but their employment continues.
    await request(app)
      .delete(`/api/v1/employees/${employeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`);
    await User.deleteOne({ email: "brandnew@websyner.test" });

    const res = await request(app)
      .post(`/api/v1/employees/${employeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`)
      .send({ createLogin: true });

    expect(res.status).toBe(200);
    expect(res.body.data.temporaryPassword).toEqual(expect.any(String));
    expect(res.body.data.canPunch).toBe(true);
  });

  it("rejects a request that names neither an account nor a new login", async () => {
    const res = await request(app)
      .post(`/api/v1/employees/${targetEmployeeId}/link-user`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
