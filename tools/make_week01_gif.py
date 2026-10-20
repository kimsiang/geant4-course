"""Render media/week01-telescope.gif: toy two-layer telescope + 1/sqrt(N) convergence.

TOY MODEL (same as week01.js): isotropic downward directions, straight lines in vacuum,
zero-thickness square layers, L = 0.3 m, d = 0.5 m. Run: python3 tools/make_week01_gif.py
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "media" / "week01-telescope.gif"
W, H = 720, 900
L, D, SEED = 0.3, 0.5, 20261018
EPS_REF = 0.04901  # numerical integral of the same model

SUP = {-2: "⁻²", -1: "⁻¹", 0: "⁰", 2: "²", 3: "³", 4: "⁴", 5: "⁵"}
BG, PANEL, FG, MUTED, FRAME = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A"
DBG, DFG, DMUTED = "#10161B", "#DCE3E8", "#8FA0AC"
RED, BLUE, HIT, NEU, NEG = "#FF6369", "#7393FF", "#F2D06B", "#23935A", "#D1323B"

FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)
head_s = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 22)

rng = np.random.default_rng(SEED)
NMAX = 100_000
c = rng.uniform(0, 1, NMAX)
phi = rng.uniform(0, 2 * np.pi, NMAX)
x0 = rng.uniform(-L / 2, L / 2, NMAX)
y0 = rng.uniform(-L / 2, L / 2, NMAX)
q = np.where(rng.uniform(0, 1, NMAX) < 0.56, 1, -1)
t = np.sqrt(1 - c * c) / np.maximum(c, 1e-12)
x1 = x0 + D * t * np.cos(phi)
y1 = y0 + D * t * np.sin(phi)
hit = (np.abs(x1) < L / 2) & (np.abs(y1) < L / 2)
cum = np.cumsum(hit)

schedule = np.unique(np.round(np.logspace(2, 5, 37)).astype(int))


def blend(hex_a, hex_b, a):
    ca = [int(hex_a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(hex_b[i:i + 2], 16) for i in (1, 3, 5)]
    return tuple(round(ca[i] * a + cb[i] * (1 - a)) for i in range(3))


def frame(n, pts):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    # title block
    g.text((28, 22), "Idle> /run/beamOn " + f"{n:,}", font=mono, fill=NEG)
    g.text((28, 50), "Ten times the data is not", font=head, fill=FG)
    g.text((28, 88), "ten times the precision.", font=head, fill=FG)
    # event display, drawn on its own layer so tracks are clipped to the box
    top, bot = 150, 540
    disp = Image.new("RGB", (W - 40, bot - top), DBG)
    full, g = g, ImageDraw.Draw(disp)
    ox, oy = 20, top
    top, bot = 0, bot - top
    g.text((34, top + 10), "TOY MODEL · not Geant4", font=mono_s, fill=HIT)
    g.text((W - 54, top + 10), f"{n:,} tracks", font=mono_s, fill=DMUTED, anchor="ra")
    s = 300 / D * 0.75
    cx, yU = (W - 40) / 2, top + 128
    yD = yU + D * s
    for y, lab in ((yU, "upper layer"), (yD, "lower layer")):
        g.rectangle([cx - L / 2 * s, y - 3, cx + L / 2 * s, y + 3], fill=(30, 40, 60), outline=(120, 128, 135))
        g.text((cx + L / 2 * s + 10, y - 8), lab, font=mono_s, fill=DMUTED)
    g.text((cx - L / 2 * s - 18, (yU + yD) / 2 - 8), "d = 0.50 m", font=mono_s, fill=DMUTED, anchor="ra")
    g.text((cx, yD + 22), "L = 0.30 m", font=mono_s, fill=DMUTED, anchor="ma")
    lo = max(0, n - 40)
    ext = 30 / s
    for i in range(lo, n):
        slope = t[i] * math.cos(phi[i])
        xa, xb = x0[i] - ext * slope, x1[i] + (ext * slope if hit[i] else 0)
        col = RED if q[i] < 0 else BLUE
        a = 0.95 if hit[i] else 0.30
        rgb = blend(col, DBG, a)
        p0 = (cx + xa * s, yU - 30)
        p1 = (cx + xb * s, yD + (30 if hit[i] else 0))
        if hit[i]:
            g.line([p0, p1], fill=rgb, width=2)
        else:  # dashed
            seg = 10
            dx, dy = p1[0] - p0[0], p1[1] - p0[1]
            ln = math.hypot(dx, dy)
            k = 0.0
            while k < ln:
                e = min(k + seg / 2, ln)
                g.line([(p0[0] + dx * k / ln, p0[1] + dy * k / ln), (p0[0] + dx * e / ln, p0[1] + dy * e / ln)], fill=rgb, width=1)
                k += seg
        g.ellipse([cx + x0[i] * s - 2, yU - 2, cx + x0[i] * s + 2, yU + 2], fill=HIT)
        if hit[i]:
            g.ellipse([cx + x1[i] * s - 2, yD - 2, cx + x1[i] * s + 2, yD + 2], fill=HIT)
    k = int(cum[n - 1])
    eps = k / n
    sig = math.sqrt(eps * (1 - eps) / n) if 0 < k < n else 0
    g.rectangle([10, 34, 300, 112], fill=DBG)
    g.text((14, 38), f"k   = {k:,}", font=mono, fill=DFG)
    g.text((14, 58), f"eps = {eps:.4f} +/- {sig:.4f}", font=mono, fill=DFG)
    g.text((14, 78), f"ref = {EPS_REF:.4f} (integral)", font=mono, fill=DMUTED)
    im.paste(disp, (ox, oy))
    g = full
    # convergence plot (ROOT-style frame, inward ticks)
    L0, R0, T0, B0 = 96, W - 30, 580, 800
    g.rectangle([20, 560, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    lx0, lx1, ly0, ly1 = 2, 5, -2, 0

    def X(v):
        return L0 + (math.log10(v) - lx0) / (lx1 - lx0) * (R0 - L0)

    def Y(v):
        return B0 - (math.log10(v) - ly0) / (ly1 - ly0) * (B0 - T0)
    # theory line (dashed green)
    prev = None
    for j in range(0, 81):
        nv = 10 ** (lx0 + j / 80 * (lx1 - lx0))
        yv = math.sqrt((1 - EPS_REF) / (EPS_REF * nv))
        p = (X(nv), Y(min(max(yv, 1e-2), 1)))
        if prev and j % 2:
            g.line([prev, p], fill=NEU, width=2)
        prev = p
    g.text((R0 - 8, T0 + 8), "- - 1/√N", font=mono_s, fill=NEU, anchor="ra")
    for i, (nv, rv) in enumerate(pts):
        r = 5 if i == len(pts) - 1 else 3
        g.ellipse([X(nv) - r, Y(rv) - r, X(nv) + r, Y(rv) + r], fill=NEG if i == len(pts) - 1 else FG)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for e in range(lx0, lx1 + 1):
        tx = X(10 ** e)
        g.line([(tx, B0), (tx, B0 - 8)], fill=FRAME)
        g.text((tx, B0 + 6), "10" + SUP[e], font=mono_s, fill=MUTED, anchor="ma")
        if e < lx1:
            for m in range(2, 10):
                mx = X(m * 10 ** e)
                g.line([(mx, B0), (mx, B0 - 4)], fill=FRAME)
    for e in range(ly0, ly1 + 1):
        ty = Y(10 ** e)
        g.line([(L0, ty), (L0 + 8, ty)], fill=FRAME)
        g.text((L0 - 8, ty - 7), "10" + SUP[e], font=mono_s, fill=MUTED, anchor="ra")
    g.text((R0, B0 + 26), "events N", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 10, T0 + 8), "sigma/eps", font=mono_s, fill=MUTED)
    g.text((28, 872), "From Track to Truth · Week 01 · Monte Carlo primer", font=mono_s, fill=MUTED)
    return im


def main():
    frames, pts = [], []
    for n in schedule:
        k = int(cum[n - 1])
        e = k / n
        if 0 < k < n:
            pts.append((n, math.sqrt(e * (1 - e) / n) / e))
        frames.append(frame(int(n), list(pts)))
    durations = [140] * len(frames)
    durations[-1] = 2600
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=durations, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
