import { z } from "zod";
import { layoutPatchSchema, type LayoutPatch, type ProjectElement, type ProjectSpec, type SiteContext } from "@/types";
import { catalogById } from "@/fixtures/feature-catalog";
import { applyLayoutPatch, budgetSummary, dimensionBounds, isQuarterTurn } from "./layout";
import { checkFeasibility } from "./feasibility";
import { requestedBudgetLimit } from "./project";
export const layoutAdviceSchema = z.object({ patch: layoutPatchSchema, tradeoffs: z.array(z.string()).max(8) });
export const isBudgetRequest = (instruction: string) => /under|budget|afford|fit everything|spend|maximum|cap\b/i.test(instruction);

/** Conservative, explainable fallback: substitutions and resizing, never invented unit-price reductions. */
export function budgetFitPatch(input: ProjectSpec, site: SiteContext, cap = input.budgetMaximum): LayoutPatch {
  let draft = structuredClone(input);
  const identity = new Map(input.elements.map(e => [e.id,e.id]));
  function edit(op: LayoutPatch["operations"][number]) {
    const before=draft; draft=applyLayoutPatch(draft,{summary:"Budget option",operations:[op]},site,false);
    if (op.action === "replace") identity.set(draft.elements.find(e=>!before.elements.some(old=>old.id===e.id))!.id, identity.get(op.elementId)!);
  }
  const over = () => budgetSummary(draft).range.high > cap;
  for (const e of [...draft.elements]) {
    if (!over()) break;
    if (!e.preserved && (e.kind === "pool" || e.kind === "pergola" || e.kind === "gazebo")) edit({action:"replace",elementId:e.id,catalogItemId:e.kind==="pool"?"plunge_pool":"shade_sail",position:null,dimensions:null});
  }
  // Retain dining, tree and feature identities where possible. Trim largest flexible surfaces first.
  for (const kind of ["patio","pavers","putting_green","mini_golf","landscaping","planter","kitchen","plunge_pool","lighting"]) {
    for (const e of [...draft.elements].filter(e=>e.kind===kind && !e.preserved)) {
      if (!over()) break;
      const item=catalogById.get(e.catalogItemId??e.kind); if (!item || item.priceModel.basis==="fixed") continue;
      const comfortable: Record<string,[number,number]>={patio:[18,14],pavers:[18,14],putting_green:[8,10],mini_golf:[8,12],kitchen:[8,3],plunge_pool:[6,8],planter:[8,2],landscaping:[8,4],lighting:[12,12]};
      const desired=[...(comfortable[kind]??[item.minSize.widthFt,item.minSize.depthFt])];
      if(isQuarterTurn(e)) desired.reverse();
      const bounds=dimensionBounds(e);
      edit({action:"update",elementId:e.id,position:null,dimensions:{widthFt:Math.min(e.size.widthFt,Math.max(bounds.min.widthFt,desired[0])),depthFt:Math.min(e.size.depthFt,Math.max(bounds.min.depthFt,desired[1]))}});
    }
  }
  if (over()) for (const e of [...draft.elements].filter(e=>e.kind==="plunge_pool" && !e.preserved)) { edit({action:"replace",elementId:e.id,catalogItemId:"spa",position:null,dimensions:null}); if (!over()) break; }
  // Reposition only elements in conflicts; keep the user's protected features fixed.
  for (let pass=0; pass<3; pass++) {
    const current=checkFeasibility(draft,site,false);
    if (!current.feasibility.conflicts.some(c=>!c.resolved)) break;
    const affected=new Set(current.feasibility.conflicts.filter(c=>!c.resolved).map(c=>c.elementId));
    for (const e of [...draft.elements].filter(e=>affected.has(e.id) && !e.preserved).sort((a,b)=>a.size.widthFt*a.size.depthFt-b.size.widthFt*b.size.depthFt)) {
      let best:{x:number;y:number}|null=null, distance=Infinity;
      for(let y=0;y<=draft.dimensions.depthFt-e.size.depthFt;y+=1) for(let x=0;x<=draft.dimensions.widthFt-e.size.widthFt;x+=1) {
        const d=Math.hypot(x-e.position.x,y-e.position.y); if(d>=distance)continue;
        const checked=checkFeasibility({...draft,elements:draft.elements.map(row=>row.id===e.id?{...row,position:{x,y}}:row)},site,false);
        if(!checked.feasibility.conflicts.some(c=>c.elementId===e.id&&!c.resolved)){best={x,y};distance=d;}
      }
      if(best) edit({action:"update",elementId:e.id,position:best,dimensions:null});
    }
  }
  const operations:LayoutPatch["operations"]=[];
  for(const e of draft.elements){
    const original=input.elements.find(old=>old.id===identity.get(e.id))!;
    if(e.kind!==original.kind)operations.push({action:"replace",elementId:original.id,catalogItemId:e.catalogItemId!,position:e.position,dimensions:{widthFt:e.size.widthFt,depthFt:e.size.depthFt}});
    else if(JSON.stringify(e.position)!==JSON.stringify(original.position)||JSON.stringify(e.size)!==JSON.stringify(original.size))operations.push({action:"update",elementId:original.id,position:JSON.stringify(e.position)!==JSON.stringify(original.position)?e.position:null,dimensions:JSON.stringify(e.size)!==JSON.stringify(original.size)?{widthFt:e.size.widthFt,depthFt:e.size.depthFt}:null});
  }
  if(over())throw new Error("The available substitutions still exceed your budget range. Remove a major feature or choose a higher budget explicitly; no prices were artificially reduced.");
  return layoutPatchSchema.parse({summary:"Keep the tree; use smaller, less expensive features and adjust conflicting placements. The preliminary upper range fits the requested budget.",operations});
}
export function fallbackLayoutAdvice(project:ProjectSpec, instruction:string, site:SiteContext):z.infer<typeof layoutAdviceSchema>{
  const find=(kind:string)=>project.elements.find(e=>e.kind===kind);
  const update=(e:ProjectElement,dimensions:{widthFt:number;depthFt:number}|null,position:{x:number;y:number}|null)=>({action:"update" as const,elementId:e.id,dimensions,position});
  let patch:LayoutPatch;
  if(isBudgetRequest(instruction)) patch=budgetFitPatch(project,site,requestedBudgetLimit(instruction,project.budgetMaximum));
  else if(/pool.*(?:farther|further|away).*house/i.test(instruction) && (find("pool")||find("plunge_pool"))){const e=(find("pool")||find("plunge_pool"))!;patch={summary:"Move the pool 4 ft farther from the house; check the updated placement warnings.",operations:[update(e,null,{x:e.position.x,y:e.position.y+4})]};}
  else if(/(?:putting green|mini golf).*smaller/i.test(instruction)&&(find("putting_green")||find("mini_golf"))){const e=(find("putting_green")||find("mini_golf"))!,bounds=dimensionBounds(e);patch={summary:"Reduce the putting area and its size-based planning estimate.",operations:[update(e,{widthFt:Math.max(bounds.min.widthFt,Math.round(e.size.widthFt*.75)),depthFt:Math.max(bounds.min.depthFt,Math.round(e.size.depthFt*.75))},null)]};}
  else if(/remove.*pergola.*shade sail/i.test(instruction)&&find("pergola"))patch={summary:"Replace the pergola with a shade sail; keep the existing tree.",operations:[{action:"replace",elementId:find("pergola")!.id,catalogItemId:"shade_sail",position:null,dimensions:null}]};
  else if(/(?:add|room for).*(?:hot tub|\bspa\b)/i.test(instruction))patch={summary:"Add a compact spa; review utility and placement warnings.",operations:[{action:"add",catalogItemId:"spa",position:{x:5,y:40},dimensions:null}]};
  else if(/more lawn/i.test(instruction)&&find("patio")){const e=find("patio")!;patch={summary:"Reduce the patio footprint to leave more open yard area. New lawn installation is not included.",operations:[update(e,{widthFt:Math.max(12,e.size.widthFt-4),depthFt:Math.max(10,e.size.depthFt-4)},null)]};}
  else throw new Error("Offline layout edits support the example commands. Try a listed example or use funded Astra access for a custom instruction.");
  return {patch,tradeoffs:["Catalog ranges and size formulas are preliminary assumptions; confirm installed costs with contractors.","Check the updated feasibility warnings. No permit or construction approval is implied."]};
}
