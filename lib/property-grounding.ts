import { createHash } from "node:crypto";
import type { ProjectBrief,ProjectSpec,SiteContext } from "@/types";
import { fetchPropertyImage } from "./property-source";
export type Grounding=NonNullable<NonNullable<ProjectSpec["conceptVisual"]>["grounding"]>;
export function siteForModel(site:SiteContext):SiteContext {
 const copy=structuredClone(site);
 if(copy.propertyContext){
  // Google Maps content is display-only, never copied into model prompts or generated imagery.
  const context=copy.propertyContext;
  if(context.publicResolution)context.resolution=context.publicResolution;
  else if(context.resolution.provider==="google"){delete copy.propertyContext;return copy;}
  context.images=context.images.filter(i=>i.provider==="usgs"&&i.generationAllowed);
  context.streetViewStatus="not_configured";context.warnings=context.warnings.filter(w=>!w.includes("Google")&&!w.includes("Street View"));
 }
 return copy;
}
export async function preparePropertyGrounding(site:SiteContext,photos:ProjectBrief["photos"]):Promise<{photos:ProjectBrief["photos"];grounding:Grounding|null;site:SiteContext}> {
 const modelSite=siteForModel(site);
 if(photos.length)return {photos,site:modelSite,grounding:{primary:"homeowner_photo",propertyAddress:site.propertyAddress,inputs:photos.map(p=>({source:`Homeowner photo: ${p.name}`,sha256:createHash("sha256").update(p.dataUrl).digest("hex"),capturedAt:null}))}};
 const aerial=modelSite.propertyContext?.images.find(i=>i.provider==="usgs"&&i.generationAllowed);
 if(aerial)try{
  const {bytes,contentType}=await fetchPropertyImage(aerial);
  return {photos:[{name:`${aerial.source} · acquired ${aerial.capturedAt??"date unknown"}`,dataUrl:`data:${contentType};base64,${bytes.toString("base64")}`}],site:modelSite,grounding:{primary:"public_aerial",propertyAddress:site.propertyAddress,inputs:[{source:aerial.source,sha256:createHash("sha256").update(bytes).digest("hex"),capturedAt:aerial.capturedAt}]}};
 }catch{/* Missing aerial must not break a project or discard uploaded photographs. */}
 return {photos:[],site:modelSite,grounding:site.isDemo?{primary:"demo_geometry",propertyAddress:site.propertyAddress,inputs:[]}:null};
}
/** Image bytes travel through the explicit vision input, never as accidental text tokens. */
export function projectForModel(project:ProjectSpec):ProjectSpec {
 const copy=structuredClone(project);delete copy.conceptVisual;return copy;
}
