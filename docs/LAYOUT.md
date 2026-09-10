# Interactive planning milestone

September 10, 2026. This extends the existing DreamBid architecture and keeps the original $50K → $45K canonical demo working.

## P0: catalog, layout and live budget

- Address, goal, budget and optional homeowner photos remain the entry point. A property-context panel shows the yard canvas, house footprint, protected tree and setback fixtures before generation. Changing to any other address immediately removes demo facts. No nationwide parcel lookup, aerial fetch or government-plan ingestion is claimed.
- Select a concept, then choose **Customize layout**. The 31-item catalog covers water, hardscape, shade, cooking, entertainment, recreation, landscaping, lighting and boundary features.
- Add features, select them in the plan or element list, drag to move, drag the edge handles to resize, use the top-right × to remove, or edit width/depth and X/Y numerically. Arrow keys move a focused element by one foot; Shift moves five feet. Pointer edits snap to half-foot increments. The mature tree is locked.
- Every committed edit updates the same ProjectSpec, linked scope items, indicative budget, preliminary feasibility and revision history. Pointer previews use that same spec; they do not create a separate saved layout model. Old renders and quotes are invalidated. Closing the editor retains changes and returns to the current site plan. The 3D view can regenerate Blender geometry.
- The range and midpoint update immediately. Over-budget exploration is allowed and prominently shown. Impossible placement stays where the homeowner put it, with warnings, rather than being silently repaired.
- Deterministic warnings cover yard boundaries, the stated setback envelope, tree protection, known house footprints and incompatible element overlaps. Furniture/shade/kitchen may share supporting hardscape; lighting and lawn are treated as overlays. Fire clearances, pool barriers, engineering and local feature-specific rules still need professional verification.
- New catalog kinds have deterministic Blender geometry, including schematic water surfaces and putting greens. Other small features can be footprint proxies. These are 3D geometry views, not photoreal construction documentation.

## Price model

All catalog numbers are curated demo assumptions in USD, not a market survey, nationwide typical-price claim or contractor quote. Base ranges refer to the catalog's default dimensions and ordinary installation conditions. Each item includes min/max dimensions, permit/setback/utility flags and notes.

For area pricing: `factor = fixedShare + (1 - fixedShare) × currentArea / baseArea`.
For linear pricing: replace the area ratio with `currentWidth / baseWidth`.
Fixed packages retain their range at any allowed size. Range endpoints round to $10. The midpoint is allocated to linked scope items so quotes use the same indicative estimate. Outdoor kitchens retain separate base, countertop and electrical rows. Existing fixture elements keep their original amounts until resized; their initial uncertainty band is ±15%, also a demo assumption.

The project range includes unlinked pre-construction work. It can exceed the budget even when the midpoint fits; that uncertainty is visible. Taxes, difficult access/soil, engineering, utility upgrades and permit fees require confirmation before a real bid.

## Suggested interactive demo

1. Use the demo property, enable Demo playback, set $75,000, and enter: “Make this backyard a great entertaining space under $75K. Keep the mature tree.”
2. Select The gathering garden. The fixture midpoint is $61,600 due to rounding of the original scoped amounts.
3. Open Customize layout. Add Swimming pool, Putting green and Outdoor kitchen. Watch the range and over-budget amount increase.
4. Drag the pool toward the rear line. Its warning states the 10-foot fixture setback or yard-boundary conflict. Move it back; resize or rearrange other features as needed because a full pool may not fit the existing crowded design.
5. Select the putting green, reduce its width/depth, and observe the lower price. Select the tree to see that it is locked.
6. Ask “Keep the tree and get this under $75K.” Review the structured substitutions, sizes, positions and new range, then Apply these changes. Live Astra reasons over the spec, catalog and a deterministic budget candidate; Demo playback has a labeled fallback.
7. Choose Use this layout, turn off Demo playback and Generate / Regenerate concept. A fresh Blender reference plus the current geometry, constraints, site context and any uploaded photos ground the Image API request. Allow 1–3 minutes; cached identical inputs return faster.
8. Compare Concept, Blender / 3D and Site plan, then Get 3 quotes. Quotes use the final ProjectSpec version. Resolve remaining placement warnings first.

## P1: connected reasoning and imagery

`/api/layout` returns a validated catalog patch, tradeoffs, the proposed ProjectSpec and deterministic budget summary. The homeowner reviews changes before applying them. Changed layouts invalidate pending proposals. Budget fitting uses actual substitutions and size-based calculations, targeting the upper range below the cap; impossible requests fail without altering the project or inventing discounts. Protected elements stay fixed.

`/api/visualize` builds/caches the current Blender PNG and sends it to `gpt-image-2` with the full layout, constraints, SiteContext and optional homeowner photos. Images are cached by input content; ProjectSpec stores an optional signature-bound image reference. Changes invalidate it. All three concept cards now use retained AI reference imagery. AI images remain illustrative and can vary from exact dimensions; Blender / 3D and Site plan remain distinct. Runtime images and private input are not committed.

Address autocomplete/validation was requested and then explicitly deferred. No postal validation is claimed.

## Verification

- 21 automated tests passed, covering original domain checks plus catalog coverage, add/remove scope integrity, resizing price effects, move-only price preservation, explicit warnings, locked elements, stale quote rejection, concept invalidation and strict model-output schemas.
- Production build and TypeScript passed.
- Original deterministic HTTP demo passed all five routes and fetched an actual Blender PNG, retaining the $42,900 / $48,900 / $47,600 normalized quote result.
- Browser verification: custom-address facts cleared, three concepts generated, middle concept selected, editor opened, pool added with over-budget range, pointer movement changed geometry and warnings, corner resizing changed pool dimensions and cost.
