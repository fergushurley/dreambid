import { existsSync } from "node:fs";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import type { ProjectSpec } from "@/types";

const inFlight = new Map<string, Promise<ProjectSpec["scene"]>>();
export function blenderExecutable(): string | null {
  return [process.env.BLENDER_PATH, "/Applications/Blender.app/Contents/MacOS/Blender", "/usr/bin/blender", "/opt/homebrew/bin/blender"].find(p => p && existsSync(p)) || null;
}
export function sceneHash(project: ProjectSpec): string {
  return createHash("sha256").update(JSON.stringify({ rendererVersion: 4, dimensions: project.dimensions, elements: project.elements.map(({ id, kind, position, size, material, color }) => ({ id, kind, position, size, material, color })) })).digest("hex").slice(0, 20);
}
function fallbackSvg(project: ProjectSpec): string {
  const w = project.dimensions.widthFt, d = project.dimensions.depthFt;
  const sx = (x: number) => 100 + x / w * 720, sy = (y: number) => 700 - y / d * 580;
  const parts = project.elements.map(e => e.kind === "tree" ? `<circle cx="${sx(e.position.x)}" cy="${sy(e.position.y)}" r="70" fill="${e.color}"/><circle cx="${sx(e.position.x)}" cy="${sy(e.position.y)}" r="85" fill="none" stroke="#587044" stroke-dasharray="5 5"/>` : `<rect x="${sx(e.position.x)}" y="${sy(e.position.y + e.size.depthFt)}" width="${e.size.widthFt / w * 720}" height="${e.size.depthFt / d * 580}" fill="${e.color}" fill-opacity="${e.kind === "lighting" || e.kind === "pergola" ? .25 : 1}" stroke="#7e856d"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 820"><rect width="960" height="820" fill="#eaece1"/><rect x="100" y="120" width="720" height="580" fill="#d6ddc8" stroke="#879579"/>${parts}<text x="100" y="770" font-family="sans-serif" font-size="17" fill="#5e7250">Deterministic fallback plan · preliminary geometry</text></svg>`;
}
export async function renderProject(project: ProjectSpec): Promise<ProjectSpec["scene"]> {
  const hash = sceneHash(project);
  const existing = inFlight.get(hash); if (existing) return existing;
  const task = renderOnce(project, hash).finally(() => inFlight.delete(hash));
  inFlight.set(hash, task); return task;
}
async function renderOnce(project: ProjectSpec, hash: string): Promise<ProjectSpec["scene"]> {
  const folder = path.join(process.cwd(), "public", "generated");
  await mkdir(folder, { recursive: true });
  const output = path.join(folder, `${hash}.png`), input = path.join(folder, `${hash}.json`);
  const scene = { units: "feet" as const, camera: "isometric" as const, renderUrl: `/generated/${hash}.png`, blendFile: `/generated/${hash}.blend`, renderer: "blender" as const };
  // Cache key depends on geometry, never on user-controlled file paths.
  try { if ((await stat(output)).size > 1000) return scene; } catch { /* render missing */ }
  const blender = blenderExecutable();
  if (blender) {
    try {
      await writeFile(input, JSON.stringify(project));
      await new Promise<void>((resolve, reject) => {
        const child = spawn(blender, ["--background", "--python", path.join(process.cwd(), "blender", "render.py"), "--", input, output], { stdio: "ignore", shell: false });
        const timeout = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("Blender render timed out.")); }, Math.min(90000, Number(process.env.BLENDER_TIMEOUT_MS) || 60000));
        child.on("error", e => { clearTimeout(timeout); reject(e); });
        child.on("exit", code => { clearTimeout(timeout); code === 0 ? resolve() : reject(new Error("Blender render failed.")); });
      });
      if ((await stat(output)).size > 1000) return scene;
    } catch { console.warn("[DreamBid] Blender unavailable; using deterministic fallback visualization."); }
  }
  const svg = path.join(folder, `${hash}.svg`); await writeFile(svg, fallbackSvg(project));
  return { units: "feet", camera: "isometric", renderUrl: `/generated/${hash}.svg`, blendFile: null, renderer: "fallback" };
}
