"use client";
import { useId, type PointerEvent, type KeyboardEvent } from "react";
import type { ProjectElement, ProjectSpec, SiteContext } from "@/types";

export const PLAN = { x: 64, y: 84, width: 440, height: 350, bottom: 434 };
export type PlanDragMode = "move" | "resize-left" | "resize-right" | "resize-front" | "resize-rear";
export type PlanInteraction = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStart: (event: PointerEvent<SVGGElement>, element: ProjectElement, mode: PlanDragMode) => void;
  onRemove: (element: ProjectElement) => void;
  onKey: (event: KeyboardEvent<SVGGElement>, element: ProjectElement) => void;
  onMove: (event: PointerEvent<SVGSVGElement>) => void;
  onEnd: (event: PointerEvent<SVGSVGElement>) => void;
  onCancel: () => void;
};
const surfaces = new Set(["patio", "pavers", "path", "deck", "lawn", "turf"]);
const water = new Set(["pool", "plunge_pool", "spa", "water_feature"]);
const greens = new Set(["putting_green", "mini_golf"]);
const shades = new Set(["pergola", "gazebo", "shade_sail"]);

export function SitePlan({ project, site, highlighted = [], compact = false, interaction }: { project: ProjectSpec | null; site: SiteContext; highlighted?: string[]; compact?: boolean; interaction?: PlanInteraction }) {
  const uid = useId().replace(/:/g, "");
  const w = project?.dimensions.widthFt || site.yardDimensions.widthFt, d = project?.dimensions.depthFt || site.yardDimensions.depthFt;
  const rear = typeof site.rearSetback.value === "number" ? site.rearSetback.value : 0, side = typeof site.sideSetback.value === "number" ? site.sideSetback.value : 0;
  const tree = site.protectedTree;
  const sx = (x: number) => PLAN.x + x / w * PLAN.width, sy = (y: number) => PLAN.bottom - y / d * PLAN.height;
  const flagged = new Set(project?.feasibility.conflicts.filter(c => !c.resolved).map(c => c.elementId));
  const elements = [...project?.elements ?? []].filter(e => e.kind !== "tree").sort((a, b) => Number(surfaces.has(b.kind)) - Number(surfaces.has(a.kind)));
  return <svg className={`site-plan ${compact ? "compact" : ""} ${interaction ? "interactive-plan" : ""}`} viewBox="0 0 570 620" role={interaction ? "group" : "img"} aria-label={`${site.isDemo ? "Illustrative" : "Assumed"} site plan${interaction ? "; select a feature, drag it or use arrow keys; drag its edges to resize; select a feature and use its remove button" : " showing project footprints, tree protection and setback envelope"}`} onPointerMove={interaction?.onMove} onPointerUp={interaction?.onEnd} onPointerCancel={interaction?.onCancel}>
    <defs><pattern id={`${uid}-grid`} width={PLAN.width / w * 5} height={PLAN.height / d * 5} patternUnits="userSpaceOnUse"><path d={`M ${PLAN.width / w * 5} 0 L 0 0 0 ${PLAN.height / d * 5}`} fill="none" stroke="#8fa281" strokeWidth=".45" opacity=".45"/></pattern><pattern id={`${uid}-water`} width="16" height="12" patternUnits="userSpaceOnUse"><path d="M0 6 Q4 2 8 6 T16 6" stroke="#d4f0ec" strokeWidth="1" fill="none" opacity=".6"/></pattern></defs>
    <rect width="570" height="620" fill="#edf0e6"/>
    <rect x="64" y="84" width="440" height="350" fill="#d5e0c5" stroke="#6f8367" strokeWidth="1.5"/>
    <rect x="64" y="84" width="440" height="350" fill={`url(#${uid}-grid)`}/>
    {rear > 0 && <rect x="64" y="84" width="440" height={rear / d * 350} fill="#cfaf72" opacity=".20"/>}
    {side > 0 && <><rect x="64" y="84" width={side / w * 440} height="350" fill="#cfaf72" opacity=".12"/><rect x={sx(w-side)} y="84" width={side / w * 440} height="350" fill="#cfaf72" opacity=".12"/></>}
    {(side > 0 || rear > 0) && <rect x={sx(side)} y={sy(d - rear)} width={Math.max(0, w - 2 * side) / w * 440} height={Math.max(0, d - rear) / d * 350} fill="none" stroke="#b09560" strokeDasharray="5 4"/>}
    {site.existingStructures.filter(e => e.kind === "house" || (!project && e.kind === "patio")).map(e => <g key={e.id} className="plan-existing"><rect x={sx(e.position.x)} y={sy(e.position.y + e.depthFt)} width={e.widthFt / w * 440} height={e.depthFt / d * 350} fill={e.kind === "house" ? "#ded8cb" : "#c9c0aa"} stroke="#a69d8c"/><text x={sx(e.position.x + e.widthFt / 2)} y={sy(e.position.y + e.depthFt / 2)} textAnchor="middle" fontSize="10" fill="#706d61">{e.label.toUpperCase()}</text><text x={sx(e.position.x + e.widthFt / 2)} y={sy(e.position.y + e.depthFt / 2) + 16} textAnchor="middle" fontSize="8" fill="#858071">{e.fact.status} · {e.widthFt}′ × {e.depthFt}′</text></g>)}
    {!site.existingStructures.some(e => e.kind === "house") && <text x="284" y="470" textAnchor="middle" fontSize="10" fill="#7a806d">House footprint unknown · add verified site context before construction</text>}
    {elements.map(e => {
      const x = sx(e.position.x), y = sy(e.position.y + e.size.depthFt), ew = e.size.widthFt / w * 440, eh = e.size.depthFt / d * 350;
      const selected = interaction?.selectedId === e.id, active = highlighted.includes(e.id), warning = !!interaction && flagged.has(e.id);
      const lighting = e.kind === "lighting" || e.kind === "pathway_lighting";
      return <g key={e.id} role={interaction ? "button" : undefined} tabIndex={interaction ? 0 : undefined} aria-label={interaction ? `${e.label}, ${e.size.widthFt} by ${e.size.depthFt} feet${e.preserved ? ", locked" : ""}${warning ? ", feasibility warning" : ""}` : undefined} aria-pressed={interaction ? selected : undefined} data-element-id={e.id} className={interaction ? `plan-feature ${e.preserved ? "locked" : ""}` : undefined} onPointerDown={event => { if (interaction) { interaction.onSelect(e.id); interaction.onStart(event, e, "move"); } }} onKeyDown={event => interaction?.onKey(event, e)}>
        <rect x={x} y={y} width={ew} height={eh} rx={water.has(e.kind) ? Math.min(ew, eh) * .12 : e.kind === "dining" ? 6 : greens.has(e.kind) ? 12 : 2} fill={active ? "#df997b" : e.color} fillOpacity={lighting || shades.has(e.kind) ? .25 : .95} stroke={selected ? "#254e45" : warning ? "#b35338" : active ? "#b04c2f" : "#847f69"} strokeWidth={selected ? 3 : warning || active ? 2 : 1} strokeDasharray={lighting ? "3 5" : shades.has(e.kind) ? "4 2" : undefined}/>
        {water.has(e.kind) && <rect x={x + 3} y={y + 3} width={Math.max(1, ew - 6)} height={Math.max(1, eh - 6)} rx="6" fill={`url(#${uid}-water)`} pointerEvents="none"/>}
        {greens.has(e.kind) && <g pointerEvents="none"><circle cx={x + ew * .7} cy={y + eh * .35} r="3" fill="#315d35"/><path d={`M${x+ew*.7} ${y+eh*.35} v-15 l9 4 -9 4`} stroke="#f9f7e7" strokeWidth="1.4" fill="#f9f7e7"/></g>}
        {shades.has(e.kind) && Array.from({ length: 7 }, (_, i) => <line key={i} x1={x + ew / 7 * i + 4} y1={y} x2={x + ew / 7 * i + 4} y2={y + eh} stroke="#a68059" strokeWidth="2" opacity=".6" pointerEvents="none"/>)}
        {!compact && !lighting && ew > 30 && eh > 16 && <text x={x + ew / 2} y={y + eh / 2 + 3} textAnchor="middle" fontSize={Math.min(9, ew / Math.max(5, e.kind.length) * 1.3)} fill="#344a3c" pointerEvents="none">{e.kind.replaceAll("_", " ").toUpperCase()}</text>}

      </g>;
    })}
    {tree && <g role={interaction ? "button" : undefined} tabIndex={interaction ? 0 : undefined} aria-label={interaction ? "Mature oak, protected and locked" : undefined} onPointerDown={() => interaction?.onSelect(project?.elements.find(e => e.kind === "tree")?.id ?? "tree")}>
      <ellipse cx={sx(tree.position.x)} cy={sy(tree.position.y)} rx={tree.protectionRadiusFt / w * 440} ry={tree.protectionRadiusFt / d * 350} fill="#718d56" fillOpacity=".08" stroke="#647e4f" strokeDasharray="4 4"/>
      <ellipse cx={sx(tree.position.x)} cy={sy(tree.position.y)} rx={5.3 / w * 440} ry={5.3 / d * 350} fill="#7e9a65" fillOpacity=".8" stroke="#668252"/>
      <circle cx={sx(tree.position.x)} cy={sy(tree.position.y)} r="4" fill="#4f6d3e"/>
      {!compact && <><text x={sx(tree.position.x)} y={sy(tree.position.y)-13} textAnchor="middle" fontSize="8" fill="#304c30">MATURE OAK</text><text x={sx(tree.position.x)} y={sy(tree.position.y)+22} textAnchor="middle" fontSize="7" fill="#3f5b35">locked · {tree.protectionRadiusFt}′ protection</text></>}
    </g>}
    {interaction && elements.filter(e=>e.id===interaction.selectedId&&!e.preserved).map(e=>{
      const x=sx(e.position.x),y=sy(e.position.y+e.size.depthFt),ew=e.size.widthFt/w*440,eh=e.size.depthFt/d*350;
      const handles=[{edge:"left",x,y:y+eh/2,horizontal:true},{edge:"right",x:x+ew,y:y+eh/2,horizontal:true},{edge:"rear",x:x+ew/2,y,horizontal:false},{edge:"front",x:x+ew/2,y:y+eh,horizontal:false}] as const;
      return <g key={`controls-${e.id}`} className="plan-controls">
        {handles.map(handle=><g key={handle.edge} role="button" tabIndex={0} aria-label={`Resize ${e.label} ${handle.edge} edge`} className={`resize-handle ${handle.horizontal?"horizontal":"vertical"}`} transform={`translate(${handle.x} ${handle.y})`} onPointerDown={event=>{event.stopPropagation();interaction.onStart(event,e,`resize-${handle.edge}`);}}><rect x="-11" y="-11" width="22" height="22" rx="6" fill="#fcfff8" stroke="#365c46" strokeWidth="1.5"/><path d={handle.horizontal?"M-7 0 H7 M-3 -4 L-7 0 -3 4 M3 -4 L7 0 3 4":"M0 -7 V7 M-4 -3 L0 -7 4 -3 M-4 3 L0 7 4 3"} stroke="#365c46" fill="none" strokeWidth="1.5"/></g>)}
        <g role="button" tabIndex={0} aria-label={`Remove ${e.label} from design`} className="plan-remove" transform={`translate(${x+ew+8} ${y-8})`} onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();interaction.onRemove(e);}} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();interaction.onRemove(e);}}}><title>Remove {e.label}</title><circle r="12" fill="#fffaf4" stroke="#ad634b" strokeWidth="1.5"/><path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#a45137" strokeWidth="2" strokeLinecap="round"/></g>
      </g>;
    })}
    <path d="M64 63 V53 H504 V63" fill="none" stroke="#8b947d"/><text x="284" y="43" textAnchor="middle" fontSize="10" fill="#64745a">{w}′ backyard width · {d}′ depth</text>
    {rear > 0 && <text x="83" y="99" fontSize="8" fill="#8e7149">{rear}′ REAR SETBACK · {site.rearSetback.status.toUpperCase()}</text>}
    <text x="64" y="607" fontSize="8" fill="#7b866f">{interaction ? "DRAG TO MOVE · EDGES TO RESIZE · × TO REMOVE" : "CONCEPTUAL FOOTPRINTS · SUBJECT TO SURVEY"}</text>
  </svg>;
}
