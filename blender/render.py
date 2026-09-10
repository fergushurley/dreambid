"""Deterministic ProjectSpec → Blender scene → PNG + .blend. Never executes model code.

Usage: blender --background --python blender/render.py -- input.json output.png
Coordinates and dimensions in feet. Position = lower-left, except tree = center.
"""
import bpy
import json
import math
import random
import sys
import importlib.util
from pathlib import Path
from mathutils import Vector

random.seed(42)
args = sys.argv[sys.argv.index('--') + 1:]
spec = json.loads(Path(args[0]).read_text())
quality = args[2] if len(args) > 2 else 'preview'
HIGH = quality == 'max'
module_spec = importlib.util.spec_from_file_location('dreambid_realism', Path(__file__).with_name('realism.py'))
realism = importlib.util.module_from_spec(module_spec); module_spec.loader.exec_module(realism)
output = Path(args[1]).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, roughness=.7, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return m

def rgb(hex_color):
    return tuple(int(hex_color[i:i+2], 16) / 255 for i in (1, 3, 5))

mats = {
    'grass': material('soft sage lawn', (.42, .53, .31)),
    'earth': material('soil edge', (.33, .32, .23)),
    'wood': material('warm natural cedar', (.46, .29, .14)),
    'teak': material('honey teak', (.57, .40, .22)),
    'linen': material('warm linen upholstery', (.88, .84, .72)),
    'stone': material('limestone', (.69, .65, .54)),
    'dark': material('charcoal fixtures', (.10, .13, .10)),
    'metal': material('brushed steel', (.43, .46, .44), .3, .65),
    'leaf': material('olive foliage', (.24, .36, .15)),
    'lightleaf': material('sunlit foliage', (.39, .48, .23)),
    'house': material('warm stucco', (.83, .81, .72)),
    'glass': material('blue green glass', (.22, .35, .32), .18, .15),
    'clay': material('terracotta', (.63, .36, .22)),
    'ground': material('studio backdrop', (.82, .84, .77)),
}
bulb = material('warm glowing bulbs', (1, .73, .32))
pbsdf = bulb.node_tree.nodes.get('Principled BSDF')
pbsdf.inputs['Emission Color'].default_value = (1, .62, .18, 1)
pbsdf.inputs['Emission Strength'].default_value = 3

def box(name, center, size, mat, bevel=.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        b = o.modifiers.new('soft edges', 'BEVEL'); b.width = bevel; b.segments = 2
        o.modifiers.new('weighted normals', 'WEIGHTED_NORMAL')
    return o

def sphere(name, center, scale, mat, ico=False):
    if ico: bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=center)
    else: bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=center)
    o = bpy.context.object; o.name = name; o.scale = scale; o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = not ico
    return o

def pole(name, start, end, radius, mat):
    vec = Vector(end) - Vector(start)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=radius, depth=vec.length, location=(Vector(start)+Vector(end))/2)
    o = bpy.context.object; o.name = name; o.rotation_euler = vec.to_track_quat('Z', 'Y').to_euler(); o.data.materials.append(mat)
    return o

def tree_at(x, y, height=23, width=12):
    if HIGH:
        realism.oak(x,y,height,width,mats,pole); return
    pole('retained oak trunk', (x, y, 0), (x-.3, y, height*.67), .55, mats['wood'])
    for dx, dy, dz in [(-3, 1, .73), (2.5, 2, .76), (1, -3, .71), (-1, -1, .94)]:
        pole('oak branch', (x, y, height*.42), (x+dx, y+dy, height*dz), .22, mats['wood'])
    for i in range(19):
        a = random.random()*math.tau; r = random.uniform(0, width*.34)
        h = height * (.68 + random.random()*.25)
        sphere('oak crown', (x+math.cos(a)*r, y+math.sin(a)*r, h), (width*.24, width*.24, height*.16), mats['leaf'] if i%3 else mats['lightleaf'], True)

