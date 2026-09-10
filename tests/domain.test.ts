import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBrief, canonicalProject, REVISION_PROMPT } from "../fixtures/project";
import { canonicalSiteContext, siteForAddress } from "../fixtures/site-context";
import { fallbackConcepts } from "../fixtures/concepts";
import { syntheticQuotes } from "../fixtures/quotes";
import { fixtureProject, canonicalRevisionPatch, applyRevision } from "../lib/project";
import { checkFeasibility } from "../lib/feasibility";
import { normalizeQuotes } from "../lib/quotes";

const makeProject = () => fixtureProject(canonicalBrief, fallbackConcepts(canonicalBrief).concepts[1], canonicalSiteContext);
test("canonical full scope fits budget; three concepts retain all requested identities", () => {
  assert.equal(fallbackConcepts(canonicalBrief).concepts.length, 3);
  const p = makeProject(); assert.equal(p.estimatedTotal, 41000); assert.ok(p.estimatedTotal < p.budgetMaximum);
});
test("pergola is relocated inside fixture side setback without mutating input", () => {
  const checked = checkFeasibility(canonicalProject, canonicalSiteContext);
  const pergola = checked.elements.find(e => e.id === "pergola")!;
  assert.ok(pergola.position.y + pergola.size.depthFt <= 48);
  assert.equal(pergola.position.x, 5);
  assert.equal(canonicalProject.elements.find(e => e.id === "pergola")!.position.x, 2);
  assert.ok(checked.feasibility.conflicts.some(c => c.rule === "setback" && c.resolved));
});
test("custom addresses do not inherit fixture zoning or tree facts", () => {
  const site = siteForAddress("999 Different Street", true);
  assert.equal(site.rearSetback.value, null); assert.equal(site.sideSetback.value, null); assert.equal(site.protectedTree, null); assert.equal(site.isDemo, false);
});
test("canonical revision costs 42900, retains tree and dining geometry, and records one patch", () => {
  const p = makeProject(); const revised = applyRevision(p, canonicalRevisionPatch(p, REVISION_PROMPT), REVISION_PROMPT, canonicalSiteContext);
  assert.equal(revised.estimatedTotal, 42900); assert.equal(revised.budgetMaximum, 45000); assert.equal(revised.version, 2);
  assert.ok(!revised.elements.some(e => e.kind === "pergola")); assert.ok(revised.elements.some(e => e.kind === "kitchen"));
  for (const id of ["tree", "dining"]) assert.deepEqual(revised.elements.find(e => e.id === id), p.elements.find(e => e.id === id));
  assert.equal(revised.revisionHistory.length, 1); assert.equal(p.version, 1);
});
test("protected tree removal and over-budget revision fail instead of corrupting state", () => {
  const p = makeProject(); const patch = canonicalRevisionPatch(p, REVISION_PROMPT);
  assert.throws(() => applyRevision(p, { ...patch, removeElementIds: ["tree"] }, REVISION_PROMPT, canonicalSiteContext), /protected/);
  assert.throws(() => applyRevision(p, { ...patch, budgetMaximum: 10000 }, REVISION_PROMPT, canonicalSiteContext), /above/);
});
test("normalization reveals cheaper headline costs more; allowance is counted only once", () => {
  const p = makeProject(); const revised = applyRevision(p, canonicalRevisionPatch(p, REVISION_PROMPT), REVISION_PROMPT, canonicalSiteContext);
  const quotes = syntheticQuotes(revised); const normalized = normalizeQuotes(revised, quotes);
  assert.deepEqual(normalized.map(q => [q.quoteId, q.normalizedTotal]), [["quote-a", 42900], ["quote-c", 47600], ["quote-b", 48900]]);
  assert.equal(quotes.find(q => q.id === "quote-c")!.headlineTotal, 37900);
  assert.equal(normalized.find(q => q.quoteId === "quote-c")!.adjustments.reduce((n, a) => n+a.amount, 0), 9700);
  assert.equal(normalized.find(q => q.quoteId === "quote-b")!.adjustments[0].amount, 3000);
});
test("normalization rejects stale revisions and duplicated scope rows", () => {
  const p = makeProject(); const quotes = syntheticQuotes(p);
  assert.throws(() => normalizeQuotes({ ...p, version: p.version+1 }, quotes), /revision/);
  quotes[0].lineItems.push(quotes[0].lineItems[0]);
  assert.throws(() => normalizeQuotes(p, quotes), /repeats/);
});
test("unresolvable geometry is reported as a conflict, never compliant", () => {
  const p = structuredClone(canonicalProject); p.elements.find(e => e.kind === "pergola")!.size.widthFt = 60;
  const feasibility = checkFeasibility(p, canonicalSiteContext).feasibility;
  assert.equal(feasibility.status, "conflicts");
  assert.ok(!feasibility.likelyCompliant.some(text => text.includes("protection zone excluded")));
});
test("the explicit revised budget wins even when the model leaves the old cap", () => {
  const p = makeProject(); const patch = { ...canonicalRevisionPatch(p, REVISION_PROMPT), budgetMaximum: 50000 };
  assert.equal(applyRevision(p, patch, REVISION_PROMPT, canonicalSiteContext).budgetMaximum, 45000);
  assert.throws(() => applyRevision(p, patch, "Add a kitchen and keep the total under $42.5k", canonicalSiteContext), /above the \$42500 cap/);
  assert.equal(p.budgetMaximum, 50000);
});
