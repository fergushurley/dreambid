# Photorealistic concept previews

Added in response to the request to make the main project visual photorealistic.

- Built-in image generation was used to edit the existing deterministic Blender reference renders.
- Assets: `public/demo/photoreal/terrace.png` and `public/demo/photoreal/kitchen.png`.
- These are illustrative AI concept visuals, not real property photos or dimensionally authoritative construction renders. Small decorative/material interpretations can differ from the exact geometry.
- `fixtures/photoreal-previews.json` records the exact reference geometry. Images are selected only when the current project's geometry and materials match that reference; arbitrary designs retain their own Blender/site-plan rendering.
- The Concept tab shows the matching photorealistic image; the 3D view and Site plan tabs retain the original deterministic representations.
- No changes were made to project state, feasibility rules, budgets, quote calculation, or the Blender renderer.

## Terrace prompt

```text
Use case: sketch-to-render.
Asset type: Photorealistic backyard design visualization in a homeowner planning app.
Primary request: Transform the supplied simple Blender architectural model into a convincingly real architectural photograph of the EXACT SAME backyard design.
Input image: edit target and authoritative layout reference. Preserve the yard shape, house and sliding-door positions, patio footprint, mature tree location, dining placement, planting strip, and string-light paths. Keep the cedar pergola over the eight-seat teak dining table, with no outdoor kitchen.
Style: high-end architectural photography, real materials and natural imperfections, not an illustration, miniature model, clay render, or stylized CGI.
Composition: fill the frame with the real full-scale backyard viewed obliquely from the same side as the reference, but at a lower elevated architectural camera angle; show the whole terrace and retained tree. No floating platform or gray studio background. The house, lawn and boundary fence are part of a believable full-scale suburban property.
Lighting: warm late-afternoon sunlight with realistic soft shadows, subtly glowing 2700K garden/string lights, natural green foliage. Keep the image bright enough to read inside a UI.
Materials: textured pale limestone pavers with subtle joints, natural cedar wood grain, real teak furniture with light linen cushions, individual grass blades, a mature oak with detailed bark and natural leaf canopy, low native planting along the specified strip, warm off-white stucco house and fence.
Constraints: do not add a pool, fire pit, lounge, people, extra structures, or extra furniture. Keep existing major elements and relationships. No text, dimensions, labels, logos, borders, or watermark. Landscape 4:3 image. This is an illustrative concept visualization, so make it look photographic without adding new scope.
```

## Kitchen prompt

```text
Use case: sketch-to-render.
Asset type: Photorealistic backyard design visualization in a homeowner planning app.
Primary request: Transform the supplied simple Blender architectural model into a convincingly real architectural photograph of the EXACT SAME backyard design.
Input image: edit target and authoritative layout reference. Preserve the yard shape, house and sliding-door positions, patio footprint, mature tree location, dining placement, planting strip, and string-light paths. Keep the eight-seat teak dining table uncovered with NO pergola, and keep the long outdoor kitchen with stainless grill and stone countertop in its exact reference position.
Style: high-end architectural photography, real materials and natural imperfections, not an illustration, miniature model, clay render, or stylized CGI.
Composition: fill the frame with the real full-scale backyard viewed obliquely from the same side as the reference, but at a lower elevated architectural camera angle; show the whole terrace and retained tree. No floating platform or gray studio background. The house, lawn and boundary fence are part of a believable full-scale suburban property.
Lighting: warm late-afternoon sunlight with realistic soft shadows, subtly glowing 2700K garden/string lights, natural green foliage. Keep the image bright enough to read inside a UI.
Materials: textured pale limestone pavers with subtle joints, natural cedar wood grain, real teak furniture with light linen cushions, individual grass blades, a mature oak with detailed bark and natural leaf canopy, low native planting along the specified strip, warm off-white stucco house and fence.
Constraints: do not add a pool, fire pit, lounge, people, extra structures, or extra furniture. Keep existing major elements and relationships. No text, dimensions, labels, logos, borders, or watermark. Landscape 4:3 image. This is an illustrative concept visualization, so make it look photographic without adding new scope.
```
