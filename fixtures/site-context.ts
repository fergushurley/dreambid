import { siteContextSchema, type SiteContext, type SiteContextFact } from "@/types";

export const DEMO_ADDRESS = "24 Maple Lane, Montclair, NJ · demo property";
const date = "2026-09-10";
export function fixtureFact(value: SiteContextFact["value"], unit: string | null, note: string): SiteContextFact {
  return { value, unit, source: "DreamBid canonical site fixture", sourceType: "fixture", sourceUrl: null, retrievedAt: date, confidence: "low", status: "fixture", note };
}
export function unknownFact(note: string): SiteContextFact {
  return { value: null, unit: null, source: "Not verified", sourceType: "unavailable", sourceUrl: null, retrievedAt: date, confidence: "unknown", status: "unknown", note };
}
export const canonicalSiteContext = siteContextSchema.parse({
  id: "site-maple-demo", propertyAddress: DEMO_ADDRESS, isDemo: true,
  parcelIdentifier: unknownFact("Fictional demonstration address; no parcel record retrieved."),
  jurisdiction: fixtureFact("Montclair, NJ", null, "Illustrative location only; no municipal rule asserted."),
  zoningDistrict: unknownFact("Zoning district requires municipal verification."),
  lotWidth: fixtureFact(48, "ft", "Illustrative lot width."),
  lotDepth: fixtureFact(100, "ft", "Illustrative total depth; backyard depth is 58 ft."),
  lotArea: fixtureFact(4800, "sq ft", "Illustrative lot area."),
  houseFootprint: fixtureFact(1440, "sq ft", "Illustrative house footprint."),
  rearSetback: fixtureFact(10, "ft", "Demo rule for new kitchen/pergola structures; not Montclair zoning advice."),
  sideSetback: fixtureFact(5, "ft", "Demo rule for new kitchen/pergola structures; not an authoritative rule."),
  heightLimit: unknownFact("Verify structure height restrictions."),
  lotCoverageLimit: unknownFact("Verify existing and proposed impervious surface coverage."),
  accessoryStructureRules: fixtureFact("Keep new pergola and kitchen inside the illustrative building envelope.", null, "Deterministic demo rule."),
  easements: unknownFact("Survey and title review required."), historicStatus: unknownFact("Designation not checked."), coastalStatus: unknownFact("Flood and coastal status not checked."),
  yardDimensions: { widthFt: 48, depthFt: 58 }, aerialImages: [], documents: [],
  existingStructures: [
    { id: "house", kind: "house", label: "Existing home", position: { x: 5, y: -25 }, widthFt: 38, depthFt: 25, fact: fixtureFact("House", null, "Illustrative footprint.") },
    { id: "existing-patio", kind: "patio", label: "Existing patio", position: { x: 8, y: 5 }, widthFt: 18, depthFt: 14, fact: fixtureFact("Patio", null, "Illustrative existing hardscape.") },
  ],
  protectedTree: { position: { x: 38, y: 41 }, protectionRadiusFt: 7, fact: fixtureFact("Mature oak to retain", null, "Demo position; actual root protection requires an arborist.") },
  summary: "Illustrative 48 × 58 ft backyard. Mature oak retained. The 10 ft rear and 5 ft side rules are fixtures, not verified municipal requirements.",
});

export function siteForAddress(address: string, useDemoSite: boolean): SiteContext {
  if (useDemoSite && address === DEMO_ADDRESS) return structuredClone(canonicalSiteContext);
  const site = structuredClone(canonicalSiteContext);
  site.id = "site-unverified"; site.propertyAddress = address; site.isDemo = false;
  for (const key of ["parcelIdentifier", "jurisdiction", "zoningDistrict", "lotWidth", "lotDepth", "lotArea", "houseFootprint", "rearSetback", "sideSetback", "heightLimit", "lotCoverageLimit", "accessoryStructureRules", "easements", "historicStatus", "coastalStatus"] as const) {
    site[key] = unknownFact("No authoritative property data has been retrieved for this address.");
  }
  site.existingStructures = []; site.protectedTree = null;
  site.summary = "Property records unavailable. The 48 × 58 ft design canvas is an explicit working assumption; confirm dimensions, tree location, and rules before construction.";
  return site;
}
