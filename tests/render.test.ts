import test from "node:test";
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { canonicalProject } from "../fixtures/project";
import { renderProject, sceneHash } from "../lib/render";

test("a failed Blender process produces a labeled, readable fallback asset", async () => {
  const previous = process.env.BLENDER_PATH;
  // /usr/bin/false is a real executable that fails immediately on the supported local hosts.
  process.env.BLENDER_PATH = "/usr/bin/false";
  const project = structuredClone(canonicalProject);
  project.elements[0].id = `fallback-test-${crypto.randomUUID()}`;
  const hash = sceneHash(project);
  try {
    const scene = await renderProject(project);
    assert.equal(scene.renderer, "fallback");
    assert.equal(scene.blendFile, null);
    assert.equal(scene.renderUrl, `/generated/${hash}.svg`);
    const svg = await readFile(path.join(process.cwd(), "public", scene.renderUrl!), "utf8");
    assert.match(svg, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg, /Deterministic fallback plan/);
    assert.ok(!svg.includes("NaN"));
  } finally {
    if (previous === undefined) delete process.env.BLENDER_PATH;
    else process.env.BLENDER_PATH = previous;
    await Promise.all(["json", "svg"].map(extension => unlink(`public/generated/${hash}.${extension}`).catch(() => {})));
  }
});
