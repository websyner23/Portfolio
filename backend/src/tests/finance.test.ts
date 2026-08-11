import request from "supertest";
import app from "../app";
import { AttendanceSettings } from "../app/modules/attendance/attendance.model";
import { AttendanceService } from "../app/modules/attendance/attendance.service";
import { instantAt, localDateOf } from "../app/modules/attendance/attendance.utils";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const EMAIL = "finance@websyner.test";
const PASSWORD = "finance12345";

let token: string;
let cashAccount: string;
let bankAccount: string;
let employeeId: string;

const auth = () => ({ Authorization: `Bearer ${token}` });

/** Current balance for one account, straight from the API. */
const balanceOf = async (accountId: string) => {
  const res = await request(app).get("/api/v1/finance/accounts").set(auth());
  return res.body.data.find((a: { _id: string }) => a._id === accountId).balance;
};

beforeAll(async () => {
  await connectTestDb();

  const role = await Role.create({
    name: SUPER_ADMIN_ROLE,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  });
  await User.create({
    name: "Finance Admin",
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
    timezone: "Asia/Dhaka",
    defaultBaseSalary: 4000,
    defaultPerfectBonus: 1000,
  });

  const cash = await request(app)
    .post("/api/v1/finance/accounts")
    .set(auth())
    .send({ name: "Petty Cash", type: "cash", openingBalance: 10000 });
  cashAccount = cash.body.data._id;

  const bank = await request(app)
    .post("/api/v1/finance/accounts")
    .set(auth())
    .send({ name: "Business Bank", type: "bank", openingBalance: 50000 });
  bankAccount = bank.body.data._id;
});

afterAll(async () => {
  await closeTestDb();
});

