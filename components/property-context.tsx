"use client";
import { useState } from "react";
import type { ProjectBrief, SiteContext } from "@/types";
import { DEMO_RESIDENCE_VERSION } from "@/fixtures/site-context";
import { SitePlan } from "./site-plan";
export function PropertyContext({ brief, site }: { brief: ProjectBrief; site: SiteContext }) {
  const [view, setView] = useState<"property"|"model"|"plan">("property");
  const photo = view === "property" ? brief.photos[0] : null;
  const demoImage = !photo && site.isDemo && view !== "plan";
  const house = site.existingStructures.find(s => s.kind === "house");
  return <div className="property-context">
    <div className="property-context-tabs">
      {(site.isDemo || brief.photos.length>0) && <button className={view==="property"?"selected":""} onClick={()=>setView("property")}>{brief.photos.length>0?"Your property photo":"Property view"}</button>}
      {site.isDemo && <button className={view==="model"?"selected":""} onClick={()=>setView("model")}>Blender model</button>}
      <button className={view==="plan"||(!photo&&!demoImage)?"selected":""} onClick={()=>setView("plan")}>Site plan</button>
      <span>{site.isDemo ? "Illustrative demo property" : "Unverified address"}</span>
    </div>
    <div className="property-context-visual">
      {photo ? <img src={photo.dataUrl} alt="Homeowner-uploaded current property photo"/> : demoImage ? <img className="property-model-image" src={view==="model"?`/demo/property-max.png?v=${DEMO_RESIDENCE_VERSION}`:"/demo/photoreal/property-before-two-story.png"} alt={`${view==="model"?"Blender model":"AI visualization"} of the fictional 2,000 sq ft, two-story year-2000 home, plain existing patio, lawn and mature oak`}/> : <SitePlan site={site} project={null}/>}
      <span className="property-source-label">{photo ? "Homeowner photo · unverified dimensions" : demoImage ? view==="model"?"Blender property model · fixture geometry":"AI demo property · illustrative, not a current-property photo" : site.isDemo ? "Site plan · fixture geometry" : "Assumed design canvas · no property measurements retrieved"}</span>
    </div>
    <div className="property-facts">
      <div><small>Backyard canvas</small><strong>{site.yardDimensions.widthFt}′ × {site.yardDimensions.depthFt}′</strong><span>{site.isDemo ? "Fixture dimensions" : "Working assumption"}</span></div>
      <div><small>House footprint</small><strong>{house ? `${house.widthFt}′ × ${house.depthFt}′` : "Not verified"}</strong><span>{house ? `${house.widthFt*house.depthFt} sq ft · ${house.fact.status}` : "No source retrieved"}</span></div>
      <div><small>Site rules</small><strong>{site.isDemo ? "10′ rear · 5′ side" : "Not verified"}</strong><span>{site.isDemo ? "Illustrative fixture rules" : "Municipal verification needed"}</span></div>
    </div>
    {site.residence && <p className="residence-facts"><strong>{Number(site.residence.floorArea.value).toLocaleString("en-US")} sq ft total · {site.residence.stories.value} stories · Built {site.residence.yearBuilt.value}</strong><span>User-specified demo home · no property record retrieved</span></p>}
    <p className="context-disclosure">{site.isDemo ? "Explore the fictional demo property, or enter a U.S. residential address and upload your own photos." : "We can plan from your address and photos. Nationwide parcel records, aerial imagery and government plans are not connected; confirm this assumed canvas before relying on placement."}</p>
  </div>;
}
