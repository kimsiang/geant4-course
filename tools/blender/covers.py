"""Cover renders for the primer, setup page and the twelve weeks.
Usage: python covers.py OUTDIR W H SAMPLES key [key ...]"""
import sys, math, random
sys.path.insert(0, '.')
from kit import *

OUT, W, H, SPP = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
KEYS = sys.argv[5:]


def base(cam=((6.2, -7.4, 3.3), (0.6, 0, 1.3)), lens=40, floor=-0.2, seed=1, key=420, rim=1500):
    random.seed(seed)
    reset((W, H), SPP)
    studio(key=key, rim=rim, fill=150)
    floor_grid(floor, 60, spacing=0.8)
    camera(cam[0], cam[1], lens=lens)


def glass(name='g', col=(0.55, 0.78, 1.0), rough=0.06):
    return mat_pbr(name, col, rough=rough, trans=0.95, ior=1.45)


def dashed(name, p0, p1, mat, n=9, r=0.01):
    for i in range(n):
        a, b = i / n, (i + 0.55) / n
        curve_track('%s%d' % (name, i), [tuple(p0[k] + (p1[k] - p0[k]) * a for k in range(3)), tuple(p0[k] + (p1[k] - p0[k]) * b for k in range(3))], mat, r)


# ---------------------------------------------------------------- scenes
def primer():
    base(((0, -13, 3.0), (0, 0, 2.6)), lens=38)
    planet = sphere('earth', (0, 0, -30), 30.6, mat_pbr('earth', (0.01, 0.02, 0.04), rough=0.6), 64)
    edges(planet, mat_emit('grid', BLUE, 1.2), 0.012)
    torus('limb', (0, 0, -30), 30.75, 0.05, mat_emit('limb', CYAN, 3), rot=(math.radians(90), 0, 0))
    p = mat_emit('p', VIOLET, 16); c = mat_emit('c', CYAN, 12); r = mat_emit('r', RED, 10); g = mat_emit('g', GREEN, 8); hit = mat_emit('h', GOLD, 40)
    top = (0.3, 0, 7.5); first = (0.1, 0, 4.4)
    curve_track('prim', [top, first], p, 0.025)
    sphere('v', first, 0.07, hit)
    for k in range(16):
        ang = random.uniform(-0.55, 0.55); ang2 = random.uniform(-0.3, 0.3)
        end = (first[0] + math.tan(ang) * 4.0, first[1] + math.tan(ang2) * 2.0, 0.65)
        mid = (first[0] + math.tan(ang) * 1.6, first[1] + math.tan(ang2) * 0.8, 3.0)
        m = c if k % 3 else (r if k % 2 else c)
        curve_track('s%d' % k, [first, mid, end], m, 0.012)
        if k % 4 == 0: dashed('gm%d' % k, mid, (mid[0] + random.uniform(-1, 1), mid[1], 1.4), g, 6, 0.008)


def setup():
    base(((5.8, -7.6, 3.4), (0.2, 0, 1.4)), lens=42)
    e = mat_emit('e', CYAN, 6); g = glass()
    for i, z in enumerate((0.45, 1.35, 2.25)):
        o = box('layer%d' % i, (0, 0, z), (2.4, 2.0, 0.8), g, 0.03); edges(o, e if i != 1 else mat_emit('e2', BLUE, 6), 0.012)
    # "terminal" panel with code lines
    panel = box('panel', (-0.2, -1.6, 2.2), (2.6, 0.04, 1.5), mat_pbr('pn', (0.02, 0.03, 0.05), rough=0.25, metal=0.4))
    edges(panel, mat_emit('pe', CYAN, 3), 0.008)
    cols = [CYAN, CYAN, GOLD, CYAN, GREEN, CYAN, BLUE]
    for i in range(7):
        L = random.uniform(0.5, 2.0)
        box('ln%d' % i, (-1.35 + L / 2, -1.63, 2.8 - i * 0.17), (L, 0.01, 0.05), mat_emit('l%d' % i, cols[i], 6))


