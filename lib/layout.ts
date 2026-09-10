import { budgetSummarySchema, layoutPatchSchema, projectSpecSchema, type BudgetSummary, type FeaturePriceModel, type LayoutPatch, type ProjectElement, type ProjectSpec, type SiteContext } from "@/types";
import { catalogById } from "@/fixtures/feature-catalog";
import { checkFeasibility } from "./feasibility";

const round = (n: number) => Math.round(n / 10) * 10;
export function priceAtSize(model: FeaturePriceModel, size: ProjectElement["size"]) {
  const scale = model.basis === "fixed" ? 1 : model.basis === "linear" ? size.widthFt / model.baseWidthFt : size.widthFt * size.depthFt / (model.baseWidthFt * model.baseDepthFt);
  const factor = model.fixedShare + (1 - model.fixedShare) * scale;
  return { low: round(model.baseLow * factor), high: round(model.baseHigh * factor) };
}
export function budgetSummary(project: ProjectSpec): BudgetSummary {
  const linked = new Set(project.elements.map(e => e.id));
  const unlinked = project.scopeItems.filter(s => !s.elementId || !linked.has(s.elementId)).reduce((n, s) => n + s.estimatedCost, 0);
  const range = project.elements.reduce((range, e) => ({ low: range.low + (e.indicativeRange?.low ?? round(e.estimatedCost * .85)), high: range.high + (e.indicativeRange?.high ?? round(e.estimatedCost * 1.15)) }), { low: round(unlinked * .85), high: round(unlinked * 1.15) });
  return budgetSummarySchema.parse({ range, planningTotal: project.estimatedTotal, target: project.budgetTarget, maximum: project.budgetMaximum, status: project.estimatedTotal > project.budgetMaximum ? "over" : range.high > project.budgetMaximum ? "uncertain" : "within", overBy: Math.max(0, project.estimatedTotal - project.budgetMaximum) });
}
function ensurePricing(e: ProjectElement): FeaturePriceModel {
  return e.pricing ?? { basis: catalogById.get(e.kind)?.priceModel.basis ?? "area", baseWidthFt: e.size.widthFt, baseDepthFt: e.size.depthFt, baseLow: e.estimatedCost * .85, baseHigh: e.estimatedCost * 1.15, fixedShare: catalogById.get(e.kind)?.priceModel.fixedShare ?? .25 };
}
function reprice(project: ProjectSpec, e: ProjectElement) {
  if (!e.pricing) return;
  const range = priceAtSize(e.pricing, e.size);
  const total = Math.round((range.low + range.high) / 2);
  const rows = project.scopeItems.filter(s => s.elementId === e.id);
  const old = rows.reduce((n, s) => n + s.estimatedCost, 0);
  let remaining = total;
  rows.forEach((s, i) => { s.estimatedCost = i === rows.length - 1 ? remaining : Math.round(total * (old ? s.estimatedCost / old : 1 / rows.length)); remaining -= s.estimatedCost; s.quantity = e.pricing!.basis === "area" ? e.size.widthFt * e.size.depthFt : e.pricing!.basis === "linear" ? e.size.widthFt : 1; s.unit = e.pricing!.basis === "area" ? "sq ft" : e.pricing!.basis === "linear" ? "linear ft" : "item"; });
  e.indicativeRange = range; e.estimatedCost = total;
}
function checkSize(e: ProjectElement) {
  const item = catalogById.get(e.catalogItemId ?? e.kind);
  if (!item) return;
  if (e.size.widthFt < item.minSize.widthFt || e.size.widthFt > item.maxSize.widthFt || e.size.depthFt < item.minSize.depthFt || e.size.depthFt > item.maxSize.depthFt) throw new Error(`${e.label}: use width ${item.minSize.widthFt}–${item.maxSize.widthFt} ft and depth ${item.minSize.depthFt}–${item.maxSize.depthFt} ft.`);
}
function addFeature(project: ProjectSpec, catalogItemId: string, position: { x: number; y: number } | null, dimensions: { widthFt: number; depthFt: number } | null) {
  const item = catalogById.get(catalogItemId);
  if (!item) throw new Error("That catalog feature is not available.");
  const id = `${item.id}-${crypto.randomUUID().slice(0, 8)}`;
  const e: ProjectElement = { id, kind: item.kind, label: item.name, position: position ?? { x: 5, y: 5 }, size: { ...item.defaultSize, ...dimensions }, material: item.description, color: item.color, estimatedCost: 0, preserved: false, scopeItemIds: [], catalogItemId: item.id, pricing: item.priceModel };
  checkSize(e);
  const parts = item.kind === "kitchen" ? [{ suffix: "base", description: "Kitchen cabinetry, appliances and installation", share: .5 }, { suffix: "countertop", description: "Fabricated kitchen countertop and installation", share: .28 }, { suffix: "electrical", description: "Outdoor kitchen electrical connection", share: .22 }] : [{ suffix: "installed", description: `${item.name}: supply, installation and ordinary site preparation`, share: 1 }];
  const estimate = Math.round((priceAtSize(item.priceModel, e.size).low + priceAtSize(item.priceModel, e.size).high) / 2);
  for (const part of parts) {
    const scopeId = `${id}-${part.suffix}`; e.scopeItemIds.push(scopeId);
    project.scopeItems.push({ id: scopeId, elementId: id, category: item.category, description: part.description, quantity: 1, unit: "item", estimatedCost: Math.round(estimate * part.share), required: true, acceptanceCriteria: "Confirm dimensions, selections, utilities, permits, installation and cleanup in a fixed-price contractor proposal. Indicative fixture estimate only." });
  }
  project.elements.push(e); reprice(project, e);
  return e;
}
/** Apply all edits atomically to the one ProjectSpec. Invalid placement stays visible; protected edits fail. */
export function applyLayoutPatch(input: ProjectSpec, rawPatch: LayoutPatch, site: SiteContext, record = true): ProjectSpec {
  const patch = layoutPatchSchema.parse(rawPatch);
  const project = projectSpecSchema.parse(structuredClone(input));
  const changed = new Set<string>();
  for (const op of patch.operations) {
    if (op.action === "add") { changed.add(addFeature(project, op.catalogItemId, op.position, op.dimensions).id); continue; }
    const e = project.elements.find(e => e.id === op.elementId);
    if (!e) throw new Error("An edited element no longer exists. Refresh the plan and retry.");
    if (e.preserved || e.kind === "tree") throw new Error("The protected tree and preserved elements cannot be moved, resized or removed.");
    changed.add(e.id);
    if (op.action === "remove" || op.action === "replace") {
      project.elements = project.elements.filter(row => row.id !== e.id);
      project.scopeItems = project.scopeItems.filter(row => row.elementId !== e.id);
      if (op.action === "replace") changed.add(addFeature(project, op.catalogItemId, e.position, null).id);
    } else {
      if (op.position) e.position = op.position;
      if (op.dimensions) { e.pricing = ensurePricing(e); e.size = { ...e.size, ...op.dimensions }; checkSize(e); reprice(project, e); }
    }
  }
  if (!project.scopeItems.length || project.scopeItems.every(s => s.estimatedCost <= 0)) throw new Error("Keep at least one priced scope item in the project.");
  project.estimatedTotal = project.scopeItems.reduce((n, s) => n + s.estimatedCost, 0);
  project.scene = { units: "feet", camera: "isometric", renderer: "pending", renderUrl: null, blendFile: null };
  if (record) {
    project.version = input.version + 1;
    project.revisionHistory.push({ version: project.version, instruction: patch.summary, summary: patch.summary, changes: patch.operations.map(op => `${op.action}: ${"elementId" in op ? input.elements.find(e => e.id === op.elementId)?.label ?? op.elementId : catalogById.get(op.catalogItemId)?.name}`), preserved: input.elements.filter(e => !changed.has(e.id)).map(e => e.label), createdAt: new Date().toISOString() });
  }
  return checkFeasibility(projectSpecSchema.parse(project), site, false);
}
/** Find an open position for a new catalog feature; return an honest warned position if none fits. */
export function suggestedPosition(project: ProjectSpec, catalogId: string, site: SiteContext) {
  const item = catalogById.get(catalogId)!;
  const candidate = { id: "new-placement", kind: item.kind, label: item.name, size: item.defaultSize, position: { x: 5, y: 5 }, material: item.description, color: item.color, estimatedCost: 0, preserved: false, scopeItemIds: [], catalogItemId: item.id } as ProjectElement;
  for (let y = 2; y <= project.dimensions.depthFt - item.defaultSize.depthFt; y += 2) for (let x = 2; x <= project.dimensions.widthFt - item.defaultSize.widthFt; x += 2) {
    candidate.position = { x, y };
    const checked = checkFeasibility({ ...project, elements: [...project.elements, candidate] }, site, false);
    if (!checked.feasibility.conflicts.some(c => c.elementId === candidate.id && !c.resolved)) return { x, y };
  }
  return { x: Math.max(0, (project.dimensions.widthFt - item.defaultSize.widthFt) / 2), y: Math.max(0, project.dimensions.depthFt - item.defaultSize.depthFt - 5) };
}
