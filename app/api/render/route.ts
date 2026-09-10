import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSpecSchema } from "@/types";
import { readBody, apiError } from "@/lib/http";
import { renderProject } from "@/lib/render";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const { project } = await readBody(request, z.object({ project: projectSpecSchema })); return NextResponse.json({ data: await renderProject(project) }); }
  catch (error) { return apiError(error); }
}