W, D = spec['dimensions']['widthFt'], spec['dimensions']['depthFt']
box('site earth slab', (W/2, D/2, -.7), (W, D, 1.25), mats['earth'], .18)
box('lawn', (W/2, D/2, -.035), (W, D, .15), mats['grass'], .1)
box('backdrop', (W/2, D/2, -1.7), (2000, 2000, 1), mats['ground'], 0)
if HIGH:
    mats['grass'].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.07,.16,.035,1)
    for key in ('grass','wood','teak','stone','house','linen','earth'):
        realism.texture(mats[key], 100 if key=='grass' else 12, .05, .35 if key=='grass' else .16)
    mats['glass'].node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=.7
    mats['glass'].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.06
    realism.fence(W,D,mats,box)
    realism.house(W,mats,box,spec.get('siteContext'))
else:
    # Rear fence, partial side fences and a small, neutral house establish site context.
    for y in (D-.2,):
        box('rear fence', (W/2, y, 2.5), (W, .22, 5), mats['house'])
        for x in range(0, int(W)+1, 6): box('fence post', (x, y, 2.65), (.35, .35, 5.3), mats['house'])
    for x in (.2, W-.2): box('side fence', (x, D*.72, 2.5), (.22, D*.56, 5), mats['house'])
    box('house fragment', (W*.5, -6, 5), (W*.8, 12, 10), mats['house'], .12)
    box('flat roof coping', (W*.5, -6, 10.2), (W*.82, 12.5, .4), mats['stone'])
    for x in (W*.29, W*.55):
        box('sliding door frame', (x, .045, 4.4), (9, .15, 8), mats['dark'], .04)
        box('sliding door glass', (x, .16, 4.4), (8.5, .10, 7.5), mats['glass'], 0)
        box('door mullion', (x, .23, 4.4), (.13, .10, 7.5), mats['dark'], 0)
