import request from "supertest";
import app from "../app";
import { Attendance, AttendanceSettings } from "../app/modules/attendance/attendance.model";
import { AttendanceService } from "../app/modules/attendance/attendance.service";
import { instantAt } from "../app/modules/attendance/attendance.utils";
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
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
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
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Jahid",
        email: "jahid@websyner.test",
        joinDate: "2026-07-01",
      });

    expect(res.body.data.employeeId).toBe("WS-002");
  });

  it("rejects a duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Someone",
        email: "shadin@websyner.test",
        joinDate: "2026-07-01",
      });

    expect(res.status).toBe(409);
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
    expect(totals.activeEmployees).toBe(1); // the other was deactivated
    expect(totals.lateDays).toBe(1);
    expect(totals.totalPayroll).toBeGreaterThan(0);
    expect(res.body.data.currency).toBe("BDT");
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
    expect(res.body.data.absentMarked).toBe(1);

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
    const clean = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
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
