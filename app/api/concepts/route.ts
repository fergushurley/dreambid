import { NextResponse } from "next/server";
import { z } from "zod";
import { projectBriefSchema, conceptsResponseSchema } from "@/types";
import { featuredConcepts } from "@/fixtures/concepts";
import { resolveSiteContext } from "@/lib/property-context";
import { preparePropertyGrounding } from "@/lib/property-grounding";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { brief, demoMode } = await readBody(request, z.object({ brief: projectBriefSchema, demoMode: z.boolean() }));
    const site = await resolveSiteContext(brief.propertyAddress, brief.useDemoSite, demoMode);
    const grounding = await preparePropertyGrounding(site, demoMode ? [] : brief.photos);
    const result = await askAstra("renovation_concepts", conceptsResponseSchema,
      `${SYSTEM}\nGenerate exactly three backyard concepts matching the supplied feature tiers in the same order. Keep the outdoor kitchens in tiers 2 and 3 and swimming pool in tier 3. Tier 1 is a simple gravel/dining/fabric-shade refresh; tier 2 a stone terrace with pergola and compact kitchen; tier 3 a larger pool, kitchen, dining and lounge transformation. The homeowner explicitly requested pool exploration even when it exceeds the budget: never raise their cap or understate costs; explain the overage. Tailor analysis to supplied photos and brief, distinguish fixture context, and keep majorElements to four concise phrases. Recommend the middle tier. Use palettes meadow, terrace, retreat and ids meadow-v2, terrace-v2, retreat-v2.`,
      { brief: { ...brief, photos: brief.photos.map(p => ({ name: p.name })) }, site: grounding.site, visualGrounding: grounding.grounding, tiers: featuredConcepts(brief).concepts }, () => featuredConcepts(brief), grounding.photos, demoMode);
    // Curated scope and ranges stay deterministic; Astra contextualizes feasibility and tradeoffs.
    result.data.concepts=featuredConcepts(brief).concepts.map(tier=>{
      const reasoned=result.data.concepts.find(c=>c.palette===tier.palette);
      return {...tier,feasibilityNotes:[...tier.feasibilityNotes,...(reasoned?.feasibilityNotes??[])],rationale:reasoned?.rationale??tier.rationale};
    });
    return NextResponse.json({ ...result, site });
  } catch (error) { return apiError(error); }
}
