import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSpecSchema } from "@/types";
import { syntheticQuotes } from "@/fixtures/quotes";
import { bidAuditSchema, fallbackAudit, normalizeQuotes, recommendationFromAudit } from "@/lib/quotes";
import { askAstra } from "@/lib/openai";
import { readBody, apiError } from "@/lib/http";
import { SYSTEM } from "@/prompts/system";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { project, demoMode } = await readBody(request, z.object({ project: projectSpecSchema, demoMode: z.boolean() }));
    const quotes = syntheticQuotes(project);
    const calculatedComparison = normalizeQuotes(project, quotes);
    const result = await askAstra("bid_audit", bidAuditSchema,
      `${SYSTEM}\nAudit each of the three SYNTHETIC contractor bids against the exact ProjectSpec revision. Identify missing scope (no line), excluded scope (line status excluded), and allowances (line status allowance) by stable scope ID; these are distinct sets. Explain where headline price is misleading. The verified normalized totals provided already add missing/excluded scope estimates and only the shortfall above an included allowance. Never invent another price. Recommend best overall value considering complete scope, normalized cost, schedule, warranty, and payment terms. Give concise contractor-specific reasons and targeted clarification questions. Do not invent reviews, licenses, or real contractor credentials.`,
      { project, quotes, calculatedComparison }, () => fallbackAudit(project, quotes), [], demoMode);
    try { return NextResponse.json({ data: recommendationFromAudit(project, quotes, result.data), meta: result.meta, quotes }); }
    catch { return NextResponse.json({ data: recommendationFromAudit(project, quotes, fallbackAudit(project, quotes)), meta: { ...result.meta, mode: "fallback", reason: "Astra's scope audit failed reconciliation. Using the deterministic audit." }, quotes }); }
  } catch (error) { return apiError(error); }
}
