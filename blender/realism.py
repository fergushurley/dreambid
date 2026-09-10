"""Authored high-detail scene primitives. Deterministic; no downloads or generated code."""
import bpy
import math
import random
from mathutils import Vector

def texture(mat, scale=8, bump=.08, variation=.2):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader=nodes.get('Principled BSDF')
    base=tuple(shader.inputs['Base Color'].default_value)
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=4;noise.inputs['Roughness'].default_value=.7
    ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[1].position=.85
    ramp.color_ramp.elements[0].color=tuple(c*(1-variation) for c in base[:3])+(1,)
    ramp.color_ramp.elements[1].color=tuple(min(1,c*(1+variation)) for c in base[:3])+(1,)
    links.new(noise.outputs['Fac'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],shader.inputs['Base Color'])
    normal=nodes.new('ShaderNodeBump');normal.inputs['Strength'].default_value=.35;normal.inputs['Distance'].default_value=bump
    links.new(noise.outputs['Fac'],normal.inputs['Height']);links.new(normal.outputs['Normal'],shader.inputs['Normal'])

def mesh(name,verts,faces,materials,indices=None):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    for mat in materials:data.materials.append(mat)
    if indices:
        for poly,index in zip(data.polygons,indices):poly.material_index=index
    return obj

def leaf_cloud(name,centers,count,mats,leaf_size=.22):
    verts=[];faces=[];indices=[]
    for i in range(count):
        cx,cy,cz,rx,ry,rz=centers[i%len(centers)]
        angle=random.random()*math.tau;u=random.uniform(-1,1);radius=random.random()**(1/3)
        point=Vector((cx+rx*math.sqrt(1-u*u)*math.cos(angle)*radius,cy+ry*math.sqrt(1-u*u)*math.sin(angle)*radius,cz+rz*u*radius))
        a=random.random()*math.tau;tilt=random.uniform(-1.3,1.3);length=leaf_size*random.uniform(.6,1.3)
        axis=Vector((math.cos(a),math.sin(a),tilt)).normalized()*length
        cross=Vector((-math.sin(a),math.cos(a),.12))*length*.48
        j=len(verts);verts.extend([point-axis,point-cross,point+axis,point+cross,point+Vector((0,0,length*.16))]);faces.extend([(j,j+1,j+4),(j+1,j+2,j+4),(j+2,j+3,j+4),(j+3,j,j+4)]);indices.extend([i%len(mats)]*4)
    return mesh(name,verts,faces,mats,indices)

def oak(x,y,h,w,mats,pole):
    bark=mats['wood']
    pole('oak trunk, detailed',(x,y,0),(x-.2,y,h*.6),.62,bark)
    centers=[]
    for i in range(14):
        angle=i*math.tau/14;radius=w*random.uniform(.2,.43)
        top=(x+math.cos(angle)*radius,y+math.sin(angle)*radius,h*random.uniform(.71,.93))
        fork=(x+math.cos(angle)*radius*.45,y+math.sin(angle)*radius*.45,h*.57)
        pole('oak scaffold branch',(x,y,h*.38),fork,.18,bark);pole('oak tapered limb',fork,top,.085,bark)
        centers.append((*top,w*.2,w*.2,h*.12))
        for j in range(4):
            end=(top[0]+random.uniform(-1.8,1.8),top[1]+random.uniform(-1.8,1.8),top[2]+random.uniform(-1,1.5))
            pole('oak twig',top,end,.025,bark)
    leaf_cloud('Individual oak leaves',centers,26000,[mats['leaf'],mats['lightleaf']],.22)

def grasses(x,y,w,d,mats,count=700,height=1.5):
    verts=[];faces=[];indices=[]
    for i in range(count):
        px=x+random.random()*w;py=y+random.random()*d;h=random.uniform(.35,1)*height;a=random.random()*math.tau
        dx,dy=math.cos(a),math.sin(a);b=.025
        j=len(verts);verts.extend([(px-dy*b,py+dx*b,.4),(px+dy*b,py-dx*b,.4),(px+dx*.24,py+dy*.24,h*.65+.4),(px+dx*.6,py+dy*.6,h+.4)]);faces.extend([(j,j+1,j+2),(j,j+2,j+3)]);indices.extend([i%len(mats)]*2)
    mesh('Individual ornamental grass blades',verts,faces,mats,indices)

