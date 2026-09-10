import type { ProjectSpec } from "@/types";
import { DEMO_ADDRESS, DEMO_RESIDENCE_VERSION } from "@/fixtures/site-context";
import previews from "@/fixtures/blender-previews.json";
import { visualSignature } from "./visual-signature";

/** The same geometry key gates every retained deterministic view. Budget/prose do not move objects. */
export function sceneGeometryKey(project: ProjectSpec): string {
  return JSON.stringify({ site: project.siteContextId, address: project.propertyAddress, residence: DEMO_RESIDENCE_VERSION, dimensions: project.dimensions,
    elements: [...project.elements].sort((a,b)=>a.id.localeCompare(b.id)).map(e=>[e.id,e.kind,e.label,e.position,e.size,e.material,e.color,e.rotationDeg??0]) });
}
export function matchingScene(project: ProjectSpec | null): { imageUrl: string; quality: "max" | "preview"; source: "live" | "retained" } | null {
  if (!project) return null;
  const scene=project.scene;
  if (scene.renderer === "blender" && scene.renderUrl && scene.specSignature === visualSignature(project)) return {imageUrl:scene.renderUrl,quality:scene.quality??"preview",source:"live"};
  if (project.siteContextId !== "site-maple-demo" || project.propertyAddress !== DEMO_ADDRESS) return null;
  const preview=(previews as {imageUrl:string;geometryKey:string}[]).find(p=>p.geometryKey===sceneGeometryKey(project));
  return preview ? {imageUrl:preview.imageUrl,quality:"max",source:"retained"} : null;
}
