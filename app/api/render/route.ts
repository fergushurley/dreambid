import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSpecSchema } from "@/types";
import { readBody, apiError } from "@/lib/http";
import { renderProject } from "@/lib/render";
export const runtime = "nodejs";
export const maxDuration = 330;
export async function POST(request: Request) {
  try { const { project, quality } = await readBody(request, z.object({ project: projectSpecSchema, quality: z.enum(["preview", "max"]).default("preview") })); return NextResponse.json({ data: await renderProject(project, quality) }); }
  catch (error) { return apiError(error); }
}
