"use client";
import { useRef, useState } from "react";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import type { BudgetSummary, EngineMeta, LayoutPatch, ProjectSpec } from "@/types";
import { catalogById } from "@/fixtures/feature-catalog";
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

type Proposal = { data: ProjectSpec; patch: LayoutPatch; tradeoffs: string[]; budget: BudgetSummary; meta: EngineMeta; base: string };
const fingerprint = (p:ProjectSpec) => JSON.stringify([p.id,p.version,p.elements,p.budgetMaximum]);
export function PlanAssistant({project,demoMode,onApply}:{project:ProjectSpec;demoMode:boolean;onApply:(project:ProjectSpec,meta:EngineMeta)=>void}) {
  const [instruction,setInstruction]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [proposal,setProposal]=useState<Proposal|null>(null);
  const current=useRef(project); current.current=project;
  const stale=proposal && proposal.base!==fingerprint(project);
  async function ask(){
    const base=fingerprint(project); setBusy(true);setError("");setProposal(null);
    try {
      const response=await fetch("/api/layout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({project,instruction,demoMode}),signal:AbortSignal.timeout(90000)});
      const result=await response.json(); if(!response.ok)throw new Error(result.error||"The plan could not be updated.");
      if(fingerprint(current.current)!==base)throw new Error("Your layout changed while DreamBid was thinking. Ask again using the current plan.");
      setProposal({...result,base});
    }catch(error){setError(error instanceof Error?error.message:"Please try again.");}finally{setBusy(false);}
  }
  return <div className="plan-assistant">
    <form onSubmit={e=>{e.preventDefault();void ask();}}><Sparkles size={19}/><input aria-label="Ask DreamBid to change the plan" placeholder="Ask DreamBid to change the plan…" value={instruction} minLength={5} maxLength={2000} onChange={e=>setInstruction(e.target.value)} required/><button className="button primary" disabled={busy||instruction.length<5}>{busy?"Considering your plan…":"Suggest changes"}<ArrowRight size={15}/></button></form>
    <div className="assistant-examples">{["Keep the tree and get this under $75K.","Make the putting green smaller.","Remove the pergola and add a shade sail."].map(text=><button key={text} disabled={busy} onClick={()=>setInstruction(text)}>{text}</button>)}</div>
    {error&&<p className="assistant-error" role="alert">{error}</p>}
    {proposal&&<div className="assistant-proposal"><div className="proposal-heading"><span className="eyebrow">{proposal.meta.mode==="live"?"LIVE ASTRA":"DETERMINISTIC FALLBACK"} · PROPOSED CHANGES</span><button className="icon-button" aria-label="Dismiss proposed changes" onClick={()=>setProposal(null)}><X size={15}/></button></div><h3>{proposal.patch.summary}</h3><ul>{proposal.patch.operations.map((op,i)=>{const label="elementId" in op?project.elements.find(e=>e.id===op.elementId)?.label:"";return <li key={i}>{op.action==="replace"?`${label} → ${catalogById.get(op.catalogItemId)?.name}`:op.action==="add"?`Add ${catalogById.get(op.catalogItemId)?.name}`:op.action==="remove"?`Remove ${label}`:`Adjust ${label}`}{"dimensions"in op&&op.dimensions?` · ${op.dimensions.widthFt}′ × ${op.dimensions.depthFt}′`:""}{"position"in op&&op.position?` · position ${op.position.x}′, ${op.position.y}′`:""}</li>;})}</ul><div className="proposal-budget"><strong>{money(proposal.budget.range.low)}–{money(proposal.budget.range.high)}</strong><span>Proposed preliminary installed range</span></div>{proposal.tradeoffs.map(text=><p key={text}>{text}</p>)}{proposal.meta.mode!=="live"&&<small>{proposal.meta.reason}</small>}{proposal.data.feasibility.conflicts.some(c=>!c.resolved)&&<p className="assistant-error">Placement warnings remain. Review them in the site plan before requesting quotes.</p>}{stale?<p className="assistant-error">This proposal is from an earlier layout. Ask again before applying changes.</p>:<button className="button primary" onClick={()=>{if(proposal.base!==fingerprint(current.current))return;onApply(proposal.data,proposal.meta);setProposal(null);setInstruction("");}}>Apply these changes<Check size={15}/></button>}</div>}
  </div>;
}