def w01():
    base(seed=11)
    ed = mat_emit('ed', CYAN, 5); g = glass()
    plane_detector('p1', 2.2, (2.4, 2.4), 0.06, g, ed); plane_detector('p2', 0.6, (2.4, 2.4), 0.06, g, ed)
    hit_ = mat_emit('h', GOLD, 40); c = mat_emit('c', CYAN, 12); b = mat_emit('b', (0.25, 0.35, 0.8), 5)
    for k in range(18):
        x0, y0 = random.uniform(-1.2, 1.2), random.uniform(-1.2, 1.2)
        th = math.radians(random.uniform(0, 55)); ph = random.uniform(0, 6.28)
        dx, dy = math.tan(th) * math.cos(ph), math.tan(th) * math.sin(ph)
        at = lambda z: (x0 + dx * (2.2 - z), y0 + dy * (2.2 - z))
        x1, y1 = at(0.6); ok = abs(x1) < 1.2 and abs(y1) < 1.2
        z0, z1 = 4.6, (-0.2 if ok else 0.9)
        curve_track('r%d' % k, [(*at(z0), z0), (*at(z1), z1)], c if ok else b, 0.009)
        sphere('h1', (x0, y0, 2.24), 0.035, hit_, 10)
        if ok: sphere('h2', (x1, y1, 0.64), 0.035, hit_, 10)


def w02():
    base(((6.0, -7.8, 2.6), (0, 0, 1.6)), lens=40, seed=2)
    world = box('world', (0, 0, 1.6), (6.0, 3.0, 3.0), mat_pbr('w', (0, 0, 0), rough=1, trans=1.0, ior=1.0))
    world.hide_render = True; edges(world, mat_emit('we', BLUE, 1.5), 0.008)
    pi = mat_emit('pi', RED, 14); mu = mat_emit('mu', CYAN, 14); nu = mat_emit('nu', GREEN, 8); hit = mat_emit('h', GOLD, 60)
    a, v = (-3.0, 0, 1.4), (0.4, 0.1, 1.6)
    curve_track('pion', [a, v], pi, 0.02)
    sphere('vtx', v, 0.08, hit)
    curve_track('muon', [v, (1.4, -0.3, 2.3), (3.0, -0.6, 2.9)], mu, 0.018)
    dashed('nu', v, (2.8, 0.9, 0.4), nu, 10, 0.012)


def w03():
    base(((6.0, -7.0, 3.0), (0, 0, 1.3)), lens=42, seed=3)
    lead = box('pb', (0, 0, 1.3), (1.4, 2.2, 1.6), mat_pbr('pb', (0.25, 0.28, 0.33), rough=0.35, metal=0.9), 0.03)
    edges(lead, mat_emit('pe', BLUE, 2), 0.008)
    mu = mat_emit('mu', CYAN, 14); st = mat_emit('st', GOLD, 40); de = mat_emit('de', RED, 10)
    curve_track('mu', [(-3.2, 0, 1.3), (3.2, 0, 1.3)], mu, 0.016)
    # steps visible on the near face: a glass skin so the track shows through
    for i, x in enumerate((-0.7, -0.38, -0.1, 0.22, 0.47, 0.7)):
        sphere('s%d' % i, (x, -1.13, 1.3), 0.045, st, 12)
        if i in (1, 3, 4):
            pts = [(x, -1.13, 1.3)]
            for k in range(1, 7):
                pts.append((x + 0.05 * k, -1.13 - 0.04 * k, 1.3 + 0.07 * k * (1 if i % 2 else -1) + 0.02 * math.sin(k * 2)))
            curve_track('d%d' % i, pts, de, 0.008)
    curve_track('muface', [(-0.7, -1.13, 1.3), (0.7, -1.13, 1.3)], mu, 0.012)


def w04():
    base(((5.8, -7.6, 2.8), (0.3, 0, 1.4)), lens=40, seed=4)
    slab = box('slab', (0, 0, 1.4), (2.6, 1.8, 0.5), glass('g', (0.6, 0.85, 1.0)), 0.02)
    edges(slab, mat_emit('se', CYAN, 4), 0.01)
    curve_track('mu', [(-3.2, 0, 1.4), (3.4, 0, 1.4)], mat_emit('mu', CYAN, 14), 0.016)
    # a floating histogram: Landau-like peak with a long tail
    vals = [0.05, 0.3, 1.0, 0.82, 0.58, 0.42, 0.32, 0.25, 0.2, 0.16, 0.13, 0.1, 0.08, 0.07, 0.06]
    for i, v in enumerate(vals):
        col = (1.0, 0.55 + 0.03 * i, 0.25 + 0.04 * i)
        box('b%d' % i, (-1.6 + i * 0.24, 1.6, 2.4 + v * 0.8), (0.18, 0.06, v * 1.6 + 0.02), mat_emit('bm%d' % i, col if i else GOLD, 5))


