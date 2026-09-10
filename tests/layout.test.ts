import test from "node:test";
import assert from "node:assert/strict";
import { zodTextFormat } from "openai/helpers/zod";
import { canonicalBrief, REVISION_PROMPT } from "../fixtures/project";
import { canonicalSiteContext, siteForAddress } from "../fixtures/site-context";
import { fallbackConcepts } from "../fixtures/concepts";
import { featureCatalog } from "../fixtures/feature-catalog";
import { fixtureProject, projectDraftSchema, revisionPatchSchema } from "../lib/project";
import { applyLayoutPatch, budgetSummary, priceAtSize } from "../lib/layout";
import { checkFeasibility } from "../lib/feasibility";
import { normalizeQuotes } from "../lib/quotes";
import { syntheticQuotes } from "../fixtures/quotes";
import { layoutPatchSchema } from "../types";
import { photorealPreview } from "../lib/photoreal-preview";
const base = () => fixtureProject(canonicalBrief, fallbackConcepts(canonicalBrief).concepts[1], canonicalSiteContext);
const add = (p: ReturnType<typeof base>, kind: string, x=5, y=30) => applyLayoutPatch(p, { summary: `Add ${kind}`, operations: [{ action:"add", catalogItemId:kind, position:{x,y}, dimensions:null }] }, canonicalSiteContext);
test("catalog covers 31 requested features and all default ranges and size bounds are coherent", () => {
 assert.equal(featureCatalog.length,31); assert.equal(new Set(featureCatalog.map(i=>i.id)).size,31);
 for (const i of featureCatalog) { assert.ok(i.installedRange.low<=i.installedRange.high); assert.ok(i.defaultSize.widthFt>=i.minSize.widthFt && i.defaultSize.widthFt<=i.maxSize.widthFt); assert.deepEqual(priceAtSize(i.priceModel,i.defaultSize),i.installedRange); }
});
test("adding features permits an over-budget exploration and creates linked priced scope", () => {
 const p=base(); const next=add(p,"pool"); const e=next.elements.at(-1)!;
 assert.equal(p.version,1); assert.equal(next.version,2); assert.equal(next.estimatedTotal,106000); assert.equal(budgetSummary(next).status,"over");
 assert.ok(next.scopeItems.some(s=>s.elementId===e.id && e.scopeItemIds.includes(s.id))); assert.equal(next.scene.renderUrl,null);
});
test("resizing lowers range and scope cost; moving does not change price or silently repair placement", () => {
 const p=add(base(),"putting_green"); const e=p.elements.at(-1)!;
 const smaller=applyLayoutPatch(p,{summary:"Shrink green",operations:[{action:"update",elementId:e.id,position:null,dimensions:{widthFt:8,depthFt:10}}]},canonicalSiteContext);
 assert.ok(smaller.estimatedTotal<p.estimatedTotal); assert.ok(budgetSummary(smaller).range.high<budgetSummary(p).range.high);
 const moved=applyLayoutPatch(smaller,{summary:"Move green",operations:[{action:"update",elementId:e.id,position:{x:-4,y:60},dimensions:null}]},canonicalSiteContext);
 assert.equal(moved.estimatedTotal,smaller.estimatedTotal); assert.deepEqual(moved.elements.at(-1)!.position,{x:-4,y:60}); assert.equal(moved.feasibility.status,"conflicts");
});
test("pool setback, tree, house and built overlap warnings use exact ProjectSpec geometry", () => {
 const p=base(); const rear=add(p,"pool",5,30); assert.ok(rear.feasibility.conflicts.some(c=>/10 ft rear setback/.test(c.explanation)));
 const tree=add(p,"pool",30,30); assert.ok(tree.feasibility.conflicts.some(c=>c.rule==="tree_protection"));
 const house=add(p,"kitchen",10,-2); assert.ok(house.feasibility.conflicts.some(c=>c.rule==="house_overlap"));
 const overlap=add(p,"pool",10,10); assert.ok(overlap.feasibility.conflicts.some(c=>c.rule==="element_overlap"));
 assert.equal(checkFeasibility(p,canonicalSiteContext,false).feasibility.status,"needs_verification");
});
test("protected edits and invalid dimensions fail atomically; removed feature loses its scope", () => {
 const p=base(); const before=JSON.stringify(p);
 assert.throws(()=>applyLayoutPatch(p,{summary:"Move tree",operations:[{action:"update",elementId:"tree",position:{x:0,y:0},dimensions:null}]},canonicalSiteContext),/protected/);
 assert.throws(()=>applyLayoutPatch(p,{summary:"Tiny patio",operations:[{action:"update",elementId:"patio",position:null,dimensions:{widthFt:1,depthFt:1}}]},canonicalSiteContext),/use width/); assert.equal(JSON.stringify(p),before);
 const added=add(p,"kitchen"); const e=added.elements.at(-1)!;
 assert.equal(added.scopeItems.filter(s=>s.elementId===e.id).length,3);
 const removed=applyLayoutPatch(added,{summary:"Remove kitchen",operations:[{action:"remove",elementId:e.id}]},canonicalSiteContext);
 assert.equal(removed.estimatedTotal,p.estimatedTotal); assert.ok(!removed.scopeItems.some(s=>s.elementId===e.id));
});
test("new scope still normalizes three bids and rejects a bid from before the edit", () => {
 const p=base(); const old=syntheticQuotes(p); const next=add(p,"kitchen");
 assert.throws(()=>normalizeQuotes(next,old),/revision/); const compared=normalizeQuotes(next,syntheticQuotes(next)); assert.equal(compared.length,3); assert.equal(compared[0].normalizedTotal,next.estimatedTotal);
});
test("manual layout invalidates a matching concept image and custom addresses have no fixture setbacks", () => {
 const p=base(); assert.ok(photorealPreview(p));
 const next=applyLayoutPatch(p,{summary:"Move dining",operations:[{action:"update",elementId:"dining",position:{x:11,y:13},dimensions:null}]},canonicalSiteContext);
 assert.equal(photorealPreview(next),null);
 const site=siteForAddress("123 Any Street, Austin, TX 78701",false); assert.equal(site.rearSetback.value,null); assert.equal(site.existingStructures.length,0);
});
test("strict Astra schemas exclude optional deterministic pricing metadata", () => {
 for (const [name,schema] of [["project",projectDraftSchema],["revision",revisionPatchSchema],["layout",layoutPatchSchema]] as const) assert.doesNotThrow(()=>zodTextFormat(schema,name));
});

