"use client";
import { useState } from "react";
import type { ProjectBrief, SiteContext } from "@/types";
import { DEMO_RESIDENCE_VERSION } from "@/fixtures/site-context";
import { SitePlan } from "./site-plan";

export function PropertyContext({ brief, site }: { brief: ProjectBrief; site: SiteContext }) {
  const [view, setView] = useState("property");
  const [failed, setFailed] = useState<string[]>([]);
  const context = site.propertyContext;
  const images = context?.images ?? [];
  const preferred = images.find(i => i.kind === "street_view") ?? images.find(i => i.kind === "aerial") ?? images[0];
  const photo = view === "property" ? brief.photos[0] : null;
  const remote = view === "property" && !photo ? preferred : images.find(i => i.kind === view);
  const demoImage = !photo && site.isDemo && view !== "plan";
  const house = site.existingStructures.find(s => s.kind === "house");
  const resolution = context?.resolution;
  const label = photo ? "Homeowner photo · strongest visual reference · dimensions unverified" : demoImage ? view === "model" ? "Blender property model · fixture geometry" : "AI demo property · illustrative, not a current-property photo" : remote ? `${remote.source} · captured ${remote.capturedAt ?? "date unknown"}` : view === "plan" ? site.isDemo ? "Site plan · fixture geometry" : "Assumed design canvas · not measured from imagery" : "Property imagery is not available yet";
  return <div className="property-context">
    <div className="property-context-tabs" role="group" aria-label="Property context views">
      <button className={view === "property" ? "selected" : ""} onClick={() => setView("property")}>{brief.photos.length ? "Your property photo" : "Property view"}</button>
      {images.filter(i => i !== preferred || brief.photos.length > 0).map(i => <button key={i.kind} className={view === i.kind ? "selected" : ""} onClick={() => setView(i.kind)}>{i.kind === "street_view" ? "Street View" : i.kind === "aerial" ? "Public aerial" : "Google satellite"}</button>)}
      {site.isDemo && <button className={view === "model" ? "selected" : ""} onClick={() => setView("model")}>Blender model</button>}
      <button className={view === "plan" ? "selected" : ""} onClick={() => setView("plan")}>Site plan</button>
      <span>{site.isDemo ? "Illustrative demo property" : resolution?.status === "matched" ? "Address context retrieved" : "Unverified address"}</span>
    </div>
    <div className={`property-context-visual ${remote ? "remote-property-visual" : ""}`}>
      {photo ? <img src={photo.dataUrl} alt="Homeowner-uploaded current property photo"/> : demoImage ? <img className="property-model-image" src={view === "model" ? `/demo/property-max.png?v=${DEMO_RESIDENCE_VERSION}` : "/demo/photoreal/property-before-two-story.png"} alt="Illustrative fictional 2,000 sq ft, two-story year-2000 home with plain patio, lawn and mature oak"/> : view === "plan" ? <SitePlan site={site} project={null}/> : remote && !failed.includes(remote.imageUrl) ? <img className="remote-property-image" src={remote.imageUrl} alt={`${remote.source} around ${resolution?.normalizedAddress ?? site.propertyAddress}; approximate address point, not a surveyed parcel`} onError={() => setFailed(current => [...current, remote.imageUrl])}/> : <div className="property-image-empty"><strong>{remote ? "This property image could not load." : "Let’s see your actual property."}</strong><p>{remote ? "Try Find my property again, or add a backyard photo." : "Find your address for available public aerial context, or add your own backyard photos."}</p><span>Your photos provide the clearest view of the house and backyard.</span></div>}
      <span className="property-source-label">{label}</span>
    </div>
    {remote && <div className="property-source-detail"><a href={remote.sourceUrl} target="_blank" rel="noreferrer">{remote.source}</a><span>Retrieved {remote.retrievedAt.slice(0, 10)} · {remote.confidence} confidence</span><p>{remote.note}</p>{!remote.generationAllowed && <p>Display only; Google imagery is not sent to AI.</p>}</div>}
    {resolution && <div className="property-match" role="status"><strong>{resolution.normalizedAddress ?? "No address match yet"}</strong>{resolution.location && <span>{resolution.location.lat.toFixed(6)}, {resolution.location.lng.toFixed(6)} · {resolution.accuracy}</span>}<p>{resolution.note}</p><a href={resolution.sourceUrl} target="_blank" rel="noreferrer">{resolution.provider === "census" ? "U.S. Census Geocoder" : "Google Geocoding"} · retrieved {resolution.retrievedAt.slice(0, 10)}</a></div>}
    <div className="property-facts">
      <div><small>Backyard canvas</small><strong>{site.yardDimensions.widthFt}′ × {site.yardDimensions.depthFt}′</strong><span>{site.isDemo ? "Fixture dimensions" : "Working assumption"}</span></div>
      <div><small>House footprint</small><strong>{house ? `${house.widthFt}′ × ${house.depthFt}′` : "Not verified"}</strong><span>{house ? `${house.widthFt * house.depthFt} sq ft · ${house.fact.status}` : "No source retrieved"}</span></div>
      <div><small>Site rules</small><strong>{site.isDemo ? "10′ rear · 5′ side" : "Not verified"}</strong><span>{site.isDemo ? "Illustrative fixture rules" : "Municipal verification needed"}</span></div>
    </div>
    <p className="context-disclosure">{site.isDemo ? "Explore the fictional demo property, or enter a U.S. residential address and upload your own photos." : "Public aerial coverage varies and may be several years old. An address match does not verify residential use, parcel boundaries, backyard dimensions or rules. Uploaded photos take priority for AI concepts."}</p>
    {context && <ul className="property-warnings">{context.warnings.filter(w => w !== resolution?.note).map(w => <li key={w}>{w}</li>)}</ul>}
  </div>;
}
