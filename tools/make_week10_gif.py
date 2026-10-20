"""Render media/week10-musr.gif from REAL Geant4 11.4.p01 output (week10 app, tf.mac at 10 mT,
G4SpinDecayPhysics, course test physics list). Top: the muon spin precessing about B with the
positron emission lobe; bottom: the asymmetry A(t) emerging from noise as muons accumulate.
Usage: python3 tools/make_week10_gif.py <run dir containing data/tf_10mT.root>
"""
import math
import sys
from pathlib import Path

import awkward as ak
import numpy as np
import uproot
from PIL import Image, ImageDraw, ImageFont
from scipy.optimize import curve_fit

OUT = Path(__file__).resolve().parent.parent / "media" / "week10-musr.gif"
D = uproot.open(Path(sys.argv[1]) / "data" / "tf_10mT.root")["t1"].arrays(["det_ID", "muDecayTime", "muDecayDetID"], library="ak")
D = D[(D.muDecayDetID == 5) & (D.muDecayTime > 0)]
T = np.asarray(D.muDecayTime)
U = np.asarray(ak.any(D.det_ID == 11, axis=1))
DN = np.asarray(ak.any(D.det_ID == 1, axis=1))
NTOT = len(T)
GAM, F0 = 135.5388, 1.355388

W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, NEG, NEU, POS = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#D1323B", "#23935A", "#2C55E0"
DBG, DFG, DMUTED, BLUE, RED, GREEN, YEL = "#10161B", "#DCE3E8", "#8FA0AC", "#7393FF", "#FF6369", "#4FC98A", "#F2D06B"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 12)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)


def osc(t, A0, f, phi, lam):
    return A0 * np.exp(-lam * t) * np.sin(2 * np.pi * f * t + phi)


def asym(n):
    bins = np.linspace(0, 10, 101)
    nu, _ = np.histogram(T[:n][U[:n]], bins=bins)
    nd, _ = np.histogram(T[:n][DN[:n]], bins=bins)
    tot = nu + nd
    ok = tot > 5
    a = np.zeros_like(tot, dtype=float)
    e = np.zeros_like(a)
    a[ok] = (nd[ok] - nu[ok]) / tot[ok]
    e[ok] = np.sqrt((1 - a[ok] ** 2) / tot[ok])
    return 0.5 * (bins[:-1] + bins[1:]), a, e, ok


