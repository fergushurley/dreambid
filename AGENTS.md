# DreamBid engineering instructions

DreamBid was started from scratch for the GPT-6 Astra NYC Hackathon, September 10, 2026. Protect a reliable three-minute demo during the approximately three-hour build window, while choosing a contractor pre-construction product direction that could support a real company.

## Product and implementation
- Canonical flow: address + backyard photos + brief → exactly three concepts → selected ProjectSpec → deterministic Blender visualization → natural-language revision → three synthetic contractor bids → scope-normalized recommendation.
- Canonical brief: “Make this backyard a great space for entertaining. My budget is $50,000. Keep the mature tree. Add dining, shade and better lighting.” Select the middle concept. Revise: “Remove the pergola, add an outdoor kitchen, and keep the total under $45,000.”
- Use Next.js App Router, React, TypeScript, Tailwind, Zod, OpenAI Responses API with `gpt-6-astra`, and deterministic Blender Python.
- Shared validated ProjectSpec and SiteContext are the source of truth for frontend, rendering, scope, feasibility, revision, and bid comparison. Never execute model-generated code.
- Site facts carry source, source type, reference, retrieval date, confidence, and authority status. Clearly label fixture data, inferred geometry, unknown rules, and synthetic bids. Never imply permit approval.
- Preliminary feasibility includes structured bounds, setbacks, protected tree checks, unknowns, assumptions, and next checks. It is subject to survey and municipal verification.
- Preserve unaffected elements and hard constraints during revision. Track changes and explain budget tradeoffs. Calculate quote arithmetic deterministically, with Astra assessing scope and recommending value.
- No real contractor outreach. No auth, database, payments, broad permit scraping, photogrammetry, production CAD, or unnecessary infrastructure.
- Keep functioning fallback paths when Astra, Blender, image analysis, or external property context fails. Never label a fallback as live AI.

## Working practice
- Inspect existing changes before editing. Work in small scopes, verify meaningful behavior, fix build failures, and make frequent descriptive commits. Never commit secrets, `.env.local`, dependencies, transient renders, or `.blend` files.
- At major checkpoints report working features, limitations, elapsed/remaining time, and the next highest-value task. Evaluate ideas as NOW, STRETCH, or LATER; pursue at most one extra NOW capability before the canonical flow works.
- Keep README, demo scripts, submission text, architecture, and an honest development log aligned with actual verified features. Everything demonstrated must be reproducible from the public repository.
- Priorities: environment → schemas → concepts → frontend → Blender → feasibility → revision → quote fixtures → normalization → demo hardening → polish → stretch.
- Assess who pays and why. Prefer a narrow backyard/outdoor-living contractor pre-construction wedge while retaining the homeowner-facing demo. Treat $100K MRR by December 2026 as a target and explicit sales assumptions, not a forecast.

## Commands
- `npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run smoke:astra`, `npm run smoke:blender`.
- Local preview only unless hosting is explicitly added. Server API keys never enter browser bundles.
