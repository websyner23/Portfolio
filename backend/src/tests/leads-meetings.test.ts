import request from "supertest";
import app from "../app";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Meeting, MeetingSettings } from "../app/modules/meeting/meeting.model";
import { Notification } from "../app/modules/notification/notification.model";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const EMAIL = "admin@websyner.test";
const PASSWORD = "admin12345";

let token: string;

/** Picks a weekday far enough ahead to clear the booking lead time. */
const futureWeekday = () => {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
  };
};

beforeAll(async () => {
  await connectTestDb();

  const role = await Role.create({
    name: SUPER_ADMIN_ROLE,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  });
  await User.create({
    name: "Admin",
    email: EMAIL,
    password: PASSWORD,
    role: role._id,
    needsPasswordChange: false,
  });

  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: EMAIL, password: PASSWORD });
  token = res.body.data.accessToken;
});

afterAll(async () => {
  await closeTestDb();
});

describe("Leads — public submission", () => {
  it("accepts a contact form submission without auth", async () => {
    const res = await request(app).post("/api/v1/public/leads").send({
      type: "contact",
      name: "Jane Doe",
      email: "jane@example.com",
      company: "Acme Inc.",
      service: "Web Design",
      message: "We need a new marketing site before the end of the quarter.",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toEqual(expect.any(String));
  });

  it("accepts the shorter hero quick-quote payload", async () => {
    const res = await request(app).post("/api/v1/public/leads").send({
      type: "quick-quote",
      name: "Sam Lee",
      email: "sam@example.com",
      message: "Looking for help with organic growth.",
    });

    expect(res.status).toBe(201);
  });

  it("rejects an invalid payload with field-level errors", async () => {
    const res = await request(app).post("/api/v1/public/leads").send({
      name: "X",
      email: "not-an-email",
      message: "short",
    });

    expect(res.status).toBe(400);
    const paths = res.body.errorSources.map(
      (e: { path: string }) => e.path
    );
    expect(paths).toEqual(expect.arrayContaining(["name", "email", "message"]));
  });

  it("creates an admin notification for each new lead", async () => {
    const notification = await Notification.findOne({ type: "lead.new" });
    expect(notification).not.toBeNull();
    expect(notification?.title).toContain("Jane Doe");
  });
});

describe("Leads — admin", () => {
  it("requires authentication to list leads", async () => {
    const res = await request(app).get("/api/v1/leads");
    expect(res.status).toBe(401);
  });

  it("lists leads with pagination meta", async () => {
    const res = await request(app)
      .get("/api/v1/leads?limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta).toHaveProperty("totalPage");
  });

  it("filters by type and searches by company", async () => {
    const filtered = await request(app)
      .get("/api/v1/leads?type=quick-quote")
      .set("Authorization", `Bearer ${token}`);
    expect(filtered.body.data.every((l: { type: string }) => l.type === "quick-quote")).toBe(true);

    const searched = await request(app)
      .get("/api/v1/leads?searchTerm=acme")
      .set("Authorization", `Bearer ${token}`);
    expect(searched.body.data[0].company).toBe("Acme Inc.");
  });

  it("reports pipeline stats", async () => {
    const res = await request(app)
      .get("/api/v1/leads/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.byStatus.new).toBeGreaterThanOrEqual(1);
  });

  it("marks a lead read on first open, updates status and appends notes", async () => {
    const list = await request(app)
      .get("/api/v1/leads?searchTerm=acme")
      .set("Authorization", `Bearer ${token}`);
    const id = list.body.data[0]._id;

    const opened = await request(app)
      .get(`/api/v1/leads/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(opened.body.data.readAt).toBeTruthy();

    const updated = await request(app)
      .patch(`/api/v1/leads/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "qualified" });
    expect(updated.body.data.status).toBe("qualified");

    const noted = await request(app)
      .post(`/api/v1/leads/${id}/notes`)
      .set("Authorization", `Bearer ${token}`)
      .send({ body: "Call booked for Thursday." });
    expect(noted.body.data.notes).toHaveLength(1);
  });
});

describe("Meetings — availability and booking", () => {
  const { iso, month } = futureWeekday();

  it("returns a month of availability with per-slot flags", async () => {
    const res = await request(app).get(
      `/api/v1/public/meetings/availability?month=${month}`
    );

    expect(res.status).toBe(200);
    expect(res.body.data.days.length).toBeGreaterThan(27);
    expect(res.body.data.slotTimes.length).toBeGreaterThan(0);

    const day = res.body.data.days.find((d: { date: string }) => d.date === iso);
    expect(day.available).toBe(true);
  });

  it("closes weekends by default", async () => {
    const res = await request(app).get(
      `/api/v1/public/meetings/availability?month=${month}`
    );
    const weekend = res.body.data.days.filter(
      (d: { weekday: number }) => d.weekday === 0 || d.weekday === 6
    );
    expect(weekend.every((d: { available: boolean }) => !d.available)).toBe(true);
  });

  it("books a slot without auth", async () => {
    const res = await request(app).post("/api/v1/public/meetings").send({
      name: "Jane Doe",
      email: "jane@example.com",
      topic: "Website rebuild",
      date: iso,
      time: "10:00",
      timezone: "Europe/London",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.date).toBe(iso);
  });

  it("refuses to double-book the same slot", async () => {
    const res = await request(app).post("/api/v1/public/meetings").send({
      name: "Someone Else",
      email: "other@example.com",
      date: iso,
      time: "10:00",
      timezone: "Europe/London",
    });

    expect(res.status).toBe(409);
  });

  it("marks the taken slot unavailable in the next availability call", async () => {
    const res = await request(app).get(
      `/api/v1/public/meetings/availability?month=${month}`
    );
    const day = res.body.data.days.find((d: { date: string }) => d.date === iso);
    const slot = day.slots.find((s: { time: string }) => s.time === "10:00");

    expect(slot.available).toBe(false);
  });

  it("rejects a time that isn't an offered slot", async () => {
    const res = await request(app).post("/api/v1/public/meetings").send({
      name: "Jane Doe",
      email: "jane@example.com",
      date: iso,
      time: "03:00",
      timezone: "Europe/London",
    });

    expect(res.status).toBe(400);
  });

  it("validates the booking payload shape", async () => {
    const res = await request(app).post("/api/v1/public/meetings").send({
      name: "J",
      email: "nope",
      date: "01-09-2026",
      time: "10am",
      timezone: "",
    });

    expect(res.status).toBe(400);
  });

  it("frees the slot again once the booking is cancelled", async () => {
    const meeting = await Meeting.findOne({ date: iso, time: "10:00" });

    await request(app)
      .patch(`/api/v1/meetings/${meeting?._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "cancelled" });

    const res = await request(app).get(
      `/api/v1/public/meetings/availability?month=${month}`
    );
    const day = res.body.data.days.find((d: { date: string }) => d.date === iso);
    const slot = day.slots.find((s: { time: string }) => s.time === "10:00");

    expect(slot.available).toBe(true);
  });

  it("honours blackout dates from settings", async () => {
    await MeetingSettings.findOneAndUpdate(
      { key: "default" },
      { $set: { blackoutDates: [iso] } },
      { upsert: true }
    );

    const res = await request(app).post("/api/v1/public/meetings").send({
      name: "Jane Doe",
      email: "jane@example.com",
      date: iso,
      time: "11:00",
      timezone: "Europe/London",
    });

    expect(res.status).toBe(400);

    await MeetingSettings.findOneAndUpdate(
      { key: "default" },
      { $set: { blackoutDates: [] } }
    );
  });
});

describe("Notifications", () => {
  it("returns items with an unread count", async () => {
    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.unreadCount).toBeGreaterThan(0);
  });

  it("clears the unread count after mark-all-read", async () => {
    await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.unreadCount).toBe(0);
    expect(res.body.data.items.every((i: { isRead: boolean }) => i.isRead)).toBe(true);
  });
});
