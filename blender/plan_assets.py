"""Render reusable overhead materials in Blender; no external assets or property imagery.
blender --background --python blender/plan_assets.py -- public/demo/materials
"""
import bpy, math, random, sys, importlib.util
from pathlib import Path
from mathutils import Vector
random.seed(42)
mod=importlib.util.spec_from_file_location('realism',Path(__file__).with_name('realism.py'));r=importlib.util.module_from_spec(mod);mod.loader.exec_module(r)
out=Path(sys.argv[sys.argv.index('--')+1]).resolve();out.mkdir(parents=True,exist_ok=True)
def mat(name,color,rough=.7):
 m=bpy.data.materials.new(name);m.use_nodes=True;s=m.node_tree.nodes['Principled BSDF'];s.inputs['Base Color'].default_value=(*color,1);s.inputs['Roughness'].default_value=rough;return m
def box(name,center,size,m,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=center);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:b=o.modifiers.new('rounded edges','BEVEL');b.width=bevel;b.segments=2;o.modifiers.new('smooth normals','WEIGHTED_NORMAL')
 return o
def pole(name,start,end,radius,m):
 v=Vector(end)-Vector(start);bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=radius,depth=v.length,location=(Vector(start)+Vector(end))/2);o=bpy.context.object;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);return o
mats={'wood':mat('Cedar',(.22,.10,.036)),'leaf':mat('Oak green',(.045,.115,.018)),'lightleaf':mat('Sunlit leaves',(.11,.21,.035))}
grass=mat('Lawn',(.07,.14,.026));r.texture(grass,110,.055,.4)
stone=mat('Warm limestone',(.42,.38,.30));r.texture(stone,80,.03,.14)
grout=mat('Recessed grout',(.16,.15,.12));wood=mats['wood'];r.texture(wood,25,.04,.3)
roof=mat('Charcoal roof',(.09,.105,.11));r.texture(roof,100,.035,.23)
water=mat('Reflective pool water',(.018,.23,.28),.16);r.texture(water,7,.16,.35);water.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=.28
names=sys.argv[sys.argv.index('--')+2:] or ['grass','stone','wood','roof','water','tree','dining','lounge','kitchen','pergola']
linen=mat('Linen',(.65,.61,.50));metal=mat('Brushed steel',(.25,.29,.28),.25);metal.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=.65
for name in names:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 if name=='grass':
  box('lawn base',(0,0,-.06),(12,12,.1),grass,0);r.grasses(-6,-6,12,12,[grass,mats['leaf'],mats['lightleaf']],30000,.16)
 elif name=='stone':
  box('grout',(0,0,-.07),(12,12,.1),grout,0)
  for row in range(-4,5):
   for col in range(-3,4):
    box('cut stone',(col*3+(1.5 if row%2 else 0),row*1.5,0),(2.96,1.46,.12),stone,.025)
 elif name=='wood':
  for col in range(-12,13):box('cedar board',(col*.5,0,0),(.475,12,.12),wood,.01)
 elif name=='roof':
  box('underlay',(0,0,-.05),(12,12,.1),roof,0)
  for row in range(-12,13):
   for col in range(-6,7):box('shingle',(col+(0.5 if row%2 else 0),row*.5,.04),(0.99,.48,.05),roof,.005)
 elif name=='water':box('water',(0,0,0),(12,12,.12),water,0)
 elif name=='tree':r.oak(0,0,21,12,mats,pole)
 elif name=='dining':
  box('teak table',(0,0,2.5),(7,3.3,.2),wood,.1)
  for row in [-1,1]:
   for col in [-3,-1,1,3]:
    box('chair cushion',(col,row*2.9,1.6),(1.45,1.55,.3),linen,.12);box('chair back',(col,row*3.55,2.1),(1.5,.2,.9),wood,.07)
  box('serving tray',(0,0,2.7),(1.2,.7,.1),stone,.05)
 elif name=='lounge':
  box('sofa base',(0,1,0.5),(9,4,1),wood,.1)
  for col in [-3,0,3]:box('linen seat',(col,1,1.2),(2.88,3.7,.6),linen,.22)
  box('sofa back',(0,2.6,2),(9,.7,1.6),linen,.18)
  box('coffee table',(0,-2,1),(4,1.6,.25),wood,.12)
 elif name=='kitchen':
  box('cabinetry',(0,0,1.5),(11.8,2.85,3),wood,.05);box('stone counter',(0,0,3.1),(12,3,.2),stone,.04)
  box('grill',(2,0,3.45),(3.7,2.3,.6),metal,.18)
  for col in range(12):box('grill bars',(.5+col*.27,0,3.78),(.08,2,.05),roof,.01)
  box('sink recess',(-3,0,3.22),(2,1.6,.08),metal,.13);box('sink shadow',(-3,0,3.28),(1.65,1.3,.02),roof,.12)
 elif name=='pergola':
  for x in [-5.8,5.8]:box('beam',(x,0,8),(.35,12,.45),wood,.02)
  for y in range(-6,7):box('roof slat',(0,y,8.4),(12,.24,.35),wood,.03)

 bpy.ops.object.camera_add(location=(0,0,45));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=17 if name=='tree' else 10 if name in ['dining','lounge'] else 12;cam.rotation_euler=(0,0,0)
 scene=bpy.context.scene;scene.camera=cam
 bpy.ops.object.light_add(type='AREA',location=(-5,6,20));light=bpy.context.object;light.data.energy=1600;light.data.size=8;light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
 scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.65,.75,1,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.03
 scene.render.resolution_x=768 if name=='tree' else 512;scene.render.resolution_y=round(scene.render.resolution_x*(.25 if name=='kitchen' else .8 if name in ['dining','lounge'] else 1));scene.render.resolution_percentage=100;scene.render.film_transparent=name in ['tree','dining','lounge','kitchen','pergola'];scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(out/(name+'.png'));scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
 bpy.ops.render.render(write_still=True)
 print('Rendered material',name,flush=True)