def w05():
    base(((5.6, -7.2, 3.0), (0.3, 0, 1.3)), lens=42, seed=5)
    bar = box('bar', (-0.6, 0, 1.2), (2.6, 0.9, 0.3), glass('g', (0.5, 0.9, 1.0)), 0.02); edges(bar, mat_emit('be', CYAN, 4), 0.01)
    guide = box('lg', (1.2, 0, 1.2), (1.0, 0.6, 0.24), glass('lg', (0.7, 0.8, 1.0)), 0.02); edges(guide, mat_emit('ge', BLUE, 3), 0.008)
    box('sipm', (1.8, 0, 1.2), (0.2, 0.3, 0.3), mat_pbr('si', (0.08, 0.06, 0.02), rough=0.3, metal=0.8, emit=GOLD, emit_s=2.5), 0.01)
    curve_track('mu', [(-0.9, -0.3, 4.2), (-0.6, 0.0, 1.2), (-0.3, 0.3, -0.2)], mat_emit('mu', CYAN, 14), 0.016)
    sphere('hit', (-0.6, 0, 1.2), 0.08, mat_emit('h', GOLD, 60))
    # pulse waveform above the SiPM
    pts = []
    for i in range(80):
        t = i / 79; x = 0.6 + t * 2.6
        y = 2.4 + 0.9 * (math.exp(-max(0, t - 0.15) / 0.12) - math.exp(-max(0, t - 0.15) / 0.02)) * (t > 0.15) * 1.3
        pts.append((x, 0, y))
    curve_track('pulse', pts, mat_emit('pl', GOLD, 10), 0.012)
    curve_track('base', [(0.6, 0, 2.4), (3.2, 0, 2.4)], mat_emit('bl', (0.3, 0.4, 0.7), 2), 0.004)


def w06():
    base(((6.2, -7.6, 3.0), (0.6, 0, 1.4)), lens=40, seed=6)
    blk = box('blk', (0.8, 0, 1.4), (2.4, 2.0, 1.4), glass('g', (0.6, 0.7, 1.0), 0.12), 0.02); edges(blk, mat_emit('be', BLUE, 3), 0.01)
    c = mat_emit('c', CYAN, 12); r = mat_emit('r', RED, 10); b = mat_emit('b', BLUE, 10); g = mat_emit('g', GREEN, 7)
    start = (-3.2, 0, 1.4); v0 = (-0.3, 0, 1.4)
    curve_track('in', [start, v0], mat_emit('pi', VIOLET, 14), 0.018)
    def branch(p, ang, depth, L):
        if depth == 0: return
        for s in (-1, 1):
            a = ang + s * random.uniform(0.15, 0.5)
            q = (p[0] + L * math.cos(a), p[1] + random.uniform(-0.25, 0.25), p[2] + L * math.sin(a))
            if depth % 2: dashed('g%d%d' % (depth, random.randint(0, 9999)), p, q, g, 5, 0.007)
            else: curve_track('e%d' % random.randint(0, 99999), [p, q], r if s < 0 else b, 0.008)
            branch(q, a, depth - 1, L * 0.7)
    branch(v0, 0.0, 5, 0.9)


