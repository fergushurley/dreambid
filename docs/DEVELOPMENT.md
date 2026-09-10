# Development evidence

DreamBid was built from scratch during the GPT-6 Astra NYC Hackathon on September 10, 2026.

## Foundation checkpoint
- Starting repository: README, MIT license, .gitignore; no application or prior product code.
- Astra in Codex inspected the repository, interpreted the product brief, authored the typed domain schemas and provenance model, and designed the implementation.
- Verified official OpenAI documentation for `gpt-6-astra`, Responses API, and structured outputs on September 10, 2026.
- Initial environment: Node 25.6.0; npm 11.8.0; Python 3.9.6. No Blender application or OPENAI_API_KEY initially available.
- Implementation and test evidence is tracked in subsequent entries and Git commits. Do not equate a fallback response with a successful live API test.

### Setup verification — September 10, 2026
- `npm install`: passed; 56 packages added; audit reported zero vulnerabilities.
- `npm run build`: passed using Next.js 16.3.4 webpack mode, including TypeScript checking. Turbopack failed to bind a worker port even after retry, so webpack is the supported reliable build/dev path.
- `npm run smoke:blender`: passed, Blender 5.2.1 LTS; executable `/Applications/Blender.app/Contents/MacOS/Blender`; saved `public/generated/smoke.blend` (ignored).
- `npm run smoke:astra`: reached the API but returned `429 (credit_balance_exhausted)`. This is not a successful live test. The user was informed that funded API access is needed; fallback validated.
- Verified `.env.local`, `.next`, `node_modules`, and generated `.blend` output are ignored.
- Extra capability selected: Scope X-ray; other additions deferred. See `docs/IDEAS.md`.

## Product domain checkpoint
- Live Astra smoke passed after the user restored API credit: model `gpt-6-astra`, 2.882 seconds, response `resp_0912054594ab6198016aa2df73c43087d2b3022df74a63b786`.
- Implemented exactly-three-concept generation, image inputs, structured project drafts, minimal revision patches, and bid audit using Responses API structured outputs.
- Deterministic checks enforce valid scope references, budget maximum, original protected-tree placement, and preliminary fixture setbacks.
- A custom address receives unknown property facts instead of inheriting canonical fixture rules.
- Quote arithmetic is independent of model prose. Canonical A: $42,900; B: $45,900 + $3,000 allowance gap = $48,900; C: $37,900 + $9,700 exclusions = $47,600.
- Eight domain tests passed: scope totals, geometry repair, provenance isolation, revision preservation, protected-element/over-budget rejection, normalized prices, stale/duplicate bid rejection, impossible-footprint reporting.
- Deterministic HTTP flow passed concepts → project → revision → quotes → Blender asset. Browser testing found a localhost/127.0.0.1 origin mismatch; origin checking now uses the request Host header, with protocol validation.

## Documentation references
- https://developers.openai.com/api/docs/models/gpt-6-astra
- https://developers.openai.com/api/docs/guides/structured-outputs
