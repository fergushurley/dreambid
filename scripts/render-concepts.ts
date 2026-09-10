import { mkdir,readFile,writeFile,copyFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext } from "../fixtures/site-context";
import { fallbackConcepts } from "../fixtures/concepts";
import { fixtureProject } from "../lib/project";
async function main(){
 const manifest=JSON.parse(await readFile("fixtures/photoreal-previews.json","utf8"));
 await mkdir("public/demo/photoreal",{recursive:true});
 for(const concept of fallbackConcepts(canonicalBrief).concepts.filter(c=>c.palette!=="terrace")){
   const project=fixtureProject(canonicalBrief,concept,canonicalSiteContext);
   const response=await fetch("http://127.0.0.1:3000/api/visualize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({project,photos:[],demoMode:false}),signal:AbortSignal.timeout(240000)});
   const result=await response.json();if(!response.ok||!result.visual||result.mode==="reference")throw new Error(result.reason||"No generated concept");
   const imageUrl=`/demo/photoreal/${concept.palette}.png`;await copyFile(`public${result.visual.imageUrl}`,`public${imageUrl}`);
   const geometry=[project.dimensions.widthFt,project.dimensions.depthFt,[...project.elements].sort((a,b)=>a.id.localeCompare(b.id)).map(e=>[e.id,e.kind,e.position.x,e.position.y,e.size.widthFt,e.size.depthFt,e.size.heightFt,e.material,e.color])];
   const row={variant:concept.palette,imageUrl,geometry,model:result.visual.model,generatedAt:result.visual.createdAt,source:"AI concept generated from deterministic Blender fixture; not a property photograph"};
   const index=manifest.findIndex((r:{variant:string})=>r.variant===concept.palette);if(index>=0)manifest[index]=row;else manifest.push(row);
   await writeFile("fixtures/photoreal-previews.json",JSON.stringify(manifest,null,2)+"\n");console.log(`${concept.palette}: ${result.mode}, retained ${imageUrl}`);
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
