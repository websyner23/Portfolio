import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import config from "../../../config";
import { emailLayout, sendEmail } from "../../utils/sendEmail";
import { SiteSettings } from "../cms/cms.model";
import { pushNotification } from "../notification/notification.service";
import { Lead } from "./lead.model";

type TCreateLead = Record<string, unknown> & {
  name: string;
  email: string;
  message: string;
  type?: string;
};

const createLead = async (
  payload: TCreateLead,
  meta: { ip?: string; userAgent?: string }
) => {
  const lead = await Lead.create({ ...payload, ...meta });

  const label = lead.type === "quick-quote" ? "Quote request" : "Contact enquiry";

  await pushNotification({
    type: "lead.new",
    title: `${label} from ${lead.name}`,
    body: lead.message.slice(0, 160),
    link: `/leads?highlight=${lead._id}`,
    entity: { kind: "lead", id: String(lead._id) },
  });

  // Notify the company inbox. Delivery failures are logged, not thrown —
  // a visitor's submission must succeed even when SMTP is down.
  const settings = await SiteSettings.findOne({ key: "default" });
  const inbox = settings?.email || config.smtp.user;

  if (inbox) {
    void sendEmail({
      to: inbox,
      subject: `${label}: ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
      html: emailLayout(
        `New ${label.toLowerCase()}`,
        `<p><strong>${lead.name}</strong> &lt;${lead.email}&gt;${
          lead.phone ? `<br/>Phone: ${lead.phone}` : ""
        }${lead.company ? `<br/>Company: ${lead.company}` : ""}</p>
         ${lead.service ? `<p><strong>Service:</strong> ${lead.service}</p>` : ""}
         ${lead.budget ? `<p><strong>Budget:</strong> ${lead.budget}</p>` : ""}
         ${lead.timeline ? `<p><strong>Timeline:</strong> ${lead.timeline}</p>` : ""}
         <p style="white-space:pre-wrap;border-left:3px solid #0fcda1;padding-left:12px;margin-top:16px">${lead.message}</p>
         <p style="margin-top:20px"><a href="${config.adminUrl}/leads" style="display:inline-block;background:#0fcda1;color:#1e2d40;font-weight:700;padding:10px 18px;border-radius:999px;text-decoration:none">Open in admin</a></p>`
      ),
    });
  }

  // Acknowledgement to the visitor.
  void sendEmail({
    to: lead.email,
    subject: `We received your message — ${settings?.brandName ?? "WebSyner"}`,
    html: emailLayout(
      `Thanks for getting in touch, ${lead.name.split(" ")[0]}`,
      `<p>We've received your message and will reply within one business day.</p>
       <p style="white-space:pre-wrap;border-left:3px solid #0fcda1;padding-left:12px;color:#6b7a89">${lead.message}</p>`
    ),
  });

  return lead;
};

const getAllLeads = async (query: Record<string, unknown>) => {
  const qb = new QueryBuilder(
    Lead.find().populate("assignedTo", "name email"),
    query
  )
    .search(["name", "email", "company", "message", "service"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await qb.modelQuery;
  const meta = await qb.countTotal();
  return { data, meta };
};

const getLeadById = async (id: string) => {
  const lead = await Lead.findById(id)
    .populate("assignedTo", "name email")
    .populate("notes.author", "name email");
  if (!lead) throw new AppError(httpStatus.NOT_FOUND, "Lead not found");

  if (!lead.readAt) {
    lead.readAt = new Date();
    await lead.save({ validateBeforeSave: false });
  }

  return lead;
};

const updateLead = async (id: string, payload: Record<string, unknown>) => {
  const lead = await Lead.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("assignedTo", "name email");
  if (!lead) throw new AppError(httpStatus.NOT_FOUND, "Lead not found");
  return lead;
};

const addNote = async (id: string, body: string, authorId: string) => {
  const lead = await Lead.findByIdAndUpdate(
    id,
    { $push: { notes: { body, author: authorId, createdAt: new Date() } } },
    { new: true }
  ).populate("notes.author", "name email");
  if (!lead) throw new AppError(httpStatus.NOT_FOUND, "Lead not found");
  return lead;
};

const deleteLead = async (id: string) => {
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) throw new AppError(httpStatus.NOT_FOUND, "Lead not found");
  return lead;
};

/** Counts per status for the pipeline header in the admin panel. */
const getLeadStats = async () => {
  const byStatus = await Lead.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = byStatus.reduce<Record<string, number>>((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return {
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    unread: await Lead.countDocuments({ readAt: { $exists: false } }),
    byStatus: counts,
  };
};

export const LeadService = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  addNote,
  deleteLead,
  getLeadStats,
};
