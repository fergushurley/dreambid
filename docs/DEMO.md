# DreamBid demo runbook

Built September 10, 2026. The public repository contains the code, fixtures, renderer, and intentionally retained demo images. `docs/live-verification.json` records successful actual Astra calls; it is evidence, not a cached live response.

## Before recording or presenting

1. Keep the Mac open, plugged in, awake and online. Start `npm run dev` (or `npm run build` then `npm start` for the stable production build).
2. Open http://127.0.0.1:3000. Use a wide browser window so all three quote cards fit together.
3. Click Start a new project. Enable **Demo playback** for a deterministic one-minute recording. This explicitly labels fixture reasoning and avoids variable API latency. Leave it off for live Astra; ordinary calls can take tens of seconds, and failed calls are visibly labeled fallback.
4. Confirm `npm run smoke:astra`, `npm test`, and `npm run smoke:flow` pass. `npm run render:fixtures` regenerates the retained Blender assets if needed.
5. Check the main project visual's label. Photoreal concepts can be retained AI references or newly generated concepts (use the visible label); **Blender / 3D** is the deterministic Blender result; **Site plan** is the exact diagram of the structured footprints. Never call photoreal concepts real property photos or exact construction drawings. See [the interactive $75K demo](LAYOUT.md) for the catalog, edge resizing, Astra budget patch and regeneration flow.

## Exact canonical inputs

Address: **24 Maple Lane, Montclair, NJ · demo property**. This is a fictional demonstration property. Keep the entire prefilled address to select its fixture context.

Budget: **50000**.

Brief:

> Make this backyard a great space for entertaining. My budget is $50,000. Keep the mature tree. Add dining, shade and better lighting.

Select the middle concept: **The kitchen terrace**. This opens **Customize layout** directly as step 3. Choose **Use this layout** to preview the design and continue to quotes. Its selected scope is **$42,900**, with a preliminary installed range of **$36,470–$49,340**. Kitchens are included in options two and three; the poolside option is **$108,660–$159,350** and visibly exceeds a $50,000 cap.

Revision:

> Remove the pergola, add an outdoor kitchen, and keep the total under $45,000.

Result: **$42,900**, budget maximum **$45,000**, revision **2**. The tree and dining stay; the pergola is removed; an outdoor kitchen with separately scoped electrical and countertop work is added. Simpler planting, lighting selections and standard pavers provide explicit savings. View the revision receipt.

## One-minute video script

Use **Demo playback**. State that it is a deterministic replay of the working flow and that live Astra calls have also been verified. No recording is included merely because this script exists.

| Time | On screen | Voiceover |
|---|---|---|
| 0–8s | Address, brief, budget; click Explore my possibilities | “DreamBid turns a backyard idea into a project you can actually compare bids for. Keep the tree, add dining and shade, and stay under fifty thousand.” |
| 8–17s | Three concepts; select The gathering garden | “Astra turns homeowner intent, images and explicit site assumptions into three structured directions.” |
| 17–28s | Concept; switch to 3D view and Site plan; show setback receipt | “One project specification drives the design and Blender scene. The preliminary check moves this pergola three feet inside our clearly labeled fixture setback.” |
| 28–39s | Paste revision; submit; show kitchen and $42,900 | “Change the brief: trade the pergola for a kitchen, under forty-five thousand. The tree stays. So does the scope we did not change.” |
| 39–53s | Get 3 quotes; show headline prices; reveal complete scope | “The cheapest synthetic bid is thirty-seven nine. But electrical and countertop work are excluded. Its complete-scope estimate is forty-seven six.” |
| 53–60s | Select Greenline in Scope X-ray; show Oak & Field recommendation | “DreamBid connects the missing work to the design and recommends the complete forty-two-nine bid. Our business starts with contractors turning qualified leads into clear, winnable proposals.” |

For a one-minute edit, use normal editorial cuts between steps. Do not label sped-up or fixture footage as unedited live API execution. A genuine live request can be demonstrated separately with its live badge and response timing.

## Three-minute live presentation

