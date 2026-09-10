import { z } from "zod";
import { quoteRecommendationSchema, type ProjectSpec, type ContractorQuote, type NormalizedQuote, type QuoteRecommendation } from "@/types";

export const bidAuditSchema = z.object({
  audits: z.array(z.object({ quoteId: z.string(), missingScopeIds: z.array(z.string()), excludedScopeIds: z.array(z.string()), allowanceScopeIds: z.array(z.string()), rationale: z.string(), uncertainty: z.string() })).length(3),
  recommendedQuoteId: z.string(), explanation: z.string(), negotiationQuestions: z.array(z.string()).min(1).max(6),
});
export type BidAudit = z.infer<typeof bidAuditSchema>;

export function normalizeQuotes(project: ProjectSpec, quotes: ContractorQuote[]): NormalizedQuote[] {
  if (quotes.length !== 3 || new Set(quotes.map(q => q.id)).size !== 3) throw new Error("Exactly three uniquely identified quotes are required.");
  const scopeIds = new Set(project.scopeItems.map(s => s.id));
  return quotes.map(q => {
    if (q.projectId !== project.id || q.projectVersion !== project.version) throw new Error("A bid belongs to a different project revision.");
    if (new Set(q.lineItems.map(l => l.scopeItemId)).size !== q.lineItems.length) throw new Error("A quote repeats a scope item.");
    if (q.lineItems.some(l => !scopeIds.has(l.scopeItemId))) throw new Error("A quote refers to unknown scope.");
    const sum = q.lineItems.filter(l => l.status !== "excluded").reduce((n, l) => n + l.amount, 0);
    if (Math.abs(sum - q.headlineTotal) > 1) throw new Error("Quote line items do not reconcile to the headline total.");
    const adjustments: NormalizedQuote["adjustments"] = [];
    const missingScope: string[] = [], exclusionsDetected: string[] = [];
    for (const s of project.scopeItems.filter(s => s.required)) {
      const line = q.lineItems.find(l => l.scopeItemId === s.id);
      if (!line || line.status === "excluded") {
        adjustments.push({ scopeItemId: s.id, reason: `${!line ? "Missing scope" : "Excluded"}: ${s.description}`, amount: s.estimatedCost, kind: !line ? "missing_scope" : "exclusion" });
        if (!line) missingScope.push(s.description); else exclusionsDetected.push(s.description);
      } else if (line.status === "allowance") {
        const provision = q.allowances.find(a => a.scopeItemId === s.id);
        if (!provision || provision.amount !== line.amount) throw new Error("Quote allowance does not match its line item.");
        // Never double-add the allowance already contained in the headline.
        const amount = Math.max(0, s.estimatedCost - line.amount);
        if (amount > 0) adjustments.push({ scopeItemId: s.id, reason: `Allowance shortfall: ${s.description} (scope estimate $${s.estimatedCost}; included allowance $${line.amount})`, amount, kind: "allowance" });
      }
    }
    return { quoteId: q.id, contractorName: q.contractorName, headlineTotal: q.headlineTotal, adjustments,
      normalizedTotal: q.headlineTotal + adjustments.reduce((sum, a) => sum + a.amount, 0), missingScope, exclusionsDetected,
      uncertainty: adjustments.length ? "Adjustment amounts use ProjectSpec planning estimates; obtain a fixed-price clarification before signing." : "Complete stated scope; site conditions, final materials and permit costs still require confirmation.",
      rank: 1,
      rationale: adjustments.length ? "Compare the cost of the complete project, including work outside the headline." : "The quote includes every required scope item with no provisional allowance.",
    };
  }).sort((a, b) => a.normalizedTotal - b.normalizedTotal).map((q, i) => ({ ...q, rank: i + 1 }));
}

export function fallbackAudit(project: ProjectSpec, quotes: ContractorQuote[]): BidAudit {
  const normalized = normalizeQuotes(project, quotes);
  const best = normalized[0];
  return {
    audits: quotes.map(q => ({ quoteId: q.id, missingScopeIds: project.scopeItems.filter(s => s.required && !q.lineItems.some(l => l.scopeItemId === s.id)).map(s => s.id), excludedScopeIds: q.lineItems.filter(l => l.status === "excluded").map(l => l.scopeItemId), allowanceScopeIds: q.lineItems.filter(l => l.status === "allowance").map(l => l.scopeItemId), rationale: normalized.find(n => n.quoteId === q.id)!.rationale, uncertainty: normalized.find(n => n.quoteId === q.id)!.uncertainty })),
    recommendedQuoteId: best.quoteId,
    explanation: `${best.contractorName} offers the lowest cost for the complete stated scope at $${best.normalizedTotal.toLocaleString("en-US")}. The lowest headline leaves required work to the homeowner.`,
    negotiationQuestions: ["Confirm every required scope item is included at a fixed price.", "Confirm permit, tax, utility and unforeseen site-condition treatment.", "Agree on milestone payments, a written warranty and change-order approval before work begins."],
  };
}

export function recommendationFromAudit(project: ProjectSpec, quotes: ContractorQuote[], audit: BidAudit): QuoteRecommendation {
  const baseline = fallbackAudit(project, quotes);
  if (new Set(audit.audits.map(a => a.quoteId)).size !== 3 || !quotes.some(q => q.id === audit.recommendedQuoteId)) throw new Error("Astra returned invalid quote identities.");
  // Reconcile model scope findings to the actual typed bid. Model arithmetic is never trusted.
  for (const actual of baseline.audits) {
    const proposed = audit.audits.find(a => a.quoteId === actual.quoteId);
    if (!proposed) throw new Error("Astra omitted a quote audit.");
    for (const field of ["missingScopeIds", "excludedScopeIds", "allowanceScopeIds"] as const) {
      if (JSON.stringify([...actual[field]].sort()) !== JSON.stringify([...proposed[field]].sort())) throw new Error("Astra scope findings disagree with the quoted line items.");
    }
  }
  return quoteRecommendationSchema.parse({
    recommendedQuoteId: audit.recommendedQuoteId, explanation: audit.explanation, negotiationQuestions: audit.negotiationQuestions,
    quotes: normalizeQuotes(project, quotes).map(q => ({ ...q, rationale: audit.audits.find(a => a.quoteId === q.quoteId)!.rationale, uncertainty: audit.audits.find(a => a.quoteId === q.quoteId)!.uncertainty })),
  });
}
