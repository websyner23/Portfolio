import nodemailer from "nodemailer";
import config from "../../config";

type TMailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  // Never open a real SMTP connection from the test suite — it would send mail
  // to real inboxes and stall every test that creates a user or a booking.
  if (config.env === "test" || process.env.NODE_ENV === "test") return null;
  if (!config.smtp.host || !config.smtp.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
};

/**
 * Sends mail when SMTP is configured; otherwise logs the message so local
 * development works without credentials. Never throws into request handlers.
 */
export const sendEmail = async (payload: TMailPayload): Promise<boolean> => {
  const tx = getTransporter();

  if (!tx) {
    console.log(
      `[email:skipped] SMTP not configured → "${payload.subject}" to ${payload.to}`
    );
    return false;
  }

  try {
    await tx.sendMail({
      from: config.smtp.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return true;
  } catch (err) {
    console.error(`[email:failed] ${payload.to}:`, (err as Error).message);
    return false;
  }
};

/** Shared WebSyner-branded email shell. */
export const emailLayout = (heading: string, bodyHtml: string) => `
<div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f6f8;padding:32px 0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaee">
    <div style="background:#1e2d40;padding:20px 28px">
      <span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:7px;background:#0fcda1;color:#1e2d40;font-weight:800">W</span>
      <span style="color:#fff;font-weight:700;font-size:16px;margin-left:8px;vertical-align:middle">WebSyner</span>
    </div>
    <div style="padding:28px">
      <h2 style="margin:0 0 14px;color:#1e2d40;font-size:19px">${heading}</h2>
      <div style="color:#40515f;font-size:14px;line-height:1.65">${bodyHtml}</div>
    </div>
    <div style="padding:16px 28px;background:#f9fbfc;color:#8695a3;font-size:12px;border-top:1px solid #e6eaee">
      This is an automated message from WebSyner.
    </div>
  </div>
</div>`;
