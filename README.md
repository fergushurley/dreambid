# DreamBid

**Your backyard idea. A buildable direction. Bids you can actually compare.**

DreamBid was built from scratch during the GPT-6 Astra NYC Hackathon on September 10, 2026.

DreamBid turns homeowner intent, photos, and explicitly sourced site context into three concepts, a structured project, a deterministic 3D visualization, and a scope-aware comparison of three synthetic contractor quotes.

## Run locally

Requires Node.js 20.9+ and npm. Initially tested with Node 25.6.0 and npm 11.8.0.

```sh
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local; never commit it.
npm run dev
```

Open http://127.0.0.1:3000. `OPENAI_MODEL` defaults to `gpt-6-astra`. Live mode requires funded access to that model. Without a key or on an API failure, results are labeled as fixture fallback. Enable **Demo playback** in the app for the deterministic demonstration, or set `DREAMBID_DEMO_MODE=1` server-side. The local prototype has no authentication; keep it on the loopback interface.

```sh
npm run build
npm test
npm run smoke:astra
npm run smoke:blender
npm run smoke:flow
# Optional paid end-to-end API verification, including an illustrative image:
npm run smoke:flow -- --live --vision
```

The HTTP flow checks require the local server running. After building, `npm start` serves the production build. The app uses webpack for the verified Next.js development/build path.

## Architecture

```text
ProjectBrief + photos + SiteContext (facts with provenance)
                        ↓
               GPT-6 Astra / Responses API
                        ↓
               Three renovation concepts
                        ↓
              Validated, versioned ProjectSpec
               ↙             ↓             ↘
        React interface  Rule checks  Deterministic Blender Python
                        ↓
                 Project scope / bid package
                        ↓
             Three synthetic contractor quotes
                        ↓
         Astra scope assessment + verified arithmetic
                        ↓
             Normalized comparison and recommendation
```

The shared TypeScript/Zod schemas live in `types/index.ts`. Fixtures are in `fixtures/`. All credentials remain server-side. No arbitrary model-generated code is executed. No database, authentication, or real contractor outreach is included. A project and its source context are saved in the current browser's local storage; uploaded photos are excluded. You can download the JSON and an actionable Markdown bid package.

The API routes are `/api/concepts`, `/api/project`, `/api/revise`, `/api/quotes`, and `/api/render`. Astra returns validated structured data. Code checks protected elements, budgets, geometry and stable scope references; quote arithmetic is independently calculated and reconciled with the model's scope audit. Model failures are surfaced as labeled fallback or an error that leaves the existing project intact.

## Blender

Install Blender, then set `BLENDER_PATH` in `.env.local`. Standard macOS path:

```text
/Applications/Blender.app/Contents/MacOS/Blender
```

`npm run smoke:blender` runs a deterministic scene test. `npm run render:fixtures` rebuilds the retained before/three-concept/kitchen PNGs using `blender/render.py`. The renderer creates the yard, house context, patio, tree, dining, pergola, planting, kitchen and lighting from ProjectSpec; renders a PNG; and saves a `.blend` file. Runtime assets are cached by a hash of geometry and renderer version in ignored `public/generated/`. Blender failure or timeout produces a labeled SVG fallback plan. Tested with Blender 5.2.1 LTS.

The **Concept** view can display separately generated illustrative photoreal assets for matching canonical geometry. **3D view** displays the current deterministic Blender result. **Site plan** shows structured footprints and the tree protection zone. Photoreal concepts are neither real property photographs nor live Blender renders; see [asset provenance and prompts](docs/PHOTOREAL_PREVIEWS.md).

## Canonical demo

Use the prefilled fictional property, **24 Maple Lane, Montclair, NJ · demo property**, with the fixture site context. Keep the entire address, including its demo suffix. Its dimensions and rules are illustrative, not real property records or Montclair regulations. Enable **Demo playback** for exact results below.

