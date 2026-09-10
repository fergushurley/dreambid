import assert from "node:assert/strict";
import { mkdir,writeFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { applyLayoutPatch,budgetSummary,suggestedPosition } from "../lib/layout";
import { visualSignature } from "../lib/visual-signature";
import { projectSpecSchema, quoteRecommendationSchema } from "../types";
async function main(){
 const live=process.argv.includes("--live"),visual=process.argv.includes("--visual");
 const evidence:Record<string,unknown>={};
 async function call(route:string,payload:unknown){const response=await fetch(`http://127.0.0.1:3000/api/${route}`,{method:"POST",headers:{"Content-Type":"application/json",Origin:"http://127.0.0.1:3000"},body:JSON.stringify(payload),signal:AbortSignal.timeout(240000)});const result=await response.json();assert.ok(response.ok,`${route}: ${JSON.stringify(result)}`);console.log(`${route}: ${result.meta?.mode??result.mode??"ok"} ${result.meta?.reason??result.reason??""}`);return result;}
 const brief={...canonicalBrief,budget:75000,description:"Make this backyard a great entertaining space under $75K. Keep the mature tree."};
 const concepts=await call("concepts",{brief,demoMode:true});assert.equal(concepts.data.concepts.length,3);
 const initial=await call("project",{brief,concept:concepts.data.concepts[1],demoMode:true});let project=projectSpecSchema.parse(initial.data);const site=initial.site;
 for(const id of ["pool","putting_green","kitchen"])project=applyLayoutPatch(project,{summary:`Add ${id}`,operations:[{action:"add",catalogItemId:id,position:suggestedPosition(project,id,site),dimensions:null}]},site);
 assert.ok(budgetSummary(project).range.high>75000);
 const pool=project.elements.find(e=>e.kind==="pool")!;
 const conflicted=applyLayoutPatch(project,{summary:"Drag pool to rear",operations:[{action:"update",elementId:pool.id,position:{x:5,y:30},dimensions:null}]},site);
 assert.ok(conflicted.feasibility.conflicts.some(c=>c.elementId===pool.id&&/rear setback/.test(c.explanation)&&!c.resolved));
 const green=project.elements.find(e=>e.kind==="putting_green")!;
 project=applyLayoutPatch(conflicted,{summary:"Shrink putting green",operations:[{action:"update",elementId:green.id,position:null,dimensions:{widthFt:8,depthFt:10}}]},site);
 assert.ok(project.estimatedTotal<conflicted.estimatedTotal);
 const result=await call("layout",{project,instruction:"Keep the tree and get this under $75K.",demoMode:!live});
 const revised=projectSpecSchema.parse(result.data);assert.ok(budgetSummary(revised).range.high<=75000);assert.deepEqual(revised.elements.find(e=>e.kind==="tree"),initial.data.elements.find((e:{kind:string})=>e.kind==="tree"));assert.equal(revised.feasibility.conflicts.filter(c=>!c.resolved).length,0);
 const quotes=await call("quotes",{project:revised,demoMode:!live});quoteRecommendationSchema.parse(quotes.data);
 evidence.layout={meta:result.meta,before:budgetSummary(project),after:budgetSummary(revised),patch:result.patch,quoteMeta:quotes.meta};
 if(visual){const image=await call("visualize",{project:revised,photos:[],demoMode:!live});evidence.visual=image;if(image.visual){assert.equal(image.visual.specSignature,visualSignature(revised));assert.equal((await fetch(`http://127.0.0.1:3000${image.visual.imageUrl}`)).status,200);console.log(`Concept asset: ${image.visual.imageUrl}`);}else if(live)process.exitCode=2;}
 await mkdir(".artifacts",{recursive:true});await writeFile(`.artifacts/layout-${live?"live":"demo"}.json`,JSON.stringify({project:revised,site,evidence},null,2));
 console.log(`PASS: added features, warned setback, resize price reduction, budget patch ${budgetSummary(revised).range.low}–${budgetSummary(revised).range.high}, retained tree, final-scope quotes.`);
 if(live&&(result.meta.mode!=="live"||quotes.meta.mode!=="live"))process.exitCode=2;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
