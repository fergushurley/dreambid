import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSpecSchema } from "@/types";
import { siteForAddress } from "@/fixtures/site-context";
import { revisionPatchSchema, canonicalRevisionPatch, applyRevision } from "@/lib/project";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { project, instruction, demoMode } = await readBody(request, z.object({ project: projectSpecSchema, instruction: z.string().min(5).max(2000), demoMode: z.boolean() }));
    const site = siteForAddress(project.propertyAddress, project.siteContextId === "site-maple-demo");
    const result = await askAstra("project_revision", revisionPatchSchema,
      `${SYSTEM}\nReturn a minimal patch, not a new project. Only upsert elements explicitly affected by the instruction or a necessary budget tradeoff, explaining any tradeoffs. Never change protected elements, tree positions, dimensions, or other hard constraints. Keep stable IDs and scope references. Remove scope items for removed elements. For a kitchen, separately scope cabinetry/appliances, countertop and electrical connection so bids can be compared. Do not raise the budget maximum. Respect a newly requested lower budget. Preserve all unrelated line items unchanged unless savings are necessary; explain and substantiate savings. All costs must sum within the cap.`,
      { project, site, instruction }, () => canonicalRevisionPatch(project, instruction), [], demoMode);
    const revised = applyRevision(project, result.data, instruction, site);
    return NextResponse.json({ data: revised, meta: result.meta, site });
  } catch (error) { return apiError(error); }
}
