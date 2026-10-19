"""Render media/week07-spectrometer.gif from REAL Geant4 11.4.p01 output.

Input: the tracks_*GeV_nt_tracks.csv files written by ./week07 spectrometer.mac
(course test physics list). The six dots per track are Geant4 plane crossings; the
curve inside the magnet is drawn through the intersection of the two straight-line fits.
Lower panel: sigma_p/p from reconstruct.py (50 um smearing) and the analytic estimate.
Usage: python3 tools/make_week07_gif.py <dir with csv files>
"""
import glob
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "media" / "week07-spectrometer.gif"
SRC = Path(sys.argv[1])
RES = [(1.101, 0.0040), (2.103, 0.0031), (5.105, 0.0042), (10.105, 0.0064), (20.105, 0.0113)]
W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, NEG, NEU = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#D1323B", "#23935A"
DBG, DMUTED, HIT, RED, AMBER = "#10161B", "#8FA0AC", "#F2D06B", "#FF6369", "#E2B04A"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)


def load(gev):
    d = np.loadtxt(SRC / f"tracks_{gev:02d}GeV_nt_tracks.csv", delimiter=",", comments="#")
    return d[:, 0], d[:, 2:8] / 1000.0, d[:, 8:14] / 1000.0


def fit(z, x):
    a, b = np.polyfit(z, x, 1)
    return a, b


def analytic(p):
    d = 0.2998 * 1.5 / p
    meas = math.sqrt(2) * 50e-6 / math.sqrt(0.08) / d
    hl = lambda xx: 0.0136 / p * math.sqrt(xx) * (1 + 0.038 * math.log(xx))
    ms = math.sqrt(4 * hl(0.0003 / 0.0937) ** 2 + hl(1.2 / 303.9) ** 2) / d
    return math.hypot(meas, ms)


def frame(gev, tracks, npts):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), f"Idle> /gun/energy {gev} GeV   /run/beamOn 1000", font=mono, fill=NEG)
    g.text((28, 50), "Bend the particle:", font=head, fill=FG)
    g.text((28, 88), "momentum from curvature.", font=head, fill=FG)
    top, bot = 150, 560
    disp = Image.new("RGB", (W - 40, bot - top), DBG)
    d = ImageDraw.Draw(disp)
    dw, dh = disp.size
    sx = (dw - 40) / 2.5
    sy = (dh - 70) / 0.5
    Z = lambda z: 20 + (z + 1.25) * sx
    X = lambda x: 40 + (0.45 - x) * sy * 0.9 + 10
    d.rectangle([Z(-0.5), 30, Z(0.5), dh - 30], fill=(22, 32, 52))
    d.text((Z(0) - 70, 36), "B = 1.5 T (y)", font=mono_s, fill=DMUTED)
    for zp in (-1.0, -0.8, -0.6, 0.6, 0.8, 1.0):
        d.line([(Z(zp), 30), (Z(zp), dh - 30)], fill=(120, 128, 135), width=1)
    d.text((14, 8), "Geant4 11.4 plane crossings · top view z →, x ↑", font=mono_s, fill=HIT)
    for i, (z, x) in enumerate(tracks):
        a1, b1 = fit(z[:3], x[:3])
        a2, b2 = fit(z[3:], x[3:])
        zc = (b2 - b1) / (a1 - a2) if a1 != a2 else 0.0
        pts = [(Z(-1.2), X(a1 * -1.2 + b1)), (Z(-0.5), X(a1 * -0.5 + b1))]
        p0, pc, p2 = (-0.5, a1 * -0.5 + b1), (zc, a1 * zc + b1), (0.5, a2 * 0.5 + b2)
        for k in range(1, 21):
            t = k / 20
            zz = (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * pc[0] + t * t * p2[0]
            xx = (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * pc[1] + t * t * p2[1]
            pts.append((Z(zz), X(xx)))
        pts.append((Z(1.2), X(a2 * 1.2 + b2)))
        last = i == len(tracks) - 1
        d.line(pts, fill=RED if last else (120, 60, 66), width=2 if last else 1)
        if last:
            for zi, xi in zip(z, x):
                d.ellipse([Z(zi) - 3, X(xi) - 3, Z(zi) + 3, X(xi) + 3], fill=HIT)
    d.text((14, dh - 24), f"p = {gev} GeV/c   deflection = {1000 * 0.2998 * 1.5 / (gev + 0.106):.0f} mrad", font=mono, fill="#DCE3E8")
    im.paste(disp, (20, top))
    # resolution panel
    L0, R0, T0, B0 = 90, W - 30, 610, 820
    g.rectangle([20, 596, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    lx = lambda p: L0 + (math.log10(p) - math.log10(0.5)) / (math.log10(50) - math.log10(0.5)) * (R0 - L0)
    ly = lambda v: B0 - (math.log10(v) + 3.3) / 2.0 * (B0 - T0)
    prev = None
    for k in range(0, 61):
        p = 10 ** (math.log10(0.5) + k / 60 * 2)
        q = (lx(p), ly(analytic(p)))
        if prev and k % 2:
            g.line([prev, q], fill=NEU, width=2)
        prev = q
    for j, (p, r) in enumerate(RES[:npts]):
        rr = 5 if j == npts - 1 else 4
        g.ellipse([lx(p) - rr, ly(r) - rr, lx(p) + rr, ly(r) + rr], fill=NEG if j == npts - 1 else FG)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for p, lab in ((0.5, "0.5"), (1, "1"), (2, "2"), (5, "5"), (10, "10"), (20, "20"), (50, "50")):
        g.line([(lx(p), B0), (lx(p), B0 - 7)], fill=FRAME)
        g.text((lx(p), B0 + 6), lab, font=mono_s, fill=MUTED, anchor="ma")
    for v, lab in ((0.001, "0.1%"), (0.003, "0.3%"), (0.01, "1%"), (0.03, "3%")):
        if T0 <= ly(v) <= B0:
            g.line([(L0, ly(v)), (L0 + 7, ly(v))], fill=FRAME)
            g.text((L0 - 8, ly(v) - 7), lab, font=mono_s, fill=MUTED, anchor="ra")
    g.text((R0, B0 + 24), "p [GeV/c]", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 10, T0 + 8), "sigma_p / p (50 um planes)", font=mono_s, fill=MUTED)
    g.text((R0 - 8, T0 + 8), "- - measurement + scattering", font=mono_s, fill=NEU, anchor="ra")
    g.text((28, 872), "Geant4 2.0 · Week 07 · Momentum from a magnetic field", font=mono_s, fill=MUTED)
    return im


def main():
    frames = []
    for n, gev in enumerate((1, 2, 5, 10, 20)):
        p, x, z = load(gev)
        for k in range(1, 9):
            tr = [(z[i], x[i]) for i in range(max(0, 2 * k - 12), 2 * k)]
            frames.append(frame(gev, tr, n + 1))
    dur = [180] * len(frames)
    dur[-1] = 2600
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
