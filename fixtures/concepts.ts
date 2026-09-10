import { applyConceptTier } from "./concept-tiers";
import { canonicalProject } from "./project";
import { budgetSummary } from "@/lib/layout";
import type { ProjectBrief, RenovationConcept } from "@/types";
export function fallbackConcepts(brief: ProjectBrief): { analysis: string; concepts: RenovationConcept[] } {
  const factor = brief.budget / 50000;
  return {
    analysis: "Demo interpretation: create an inviting outdoor room around the retained tree, with dining, shade and warm evening light. Confirm actual dimensions and municipal requirements before building.",
    concepts: [
      { id: "meadow", title: "The everyday escape", designDirection: "A simple refresh: a small gravel dining area, an affordable fabric shade sail and a few lights. Most of the existing lawn stays open.", budgetRange: { low: Math.round(12500 * factor), high: Math.round(18000 * factor) }, majorElements: ["Compact gravel terrace", "Simple dining for six", "Fabric shade sail", "A few warm lights"], feasibilityNotes: ["Smaller hardscape footprint", "Shade anchoring and all site rules need verification"], rationale: "A lighter intervention that makes the most of what is already there.", recommended: false, palette: "meadow" },
      { id: "terrace", title: "The gathering garden", designDirection: "A warm limestone terrace, generous cedar shade, and a table long enough for everyone. The mature oak stays the heart of the garden.", budgetRange: { low: Math.round(39000 * factor), high: Math.round(46000 * factor) }, majorElements: ["Limestone terrace", "Dining for eight", "Cedar pergola", "Layered evening lighting"], feasibilityNotes: ["Preserve mature-tree protection zone", "Check pergola against rear and side setbacks"], rationale: "The strongest balance of everyday use, entertaining, and room in the budget.", recommended: true, palette: "terrace" },
      { id: "retreat", title: "The weekend retreat", designDirection: "A complete outdoor living space: a larger sandstone terrace, architectural pergola, separate lounge and fire pit, with layered garden lighting.", budgetRange: { low: Math.round(46000 * factor), high: Math.round(50000 * factor) }, majorElements: ["Expanded sandstone terrace", "Lounge + fire pit", "Architectural pergola", "Layered garden lighting"], feasibilityNotes: ["Less budget contingency", "Confirm drainage and impervious surface limits"], rationale: "More of a destination, with premium materials and a more ambitious scope.", recommended: false, palette: "retreat" },
    ],
  };
}

/** Explicit scope progression: pool pricing is not squeezed into the supplied budget. */
export function featuredConcepts(brief: ProjectBrief): ReturnType<typeof fallbackConcepts> {
 const concepts:RenovationConcept[]=[
 {id:"meadow-v2",palette:"meadow",title:"The simple refresh",designDirection:"A compact gravel dining area, simple fabric shade and a few warm lights. Most of your lawn stays open.",budgetRange:{low:12500,high:18000},majorElements:["Compact gravel terrace","Dining for six","Fabric shade sail","Simple garden lighting"],feasibilityNotes:["Verify dimensions and shade anchoring."],rationale:"The lightest intervention and smallest scope.",recommended:false},
 {id:"terrace-v2",palette:"terrace",title:"The kitchen terrace",designDirection:"A finished stone dining terrace with a cedar pergola and compact outdoor kitchen for cooking and gathering.",budgetRange:{low:36500,high:49500},majorElements:["Stone dining terrace","Cedar pergola","Outdoor kitchen","Layered garden lighting"],feasibilityNotes:["Confirm utilities, cooking clearances and structural rules."],rationale:"A practical outdoor room with cooking included.",recommended:true},
 {id:"retreat-v2",palette:"retreat",title:"The poolside retreat",designDirection:"A swimming pool, full outdoor kitchen and separate lounge around a generous sandstone entertaining terrace.",budgetRange:{low:109000,high:160000},majorElements:["24′ × 12′ swimming pool","Full outdoor kitchen","Dining pergola + lounge","Expanded sandstone terrace"],feasibilityNotes:["Pool barriers, excavation, drainage and utilities require review.","An aspirational option: retain the homeowner budget and show any overage explicitly."],rationale:"A complete backyard transformation with a substantially larger investment.",recommended:false}
 ];
 for(const concept of concepts){const p=structuredClone(canonicalProject);p.budgetMaximum=brief.budget;concept.budgetRange=budgetSummary(applyConceptTier(p,concept.palette)).range;}
 return {analysis:`Three clear investment levels, with the mature tree retained. Your budget remains $${brief.budget.toLocaleString("en-US")}. Kitchens are included in options two and three; the poolside option may require a higher budget or a reduced scope. All ranges are preliminary installed allowances, not quotes.`,concepts};
}
