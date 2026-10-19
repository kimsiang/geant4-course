"""Render media/week09-musrsim.gif: a musrSim macro builds its geometry line by line
(tf_musr.mac, half-lengths drawn to scale), then a lifetime histogram fills from the
SYNTHETIC t1 file written by code/week09/make_synthetic_t1.py (labelled as such).
Usage: python3 tools/make_week09_gif.py
"""
import math
import sys
from pathlib import Path

import numpy as np
import uproot
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "media" / "week09-musrsim.gif"
with uproot.open(ROOT / "code" / "week09" / "data" / "musrSim_201.root") as f:
    d = f["t1"].arrays(["muDecayTime", "muDecayDetID"], library="np")
T = d["muDecayTime"][(d["muDecayDetID"] == 201) & (d["muDecayTime"] > 0)]

LINES = [
    ("/musr/command construct box World 400 400 400 G4_AIR ... dead -1", ("World", 400, 400, 0, 0, False)),
    ("/musr/command construct box Target 15 15 3 G4_Cu 0 0 0 log_World ... dead 5", ("Target", 3, 15, 0, 0, False)),
    ("/musr/command construct box CounterU 40 3 40 ... 0 45 0 log_World ... ScintSD 11", ("CounterU", 40, 3, 0, 45, True)),
    ("/musr/command construct box CounterD 40 3 40 ... 0 -45 0 log_World ... ScintSD 1", ("CounterD", 40, 3, 0, -45, True)),
    ("/musr/command globalfield TF 400 400 400 uniform ... 0.01 0 0", None),
    ("/run/beamOn 200000", None),
]
W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, NEG, NEU, HISTC = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#D1323B", "#23935A", "#2C55E0"
DBG, DFG, DMUTED, HIT, BLUE = "#10161B", "#DCE3E8", "#8FA0AC", "#F2D06B", "#7393FF"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 12)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)


def frame(nl, nev):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), "$ ../musrSim tf_musr.mac", font=mono, fill=NEG)
    g.text((28, 50), "One text file is the experiment:", font=head, fill=FG)
    g.text((28, 88), "geometry, beam, field, output.", font=head, fill=FG)
    top, bot = 150, 560
    g.rectangle([20, top, W - 20, bot], fill=DBG)
    for i, (txt, _) in enumerate(LINES[:nl]):
        g.text((32, top + 10 + 17 * i), txt, font=mono_s, fill=DFG if i == nl - 1 else DMUTED)
    s = 0.38
    cx, cy = W / 2, top + 245
    if nl >= 5:
        g.rectangle([cx - 400 * s, cy - 125, cx + 400 * s, cy + 125], fill=(22, 32, 52))
        g.text((cx + 400 * s - 6, cy + 106), "B = 10 mT along x", font=mono_s, fill=DMUTED, anchor="ra")
    for (txt, v) in LINES[:nl]:
        if not v:
            continue
        name, hz, hx, z, x, sens = v
        if name == "World":
            g.rectangle([cx - hz * s, cy - 125, cx + hz * s, cy + 125], outline=(110, 118, 125))
            g.text((cx - hz * s + 6, cy - 121), "World 800 mm (half 400), z → y ↑", font=mono_s, fill=DMUTED)
            continue
        box = [cx + (z - hz) * s * 3, cy - (x + hx) * s * 3, cx + (z + hz) * s * 3, cy - (x - hx) * s * 3]
        g.rectangle(box, fill=(40, 60, 110) if sens else (70, 76, 82), outline=BLUE if sens else (200, 205, 210))
        g.text((box[2] + 6, (box[1] + box[3]) / 2 - 7), f"{name}  ID {'11' if name == 'CounterU' else '1' if name == 'CounterD' else '5'}", font=mono_s, fill=BLUE if sens else DFG)
    if nl >= 2:
        g.text((32, bot - 22), "inner boxes drawn x3 for visibility; numbers are HALF-lengths in mm", font=mono_s, fill=DMUTED)
    L0, R0, T0, B0 = 80, W - 30, 610, 820
    g.rectangle([20, 596, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    if nev:
        tt = T[:nev]
        bins, edges = np.histogram(tt, bins=60, range=(0, 12))
        mx = max(5, bins.max()) * 1.18
        bw = (R0 - L0) / 60
        pts = [(L0, B0)]
        for i, c in enumerate(bins):
            y = B0 - c / mx * (B0 - T0)
            pts += [(L0 + i * bw, y), (L0 + (i + 1) * bw, y)]
        pts.append((R0, B0))
        g.polygon(pts, fill=(222, 229, 251))
        g.line(pts, fill=HISTC, width=2)
        prev = None
        n0 = len(tt) * 0.2 / 2.197
        for k in range(121):
            t = 12 * k / 120
            y = B0 - n0 * math.exp(-t / 2.197) / mx * (B0 - T0)
            if prev and k % 2:
                g.line([prev, (L0 + t / 12 * (R0 - L0), y)], fill=NEU, width=2)
            prev = (L0 + t / 12 * (R0 - L0), y)
        g.text((R0 - 8, T0 + 8), f"Entries {len(tt)}   mean {tt.mean():.3f} us", font=mono_s, fill=FG, anchor="ra")
        g.text((R0 - 8, T0 + 26), "- - exp(-t / 2.197 us)", font=mono_s, fill=NEU, anchor="ra")
    for v in range(0, 13, 2):
        x = L0 + v / 12 * (R0 - L0)
        g.line([(x, B0), (x, B0 - 7)], fill=FRAME)
        g.text((x, B0 + 6), str(v), font=mono_s, fill=MUTED, anchor="ma")
    g.text((R0, B0 + 24), "muDecayTime [us], muDecayDetID == 201", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 8, T0 + 8), "SYNTHETIC t1 file (make_synthetic_t1.py)", font=mono_s, fill=MUTED)
    g.text((28, 872), "Geant4 2.0 · Week 09 · musrSim and the t1 tree", font=mono_s, fill=MUTED)
    return im


def main():
    frames = [frame(n, 0) for n in range(1, len(LINES) + 1)]
    for nev in (50, 150, 400, 1000, 2500, 6000, 12000, len(T)):
        frames.append(frame(len(LINES), nev))
    dur = [900] * len(LINES) + [350] * 7 + [2600]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
