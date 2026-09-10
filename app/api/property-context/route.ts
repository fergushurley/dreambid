import { NextResponse } from "next/server";
import { z } from "zod";
import { readBody,apiError } from "@/lib/http";
import { resolveSiteContext } from "@/lib/property-context";
export const runtime="nodejs";
export async function POST(request:Request){try{
 const {address,useDemo,demoMode}=await readBody(request,z.object({address:z.string().trim().min(5).max(250),useDemo:z.boolean().default(false),demoMode:z.boolean().default(false)}));
 return NextResponse.json({site:await resolveSiteContext(address,useDemo,demoMode)},{headers:{"Cache-Control":"no-store"}});
}catch(error){return apiError(error);}}
