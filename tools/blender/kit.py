"""Shared Blender kit for the course renders: a dark studio, emissive tracks, glass detector planes,
rock strata, hits and a camera. Cycles CPU, denoised. Used by scenes.py."""
import bpy, math, random
from mathutils import Vector

BG = (0.010, 0.016, 0.030)
CYAN = (0.13, 0.83, 0.93)
BLUE = (0.31, 0.49, 1.0)
RED = (1.0, 0.33, 0.36)
GREEN = (0.31, 0.79, 0.54)
GOLD = (1.0, 0.78, 0.35)
VIOLET = (0.62, 0.45, 1.0)
WHITE = (0.85, 0.9, 1.0)


def reset(res=(1600, 900), samples=48):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception:
        pass
    sc.cycles.max_bounces = 6
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 6
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Punchy'
    except Exception:
        pass
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    bgn = w.node_tree.nodes['Background']; bgn.inputs[0].default_value = (*BG, 1); bgn.inputs[1].default_value = 1.0
    # gentle volumetric haze for glow depth
    return sc


def mat_emit(name, col, strength=8.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*col, 1); em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs[0], out.inputs[0])
    return m


def mat_pbr(name, col, rough=0.4, metal=0.0, trans=0.0, ior=1.45, emit=None, emit_s=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    for k in ('Transmission Weight', 'Transmission'):
        if k in b.inputs: b.inputs[k].default_value = trans; break
    b.inputs['IOR'].default_value = ior
    if emit is not None:
        for k in ('Emission Color', 'Emission'):
            if k in b.inputs: b.inputs[k].default_value = (*emit, 1); break
        b.inputs['Emission Strength'].default_value = emit_s
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m


def rock_mat(name='rock', tint=(0.16, 0.15, 0.17)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 2.2; noise.inputs['Detail'].default_value = 12; noise.inputs['Roughness'].default_value = 0.65
    nt.links.new(tc.outputs['Object'], noise.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (tint[0] * 0.5, tint[1] * 0.5, tint[2] * 0.55, 1)
    ramp.color_ramp.elements[1].color = (tint[0] * 1.6, tint[1] * 1.55, tint[2] * 1.6, 1)
    nt.links.new(noise.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.35
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = 0.85
    return m


def box(name, loc, size, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = o.modifiers.new('bev', 'BEVEL'); mod.width = bevel; mod.segments = 3
    o.data.materials.append(mat)
    return o


def edges(o, mat, thick=0.012):
    """emissive wireframe copy of an object's edges"""
    c = o.copy(); c.data = o.data.copy(); bpy.context.collection.objects.link(c)
    c.modifiers.clear()
    w = c.modifiers.new('wf', 'WIREFRAME'); w.thickness = thick; w.use_replace = True
    c.data.materials.clear(); c.data.materials.append(mat)
    return c


def plane_detector(name, z, size=(2.4, 2.4), thick=0.06, glass=None, edge=None, at=(0, 0)):
    glass = glass or mat_pbr(name + 'g', (0.55, 0.75, 1.0), rough=0.08, trans=0.92, ior=1.5)
    o = box(name, (at[0], at[1], z), (size[0], size[1], thick), glass, bevel=0.01)
    if edge: edges(o, edge, 0.01)
    return o


def curve_track(name, pts, mat, radius=0.012):
    cd = bpy.data.curves.new(name, 'CURVE'); cd.dimensions = '3D'
    sp = cd.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (p[0], p[1], p[2], 1)
    cd.bevel_depth = radius; cd.bevel_resolution = 4
    o = bpy.data.objects.new(name, cd); bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    return o


def sphere(name, loc, r, mat, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc, radius=r, segments=seg, ring_count=seg // 2)
    o = bpy.context.active_object; o.name = name
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o


def cylinder(name, loc, r, depth, mat, rot=(0, 0, 0), verts=48):
    bpy.ops.mesh.primitive_cylinder_add(location=loc, radius=r, depth=depth, rotation=rot, vertices=verts)
    o = bpy.context.active_object; o.name = name
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o


def torus(name, loc, R, r, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(location=loc, major_radius=R, minor_radius=r, rotation=rot, major_segments=64, minor_segments=16)
    o = bpy.context.active_object; o.name = name
    bpy.ops.object.shade_smooth(); o.data.materials.append(mat)
    return o


def floor_grid(z=0.0, size=40, mat=None, spacing=1.0):
    """dark glossy floor with a faint emissive grid"""
    m = bpy.data.materials.new('floor'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.012, 0.018, 0.032, 1); b.inputs['Roughness'].default_value = 0.28
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / spacing, 1 / spacing, 1)
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (0, 0, 0, 1); br.inputs['Color2'].default_value = (0, 0, 0, 1)
    br.inputs['Mortar'].default_value = (1, 1, 1, 1); br.inputs['Mortar Size'].default_value = 0.012
    br.offset = 0.0; br.inputs['Brick Width'].default_value = 1; br.inputs['Row Height'].default_value = 1
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    for k in ('Emission Color', 'Emission'):
        if k in b.inputs: nt.links.new(br.outputs['Color'], b.inputs[k]); break
    b.inputs['Emission Strength'].default_value = 0.35
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    o = bpy.context.active_object; o.name = 'floor'; o.data.materials.append(m)
    return o


def area_light(loc, rot, energy, color=(1, 1, 1), size=4.0):
    ld = bpy.data.lights.new('L', 'AREA'); ld.energy = energy; ld.color = color; ld.size = size
    o = bpy.data.objects.new('L', ld); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot
    return o


def camera(loc, target, lens=50, dof=None, fstop=2.8):
    cd = bpy.data.cameras.new('C'); cd.lens = lens
    o = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(o); o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if dof:
        cd.dof.use_dof = True; cd.dof.focus_distance = dof; cd.dof.aperture_fstop = fstop
    bpy.context.scene.camera = o
    return o


def studio(key=900, rim=1400, fill=250):
    area_light((6, -6, 8), (math.radians(50), 0, math.radians(45)), key, (0.75, 0.85, 1.0), 6)
    area_light((-7, 5, 5), (math.radians(-60), 0, math.radians(-135)), rim, (0.35, 0.75, 1.0), 5)
    area_light((0, -9, 2), (math.radians(85), 0, 0), fill, (0.6, 0.5, 1.0), 8)


def render(path):
    bpy.context.scene.render.filepath = path
    bpy.context.scene.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)


def straight(p0, p1, n=2):
    return [tuple(p0[i] + (p1[i] - p0[i]) * k / (n - 1) for i in range(3)) for k in range(n)]


def bloom(strength=0.6, threshold=0.8, size=0.6):
    sc = bpy.context.scene
    ng = bpy.data.node_groups.new('comp', 'CompositorNodeTree')
    ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = ng.nodes.new('CompositorNodeRLayers')
    gl = ng.nodes.new('CompositorNodeGlare')
    try:
        gl.inputs['Type'].default_value = 'Bloom'
    except Exception:
        pass
    for k, v in (('Threshold', threshold), ('Strength', strength), ('Size', size)):
        try: gl.inputs[k].default_value = v
        except Exception: pass
    out = ng.nodes.new('NodeGroupOutput')
    ng.links.new(rl.outputs['Image'], gl.inputs['Image'])
    ng.links.new(gl.outputs['Image'], out.inputs[0])
    sc.compositing_node_group = ng


def cut(target, cutter):
    m = target.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cutter; m.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=m.name)
