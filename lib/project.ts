import { z } from "zod";
import { projectElementSchema, projectSpecSchema, scopeItemSchema, type ProjectSpec, type ProjectBrief, type RenovationConcept, type SiteContext } from "@/types";
import { canonicalProject, element, scope } from "@/fixtures/project";
import { checkFeasibility } from "./feasibility";

// Catalog pricing is owned by deterministic code, not generated or edited by Astra.
const modelElementSchema = projectElementSchema.omit({ catalogItemId: true, pricing: true, indicativeRange: true });
export const projectDraftSchema = z.object({ title: z.string(), homeownerGoals: z.array(z.string()), softConstraints: z.array(z.string()), elements: z.array(modelElementSchema).min(1).max(40), scopeItems: z.array(scopeItemSchema).min(1).max(80), assumptions: z.array(z.string()) });

export function fixtureProject(brief: ProjectBrief, concept: RenovationConcept, site: SiteContext): ProjectSpec {
  const p = structuredClone(canonicalProject);
  p.id = `project-${crypto.randomUUID()}`; p.title = concept.title; p.conceptId = concept.id;
  p.siteContextId = site.id; p.propertyAddress = brief.propertyAddress; p.dimensions = { ...site.yardDimensions };
  p.budgetMaximum = brief.budget; p.budgetTarget = Math.round(brief.budget * 0.9);
  p.homeownerGoals = [brief.description];
  if (!site.protectedTree) {
    p.elements = p.elements.filter(e => e.kind !== "tree");
    p.hardConstraints = ["Stay at or below the budget maximum", "Verify actual site dimensions and all existing features before construction"];
  }
  const factor = (brief.budget / 50000) * (concept.palette === "meadow" ? 0.73 : concept.palette === "retreat" ? 1.17 : 1);
  p.scopeItems = p.scopeItems.map(s => ({ ...s, estimatedCost: Math.round(s.estimatedCost * factor / 100) * 100 }));
  if (concept.palette === "meadow") {
    const patio = p.elements.find(e => e.id === "patio")!;
    patio.material = "Compacted gravel"; patio.color = "#c7bea6"; patio.label = "Gravel terrace"; patio.size.widthFt = 25;
    p.scopeItems.find(s => s.id === "patio")!.description = "Compacted gravel terrace, edging and subbase";
    const shade = p.elements.find(e => e.id === "pergola")!;
    shade.label = "Simple timber shade canopy"; shade.size.widthFt = 12;
    p.scopeItems.find(s => s.id === "pergola")!.description = "Simple timber shade canopy with anchoring";
  }
  if (concept.palette === "retreat") {
    p.elements.find(e => e.id === "patio")!.material = "Premium sandstone";
    p.elements.push(element("lounge", "lounge", "Integrated lounge", 23, 20, 10, 4, 3, 0, "Stone and linen", "#c4b7a0"));
    p.assumptions.push("Integrated seating included within the synthetic premium hardscape budget.");
  }
  p.assumptions = [site.summary, "Synthetic concept-based planning estimate; confirm material selections, local labor, tax and permits."];
  return finalizeProject(p, site);
}

export function finalizeProject(input: ProjectSpec, site: SiteContext): ProjectSpec {
  const p = projectSpecSchema.parse(input);
  if (new Set(p.elements.map(e => e.id)).size !== p.elements.length || new Set(p.scopeItems.map(s => s.id)).size !== p.scopeItems.length) throw new Error("Duplicate element or scope identity.");
  const elementIds = new Set(p.elements.map(e => e.id));
  const scopeIds = new Set(p.scopeItems.map(s => s.id));
  if (p.scopeItems.some(s => s.elementId && !elementIds.has(s.elementId))) throw new Error("Scope references a missing element.");
  if (p.elements.some(e => e.scopeItemIds.some(id => !scopeIds.has(id)))) throw new Error("Element references a missing scope item.");
  p.estimatedTotal = p.scopeItems.reduce((sum, s) => sum + s.estimatedCost, 0);
  for (const e of p.elements) e.estimatedCost = p.scopeItems.filter(s => s.elementId === e.id).reduce((sum, s) => sum + s.estimatedCost, 0);
  if (site.protectedTree) {
    const tree = p.elements.find(e => e.kind === "tree" && e.preserved);
    if (!tree || tree.position.x !== site.protectedTree.position.x || tree.position.y !== site.protectedTree.position.y) throw new Error("Protected mature tree must remain at its original location.");
  }
  p.scene = { units: "feet", camera: "isometric", renderUrl: null, blendFile: null, renderer: "pending" };
  return checkFeasibility(p, site);
}

export function applyDraft(base: ProjectSpec, draft: z.infer<typeof projectDraftSchema>, site: SiteContext): ProjectSpec {
  const project = finalizeProject({ ...base, ...draft }, site);
  if (project.estimatedTotal > project.budgetMaximum) throw new Error("Concept exceeds the hard budget maximum.");
  return project;
}

export const revisionPatchSchema = z.object({
  summary: z.string(), budgetMaximum: z.number().positive(),
  removeElementIds: z.array(z.string()).max(40), upsertElements: z.array(modelElementSchema).max(40),
  removeScopeItemIds: z.array(z.string()).max(80), upsertScopeItems: z.array(scopeItemSchema).max(80),
  assumptions: z.array(z.string()),
});
export type RevisionPatch = z.infer<typeof revisionPatchSchema>;

