import { loadEnvConfig } from "@next/env";
import { z } from "zod";
async function main() {
loadEnvConfig(process.cwd());
const { askAstra } = await import("../lib/openai");
const schema = z.object({ status: z.literal("ok"), preservedConstraint: z.string() });
if (!process.env.OPENAI_API_KEY) {
  console.log("SKIPPED: OPENAI_API_KEY is unavailable. Add it to .env.local and rerun npm run smoke:astra.");
} else {
  const result = await askAstra("dreambid_smoke", schema, "Return status ok and name the homeowner constraint to preserve.", { instruction: "Keep the mature tree." }, () => ({ status: "ok", preservedConstraint: "Keep the mature tree (fallback)." }));
  console.log(JSON.stringify(result, null, 2));
  if (result.meta.mode !== "live") process.exitCode = 1;
}
}
main().catch(() => { console.error("Astra smoke test failed."); process.exitCode = 1; });
