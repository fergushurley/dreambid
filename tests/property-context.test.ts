import test from "node:test";
import assert from "node:assert/strict";
import { censusAddress, googleAddress, resolveSiteContext } from "../lib/property-context";
import { preparePropertyGrounding, siteForModel } from "../lib/property-grounding";
import { siteForStorage } from "../lib/property-storage";
import { signedPropertyImage, readPropertyImageToken, propertyImageUrl } from "../lib/property-source";
import { generateConceptVisual } from "../lib/concept-visual";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext, siteForAddress } from "../fixtures/site-context";
import { featuredConcepts } from "../fixtures/concepts";
import { fixtureProject } from "../lib/project";
import { matchingScene, sceneGeometryKey, layoutConceptImage } from "../lib/scene-preview";
import { checkFeasibility } from "../lib/feasibility";
import type { PropertyImage } from "../types/property";

const aerial: PropertyImage = { kind:"aerial", provider:"usgs", imageUrl:"", location:{lat:34,lng:-118}, rasterId:42, generationAllowed:true, capturedAt:"2022-05-18", source:"USDA NAIP via USGS", sourceUrl:"https://imagery.nationalmap.gov", retrievedAt:"2026-09-10", confidence:"low", note:"Approximate public imagery" };
const response = (value:unknown) => new Response(JSON.stringify(value), {headers:{"Content-Type":"application/json"}});

test("all three concept cards and selected editor retain identical geometry and matching Blender renders", () => {
  for (const concept of featuredConcepts(canonicalBrief).concepts) {
    const card = fixtureProject(canonicalBrief, concept, canonicalSiteContext);
    const selected = checkFeasibility(fixtureProject(canonicalBrief, concept, canonicalSiteContext), canonicalSiteContext, false);
    assert.equal(sceneGeometryKey(card), sceneGeometryKey(selected));
    assert.ok(matchingScene(card));
    assert.deepEqual(matchingScene(card), matchingScene(selected));
    assert.ok(layoutConceptImage(card)?.endsWith("-layout-finish.png"));
    assert.equal(layoutConceptImage(card),layoutConceptImage(selected));
    selected.elements.find(e=>e.kind==="patio")!.position.x+=1;
    assert.equal(layoutConceptImage(selected),null);
  }
});

test("imagery proxy rejects tampering and uses a fixed public imagery host", () => {
  const token = signedPropertyImage(aerial).split("token=")[1];
  const decoded = readPropertyImageToken(token);
  assert.deepEqual(decoded.location, aerial.location);
  assert.equal(propertyImageUrl(decoded).hostname,"imagery.nationalmap.gov");
  assert.throws(() => readPropertyImageToken(`x${token}`));
  assert.throws(() => readPropertyImageToken("missing"));
});

test("address failure and partial Google matches do not invent a verified location", async t => {
  t.mock.method(globalThis,"fetch", async () => response({result:{addressMatches:[]}}));
  assert.equal((await censusAddress("nonexistent US address")).status,"unavailable");
  const previous=process.env.GOOGLE_MAPS_API_KEY; process.env.GOOGLE_MAPS_API_KEY="test-only";
  t.after(() => {if(previous === undefined)delete process.env.GOOGLE_MAPS_API_KEY;else process.env.GOOGLE_MAPS_API_KEY=previous;});
  t.mock.method(globalThis,"fetch", async () => response({status:"OK",results:[{formatted_address:"Partial Street, US",partial_match:true,types:["street_address"],address_components:[{short_name:"US",types:["country"]},{short_name:"12",types:["street_number"]}],geometry:{location:{lat:34,lng:-118},location_type:"APPROXIMATE"}}]}));
  assert.equal((await googleAddress("12 Partial Street")).status,"partial");
});

