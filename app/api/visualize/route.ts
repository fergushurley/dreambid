import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSpecSchema, projectBriefSchema } from "@/types";
import { readBody,apiError } from "@/lib/http";
import { resolveSiteContext } from "@/lib/property-context";
import { generateConceptVisual } from "@/lib/concept-visual";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(request:Request){try{
 const {project,photos,demoMode}=await readBody(request,z.object({project:projectSpecSchema,photos:projectBriefSchema.shape.photos.default([]),demoMode:z.boolean()}));
 const site=await resolveSiteContext(project.propertyAddress,project.siteContextId==="site-maple-demo",demoMode);
 return NextResponse.json(await generateConceptVisual(project,site,photos,demoMode));
}catch(error){return apiError(error);}}
