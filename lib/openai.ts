import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { EngineResult } from "@/types";

export const astraModel = () => process.env.OPENAI_MODEL || "gpt-6-astra";
export function createOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined, timeout: 65000, maxRetries: 0 });
}

// Only imported by server routes/scripts. Credentials are never returned to clients.
export async function askAstra<T>(name: string, schema: z.ZodType<T>, instructions: string, payload: unknown, fallback: () => T, photos: { dataUrl: string }[] = [], forceDemo = false): Promise<EngineResult<T>> {
  const start = Date.now();
  const demo = forceDemo || process.env.DREAMBID_DEMO_MODE === "1";
  const client = demo ? null : createOpenAIClient();
  if (!client) return { data: schema.parse(fallback()), meta: { mode: demo ? "demo" : "fallback", model: astraModel(), reason: demo ? "Deterministic demo selected." : "OPENAI_API_KEY is not configured. Using a labeled fixture fallback.", responseId: null, durationMs: Date.now() - start } };
  try {
    const response = await client.responses.parse({
      model: astraModel(), reasoning: { effort: "low" }, store: false,
      instructions,
      input: [{ role: "user", content: [
        { type: "input_text", text: JSON.stringify(payload) },
        ...photos.map(photo => ({ type: "input_image" as const, image_url: photo.dataUrl, detail: "auto" as const })),
      ] }],
      text: { format: zodTextFormat(schema, name) }, max_output_tokens: 14000,
    });
    if (!response.output_parsed) throw new Error("Astra did not return a complete structured result.");
    return { data: schema.parse(response.output_parsed), meta: { mode: "live", model: response.model, reason: null, responseId: response.id, durationMs: Date.now() - start } };
  } catch (error) {
    // Do not return upstream error bodies (which can echo private input).
    const reason = error instanceof OpenAI.APIError ? `Astra API returned ${error.status ?? "a connection error"}${error.code && /^[a-z_]+$/.test(error.code) ? ` (${error.code})` : ""}.` : "Astra output could not be validated.";
    console.warn(`[DreamBid] ${name}: ${reason}`);
    return { data: schema.parse(fallback()), meta: { mode: "fallback", model: astraModel(), reason: `${reason} Using the deterministic fallback.`, responseId: null, durationMs: Date.now() - start } };
  }
}
