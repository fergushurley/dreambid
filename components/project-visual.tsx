"use client";
import { useState } from "react";
import type { ProjectSpec, SiteContext } from "@/types";
import { photorealPreview } from "@/lib/photoreal-preview";
import { SitePlan } from "./site-plan";

export type ProjectView = "concept" | "render" | "plan";

export function ProjectVisual({ project, site, view, renderBusy }: {
  project: ProjectSpec | null;
  site: SiteContext;
  view: ProjectView;
  renderBusy: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const conceptUrl = view === "concept" ? photorealPreview(project) : null;
  const renderUrl = view !== "plan" ? project?.scene.renderUrl ?? (!project && site.isDemo ? "/demo/before.png" : null) : null;
  const preferredUrl = conceptUrl || renderUrl;
  const imageUrl = preferredUrl !== failedUrl ? preferredUrl : null;
  const showingConcept = !!conceptUrl && imageUrl === conceptUrl;
  const caption = showingConcept
    ? "Photoreal AI concept · illustrative"
    : view === "plan" ? "Site plan · preliminary geometry"
    : renderBusy ? "Preparing the exact 3D layout…"
    : project && imageUrl ? `${project.scene.renderer === "blender" ? "Blender visualization" : "Fallback visualization"} · revision ${project.version}`
    : project ? "Site plan · preliminary geometry"
    : "Blender fixture · before renovation";

  return <div className="scene-window">
    {imageUrl ? <img
      className="scene-image"
      src={imageUrl}
      alt={showingConcept
        ? `Photorealistic AI concept of ${project?.title}: ${project?.elements.some(e => e.kind === "kitchen") ? "outdoor kitchen and dining" : "cedar pergola and dining"}, with the mature oak retained. Illustrative visualization, not a photograph of a built project.`
        : project ? `Project visualization for revision ${project.version}` : "Illustrative Blender backyard before renovation"}
      onError={() => setFailedUrl(imageUrl)}
    /> : <SitePlan project={project} site={site}/>}
    <div className="scene-caption"><span><span className="tiny-dot"/>{caption}</span><span>{site.yardDimensions.widthFt} × {site.yardDimensions.depthFt} FT</span></div>
  </div>;
}