test("budget advice fits the expanded $75K demo with real substitutions and preserved tree", async () => {
 const {budgetFitPatch}=await import("../lib/layout-assistant");
 const brief={...canonicalBrief,budget:75000};
 let p=fixtureProject(brief,fallbackConcepts(brief).concepts[1],canonicalSiteContext);
 p=add(add(add(p,"pool"),"putting_green"),"kitchen");
 const patch=budgetFitPatch(p,canonicalSiteContext,75000);
 const fitted=applyLayoutPatch(p,patch,canonicalSiteContext);
 assert.ok(budgetSummary(fitted).range.high<=75000,JSON.stringify(budgetSummary(fitted)));
 assert.deepEqual(fitted.elements.find(e=>e.kind==="tree"),p.elements.find(e=>e.kind==="tree"));
 assert.ok(!fitted.elements.some(e=>e.kind==="pool"));
 assert.ok(fitted.elements.some(e=>e.kind==="kitchen"));
 assert.equal(fitted.feasibility.conflicts.filter(c=>!c.resolved).length,0,JSON.stringify(fitted.feasibility.conflicts));
 assert.equal(normalizeQuotes(fitted,syntheticQuotes(fitted)).length,3);
});

test("regenerated concept is tied to geometry and constraints, not a stale image", async () => {
 const {visualSignature,currentConceptImage}=await import("../lib/visual-signature");
 const p=base();p.conceptVisual={imageUrl:"/generated/test.png",specSignature:visualSignature(p),model:"gpt-image-2",createdAt:"2026-09-10",source:"live",disclaimer:"Illustrative"};
 assert.equal(currentConceptImage(p),"/generated/test.png");
 assert.equal(currentConceptImage({...p,budgetMaximum:40000}),null);
 const changed=applyLayoutPatch(p,{summary:"Resize patio",operations:[{action:"update",elementId:"patio",position:null,dimensions:{widthFt:18,depthFt:14}}]},canonicalSiteContext);
 assert.equal(changed.conceptVisual,undefined);assert.equal(currentConceptImage(changed),null);
 const noop=applyLayoutPatch(p,{summary:"Already fits",operations:[]},canonicalSiteContext);assert.equal(noop.version,p.version);assert.equal(currentConceptImage(noop),"/generated/test.png");
});
test("budget advice never invents price discounts to satisfy an impossible cap", async () => {
 const {budgetFitPatch,layoutAdviceSchema}=await import("../lib/layout-assistant");
 const p=base(),snapshot=JSON.stringify(p);
 assert.throws(()=>budgetFitPatch(p,canonicalSiteContext,5000),/exceed/);assert.equal(JSON.stringify(p),snapshot);
 assert.doesNotThrow(()=>zodTextFormat(layoutAdviceSchema,"layout_advice"));
});

test("90 degree rotation preserves center and linear price; vertical fence resizing uses its length", () => {
 const p=add(base(),"fence",6,46),fence=p.elements.at(-1)!;
 const rotate=(project:typeof p,id=fence.id)=>applyLayoutPatch(project,{summary:"Rotate 90 degrees",operations:[{action:"rotate",elementId:id}]},canonicalSiteContext);
 const next=rotate(p),e=next.elements.at(-1)!;
 assert.deepEqual(e.size,{...fence.size,widthFt:1,depthFt:30});assert.equal(e.rotationDeg,90);
 assert.equal(e.position.x+e.size.widthFt/2,fence.position.x+fence.size.widthFt/2);
 assert.equal(e.position.y+e.size.depthFt/2,fence.position.y+fence.size.depthFt/2);
 assert.deepEqual(e.indicativeRange,fence.indicativeRange);assert.deepEqual(next.scopeItems,p.scopeItems);assert.equal(next.estimatedTotal,p.estimatedTotal);
 assert.ok(next.feasibility.conflicts.some(c=>c.elementId===e.id&&!c.resolved));assert.equal(next.version,p.version+1);
 const smaller=applyLayoutPatch(next,{summary:"Shorten vertical fence",operations:[{action:"update",elementId:e.id,position:null,dimensions:{widthFt:1,depthFt:20}}]},canonicalSiteContext);
 assert.ok(smaller.estimatedTotal<next.estimatedTotal);assert.equal(smaller.scopeItems.find(s=>s.elementId===e.id)!.quantity,20);
 const restored=rotate(rotate(rotate(next))).elements.at(-1)!;
 assert.deepEqual(restored.position,fence.position);assert.deepEqual(restored.size,fence.size);assert.equal(restored.rotationDeg,0);
 assert.throws(()=>rotate(p,"tree"),/protected/);
});