1. Enter: “Make this backyard a great space for entertaining. My budget is $50,000. Keep the mature tree. Add dining, shade and better lighting.”
2. Select the middle concept, **The gathering garden**.
3. Inspect the $41,000 design, retained tree, and preliminary three-foot pergola adjustment inside the fixture side setback.
4. Revise: “Remove the pergola, add an outdoor kitchen, and keep the total under $45,000.”
5. Verify revision 2 at $42,900 with a $45,000 cap, retained tree and dining, and the added kitchen.
6. Request three synthetic quotes; click **Compare complete scope**. Use **Scope X-ray** to inspect the kitchen work missing from the cheapest headline bid.

| Synthetic contractor | Headline | Complete-scope estimate |
|---|---:|---:|
| Oak & Field Outdoor | $42,900 | **$42,900 — recommended** |
| Forma Landscape Co. | $45,900 | $48,900, adding only the $3,000 allowance shortfall |
| Greenline Yardworks | **$37,900** | $47,600, adding $9,700 excluded countertop/electrical work |

Live Astra designs and prices can vary; exact replay numbers belong to the labeled fixtures. [One-minute and three-minute demo scripts, canonical prompts, and failure recovery](docs/DEMO.md).

## Truthfulness and limitations

- Contractor identities, quotes, planning prices, and the canonical property's rules and measurements are synthetic fixtures.
- No government records, aerial imagery, real contractor data, or permit approvals have been retrieved. The schema supports later integrations.
- Unknown site information stays unknown. A custom address must not inherit the demo property's zoning rules.
- Preliminary feasibility checks are subject to survey, arborist, utility, municipal, and professional verification before construction.
- An API fallback is not live Astra. A fallback visualization is not a Blender render. The UI must identify both.

## Astra in development and in the product

Astra in Codex implemented and debugged the application, schemas, deterministic geometry, bid arithmetic, and tests. See [development evidence](docs/DEVELOPMENT.md) and Git history. Product calls use the Responses API, image inputs when supplied, and Zod structured output for concept generation, project creation, revision, and quote review. A successful live end-to-end run, including an illustrative image input and all four Astra stages, is recorded in [live verification](docs/live-verification.json). Calls in that run took about 21–51 seconds each; these are observations, not latency guarantees.

## Commercial direction

Initial hypothesis: a contractor-first sales and pre-construction workspace for outdoor-living remodelers. Homeowners use the visual planning experience; contractors pay for faster scope preparation and clearer proposals.

Proposed competitive monthly tiers: **Solo $99** (1 user, 5 project packages), **Pro $199** (3 users, 15 packages), **Studio $399** (10 users, 40 packages). These are proposed launch terms; accounts, quotas and billing are not implemented in the hackathon app. Pricing is benchmarked against [JobTread's published $199 monthly base](https://www.jobtread.com/pricing).

The December 2026 stretch target requires **402 retained firms** at a mix of 100 Solo, 150 Pro and 152 Studio subscriptions: **$100,398 MRR**, before any channel commission. This depends on validated distribution and retention, and is not a forecast. See [wedge selection, pricing, cost sensitivity and acquisition plan](docs/STRATEGY.md).

## Hackathon deliverables

- Working local homeowner flow: images/brief → three concepts → versioned project → Blender → revision → scope-normalized bids.
- Provenance-bearing SiteContext, preliminary geometry repair, constraint preservation, and deterministic quote calculations.
- Scope X-ray, revision receipts, project autosave/resume, JSON export and contractor bid-package export.
- Labeled API and rendering fallbacks, reproducible fixture images, domain tests and end-to-end smoke scripts.
- [Demo runbook](docs/DEMO.md), [submission-ready text](docs/SUBMISSION.md), [commercial strategy](docs/STRATEGY.md), and [development evidence](docs/DEVELOPMENT.md).

A timed video flow/script is included; no recorded video or hosted production service is claimed. Government ingestion, actual site measurement, general collision/engineering analysis, real contractor procurement, authentication and billing remain outside this prototype.
