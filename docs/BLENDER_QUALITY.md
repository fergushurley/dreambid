# Blender geometry and high-detail rendering

The ordinary preview keeps the existing deterministic geometry pipeline. The optional **Render at max quality** action uses the same ProjectSpec with a more detailed, authored Blender scene. It does not execute AI-generated Python.

The max preset uses Cycles, up to 128 samples, adaptive sampling at 0.04, denoising, 1920×1280 output, 12 light bounces and CPU rendering for predictable startup on the demo Mac. A 512-sample experiment exceeded five minutes; the tuned preset rendered the retained property in 55 seconds. A five-minute timeout preserves a usable fallback. The UI identifies the render's actual source and quality; a failed render is never presented as successful Blender output.

Authored detail lives in `blender/realism.py`: procedural material variation and bump mapping, 26,000 individual oak leaves on a branching structure, modeled fence pickets, house siding and roof, window frames and handles, ornamental grass blades and a tensioned fabric shade sail. The known demo house footprint comes from SiteContext. Roof form, heights, finishes and landscaping appearance remain illustrative assumptions, not measured property facts.

Run `npm run render:property` to regenerate the retained demo property image. The command writes a verification record to `docs/blender-property-verification.json` only after a real Blender PNG succeeds. Runtime `.blend` files stay in ignored `public/generated/`.

The max result can also ground a later AI concept generation request. Concept images can interpret materials or visual details; the site plan and ProjectSpec retain the exact planning dimensions. Homeowner photos take priority for current-property appearance. The fictional demo's Blender model must never be called a real property photograph.

## Interactive material plan

The default editor appearance uses ten retained Blender Cycles raster assets: lawn, limestone, wood, roof shingles, water, oak canopy, dining furniture, lounge, kitchen and pergola. These are authored materials and furniture, not aerial photographs. `blender/plan_assets.py` reproduces them with 48 samples and a fixed random seed. Render with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python blender/plan_assets.py -- public/demo/materials
```

Materials follow live ProjectSpec footprints without waiting for another render. The Technical plan toggle exposes the grid and setback shading. Shadows and asset proportions are visual aids; final appearance still requires the separately labeled AI concept or Blender scene.

Rotation is a structured `rotate` patch: 90° clockwise around the footprint center, stored as `rotationDeg` plus swapped axis-aligned width/depth. Four turns restore original geometry. The same footprint feeds feasibility, scope and Blender; prices are unchanged by rotation, and linear-feature resizing measures the oriented length. Protected elements remain locked.
