import { NextResponse } from "next/server";
import { z } from "zod";
import { projectBriefSchema, conceptsResponseSchema } from "@/types";
import { fallbackConcepts } from "@/fixtures/concepts";
import { siteForAddress } from "@/fixtures/site-context";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { brief, demoMode } = await readBody(request, z.object({ brief: projectBriefSchema, demoMode: z.boolean() }));
    const site = siteForAddress(brief.propertyAddress, brief.useDemoSite);
    const result = await askAstra("renovation_concepts", conceptsResponseSchema,
      `${SYSTEM}\nGenerate exactly three distinct backyard concepts in ascending budget order, all at or below the homeowner maximum. Recommend exactly the middle concept. Use stable ids and palettes meadow, terrace, retreat. Analyze supplied photos, homeowner intent and site facts together; do not claim photo analysis when none are supplied. Name visible features with uncertainty. Include practical shade, dining, lighting and tree retention where requested.`,
      { brief: { ...brief, photos: brief.photos.map(p => ({ name: p.name })) }, site }, () => fallbackConcepts(brief), brief.photos, demoMode);
    if (result.data.concepts.some(c => c.budgetRange.high > brief.budget || c.budgetRange.low > c.budgetRange.high)) {
      result.data = fallbackConcepts(brief); result.meta = { ...result.meta, mode: "fallback", reason: "Astra concepts exceeded the budget constraints. Using the validated fixture concepts." };
    }
    return NextResponse.json({ ...result, site });
  } catch (error) { return apiError(error); }
}
