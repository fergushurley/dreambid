import { contractorQuoteSchema, type ContractorQuote, type ProjectSpec, type QuoteLineItem } from "@/types";

/** All contractors and quotes are fictional. Quotes are regenerated for each ProjectSpec version. */
export function syntheticQuotes(project: ProjectSpec): ContractorQuote[] {
  const kitchenScope = project.scopeItems.filter(s => s.elementId && project.elements.some(e => e.id === s.elementId && e.kind === "kitchen"));
  const excluded = kitchenScope.filter(s => /electri|countertop/i.test(`${s.id} ${s.description}`));
  const omissions = excluded.length ? excluded : [...project.scopeItems.filter(s => s.required)].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 1);
  const allowance = kitchenScope.find(s => /countertop/i.test(`${s.id} ${s.description}`)) || project.scopeItems.find(s => s.required && s.estimatedCost > 0)!;
  const scale = project.estimatedTotal / 42900;
  const names = ["Oak & Field Outdoor", "Forma Landscape Co.", "Greenline Yardworks"];
  const headline = [project.estimatedTotal, project.estimatedTotal + Math.round(3000 * scale / 100) * 100, project.estimatedTotal - Math.round(5000 * scale / 100) * 100];
  return names.map((contractorName, index) => {
    const lines: QuoteLineItem[] = project.scopeItems.map(s => ({ scopeItemId: s.id, description: s.description,
      amount: index === 2 && omissions.some(m => m.id === s.id) ? 0 : index === 1 && s.id === allowance.id ? Math.round(s.estimatedCost * .45 / 100) * 100 : s.estimatedCost,
      status: index === 2 && omissions.some(m => m.id === s.id) ? "excluded" : index === 1 && s.id === allowance.id ? "allowance" : "included",
    }));
    // Price included work to reconcile exactly to the quoted total, preserving allowance amounts.
    const included = lines.filter(l => l.status === "included");
    const includedSum = included.reduce((sum, l) => sum + l.amount, 0);
    const allowanceSum = lines.filter(l => l.status === "allowance").reduce((sum, l) => sum + l.amount, 0);
    if (includedSum > 0) {
      for (const line of included) line.amount = Math.round(line.amount / includedSum * (headline[index] - allowanceSum));
      included[0].amount += headline[index] - lines.reduce((sum, line) => sum + line.amount, 0);
    }
    return contractorQuoteSchema.parse({
      id: `quote-${String.fromCharCode(97 + index)}`, projectId: project.id, projectVersion: project.version, contractorName, synthetic: true,
      headlineTotal: headline[index], lineItems: lines,
      exclusions: index === 2 ? omissions.map(s => `${s.description} excluded. To be supplied and arranged by the owner.`) : [],
      allowances: index === 1 ? [{ scopeItemId: allowance.id, description: `${allowance.description}: selection allowance only; excess charged at cost.`, amount: lines.find(l => l.scopeItemId === allowance.id)!.amount }] : [],
      timelineWeeks: [7, 4, 10][index], warrantyYears: [3, 5, 1][index],
      paymentTerms: ["20% deposit, 40% on site start, 30% on installation, 10% after punch list.", "30% deposit, 40% on start, 30% at completion. Allowance overages billed separately.", "40% deposit, 40% at midpoint, 20% at completion. Owner arranges excluded work."][index],
    });
  });
}
