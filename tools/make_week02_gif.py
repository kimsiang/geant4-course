"""Render media/week02-pions.gif from REAL Geant4 11.4.p01 output.

Input: code/week02/pion_tracks.json, parsed from `./week02 pion.mac` (/tracking/verbose 1),
run with a decay-only physics list in the 3 m G4_Galactic world (1000 pi-, 100 MeV, from z = -1 m).
Side view: z horizontal, x vertical. Run: python3 tools/make_week02_gif.py
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "media" / "week02-pions.gif"
EV = json.loads((ROOT / "code" / "week02" / "pion_tracks.json").read_text())

W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A"
DBG, DFG, DMUTED = "#10161B", "#DCE3E8", "#8FA0AC"
RED, BLUE, GREEN, HIT, NEU, NEG = "#FF6369", "#7393FF", "#4FC98A", "#F2D06B", "#23935A", "#D1323B"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)
HALF = 1500.0
LAM = 10888.0           # beta*gamma*c*tau for a 100 MeV pi-, mm
PRED = 1 - math.exp(-2500.0 / LAM)


def colour(name):
    if "nu" in name or name == "gamma":
        return GREEN
    return BLUE if name.endswith("+") else RED


def blend(hex_a, hex_b, a):
    ca = [int(hex_a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(hex_b[i:i + 2], 16) for i in (1, 3, 5)]
    return tuple(round(ca[i] * a + cb[i] * (1 - a)) for i in range(3))


def dashed(g, p0, p1, fill, seg=8):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    ln = math.hypot(dx, dy) or 1
    k = 0.0
    while k < ln:
        e = min(k + seg / 2, ln)
        g.line([(p0[0] + dx * k / ln, p0[1] + dy * k / ln), (p0[0] + dx * e / ln, p0[1] + dy * e / ln)], fill=fill, width=1)
        k += seg


def frame(n, pts):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), f"Idle> /run/beamOn {n}", font=mono, fill=NEG)
    g.text((28, 50), "One event, many tracks:", font=head, fill=FG)
    g.text((28, 88), "a pion decays in flight.", font=head, fill=FG)
    top, bot = 150, 560
    disp = Image.new("RGB", (W - 40, bot - top), DBG)
    d = ImageDraw.Draw(disp)
    dw, dh = disp.size
    s = (dw - 60) / (2 * HALF)
    cx, cy = dw / 2, dh / 2 - 18
    XC = 600.0  # crop the view at |x| < 0.6 m (the world itself extends to 1.5 m)
    box = [cx - HALF * s, cy - XC * s, cx + HALF * s, cy + XC * s]
    lay = Image.new("RGB", (int(box[2] - box[0]) + 1, int(box[3] - box[1]) + 1), DBG)
    dl = ImageDraw.Draw(lay)
    d.text((14, 10), "Geant4 11.4 output · decay-only physics", font=mono_s, fill=HIT)
    lo = max(0, n - 30)
    for i in range(lo, n):
        a = 0.35 + 0.65 * (i - lo + 1) / (n - lo)
        for t in EV[i]["tracks"]:
            (x0, y0, z0), (x1, y1, z1) = t["xyz"]
            p0 = (cx + z0 * s - box[0], cy - x0 * s - box[1])
            p1 = (cx + z1 * s - box[0], cy - x1 * s - box[1])
            c = blend(colour(t["p"]), DBG, a)
            if "nu" in t["p"]:
                dashed(dl, p0, p1, c)
            else:
                dl.line([p0, p1], fill=c, width=2 if i == n - 1 else 1)
            if t["end"] == "Decay":
                dl.ellipse([p1[0] - 2.5, p1[1] - 2.5, p1[0] + 2.5, p1[1] + 2.5], fill=HIT)
    disp.paste(lay, (int(box[0]), int(box[1])))
    d.rectangle(box, outline=(110, 118, 125))
    d.text((box[0] + 6, box[1] + 4), "World (G4_Galactic), side view z → x ↑, cropped at |x| < 0.6 m", font=mono_s, fill=DMUTED)
    k = sum(1 for e in EV[:n] if len(e["tracks"]) > 1)
    f = k / n
    sg = math.sqrt(max(f * (1 - f), 1e-9) / n)
    d.rectangle([10, dh - 70, 420, dh - 6], fill=DBG)
    d.text((14, dh - 66), f"events {n:>4d}   pi- decays k = {k}", font=mono, fill=DFG)
    d.text((14, dh - 44), f"k/N = {f:.3f} +/- {sg:.3f}", font=mono, fill=DFG)
    d.text((14, dh - 22), f"predicted 1-exp(-2.5 m/10.9 m) = {PRED:.3f}", font=mono_s, fill=DMUTED)
    im.paste(disp, (20, top))
    # legend
    y = 572
    g.text((28, y), "red: pi- and mu-   green dashed: anti_nu_mu   yellow: Decay vertex", font=mono_s, fill=MUTED)
    # convergence of k/N
    L0, R0, T0, B0 = 90, W - 30, 610, 820
    g.rectangle([20, 596, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    nmax = len(EV)

    def X(v):
        return L0 + v / nmax * (R0 - L0)

    def Y(v):
        return B0 - (v - 0.0) / 0.5 * (B0 - T0)
    yp = Y(PRED)
    for xx in range(int(L0), int(R0), 10):
        g.line([(xx, yp), (xx + 5, yp)], fill=NEU, width=2)
    g.text((R0 - 6, yp - 18), f"- - {PRED:.3f}", font=mono_s, fill=NEU, anchor="ra")
    prev = None
    for (nn, ff) in pts:
        p = (X(nn), Y(ff))
        if prev:
            g.line([prev, p], fill=FG, width=1)
        prev = p
    if pts:
        g.ellipse([prev[0] - 4, prev[1] - 4, prev[0] + 4, prev[1] + 4], fill=NEG)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for v in range(0, nmax + 1, 200):
        g.line([(X(v), B0), (X(v), B0 - 8)], fill=FRAME)
        g.text((X(v), B0 + 6), str(v), font=mono_s, fill=MUTED, anchor="ma")
    for v in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5):
        g.line([(L0, Y(v)), (L0 + 8, Y(v))], fill=FRAME)
        g.text((L0 - 8, Y(v) - 7), f"{v:.1f}", font=mono_s, fill=MUTED, anchor="ra")
    g.text((R0, B0 + 24), "events N", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 10, T0 + 8), "fraction decayed k/N", font=mono_s, fill=MUTED)
    g.text((28, 872), "Geant4 2.0 · Week 02 · Run, Event, Track, Step", font=mono_s, fill=MUTED)
    return im


def main():
    sched = sorted(set([1, 2, 3, 5, 8, 12, 18, 25, 35, 50, 70, 100, 140, 200, 280, 380, 500, 650, 820, 1000]))
    pts, frames, last = [], [], 0
    for n in sched:
        for m in range(last + 1, n + 1):
            k = sum(1 for e in EV[:m] if len(e["tracks"]) > 1)
            if m % 5 == 0 or m == n:
                pts.append((m, k / m))
        last = n
        frames.append(frame(n, list(pts)))
    dur = [500] * 6 + [220] * (len(frames) - 7) + [2600]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
