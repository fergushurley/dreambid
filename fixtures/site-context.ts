import { siteContextSchema, type SiteContext, type SiteContextFact } from "@/types";

export const DEMO_ADDRESS = "24 Maple Lane, Montclair, NJ · demo property";
export const DEMO_RESIDENCE_VERSION = "two-story-2000-v1";
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
  houseFootprint: fixtureFact(1000, "sq ft", "40 × 25 ft footprint; two equal floors total 2,000 sq ft. User-specified fictional demo home."),
  residence: {
    floorArea: fixtureFact(2000, "sq ft", "Total across two floors, not the footprint. User-specified demo home; no property record retrieved."),
    stories: fixtureFact(2, "stories", "Two full floors, each 1,000 sq ft; illustrative geometry."),
    yearBuilt: fixtureFact(2000, null, "User-specified year for the fictional demo residence; not a verified construction record."),
    appearance: fixtureFact("Off-white horizontal lap siding, white trim, charcoal asphalt-shingle gable roof, two ground-floor patio sliders and four upstairs rear windows.", null, "Illustrative year-2000 suburban house character. Eaves 20 ft and ridge 25 ft are modeling assumptions."),
  },
  accessZones: [
    { id: "patio-door-left", label: "Left patio door", position: { x: 10.8, y: 0 }, size: { widthFt: 8, depthFt: 4 }, fact: fixtureFact("Keep door landing clear", null, "Illustrative 4 ft clear landing across the modeled 8 ft sliding door. Not an egress-code assessment; verify on site.") },
    { id: "patio-door-right", label: "Right patio door", position: { x: 28, y: 0 }, size: { widthFt: 8, depthFt: 4 }, fact: fixtureFact("Keep door landing clear", null, "Illustrative 4 ft clear landing across the modeled 8 ft sliding door. Verify actual doors, circulation and appliance clearances.") },
  ],
  rearSetback: fixtureFact(10, "ft", "Illustrative envelope for setback-relevant catalog features, including pools and structures; actual feature-specific rules are unverified."),
  sideSetback: fixtureFact(5, "ft", "Illustrative envelope for setback-relevant catalog features; not an authoritative rule."),
  heightLimit: unknownFact("Verify structure height restrictions."),
  lotCoverageLimit: unknownFact("Verify existing and proposed impervious surface coverage."),
  accessoryStructureRules: fixtureFact("Keep new pergola and kitchen inside the illustrative building envelope.", null, "Deterministic demo rule."),
  easements: unknownFact("Survey and title review required."), historicStatus: unknownFact("Designation not checked."), coastalStatus: unknownFact("Flood and coastal status not checked."),
  yardDimensions: { widthFt: 48, depthFt: 58 }, aerialImages: [], documents: [],
  existingStructures: [
    { id: "house", kind: "house", label: "Existing home", position: { x: 4, y: -25 }, widthFt: 40, depthFt: 25, fact: fixtureFact("Two-story home · built 2000", null, "1,000 sq ft footprint; 2,000 sq ft total across two floors. Fictional demo residence.") },
    { id: "existing-patio", kind: "patio", label: "Existing patio", position: { x: 8, y: 5 }, widthFt: 18, depthFt: 14, fact: fixtureFact("Patio", null, "Illustrative existing hardscape.") },
  ],
  protectedTree: { position: { x: 38, y: 41 }, protectionRadiusFt: 7, fact: fixtureFact("Mature oak to retain", null, "Demo position; actual root protection requires an arborist.") },
  summary: "Fictional 2,000 sq ft, two-story home built in 2000, with a 40 × 25 ft footprint and 48 × 58 ft backyard. Mature oak retained. The 10 ft rear and 5 ft side rules are fixtures, not verified municipal requirements.",
});

export function siteForAddress(address: string, useDemoSite: boolean): SiteContext {
  if (useDemoSite && address === DEMO_ADDRESS) return structuredClone(canonicalSiteContext);
  const site = structuredClone(canonicalSiteContext);
  site.id = "site-unverified"; site.propertyAddress = address; site.isDemo = false;
  for (const key of ["parcelIdentifier", "jurisdiction", "zoningDistrict", "lotWidth", "lotDepth", "lotArea", "houseFootprint", "rearSetback", "sideSetback", "heightLimit", "lotCoverageLimit", "accessoryStructureRules", "easements", "historicStatus", "coastalStatus"] as const) {
    site[key] = unknownFact("No authoritative property data has been retrieved for this address.");
  }
  delete site.residence;
  delete site.accessZones;
  site.existingStructures = []; site.protectedTree = null;
  site.summary = "Property records unavailable. The 48 × 58 ft design canvas is an explicit working assumption; confirm dimensions, tree location, and rules before construction.";
  return site;
}
