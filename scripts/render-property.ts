import { loadEnvConfig } from "@next/env";
import { copyFile,mkdir,writeFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext } from "../fixtures/site-context";
import { fallbackConcepts } from "../fixtures/concepts";
import { fixtureProject } from "../lib/project";
async function main(){
 loadEnvConfig(process.cwd());const {renderProject}=await import("../lib/render");
 const base=fixtureProject(canonicalBrief,fallbackConcepts(canonicalBrief).concepts[1],canonicalSiteContext);
 const existing=canonicalSiteContext.existingStructures.find(e=>e.kind==="patio")!;
 const before={...base,elements:base.elements.filter(e=>e.kind==="tree"||e.kind==="patio").map(e=>e.kind==="patio"?{...e,position:existing.position,size:{widthFt:existing.widthFt,depthFt:existing.depthFt,heightFt:.25}}:e)};
 const start=Date.now();const scene=await renderProject(before,"max");if(scene.renderer!=="blender")throw new Error("Max-quality Blender property render failed or timed out.");
 await mkdir("public/demo",{recursive:true});await copyFile(`public${scene.renderUrl}`,"public/demo/property-max.png");
 await writeFile("docs/blender-property-verification.json",JSON.stringify({createdAt:new Date().toISOString(),durationSeconds:Math.round((Date.now()-start)/1000),renderer:"Blender Cycles",quality:"max",maximumSamples:128,adaptiveThreshold:.04,resolution:[1920,1280],source:"Authored fixture geometry with procedural materials, individual leaves, modeled siding, roof and fence. Architectural finishes and heights are illustrative.",siteContextId:before.siteContextId,sourceScene:scene.renderUrl},null,2)+"\n");
 console.log(`Rendered property at max quality in ${Math.round((Date.now()-start)/1000)}s: public/demo/property-max.png`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
