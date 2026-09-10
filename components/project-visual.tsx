"use client";
import { useState } from "react";
import type { ProjectSpec, SiteContext } from "@/types";
import { photorealPreview } from "@/lib/photoreal-preview";
import { currentConceptImage } from "@/lib/visual-signature";
import { SitePlan } from "./site-plan";

export type ProjectView = "concept" | "render" | "plan";

export function ProjectVisual({ project, site, view, renderBusy }: {
  project: ProjectSpec | null;
  site: SiteContext;
  view: ProjectView;
  renderBusy: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const conceptUrl = view === "concept" ? (currentConceptImage(project) || photorealPreview(project)) : null;
  const renderUrl = view === "render" ? project?.scene.renderUrl ?? (!project && site.isDemo ? "/demo/before.png" : null) : null;
  const preferredUrl = conceptUrl || renderUrl;
  const imageUrl = preferredUrl !== failedUrl ? preferredUrl : null;
  const showingConcept = !!conceptUrl && imageUrl === conceptUrl;
  const caption = showingConcept
    ? `AI concept · ${project?.conceptVisual?.source === "live" ? "current layout reference" : "retained reference"} · illustrative`
    : view === "plan" ? "Site plan · preliminary geometry"
    : renderBusy ? "Preparing the exact 3D layout…"
    : project && imageUrl ? `${project.scene.renderer === "blender" ? `Blender ${project.scene.quality === "max" ? "max-quality" : "geometry"} render` : "Fallback visualization"} · revision ${project.version}`
    : project ? "Site plan · preliminary geometry"
    : "Blender fixture · before renovation";

  return <div className="scene-window">
    {imageUrl ? <img
      className="scene-image"
      src={imageUrl}
      alt={showingConcept
        ? `AI concept of ${project?.title}. Illustrative design grounded in the selected plan; not a current-property photo. Refer to the site plan for dimensions.`
        : project ? `Project visualization for revision ${project.version}` : "Illustrative Blender backyard before renovation"}
      onError={() => setFailedUrl(imageUrl)}
    /> : <SitePlan project={project} site={site}/>}
    {view === "concept" && project && !imageUrl && <div className="concept-empty"><strong>Your layout is ready to imagine.</strong><span>Generate an AI concept to explore materials and atmosphere.</span></div>}
    <div className="scene-caption"><span><span className="tiny-dot"/>{caption}</span><span>{site.yardDimensions.widthFt} × {site.yardDimensions.depthFt} FT</span></div>
  </div>;
}
