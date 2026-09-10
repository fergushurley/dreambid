import type { ProjectSpec } from "@/types";
import { DEMO_ADDRESS, DEMO_RESIDENCE_VERSION } from "@/fixtures/site-context";
/** Browser-safe identity: every concept depends on the current geometry and homeowner constraints. */
export function visualSignature(project: ProjectSpec): string {
  return JSON.stringify({site:project.siteContextId,address:project.propertyAddress,residence:project.siteContextId==="site-maple-demo"&&project.propertyAddress===DEMO_ADDRESS?DEMO_RESIDENCE_VERSION:undefined,dimensions:project.dimensions,goals:project.homeownerGoals,hard:project.hardConstraints,soft:project.softConstraints,budget:project.budgetMaximum,elements:project.elements.map(e=>[e.kind,e.label,e.position,e.size,e.material,e.color,e.preserved,e.rotationDeg??0]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
}
export function currentConceptImage(project:ProjectSpec|null):string|null {
  return project?.conceptVisual?.specSignature=== (project ? visualSignature(project) : null) ? project!.conceptVisual!.imageUrl : null;
}