def house(W,mats,box,site=None):
    known=next((e for e in (site or {}).get('existingStructures',[]) if e['kind']=='house'),None)
    x=known['position']['x'] if known else W*.1;y=known['position']['y'] if known else -25
    w=known['widthFt'] if known else W*.8;d=known['depthFt'] if known else 25;front=y+d;h=10
    box('house footprint from site context',(x+w/2,y+d/2,h/2),(w,d,h),mats['house'],.06)
    # Roof, heights and finishes are illustrative, never extracted property facts.
    roof=mats['dark'];texture(roof,70,.03,.25)
    verts=[(x-.6,y-.6,h),(x+w+.6,y-.6,h),(x+w+.6,front+.6,h),(x-.6,front+.6,h),(x-.6,y+d/2,h+5),(x+w+.6,y+d/2,h+5)]
    mesh('Gabled roof, assumed architectural detail',verts,[(0,1,5,4),(4,5,2,3),(0,4,3),(1,2,5)],[roof,mats['house']],[0,0,1,1])
    for row in range(20):box('horizontal lap siding',(x+w/2,front+.015,.25+row*.49),(w,.075,.46),mats['house'],.015)
    for px in (x+w*.27,x+w*.7):
        box('sliding door black frame',(px,front+.12,4.1),(8,.17,7.8),mats['dark'],.03)
        box('warm interior visible through glass',(px,front+.23,4.1),(7.65,.07,7.45),mats['linen'],0)
        box('architectural glazing',(px,front+.30,4.1),(7.55,.07,7.35),mats['glass'],0)
        box('door center mullion',(px,front+.36,4.1),(.1,.08,7.6),mats['dark'],.01)
        for end in (-1,1):box('door handle',(px+end*.19,front+.43,4.2),(.08,.12,.85),mats['metal'],.02)
    for px in (x+.2,x+w-.2):box('corner trim',(px,front+.10,5),(.28,.13,10),mats['linen'],.02)
    for px in (x+1,x+w*.49,x+w-1):
        box('wall sconce',(px,front+.35,7),(.45,.45,.8),mats['dark'],.06)
        bpy.ops.object.light_add(type='AREA',location=(px,front+.65,6.8));light=bpy.context.object;light.data.energy=45;light.data.color=(1,.68,.38);light.data.size=.5;light.rotation_euler=(0,0,0)

def fence(W,D,mats,box):
    for axis,value,length,start in [('rear',D-.2,W,0),('left',.2,D,0),('right',W-.2,D,0)]:
        for i in range(math.ceil(length/.52)):
            pos=min(length-.2,.26+i*.52)
            center=(pos,value,2.5) if axis=='rear' else (value,pos,2.5)
            size=(.49,.13,5) if axis=='rear' else (.13,.49,5)
            box('individual fence picket',center,size,mats['linen'],.015)
        for t in range(0,int(length)+1,6):
            center=(t,value,2.6) if axis=='rear' else (value,t,2.6)
            box('fence post',center,(.28,.28,5.2),mats['linen'],.025)

def sail(x,y,w,d,h,mats,pole):
    corners=[(x,y,h-.4),(x+w,y,h+.4),(x+w,y+d,h-.4),(x,y+d,h+.4)]
    for px,py,pz in corners:pole('shade sail steel post',(px,py,0),(px,py,pz+.2),.09,mats['dark'])
    verts=[];faces=[];n=16
    for i in range(n+1):
        for j in range(n+1):
            u=i/n;v=j/n;z=h+.4*(2*u-1)*(1-2*v)-.45*math.sin(math.pi*u)*math.sin(math.pi*v)
            verts.append((x+w*u,y+d*v,z))
    for i in range(n):
        for j in range(n):
            a=i*(n+1)+j;faces.append((a,a+1,a+n+2,a+n+1))
    obj=mesh('Tensioned fabric shade sail',verts,faces,[mats['linen']]);solid=obj.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=.02
    for p in obj.data.polygons:p.use_smooth=True
