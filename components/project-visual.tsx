"use client";
import { useState } from "react";
import type { ProjectSpec, SiteContext } from "@/types";
import { matchingScene } from "@/lib/scene-preview";
import { SitePlan } from "./site-plan";

export type ProjectView = "concept" | "render" | "plan";
export function ProjectVisual({ project, site, view, renderBusy }: {project:ProjectSpec|null;site:SiteContext;view:ProjectView;renderBusy:boolean}) {
  const [failedUrl,setFailedUrl]=useState<string|null>(null);
  // Both visual tabs display one current scene. AI appearance studies live outside these tabs.
  const scene=matchingScene(project);
  const imageUrl=view!=="plan" && scene?.imageUrl!==failedUrl ? scene?.imageUrl : null;
  const caption=imageUrl ? `Blender ${scene?.quality==="max"?"detailed concept":"geometry"} · exact layout · revision ${project?.version}` : renderBusy ? "Rendering your current layout…" : "Site plan · current project geometry";
  return <div className="scene-window">
    {imageUrl ? <img className="scene-image" src={imageUrl} alt={`Blender visualization of ${project?.title}, revision ${project?.version}; feature positions match the site plan. Illustrative materials, not a property photograph.`} onError={()=>setFailedUrl(imageUrl)}/> : <SitePlan project={project} site={site}/>}
    {view!=="plan" && project && !imageUrl && <div className="concept-empty"><strong>{renderBusy?"Bringing this exact layout to life.":"Your updated layout is ready."}</strong><span>{renderBusy?"Blender is rendering the same feature positions, sizes and rotations.":"Render the concept to see your latest changes in detail."}</span></div>}
    <div className="scene-caption"><span><span className="tiny-dot"/>{caption}</span><span>{site.yardDimensions.widthFt} × {site.yardDimensions.depthFt} FT</span></div>
  </div>;
}