/** Enforce explicit dollar-denominated caps independently of the model's patch. */
function requestedBudgetLimit(instruction: string, currentMaximum: number): number {
  const limits = [...instruction.matchAll(/\b(?:under|below|at most|no more than|budget(?:\s+of)?|maximum(?:\s+of)?|cap(?:\s+of)?)\s*\$\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/gi)]
    .map(match => Number(match[1].replace(/,/g, "")) * (match[2] ? 1000 : 1));
  return Math.min(currentMaximum, ...limits);
}

export function canonicalRevisionPatch(project: ProjectSpec, instruction: string): RevisionPatch {
  const matches = /remove.*pergola/i.test(instruction) && /kitchen/i.test(instruction);
  if (!matches) throw new Error("The offline revision supports the canonical pergola-to-kitchen change. Enable funded Astra access for other instructions.");
  const budget = requestedBudgetLimit(instruction, project.budgetMaximum);
  if (budget < 42900) throw new Error("The fixture kitchen design costs $42,900. A lower budget requires a new scope decision with live Astra.");
  const remove = project.elements.filter(e => e.kind === "pergola").map(e => e.id);
  const kitchen = element("kitchen", "kitchen", "Outdoor kitchen", 23, 23, 12, 4, 3.2, 18700, "Stucco, stone and stainless steel", "#b9ad92", ["kitchen-base", "kitchen-countertop", "kitchen-electrical"]);
  const updates = project.scopeItems.filter(s => ["patio", "lighting", "landscape"].includes(s.id)).map(s => ({ ...s, estimatedCost: s.id === "patio" ? 12500 : s.id === "lighting" ? 2800 : 2700, description: s.id === "patio" ? "Standard limestone pavers, subbase and drainage" : s.description }));
  return {
    summary: "Trade the pergola for an outdoor kitchen. Standard pavers and simpler planting keep the plan under $45,000; the mature tree and dining stay.",
    budgetMaximum: budget, removeElementIds: remove,
    upsertElements: [kitchen], removeScopeItemIds: project.scopeItems.filter(s => s.elementId && remove.includes(s.elementId)).map(s => s.id),
    upsertScopeItems: [...updates, scope("kitchen-base", "kitchen", "Outdoor kitchen", "Kitchen cabinetry, grill and installation", 9000), scope("kitchen-countertop", "kitchen", "Outdoor kitchen", "Fabricated stone countertop and installation", 5500), scope("kitchen-electrical", "kitchen", "Electrical", "Outdoor kitchen electrical circuit, outlets and connection", 4200)],
    assumptions: ["Tree canopy provides seasonal shade after pergola removal.", "Kitchen uses electric appliances; utility capacity and code requirements require verification.", "Reduced planting quantities and standard paver selections provide the budget tradeoff."],
  };
}

export function applyRevision(project: ProjectSpec, patch: RevisionPatch, instruction: string, site: SiteContext): ProjectSpec {
  const protectedIds = project.elements.filter(e => e.preserved).map(e => e.id);
  if (patch.removeElementIds.some(id => protectedIds.includes(id)) || patch.upsertElements.some(e => protectedIds.includes(e.id))) throw new Error("Revision attempted to change a protected element.");
  // Never silently increase the owner's existing spending cap.
  if (patch.budgetMaximum > project.budgetMaximum) throw new Error("Revision cannot raise the hard budget maximum.");
  const budgetMaximum = Math.min(patch.budgetMaximum, requestedBudgetLimit(instruction, project.budgetMaximum));
  const updatedIds = new Set(patch.upsertElements.map(e => e.id));
  const updatedScope = new Set(patch.upsertScopeItems.map(s => s.id));
  const elements = [...project.elements.filter(e => !patch.removeElementIds.includes(e.id) && !updatedIds.has(e.id)), ...patch.upsertElements];
  const scopeItems = [...project.scopeItems.filter(s => !patch.removeScopeItemIds.includes(s.id) && !updatedScope.has(s.id)), ...patch.upsertScopeItems];
  const changes = [
    ...project.elements.filter(e => patch.removeElementIds.includes(e.id)).map(e => `Removed ${e.label}`),
    ...patch.upsertElements.map(e => `${project.elements.some(old => old.id === e.id) ? "Updated" : "Added"} ${e.label}`),
    ...patch.upsertScopeItems.filter(s => project.scopeItems.some(old => old.id === s.id && old.estimatedCost !== s.estimatedCost)).map(s => `Adjusted ${s.category.toLowerCase()} budget to $${s.estimatedCost.toLocaleString("en-US")}`),
  ];
  const preserved = project.elements.filter(e => !patch.removeElementIds.includes(e.id) && !updatedIds.has(e.id)).map(e => e.label);
  const result = finalizeProject({ ...project, version: project.version + 1, budgetMaximum, budgetTarget: Math.min(project.budgetTarget, budgetMaximum), elements, scopeItems, assumptions: [...new Set([...project.assumptions, ...patch.assumptions])], revisionHistory: [...project.revisionHistory, { version: project.version + 1, instruction, summary: patch.summary, changes, preserved, createdAt: new Date().toISOString() }] }, site);
  if (result.estimatedTotal > result.budgetMaximum) throw new Error(`Revised scope is $${result.estimatedTotal}, above the $${result.budgetMaximum} cap. The original project was kept.`);
  return result;
}
