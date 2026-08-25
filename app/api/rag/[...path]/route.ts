import { RAG_API_BASE_URL } from "@/lib/api/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_PATHS = new Set([
  "search",
  "chat/local",
  "chat/external",
  "llm/external/stream",
]);

function ragUrl(path: string) {
  return `${RAG_API_BASE_URL.replace(/\/$/, "")}/api/v1/${path}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const joined = path.join("/");
  if (!ALLOWED_PATHS.has(joined)) {
    return Response.json({ detail: "Not found" }, { status: 404 });
  }

  const accept = request.headers.get("Accept") ?? "application/json";
  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(ragUrl(joined), {
      method: "POST",
      headers: {
        Accept: accept,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return Response.json(
      { detail: "اتصال به سرویس پاسخ برقرار نشد." },
      { status: 503 },
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "no-cache");
  if (contentType?.includes("text/event-stream")) {
    headers.set("X-Accel-Buffering", "no");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