for e in spec['elements']:
    before_objects=set(bpy.context.scene.objects)
    angle=math.radians(e.get("rotationDeg",0))
    x, y = e['position']['x'], e['position']['y']
    w, d, h = e['size']['widthFt'], e['size']['depthFt'], e['size']['heightFt']
    center=Vector((x+w/2,y+d/2,0))
    if e.get('rotationDeg',0) in (90,270):
        w,d=d,w;x,y=center.x-w/2,center.y-d/2
    kind = e['kind']; custom = material(e['id']+' finish', rgb(e['color']))
    if HIGH: realism.texture(custom, 16, .045, .18)
    if kind in ('patio', 'path', 'pavers', 'deck'):
        box(e['label'], (x+w/2, y+d/2, .09), (w, d, .22), custom)
        for xx in range(0, max(1, int(w)), 3):
            for yy in range(0, max(1, int(d)), 3):
                tw, td = min(2.93, w-xx-.04), min(2.93, d-yy-.04)
                if tw > 0 and td > 0: box('individual paver', (x+xx+tw/2+.02, y+yy+td/2+.02, .23), (tw, td, .14), custom, .02)
    elif kind in ('pool', 'plunge_pool', 'spa', 'water_feature'):
        # Water and coping retain the exact footprint; not construction documentation.
        if HIGH:
            shader=custom.node_tree.nodes['Principled BSDF'];shader.inputs['Roughness'].default_value=.15;shader.inputs['Metallic'].default_value=.25
        box('pool coping', (x+w/2, y+d/2, .25), (w, d, .5), mats['stone'], .15)
        box('water surface', (x+w/2, y+d/2, .55), (max(.5, w-.9), max(.5, d-.9), .1), custom, .1)
    elif kind in ('putting_green', 'mini_golf', 'lawn', 'turf', 'sport_court', 'play_area'):
        box(e['label'], (x+w/2, y+d/2, .25), (w, d, .25), custom, .15)
        if kind in ('putting_green', 'mini_golf'):
            pole('putting flag pole', (x+w*.7, y+d*.65, .35), (x+w*.7, y+d*.65, 3.5), .04, mats['dark'])
            box('putting flag', (x+w*.7+.6, y+d*.65, 3.1), (1.2, .06, .7), mats['linen'])
    elif kind == 'tree': tree_at(x, y, h, w)
    elif kind == 'shade_sail':
        realism.sail(x,y,w,d,h,mats,pole)
    elif kind in ('pergola', 'gazebo'):
        for px in (x+.25, x+w-.25):
            for py in (y+.25, y+d-.25): box('pergola post', (px, py, h/2), (.45, .45, h), mats['wood'])
        for py in (y, y+d): box('pergola beam', (x+w/2, py, h), (w+.8, .42, .6), mats['wood'])
        for i in range(int(w/1.3)+1): box('cedar roof slat', (x+i*1.3, y+d/2, h+.45), (.22, d+1, .38), mats['teak'])
    elif kind == 'dining':
        box('dining tabletop', (x+w/2, y+d/2, h), (w*.78, d*.48, .20), mats['teak'], .11)
        for px in (x+w*.2, x+w*.8):
            for py in (y+d*.35, y+d*.65): pole('table leg', (px, py, .25), (px, py, h), .09, mats['dark'])
        for row in (0, 1):
            for i in range(4):
                cx, cy = x+w*(.16+i*.225), y+d*(.12 if row == 0 else .88)
                box('chair seat', (cx, cy, 1.55), (1.65, 1.65, .22), mats['linen'], .14)
                box('chair back', (cx, cy+(-.75 if row == 0 else .75), 2.2), (1.65, .2, 1.3), mats['teak'], .1)
                for dx in (-.62, .62):
                    for dy in (-.62, .62): pole('chair leg', (cx+dx, cy+dy, .22), (cx+dx, cy+dy, 1.5), .06, mats['wood'])
        sphere('table vase', (x+w/2, y+d/2, h+.42), (.3, .3, .35), mats['clay'])
        sphere('table greenery', (x+w/2, y+d/2, h+.88), (.6, .5, .35), mats['leaf'], True)
    elif kind == 'kitchen':
        box('kitchen masonry base', (x+w/2, y+d/2, h/2), (w, d, h), custom, .1)
        box('stone kitchen countertop', (x+w/2, y+d/2, h+.15), (w+.4, d+.3, .28), mats['stone'], .08)
        box('stainless grill', (x+w*.67, y+d/2, h+.65), (3.7, d*.7, 1.2), mats['metal'], .25)
        box('grill face', (x+w*.67, y-.1, h-.5), (3.3, .12, .5), mats['dark'])
        for i in range(4): sphere('grill knob', (x+w*.67-1+i*.65, y-.20, h-.5), (.13, .07, .13), mats['metal'])
        box('sink basin', (x+w*.2, y+d*.55, h+.31), (2, 1.5, .08), mats['metal'], .15)
        pole('faucet', (x+w*.2, y+d*.77, h+.3), (x+w*.2, y+d*.77, h+1.4), .06, mats['metal'])
        for px in (x+w*.15, x+w*.38): box('cabinet door', (px, y-.06, h*.46), (w*.2, .08, h*.8), mats['teak'], .03)
    elif kind in ('planter', 'landscaping', 'privacy_planting'):
        box('planting bed', (x+w/2, y+d/2, .35), (w, d, .7), mats['earth'], .14)
        if HIGH: realism.grasses(x,y,w,d,[mats['leaf'],mats['lightleaf'],mats['linen']], max(400,int(w*d*30)),h)
        for i in range(0 if HIGH else max(3, int(w/1.4))):
            px, py = x+.5+(w-1)*i/max(1, int(w/1.4)-1), y+d/2
            sphere('native planting', (px, py, .8+h*.35), (.8, d*.42, h*.6), mats['leaf'] if i%2 else mats['lightleaf'], True)
    elif kind in ('fence','privacy_screen'):
        for i in range(max(1,math.ceil(w/.55))):
            px=x+min(w-.25,.25+i*.55)
            box('cedar fence board',(px,y+d/2,h/2),(.5,min(d,.18),h),mats['wood'],.015)
        for px in (x+.15,x+w-.15):box('fence post',(px,y+d/2,h/2),(.3,min(d,.3),h),mats['dark'],.02)
    elif kind in ('lighting', 'pathway_lighting'):
        for i in range(6):
            px, py = x+w*i/5, y
            pole('path light', (px, py, .2), (px, py, 1.5), .07, mats['dark'])
            sphere('path light glow', (px, py, 1.55), (.16, .16, .13), bulb)
        start, end = (x, y+d, h), (x+w, y, h)
        for p in (start, end): pole('string light post', (p[0], p[1], 0), p, .07, mats['dark'])
        points = [(start[0]+(end[0]-start[0])*t/24, start[1]+(end[1]-start[1])*t/24, h-math.sin(math.pi*t/24)*1.5) for t in range(25)]
        for i in range(24): pole('string light cable', points[i], points[i+1], .022, mats['dark'])
        for i in range(1, 24, 2): sphere('festoon bulb', (points[i][0], points[i][1], points[i][2]-.22), (.12, .12, .18), bulb)
    elif kind == 'lounge':
        box('lounge plinth', (x+w/2, y+d/2, .6), (w, d, 1.2), mats['stone'])
        box('lounge cushion', (x+w/2, y+d/2, 1.5), (w-.3, d-.3, .7), mats['linen'], .18)
        box('lounge back', (x+w/2, y+d-.4, 2.3), (w-.2, .7, 1.5), mats['linen'], .18)

    else:
        # Remaining catalog items retain their exact footprint as labeled geometry proxies.
        box(e['label']+' schematic footprint', (x+w/2, y+d/2, h/2), (w, d, h), custom, .1)

    if angle:
        from mathutils import Matrix
        rotation=Matrix.Rotation(-angle,4,'Z')
        transform=Matrix.Translation(center) @ rotation @ Matrix.Translation(-center)
        for obj in set(bpy.context.scene.objects)-before_objects:obj.matrix_world=transform @ obj.matrix_world

