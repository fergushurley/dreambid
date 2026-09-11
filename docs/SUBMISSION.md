# Submission-ready text

## Team Name

DreamBid

## Project Description

DreamBid turns a homeowner's backyard idea into a designed, scoped project with contractor bids that can be compared fairly. GPT-6 Astra reasons over the homeowner brief, supplied images and provenance-bearing site context to create three concepts, build a typed ProjectSpec, and revise that same project while preserving constraints. Deterministic Python turns the spec into a Blender scene. Preliminary geometry checks protect the mature tree and detect fixture setback conflicts. Astra audits three clearly labeled synthetic bids, while code verifies scope references and calculates complete-scope prices. The demo exposes a $37,900 bid that becomes $47,600 after excluded kitchen work—more than the complete $42,900 alternative. A scope-linked visual makes the difference obvious.

The first commercial hypothesis is a contractor sales and pre-construction platform for outdoor-living remodelers: turn qualified leads into clearer concepts, scopes and proposals. The demo property and prices are illustrative. For other addresses, public Census matching and USDA NAIP aerials provide context where available, without claiming exact parcel identification. No real contractor outreach or permit approval is claimed.

## Public Project GitHub Repository

https://github.com/fergushurley/dreambid

## Demo video and hosted app

[Watch the narrated product demo](https://dreambid-mocha.vercel.app/demo/dreambid-demo.mp4) · [Open DreamBid](https://dreambid-mocha.vercel.app/)

The completed video is **83 seconds**, not a one-minute cut. It shows actual app interactions with AI narration, labeled deterministic concept selection, live Astra layout revision and quote assessment, and edited API waits. See [the transcript and recording details](DEMO.md#recorded-product-walkthrough). A separate one-minute presentation script remains in that guide.

## Describe your use of OpenAI products to build the submitted project

We used GPT-6 Astra in Codex to build DreamBid from the initial repository during the September 10, 2026 hackathon. Astra authored the shared TypeScript/Zod model, the Responses API integration, project/revision logic, preliminary feasibility checks, deterministic Blender renderer, synthetic quote normalization and tests, and helped inspect and debug actual outputs. It caught and fixed runtime setup, origin validation and API latency issues during verification. The public commit history and development notes record the implementation.

Inside the product, GPT-6 Astra uses the OpenAI Responses API with structured outputs for homeowner/image analysis and three concepts, project specification, constrained revision, and bid audit/recommendation. Successful live calls for all four stages are recorded in `docs/live-verification.json`. We keep cost arithmetic, invariant checking and Blender execution in deterministic code, and visibly distinguish live responses from fixture fallbacks. Illustrative photoreal concept assets added during development are separately labeled and tied to known reference geometry; they are not real property photos or live dynamic rendering.

## Provide feedback from your experience using OpenAI products

Structured outputs made it practical to connect design reasoning to a persistent domain model instead of manually interpreting prose. Astra handled a real multimodal concept request, project construction, a constrained revision, and a bid audit in the verified end-to-end run. The main demo risk was latency: a project-generation call reached our initial 55-second limit, so we used low reasoning effort, a 65-second server timeout and explicit fallback behavior. The successful verification run took roughly 31 seconds for concepts, 51 for project creation, 35 for revision and 21 for bid auditing; these are observed examples, not performance guarantees. We also encountered a funded-access issue (`credit_balance_exhausted`) and kept the full demo usable while it was resolved. Code-level reconciliation was valuable for preventing invalid scope references, double-counted allowances and protected-element changes. More predictable interactive latency and finer-grained completion/validation signals would help this workflow.

## Build disclosure

DreamBid was built from scratch during the GPT-6 Astra NYC Hackathon on September 10, 2026.

The app is a hosted hackathon prototype with a reproducible local setup. Contractor names, bids, planning costs and canonical property rules are synthetic. Public Census address matching and real USDA NAIP imagery have been verified at two distinct addresses; parcel identification, measured geometry and municipal rules remain unverified. New Blender scene generation requires the local Blender executable; retained scenes are available on the hosted demo. No real contractors were contacted. Feasibility requires survey and municipal/professional verification. A narrated app recording is available above; real customer traction, revenue, permit approval and model-native async-tool/mid-turn-steering integration are not claimed.

## Continuing product refinement

The current three-card experience uses curated investment tiers with live Astra contextual reasoning: a simple refresh, a kitchen terrace and a poolside kitchen/lounge project. Their prices are rolled up from the same ProjectSpec that opens in the editor, rather than generated from image appearance or forced under budget. Initial demo images are retained AI finish edits of their matching Blender scenes, clearly labeled and invalidated by geometry changes. Live regeneration prefers homeowner photos, then available public aerials; only the fictional property uses demo Blender geometry as its primary image reference. Added Blender material/furniture assets in the interactive editor, quarter-turn rotation with preserved linear pricing, and a detailed Cycles property view. The new live tier verification is recorded in `docs/tier-live-verification.json`; the earlier end-to-end Astra draft-generation evidence describes the original canonical path.