def frame(n, tdisp, fitp=None):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), "$ ./week10 tf.mac        # B = 10 mT along x", font=mono, fill=NEG)
    g.text((28, 50), "A spinning muon is a compass", font=head, fill=FG)
    g.text((28, 88), "you can read from outside.", font=head, fill=FG)
    top, bot = 150, 520
    g.rectangle([20, top, W - 20, bot], fill=DBG)
    cx, cy, sc = W / 2, (top + bot) / 2, 3.2
    for yy, col, lab in ((45, BLUE, "CounterU  ID 11"), (-45, RED, "CounterD  ID 1")):
        g.rectangle([cx - 40 * sc, cy - (yy + 3) * sc, cx + 40 * sc, cy - (yy - 3) * sc], outline=col, fill=(30, 40, 70) if col == BLUE else (70, 30, 36))
        g.text((cx + 40 * sc + 8, cy - yy * sc - 7), lab, font=mono_s, fill=col)
    g.rectangle([cx - 3 * sc, cy - 15 * sc, cx + 3 * sc, cy + 15 * sc], fill=(120, 126, 132))
    g.line([(20, cy), (cx - 3 * sc, cy)], fill=YEL, width=2)
    g.text((32, cy - 22), "mu+ 29.8 MeV/c", font=mono_s, fill=YEL)
    w = 2 * math.pi * F0 * tdisp
    sy, sz = -math.sin(w), -math.cos(w)
    pts = []
    for k in range(121):
        th = 2 * math.pi * k / 120
        ny, nz = math.sin(th), math.cos(th)
        rr = 26 * sc * (1 + (1 / 3) * (sy * ny + sz * nz))
        pts.append((cx + rr * nz, cy - rr * ny))
    g.polygon(pts, outline=GREEN, fill=(24, 58, 44))
    g.rectangle([cx - 3 * sc, cy - 15 * sc, cx + 3 * sc, cy + 15 * sc], fill=(120, 126, 132))
    g.text((cx + 6, cy + 15 * sc + 4), "Cu target  ID 5", font=mono_s, fill=DMUTED)
    L = 30 * sc
    ex, ey = cx + L * sz, cy - L * sy
    g.line([(cx, cy), (ex, ey)], fill=DFG, width=4)
    an = math.atan2(ey - cy, ex - cx)
    g.polygon([(ex, ey), (ex - 14 * math.cos(an - 0.45), ey - 14 * math.sin(an - 0.45)), (ex - 14 * math.cos(an + 0.45), ey - 14 * math.sin(an + 0.45))], fill=DFG)
    g.text((32, top + 10), f"t = {tdisp:4.2f} us   spin turned {math.degrees(w) % 360:5.1f} deg", font=mono_s, fill=DFG)
    g.text((32, bot - 22), "B (+x) out of the page; green: positron emission 1 + (1/3) cos(theta)", font=mono_s, fill=DMUTED)
    # asymmetry panel
    L0, R0, T0, B0 = 80, W - 30, 570, 820
    g.rectangle([20, 552, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    lo, hi = -0.45, 0.45
    yz = B0 - (0 - lo) / (hi - lo) * (B0 - T0)
    g.line([(L0, yz), (R0, yz)], fill=(214, 216, 214))
    if n:
        tc, a, e, ok = asym(n)
        for t, av, ev, o in zip(tc, a, e, ok):
            if not o:
                continue
            px = L0 + t / 10 * (R0 - L0)
            y1 = B0 - (min(hi, av + ev) - lo) / (hi - lo) * (B0 - T0)
            y2 = B0 - (max(lo, av - ev) - lo) / (hi - lo) * (B0 - T0)
            g.line([(px, y1), (px, y2)], fill=MUTED)
            py = B0 - (max(lo, min(hi, av)) - lo) / (hi - lo) * (B0 - T0)
            g.rectangle([px - 2, py - 2, px + 2, py + 2], fill=FG)
    if fitp is not None:
        prev = None
        for k in range(601):
            t = 10 * k / 600
            p = (L0 + t / 10 * (R0 - L0), B0 - (osc(t, *fitp[0]) - lo) / (hi - lo) * (B0 - T0))
            if prev:
                g.line([prev, p], fill=POS, width=2)
            prev = p
        g.rectangle([R0 - 330, T0 + 4, R0 - 2, T0 + 44], fill=PANEL, outline=FRAME)
        g.text((R0 - 8, T0 + 8), f"f = {fitp[0][1]:.4f} +/- {fitp[1]:.4f} MHz", font=mono_s, fill=FG, anchor="ra")
        g.text((R0 - 8, T0 + 26), f"B = f / 135.5388 = {fitp[0][1] / GAM * 1000:.2f} +/- {fitp[1] / GAM * 1000:.2f} mT", font=mono_s, fill=POS, anchor="ra")
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for v in range(0, 11, 2):
        x = L0 + v / 10 * (R0 - L0)
        g.line([(x, B0), (x, B0 - 7)], fill=FRAME)
        g.text((x, B0 + 6), str(v), font=mono_s, fill=MUTED, anchor="ma")
    for v in (-0.4, -0.2, 0.0, 0.2, 0.4):
        y = B0 - (v - lo) / (hi - lo) * (B0 - T0)
        g.line([(L0, y), (L0 + 7, y)], fill=FRAME)
        g.text((L0 - 6, y - 7), f"{v:+.1f}", font=mono_s, fill=MUTED, anchor="ra")
    g.rectangle([L0 + 2, T0 + 4, L0 + 290, T0 + 22], fill=PANEL)
    g.text((L0 + 8, T0 + 8), f"A(t), muons: {n:,}", font=mono_s, fill=MUTED)
    g.text((R0, B0 + 22), "A = (N_D - N_U)/(N_D + N_U) vs decay time [us] · Geant4 11.4 + G4SpinDecayPhysics", font=mono_s, fill=MUTED, anchor="ra")
    g.text((28, 872), "From Track to Truth · Week 10 · Make the muon spin visible", font=mono_s, fill=MUTED)
    return im


def main():
    tc, a, e, ok = asym(NTOT)
    sel = e > 0
    popt, pcov = curve_fit(osc, tc[sel], a[sel], p0=[0.25, 1.35, 0, 0.02], sigma=e[sel], absolute_sigma=True)
    fitp = (popt, math.sqrt(pcov[1, 1]))
    frames, dur = [], []
    ns = [0, 300, 1000, 3000, 8000, 20000, 50000, 100000, NTOT]
    for i, n in enumerate(ns):
        frames.append(frame(n, 0.09 * i))
        dur.append(420)
    for j in range(8):
        frames.append(frame(NTOT, 0.09 * (len(ns) + j), fitp))
        dur.append(260)
    dur[-1] = 2600
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", f"f={popt[1]:.4f}", file=sys.stderr)


if __name__ == "__main__":
    main()
