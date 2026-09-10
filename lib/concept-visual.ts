import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import type { ProjectBrief, ProjectSpec, SiteContext } from "@/types";
import { createOpenAIClient } from "./openai";
import { renderProject, sceneHash } from "./render";
import { visualSignature } from "./visual-signature";
import { photorealPreview } from "./photoreal-preview";

type VisualResult = { visual: ProjectSpec["conceptVisual"] | null; scene: ProjectSpec["scene"]; mode: "live" | "cached" | "reference" | "unavailable"; reason: string | null };
const inFlight=new Map<string,Promise<VisualResult>>();
const DISCLAIMER="AI concept visualization, grounded in the current plan. Materials and spatial details may differ; use the site plan for dimensions. Not a current-property photograph or construction drawing.";
export async function generateConceptVisual(project:ProjectSpec,site:SiteContext,photos:ProjectBrief["photos"],demoMode:boolean):Promise<VisualResult>{
 const signature=visualSignature(project),model=process.env.OPENAI_IMAGE_MODEL||"gpt-image-2";
 const hash=createHash("sha256").update(JSON.stringify({version:1,signature,site,photos,model})).digest("hex").slice(0,24);
 const folder=path.join(process.cwd(),"public","generated"),imageFile=path.join(folder,`concept-${hash}.png`),metaFile=path.join(folder,`concept-${hash}.meta.json`);
 try { const metadata=JSON.parse(await readFile(metaFile,"utf8"));if((await readFile(imageFile)).length>1000)return {visual:{...metadata,specSignature:signature},scene:project.scene,mode:"cached",reason:null}; } catch {/* First render of this exact input. */}
 const running=inFlight.get(hash);if(running)return running;
 const task=(async():Promise<VisualResult>=>{
   const client=demoMode||process.env.DREAMBID_DEMO_MODE==="1"?null:createOpenAIClient();
   const reference=photorealPreview(project);
   const unavailable=(reason:string,scene=project.scene):VisualResult=>({visual:reference?{imageUrl:reference,specSignature:signature,model:"Retained AI concept reference",source:"reference",createdAt:"2026-09-10",disclaimer:DISCLAIMER}:null,scene,mode:reference?"reference":"unavailable",reason});
   if(!client)return unavailable(demoMode?"Demo playback uses matching retained concept imagery where available. Live regeneration requires turning demo playback off.":"Image generation is unavailable. The current site plan remains ready to use.");
   const scene=await renderProject(project);
   if(scene.renderer!=="blender")return unavailable("A Blender geometry reference could not be prepared. Your current site plan is preserved.",scene);
   try {
     const referenceBytes=await readFile(path.join(folder,`${sceneHash(project)}.png`));
     const inputs=[await toFile(referenceBytes,"current-layout.png",{type:"image/png"})];
     for(const photo of photos){const match=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(photo.dataUrl);if(match)inputs.push(await toFile(Buffer.from(match[2],"base64"),`homeowner-${inputs.length}.${match[1].split("/")[1]}`,{type:match[1]}));}
     const prompt=`Create a beautiful, credible homeowner-facing architectural concept visualization of this specific backyard plan. Image 1 is our deterministic geometry reference, not a real property photo. Retain its elevated three-quarter camera, yard aspect ratio, house side, relative feature positions, dimensions and remaining open space. Turn schematic primitives into realistic materials, restrained landscaping, water, furniture and warm late-afternoon light. Render the selected features exactly once; do not add unselected pools, kitchens, pergolas or buildings. A shade sail is tensile fabric, not a wooden pergola. A putting green is short turf with a golf cup/flag, not a pool. Preserve existing/protected elements and tree positions. Do not add people, words, logos, dimension lines or diagram overlays. Additional images, if any, are homeowner-supplied references for existing appearance; retain their house character while prioritizing this plan's placement. Source context can be inferred/fixture/unknown; do not invent authoritative property facts. Exact construction geometry is represented by the site plan; this image explores visual character.\nCURRENT PROJECT AND HOMEOWNER CONSTRAINTS: ${signature}\nSITE CONTEXT WITH PROVENANCE: ${JSON.stringify(site)}\nCURRENT SCOPE: ${JSON.stringify(project.scopeItems.map(s=>({description:s.description,quantity:s.quantity,unit:s.unit})))}.`;
     const response=await client.withOptions({timeout:150000,maxRetries:0}).images.edit({model,image:inputs,prompt,quality:"medium",size:"1536x1024",n:1});
     const encoded=response.data?.[0]?.b64_json;if(!encoded)throw new Error("No generated image returned.");
     const visual:NonNullable<ProjectSpec["conceptVisual"]>={imageUrl:`/generated/concept-${hash}.png`,specSignature:signature,model,createdAt:new Date().toISOString(),source:"live",disclaimer:DISCLAIMER};
     await mkdir(folder,{recursive:true});await writeFile(imageFile,Buffer.from(encoded,"base64"));await writeFile(metaFile,JSON.stringify(visual));
     return {visual,scene,mode:"live",reason:null};
   }catch(error){const detail=error instanceof OpenAI.APIError?`Image API returned ${error.status??"a connection error"}${error.code && /^[a-z_]+$/.test(error.code) ? ` (${error.code})` : ""}${error.param && /^[a-z_]+$/.test(error.param) ? ` for ${error.param}` : ""}.`:"The image request did not complete.";console.warn(`[DreamBid] ${detail}`);return unavailable(`${detail} Your plan and scope are unchanged; you can retry regeneration.`,scene);}
 })().finally(()=>inFlight.delete(hash));inFlight.set(hash,task);return task;
}
