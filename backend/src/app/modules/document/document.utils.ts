/**
 * Placeholder handling for HR letters.
 *
 * Templates use `{{snake_case}}` markers. Values are HTML-escaped on merge so
 * a stray `<` in someone's name or a pasted note can't break the letter's
 * markup or inject anything into the rendered document.
 */

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Unique placeholder names used in a template body, in order of appearance. */
export const extractVariables = (html: string): string[] => {
  const found = new Set<string>();
  for (const match of html.matchAll(PLACEHOLDER)) {
    found.add(match[1]);
  }
  return [...found];
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Replaces every placeholder with its value. Unknown placeholders are left
 * visibly unfilled rather than silently blanked, so a missed field is obvious
 * on the preview instead of shipping an empty gap in a signed letter.
 */
export const renderTemplate = (
  html: string,
  values: Record<string, unknown>
): string =>
  html.replace(PLACEHOLDER, (_match, name: string) => {
    const value = values[name];
    if (value === undefined || value === null || value === "") {
      return `<span style="background:#fff3cd;color:#8a6d3b;padding:0 4px;border-radius:3px">[${name}]</span>`;
    }
    return escapeHtml(String(value));
  });

/** Human label for a placeholder, e.g. "employee_name" → "Employee name". */
export const humanizeVariable = (name: string): string =>
  name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const pad = (n: number) => String(n).padStart(2, "0");

export const formatDateLong = (value?: string | Date): string => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const todayISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Sequential, human-readable reference, e.g. WS/OFFER/2026/0007. */
export const buildReference = (type: string, sequence: number): string =>
  `WS/${type.toUpperCase().replace(/-/g, "")}/${new Date().getFullYear()}/${String(
    sequence
  ).padStart(4, "0")}`;
