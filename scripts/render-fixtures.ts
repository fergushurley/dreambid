import { loadEnvConfig } from "@next/env";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { canonicalBrief } from "../fixtures/project";
import { canonicalSiteContext } from "../fixtures/site-context";
import { fallbackConcepts } from "../fixtures/concepts";
import { fixtureProject, applyRevision, canonicalRevisionPatch } from "../lib/project";
import { REVISION_PROMPT } from "../fixtures/project";

async function main() {
  loadEnvConfig(process.cwd());
  const { renderProject } = await import("../lib/render");
  await mkdir("public/demo", { recursive: true });
  const concepts = fallbackConcepts(canonicalBrief).concepts;
  const middle = fixtureProject(canonicalBrief, concepts[1], canonicalSiteContext);
  const before = { ...middle, elements: middle.elements.filter(e => e.kind === "tree" || e.kind === "patio").map(e => e.kind === "patio" ? { ...e, position: { x: 8, y: 5 }, size: { widthFt: 18, depthFt: 14, heightFt: .25 } } : e) };
  const revised = applyRevision(middle, canonicalRevisionPatch(middle, REVISION_PROMPT), REVISION_PROMPT, canonicalSiteContext);
  const projects = [{ name: "before", project: before }, ...concepts.map(c => ({ name: c.palette, project: fixtureProject(canonicalBrief, c, canonicalSiteContext) })), { name: "kitchen", project: revised }];
  for (const { name, project } of projects) {
    const scene = await renderProject(project);
    if (scene.renderer !== "blender") throw new Error(`Blender failed for ${name}`);
    await copyFile(`public${scene.renderUrl}`, `public/demo/${name}.png`);
    await writeFile(`public/generated/${name}-spec.json`, JSON.stringify(project, null, 2));
    console.log(`Rendered ${name}: ${scene.renderUrl}`);
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
