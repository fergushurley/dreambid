import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSpecSchema } from "@/types";
import { featureCatalog } from "@/fixtures/feature-catalog";
import { siteForAddress } from "@/fixtures/site-context";
import { applyLayoutPatch, budgetSummary } from "@/lib/layout";
import { fallbackLayoutAdvice, isBudgetRequest, layoutAdviceSchema } from "@/lib/layout-assistant";
import { requestedBudgetLimit } from "@/lib/project";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const {project,instruction,demoMode}=await readBody(request,z.object({project:projectSpecSchema,instruction:z.string().min(5).max(2000),demoMode:z.boolean()}));
  const site=siteForAddress(project.propertyAddress,project.siteContextId==="site-maple-demo");
  const cap=requestedBudgetLimit(instruction,project.budgetMaximum);
  let candidate:ReturnType<typeof fallbackLayoutAdvice>|null=null;
  try{candidate=fallbackLayoutAdvice(project,instruction,site);}catch{/* Custom intent can still be interpreted live. */}
  const result=await askAstra("layout_advice",layoutAdviceSchema,`${SYSTEM}\nReturn a minimal layout patch using catalog IDs and existing element IDs. Geometry stays in ProjectSpec. Do not edit prices, hard constraints, tree or preserved elements. Use replace for substitutions; a replaced element gets a new ID, so include its final position and dimensions in that operation rather than referring to it afterward. Costs are recalculated by code. For a budget request, aim for the UPPER planning range at or below the supplied cap using real substitutions/resizing, not invented discounts. A validated deterministic candidate is supplied when available; prefer it if appropriate. Preserve unaffected elements. x increases right; y increases away from house toward rear. Check tree, setbacks, house and incompatible overlaps. Patio may support dining/shade/kitchen, but must not overlap a pool or putting green. Give concise tradeoffs and avoid any compliance or exact visual-accuracy claim.`,{project,site,instruction,budget:budgetSummary(project),cap,catalog:featureCatalog,candidate},()=>candidate??fallbackLayoutAdvice(project,instruction,site),[],demoMode);
  let advice=result.data,meta=result.meta;
  function apply(){const next=applyLayoutPatch(project,advice.patch,site); if (cap !== next.budgetMaximum && !advice.patch.operations.length) { next.version++; next.revisionHistory.push({version:next.version,instruction,summary:"Update the budget maximum; the existing planning range fits.",changes:[`Maximum budget: $${cap}`],preserved:project.elements.map(e=>e.label),createdAt:new Date().toISOString()}); } next.budgetMaximum=cap;next.budgetTarget=Math.min(next.budgetTarget,cap);if(isBudgetRequest(instruction)&&budgetSummary(next).range.high>cap)throw new Error("The proposed range is above the requested budget.");return next;}
  let next;
  try{next=apply();}catch(error){if(!candidate||meta.mode!=="live")throw error;advice=candidate;meta={...meta,mode:"fallback",reason:"Astra's patch failed deterministic validation. Using the validated catalog-based option."};next=apply();}
  return NextResponse.json({data:next,patch:advice.patch,tradeoffs:advice.tradeoffs,budget:budgetSummary(next),meta,site});
 }catch(error){return apiError(error);}
}
