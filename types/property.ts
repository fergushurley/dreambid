import { z } from "zod";
export const locationSchema=z.object({lat:z.number().min(-90).max(90),lng:z.number().min(-180).max(180)});
export const propertyResolutionSchema=z.object({
 status:z.enum(["matched","partial","unavailable"]),provider:z.enum(["google","census","none"]),
 normalizedAddress:z.string().nullable(),location:locationSchema.nullable(),accuracy:z.string(),
 sourceUrl:z.string(),retrievedAt:z.string(),note:z.string(),
});
export const propertyImageSchema=z.object({
 kind:z.enum(["street_view","satellite","aerial"]),provider:z.enum(["google","usgs"]),imageUrl:z.string(),
 capturedAt:z.string().nullable(),source:z.string(),sourceUrl:z.string(),retrievedAt:z.string(),
 confidence:z.enum(["medium","low"]),note:z.string(),generationAllowed:z.boolean(),
 location:locationSchema,panoramaId:z.string().optional(),heading:z.number().optional(),rasterId:z.number().optional(),
});
export const propertyContextSchema=z.object({
 resolution:propertyResolutionSchema,publicResolution:propertyResolutionSchema.optional(),
 images:z.array(propertyImageSchema),streetViewStatus:z.enum(["available","unavailable","not_configured","failed"]),
 warnings:z.array(z.string()),
});
export type PropertyContext=z.infer<typeof propertyContextSchema>;
export type PropertyImage=z.infer<typeof propertyImageSchema>;
export type PropertyResolution=z.infer<typeof propertyResolutionSchema>;
