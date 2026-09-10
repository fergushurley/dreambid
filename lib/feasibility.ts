import { projectSpecSchema, type ProjectElement, type ProjectSpec, type SiteContext, type FeasibilityCheck } from "@/types";

const isStructure = (e: ProjectElement) => e.kind === "pergola" || e.kind === "kitchen";
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
    assumptions: [site.isDemo ? "Setback checks use labeled fixture rules, not municipal regulations." : "The design canvas is an assumed size; no authoritative property rules are available.", "Setbacks apply only to new pergola and kitchen footprints in this lightweight check."],
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
      result.conflicts.push({ elementId: e.id, rule: isStructure(e) ? "setback" : "site_boundary", explanation: resolved ? `${e.label} moved ${Math.round(Math.hypot(e.position.x - before.x, e.position.y - before.y) * 10) / 10} ft to fit the ${site.isDemo ? "illustrative" : "known / assumed"} envelope.` : `${e.label} lies outside the available design envelope.`, resolved, before, after: resolved ? { ...e.position } : null });
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
  if (tree && !result.conflicts.some(c => !c.resolved)) result.likelyCompliant.push("Mature tree retained; protection zone excluded from new hardscape and structures.");
  if (result.conflicts.some(c => !c.resolved)) result.status = "conflicts";
  project.feasibility = result;
  return projectSpecSchema.parse(project);
}
