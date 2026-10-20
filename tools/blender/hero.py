"""Course hero: cosmic muons rain through cut-away rock strata with a hidden void and are recorded
by a two-plane glass telescope below. Usage: python hero.py OUT.png W H SAMPLES"""
import sys, math, random
sys.path.insert(0, '.')
from kit import *

out, W, H, SPP = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
random.seed(7)
reset((W, H), SPP)
studio(key=420, rim=1700, fill=160)
floor_grid(-0.6, 60, spacing=0.8)

# rock strata (three layers, slightly different tint) with thin gaps
tints = [(0.13, 0.11, 0.10), (0.085, 0.09, 0.115), (0.12, 0.10, 0.13)]
zs = [(3.9, 0.55), (3.3, 0.6), (2.65, 0.65)]
rock_objs = []
bpy.ops.mesh.primitive_cube_add(location=(1.9, -1.0, 3.3)); cutter = bpy.context.active_object; cutter.scale = (1.5, 0.95, 1.2)
for i, ((zc, th), tint) in enumerate(zip(zs, tints)):
    o = box('rock%d' % i, (-0.6, 0, zc), (7.2, 3.2, th), rock_mat('rock%d' % i, tint))
    cut(o, cutter)
    rock_objs.append(o)
    edges(o, mat_emit('re%d' % i, BLUE, 1.0), 0.005)
bpy.data.objects.remove(cutter)
# the void: a glowing hollow inside the middle stratum, seen through a cut-away slot
void = sphere('void', (1.2, -0.05, 3.3), 0.42, mat_pbr('vg', (0.01, 0.02, 0.04), rough=0.6, emit=CYAN, emit_s=0.25))
ring = torus('voidring', (1.2, -0.05, 3.3), 0.43, 0.006, mat_emit('vr', CYAN, 8), rot=(math.radians(90), 0, 0))

# detector: two glass planes with cyan edges + a frame post
edge = mat_emit('edge', CYAN, 5)
glass = mat_pbr('glass', (0.55, 0.78, 1.0), rough=0.06, trans=0.95, ior=1.45)
p1 = plane_detector('det1', 1.25, (3.0, 2.4), 0.07, glass, edge, at=(0.4, 0))
p2 = plane_detector('det2', 0.35, (3.0, 2.4), 0.07, glass, edge, at=(0.4, 0))
post = mat_pbr('post', (0.06, 0.08, 0.12), rough=0.3, metal=0.9)
for x in (-1.1, 1.9):
    for y in (-1.2, 1.2):
        cylinder('post', (x, y, 0.4), 0.025, 1.9, post)

# muon tracks
mats = {'c': mat_emit('mc', CYAN, 14), 'b': mat_emit('mb', BLUE, 14), 'r': mat_emit('mr', RED, 12)}
hit = mat_emit('hit', GOLD, 40)
stopm = mat_emit('stop', GOLD, 25)
for k in range(22):
    x0, y0 = random.uniform(-3.4, 3.4), random.uniform(-1.2, 1.2)
    th = math.radians(random.uniform(0, 22)); ph = random.uniform(0, 2 * math.pi)
    dx, dy = math.tan(th) * math.cos(ph), math.tan(th) * math.sin(ph)
    z0 = 7.8
    col = random.choice('cccccbbr')
    # where would it be at the detector?
    def at(z): return (x0 + dx * (z0 - z), y0 + dy * (z0 - z))
    stop = random.random() < 0.35
    if stop:
        zend = random.uniform(2.5, 4.1)
    else:
        zend = -0.6
    pts = [(x0, y0, z0)]
    # small kinks from multiple scattering inside rock
    for zz in (4.2, 3.6, 3.0, 2.4):
        if zz > zend:
            px, py = at(zz); pts.append((px + random.gauss(0, 0.015), py + random.gauss(0, 0.015), zz))
    ex, ey = at(zend); pts.append((ex, ey, zend))
    curve_track('mu%d' % k, pts, mats[col], 0.011 if col != 'r' else 0.013)
    if stop:
        sphere('st%d' % k, (ex, ey, zend), 0.035, stopm, 12)
    else:
        for zp in (1.25, 0.35):
            hx, hy = at(zp)
            if -1.1 < hx - 0.4 < 1.5 + 0.0 and abs(hy) < 1.2 and -1.1 <= hx <= 1.9:
                sphere('h', (hx, hy, zp + 0.04), 0.045, hit, 12)

camera((9.0, -11.5, 3.4), (-2.3, 0.0, 2.3), lens=36, dof=14.0, fstop=5.6)
bloom(0.55, 0.85, 0.7)
render(out)
