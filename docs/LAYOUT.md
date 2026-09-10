# Interactive planning milestone

September 10, 2026. This extends the existing DreamBid architecture and keeps the original $50K → $45K canonical demo working.

## P0: catalog, layout and live budget

- Address, goal, budget and optional homeowner photos remain the entry point. A property-context panel shows the yard canvas, house footprint, protected tree and setback fixtures before generation. Changing to any other address immediately removes demo facts. No nationwide parcel lookup, aerial fetch or government-plan ingestion is claimed.
- Select a concept, then choose **Customize layout**. The 31-item catalog covers water, hardscape, shade, cooking, entertainment, recreation, landscaping, lighting and boundary features.
- Add features, select them in the plan or element list, drag to move, drag the top-right handle to resize, or edit width/depth and X/Y numerically. Arrow keys move a focused element by one foot; Shift moves five feet. Pointer edits snap to half-foot increments. The mature tree is locked.
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
6. Return to the design; resolve all geometry conflicts before Get 3 quotes. Quotes are generated for the final ProjectSpec version.

P1 work follows this milestone: Astra catalog-aware layout commands, structured budget substitutions and regenerated primary concept imagery grounded in the edited design. The existing Astra concept/project/revision/bid workflows remain available; generic revised-layout image generation is not part of this P0 claim.

## Verification

- 18 automated tests passed, covering original domain checks plus catalog coverage, add/remove scope integrity, resizing price effects, move-only price preservation, explicit warnings, locked elements, stale quote rejection, concept invalidation and strict model-output schemas.
- Production build and TypeScript passed.
- Original deterministic HTTP demo passed all five routes and fetched an actual Blender PNG, retaining the $42,900 / $48,900 / $47,600 normalized quote result.
- Browser verification: custom-address facts cleared, three concepts generated, middle concept selected, editor opened, pool added with over-budget range, pointer movement changed geometry and warnings, corner resizing changed pool dimensions and cost.
