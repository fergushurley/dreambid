"use client";
import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, LockKeyhole, Minus, MousePointer2, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import type { EngineMeta, LayoutPatch, ProjectElement, ProjectSpec, SiteContext } from "@/types";
import { catalogById, featureCatalog, featureCategories } from "@/fixtures/feature-catalog";
import { applyLayoutPatch, budgetSummary, suggestedPosition } from "@/lib/layout";
import { PlanAssistant } from "./plan-assistant";
import { PLAN, SitePlan, type PlanDragMode } from "./site-plan";

export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
function NumberField({ label, value, onCommit, min, max, disabled = false }: { label: string; value: number; onCommit: (value: number) => void; min?: number; max?: number; disabled?: boolean }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  function commit() { const n = Number(draft); if (draft.trim() && Number.isFinite(n) && n !== value) onCommit(n); setDraft(String(value)); }
  return <label className="dimension-field"><span>{label}</span><div><input aria-label={label} type="number" min={min} max={max} step="0.5" disabled={disabled} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }}/><span>ft</span></div></label>;
}
type Drag = { base: ProjectSpec; element: ProjectElement; start: { x: number; y: number }; mode: PlanDragMode; operation: LayoutPatch["operations"][number] | null };
export function LayoutEditor({ project, site, demoMode, onAssistantApply, onChange, onClose }: { demoMode: boolean; onAssistantApply: (project: ProjectSpec, meta: EngineMeta) => void; project: ProjectSpec; site: SiteContext; onChange: (project: ProjectSpec, committed: boolean) => void; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState("All features"), [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const drag = useRef<Drag | null>(null);
  const selected = project.elements.find(e => e.id === selectedId);
  const summary = budgetSummary(project);
  const conflicts = project.feasibility.conflicts.filter(c => !c.resolved);
  const item = selected && catalogById.get(selected.catalogItemId ?? selected.kind);
  function commit(patch: LayoutPatch) {
    try { const next = applyLayoutPatch(project, patch, site); onChange(next, true); setError(""); if (patch.operations.some(op => op.action === "add")) setSelectedId(next.elements.find(e => !project.elements.some(old => old.id === e.id))?.id ?? null); }
    catch (error) { setError(error instanceof Error ? error.message : "The edit could not be applied. Your plan was kept."); }
  }
  function update(dimensions: { widthFt: number; depthFt: number } | null, position: { x: number; y: number } | null, label: string) { if (selected) commit({ summary: `${label} ${selected.label}`, operations: [{ action: "update", elementId: selected.id, dimensions, position }] }); }
  function point(event: PointerEvent<SVGElement>) {
    const svg = event.currentTarget instanceof SVGSVGElement ? event.currentTarget : event.currentTarget.ownerSVGElement!;
    const screen = svg.getScreenCTM(); if (!screen) return { x: 0, y: 0 };
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(screen.inverse());
    return { x: (local.x - PLAN.x) / PLAN.width * project.dimensions.widthFt, y: (PLAN.bottom - local.y) / PLAN.height * project.dimensions.depthFt };
  }
  function start(event: PointerEvent<SVGGElement>, element: ProjectElement, mode: PlanDragMode) {
    if (element.preserved) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.ownerSVGElement!.setPointerCapture(event.pointerId);
    drag.current = { base: project, element, start: point(event), mode, operation: null }; setError("");
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current; if (!current) return;
    const cursor = point(event), dx = cursor.x-current.start.x, dy = cursor.y-current.start.y;
    const snap = (value: number) => Math.round(value*2)/2;
    const bounds = catalogById.get(current.element.catalogItemId ?? current.element.kind);
    const e=current.element;
    const width=snap(Math.max(bounds?.minSize.widthFt??1,Math.min(bounds?.maxSize.widthFt??100,e.size.widthFt+(current.mode==="resize-right"?dx:current.mode==="resize-left"?-dx:0))));
    const depth=snap(Math.max(bounds?.minSize.depthFt??1,Math.min(bounds?.maxSize.depthFt??100,e.size.depthFt+(current.mode==="resize-rear"?dy:current.mode==="resize-front"?-dy:0))));
    const operation = {action:"update" as const,elementId:e.id,position:current.mode==="move"?{x:snap(Math.max(-20,Math.min(project.dimensions.widthFt+20,e.position.x+dx))),y:snap(Math.max(-25,Math.min(project.dimensions.depthFt+20,e.position.y+dy)))}:current.mode==="resize-left"?{x:e.position.x+e.size.widthFt-width,y:e.position.y}:current.mode==="resize-front"?{x:e.position.x,y:e.position.y+e.size.depthFt-depth}:null,dimensions:current.mode!=="move"?{widthFt:width,depthFt:depth}:null};
    if (Math.abs(dx)+Math.abs(dy) < .15) return;
    current.operation = operation;
    try { onChange(applyLayoutPatch(current.base, { summary: `${current.mode === "move" ? "Move" : "Resize"} ${current.element.label}`, operations: [operation] }, site, false), false); } catch (error) { setError(error instanceof Error ? error.message : "Invalid size."); }
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current; drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current?.operation) { try { onChange(applyLayoutPatch(current.base, { summary: `${current.mode === "move" ? "Move" : "Resize"} ${current.element.label}`, operations: [current.operation] }, site), true); } catch { onChange(current.base, false); } }
  }
  function key(event: KeyboardEvent<SVGGElement>, e: ProjectElement) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(e.id); return; }
    if (!e.preserved && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault(); setSelectedId(e.id);
      const step = event.shiftKey ? 5 : 1;
      commit({ summary: `Move ${e.label}`, operations: [{ action: "update", elementId: e.id, dimensions: null, position: { x: e.position.x + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), y: e.position.y + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0) } }] });
    }
  }
  const visible = featureCatalog.filter(item => (category === "All features" || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="layout-workspace" aria-label="Customize layout">
    <div className="editor-topline"><button className="text-button" onClick={onClose}><ArrowLeft size={15}/> Back to your design</button><span>PROJECT REVISION {project.version} · FEET</span><button className="button primary" onClick={onClose}>Use this layout <Check size={15}/></button></div>
    <div className={`editor-budget ${summary.status}`} aria-live="polite"><div><span className="eyebrow">PRELIMINARY INSTALLED RANGE</span><strong>{money(summary.range.low)}–{money(summary.range.high)}</strong><small>Planning midpoint {money(project.estimatedTotal)} · curated assumptions, not quotes</small></div><div className="editor-budget-cap"><span>Target {money(project.budgetTarget)} · maximum <b>{money(project.budgetMaximum)}</b></span><div className="budget-track"><span style={{width:`${Math.min(100, project.estimatedTotal/project.budgetMaximum*100)}%`}}/></div><strong>{summary.overBy > 0 ? `${money(summary.overBy)} over your maximum` : summary.status === "uncertain" ? "Upper range exceeds your budget" : "Planning range within budget"}</strong></div></div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    <PlanAssistant project={project} demoMode={demoMode} onApply={onAssistantApply}/>
    <div className="editor-columns">
      <aside className="feature-catalog"><div className="catalog-heading"><span className="eyebrow">MAKE IT YOURS</span><h2>Room for possibility.</h2><p>Add a feature to explore its footprint and cost.</p></div><label className="catalog-search"><Search size={15}/><input aria-label="Search backyard features" placeholder="Pool, putting green, kitchen…" value={search} onChange={e => setSearch(e.target.value)}/></label><label className="catalog-filter"><select aria-label="Feature category" value={category} onChange={e => setCategory(e.target.value)}><option>All features</option>{featureCategories.map(category => <option key={category}>{category}</option>)}</select><ChevronDown size={14}/></label><div className="catalog-items">{visible.map(feature => <article className="catalog-item" key={feature.id}><div className={`catalog-mini ${feature.category === "Water" ? "water" : feature.category === "Recreation" ? "green" : ""}`} style={{backgroundColor:feature.color}}><span>{feature.defaultSize.widthFt}′ × {feature.defaultSize.depthFt}′</span></div><div><h3>{feature.name}</h3><p>{money(feature.installedRange.low)}–{money(feature.installedRange.high)}</p><small>Preliminary installed range</small></div><button className="catalog-add" aria-label={`Add ${feature.name}`} disabled={project.elements.length >= 40} onClick={() => { try { commit({ summary: `Add ${feature.name}`, operations: [{ action: "add", catalogItemId: feature.id, position: suggestedPosition(project, feature.id, site), dimensions: null }] }); } catch (error) { setError(error instanceof Error ? error.message : "Feature could not be added."); } }}><Plus size={17}/></button></article>)}{!visible.length && <p className="catalog-empty">No matching features. Try another search.</p>}</div><p className="catalog-footnote">Prices vary by region, access, materials and site conditions. Permits and utility upgrades need confirmation.</p></aside>
      <div className="editor-canvas"><div className="canvas-title"><span><MousePointer2 size={14}/> Your interactive site plan</span><span>{site.isDemo ? "Fixture context" : "Assumed dimensions"}</span></div><SitePlan project={project} site={site} interaction={{ selectedId, onSelect: setSelectedId, onRemove: e => { commit({summary:`Remove ${e.label}`,operations:[{action:"remove",elementId:e.id}]}); setSelectedId(null); }, onStart: start, onMove: move, onEnd: end, onKey: key, onCancel: () => { if (drag.current) onChange(drag.current.base, false); drag.current = null; } }}/><div className="canvas-legend"><span><i className="legend-yard"/>Yard boundary</span><span><i className="legend-setback"/>Setback envelope</span><span><i className="legend-warning"/>Needs adjustment</span><span><LockKeyhole size={11}/>Protected tree</span></div><div className="plan-element-list" aria-label="Select project element">{project.elements.map(e => <button key={e.id} aria-pressed={selectedId === e.id} onClick={() => setSelectedId(e.id)}>{e.preserved && <LockKeyhole size={10}/>} {e.label}</button>)}</div></div>
      <aside className="layout-inspector"><span className="eyebrow">THE DETAILS</span>{selected ? <><h2>{selected.label}</h2>{selected.preserved ? <p className="locked-message"><LockKeyhole size={14}/> Protected. Its position and size stay fixed.</p> : <><p>{item?.description ?? "Adjust this existing element using its current geometry and planning estimate."}</p><div className="dimension-grid"><NumberField label="Width" value={selected.size.widthFt} min={item?.minSize.widthFt} max={item?.maxSize.widthFt} onCommit={widthFt => update({ widthFt, depthFt: selected.size.depthFt }, null, "Resize")}/><NumberField label="Depth" value={selected.size.depthFt} min={item?.minSize.depthFt} max={item?.maxSize.depthFt} onCommit={depthFt => update({ widthFt: selected.size.widthFt, depthFt }, null, "Resize")}/><NumberField label="Position X" value={selected.position.x} onCommit={x => update(null, {x,y:selected.position.y}, "Move")}/><NumberField label="Position Y" value={selected.position.y} onCommit={y => update(null, {x:selected.position.x,y}, "Move")}/></div><div className="selected-price"><span>Preliminary installed range</span><strong>{money(selected.indicativeRange?.low ?? selected.estimatedCost*.85)}–{money(selected.indicativeRange?.high ?? selected.estimatedCost*1.15)}</strong><small>{selected.pricing?.basis === "fixed" || item?.priceModel.basis === "fixed" ? "Fixed package price; size does not change this estimate." : "Changes with size; fixed installation costs remain."}</small></div><button className="remove-feature" onClick={() => { commit({summary:`Remove ${selected.label}`,operations:[{action:"remove",elementId:selected.id}]});setSelectedId(null); }}><Trash2 size={14}/>Remove feature</button></>}{item && <div className="feature-notes">{item.permitsMayApply && <span>Permit review may apply</span>}{item.setbacksMayApply && <span>Setbacks may apply</span>}{item.utilitiesMayApply && <span>Utilities require confirmation</span>}</div>}</> : <><h2>A little room to play.</h2><p>Select a feature to edit dimensions and see its price. Drag its body to move it, its edge handles to resize, or × to remove.</p></>}
        <div className="editor-feasibility"><h3><ShieldCheck size={16}/>Preliminary feasibility</h3><p>{site.isDemo ? "10′ rear / 5′ side: illustrative fixture rules." : "Setbacks and site features are unknown. Geometry is assumed."}</p>{conflicts.length ? <ul>{[...new Map(conflicts.map(c => [c.explanation,c])).values()].map((conflict,i) => <li key={i}><button onClick={() => setSelectedId(conflict.elementId)}>{conflict.explanation}</button></li>)}</ul> : <div className="geometry-clear"><Check size={14}/>No conflicts detected in the available geometry.</div>}<small>Not permit approval. Confirm the survey, feature-specific rules, pool barriers, utilities and fire clearances with qualified professionals.</small></div>
      </aside>
    </div>
  </section>;
}