# Orthographic architecture camera, looking from the open front-right corner.
target = Vector((W*.49, D*.49, 2))
bpy.ops.object.camera_add(location=(-W*.95, D*1.7, D*1.4))
camera = bpy.context.object; camera.rotation_euler = (target-camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'; camera.data.ortho_scale = max(W, D)*1.47; camera.data.lens = 50
bpy.context.scene.camera = camera
bpy.ops.object.light_add(type='AREA', location=(-15, -15, 65))
key = bpy.context.object; key.data.energy = 11000; key.data.shape = 'DISK'; key.data.size = 35
key.rotation_euler = (target-key.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.light_add(type='SUN', location=(0, 0, 50))
bpy.context.object.rotation_euler = (.45, -.4, -.5); bpy.context.object.data.energy = 2; bpy.context.object.data.angle = .15
scene = bpy.context.scene
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.82, .86, .76, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .8
scene.render.engine = 'CYCLES'; scene.cycles.samples = 128 if HIGH else 24; scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.04 if HIGH else .05
scene.cycles.max_bounces=12 if HIGH else 6
scene.view_settings.view_transform='AgX'
if HIGH:
    # CPU is reliable for short local jobs; Metal kernel startup can exceed the render timeout.
    scene.cycles.device='CPU'
    sky=scene.world.node_tree.nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING' if 'MULTIPLE_SCATTERING' in sky.bl_rna.properties['sky_type'].enum_items.keys() else 'NISHITA';sky.sun_elevation=math.radians(16);sky.sun_rotation=math.radians(125);sky.altitude=.2
    scene.world.node_tree.links.new(sky.outputs['Color'],scene.world.node_tree.nodes['Background'].inputs['Color'])
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.035
    key.data.energy=2500;key.data.size=45
    camera.data.type='PERSP';camera.data.lens=42
    camera.location=Vector((-W*.7,D*1.45,D*.83))
    target=Vector((W*.45,D*.37,3.5));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=-.5
scene.render.resolution_x = 1920 if HIGH else 1280; scene.render.resolution_y = 1280 if HIGH else 960; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.filepath = str(output)
scene.view_settings.view_transform = 'AgX'
scene.render.film_transparent = False
bpy.ops.wm.save_as_mainfile(filepath=str(output.with_suffix('.blend')))
bpy.ops.render.render(write_still=True)
print('DREAMBID_RENDER_OK', str(output))
