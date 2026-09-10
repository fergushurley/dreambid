import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { budgetSummary } from "../lib/layout";
import { projectSpecSchema } from "../types";
async function main(){
 const live=process.argv.includes("--live");
 async function call(route:string,payload:unknown){const response=await fetch(`http://127.0.0.1:3000/api/${route}`,{method:"POST",headers:{"Content-Type":"application/json",Origin:"http://127.0.0.1:3000"},body:JSON.stringify(payload),signal:AbortSignal.timeout(90000)});const result=await response.json();assert.ok(response.ok,JSON.stringify(result));if(live)assert.equal(result.meta.mode,"live",result.meta.reason);console.log(`${route}: ${result.meta.mode} ${result.meta.durationMs}ms`);return result;}
 const concepts=await call("concepts",{brief:canonicalBrief,demoMode:!live});assert.equal(concepts.data.concepts.length,3);
 const chosen=concepts.data.concepts[1];const result=await call("project",{brief:canonicalBrief,concept:chosen,demoMode:!live});const project=projectSpecSchema.parse(result.data);
 assert.equal(project.estimatedTotal,42900);assert.equal(project.budgetMaximum,50000);assert.deepEqual(budgetSummary(project).range,chosen.budgetRange);assert.ok(project.elements.some(e=>e.kind==="kitchen"));
 const quotes=await call("quotes",{project,demoMode:!live});assert.equal(quotes.data.quotes.length,3);
 await writeFile(`docs/tier-${live?"live":"demo"}-verification.json`,JSON.stringify({verifiedAt:new Date().toISOString(),concepts:concepts.meta,project:result.meta,quotes:quotes.meta,range:chosen.budgetRange,midpoint:project.estimatedTotal,budget:project.budgetMaximum,quoteTotals:quotes.data.quotes.map((q:{normalizedTotal:number})=>q.normalizedTotal)},null,2)+"\n");console.log("PASS: Astra context preserves the selected card scope, range and budget through quotes.");
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
