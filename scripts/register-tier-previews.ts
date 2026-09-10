import { readFile,writeFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext } from "../fixtures/site-context";
import { featuredConcepts } from "../fixtures/concepts";
import { fixtureProject } from "../lib/project";
import { budgetSummary } from "../lib/layout";
async function main(){
 const manifest=JSON.parse(await readFile("fixtures/photoreal-previews.json","utf8"));
 const images={meadow:"meadow-simple",terrace:"terrace-kitchen",retreat:"retreat-pool"};
 const records=[];
 for(const concept of featuredConcepts(canonicalBrief).concepts){
  const p=fixtureProject(canonicalBrief,concept,canonicalSiteContext),imageUrl=`/demo/photoreal/${images[concept.palette]}.png`;
  const geometry=[p.dimensions.widthFt,p.dimensions.depthFt,[...p.elements].sort((a,b)=>a.id.localeCompare(b.id)).map(e=>[e.id,e.kind,e.position.x,e.position.y,e.size.widthFt,e.size.depthFt,e.size.heightFt,e.material,e.color])];
  const row={variant:concept.id,imageUrl,geometry,rotations:p.elements.map(e=>[e.id,e.rotationDeg??0]),model:"Built-in image generation",generatedAt:"2026-09-10",source:"Retained AI concept reference for curated feature scope; geometry is approximate, not a property photograph. See docs/CONCEPT_TIERS.md for prompts."};
  const i=manifest.findIndex((r:{variant:string})=>r.variant===concept.id);if(i<0)manifest.push(row);else manifest[i]=row;
  records.push({concept:concept.title,imageUrl,range:budgetSummary(p).range,midpoint:p.estimatedTotal,budget:p.budgetMaximum,elements:p.elements.map(e=>({kind:e.kind,range:e.indicativeRange,cost:e.estimatedCost})),conflicts:p.feasibility.conflicts.filter(c=>!c.resolved)});
 }
 await writeFile("fixtures/photoreal-previews.json",JSON.stringify(manifest,null,2)+"\n");
 await writeFile("docs/concept-tier-verification.json",JSON.stringify(records,null,2)+"\n");console.log(records.map(({concept,range,midpoint,conflicts})=>({concept,range,midpoint,conflicts})));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