def w07():
    base(((5.4, -8.4, 3.4), (0, 0, 1.3)), lens=38, seed=7)
    ed = mat_emit('ed', CYAN, 4)
    for i, x in enumerate((-3.0, -2.5, -2.0, 2.0, 2.5, 3.0)):
        o = box('t%d' % i, (x, 0, 1.3), (0.04, 1.8, 1.8), glass('tg%d' % i), 0.01); edges(o, ed, 0.008)
    mag = box('mag', (0, 0, 1.3), (2.4, 1.6, 1.6), glass('mg', (0.5, 0.6, 1.0), 0.2), 0.03); edges(mag, mat_emit('me', BLUE, 5), 0.012)
    for x in (-0.6, 0.0, 0.6):
        for z in (0.9, 1.7):
            o = cylinder('arrow', (x, 0, z), 0.012, 1.3, mat_emit('fa', VIOLET, 6), rot=(math.radians(90), 0, 0))
    pts = []
    for i in range(60):
        x = -3.6 + 7.2 * i / 59
        z = 1.3 if x < -1.2 else (1.3 + 0.12 * (x + 1.2) ** 2 if x < 1.2 else 1.3 + 0.12 * 2.4 ** 2 + 0.58 * (x - 1.2))
        pts.append((x, 0, z - 0.35))
    curve_track('mu', pts, mat_emit('mu', CYAN, 14), 0.016)
    for x in (-3.0, -2.5, -2.0, 2.0, 2.5, 3.0):
        i = min(range(60), key=lambda k: abs(pts[k][0] - x)); sphere('h', pts[i], 0.05, mat_emit('h', GOLD, 50), 12)


def w08():
    base(((6.0, -7.6, 3.2), (0.4, 0, 1.5)), lens=40, seed=8)
    for i in range(7):
        o = box('ev%d' % i, (-2.6 + i * 0.42, 0, 1.6), (0.03, 1.4, 1.4), glass('eg%d' % i), 0.01)
        edges(o, mat_emit('ee%d' % i, CYAN if i % 2 else BLUE, 3), 0.007)
        for k in range(4):
            sphere('pt', (-2.6 + i * 0.42, random.uniform(-0.6, 0.6), 1.6 + random.uniform(-0.6, 0.6)), 0.03, mat_emit('pt', GOLD, 30), 8)
    db = cylinder('db', (2.3, 0, 1.3), 0.75, 1.8, glass('dbg', (0.5, 0.8, 1.0)), verts=64)
    for z in (0.6, 1.3, 2.0):
        torus('ring', (2.3, 0, z), 0.76, 0.012, mat_emit('dr', CYAN, 6))
    for k in range(5):
        y = -0.5 + k * 0.25
        curve_track('flow%d' % k, [(0.4, y, 1.6), (1.1, y * 0.6, 1.5 + 0.1 * k), (1.6, y * 0.3, 1.4)], mat_emit('fl', CYAN, 8), 0.008)


def w09():
    base(((6.0, -7.4, 3.0), (0.4, 0, 1.3)), lens=42, seed=9)
    tgt = cylinder('tgt', (0.4, 0, 1.3), 0.45, 0.25, mat_pbr('t', (0.6, 0.35, 0.15), rough=0.25, metal=1.0), rot=(0, math.radians(90), 0))
    for x in (-0.6, 1.4):
        torus('coil', (x, 0, 1.3), 1.1, 0.06, mat_pbr('cu', (0.8, 0.45, 0.2), rough=0.3, metal=1.0), rot=(0, math.radians(90), 0))
        torus('glow', (x, 0, 1.3), 1.18, 0.008, mat_emit('cg', CYAN, 6), rot=(0, math.radians(90), 0))
    curve_track('beam', [(-3.6, 0, 1.3), (0.3, 0, 1.3)], mat_emit('mu', CYAN, 16), 0.02)
    sphere('stop', (0.3, 0, 1.3), 0.07, mat_emit('st', GOLD, 50))
    for k in range(5):
        a = random.uniform(0, 6.28)
        curve_track('e%d' % k, [(0.3, 0, 1.3), (0.3 + 1.8 * math.cos(a) * 0.5, 1.6 * math.sin(a), 1.3 + 1.6 * math.cos(a))], mat_emit('ep', BLUE, 10), 0.01)


def w10():
    base(((6.2, -6.8, 2.8), (0, 0, 1.4)), lens=42, seed=10)
    curve_track('Baxis', [(0, -2.2, 1.4), (0, 2.2, 1.4)], mat_emit('B', VIOLET, 8), 0.02)
    cylinder('tip', (0, 2.25, 1.4), 0.06, 0.18, mat_emit('B2', VIOLET, 8), rot=(math.radians(90), 0, 0))
    pts = []
    for i in range(240):
        t = i / 239 * 4 * math.pi
        pts.append((1.1 * math.cos(t), -2.0 + 4.0 * i / 239, 1.4 + 1.1 * math.sin(t)))
    curve_track('helix', pts, mat_emit('sp', CYAN, 10), 0.012)
    for i in range(0, 240, 30):
        p = pts[i]; curve_track('spin%d' % i, [(0, p[1], 1.4), p], mat_emit('sv', GOLD, 12), 0.01)
        sphere('tipb', p, 0.04, mat_emit('st', GOLD, 40), 10)