- **0:00–0:25 — Problem.** “Homeowners compare three different promises as if they were three prices. Contractors repeatedly scope ideas that are not ready to buy.” Point at the homeowner brief.
- **0:25–0:55 — Design.** Generate/select the middle concept. In deterministic mode acknowledge the replay label. If demonstrating live Astra, allow time for the call and narrate the provided context instead of promising an instant response.
- **0:55–1:25 — Engineering.** Switch between Concept, 3D view and Site plan. Explain that Astra returns typed data and Blender executes authored deterministic Python. Show tree preservation and the three-foot fixture setback adjustment. Say that no zoning approval is claimed.
- **1:25–1:55 — Revision.** Apply the exact revision. Show version 2, $42,900, $45,000 cap, and preserved elements. This is a patch to the same spec, not a fresh unrelated design.
- **1:55–2:35 — Quote reveal.** Get three synthetic bids; compare headline against complete scope. Inspect Greenline's highlighted kitchen work. Show its excluded electrical and countertop rows and the single allowance adjustment in Forma.
- **2:35–3:00 — Business and evidence.** Explain contractor-first pre-construction as the first paid workflow, with proposed $99 / $199 / $399 monthly tiers. Download the scoped bid package. Point to the public repo, deterministic tests, Blender source, and the live-verification record. The $100K MRR stretch target requires about 400 retained firms and validated channel distribution; it is not a forecast.

## Expected deterministic quote result

| Bid | Headline | Adjustment | Normalized | Timeline | Warranty |
|---|---:|---:|---:|---|---|
| A · Oak & Field Outdoor | $42,900 | $0 | **$42,900** | 7 weeks | 3 years |
| B · Forma Landscape Co. | $45,900 | $3,000 allowance shortfall | $48,900 | 4 weeks | 5 years |
| C · Greenline Yardworks | **$37,900** | $5,500 countertop + $4,200 electrical | $47,600 | 10 weeks | 1 year |

Normalized-price rank: A, C, B. Recommendation: A. The seemingly cheapest C costs an estimated $4,700 more than A when required scope is included. B's $2,500 allowance is already in its headline; only its $3,000 shortfall against the $5,500 countertop estimate is added. All adjustment estimates are synthetic, not market-verified remediation bids.

## Failure recovery

| Failure | Reliable response |
|---|---|
| API missing key, quota exhausted, timeout or invalid output | Visible fallback badge. Enable Demo playback and use exact canonical inputs. State that the reasoning is a fixture replay. Never hide the badge. |
| Arbitrary offline revision unsupported | The existing project stays intact with an actionable error. Use the canonical revision or restore funded Astra access. |
| Blender unavailable or times out | A deterministic SVG plan renders; Site plan remains available. Retained repo Blender images still show the canonical references, labeled appropriately. |
| Photoreal concept missing / geometry changed | The Concept tab falls back to the current site plan with a Generate concept action. The separate Blender / 3D tab shows geometry. It must not show an unrelated cached concept. |
| Property records or zoning unavailable | Show unknown facts, illustrative geometry and professional-verification notes. Never relabel fixtures as government data. |
| Reload / browser interruption | Use the offered saved project from this browser. Photos are not persisted; upload again if needed for a new analysis. |
| Local server failure | Restart `npm run dev`; if development compilation is disrupted, use the verified production build with `npm start`. |
| Full live flow exceeds presentation time | Switch to the explicitly labeled deterministic playback and point to the live-call evidence. |

## Truthful judging claims

- **Astra in development:** domain modeling, typed API workflow, deterministic Blender code, feasibility checks, normalization, testing and debugging were authored with Astra in Codex. Commit history and development log provide evidence.
- **Astra in product:** real Responses API calls for image/brief analysis, concept generation, ProjectSpec creation, revision and bid assessment. Arithmetic and invariant checks are deterministic.
- **Live demo:** working local web app, project revision, actual Blender visualization, scope-linked price reveal. Three bids are synthetic.
- **Technicality:** persistent shared spec, provenance-bearing site facts, minimal validated patches, model reconciliation, content-based render caching and graceful fallbacks.
- **Not implemented:** real government ingestion, live aerial measurements, verified contractor network, permit approval, production CAD, payment processing, model-native async tools or mid-turn steering.

## Current visual tier update

The original canonical fixture remains covered by regression tests. The current cards use a simple gravel/shade-sail refresh, a kitchen terrace and a pool/kitchen/lounge transformation. The card images, header rows and prices align. Selection keeps the card's scope and planning range unchanged. The canonical pergola-to-kitchen revision now upgrades the compact kitchen while removing the pergola; the final $42,900 quote comparison remains unchanged.

Demonstrate the Material view/Technical plan toggle, select a fence and use **Rotate 90°**, then show that the footprint and warnings change without changing installed length or price. The homepage's default property view is an explicitly labeled AI image of the fictional property; its separate Blender tab shows deterministic geometry. AI concept references, Blender models and homeowner photos have distinct labels.
