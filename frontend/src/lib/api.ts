/**
 * Server-side data access for the public site.
 *
 * Everything the pages render comes from the WebSyner API, with the static
 * modules in src/data used as a fallback so the site still renders if the API
 * is unreachable. Responses are cached with tags; the backend calls
 * /api/revalidate after every CMS edit to refresh them on demand, and the
 * 5-minute `revalidate` acts as a safety net if that webhook is missed.
 *
 * Note: this Next.js app does not enable `cacheComponents`, so fetch is
 * uncached unless `next.revalidate` is set — always go through `apiGet`.
 */

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

export const REVALIDATE_SECONDS = 300;

export type ApiTag =
  | "site"
  | "theme"
  | "sections"
  | "services"
  | "portfolio"
  | "testimonials"
  | "team"
  | "pricing"
  | "faqs"
  | "process"
  | "stats";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPage: number };
};

/**
 * Fetches from the API, returning `fallback` on any failure (network error,
 * non-2xx, malformed body) so a backend outage degrades to the static content
 * instead of a broken page.
 */
export async function apiGet<T>(
  path: string,
  tags: ApiTag[],
  fallback: T
): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags },
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[api] ${path} responded ${res.status} — using fallback`);
      return fallback;
    }

    const body = (await res.json()) as ApiEnvelope<T>;
    if (!body?.success || body.data === undefined || body.data === null) {
      return fallback;
    }

    return body.data;
  } catch (err) {
    console.warn(`[api] ${path} failed (${(err as Error).message}) — using fallback`);
    return fallback;
  }
}

/** Same as apiGet but keeps the pagination meta. */
export async function apiGetWithMeta<T>(
  path: string,
  tags: ApiTag[],
  fallback: T
): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { data: fallback };

    const body = (await res.json()) as ApiEnvelope<T>;
    if (!body?.success) return { data: fallback };

    return { data: body.data ?? fallback, meta: body.meta };
  } catch {
    return { data: fallback };
  }
}
