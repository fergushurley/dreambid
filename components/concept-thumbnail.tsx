"use client";
import { useMemo } from "react";
import type { ProjectBrief, RenovationConcept, SiteContext } from "@/types";
import { fixtureProject } from "@/lib/project";
import { layoutConceptImage, matchingScene } from "@/lib/scene-preview";
import { SitePlan } from "./site-plan";

/** The card and selected project use the same deterministic ProjectSpec builder. */
export function ConceptThumbnail({ brief, concept, site }: { brief: ProjectBrief; concept: RenovationConcept; site: SiteContext }) {
  const project = useMemo(() => fixtureProject(brief, concept, site), [brief, concept, site]);
  const scene = matchingScene(project);
  const finish = layoutConceptImage(project);
  return scene ? <img src={finish || scene.imageUrl} alt={finish ? `${concept.title}: AI material finishes based on the Blender layout; exact geometry opens in Customize layout` : `${concept.title}: Blender rendering of the exact feature layout that opens in Customize layout`}/> : <SitePlan project={project} site={site}/>;
}