describe("Accounts and balances", () => {
  it("starts each account at its opening balance", async () => {
    expect(await balanceOf(cashAccount)).toBe(10000);
    expect(await balanceOf(bankAccount)).toBe(50000);
  });

  it("adds income to the balance", async () => {
    await request(app)
      .post("/api/v1/finance/transactions")
      .set(auth())
      .send({
        type: "income",
        amount: 25000,
        account: bankAccount,
        category: "Project income",
        date: "2026-07-05",
        description: "Milestone 1",
      });

    expect(await balanceOf(bankAccount)).toBe(75000);
  });

  it("subtracts expenses from the balance", async () => {
    await request(app)
      .post("/api/v1/finance/transactions")
      .set(auth())
      .send({
        type: "expense",
        amount: 3000,
        account: cashAccount,
        category: "Software",
        date: "2026-07-06",
      });

    expect(await balanceOf(cashAccount)).toBe(7000);
  });

  it("moves money between accounts on a transfer", async () => {
    await request(app)
      .post("/api/v1/finance/transactions")
      .set(auth())
      .send({
        type: "transfer",
        amount: 5000,
        account: bankAccount,
        toAccount: cashAccount,
        date: "2026-07-07",
      });

    expect(await balanceOf(bankAccount)).toBe(70000);
    expect(await balanceOf(cashAccount)).toBe(12000);
  });

  it("rejects a transfer to the same account", async () => {
    const res = await request(app)
      .post("/api/v1/finance/transactions")
      .set(auth())
      .send({
        type: "transfer",
        amount: 100,
        account: bankAccount,
        toAccount: bankAccount,
        date: "2026-07-08",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a transfer with no destination", async () => {
    const res = await request(app)
      .post("/api/v1/finance/transactions")
      .set(auth())
      .send({
        type: "transfer",
        amount: 100,
        account: bankAccount,
        date: "2026-07-08",
      });

    expect(res.status).toBe(400);
  });

  it("validates the transaction payload", async () => {
    const res = await request(app)
      .post("/api/v1/finance/transactions")
      .set(auth())
      .send({ type: "nonsense", amount: -5, account: bankAccount, date: "bad" });

    expect(res.status).toBe(400);
  });
});

describe("Receivables (pending project income)", () => {
  let receivableId: string;

  it("records money a client still owes", async () => {
    const res = await request(app)
      .post("/api/v1/finance/receivables")
      .set(auth())
      .send({
        title: "Northwind — phase 2",
        client: "Northwind Logistics",
        amount: 40000,
        dueDate: "2026-08-31",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    receivableId = res.body.data._id;
  });

  it("marks it partial and books income on a part payment", async () => {
    const before = await balanceOf(bankAccount);

    const res = await request(app)
      .post(`/api/v1/finance/receivables/${receivableId}/payments`)
      .set(auth())
      .send({ amount: 15000, date: "2026-07-20", account: bankAccount });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("partial");
    expect(await balanceOf(bankAccount)).toBe(before + 15000);
  });

  it("refuses a payment larger than the outstanding amount", async () => {
    const res = await request(app)
      .post(`/api/v1/finance/receivables/${receivableId}/payments`)
      .set(auth())
      .send({ amount: 999999, date: "2026-07-21", account: bankAccount });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("outstanding");
  });

  it("marks it paid once the balance is settled", async () => {
    const res = await request(app)
      .post(`/api/v1/finance/receivables/${receivableId}/payments`)
      .set(auth())
      .send({ amount: 25000, date: "2026-07-25", account: bankAccount });

    expect(res.body.data.status).toBe("paid");
  });

  it("refuses to delete a receivable that has payments", async () => {
    const res = await request(app)
      .delete(`/api/v1/finance/receivables/${receivableId}`)
      .set(auth());

    expect(res.status).toBe(400);
  });

  it("counts only unsettled amounts as pending income", async () => {
    await request(app)
      .post("/api/v1/finance/receivables")
      .set(auth())
      .send({ title: "Atlas — retainer", amount: 12000, dueDate: "2026-09-30" });

    const res = await request(app).get("/api/v1/finance/overview").set(auth());

    // The settled receivable must not appear in the pending figure.
    expect(res.body.data.totals.pendingIncome).toBe(12000);
  });
});

describe("Payroll", () => {
  let payrollId: string;
  let month: string;

  beforeAll(async () => {
    // Employees are created from a login account, so provision one first.
    const employeeRole = await Role.create({
      name: "employee",
      permissions: ["attendance.punch"],
      isSystem: true,
    });
    const user = await request(app)
      .post("/api/v1/users")
      .set(auth())
      .send({
        name: "Payroll Person",
        email: "payroll.person@websyner.test",
        role: String(employeeRole._id),
        password: "payroll12345",
      });

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(auth())
      .send({
        user: user.body.data.user._id,
        joinDate: "2026-07-01",
        lastWorkingDate: "2026-07-02",
      });
    employeeId = employee.body.data._id;

    // Two full, on-time shifts across their whole employment window.
    const rules = await AttendanceService.getRules();
    for (const date of ["2026-07-01", "2026-07-02"]) {
      const next = date === "2026-07-01" ? "2026-07-02" : "2026-07-03";
      await AttendanceService.createRecord(
        {
          employee: employeeId,
          shiftDate: date,
          sessions: [
            {
              in: instantAt(date, "22:00", rules.timezone).toISOString(),
              out: instantAt(next, "01:00", rules.timezone).toISOString(),
            },
          ],
        },
        "000000000000000000000000"
      );
    }

    month = "2026-07";
  });

  it("generates draft payroll from the attendance summary", async () => {
    const res = await request(app)
      .post("/api/v1/finance/payroll/generate")
      .set(auth())
      .send({ month });

    expect(res.status).toBe(200);
    expect(res.body.data.created).toBeGreaterThanOrEqual(1);
  });

  it("carries the perfect-attendance bonus into the payslip", async () => {
    const res = await request(app)
      .get(`/api/v1/finance/payroll?month=${month}`)
      .set(auth());

    const row = res.body.data.records.find(
      (r: { employee: { _id: string } }) => r.employee._id === employeeId
    );

    expect(row.bonusEligible).toBe(true);
    expect(row.baseSalary).toBe(4000);
    expect(row.bonus).toBe(1000);
    expect(row.netPayable).toBe(5000);
    expect(row.status).toBe("draft");

    payrollId = row._id;
  });

  it("recomputes the net payable when an adjustment is applied", async () => {
    const res = await request(app)
      .patch(`/api/v1/finance/payroll/${payrollId}`)
      .set(auth())
      .send({ adjustment: -500, adjustmentNote: "Advance taken in June" });

    expect(res.body.data.netPayable).toBe(4500);
  });

  it("is safe to re-run — drafts refresh and keep their adjustment", async () => {
    const res = await request(app)
      .post("/api/v1/finance/payroll/generate")
      .set(auth())
      .send({ month });

    expect(res.body.data.updated).toBeGreaterThanOrEqual(1);

    const payroll = await request(app)
      .get(`/api/v1/finance/payroll?month=${month}`)
      .set(auth());
    const row = payroll.body.data.records.find(
      (r: { _id: string }) => r._id === payrollId
    );

    expect(row.adjustment).toBe(-500);
    expect(row.netPayable).toBe(4500);
  });

  it("books a salary expense when the payslip is paid", async () => {
    const before = await balanceOf(bankAccount);

    const res = await request(app)
      .post(`/api/v1/finance/payroll/${payrollId}/pay`)
      .set(auth())
      .send({ account: bankAccount, date: "2026-08-01" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("paid");
    expect(await balanceOf(bankAccount)).toBe(before - 4500);
  });

  it("refuses to pay the same payslip twice", async () => {
    const res = await request(app)
      .post(`/api/v1/finance/payroll/${payrollId}/pay`)
      .set(auth())
      .send({ account: bankAccount, date: "2026-08-01" });

    expect(res.status).toBe(400);
  });

  it("refuses to edit a payslip that has been paid", async () => {
    const res = await request(app)
      .patch(`/api/v1/finance/payroll/${payrollId}`)
      .set(auth())
      .send({ adjustment: 100 });

    expect(res.status).toBe(400);
  });

  it("leaves paid rows untouched when payroll is regenerated", async () => {
    const res = await request(app)
      .post("/api/v1/finance/payroll/generate")
      .set(auth())
      .send({ month });

    expect(res.body.data.skipped).toBeGreaterThanOrEqual(1);
  });

  it("blocks deleting the transaction a salary payment created", async () => {
    const list = await request(app)
      .get("/api/v1/finance/transactions?type=salary")
      .set(auth());

    const res = await request(app)
      .delete(`/api/v1/finance/transactions/${list.body.data[0]._id}`)
      .set(auth());

    expect(res.status).toBe(400);
  });
});

describe("Overview", () => {
  it("reports balances, monthly figures and a six-month trend", async () => {
    const res = await request(app).get("/api/v1/finance/overview").set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.accounts).toHaveLength(2);
    expect(res.body.data.trend).toHaveLength(6);
    expect(res.body.data.totals.balance).toBe(
      (await balanceOf(cashAccount)) + (await balanceOf(bankAccount))
    );
  });

  it("counts salary payments as expenses for the month they fall in", async () => {
    const res = await request(app)
      .get("/api/v1/finance/overview?month=2026-08")
      .set(auth());

    expect(res.body.data.totals.monthExpense).toBe(4500);
  });

  it("uses the current month by default", async () => {
    const res = await request(app).get("/api/v1/finance/overview").set(auth());
    expect(res.body.data.month).toBe(localDateOf(new Date(), "Asia/Dhaka").slice(0, 7));
  });
});
