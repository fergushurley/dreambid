"use client";
import { useId } from "react";
import type { ProjectSpec, SiteContext } from "@/types";

export function SitePlan({ project, site, highlighted = [], compact = false }: { project: ProjectSpec | null; site: SiteContext; highlighted?: string[]; compact?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const w = project?.dimensions.widthFt || site.yardDimensions.widthFt;
  const d = project?.dimensions.depthFt || site.yardDimensions.depthFt;
  const rear = typeof site.rearSetback.value === "number" ? site.rearSetback.value : 0;
  const side = typeof site.sideSetback.value === "number" ? site.sideSetback.value : 0;
  const tree = site.protectedTree;
  const sx = (x: number) => 64 + x / w * 440;
  const sy = (y: number) => 434 - y / d * 350;
  return <svg className={`site-plan ${compact ? "compact" : ""}`} viewBox="0 0 570 510" role="img" aria-label={`${site.isDemo ? "Illustrative" : "Assumed"} site plan showing project footprints, tree protection and setback envelope`}>
    <defs><pattern id={`${uid}-grid`} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#9da88d" strokeWidth=".35" opacity=".45"/></pattern></defs>
    <rect width="570" height="510" fill="#eaece1"/>
    <rect x="64" y="84" width="440" height="350" rx="1" fill="#d6ddc8" stroke="#7e8d72" strokeWidth="1.4"/>
    <rect x="64" y="84" width="440" height="350" fill={`url(#${uid}-grid)`}/>
    {rear > 0 && <rect x="64" y="84" width="440" height={rear / d * 350} fill="#d0be96" opacity=".26"/>}
    {(side > 0 || rear > 0) && <rect x={sx(side)} y={sy(d - rear)} width={(w - 2 * side) / w * 440} height={(d - rear) / d * 350} fill="none" stroke="#8d9576" strokeDasharray="5 4"/>}
    {!project && site.existingStructures.filter(e => e.kind === "patio").map(e => <g key={e.id}><rect x={sx(e.position.x)} y={sy(e.position.y + e.depthFt)} width={e.widthFt / w * 440} height={e.depthFt / d * 350} fill="#d1c8b5" stroke="#a49b87"/><text x={sx(e.position.x + e.widthFt / 2)} y={sy(e.position.y + e.depthFt / 2)} textAnchor="middle" fontSize="10" fill="#65614f">Existing patio</text></g>)}
    {project?.elements.filter(e => e.kind !== "tree").sort((a, b) => (a.kind === "patio" ? -1 : b.kind === "patio" ? 1 : 0)).map(e => {
      const x = sx(e.position.x), y = sy(e.position.y + e.size.depthFt), ew = e.size.widthFt / w * 440, eh = e.size.depthFt / d * 350;
      const active = highlighted.includes(e.id);
      return <g key={e.id}>
        <rect x={x} y={y} width={ew} height={eh} rx={e.kind === "dining" ? 8 : 2} fill={active ? "#df997b" : e.color} fillOpacity={e.kind === "lighting" || e.kind === "pergola" ? .13 : .92} stroke={active ? "#b04c2f" : e.kind === "lighting" ? "#bba264" : "#837d66"} strokeWidth={active ? 3 : 1} strokeDasharray={e.kind === "lighting" ? "3 5" : e.kind === "pergola" ? "4 2" : undefined}/>
        {e.kind === "pergola" && Array.from({ length: 7 }, (_, i) => <line key={i} x1={x + ew / 7 * i + 4} y1={y} x2={x + ew / 7 * i + 4} y2={y + eh} stroke="#a68059" strokeWidth="3" opacity=".7"/>)}
        {!compact && e.kind !== "lighting" && <text x={x + ew / 2} y={y + eh / 2 + 3} textAnchor="middle" fontSize={e.kind === "planter" ? 7 : 9} fontFamily="Arial" fill={active ? "#713721" : "#494d3d"}>{e.kind === "patio" ? "TERRACE" : e.kind === "kitchen" ? "KITCHEN" : e.kind === "dining" ? "DINING" : e.kind === "pergola" ? "SHADE" : "PLANTING"}</text>}
      </g>;
    })}
    {tree && <g><circle cx={sx(tree.position.x)} cy={sy(tree.position.y)} r={tree.protectionRadiusFt / w * 440} fill="none" stroke="#6d7b58" strokeDasharray="4 4"/><circle cx={sx(tree.position.x)} cy={sy(tree.position.y)} r={5.3 / w * 440} fill="#8b9e77" fillOpacity=".65" stroke="#6c8257"/><circle cx={sx(tree.position.x)} cy={sy(tree.position.y)} r="4" fill="#657b52"/>{!compact && <><text x={sx(tree.position.x)} y={sy(tree.position.y) - 16} textAnchor="middle" fontSize="9" fill="#3d5438">MATURE OAK</text><text x={sx(tree.position.x)} y={sy(tree.position.y) + 23} textAnchor="middle" fontSize="8" fill="#4a5c3f">retained · 7′ protection</text></>}</g>}
    <rect x="105" y="434" width="350" height="47" fill="#d0cabc" stroke="#9d9787"/>
    <text x="280" y="462" textAnchor="middle" fill="#757466" fontSize="10" letterSpacing="2">EXISTING HOME</text>
    <path d="M64 63 V53 H504 V63" fill="none" stroke="#8b947d"/>
    <text x="284" y="47" textAnchor="middle" fontSize="10" fill="#64745a">{w}′ backyard width · {d}′ depth</text>
    {rear > 0 && <text x="83" y="103" fontSize="8" fill="#8e805f">{rear}′ REAR SETBACK · FIXTURE</text>}
    <text x="510" y="28" fontSize="9" fill="#64745a">N ↑</text>
    {!compact && <text x="64" y="501" fontSize="8" fill="#87907b">CONCEPTUAL FOOTPRINTS · SUBJECT TO SURVEY</text>}
  </svg>;
}
