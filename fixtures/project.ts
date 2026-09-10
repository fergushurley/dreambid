import { projectSpecSchema, type ProjectElement, type ScopeItem, type ProjectBrief } from "@/types";
import { canonicalSiteContext, DEMO_ADDRESS } from "./site-context";

export const CANONICAL_PROMPT = "Make this backyard a great space for entertaining. My budget is $50,000. Keep the mature tree. Add dining, shade and better lighting.";
export const REVISION_PROMPT = "Remove the pergola, add an outdoor kitchen, and keep the total under $45,000.";
export const canonicalBrief: ProjectBrief = { propertyAddress: DEMO_ADDRESS, description: CANONICAL_PROMPT, budget: 50000, photos: [], useDemoSite: true };
export function element(id: string, kind: ProjectElement["kind"], label: string, x: number, y: number, w: number, d: number, h: number, cost: number, material: string, color: string, scopeItemIds: string[] = []): ProjectElement {
  return { id, kind, label, position: { x, y }, size: { widthFt: w, depthFt: d, heightFt: h }, material, color, estimatedCost: cost, preserved: kind === "tree", scopeItemIds };
}
export function scope(id: string, elementId: string | null, category: string, description: string, cost: number): ScopeItem {
  return { id, elementId, category, description, quantity: 1, unit: "lump sum", estimatedCost: cost, required: true, acceptanceCriteria: "Supply, installation, site protection and cleanup included; verify selections and field conditions." };
}
export const canonicalProject = projectSpecSchema.parse({
  id: "dreambid-maple", version: 1, title: "The gathering garden", conceptId: "terrace", siteContextId: canonicalSiteContext.id, propertyAddress: DEMO_ADDRESS,
  homeownerGoals: ["Entertain friends outdoors", "Dining for eight", "Shade and warm evening lighting"],
  hardConstraints: ["Preserve the mature oak and its protection zone", "Stay at or below the budget maximum"],
  softConstraints: ["Warm natural materials", "Low-maintenance planting"],
  budgetTarget: 45000, budgetMaximum: 50000, estimatedTotal: 41000, spaceType: "backyard", dimensions: { widthFt: 48, depthFt: 58 },
  elements: [
    element("patio", "patio", "Limestone terrace", 7, 7, 29, 24, 0.25, 13500, "Limestone pavers", "#d4c8af", ["patio"]),
    element("tree", "tree", "Mature oak · retained", 38, 41, 12, 12, 23, 0, "Existing mature oak", "#647755"),
    element("pergola", "pergola", "Cedar pergola", 8, 42, 16, 12, 9, 14200, "Natural cedar", "#a68059", ["pergola"]),
    element("dining", "dining", "Dining for eight", 10, 13, 10, 6, 2.5, 3200, "Teak and linen", "#b89670", ["dining"]),
    element("lights", "lighting", "Warm landscape lighting", 8, 8, 27, 21, 8, 3200, "Warm LED · 2700K", "#eacb86", ["lighting"]),
    element("planting", "planter", "Soft perimeter planting", 6, 34, 21, 3, 2, 3900, "Native grasses and terracotta", "#7a8962", ["landscape"]),
  ],
  scopeItems: [scope("patio", "patio", "Hardscape", "Limestone patio, subbase and drainage", 13500), scope("dining", "dining", "Furnishings", "Eight-person outdoor dining set", 3200), scope("pergola", "pergola", "Shade", "Cedar pergola, foundations and installation", 14200), scope("lighting", "lights", "Electrical", "Low-voltage landscape lighting and installation", 3200), scope("landscape", "planting", "Landscape", "Native planting and tree protection", 3900), scope("site-prep", null, "Pre-construction", "Site preparation, cleanup and permit allowance", 3000)],
  assumptions: ["All dimensions and rules are illustrative fixtures.", "Estimate is a synthetic planning budget, including labor and materials; taxes and permit requirements must be verified.", "Pergola initially overlaps the demo rear setback so the feasibility engine can visibly relocate it."],
  revisionHistory: [],
  scene: { units: "feet", camera: "isometric", renderUrl: null, blendFile: null, renderer: "pending" },
  feasibility: { status: "needs_verification", likelyCompliant: [], conflicts: [], unknowns: ["Survey, utilities, easements, coverage and municipal rules are unverified."], nextChecks: ["Obtain a survey and verify with the building department."], assumptions: ["Fixture geometry and setbacks."], checkedAt: "2026-09-10", disclaimer: "Preliminary feasibility check. Subject to survey and municipal verification; verify with architect, contractor and building department before construction." },
});
