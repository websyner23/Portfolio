import request from "supertest";
import app from "../app";
import { SiteSettings } from "../app/modules/cms/cms.model";
import {
  buildReference,
  extractVariables,
  formatDateLong,
  renderTemplate,
} from "../app/modules/document/document.utils";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { closeTestDb, connectTestDb } from "./setup";

const EMAIL = "hr.docs@websyner.test";
const PASSWORD = "docs12345678";

let token: string;
let templateId: string;
let employeeId: string;

const auth = () => ({ Authorization: `Bearer ${token}` });

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

  await SiteSettings.create({
    key: "default",
    brandName: "WebSyner",
    email: "hello@websyner.co",
    address: { line1: "Remote-first studio", line2: "Serving clients worldwide" },
  });

  // Employees are created from a login account, so provision one first.
  const employeeRole = await Role.create({
    name: "employee",
    permissions: ["attendance.punch"],
    isSystem: true,
  });
  const employeeUser = await request(app)
    .post("/api/v1/users")
    .set(auth())
    .send({
      name: "Shadin Rahman",
      email: "shadin@websyner.test",
      role: String(employeeRole._id),
      password: "shadin12345",
    });

  const employee = await request(app)
    .post("/api/v1/employees")
    .set(auth())
    .send({
      user: employeeUser.body.data.user._id,
      designation: "Developer",
      joinDate: "2026-04-01",
      baseSalary: 4000,
    });
  employeeId = employee.body.data._id;
});

afterAll(async () => {
  await closeTestDb();
});

describe("Placeholder utilities", () => {
  it("extracts unique placeholder names in order", () => {
    const vars = extractVariables(
      "<p>{{employee_name}} — {{designation}} — {{employee_name}}</p>"
    );
    expect(vars).toEqual(["employee_name", "designation"]);
  });

  it("tolerates whitespace inside the braces", () => {
    expect(extractVariables("{{ employee_name }}")).toEqual(["employee_name"]);
  });

  it("substitutes values into the body", () => {
    const html = renderTemplate("<p>Dear {{name}},</p>", { name: "Jane" });
    expect(html).toBe("<p>Dear Jane,</p>");
  });

  it("escapes HTML in values so a letter's markup can't be broken", () => {
    const html = renderTemplate("<p>{{name}}</p>", {
      name: '<script>alert("x")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("flags a missing value instead of leaving a silent gap", () => {
    const html = renderTemplate("<p>Salary: {{salary}}</p>", {});
    expect(html).toContain("[salary]");
  });

  it("formats dates the way a letter should read", () => {
    expect(formatDateLong("2026-04-01")).toBe("1 April 2026");
    expect(formatDateLong("")).toBe("");
  });

  it("builds a readable reference number", () => {
    const ref = buildReference("offer", 7);
    expect(ref).toMatch(/^WS\/OFFER\/\d{4}\/0007$/);
  });
});

describe("Templates", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/documents/templates");
    expect(res.status).toBe(401);
  });

  it("creates a template and derives its variables from the body", async () => {
    const res = await request(app)
      .post("/api/v1/documents/templates")
      .set(auth())
      .send({
        name: "Probation Confirmation",
        type: "custom",
        contentHtml:
          "<p>Dear {{employee_name}}, your probation as {{designation}} ends on {{end_date}}.</p>",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.variables).toEqual([
      "employee_name",
      "designation",
      "end_date",
    ]);

    templateId = res.body.data._id;
  });

  it("rejects a body that is too short to be a letter", async () => {
    const res = await request(app)
      .post("/api/v1/documents/templates")
      .set(auth())
      .send({ name: "Too short", contentHtml: "<p>Hi</p>" });

    expect(res.status).toBe(400);
  });

  it("re-derives variables when the body is edited", async () => {
    const res = await request(app)
      .patch(`/api/v1/documents/templates/${templateId}`)
      .set(auth())
      .send({
        contentHtml:
          "<p>Dear {{employee_name}}, your probation ended on {{end_date}}. Signed {{signatory_name}}.</p>",
      });

    expect(res.body.data.variables).toEqual([
      "employee_name",
      "end_date",
      "signatory_name",
    ]);
  });

  it("lists the placeholders the generator fills automatically", async () => {
    const res = await request(app)
      .get(`/api/v1/documents/placeholders?employee=${employeeId}`)
      .set(auth());

    const keys = res.body.data.map((p: { key: string }) => p.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "company_name",
        "today",
        "employee_name",
        "designation",
        "join_date",
        "base_salary",
      ])
    );
  });
});

