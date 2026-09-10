import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext, siteForAddress } from "../fixtures/site-context";
import { featuredConcepts } from "../fixtures/concepts";
import { fixtureProject } from "../lib/project";
import { checkFeasibility } from "../lib/feasibility";
import { restoreProject } from "../lib/restore-project";
import { visualSignature } from "../lib/visual-signature";
import { matchingScene } from "../lib/scene-preview";
const project=()=>fixtureProject(canonicalBrief,featuredConcepts(canonicalBrief).concepts[1],canonicalSiteContext);
test("residence floor area matches modeled footprint and stays isolated from unknown addresses",()=>{
 const house=canonicalSiteContext.existingStructures.find(e=>e.kind==="house")!;
 assert.equal(house.widthFt*house.depthFt,canonicalSiteContext.houseFootprint.value);
 assert.equal(house.widthFt*house.depthFt*Number(canonicalSiteContext.residence?.stories.value),2000);
 assert.equal(canonicalSiteContext.residence?.yearBuilt.value,2000);
 const unknown=siteForAddress("123 Other St, CA",false);assert.equal(unknown.residence,undefined);assert.equal(unknown.accessZones,undefined);
});
test("door landings reject a blocking kitchen while allowing walking surfaces",()=>{
 const p=project(),kitchen=p.elements.find(e=>e.kind==="kitchen")!;
 kitchen.position={x:11,y:1};
 assert.ok(checkFeasibility(p,canonicalSiteContext,false).feasibility.conflicts.some(c=>c.elementId===kitchen.id&&c.rule==="door_clearance"));
 kitchen.position={x:20,y:23};
 assert.ok(!checkFeasibility(p,canonicalSiteContext,false).feasibility.conflicts.some(c=>c.rule==="door_clearance"));
 const surface=p.elements.find(e=>e.kind==="patio")!;surface.position={x:11,y:0};
 assert.ok(!checkFeasibility(p,canonicalSiteContext,false).feasibility.conflicts.some(c=>c.elementId===surface.id&&c.rule==="door_clearance"));
});
test("resuming an old demo refreshes house context without changing edited scope",()=>{
 const p=project();p.elements.find(e=>e.kind==="kitchen")!.position={x:22,y:23};p.scene={units:"feet",camera:"isometric",renderer:"blender",renderUrl:"/old.png",blendFile:null};
 const oldSite=structuredClone(canonicalSiteContext);delete oldSite.residence;delete oldSite.accessZones;oldSite.existingStructures[0].widthFt=38;
 const result=restoreProject({project:p,site:oldSite,brief:canonicalBrief});
 assert.deepEqual(result.project.elements,p.elements);assert.deepEqual(result.project.scopeItems,p.scopeItems);assert.equal(result.project.scene.renderer,"pending");assert.equal(result.site.residence?.stories.value,2);
});
test("a moved layout never displays its previous scene",()=>{
 const p=project();p.scene={units:"feet",camera:"perspective",renderer:"blender",quality:"max",renderUrl:"/current.png",blendFile:null,specSignature:visualSignature(p)};
 assert.equal(matchingScene(p)?.imageUrl,"/current.png");
 p.elements.find(e=>e.kind==="kitchen")!.position.x+=1;assert.equal(matchingScene(p),null);
});
