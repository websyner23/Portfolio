/**
 * Browser-side calls to the public API — used by the contact form, the hero
 * quote form and the meeting scheduler. These endpoints require no auth.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export type ApiError = {
  message: string;
  fields?: Record<string, string>;
};

type Envelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errorSources?: { path: string | number; message: string }[];
};

/**
 * POSTs JSON and normalises failures into a single ApiError shape, mapping
 * the backend's zod `errorSources` onto form field names where possible.
 */
export async function postPublic<T>(
  path: string,
  body: unknown
): Promise<{ ok: true; data: T; message: string } | { ok: false; error: ApiError }> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/public${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      error: {
        message:
          "We couldn't reach the server. Check your connection and try again.",
      },
    };
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const fields: Record<string, string> = {};
    payload?.errorSources?.forEach((source) => {
      if (source.path) fields[String(source.path)] = source.message;
    });

    return {
      ok: false,
      error: {
        message:
          payload?.message ??
          "Something went wrong sending your message. Please try again.",
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      },
    };
  }

  return { ok: true, data: payload.data, message: payload.message };
}

export async function getPublic<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}/public${path}`);
    if (!response.ok) return null;
    const payload = (await response.json()) as Envelope<T>;
    return payload?.success ? payload.data : null;
  } catch {
    return null;
  }
}

/* ------------------------------ typed calls ------------------------------ */

export type LeadPayload = {
  type: "contact" | "quick-quote";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  referral?: string;
  startDate?: string;
  message: string;
  sourcePage?: string;
};

export const submitLead = (payload: LeadPayload) =>
  postPublic<{ _id: string }>("/leads", payload);

export type AvailabilityDay = {
  date: string;
  weekday: number;
  available: boolean;
  slots: { time: string; available: boolean }[];
};

export type Availability = {
  month: string;
  timezones: string[];
  slotTimes: string[];
  durationMins: number;
  days: AvailabilityDay[];
};

export const getAvailability = (month: string) =>
  getPublic<Availability>(`/meetings/availability?month=${month}`);

export type BookingPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic?: string;
  date: string;
  time: string;
  timezone: string;
};

export const bookMeeting = (payload: BookingPayload) =>
  postPublic<{
    _id: string;
    date: string;
    time: string;
    timezone: string;
    durationMins: number;
  }>("/meetings", payload);
