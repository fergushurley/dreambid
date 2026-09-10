import { NextResponse } from "next/server";
import { z } from "zod";

export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 18000000) throw new Error("Request exceeds the 18 MB limit.");
  // Local prototype: protect paid routes against cross-origin browser submissions.
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") || requestUrl.host;
  if (origin && (new URL(origin).host !== host || new URL(origin).protocol !== requestUrl.protocol)) throw new Error("Cross-origin requests are not allowed.");
  const text = await request.text();
  if (text.length > 18000000) throw new Error("Request exceeds the 18 MB limit.");
  return schema.parse(JSON.parse(text));
}
export function apiError(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid project data.", details: error.issues.slice(0, 4).map(i => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  return NextResponse.json({ error: error instanceof Error ? error.message : "The operation could not be completed." }, { status: 400 });
}
