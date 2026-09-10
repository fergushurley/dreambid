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

Open http://localhost:3000. `OPENAI_MODEL` defaults to `gpt-6-astra`. Live mode requires access to that model. Without a key or on an API failure, results are labeled as fixture fallback. `DREAMBID_DEMO_MODE=1` forces the deterministic demonstration.

```sh
npm run build
npm run smoke:astra
npm run smoke:blender
```

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

The shared TypeScript/Zod schemas live in `types/index.ts`. Fixtures are in `fixtures/`. All credentials remain server-side. No arbitrary model-generated code is executed. No database, authentication, or real contractor outreach is included.

## Blender

Install Blender, then set `BLENDER_PATH` in `.env.local`. Standard macOS path:

```text
/Applications/Blender.app/Contents/MacOS/Blender
```

`npm run smoke:blender` runs a deterministic Python scene smoke test and writes an ignored `.blend` file to `public/generated/`. The project renderer and deterministic fallback are implemented in subsequent product checkpoints. Transient renders and Blender scene files are ignored; reproducible renderer source belongs in the public repository.

## Canonical demo

Use the fictional demonstration property, **24 Maple Lane, Montclair, NJ**, with the fixture site context. Its dimensions and rules are illustrative, not real property records or Montclair regulations.

1. Enter: “Make this backyard a great space for entertaining. My budget is $50,000. Keep the mature tree. Add dining, shade and better lighting.”
2. Select the middle concept, **The gathering garden**.
3. Inspect the retained tree and preliminary setback correction.
4. Revise: “Remove the pergola, add an outdoor kitchen, and keep the total under $45,000.”
5. Request three synthetic quotes and compare normalized scope.

## Truthfulness and limitations

- Contractor identities, quotes, planning prices, and the canonical property's rules and measurements are synthetic fixtures.
- No government records, aerial imagery, real contractor data, or permit approvals have been retrieved. The schema supports later integrations.
- Unknown site information stays unknown. A custom address must not inherit the demo property's zoning rules.
- Preliminary feasibility checks are subject to survey, arborist, utility, municipal, and professional verification before construction.
- An API fallback is not live Astra. A fallback visualization is not a Blender render. The UI must identify both.

## Astra in development and in the product

Astra in Codex is implementing and debugging the application, schemas, deterministic geometry, bid arithmetic, and tests. See [development evidence](docs/DEVELOPMENT.md) and Git history. Product calls use the Responses API, image inputs when supplied, and Zod structured output for concept generation, project creation, revision, and quote review. A successful live smoke test is recorded only after execution.

## Commercial direction

Initial hypothesis: a contractor-first sales and pre-construction workspace for outdoor-living remodelers. Homeowners use the visual planning experience; contractors pay for faster scope preparation and clearer proposals. A target of 50 contractor teams at $2,000/month would equal $100K MRR. This is an unvalidated target, not a revenue forecast. Commercial analysis and demo/submission materials will be added as the product is verified.

## Build status

Foundation authored: Next.js / TypeScript / Tailwind, 13 shared domain schemas, canonical ProjectSpec and SiteContext fixtures, server-side Astra integration, environment examples, and smoke-test scripts. Product implementation and verification are in progress; see the development log for actual test outcomes.