test("public mode ignores the website-restricted key, resolves distinct addresses, and preserves unknown dimensions", async t => {
  const old=process.env.DREAMBID_PROPERTY_PROVIDER; process.env.DREAMBID_PROPERTY_PROVIDER="public";
  t.after(() => {if(old === undefined)delete process.env.DREAMBID_PROPERTY_PROVIDER;else process.env.DREAMBID_PROPERTY_PROVIDER=old;});
  t.mock.method(globalThis,"fetch", async (input:string|URL|Request) => {
    const url=new URL(input instanceof Request ? input.url : String(input));
    assert.notEqual(url.hostname,"maps.googleapis.com");
    if(url.hostname==="geocoding.geo.census.gov")return response({result:{addressMatches:[{matchedAddress:url.searchParams.get("address"),coordinates:{x:url.searchParams.get("address")!.startsWith("101")?-118:-122,y:34}}]}});
    return response({value:"80,90,100",catalogItems:{features:[{attributes:{OBJECTID:42,Category:1,acquisition_date:1652832000000}}]}});
  });
  const first=await resolveSiteContext("101 Unit Test Street, CA"), second=await resolveSiteContext("202 Unit Test Street, CA");
  assert.notDeepEqual(first.propertyContext?.resolution.location,second.propertyContext?.resolution.location);
  assert.notEqual(first.propertyContext?.images[0].imageUrl,second.propertyContext?.images[0].imageUrl);
  assert.equal(first.existingStructures.length,0); assert.equal(first.residence,undefined);
  assert.equal(first.propertyContext?.images[0].provider,"usgs");
  const maps={...first.propertyContext!,resolution:{...first.propertyContext!.resolution,provider:"google" as const,normalizedAddress:"GOOGLE-CONTENT"},images:[{...aerial,provider:"google" as const,source:"GOOGLE-CONTENT",generationAllowed:false},aerial]};
  const mixed={...first,propertyContext:maps};
  assert.ok(!JSON.stringify(siteForModel(mixed)).includes("GOOGLE-CONTENT"));
  assert.equal(siteForStorage(mixed).propertyContext,undefined);
  const photo={name:"my-yard.jpg",dataUrl:"data:image/jpeg;base64,AAAA"};
  const prepared=await preparePropertyGrounding(mixed,[photo]);
  assert.equal(prepared.grounding?.primary,"homeowner_photo");assert.deepEqual(prepared.photos,[photo]);
});

test("image edit receives the actual public aerial bytes and address, and returns serverless-safe imagery", async t => {
  const oldKey=process.env.OPENAI_API_KEY, oldVercel=process.env.VERCEL, oldDemo=process.env.DREAMBID_DEMO_MODE;
  process.env.OPENAI_API_KEY="unit-test-not-a-key";process.env.VERCEL="1";process.env.DREAMBID_DEMO_MODE="0";
  t.after(() => {for(const [key,value] of [["OPENAI_API_KEY",oldKey],["VERCEL",oldVercel],["DREAMBID_DEMO_MODE",oldDemo]]){if(value===undefined)delete process.env[key!];else process.env[key!]=value;}});
  const bytes=Buffer.alloc(1500,7);let received=false;
  t.mock.method(globalThis,"fetch",async(input: string|URL|Request,init?:RequestInit) => {
    const request=new Request(input,init);
    if(request.url.includes("imagery.nationalmap.gov"))return new Response(bytes,{headers:{"Content-Type":"image/jpeg"}});
    assert.ok(request.url.endsWith("/images/edits"));
    const form=await request.formData();const file=form.get("image[]") ?? form.get("image");
    assert.ok(file instanceof Blob);assert.deepEqual(Buffer.from(await file.arrayBuffer()),bytes);
    assert.match(String(form.get("prompt")),/303 Grounding Test/);assert.match(String(form.get("prompt")),/public_aerial/);
    received=true;return response({data:[{b64_json:Buffer.alloc(1800,9).toString("base64")} ]});
  });
  const brief={...canonicalBrief,propertyAddress:"303 Grounding Test, CA",useDemoSite:false};
  const site=siteForAddress(brief.propertyAddress,false);
  site.propertyContext={resolution:{status:"matched",provider:"census",normalizedAddress:brief.propertyAddress,location:aerial.location,accuracy:"street-range interpolation",sourceUrl:aerial.sourceUrl,retrievedAt:aerial.retrievedAt,note:"Not surveyed"},images:[aerial],streetViewStatus:"not_configured",warnings:[]};
  const project=fixtureProject(brief,featuredConcepts(brief).concepts[0],site);
  const result=await generateConceptVisual(project,site,[],false);
  assert.equal(received,true);assert.equal(result.mode,"live");assert.match(result.visual!.imageUrl,/^data:image\/jpeg;base64,/);assert.equal(result.visual?.grounding?.primary,"public_aerial");
});
