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

## Working visualization and browser checkpoint

- Built the complete brief → three concepts → design → revision → quote-comparison interface, with distinct live/demo/fallback badges, source disclosures, browser autosave/resume, JSON download and Markdown bid-package export.
- Authored deterministic Blender Python from structured geometry. Generated and visually inspected the retained canonical PNGs; adjusted the camera to expose the kitchen instead of hiding it behind the tree. The renderer saves PNG and `.blend` outputs and caches by geometry plus renderer version.
- Added Scope X-ray: the two excluded kitchen rows highlight the same element in the site plan. Quote cards distinguish headline totals, scope adjustments and normalized totals. Allowance adjustments add only the shortfall.
- Incorporated the requested Dream Bid wordmark and separately generated photoreal reference assets, preserving their provenance, geometry matching and explicit illustrative labels. The exact Blender scene and SVG site plan remain independently accessible.
- Verified actual browser interactions: deterministic concept selection, canonical revision, saved-project resume, three synthetic bids, complete-scope reveal, and allowance inspection. The revised project is $42,900 with $3,000 pre-construction shown separately so the visible breakdown reconciles.
- Verified homepage navigation keeps the current project available to resume. The requested homepage was left open at `http://127.0.0.1:3000/`.

## Live multimodal verification

- A first full live attempt exposed a project-generation timeout at the original 55-second limit. Its fallback was recorded as fallback, not as a live success.
- Changed product calls to low reasoning effort and a 65-second server timeout, preserving a visible fallback and a 90-second client timeout.
- A subsequent live end-to-end run passed all four Astra stages: image/brief concepts, project creation, constrained revision and bid assessment, followed by an actual Blender asset. The image input was an illustrative Blender scene, not a real homeowner photo.
- Retained a sanitized evidence record in `docs/live-verification.json`: response IDs, model, timings, mode, revised total/cap and renderer. No API key, real homeowner image or private property data is included.
- The live revision was $32,900 under a $45,000 cap. This differs from the deterministic $42,900 fixture, as expected for a generated design; documentation distinguishes them.

## Final hardening and verification — September 10, 2026

- Explicit dollar-denominated budget reductions are now enforced independently of the model's proposed cap, including `$42.5k` syntax. A model cannot silently keep the old maximum when the user states a lower one.
- Unresolved geometry no longer produces an unconditional claim that the tree protection zone is clear. The backyard canvas is capped at 200 feet per side to bound deterministic placement/render work.
- `npm test`: **10 passed**, including protected-element and budget invariants, stale/duplicate bid rejection, provenance isolation, scope normalization, impossible geometry, explicit lower-cap enforcement and an actual failing Blender process producing a readable labeled fallback SVG.
- `npm run smoke:flow`: **passed** through all five HTTP routes, validating exactly three concepts, revision schema, retained tree, budget, exact quote normalization, and a fetched Blender PNG. The request includes the browser Origin header.
- `npm run build`: **passed**, including production compilation, TypeScript and all route output. `git diff --check`: passed. Candidate repository files were scanned for API-key patterns with no matches; secrets and transient renders remain ignored.
- The tsx CLI needs a temporary IPC socket that the desktop sandbox blocks; the authorized local test rerun outside that sandbox passed. This was an execution-environment constraint, not an application test failure.
- Updated README, one-minute/three-minute runbooks, failure recovery, submission text and commercial strategy. Proposed pricing is now $99 / $199 / $399 monthly, with a transparent 402-customer mix for $100,398 MRR and explicit channel/cost assumptions.
- Remaining prototype limits: no real property/government ingestion, engineering approval, live contractor procurement, production persistence/accounts or billing. The video deliverable is a timed flow and script, not a recorded video file.

## Documentation references
- https://developers.openai.com/api/docs/models/gpt-6-astra
- https://developers.openai.com/api/docs/guides/structured-outputs

## Continuing development: interactive planning P0

Inspected a clean repository at `b4c8861`; extended the existing spec, renderer and SVG plan rather than replacing the architecture. Added the 31-feature catalog, optional backward-compatible element pricing metadata, typed layout patches, a running range/midpoint budget and a pointer/keyboard/numeric editor. The same spec drives geometry, scope, autosave, rendering and synthetic bids. Added explicit invalid-placement warnings and server-side quote gating for unresolved geometry. Current property context is now visible before concept generation, with immediate fixture isolation for custom addresses. See `docs/LAYOUT.md` for formulas, assumptions, verified behavior and the next milestone.

Validation: 18 tests passed, production build passed, and the original deterministic HTTP flow still passed through real Blender output. Browser checks exercised custom-address isolation, concept selection, catalog addition, pointer movement and resizing. P1 remains catalog-aware Astra commands and concept regeneration; this checkpoint does not claim those are implemented yet.


## P1: Astra layout edits, photoreal regeneration and direct editor controls

Added reviewable structured layout patches and budget substitutions, with live Astra verified against the expanded $75K project and synthetic quotes normalized to the final scope. One observed live budget range was $42,910–$70,060; the protected oak remained unchanged and deterministic geometry had no unresolved conflicts. Real image generation used the current Blender render as an input, and the resulting photoreal concept was visually inspected. Retained additional AI references for the meadow and retreat concepts.

Browser checks verified a live Astra proposal, rejection of a stale proposal after more feature additions, and the requested direct editor controls: the court's right edge reduced width from 25 to 20 ft and reduced its range from $18,000–$35,000 to $15,120–$29,400; the corner × removed the court, restored the previous $61,600 midpoint and cleared its conflicts.

Git identity was corrected locally at the user's request. The five earlier commits were subsequently rewritten with explicit authorization, preserving each tree, message and timestamp. Backup `codex/identity-backup-d9955a2` remains. P0 is now `bed1776`; the two older GitHub-authored repository commits were preserved. Future author and committer identity is Fergus Hurley <fghurley@alum.mit.edu>.