def w11():
    base(((0.0, -9.0, 2.4), (0, 0, 2.0)), lens=38, seed=11)
    lvl = [[(0, 3.6)], [(-2.0, 2.6), (2.0, 2.6)], [(-3.0, 1.6), (-1.0, 1.6), (1.0, 1.6), (3.0, 1.6)], [(-3.4, 0.6), (-2.6, 0.6), (-1.4, 0.6), (-0.6, 0.6), (0.6, 0.6), (1.4, 0.6), (2.6, 0.6), (3.4, 0.6)]]
    node = mat_emit('n', CYAN, 10); bad = mat_emit('bad', RED, 30); line = mat_emit('ln', BLUE, 5)
    for i in range(1, len(lvl)):
        for j, (x, z) in enumerate(lvl[i]):
            px, pz = lvl[i - 1][j // 2]
            curve_track('e', [(px, 0, pz), (x, 0, z)], line, 0.01)
    for i, L in enumerate(lvl):
        for j, (x, z) in enumerate(L):
            sphere('n', (x, 0, z), 0.13 if (i, j) != (3, 5) else 0.17, bad if (i, j) in ((3, 5), (2, 2), (1, 1), (0, 0)) and (i, j) == (3, 5) else node, 24)
    # the path to the culprit glows
    path = [(0, 3.6), (2.0, 2.6), (1.0, 1.6), (1.4, 0.6)]
    curve_track('path', [(x, -0.02, z) for x, z in path], mat_emit('pth', GOLD, 14), 0.02)


def w12():
    base(((7.4, -8.6, 3.2), (-0.4, 0, 1.2)), lens=36, seed=12)
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0.6))
    hill = bpy.context.active_object
    m = hill.modifiers.new('sub', 'SUBSURF'); m.levels = 5; m.render_levels = 5; m.subdivision_type = 'SIMPLE'
    tex = bpy.data.textures.new('hn', 'CLOUDS'); tex.noise_scale = 1.6
    d = hill.modifiers.new('disp', 'DISPLACE'); d.texture = tex; d.strength = 0.6
    bpy.ops.object.modifier_apply(modifier='sub'); bpy.ops.object.modifier_apply(modifier='disp')
    for v in hill.data.vertices:
        r2 = v.co.x ** 2 + v.co.y ** 2
        v.co.z += 2.2 * math.exp(-r2 / 6.0)
    hill.data.materials.append(mat_pbr('hill', (0.35, 0.45, 0.7), rough=0.35, trans=0.9, ior=1.2))
    bpy.ops.object.shade_smooth()
    wire = edges(hill, mat_emit('hw', BLUE, 2.2), 0.004)
    sphere('void', (0.5, 0.2, 1.7), 0.42, mat_emit('vd', GOLD, 2.5))
    tel = plane_detector('tel', -0.05, (1.2, 1.2), 0.05, glass(), mat_emit('te', CYAN, 6), at=(0.3, 0.6))
    for k in range(9):
        x0, y0 = random.uniform(-2.5, 3.0), random.uniform(-1.5, 2.0)
        curve_track('mu%d' % k, [(x0, y0, 6.5), (0.3 + random.uniform(-0.4, 0.4), 0.6 + random.uniform(-0.4, 0.4), -0.05)], mat_emit('mu%d' % k, CYAN, 10), 0.01)


SCENES = dict(primer=primer, setup=setup, w01=w01, w02=w02, w03=w03, w04=w04, w05=w05, w06=w06, w07=w07, w08=w08, w09=w09, w10=w10, w11=w11, w12=w12)
for k in KEYS:
    SCENES[k]()
    bloom(0.5, 0.85, 0.6)
    render('%s/%s.png' % (OUT, k))
