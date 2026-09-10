import { readPropertyImageToken,fetchPropertyImage } from "@/lib/property-source";
export const runtime="nodejs";
export async function GET(request:Request){try{
 const image=readPropertyImageToken(new URL(request.url).searchParams.get("token")??"");
 const {bytes,contentType}=await fetchPropertyImage(image);
 return new Response(new Uint8Array(bytes),{headers:{"Content-Type":contentType,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}catch{return new Response("Property image unavailable. Look up the property again.",{status:404,headers:{"Cache-Control":"no-store"}});}}
