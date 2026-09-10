"""Minimal deterministic Blender smoke test; no model-generated code."""
import bpy
from pathlib import Path
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.mesh.primitive_cube_add(size=2)
out = Path(__file__).resolve().parents[1] / 'public' / 'generated'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out / 'smoke.blend'))
print('DREAMBID_BLENDER_SMOKE_OK', bpy.app.version_string)
