import type { ProjectSpec, RenovationConcept } from "@/types";
import { element, scope } from "./project";
import { catalogById } from "./feature-catalog";
/** Extend the same ProjectSpec. The original canonical middle fixture remains reproducible. */
export function applyConceptTier(p: ProjectSpec, palette: RenovationConcept["palette"]): ProjectSpec {
 const byId=(id:string)=>p.elements.find(e=>e.id===id)!;
 const resize=(id:string,widthFt:number,depthFt:number)=>{byId(id).size={...byId(id).size,widthFt,depthFt};};
 const cost=(id:string,value:number,description?:string)=>{const s=p.scopeItems.find(s=>s.id===id)!;s.estimatedCost=value;if(description)s.description=description;};
 if(palette==="meadow"){
  Object.assign(byId("patio"),{label:"Compact gravel terrace",material:"Compacted gravel",color:"#c7bea6"});resize("patio",20,14);
  Object.assign(byId("pergola"),{kind:"shade_sail",label:"Simple fabric shade sail",material:"Off-white tensioned fabric on slender posts",color:"#e0d9c6",position:{x:9,y:10}});resize("pergola",12,10);
  byId("dining").label="Simple dining for six";resize("dining",8,5);resize("planting",12,3);byId("planting").position={x:8,y:23};resize("lights",18,12);
  cost("patio",6000,"Compact gravel terrace, edging and subbase");cost("pergola",1800,"Basic shade sail, posts and anchoring");cost("dining",1600,"Six-person stock dining set");cost("lighting",1100);cost("landscape",2000);cost("site-prep",2000);
 }else{
  const premium=palette==="retreat";resize("patio",premium?32:22,premium?26:20);resize("pergola",premium?18:12,premium?14:12);byId("pergola").position={x:9,y:10};
  if(premium){Object.assign(byId("patio"),{label:"Expanded sandstone terrace",material:"Premium sandstone"});Object.assign(byId("pergola"),{label:"Architectural charcoal pergola",material:"Charcoal-painted timber",color:"#434943"});}
  byId("planting").position={x:39,y:8};resize("planting",3,22);
  p.elements.push(element("kitchen","kitchen",premium?"Full outdoor kitchen":"Compact outdoor kitchen",premium?27:20,premium?20:23,premium?12:8,premium?4:3,3.2,premium?19000:14500,"Stone countertop, cabinetry and stainless grill","#b9ad92",["kitchen-base","kitchen-countertop","kitchen-electrical"]));
  p.scopeItems.push(scope("kitchen-base","kitchen","Outdoor kitchen","Kitchen cabinetry, grill and installation",premium?9300:7000),scope("kitchen-countertop","kitchen","Outdoor kitchen","Stone countertop and installation",premium?5500:4500),scope("kitchen-electrical","kitchen","Electrical","Outdoor kitchen electrical connection",premium?4200:3000));
  cost("patio",premium?16000:10000);cost("pergola",premium?10500:8000);cost("dining",premium?4000:3200);cost("lighting",premium?4500:2200);cost("landscape",premium?5000:2000);cost("site-prep",premium?6000:3000);
  if(premium){
   p.elements.push(element("lounge","lounge","Integrated lounge",23,27,10,4,3,4000,"Stone and linen","#c4b7a0",["lounge"]));p.scopeItems.push(scope("lounge","lounge","Furnishings","Integrated lounge base and cushions",4000));
   const item=catalogById.get("pool")!;
   p.elements.push({...element("pool","pool","Swimming pool",6,35,24,12,1,65000,"Blue water and pale stone coping",item.color,["pool"]),catalogItemId:"pool",rotationDeg:90,pricing:item.priceModel,indicativeRange:item.installedRange});
   p.scopeItems.push({...scope("pool","pool","Water","24 × 12 ft swimming pool, ordinary excavation and installation",65000),quantity:288,unit:"sq ft"});
  }
 }
 p.assumptions=["Curated feature-tier scope and preliminary installed allowances, not contractor quotes.","Geometry and finishes are illustrative; verify measurements, utilities, drainage, barriers and approvals."];
 p.estimatedTotal=p.scopeItems.reduce((n,s)=>n+s.estimatedCost,0);
 for(const e of p.elements)e.estimatedCost=p.scopeItems.filter(s=>s.elementId===e.id).reduce((n,s)=>n+s.estimatedCost,0);
 if(p.estimatedTotal>p.budgetMaximum){p.hardConstraints=p.hardConstraints.filter(c=>!/budget maximum/.test(c));p.hardConstraints.push("The homeowner budget stays unchanged. This exploration exceeds it; reduce scope or obtain an explicit budget change before committing.");p.assumptions.push(`This selected scope exceeds the homeowner's $${p.budgetMaximum} budget. Prices were not reduced to disguise this.`);}
 return p;
}
