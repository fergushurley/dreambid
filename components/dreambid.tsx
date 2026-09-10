"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Download, ImagePlus, Layers3, Leaf, MapPin, MoveUpRight, RotateCcw, ShieldCheck, Sparkles, TreePine, X } from "lucide-react";
import type { EngineMeta, ProjectBrief, ProjectSpec, RenovationConcept, SiteContext, ContractorQuote, QuoteRecommendation } from "@/types";
import { canonicalBrief, REVISION_PROMPT } from "@/fixtures/project";
import { canonicalSiteContext, DEMO_ADDRESS } from "@/fixtures/site-context";
import { ProjectVisual, type ProjectView } from "./project-visual";
import { photorealPreview } from "@/lib/photoreal-preview";
import { QuoteComparison } from "./quote-comparison";
import { bidPackageMarkdown } from "@/lib/bid-package";
import { BrandMark } from "./brand-mark";

const dollars = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
type Stage = "brief" | "concepts" | "design" | "quotes";
type SavedProject = { project: ProjectSpec; site: SiteContext; brief: ProjectBrief; meta: EngineMeta | null };

async function post<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong. Your current project has been kept.");
  return result as T;
}

export function DreamBid() {
  const [stage, setStage] = useState<Stage>("brief");
  const [brief, setBrief] = useState<ProjectBrief>(canonicalBrief);
  const [site, setSite] = useState<SiteContext>(canonicalSiteContext);
  const [concepts, setConcepts] = useState<RenovationConcept[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [project, setProject] = useState<ProjectSpec | null>(null);
  const [meta, setMeta] = useState<EngineMeta | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState("");
  const [view, setView] = useState<ProjectView>("concept");
  const [saved, setSaved] = useState<SavedProject | null>(null);
  const [quotes, setQuotes] = useState<ContractorQuote[]>([]);
  const [recommendation, setRecommendation] = useState<QuoteRecommendation | null>(null);
  const [renderBusy, setRenderBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const activeProject = useRef<ProjectSpec | null>(null);
  useEffect(() => { activeProject.current = project; }, [project]);
  useEffect(() => { setView("concept"); }, [project?.id, project?.version]);
  useEffect(() => {
    try { const value = localStorage.getItem("dreambid-project-v1"); if (value) setSaved(JSON.parse(value)); } catch { /* Storage may be disabled. */ }
  }, []);
  useEffect(() => {
    if (!project) return;
    try { localStorage.setItem("dreambid-project-v1", JSON.stringify({ project, site, brief: { ...brief, photos: [] }, meta })); } catch { /* The active in-memory project remains usable. */ }
  }, [project, site, brief, meta]);

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label); setError("");
    try { await task(); } catch (e) { setError(e instanceof Error ? e.message : "Please try again. Your project has been kept."); }
    finally { setBusy(""); }
  }
  async function generate() {
    await run("Considering your space and three design directions…", async () => {
      const result = await post<{ data: { concepts: RenovationConcept[]; analysis: string }; site: SiteContext; meta: EngineMeta }>("/api/concepts", { brief, demoMode });
      setConcepts(result.data.concepts); setAnalysis(result.data.analysis); setSite(result.site); setMeta(result.meta); setStage("concepts");
    });
  }
  async function renderProject(p: ProjectSpec) {
    setRenderBusy(true);
    try {
      const result = await post<{ data: ProjectSpec["scene"] }>("/api/render", { project: p });
      setProject(current => current?.id === p.id && current.version === p.version ? { ...current, scene: result.data } : current);
    } catch { /* The site plan is a deterministic, labeled fallback. */ }
    finally { setRenderBusy(false); }
  }
  async function selectConcept(concept: RenovationConcept) {
    await run("Turning your concept into a scoped project…", async () => {
      const result = await post<{ data: ProjectSpec; site: SiteContext; meta: EngineMeta }>("/api/project", { brief, concept, demoMode });
      setProject(result.data); setSite(result.site); setMeta(result.meta); setStage("design"); setView("concept"); setQuotes([]); setRecommendation(null);
      void renderProject(result.data);
    });
  }
  async function revise() {
    if (!project) return;
    await run("Revising the scope and checking what stays…", async () => {
      const result = await post<{ data: ProjectSpec; site: SiteContext; meta: EngineMeta }>("/api/revise", { project, instruction: revision, demoMode });
      setProject(result.data); setSite(result.site); setMeta(result.meta); setRevision(""); setQuotes([]); setRecommendation(null); setView("concept");
      void renderProject(result.data);
    });
  }
  async function getQuotes() {
    if (!project) return;
    await run("Comparing three bids against every scope item…", async () => {
      const result = await post<{ data: QuoteRecommendation; quotes: ContractorQuote[]; meta: EngineMeta }>("/api/quotes", { project, demoMode });
      setQuotes(result.quotes); setRecommendation(result.data); setMeta(result.meta); setStage("quotes");
    });
  }
  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setError("");
    const available = 3 - brief.photos.length;
    if (files.length > available) { setError("Add up to three photos per project."); return; }
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4000000) { setError("Use JPG, PNG or WebP photos under 4 MB each."); continue; }
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      setBrief(current => ({ ...current, photos: [...current.photos, { name: file.name, dataUrl }] }));
    }
    if (upload.current) upload.current.value = "";
  }
  function reset() {
    setStage("brief"); setProject(null); setConcepts([]); setQuotes([]); setRecommendation(null); setError(""); setMeta(null); setSite(canonicalSiteContext); setBrief(canonicalBrief); setSaved(null);
    try { localStorage.removeItem("dreambid-project-v1"); } catch { /* optional browser persistence */ }
  }
  function goHome() {
    if (busy) return;
    if (project) setSaved({ project, site, brief: { ...brief, photos: [] }, meta });
    setProject(null); setStage("brief"); setSite(canonicalSiteContext); setBrief(canonicalBrief);
    setMeta(null); setError(""); setRevision(""); setQuotes([]); setRecommendation(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function downloadProject() {
    if (!project) return;
    const blob = new Blob([JSON.stringify({ project, site, disclosure: "Synthetic planning budget and preliminary feasibility; not construction documentation." }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `dreambid-v${project.version}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadBidPackage() {
    if (!project) return;
    const url = URL.createObjectURL(new Blob([bidPackageMarkdown(project, site)], { type: "text/markdown" }));
    const a = document.createElement("a"); a.href = url; a.download = `dreambid-bid-package-v${project.version}.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const conceptPreview = photorealPreview(project);
  const phase = stage === "brief" ? 0 : stage === "concepts" ? 1 : stage === "design" ? 2 : 3;
  const title = stage === "brief" ? "A place for your people." : stage === "concepts" ? "Three ways to make it yours." : stage === "quotes" ? "The price is only the beginning." : project?.title || "Your gathering garden.";

  return <div className="app-shell">
    <header className="topbar"><button className="wordmark" onClick={goHome} disabled={!!busy} aria-label="Dream Bid home"><BrandMark/><span style={{ whiteSpace: "nowrap" }}>Dream Bid</span></button><nav className="journey" aria-label="Project steps">{["Your space", "Explore concepts", "Shape your project", "Compare bids"].map((label, i) => <span className={i === phase ? "active" : i < phase ? "complete" : ""} key={label}><span className="step-number">{i < phase ? <Check size={11}/> : `0${i + 1}`}</span>{label}{i < 3 && <span className="step-line"/>}</span>)}</nav><div className="header-note"><span className="tiny-dot"/> Built with GPT-6 Astra</div></header>
    <main className="workspace">
      <div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line"/> A better way to bring it home</p><h1>{title}</h1><p className="subheading">{stage === "brief" ? "Start with a little imagination. Leave with a plan you can build on." : stage === "concepts" ? "Same space. Your priorities. Three considered directions." : stage === "quotes" ? "Three synthetic bids, compared against the same agreed scope." : "One living plan, from the first idea to the final quote."}</p></div><div className="heading-actions"><label className="demo-toggle"><input type="checkbox" checked={demoMode} disabled={!!busy} onChange={e => setDemoMode(e.target.checked)}/><span>Demo playback</span></label>{project && <button className="icon-button" onClick={downloadProject} title="Download ProjectSpec and site context"><Download size={17}/></button>}<button className="icon-button" onClick={reset} disabled={!!busy} title="Start a new project"><RotateCcw size={16}/></button></div></div>
      {saved && !project && stage === "brief" && <div className="resume-banner"><span>A project from this browser is ready to continue.</span><button onClick={async () => { const { projectSpecSchema, siteContextSchema, projectBriefSchema } = await import("@/types"); try { setProject(projectSpecSchema.parse(saved.project)); setSite(siteContextSchema.parse(saved.site)); setBrief(projectBriefSchema.parse(saved.brief)); setMeta(saved.meta); setStage("design"); setSaved(null); } catch { setSaved(null); setError("The saved project could not be restored. Start a new project."); } }}>Resume {saved.project.title}<ArrowRight size={14}/></button></div>}
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
      {meta && <div className={`engine-note ${meta.mode}`}><Sparkles size={13}/><strong>{meta.mode === "live" ? "Live Astra" : meta.mode === "demo" ? "Deterministic demo" : "Fixture fallback"}</strong><span>{meta.mode === "live" ? `${meta.model} · validated structured output · ${(meta.durationMs / 1000).toFixed(1)}s` : meta.reason}</span></div>}
      {stage !== "quotes" && <>
      <section className={`design-workspace ${stage === "concepts" ? "concept-context" : ""}`}>
        <div className="visual-panel">
          <div className={`visual-toolbar ${conceptPreview ? "has-photoreal" : ""}`}><span className="property-label"><MapPin size={13}/>{site.isDemo ? "24 Maple Lane · illustrative property" : brief.propertyAddress}</span>{project && <div className="view-switch">{conceptPreview && <button className={view === "concept" ? "selected" : ""} onClick={() => setView("concept")}>Concept</button>}<button className={view === "render" || (view === "concept" && !conceptPreview) ? "selected" : ""} onClick={() => setView("render")}>3D view</button><button className={view === "plan" ? "selected" : ""} onClick={() => setView("plan")}>Site plan</button></div>}</div>
          <ProjectVisual project={project} site={site} view={view} renderBusy={renderBusy}/>
          <div className="site-strip"><span><TreePine size={15}/>{site.protectedTree ? "Mature oak to preserve" : "Existing features unverified"}</span><span><Layers3 size={15}/>{site.isDemo ? "10′ rear · 5′ side setback fixtures" : "Setbacks not verified"}</span><span className="fixture-tag">{site.isDemo ? "Illustrative site" : "Assumed geometry"}</span></div>
        </div>
        <aside className="brief-panel">
          {stage === "brief" ? <><div className="panel-title"><span className="small-number">01</span><h2>Make room for more.</h2></div><form onSubmit={e => { e.preventDefault(); void generate(); }}>
            <label className="field-label" htmlFor="address">PROPERTY ADDRESS</label><div className="input-with-icon"><MapPin size={16}/><input id="address" value={brief.propertyAddress} onChange={e => setBrief({ ...brief, propertyAddress: e.target.value, useDemoSite: e.target.value === DEMO_ADDRESS })} required maxLength={250}/></div>
            <label className="field-label" htmlFor="brief">WHAT ARE YOU IMAGINING?</label><textarea id="brief" rows={5} value={brief.description} onChange={e => setBrief({ ...brief, description: e.target.value })} minLength={10} maxLength={4000} required/>
            <label className="field-label" htmlFor="budget">YOUR BUDGET</label><div className="budget-input"><span>$</span><input id="budget" type="number" min={5000} max={1000000} step={500} value={brief.budget} onChange={e => setBrief({ ...brief, budget: Number(e.target.value) })} required/><span>USD</span></div>
            <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" multiple className="visually-hidden" aria-label="Upload backyard photos" onChange={e => void addPhotos(e.target.files)}/><button type="button" className="upload-button" onClick={() => upload.current?.click()}><ImagePlus size={18}/><span>{brief.photos.length ? `${brief.photos.length} photo${brief.photos.length === 1 ? "" : "s"} added` : "Add backyard photos"}<small>Optional · JPG, PNG or WebP · up to 3</small></span><span>+</span></button>
            {brief.photos.length > 0 && <div className="photo-thumbs">{brief.photos.map((p, i) => <div key={`${p.name}-${i}`}><img src={p.dataUrl} alt={`Uploaded backyard: ${p.name}`}/><button type="button" aria-label={`Remove ${p.name}`} onClick={() => setBrief({ ...brief, photos: brief.photos.filter((_, j) => i !== j) })}><X size={11}/></button></div>)}</div>}
            <button type="submit" className="button primary full" disabled={!!busy}><Sparkles size={16}/>Explore my possibilities<ArrowRight size={17}/></button><p className="form-note">A first look at what is possible. No commitment.</p>
          </form></> : stage === "concepts" ? <><div className="panel-title"><Sparkles size={18}/><h2>A little considered thinking.</h2></div><p className="analysis-text">{analysis}</p><div className="intent-list"><span><Check size={15}/>Your budget: {dollars(brief.budget)}</span><span><Check size={15}/>Exactly three design directions</span><span><Check size={15}/>Site assumptions made visible</span></div><button className="button secondary full" onClick={() => setStage("brief")} disabled={!!busy}>Edit your brief</button><p className="form-note">Choose a concept below to see its full layout and scope.</p></> : project && <><div className="panel-title"><span className="small-number">{String(project.version).padStart(2, "0")}</span><h2>Your plan, taking shape.</h2></div><div className="estimate-label">INDICATIVE PROJECT TOTAL</div><div className="big-estimate">{dollars(project.estimatedTotal)}</div><div className="budget-track"><span style={{ width: `${Math.min(100, project.estimatedTotal / project.budgetMaximum * 100)}%` }}/></div><p className="budget-remaining">{dollars(Math.max(0, project.budgetMaximum - project.estimatedTotal))} within your {dollars(project.budgetMaximum)} limit</p><div className="element-summary">{project.elements.filter(e => e.kind !== "tree").map(e => <div key={e.id}><span><span className="element-dot" style={{ background: e.color }}/>{e.label}</span><span>{dollars(e.estimatedCost)}</span></div>)}{project.scopeItems.filter(s => s.elementId === null).map(s => <div key={s.id}><span><span className="element-dot" style={{ background: "#b8b4a5" }}/>{s.category}</span><span>{dollars(s.estimatedCost)}</span></div>)}</div><button className="button primary full" onClick={() => void getQuotes()} disabled={!!busy || project.feasibility.status === "conflicts"}>Get 3 quotes<ArrowRight size={17}/></button><p className="form-note">Synthetic contractor bids for this exact scope.</p></>}
        </aside>
      </section>
      {stage === "concepts" && <section className="concept-section"><div className="section-heading"><h2>Find your kind of outdoors.</h2><span>01 — 03 / CURATED DIRECTIONS</span></div><div className="concept-grid">{concepts.map((concept, i) => <button className={`concept-card ${concept.recommended ? "recommended" : ""}`} key={concept.id} onClick={() => void selectConcept(concept)} disabled={!!busy}><div className={`concept-swatch ${concept.palette}`}><img src={`/demo/${concept.palette}.png`} alt="Illustrative Blender reference layout; selected project is rendered separately"/><small className="reference-label">REFERENCE LAYOUT · FIXTURE</small><span>0{i + 1}</span><div className="material-chips"><i/><i/><i/></div>{concept.recommended && <b><Sparkles size={11}/>Our pick for you</b>}</div><div className="concept-body"><div className="concept-name"><h3>{concept.title}</h3><MoveUpRight size={19}/></div><p>{concept.designDirection}</p><div className="concept-tags">{concept.majorElements.map(e => <span key={e}>{e}</span>)}</div><div className="concept-price"><strong>{dollars(concept.budgetRange.low)}–{dollars(concept.budgetRange.high)}</strong><span>Explore this idea<ArrowUpRight size={14}/></span></div></div></button>)}</div></section>}
      {stage === "design" && project && <section className="project-details"><div className="revision-card"><div className="section-heading"><h2>A change of plans? That is the plan.</h2><Sparkles size={19}/></div><p>Refine your design. Your budget and everything you want to keep stay with it.</p><form onSubmit={e => { e.preventDefault(); void revise(); }}><textarea aria-label="Revise your project" placeholder="What would you like to change?" value={revision} onChange={e => setRevision(e.target.value)} rows={2} minLength={5} maxLength={2000} required/><div className="revision-actions"><button type="button" className="text-button" onClick={() => setRevision(REVISION_PROMPT)}>Try: swap pergola for an outdoor kitchen</button><button className="button primary" disabled={!!busy || revision.length < 5}>Revise my plan<ArrowRight size={16}/></button></div></form>{project.revisionHistory.length > 0 && <div className="revision-receipt"><span className="eyebrow">REVISION {project.version} · WHAT CHANGED</span><p>{project.revisionHistory.at(-1)?.summary}</p><div>{project.revisionHistory.at(-1)?.changes.map(c => <span key={c}><Check size={12}/>{c}</span>)}</div><p className="preserved"><ShieldCheck size={14}/>Kept: {project.revisionHistory.at(-1)?.preserved.join(" · ")}</p></div>}</div><div className="feasibility-card"><div className="section-heading"><h2>A plan with its feet on the ground.</h2><ShieldCheck size={21}/></div><p className="status-label">PRELIMINARY FEASIBILITY · {site.isDemo ? "FIXTURE RULES" : "UNVERIFIED SITE"}</p>{project.feasibility.conflicts.map((c, i) => <div className={`check-row ${c.resolved ? "" : "unresolved"}`} key={i}><span>{c.resolved ? <Check size={14}/> : "!"}</span><p>{c.explanation}</p></div>)}<div className="check-row"><span><TreePine size={14}/></span><p>{site.protectedTree ? (project.feasibility.status === "conflicts" ? "Mature oak is retained. Resolve the placement conflicts before confirming protection-zone clearance." : "Mature oak stays. New structures keep clear of its protection zone.") : "Site features need to be confirmed from a survey."}</p></div><p className="feasibility-disclaimer">{project.feasibility.disclaimer}</p></div></section>}
      <details className="provenance"><summary><span><Layers3 size={16}/>What we know about this site</span><span>Sources & assumptions<ChevronDown size={15}/></span></summary><p>{site.summary}</p><div className="fact-grid">{(["rearSetback", "sideSetback", "zoningDistrict", "lotArea", "easements", "historicStatus"] as const).map(key => { const fact = site[key]; return <div key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{fact.value === null ? "Not verified" : `${fact.value}${fact.unit ? ` ${fact.unit}` : ""}`}</strong><small>{fact.status} · {fact.source}<br/>{fact.note}</small></div>; })}</div><p className="form-note">No government records or aerial imagery retrieved. Illustrative geometry is never treated as authoritative.</p></details>
      </>}
      {stage === "quotes" && project && recommendation && <QuoteComparison project={project} site={site} quotes={quotes} recommendation={recommendation} onBack={() => setStage("design")} onDownload={downloadBidPackage}/>}
      <footer className="footer"><span><Leaf size={14}/> More possibility. Fewer unknowns.</span><span>Hackathon prototype · preliminary designs · synthetic pricing</span><a href="https://github.com/fergushurley/dreambid" target="_blank" rel="noreferrer">Built in the open<ArrowUpRight size={12}/></a></footer>
    </main>
    {busy && <div className="working-toast" role="status" aria-live="polite"><span className="working-spinner"/><div><strong>{busy}</strong><span>{demoMode ? "Replaying the canonical fixture" : "Astra reasons over the project; constraints are checked in code"}</span></div></div>}
  </div>;
}
