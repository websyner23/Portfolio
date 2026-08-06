import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { SiteSettings } from "../cms/cms.model";
import { Employee } from "../employee/employee.model";
import { DocumentTemplate, GeneratedDocument } from "./document.model";
import {
  buildReference,
  extractVariables,
  formatDateLong,
  renderTemplate,
  todayISO,
} from "./document.utils";

/**
 * Values the generator can fill in on its own, so the person issuing a letter
 * only types what's genuinely specific to it.
 */
const autoFillValues = async (employeeId?: string) => {
  const site = await SiteSettings.findOne({ key: "default" });

  const values: Record<string, string> = {
    company_name: site?.brandName ?? "WebSyner",
    company_email: site?.email ?? "",
    company_phone: site?.phone ?? "",
    company_address: [site?.address?.line1, site?.address?.line2]
      .filter(Boolean)
      .join(", "),
    company_website: site?.url ?? "",
    today: formatDateLong(todayISO()),
    current_year: String(new Date().getFullYear()),
  };

  if (employeeId) {
    const employee = await Employee.findById(employeeId);
    if (employee) {
      Object.assign(values, {
        employee_name: employee.fullName,
        employee_id: employee.employeeId,
        employee_email: employee.email,
        designation: employee.designation ?? "",
        department: employee.department ?? "",
        join_date: formatDateLong(employee.joinDate),
        last_working_date: formatDateLong(employee.lastWorkingDate),
        base_salary: employee.baseSalary
          ? `BDT ${employee.baseSalary.toLocaleString()}`
          : "",
      });
    }
  }

  return values;
};

/** Placeholders the generator knows how to fill without being asked. */
const getAutoFillFor = async (employeeId?: string) => autoFillValues(employeeId);

const createTemplate = async (
  payload: { name: string; type: string; description?: string; contentHtml: string },
  createdBy: string
) =>
  DocumentTemplate.create({
    ...payload,
    variables: extractVariables(payload.contentHtml),
    createdBy: new Types.ObjectId(createdBy),
  });

const updateTemplate = async (id: string, payload: Record<string, unknown>) => {
  const template = await DocumentTemplate.findById(id);
  if (!template) throw new AppError(httpStatus.NOT_FOUND, "Template not found");

  Object.assign(template, payload);

  // Keep the variable list in step with the body on every edit.
  if (payload.contentHtml) {
    template.variables = extractVariables(String(payload.contentHtml));
  }

  await template.save();
  return template;
};

/**
 * Merges values into a template. Explicit values win over auto-filled ones, so
 * a one-off correction is always possible.
 */
const preview = async (payload: {
  template: string;
  employee?: string;
  values?: Record<string, string>;
}) => {
  const template = await DocumentTemplate.findById(payload.template);
  if (!template) throw new AppError(httpStatus.NOT_FOUND, "Template not found");

  const auto = await autoFillValues(payload.employee);
  const merged = { ...auto, ...(payload.values ?? {}) };

  return {
    template,
    values: merged,
    renderedHtml: renderTemplate(template.contentHtml, merged),
  };
};

const generate = async (
  payload: {
    template: string;
    employee?: string;
    values?: Record<string, string>;
    title?: string;
  },
  issuedBy: string
) => {
  const { template, values, renderedHtml } = await preview(payload);

  const sequence = (await GeneratedDocument.countDocuments({ type: template.type })) + 1;

  return GeneratedDocument.create({
    template: template._id,
    templateName: template.name,
    type: template.type,
    title:
      payload.title ||
      `${template.name}${values.employee_name ? ` — ${values.employee_name}` : ""}`,
    employee: payload.employee ? new Types.ObjectId(payload.employee) : undefined,
    recipientName: values.employee_name ?? "",
    variableValues: values,
    renderedHtml,
    reference: buildReference(template.type, sequence),
    issuedBy: new Types.ObjectId(issuedBy),
  });
};

export const DocumentService = {
  getAutoFillFor,
  createTemplate,
  updateTemplate,
  preview,
  generate,
};
