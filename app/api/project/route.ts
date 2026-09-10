import { NextResponse } from "next/server";
import { z } from "zod";
import { projectBriefSchema, renovationConceptSchema } from "@/types";
import { resolveSiteContext } from "@/lib/property-context";
import { preparePropertyGrounding } from "@/lib/property-grounding";
import { fixtureProject, projectDraftSchema, applyDraft } from "@/lib/project";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { brief, concept, demoMode } = await readBody(request, z.object({ brief: projectBriefSchema, concept: renovationConceptSchema, demoMode: z.boolean() }));
    const site = await resolveSiteContext(brief.propertyAddress, brief.useDemoSite, demoMode);
    const grounding = await preparePropertyGrounding(site, demoMode ? [] : brief.photos);
    const base = fixtureProject(brief, concept, site);
    if (concept.id.endsWith("-v2")) {
      const contextSchema=z.object({homeownerGoals:z.array(z.string()),softConstraints:z.array(z.string()),assumptions:z.array(z.string())});
      const context=await askAstra("project_context",contextSchema,`${SYSTEM}\nExplain how this selected, curated feature scope serves the brief and what site facts still need confirmation. Its geometry and costs are deterministic and match the selected card. Do not imply this is a newly generated layout or verified property. The owner may explore an over-budget pool option; disclose the overage and preserve the original cap. Later edits use structured layout patches.`,{brief:{...brief,photos:brief.photos.map(p=>({name:p.name}))},site:grounding.site,visualGrounding:grounding.grounding,selectedScope:base},()=>({homeownerGoals:base.homeownerGoals,softConstraints:base.softConstraints,assumptions:base.assumptions}),grounding.photos,demoMode);
      return NextResponse.json({data:{...base,homeownerGoals:context.data.homeownerGoals,softConstraints:context.data.softConstraints,assumptions:[...new Set([...base.assumptions,...context.data.assumptions])]},meta:context.meta,site});
    }
    const result = await askAstra("project_draft", projectDraftSchema,
      `${SYSTEM}\nConvert the chosen concept into a complete scoped design using the supplied baseline as a template. Coordinates and dimensions are feet, origin at the backyard corner by the house; x goes right, y toward rear fence. Positions are lower-left except trees use center. Preserve existing trees exactly. Scope ids must match element scopeItemIds and elementId; sum costs under budget unless the chosen baseline explicitly exceeds it. For that requested aspirational option retain the cap and show the true higher cost. Keep every selected baseline feature kind, especially kitchens and pools. Include all labor, materials, preparation. Retain canonical stable IDs for recognizable elements. Keep scope costs realistic; do not reduce estimates just to claim the budget fits.`,
      { brief: { ...brief, photos: brief.photos.map(p => ({ name: p.name })) }, concept, site:grounding.site, visualGrounding:grounding.grounding, baseline: base }, () => ({ title: base.title, homeownerGoals: base.homeownerGoals, softConstraints: base.softConstraints, elements: base.elements, scopeItems: base.scopeItems, assumptions: base.assumptions }), grounding.photos, demoMode);
    try {
      // The base already includes the demonstration's feasibility correction receipt.
      const project = result.meta.mode === "live" ? applyDraft(base, result.data, site) : base;
      return NextResponse.json({ data: project, meta: result.meta, site });
    } catch {
      return NextResponse.json({ data: base, meta: { ...result.meta, mode: "fallback", reason: "Astra's project failed a budget or constraint check. The validated fixture design was kept." }, site });
    }
  } catch (error) { return apiError(error); }
}
