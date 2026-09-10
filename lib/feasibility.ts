import { projectSpecSchema, type ProjectElement, type ProjectSpec, type SiteContext, type FeasibilityCheck } from "@/types";
import { catalogById } from "@/fixtures/feature-catalog";

const isStructure = (e: ProjectElement) => catalogById.get(e.catalogItemId ?? e.kind)?.setbacksMayApply ?? false;
export const rectanglesOverlap = (a: { position: { x: number; y: number }; size: { widthFt: number; depthFt: number } }, b: { position: { x: number; y: number }; size: { widthFt: number; depthFt: number } }) => a.position.x < b.position.x + b.size.widthFt - .01 && a.position.x + a.size.widthFt > b.position.x + .01 && a.position.y < b.position.y + b.size.depthFt - .01 && a.position.y + a.size.depthFt > b.position.y + .01;
const surfaces = new Set(["patio", "pavers", "deck", "path"]);
const overlays = new Set(["lighting", "pathway_lighting", "lawn", "turf"]);
const shades = new Set(["pergola", "shade_sail", "gazebo"]);
export function conflictingOverlap(a: ProjectElement, b: ProjectElement): boolean {
  if (a.kind === "tree" || b.kind === "tree" || overlays.has(a.kind) || overlays.has(b.kind)) return false;
  // Furnishings, shade and kitchen islands intentionally sit on a hardscape surface.
  const supported = new Set(["dining", "lounge", "pergola", "shade_sail", "gazebo", "kitchen", "grill", "pizza_oven", "fire_pit", "fire_table"]);
  if ((surfaces.has(a.kind) && supported.has(b.kind)) || (surfaces.has(b.kind) && supported.has(a.kind))) return false;
  if ((shades.has(a.kind) && ["dining", "lounge"].includes(b.kind)) || (shades.has(b.kind) && ["dining", "lounge"].includes(a.kind))) return false;
  return rectanglesOverlap(a, b);
}
const distToRect = (x: number, y: number, e: ProjectElement) => Math.hypot(Math.max(e.position.x - x, 0, x - e.position.x - e.size.widthFt), Math.max(e.position.y - y, 0, y - e.position.y - e.size.depthFt));
const numberOrNull = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

