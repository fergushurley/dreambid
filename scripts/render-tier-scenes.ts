import { loadEnvConfig } from "@next/env";
import { existsSync } from "node:fs";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext } from "../fixtures/site-context";
import { featuredConcepts } from "../fixtures/concepts";
import { fixtureProject } from "../lib/project";
import { sceneGeometryKey } from "../lib/scene-preview";
async function main(){
 loadEnvConfig(process.cwd());const {renderProject}=await import("../lib/render");const rows=[];const previous=JSON.parse(await readFile("fixtures/blender-previews.json","utf8")) as {geometryKey:string;finishImageUrl?:string}[];
 for(const concept of featuredConcepts(canonicalBrief).concepts){
  const project=fixtureProject(canonicalBrief,concept,canonicalSiteContext),start=Date.now();
  const scene=await renderProject(project,"max");if(scene.renderer!=="blender")throw new Error(`Blender failed for ${concept.id}`);
  const imageUrl=`/demo/${concept.palette}-layout.png`;await copyFile(`public${scene.renderUrl}`,`public${imageUrl}`);
  rows.push({variant:concept.id,imageUrl,...(previous.find(row=>row.geometryKey===sceneGeometryKey(project))?.finishImageUrl && existsSync(`public/demo/photoreal/${concept.palette}-layout-finish.png`)?{finishImageUrl:`/demo/photoreal/${concept.palette}-layout-finish.png`}:{}),geometryKey:sceneGeometryKey(project),renderer:"Blender Cycles",quality:"max",residence:canonicalSiteContext.residence,durationSeconds:Math.round((Date.now()-start)/1000),source:"Deterministic render of this exact ProjectSpec; fixture geometry, illustrative finishes."});
  console.log(`Rendered ${concept.title} in ${Math.round((Date.now()-start)/1000)}s`);
 }
 await writeFile("fixtures/blender-previews.json",JSON.stringify(rows,null,2)+"\n");
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
