import type { ProjectSpec } from "@/types";
import previews from "@/fixtures/photoreal-previews.json";

/** Illustrative AI images are shown only for the geometry they were created from. */
export function photorealPreview(project: ProjectSpec | null): string | null {
  if (!project || project.siteContextId !== "site-maple-demo") return null;
  const geometry = [
    project.dimensions.widthFt,
    project.dimensions.depthFt,
    [...project.elements].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(e => [
      e.id, e.kind, e.position.x, e.position.y,
      e.size.widthFt, e.size.depthFt, e.size.heightFt, e.material, e.color,
    ]),
  ];
  const signature = JSON.stringify(geometry);
  return previews.find(preview => {
    if (JSON.stringify(preview.geometry) !== signature) return false;
    const rotations = ("rotations" in preview ? preview.rotations : undefined) ?? project.elements.map(e=>[e.id,0]);
    return JSON.stringify(rotations.slice().sort()) === JSON.stringify(project.elements.map(e=>[e.id,e.rotationDeg??0]).sort());
  })?.imageUrl ?? null;
}