/** Feet; origin at the house-left backyard corner. Elements use lower-left; trees use center. */
export function checkFeasibility(input: ProjectSpec, site: SiteContext, repair = true): ProjectSpec {
  const project = structuredClone(input);
  const side = numberOrNull(site.sideSetback.value);
  const rear = numberOrNull(site.rearSetback.value);
  const tree = site.protectedTree;
  const result: FeasibilityCheck = {
    status: "needs_verification", likelyCompliant: [], conflicts: [],
    unknowns: ["Survey boundaries, utilities and easements are unverified.", "Drainage, foundations, fire clearances and impervious coverage require professional review.", "No permit approval has been obtained."],
    nextChecks: ["Confirm site dimensions and property lines with a survey.", "Verify actual setbacks and permits with the municipal building department.", "Have an arborist confirm the tree root protection zone."],
    assumptions: [site.isDemo ? "Setback checks use labeled fixture rules, not municipal regulations." : "The design canvas is an assumed size; no authoritative property rules are available.", "The stated envelope is applied to catalog features marked setback-relevant as a preliminary screening assumption; actual feature-specific rules may differ.", "Furniture and shade may overlap their supporting patio; lighting and lawn are treated as overlays. Fire, pool-barrier and operating clearances are not modeled."],
    checkedAt: new Date().toISOString(),
    disclaimer: "Preliminary feasibility check. Subject to survey and municipal verification. Verify with architect, contractor and building department before construction.",
  };
  if (side === null || rear === null) result.unknowns.push("Rear and side setbacks are unknown. No legal compliance conclusion is possible.");

  for (const e of project.elements) {
    if (e.kind === "tree") continue;
    const minX = isStructure(e) ? side ?? 0 : 0;
    const maxX = project.dimensions.widthFt - e.size.widthFt - minX;
    const maxY = project.dimensions.depthFt - e.size.depthFt - (isStructure(e) ? rear ?? 0 : 0);
    const before = { ...e.position };
    if (maxX < minX || maxY < 0) {
      result.conflicts.push({ elementId: e.id, rule: "footprint", explanation: `${e.label} is too large for the available design envelope; resize before proceeding.`, resolved: false, before, after: null });
      continue;
    }
    const outside = e.position.x < minX || e.position.x > maxX || e.position.y < 0 || e.position.y > maxY;
    if (outside) {
      if (repair && !e.preserved) e.position = { x: Math.max(minX, Math.min(maxX, e.position.x)), y: Math.max(0, Math.min(maxY, e.position.y)) };
      const resolved = repair && !e.preserved;
      const explanation = e.position.y + e.size.depthFt > project.dimensions.depthFt ? `${e.label} extends outside the rear yard boundary.` : e.position.y < 0 ? `${e.label} extends outside the yard toward the house.` : isStructure(e) && rear !== null && e.position.y > maxY ? `${e.label} enters the ${rear} ft rear setback.` : isStructure(e) && side !== null && (e.position.x < minX || e.position.x > maxX) ? `${e.label} crosses the ${side} ft side setback.` : `${e.label} extends outside the yard boundary.`;
      result.conflicts.push({ elementId: e.id, rule: isStructure(e) ? "setback" : "site_boundary", explanation: resolved ? `${e.label} moved ${Math.round(Math.hypot(e.position.x - before.x, e.position.y - before.y) * 10) / 10} ft to fit the ${site.isDemo ? "illustrative" : "known / assumed"} envelope.` : explanation, resolved, before, after: resolved ? { ...e.position } : null });
    }
    if (tree && e.kind !== "lighting" && distToRect(tree.position.x, tree.position.y, e) < tree.protectionRadiusFt) {
      const treeBefore = { ...e.position };
      let candidate: { x: number; y: number } | null = null;
      if (repair && !e.preserved) {
        // Bounded deterministic search, choosing the closest valid location.
        let best = Infinity;
        for (let x = minX; x <= maxX; x += 1) for (let y = 0; y <= maxY; y += 1) {
          const test = { ...e, position: { x, y } };
          const distance = Math.hypot(x - treeBefore.x, y - treeBefore.y);
          if (distToRect(tree.position.x, tree.position.y, test) >= tree.protectionRadiusFt && distance < best) { candidate = { x, y }; best = distance; }
        }
      }
      if (candidate) e.position = candidate;
      result.conflicts.push({ elementId: e.id, rule: "tree_protection", explanation: candidate ? `${e.label} repositioned to preserve the ${tree.protectionRadiusFt} ft tree protection zone.` : `${e.label} overlaps the tree protection zone and needs redesign.`, resolved: !!candidate, before: treeBefore, after: candidate });
    }
    if (!result.conflicts.some(c => c.elementId === e.id && !c.resolved)) result.likelyCompliant.push(`${e.label}: fits the available ${site.isDemo ? "fixture" : "assumed"} geometry${isStructure(e) && side !== null && rear !== null ? " and stated setback envelope" : ""}.`);
  }
  if (!repair) {
    for (const e of project.elements.filter(e => e.kind !== "tree")) {
      for (const house of site.existingStructures.filter(s => s.kind === "house")) {
        if (rectanglesOverlap(e, { position: house.position, size: { widthFt: house.widthFt, depthFt: house.depthFt } })) result.conflicts.push({ elementId: e.id, rule: "house_overlap", explanation: `${e.label} overlaps the house footprint.`, resolved: false, before: e.position, after: null });
      }
    }
    for (let i = 0; i < project.elements.length; i++) for (let j = i + 1; j < project.elements.length; j++) {
      const a = project.elements[i], b = project.elements[j];
      if (conflictingOverlap(a, b)) for (const e of [a, b]) result.conflicts.push({ elementId: e.id, rule: "element_overlap", explanation: `${a.label} overlaps ${b.label}. Move or resize one of them.`, resolved: false, before: e.position, after: null });
    }
    result.likelyCompliant = result.likelyCompliant.filter(text => !project.elements.some(e => text.startsWith(`${e.label}:`) && result.conflicts.some(c => c.elementId === e.id && !c.resolved)));
  }
  if (tree && !result.conflicts.some(c => !c.resolved)) result.likelyCompliant.push("Mature tree retained; protection zone excluded from new hardscape and structures.");
  if (result.conflicts.some(c => !c.resolved)) result.status = "conflicts";
  project.feasibility = result;
  return projectSpecSchema.parse(project);
}
