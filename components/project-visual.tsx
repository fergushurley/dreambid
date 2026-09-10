"use client";
import { useState } from "react";
import type { ProjectSpec, SiteContext } from "@/types";
import { currentConceptImage } from "@/lib/visual-signature";
import { matchingScene, layoutConceptImage } from "@/lib/scene-preview";
import { SitePlan } from "./site-plan";

export type ProjectView = "concept" | "render" | "plan";
export function ProjectVisual({ project, site, view, renderBusy, propertyPhoto }: {project:ProjectSpec|null;site:SiteContext;view:ProjectView;renderBusy:boolean;propertyPhoto?:string}) {
  const [failedUrl,setFailedUrl]=useState<string|null>(null);
  // Both visual tabs display one current scene. AI appearance studies live outside these tabs.
  const scene=matchingScene(project);
  const photoConcept=view==="concept" ? (site.isDemo ? layoutConceptImage(project) : currentConceptImage(project)) : null;
  const reference=!site.isDemo && view==="concept" && !photoConcept ? propertyPhoto || site.propertyContext?.images.find(i=>i.provider==="usgs")?.imageUrl : null;
  const imageUrl=reference!==failedUrl&&reference?reference:photoConcept!==failedUrl&&photoConcept?photoConcept:(site.isDemo || view==="render") && view!=="plan" && scene?.imageUrl!==failedUrl ? scene?.imageUrl : null;
  const caption=reference ? "Current property reference · awaiting AI concept" : photoConcept ? site.isDemo ? "AI finishes · Blender layout reference · verify dimensions in plan" : `AI concept · ${project?.conceptVisual?.grounding?.primary==="homeowner_photo"?"homeowner photo":"public aerial reference"} · approximate placement` : imageUrl ? `Blender ${scene?.quality==="max"?"detailed concept":"geometry"} · exact layout · revision ${project?.version}` : renderBusy ? "Rendering your current layout…" : "Site plan · current project geometry";
  return <div className="scene-window">
    {imageUrl ? <img className="scene-image" src={imageUrl} alt={reference?"Current property reference; this is not a proposed design":photoConcept?`AI concept for ${project?.propertyAddress}, based on property imagery; proposed features and dimensions are illustrative`:`Blender visualization of ${project?.title}, revision ${project?.version}; feature positions match the site plan. Illustrative materials, not a property photograph.`} onError={()=>setFailedUrl(imageUrl)}/> : <SitePlan project={project} site={site}/>}
    {view!=="plan" && project && (!imageUrl || reference) && <div className="concept-empty"><strong>{renderBusy?"Bringing this exact layout to life.":site.isDemo?"Your updated layout is ready.":"Imagine this property transformed."}</strong><span>{renderBusy?"Blender is rendering the same feature positions, sizes and rotations.":site.isDemo?"Render the concept to see your latest changes in detail.":"Generate a concept using your photos or available public aerial context."}</span></div>}
    <div className="scene-caption"><span><span className="tiny-dot"/>{caption}</span><span>{site.yardDimensions.widthFt} × {site.yardDimensions.depthFt} FT</span></div>
  </div>;
}
