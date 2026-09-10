import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { z } from "zod";
async function main() {
 loadEnvConfig(process.cwd());
 process.env.DREAMBID_PROPERTY_PROVIDER="public";
 const {resolveSiteContext}=await import("../lib/property-context");
 const {preparePropertyGrounding}=await import("../lib/property-grounding");
 const {generateConceptVisual}=await import("../lib/concept-visual");
 const {askAstra}=await import("../lib/openai");
 const {canonicalBrief}=await import("../fixtures/project");
 const {featuredConcepts}=await import("../fixtures/concepts");
 const {fixtureProject}=await import("../lib/project");
 const results=[];
 for(const address of ["2640 Steiner St, San Francisco, CA 94115","11222 Dilling St, Studio City, CA 91602"]){
  const site=await resolveSiteContext(address),prepared=await preparePropertyGrounding(site,[]);
  assert.equal(site.propertyContext?.resolution.status,"matched");assert.equal(prepared.grounding?.primary,"public_aerial");assert.equal(prepared.photos.length,1);
  const brief={...canonicalBrief,propertyAddress:address,useDemoSite:false};
  const project=fixtureProject(brief,featuredConcepts(brief).concepts[1],site);
  const result:Record<string,unknown>={address,location:site.propertyContext!.resolution.location,imagerySource:prepared.grounding!.inputs,concept:null,astra:null};
  console.log(`Resolved ${address}: ${JSON.stringify(result.location)}; actual aerial SHA ${prepared.grounding!.inputs[0].sha256}`);
  if(process.argv.includes("--generate")){
   const analysis=await askAstra("property_grounding_check",z.object({observations:z.array(z.string()),uncertainties:z.array(z.string())}),"Describe only what is visible in this actual aerial image and relevant to the supplied backyard brief. Distinguish observed context from unverified target parcel and dimensions. Never claim the approximate Census point identifies the exact roof. No recommendations to modify neighboring properties.",{brief,site:prepared.site},()=>({observations:[],uncertainties:["AI unavailable"]}),prepared.photos);
   result.astra=analysis;assert.equal(analysis.meta.mode,"live");
   const visual=await generateConceptVisual(project,site,[],false);result.concept=visual;
   assert.ok(visual.mode==="live"||visual.mode==="cached",visual.reason??"No live image");assert.equal(visual.visual?.grounding?.inputs[0].sha256,prepared.grounding!.inputs[0].sha256);
   console.log(`Astra ${analysis.meta.mode}; concept ${visual.mode}: ${visual.visual?.imageUrl}`);
  }
  results.push(result);
 }
 assert.notDeepEqual(results[0].location,results[1].location);assert.notDeepEqual(results[0].imagerySource,results[1].imagerySource);
 await mkdir(".artifacts",{recursive:true});await writeFile(".artifacts/property-grounding-verification.json",JSON.stringify({verifiedAt:new Date().toISOString(),results},null,2));
 console.log("PASS: two distinct residential address matches, real public aerial inputs, and address-specific grounding.");
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
