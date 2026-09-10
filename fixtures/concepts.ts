import type { ProjectBrief, RenovationConcept } from "@/types";
export function fallbackConcepts(brief: ProjectBrief): { analysis: string; concepts: RenovationConcept[] } {
  const factor = brief.budget / 50000;
  return {
    analysis: "Demo interpretation: create an inviting outdoor room around the retained tree, with dining, shade and warm evening light. Confirm actual dimensions and municipal requirements before building.",
    concepts: [
      { id: "meadow", title: "The everyday escape", designDirection: "An easygoing garden with a compact gravel terrace, loose planting, and dining under a simple shade canopy.", budgetRange: { low: Math.round(27000 * factor), high: Math.round(33000 * factor) }, majorElements: ["Gravel gathering space", "Dining for six", "Simple shade canopy", "Native planting"], feasibilityNotes: ["Smaller hardscape footprint", "Shade anchoring and all site rules need verification"], rationale: "A lighter intervention that makes the most of what is already there.", recommended: false, palette: "meadow" },
      { id: "terrace", title: "The gathering garden", designDirection: "A warm limestone terrace, generous cedar shade, and a table long enough for everyone. The mature oak stays the heart of the garden.", budgetRange: { low: Math.round(39000 * factor), high: Math.round(46000 * factor) }, majorElements: ["Limestone terrace", "Dining for eight", "Cedar pergola", "Layered evening lighting"], feasibilityNotes: ["Preserve mature-tree protection zone", "Check pergola against rear and side setbacks"], rationale: "The strongest balance of everyday use, entertaining, and room in the budget.", recommended: true, palette: "terrace" },
      { id: "retreat", title: "The weekend retreat", designDirection: "A more immersive outdoor living room with generous stone paving, integrated seating, and sculptural planting.", budgetRange: { low: Math.round(46000 * factor), high: Math.round(50000 * factor) }, majorElements: ["Expanded stone terrace", "Built-in lounge seating", "Architectural shade", "Feature lighting"], feasibilityNotes: ["Less budget contingency", "Confirm drainage and impervious surface limits"], rationale: "More of a destination, with premium materials and a more ambitious scope.", recommended: false, palette: "retreat" },
    ],
  };
}
