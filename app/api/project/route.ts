import { NextResponse } from "next/server";
import { z } from "zod";
import { projectBriefSchema, renovationConceptSchema } from "@/types";
import { siteForAddress } from "@/fixtures/site-context";
import { fixtureProject, projectDraftSchema, applyDraft } from "@/lib/project";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { brief, concept, demoMode } = await readBody(request, z.object({ brief: projectBriefSchema, concept: renovationConceptSchema, demoMode: z.boolean() }));
    const site = siteForAddress(brief.propertyAddress, brief.useDemoSite);
    const base = fixtureProject(brief, concept, site);
    const result = await askAstra("project_draft", projectDraftSchema,
      `${SYSTEM}\nConvert the chosen concept into a complete scoped design using the supplied baseline as a template. Coordinates and dimensions are feet, origin at the backyard corner by the house; x goes right, y toward rear fence. Positions are lower-left except trees use center. Preserve existing trees exactly. Scope ids must match element scopeItemIds and elementId; sum costs under budget. Include all labor, materials, preparation. Retain canonical stable IDs for recognizable elements. Keep scope costs realistic; do not reduce estimates just to claim the budget fits.`,
      { brief: { ...brief, photos: brief.photos.map(p => ({ name: p.name })) }, concept, site, baseline: base }, () => ({ title: base.title, homeownerGoals: base.homeownerGoals, softConstraints: base.softConstraints, elements: base.elements, scopeItems: base.scopeItems, assumptions: base.assumptions }), brief.photos, demoMode);
    try {
      // The base already includes the demonstration's feasibility correction receipt.
      const project = result.meta.mode === "live" ? applyDraft(base, result.data, site) : base;
      return NextResponse.json({ data: project, meta: result.meta, site });
    } catch {
      return NextResponse.json({ data: base, meta: { ...result.meta, mode: "fallback", reason: "Astra's project failed a budget or constraint check. The validated fixture design was kept." }, site });
    }
  } catch (error) { return apiError(error); }
}
