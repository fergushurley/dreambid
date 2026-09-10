import { featureCatalogItemSchema, type FeatureCatalogItem } from "@/types";

type Category = FeatureCatalogItem["category"];
type Kind = FeatureCatalogItem["kind"];
/** Curated demonstration planning assumptions, USD installed. Not a price survey or a bid. */
function feature(id: Kind, name: string, category: Category, low: number, high: number, w: number, d: number, minW: number, minD: number, maxW: number, maxD: number, description: string, options: { basis?: "area" | "linear" | "fixed"; fixed?: number; height?: number; permits?: boolean; setbacks?: boolean; utilities?: boolean; color?: string; traits?: FeatureCatalogItem["traits"] } = {}): FeatureCatalogItem {
  return featureCatalogItemSchema.parse({
    id, kind: id, name, category, description, installedRange: { low, high },
    defaultSize: { widthFt: w, depthFt: d, heightFt: options.height ?? .5 },
    minSize: { widthFt: minW, depthFt: minD }, maxSize: { widthFt: maxW, depthFt: maxD },
    permitsMayApply: options.permits ?? false, setbacksMayApply: options.setbacks ?? false, utilitiesMayApply: options.utilities ?? false,
    traits: options.traits ?? ["decorative"], color: options.color ?? "#b8b294",
    priceModel: { basis: options.basis ?? "area", baseWidthFt: w, baseDepthFt: d, baseLow: low, baseHigh: high, fixedShare: options.fixed ?? .25 },
    notes: ["Curated preliminary installed range for the default size; not a contractor quote or verified nationwide price.", "Assumes ordinary access and ground conditions. Tax, unusual excavation, utility upgrades, engineering and permit fees require separate confirmation.", ...(options.utilities ? ["Utility routes, capacity and connection costs require an on-site assessment."] : [])],
  });
}
export const featureCatalog: FeatureCatalogItem[] = [
  feature("pool", "Swimming pool", "Water", 50000, 80000, 12, 24, 10, 18, 20, 40, "A compact in-ground pool with a simple equipment package; barrier and drainage design need review.", { fixed: .4, permits: true, setbacks: true, utilities: true, color: "#73bfc8", traits: ["structural", "utility", "recreational"] }),
  feature("plunge_pool", "Plunge pool", "Water", 18000, 32000, 8, 12, 6, 8, 12, 18, "A smaller pool for cooling off with less yard area.", { fixed: .5, permits: true, setbacks: true, utilities: true, color: "#78bdc8", traits: ["structural", "utility", "recreational"] }),
  feature("spa", "Spa / hot tub", "Water", 8000, 16000, 7, 7, 5, 5, 10, 10, "An above-ground spa and basic supporting pad.", { basis: "fixed", height: 3, permits: true, setbacks: true, utilities: true, color: "#6caab4", traits: ["utility", "recreational"] }),
  feature("water_feature", "Water feature", "Water", 2500, 7000, 4, 4, 2, 2, 10, 10, "A recirculating fountain with a modest basin.", { fixed: .6, utilities: true, color: "#93c4cb", traits: ["utility", "decorative"] }),
  feature("pavers", "Pavers", "Hardscape", 8000, 14000, 20, 20, 6, 6, 50, 50, "Installed paver surface with ordinary subbase preparation.", { fixed: .1, permits: true, color: "#d6c8ac", traits: ["structural"] }),
  feature("patio", "Patio", "Hardscape", 6000, 12000, 18, 16, 6, 6, 50, 50, "A simple finished entertaining terrace.", { fixed: .15, permits: true, color: "#d4c8af", traits: ["structural"] }),
  feature("deck", "Deck", "Hardscape", 12000, 22000, 16, 16, 8, 8, 40, 40, "Low deck with basic framing and boards; railings and footings need design.", { height: 2, permits: true, setbacks: true, color: "#b99c73", traits: ["structural"] }),
  feature("pergola", "Pergola", "Shade & structures", 7000, 14000, 12, 12, 8, 8, 24, 24, "Open timber shade structure with standard anchors.", { height: 9, permits: true, setbacks: true, color: "#a68059", traits: ["structural"] }),
  feature("gazebo", "Gazebo", "Shade & structures", 10000, 20000, 12, 12, 8, 8, 20, 20, "Roofed garden shelter with a simple footprint.", { height: 10, permits: true, setbacks: true, color: "#b08b69", traits: ["structural"] }),
  feature("shade_sail", "Shade sail", "Shade & structures", 1800, 4200, 12, 12, 8, 8, 24, 24, "Fabric shade and support posts; anchors and wind loading require review.", { height: 9, permits: true, setbacks: true, color: "#e0d9bf", traits: ["structural"] }),
  feature("kitchen", "Outdoor kitchen", "Cooking", 14000, 24000, 12, 4, 6, 3, 20, 6, "Cabinetry, appliances, countertop and basic electrical connection, scoped separately.", { fixed: .5, height: 3.2, permits: true, setbacks: true, utilities: true, color: "#b9ad92", traits: ["structural", "utility"] }),
  feature("grill", "Built-in grill", "Cooking", 4000, 9000, 6, 3, 4, 2, 10, 4, "Grill island with a basic work surface; fuel and clearances need review.", { fixed: .6, height: 3.2, permits: true, utilities: true, color: "#a6aaa5", traits: ["utility"] }),
  feature("pizza_oven", "Pizza oven", "Cooking", 3000, 8000, 4, 4, 3, 3, 6, 6, "Outdoor oven and supporting base; confirm fuel and fire clearances.", { basis: "fixed", height: 5, permits: true, utilities: true, color: "#c89976", traits: ["structural", "utility"] }),
  feature("dining", "Dining area", "Entertainment", 2000, 5000, 10, 8, 6, 6, 16, 12, "Outdoor table and chairs for a shared meal; supporting surface is separate.", { fixed: .5, height: 2.5, color: "#b89670" }),
  feature("lounge", "Lounge area", "Entertainment", 2500, 6500, 10, 8, 6, 5, 20, 16, "Comfortable outdoor seating; supporting surface is separate.", { fixed: .4, height: 3, color: "#d0c1a6" }),
  feature("fire_pit", "Fire pit", "Entertainment", 1500, 4500, 5, 5, 3, 3, 8, 8, "A compact fire feature; confirm fuel, fire rules and required clearances.", { basis: "fixed", height: 1.5, permits: true, utilities: true, color: "#c28d6d", traits: ["utility", "decorative"] }),
  feature("fire_table", "Fire table", "Entertainment", 2000, 5000, 6, 4, 4, 3, 8, 5, "A fire table for an existing seating area.", { basis: "fixed", height: 2, permits: true, utilities: true, color: "#bd987c", traits: ["utility", "decorative"] }),
  feature("putting_green", "Putting green", "Recreation", 4500, 9000, 12, 20, 6, 8, 30, 40, "Synthetic putting surface with simple contours and cups.", { fixed: .15, color: "#57965c", traits: ["recreational"] }),
  feature("mini_golf", "Mini golf", "Recreation", 7000, 15000, 14, 24, 8, 12, 30, 45, "A small private putting course with simple obstacles.", { fixed: .3, color: "#639d61", traits: ["recreational"] }),
  feature("sport_court", "Sport court", "Recreation", 18000, 35000, 25, 40, 20, 25, 50, 80, "A compact multipurpose hard court; fencing and lighting are separate.", { fixed: .2, permits: true, setbacks: true, color: "#879ca7", traits: ["structural", "recreational"] }),
  feature("play_area", "Play area", "Recreation", 3000, 8000, 12, 16, 8, 10, 25, 30, "Play equipment and a basic safety surface; fall zones require review.", { fixed: .5, height: 6, permits: true, color: "#c4b57e", traits: ["recreational"] }),
  feature("turf", "Artificial turf", "Landscaping", 4000, 7500, 20, 20, 5, 5, 60, 60, "Synthetic lawn and standard base preparation.", { fixed: .1, color: "#88aa70" }),
  feature("lawn", "Lawn", "Landscaping", 1200, 2800, 20, 20, 5, 5, 60, 60, "Soil preparation and sod, excluding irrigation upgrades.", { fixed: .1, color: "#a4bd7f" }),
  feature("planter", "Planters", "Landscaping", 1200, 3500, 12, 3, 3, 2, 40, 8, "Planted garden bed with edging and ordinary soil amendment.", { fixed: .2, height: 2, color: "#7a8962" }),
  feature("landscaping", "Landscaping", "Landscaping", 3500, 8500, 20, 8, 5, 3, 50, 30, "Mixed shrubs and perennials selected for the site.", { fixed: .15, height: 2, color: "#889d73" }),
  feature("privacy_planting", "Privacy planting", "Landscaping", 3000, 7500, 20, 4, 5, 3, 60, 8, "A planted screening border; mature size and root zones need review.", { basis: "linear", height: 6, color: "#648361" }),
  feature("lighting", "Landscape lighting", "Lighting", 1800, 4500, 20, 15, 5, 5, 50, 50, "Low-voltage fixtures and ordinary wiring runs.", { basis: "linear", fixed: .45, height: 1.5, utilities: true, color: "#eacb86", traits: ["utility", "decorative"] }),
  feature("pathway_lighting", "Pathway lighting", "Lighting", 1000, 2800, 20, 2, 5, 1, 60, 5, "A short run of low-voltage path lights.", { basis: "linear", fixed: .4, height: 1.5, utilities: true, color: "#e8d290", traits: ["utility", "decorative"] }),
  feature("fence", "Fence", "Privacy & boundary", 3000, 6500, 30, 1, 5, .5, 100, 2, "Installed garden fence; boundary, height and permit rules require verification.", { basis: "linear", height: 6, permits: true, setbacks: true, color: "#ae997c", traits: ["structural"] }),
  feature("privacy_screen", "Privacy screen", "Privacy & boundary", 1800, 4200, 10, 1, 4, .5, 25, 3, "Freestanding screening panels with basic footings.", { basis: "linear", height: 6, permits: true, setbacks: true, color: "#aa9477", traits: ["structural"] }),
  feature("seating_wall", "Seating wall", "Privacy & boundary", 3000, 7000, 12, 2, 4, 1.5, 40, 3, "Low masonry seating wall; retaining loads need separate engineering.", { basis: "linear", height: 2, permits: true, setbacks: true, color: "#c1b49b", traits: ["structural"] }),
];
export const catalogById = new Map(featureCatalog.map(item => [item.id, item]));
export const featureCategories = [...new Set(featureCatalog.map(item => item.category))];
