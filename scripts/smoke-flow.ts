import { readFile, mkdir, writeFile } from "node:fs/promises";
import { canonicalBrief, REVISION_PROMPT } from "../fixtures/project";
import { projectSpecSchema, quoteRecommendationSchema } from "../types";
import assert from "node:assert/strict";

async function main() {
  const live = process.argv.includes("--live"), vision = process.argv.includes("--vision");
  const brief = structuredClone(canonicalBrief);
  if (vision) brief.photos = [{ name: "Illustrative Blender site image (not a real photograph)", dataUrl: `data:image/png;base64,${(await readFile("public/demo/before.png")).toString("base64")}` }];
  const results: Record<string, unknown> = {};
  async function call(route: string, payload: unknown) {
    const response = await fetch(`http://127.0.0.1:3000/api/${route}`, { method: "POST", headers: { "Content-Type": "application/json", "Origin": "http://127.0.0.1:3000" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
    const result = await response.json();
    if (!response.ok) throw new Error(`${route}: ${JSON.stringify(result)}`);
    results[route] = result;
    console.log(`${route}: ${result.meta?.mode ?? result.data?.renderer} (${result.meta?.durationMs ?? 0}ms)`);
    if (live && result.meta?.mode !== "live" && route !== "render") console.log(`LIVE LIMITATION: ${result.meta?.reason}`);
    return result;
  }
  const concepts = await call("concepts", { brief, demoMode: !live });
  assert.equal(concepts.data.concepts.length, 3);
  const project = await call("project", { brief, concept: concepts.data.concepts[1], demoMode: !live });
  projectSpecSchema.parse(project.data);
  const revised = await call("revise", { project: project.data, instruction: REVISION_PROMPT, demoMode: !live });
  projectSpecSchema.parse(revised.data);
  assert.ok(revised.data.estimatedTotal <= 45000);
  assert.ok(revised.data.elements.some((e: { kind: string }) => e.kind === "kitchen"));
  assert.ok(!revised.data.elements.some((e: { kind: string }) => e.kind === "pergola"));
  assert.deepEqual(revised.data.elements.find((e: { kind: string }) => e.kind === "tree"), project.data.elements.find((e: { kind: string }) => e.kind === "tree"));
  const quotes = await call("quotes", { project: revised.data, demoMode: !live });
  quoteRecommendationSchema.parse(quotes.data);
  const render = await call("render", { project: revised.data });
  const image = await fetch(`http://127.0.0.1:3000${render.data.renderUrl}`);
  assert.equal(image.status, 200);
  if (!live) {
    assert.equal(revised.data.estimatedTotal, 42900);
    assert.equal(quotes.data.quotes.find((q: { quoteId: string }) => q.quoteId === "quote-c").normalizedTotal, 47600);
  }
  await mkdir(".artifacts", { recursive: true });
  await writeFile(`.artifacts/${live ? "live" : "demo"}-flow.json`, JSON.stringify(results, null, 2));
  console.log(`PASS: ${live ? "Live-requested" : "Deterministic"} end-to-end flow, schema validation, budget cap, retained tree, quotes, and render asset.`);
  if (live && [concepts, project, revised, quotes].some(r => r.meta.mode !== "live")) process.exitCode = 2;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
