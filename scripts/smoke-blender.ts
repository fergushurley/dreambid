import { loadEnvConfig } from "@next/env";
import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
loadEnvConfig(process.cwd());
const candidates = [process.env.BLENDER_PATH, "/Applications/Blender.app/Contents/MacOS/Blender", "/opt/homebrew/bin/blender", "/usr/bin/blender"].filter(Boolean) as string[];
const blender = candidates.find(existsSync);
if (!blender) console.log("SKIPPED: Blender not found. Set BLENDER_PATH in .env.local. Deterministic fallback remains available.");
else {
  mkdirSync("public/generated", { recursive: true });
  const result = spawnSync(blender, ["--background", "--python", "blender/smoke.py"], { encoding: "utf8", timeout: 60000 });
  console.log(result.stdout); console.error(result.stderr);
  process.exitCode = result.status ?? 1;
}
