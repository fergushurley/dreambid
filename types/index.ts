import { z } from "zod";

const money = z.number().finite().nonnegative().max(10000000);
const shortText = z.string().min(1).max(2000);
export const factStatusSchema = z.enum(["authoritative", "government_record", "inferred", "approximate", "assumption", "fixture", "unknown"]);
export const siteContextFactSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]).nullable(),
  unit: z.string().nullable(),
  source: shortText,
  sourceType: z.enum(["municipal_zoning_code", "government_record", "survey", "aerial", "photo", "user", "model", "fixture", "unavailable"]),
  sourceUrl: z.string().nullable(),
  retrievedAt: z.string(),
  confidence: z.enum(["high", "medium", "low", "unknown"]),
  status: factStatusSchema,
  note: z.string(),
});
export type SiteContextFact = z.infer<typeof siteContextFactSchema>;

export const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
// A bounded backyard canvas keeps placement search and primitive rendering tractable.
export const dimensionsSchema = z.object({ widthFt: z.number().positive().max(200), depthFt: z.number().positive().max(200) });
export const siteContextSchema = z.object({
  id: shortText, propertyAddress: shortText, isDemo: z.boolean(),
  parcelIdentifier: siteContextFactSchema, jurisdiction: siteContextFactSchema,
  zoningDistrict: siteContextFactSchema, lotWidth: siteContextFactSchema, lotDepth: siteContextFactSchema,
  lotArea: siteContextFactSchema, houseFootprint: siteContextFactSchema,
  rearSetback: siteContextFactSchema, sideSetback: siteContextFactSchema,
  heightLimit: siteContextFactSchema, lotCoverageLimit: siteContextFactSchema,
  accessoryStructureRules: siteContextFactSchema,
  easements: siteContextFactSchema, historicStatus: siteContextFactSchema, coastalStatus: siteContextFactSchema,
  yardDimensions: dimensionsSchema,
  aerialImages: z.array(z.object({ url: z.string(), label: z.string(), fact: siteContextFactSchema })),
  documents: z.array(z.object({ title: z.string(), url: z.string(), fact: siteContextFactSchema })),
  existingStructures: z.array(z.object({ id: shortText, kind: z.string(), label: z.string(), position: pointSchema, widthFt: z.number(), depthFt: z.number(), fact: siteContextFactSchema })),
  protectedTree: z.object({ position: pointSchema, protectionRadiusFt: z.number().positive(), fact: siteContextFactSchema }).nullable(),
  summary: z.string(),
});
export type SiteContext = z.infer<typeof siteContextSchema>;

export const projectBriefSchema = z.object({
  propertyAddress: z.string().min(3).max(250),
  description: z.string().min(10).max(4000),
  budget: money.positive(),
  photos: z.array(z.object({ name: z.string().max(200), dataUrl: z.string().max(5600000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/) })).max(3),
  useDemoSite: z.boolean(),
});
export type ProjectBrief = z.infer<typeof projectBriefSchema>;

export const projectElementSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(["patio", "tree", "dining", "pergola", "planter", "kitchen", "lighting", "lounge", "path"]),
  label: shortText, position: pointSchema,
  size: dimensionsSchema.extend({ heightFt: z.number().positive().max(100) }),
  material: z.string().max(200), color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  estimatedCost: money, preserved: z.boolean(),
  scopeItemIds: z.array(z.string()).max(30),
});
export type ProjectElement = z.infer<typeof projectElementSchema>;
export const scopeItemSchema = z.object({
  id: z.string().min(1).max(80), elementId: z.string().nullable(),
  category: shortText, description: shortText,
  quantity: z.number().nonnegative(), unit: z.string(), estimatedCost: money,
  required: z.boolean(), acceptanceCriteria: z.string(),
});
export type ScopeItem = z.infer<typeof scopeItemSchema>;

