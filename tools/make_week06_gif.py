"""Render media/week06-cuts.gif from our Geant4 11.4.p01 production-cut scan.

Numbers: ./week06 FTFP_BERT cuts.mac with the course test physics list, 1 GeV mu- through
10 cm of G4_Pb in vacuum, 1000 events per cut (see week06.html, step 2).
The drawn electron stubs are DECORATION: their number equals the measured mean number of
secondary electrons per event; positions and directions are random.
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "media" / "week06-cuts.gif"
SCAN = [  # cut [mm], e- threshold, e- per event, Edep [MeV], err, CPU [ms/evt]
    (10.0, "15.2 MeV", 2.387, 141.235, 0.528, 0.03),
    (0.7, "1.01 MeV", 9.354, 141.530, 0.511, 0.06),
    (0.1, "241 keV", 35.859, 141.806, 0.537, 0.13),
    (0.01, "57.9 keV", 150.667, 140.792, 0.500, 0.36),
]
W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, NEG, NEU, HISTC = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#D1323B", "#23935A", "#2C55E0"
DBG, DMUTED, HIT, RED, AMBER = "#10161B", "#8FA0AC", "#F2D06B", "#FF6369", "#E2B04A"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_b = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 20)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)


def frame(k):
    cut, thr, ne, edep, err, cpu = SCAN[k]
    rnd = random.Random(20261023 + k)
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    lab = f"{cut:g} mm"
    g.text((28, 22), f"Idle> /run/setCut {lab}   /run/beamOn 1000", font=mono, fill=NEG)
    g.text((28, 50), "More tracks, same energy:", font=head, fill=FG)
    g.text((28, 88), "what a production cut controls.", font=head, fill=FG)
    # block with electron stubs
    g.rectangle([20, 150, W - 20, 470], fill=DBG)
    bx0, bx1, by0, by1 = 90, W - 90, 200, 420
    g.rectangle([bx0, by0, bx1, by1], fill=(20, 28, 44), outline=(110, 118, 125))
    g.text((bx0 + 6, by0 + 4), f"10 cm G4_Pb   e- threshold {thr}", font=mono_s, fill=DMUTED)
    g.text((36, 162), "Geant4 11.4 numbers · stubs drawn for show", font=mono_s, fill=HIT)
    cy = (by0 + by1) / 2
    g.line([(30, cy), (W - 30, cy)], fill=AMBER, width=2)
    n = int(round(ne))
    for _ in range(n):
        x = rnd.uniform(bx0, bx1)
        L = rnd.uniform(4, 10) * (1 + 3 * rnd.random() ** 6) * (1.6 if k == 0 else 1.0)
        a = rnd.uniform(-2.6, 2.6)
        g.line([(x, cy), (x + L * math.cos(a), cy + L * math.sin(a) * 1.4)], fill=RED, width=1)
    g.text((36, 438), f"secondary e- per event: {ne:7.1f}", font=mono_b, fill=(220, 227, 232))
    # two panels: e- per event (log) and Edep (linear)
    g.rectangle([20, 490, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    # left: e- per event vs cut, log y
    L0, R0, T0, B0 = 80, 340, 520, 800
    X = lambda c: L0 + (math.log10(c) + 2) / 3 * (R0 - L0)
    Y = lambda v: B0 - (math.log10(v) - 0) / 3 * (B0 - T0)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for j in range(k + 1):
        c, _, e, *_ = SCAN[j]
        r = 6 if j == k else 4
        g.ellipse([X(c) - r, Y(e) - r, X(c) + r, Y(e) + r], fill=NEG if j == k else FG)
    for c, l in ((0.01, "0.01"), (0.1, "0.1"), (1, "1"), (10, "10")):
        g.line([(X(c), B0), (X(c), B0 - 8)], fill=FRAME)
        g.text((X(c), B0 + 6), l, font=mono_s, fill=MUTED, anchor="ma")
    for v, l in ((1, "1"), (10, "10"), (100, "100"), (1000, "1000")):
        g.line([(L0, Y(v)), (L0 + 8, Y(v))], fill=FRAME)
        g.text((L0 - 6, Y(v) - 7), l, font=mono_s, fill=MUTED, anchor="ra")
    g.text((R0, B0 + 24), "cut [mm]", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 8, T0 + 8), "e- / event", font=mono_s, fill=MUTED)
    # right: Edep vs cut
    L1, R1 = 420, W - 40
    X1 = lambda c: L1 + (math.log10(c) + 2) / 3 * (R1 - L1)
    Y1 = lambda v: B0 - (v - 120) / 40 * (B0 - T0)
    g.rectangle([L1, T0, R1, B0], outline=FRAME)
    for j in range(k + 1):
        c, _, _, ed, er, _ = SCAN[j]
        g.line([(X1(c), Y1(ed - er)), (X1(c), Y1(ed + er))], fill=NEU, width=2)
        r = 6 if j == k else 4
        g.ellipse([X1(c) - r, Y1(ed) - r, X1(c) + r, Y1(ed) + r], fill=NEG if j == k else FG)
    for c, l in ((0.01, "0.01"), (0.1, "0.1"), (1, "1"), (10, "10")):
        g.line([(X1(c), B0), (X1(c), B0 - 8)], fill=FRAME)
        g.text((X1(c), B0 + 6), l, font=mono_s, fill=MUTED, anchor="ma")
    for v in (120, 130, 140, 150, 160):
        g.line([(L1, Y1(v)), (L1 + 8, Y1(v))], fill=FRAME)
        g.text((L1 - 6, Y1(v) - 7), str(v), font=mono_s, fill=MUTED, anchor="ra")
    g.text((R1, B0 + 24), "cut [mm]", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L1 + 8, T0 + 8), "Edep [MeV]", font=mono_s, fill=MUTED)
    g.text((28, 872), f"From Track to Truth · Week 06 · Physics lists and production cuts   CPU {cpu} ms/evt", font=mono_s, fill=MUTED)
    return im


def main():
    frames = [frame(k) for k in range(len(SCAN))]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=[1600, 1600, 1600, 3200], loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
