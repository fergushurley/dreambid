import { createHash } from "node:crypto";
import { z } from "zod";
import { siteForAddress } from "@/fixtures/site-context";
import { type SiteContext } from "@/types";
import { propertyContextSchema, locationSchema, type PropertyResolution, type PropertyImage, type PropertyContext } from "@/types/property";
import { NAIP_URL, signedPropertyImage } from "./property-source";
const CENSUS="https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
const GOOGLE="https://maps.googleapis.com/maps/api";
const stamp=()=>new Date().toISOString();
const unavailable=(provider:PropertyResolution["provider"],note:string):PropertyResolution=>({status:"unavailable",provider,normalizedAddress:null,location:null,accuracy:"unknown",sourceUrl:provider==="google"?"https://developers.google.com/maps/documentation/geocoding":CENSUS,retrievedAt:stamp(),note});
async function json(url:URL){const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("Property service unavailable.");return response.json();}
export async function censusAddress(address:string):Promise<PropertyResolution>{
 if(address.length>100)return unavailable("census","Please shorten the address to street, city, state and ZIP.");
 try{
  const url=new URL(CENSUS);url.search=new URLSearchParams({address,benchmark:"Public_AR_Current",format:"json"}).toString();
  const data=z.object({result:z.object({addressMatches:z.array(z.object({matchedAddress:z.string(),coordinates:z.object({x:z.number(),y:z.number()})}))})}).parse(await json(url));
  if(data.result.addressMatches.length!==1)return unavailable("census",data.result.addressMatches.length?"Multiple address matches; add the ZIP code to identify the property.":"No Census address match. Check the address or continue with your photos.");
  const match=data.result.addressMatches[0];return {status:"matched",provider:"census",normalizedAddress:match.matchedAddress,location:locationSchema.parse({lat:match.coordinates.y,lng:match.coordinates.x}),accuracy:"street-range interpolation",sourceUrl:CENSUS,retrievedAt:stamp(),note:"Census address-range match; the point may lie on the street rather than the roof. Not postal deliverability, residential-use verification or a parcel boundary."};
 }catch{return unavailable("census","Census lookup did not complete. Your photos and project remain usable.");}
}
export async function googleAddress(address:string):Promise<PropertyResolution>{
 const key=process.env.GOOGLE_MAPS_API_KEY;if(!key)return unavailable("google","Google Maps key is not configured.");
 try{
  const url=new URL(`${GOOGLE}/geocode/json`);url.search=new URLSearchParams({address,components:"country:US",key}).toString();
  const data=z.object({status:z.string(),results:z.array(z.object({formatted_address:z.string(),partial_match:z.boolean().optional(),types:z.array(z.string()),address_components:z.array(z.object({short_name:z.string(),types:z.array(z.string())})),geometry:z.object({location:locationSchema,location_type:z.string()})})).default([])}).parse(await json(url));
  if(data.status!=="OK")return unavailable("google",data.status==="ZERO_RESULTS"?"No U.S. address match.":"Google lookup unavailable; check enabled APIs, restrictions and quota.");
  const match=data.results.find(r=>r.address_components.some(c=>c.types.includes("country")&&c.short_name==="US")&&r.address_components.some(c=>c.types.includes("street_number")));
  if(!match)return unavailable("google","Enter a complete U.S. street address; a city or region is not enough.");
  return {status:match.partial_match?"partial":"matched",provider:"google",normalizedAddress:match.formatted_address,location:match.geometry.location,accuracy:match.geometry.location_type,sourceUrl:"https://developers.google.com/maps/documentation/geocoding",retrievedAt:stamp(),note:match.partial_match?"Google returned a partial match; check the normalized address before using this location.":"Google address match. Residential use, ownership, lot boundaries and postal deliverability are not verified."};
 }catch{return unavailable("google","Google lookup did not complete. Continuing with available public context.");}
}
async function googleImages(resolution:PropertyResolution):Promise<{images:PropertyImage[];status:PropertyContext["streetViewStatus"]}>{
 const key=process.env.GOOGLE_MAPS_API_KEY,location=resolution.location;if(!key||!location||resolution.status!=="matched")return {images:[],status:key?"unavailable":"not_configured"};
 const common={provider:"google" as const,location,generationAllowed:false,retrievedAt:stamp(),confidence:"low" as const};
 const map:Omit<PropertyImage,"imageUrl">={...common,kind:"satellite",source:"Google Maps satellite context",sourceUrl:"https://maps.google.com",capturedAt:null,note:"Google Maps imagery; capture date unavailable. Context only, not parcel boundaries or survey geometry."};
 const images:PropertyImage[]=[{...map,imageUrl:signedPropertyImage(map)}];
 try{
  const url=new URL(`${GOOGLE}/streetview/metadata`);url.search=new URLSearchParams({location:`${location.lat},${location.lng}`,radius:"50",source:"outdoor",key}).toString();
  const data=z.object({status:z.string(),pano_id:z.string().optional(),date:z.string().optional(),location:locationSchema.optional()}).parse(await json(url));
  if(data.status!=="OK"||!data.pano_id||!data.location)return {images,status:data.status==="ZERO_RESULTS"?"unavailable":"failed"};
  const from=data.location,rad=Math.PI/180,dy=Math.sin((location.lng-from.lng)*rad)*Math.cos(location.lat*rad),dx=Math.cos(from.lat*rad)*Math.sin(location.lat*rad)-Math.sin(from.lat*rad)*Math.cos(location.lat*rad)*Math.cos((location.lng-from.lng)*rad);
  const image:Omit<PropertyImage,"imageUrl">={...common,kind:"street_view",panoramaId:data.pano_id,heading:(Math.atan2(dy,dx)/rad+360)%360,source:"Google Street View",sourceUrl:"https://maps.google.com",capturedAt:data.date??null,note:"Nearest available outdoor street panorama aimed toward the address point. May show neighboring homes; not a current backyard photo."};
  images.unshift({...image,imageUrl:signedPropertyImage(image)});return {images,status:"available"};
 }catch{return {images,status:"failed"};}
}
export async function publicAerial(resolution:PropertyResolution):Promise<PropertyImage|null>{
 const location=resolution.location;if(resolution.provider!=="census"||!location||resolution.status!=="matched")return null;
 // This public-domain service covers the contiguous U.S.; no imagery is invented outside coverage.
 if(location.lat<24||location.lat>50||location.lng< -125||location.lng> -66)return null;
 try{
  const url=new URL(`${NAIP_URL}/identify`);url.search=new URLSearchParams({geometry:JSON.stringify({x:location.lng,y:location.lat,spatialReference:{wkid:4326}}),geometryType:"esriGeometryPoint",returnCatalogItems:"true",returnGeometry:"false",f:"json"}).toString();
  const data=z.object({value:z.string().optional(),catalogItems:z.object({features:z.array(z.object({attributes:z.object({OBJECTID:z.number(),Category:z.number().optional(),acquisition_date:z.number().nullable().optional(),Year:z.number().nullable().optional()})}))}).optional()}).parse(await json(url));
  if(!data.value||/NoData/i.test(data.value))return null;
  const raster=data.catalogItems?.features.find(f=>f.attributes.Category===1)?.attributes;if(!raster)return null;
  const image:Omit<PropertyImage,"imageUrl">={kind:"aerial",provider:"usgs",location,rasterId:raster.OBJECTID,generationAllowed:true,capturedAt:raster.acquisition_date?new Date(raster.acquisition_date).toISOString().slice(0,10):raster.Year?String(raster.Year):null,source:"USDA NAIP aerial imagery via USGS",sourceUrl:NAIP_URL,retrievedAt:stamp(),confidence:"low",note:"Public-domain aerial photograph; 140 m neighborhood view centered on an approximate Census address point. May include multiple properties. No lot lines or survey measurements inferred."};
  return {...image,imageUrl:signedPropertyImage(image)};
 }catch{return null;}
}
const publicCache=new Map<string,{expires:number;site:SiteContext}>();
const pending=new Map<string,Promise<SiteContext>>();
export async function resolveSiteContext(address:string,useDemo=false,forceDemo=false):Promise<SiteContext>{
 const site=siteForAddress(address,useDemo);if(site.isDemo||forceDemo)return site;
 const googleEnabled=process.env.DREAMBID_PROPERTY_PROVIDER==="google" && !!process.env.GOOGLE_MAPS_API_KEY;
 const key=createHash("sha256").update(address.trim().toLowerCase()).digest("hex");
 const cached=publicCache.get(key);if(!googleEnabled&&cached&&cached.expires>Date.now())return structuredClone(cached.site);
 const running=pending.get(key);if(running)return structuredClone(await running);
 const task=(async()=>{
  // Public geocoding independently grounds public imagery; Google-derived coordinates never feed the non-Google aerial service.
  const [google,census]=await Promise.all([googleEnabled?googleAddress(address):Promise.resolve(null),censusAddress(address)]);
  const resolution=google?.status==="matched"?google:census;
  const [maps,aerial]=await Promise.all([google?googleImages(google):Promise.resolve({images:[] as PropertyImage[],status:"not_configured" as const}),publicAerial(census)]);
  const warnings=[resolution.note];if(google?.status==="unavailable")warnings.push(google.note);if(!aerial)warnings.push("Public aerial imagery unavailable for this location. Upload a backyard photo for visual grounding.");if(maps.status==="unavailable"||maps.status==="failed")warnings.push("Street View is unavailable. Other context remains usable.");
  site.propertyContext=propertyContextSchema.parse({resolution,publicResolution:census,images:[...maps.images,...(aerial?[aerial]:[])],streetViewStatus:maps.status,warnings});
  site.summary=resolution.location?`Address-specific context retrieved for ${address}. House footprint, yard dimensions, setbacks and protected trees remain unverified. The layout canvas is an explicit assumption; uploaded photos are the strongest visual reference.`:`No live address match. Continue with homeowner photos; geometry remains an explicit working assumption.`;
  if(!googleEnabled){if(publicCache.size>=100)publicCache.delete(publicCache.keys().next().value!);publicCache.set(key,{site:structuredClone(site),expires:Date.now()+5*60*1000});}
  return site;
 })().finally(()=>pending.delete(key));pending.set(key,task);return structuredClone(await task);
}