export const feasibilityCheckSchema = z.object({
  status: z.enum(["preliminary", "conflicts", "needs_verification"]),
  likelyCompliant: z.array(z.string()),
  conflicts: z.array(z.object({ elementId: z.string(), rule: z.string(), explanation: z.string(), resolved: z.boolean(), before: pointSchema.nullable(), after: pointSchema.nullable() })),
  unknowns: z.array(z.string()), nextChecks: z.array(z.string()), assumptions: z.array(z.string()),
  checkedAt: z.string(), disclaimer: z.string(),
});
export type FeasibilityCheck = z.infer<typeof feasibilityCheckSchema>;

export const renovationConceptSchema = z.object({
  id: z.string(), title: shortText, designDirection: shortText,
  budgetRange: z.object({ low: money, high: money }),
  majorElements: z.array(z.string()).min(3).max(8),
  feasibilityNotes: z.array(z.string()), rationale: shortText,
  recommended: z.boolean(), palette: z.enum(["meadow", "terrace", "retreat"]),
});
export type RenovationConcept = z.infer<typeof renovationConceptSchema>;
export const conceptsResponseSchema = z.object({ analysis: z.string(), concepts: z.array(renovationConceptSchema).length(3) });

export const projectSpecSchema = z.object({
  id: z.string(), version: z.number().int().positive(), title: shortText,
  conceptId: z.string(), siteContextId: z.string(), propertyAddress: z.string(),
  homeownerGoals: z.array(z.string()),
  hardConstraints: z.array(z.string()), softConstraints: z.array(z.string()),
  budgetTarget: money, budgetMaximum: money,
  estimatedTotal: money, spaceType: z.literal("backyard"), dimensions: dimensionsSchema,
  elements: z.array(projectElementSchema).min(1).max(40),
  scopeItems: z.array(scopeItemSchema).min(1).max(80), assumptions: z.array(z.string()),
  revisionHistory: z.array(z.object({ version: z.number().int(), instruction: z.string(), summary: z.string(), changes: z.array(z.string()), preserved: z.array(z.string()), createdAt: z.string() })),
  scene: z.object({ units: z.literal("feet"), camera: z.literal("isometric"), renderUrl: z.string().nullable(), blendFile: z.string().nullable(), renderer: z.enum(["pending", "blender", "fallback"]) }),
  feasibility: feasibilityCheckSchema,
});
export type ProjectSpec = z.infer<typeof projectSpecSchema>;

export const quoteLineItemSchema = z.object({ scopeItemId: z.string(), description: z.string(), amount: money, status: z.enum(["included", "excluded", "allowance"]) });
export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>;
export const contractorQuoteSchema = z.object({
  id: z.string(), projectId: z.string(), projectVersion: z.number().int(),
  contractorName: z.string(), synthetic: z.literal(true),
  headlineTotal: money, lineItems: z.array(quoteLineItemSchema), exclusions: z.array(z.string()),
  allowances: z.array(z.object({ scopeItemId: z.string(), description: z.string(), amount: money })),
  timelineWeeks: z.number().positive(), warrantyYears: z.number().nonnegative(), paymentTerms: z.string(),
});
export type ContractorQuote = z.infer<typeof contractorQuoteSchema>;
export const normalizedQuoteSchema = z.object({
  quoteId: z.string(), contractorName: z.string(), headlineTotal: money,
  adjustments: z.array(z.object({ scopeItemId: z.string(), reason: z.string(), amount: money, kind: z.enum(["exclusion", "missing_scope", "allowance"]) })),
  normalizedTotal: money, missingScope: z.array(z.string()), exclusionsDetected: z.array(z.string()),
  uncertainty: z.string(), rank: z.number().int().min(1).max(3), rationale: z.string(),
});
export type NormalizedQuote = z.infer<typeof normalizedQuoteSchema>;
export const quoteRecommendationSchema = z.object({
  recommendedQuoteId: z.string(), explanation: z.string(),
  quotes: z.array(normalizedQuoteSchema).length(3),
  negotiationQuestions: z.array(z.string()),
});
export type QuoteRecommendation = z.infer<typeof quoteRecommendationSchema>;

export type EngineMeta = { mode: "live" | "fallback" | "demo"; model: string; reason: string | null; responseId: string | null; durationMs: number };
export type EngineResult<T> = { data: T; meta: EngineMeta };