describe("Generating a letter", () => {
  let documentId: string;

  it("auto-fills employee and company details in the preview", async () => {
    const res = await request(app)
      .post("/api/v1/documents/preview")
      .set(auth())
      .send({ template: templateId, employee: employeeId });

    expect(res.status).toBe(200);
    expect(res.body.data.renderedHtml).toContain("Shadin Rahman");
    expect(res.body.data.values.company_name).toBe("WebSyner");
    expect(res.body.data.values.join_date).toBe("1 April 2026");
  });

  it("lets an explicit value override an auto-filled one", async () => {
    const res = await request(app)
      .post("/api/v1/documents/preview")
      .set(auth())
      .send({
        template: templateId,
        employee: employeeId,
        values: { employee_name: "Corrected Name" },
      });

    expect(res.body.data.renderedHtml).toContain("Corrected Name");
    expect(res.body.data.renderedHtml).not.toContain("Shadin Rahman");
  });

  it("marks placeholders that were never supplied", async () => {
    const res = await request(app)
      .post("/api/v1/documents/preview")
      .set(auth())
      .send({ template: templateId, employee: employeeId });

    // end_date isn't auto-fillable, so it must show as unfilled.
    expect(res.body.data.renderedHtml).toContain("[end_date]");
  });

  it("issues a document with a reference number", async () => {
    const res = await request(app)
      .post("/api/v1/documents/generate")
      .set(auth())
      .send({
        template: templateId,
        employee: employeeId,
        values: { end_date: "30 June 2026", signatory_name: "Jahid" },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.reference).toMatch(/^WS\/CUSTOM\/\d{4}\/0001$/);
    expect(res.body.data.renderedHtml).toContain("30 June 2026");
    expect(res.body.data.renderedHtml).not.toContain("[end_date]");

    documentId = res.body.data._id;
  });

  it("increments the reference for the next document of that type", async () => {
    const res = await request(app)
      .post("/api/v1/documents/generate")
      .set(auth())
      .send({ template: templateId, employee: employeeId });

    expect(res.body.data.reference).toMatch(/0002$/);
  });

  it("keeps issued letters unchanged when the template is edited later", async () => {
    await request(app)
      .patch(`/api/v1/documents/templates/${templateId}`)
      .set(auth())
      .send({ contentHtml: "<p>Completely rewritten template body here.</p>" });

    const res = await request(app)
      .get(`/api/v1/documents/generated/${documentId}`)
      .set(auth());

    expect(res.body.data.renderedHtml).toContain("30 June 2026");
    expect(res.body.data.renderedHtml).not.toContain("Completely rewritten");
  });

  it("survives its template being deleted", async () => {
    await request(app)
      .delete(`/api/v1/documents/templates/${templateId}`)
      .set(auth());

    const res = await request(app)
      .get(`/api/v1/documents/generated/${documentId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.templateName).toBe("Probation Confirmation");
  });

  it("lists issued documents without their full HTML", async () => {
    const res = await request(app)
      .get("/api/v1/documents/generated")
      .set(auth());

    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0].renderedHtml).toBeUndefined();
    expect(res.body.meta).toHaveProperty("totalPage");
  });

  it("searches issued documents by recipient", async () => {
    const res = await request(app)
      .get("/api/v1/documents/generated?searchTerm=Shadin")
      .set(auth());

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
