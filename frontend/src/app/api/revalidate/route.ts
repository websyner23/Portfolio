import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation webhook.
 *
 * The backend calls this after every CMS mutation so content edits appear on
 * the site within seconds instead of waiting for the time-based revalidation
 * in src/lib/api.ts. Shared secret must match REVALIDATE_SECRET in backend/.env.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { revalidated: false, message: "REVALIDATE_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json(
      { revalidated: false, message: "Invalid secret" },
      { status: 401 }
    );
  }

  let tags: string[] = [];
  try {
    const body = (await request.json()) as { tags?: string[] };
    tags = Array.isArray(body?.tags) ? body.tags : [];
  } catch {
    return NextResponse.json(
      { revalidated: false, message: "Expected a JSON body with a tags array" },
      { status: 400 }
    );
  }

  if (tags.length === 0) {
    return NextResponse.json(
      { revalidated: false, message: "No tags supplied" },
      { status: 400 }
    );
  }

  // `{ expire: 0 }` is the documented form for webhooks that need the cached
  // data to expire immediately rather than at the end of a cache profile.
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));

  return NextResponse.json({
    revalidated: true,
    tags,
    now: Date.now(),
  });
}
