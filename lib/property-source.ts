import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { propertyImageSchema, type PropertyImage } from "@/types/property";
export const NAIP_URL="https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer";
// Ephemeral signed URLs allow only imagery chosen by our lookup, never arbitrary remote URLs.
const signingKey=process.env.PROPERTY_CONTEXT_SIGNING_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.OPENAI_API_KEY || randomBytes(32).toString("hex");
export function signedPropertyImage(image:Omit<PropertyImage,"imageUrl">):string {
 const payload=Buffer.from(JSON.stringify({image,expires:Date.now()+60*60*1000})).toString("base64url");
 const signature=createHmac("sha256",signingKey).update(payload).digest("base64url");
 return `/api/property-image?token=${payload}.${signature}`;
}
export function readPropertyImageToken(token:string):PropertyImage {
 if(token.length>12000)throw new Error("Invalid image request.");
 const [payload,signature]=token.split(".");if(!payload||!signature)throw new Error("Invalid image request.");
 const expected=createHmac("sha256",signingKey).update(payload).digest(),actual=Buffer.from(signature,"base64url");
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new Error("Invalid image request.");
 const parsed=z.object({image:propertyImageSchema.omit({imageUrl:true}),expires:z.number()}).parse(JSON.parse(Buffer.from(payload,"base64url").toString()));
 if(parsed.expires<Date.now())throw new Error("Property image expired. Look up the property again.");
 return {...parsed.image,imageUrl:""};
}
export function propertyImageUrl(image:PropertyImage):URL {
 const {lat,lng}=image.location;
 if(image.provider==="usgs"&&image.kind==="aerial") {
  const dy=70/111320,dx=dy/Math.cos(lat*Math.PI/180),url=new URL(`${NAIP_URL}/exportImage`);
  url.search=new URLSearchParams({bbox:[lng-dx,lat-dy,lng+dx,lat+dy].join(","),bboxSR:"4326",imageSR:"3857",size:"800,800",format:"jpg",f:"image",...(image.rasterId?{mosaicRule:JSON.stringify({mosaicMethod:"esriMosaicLockRaster",lockRasterIds:[image.rasterId]})}:{})}).toString();return url;
 }
 const key=process.env.GOOGLE_MAPS_API_KEY;if(!key)throw new Error("Google Maps is not configured.");
 if(image.provider!=="google")throw new Error("Unsupported image provider.");
 const url=new URL(image.kind==="street_view"?"https://maps.googleapis.com/maps/api/streetview":"https://maps.googleapis.com/maps/api/staticmap");
 url.search=new URLSearchParams(image.kind==="street_view"?{pano:image.panoramaId||"",size:"640x420",fov:"80",heading:String(image.heading??0),pitch:"5",return_error_code:"true",key}:{center:`${lat},${lng}`,zoom:"20",size:"640x420",scale:"2",maptype:"satellite",markers:`color:red|${lat},${lng}`,key}).toString();return url;
}
export async function fetchPropertyImage(image:PropertyImage):Promise<{bytes:Buffer;contentType:string}> {
 const response=await fetch(propertyImageUrl(image),{cache:"no-store",signal:AbortSignal.timeout(18000)});
 if(!response.ok)throw new Error("Property imagery is unavailable.");
 const contentType=response.headers.get("content-type")??"";if(!/^image\/(jpeg|png)/.test(contentType))throw new Error("The imagery provider returned no image.");
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<1000||bytes.length>6000000)throw new Error("Property imagery is unavailable.");
 return {bytes,contentType:contentType.split(";")[0]};
}
