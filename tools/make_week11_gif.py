"""Render media/week11-debug-validate.gif. Numbers are from our Geant4 11.4.p01 runs:
top, the debugging tree walked for fault-1 (evidence lines from the real trace);
bottom, the Week 11 dE/dx benchmark's Geant4/PDG ratios, first as naively compared (PDG at the entrance energy,
default 0-10 MeV/cm histogram), then like with like (path-averaged PDG, 0-1000 MeV/cm).
Usage: python3 tools/make_week11_gif.py
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "media" / "week11-debug-validate.gif"
W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, NEG, NEU, POS = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#D1323B", "#23935A", "#2C55E0"
DBG, DFG, DMUTED, GREEN, RED, YEL = "#10161B", "#DCE3E8", "#8FA0AC", "#4FC98A", "#FF6369", "#F2D06B"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 12)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)

TREE = ["L0 beyond 2-3 sigma?", "L1 particle generated?", "L2 geometry correct?", "L3 entered detector?",
        "L4 physics enabled?", "L5 SD attached?", "L6 hit generated?", "L7 data recorded?", "L8 analysis correct?"]
EVID = ["cos2: 0.0127 -> 0.0060, 7.1 sigma: real", "Step 0  z = -800 mm  World  initStep   (world half-length 500 mm)"]
# T [MeV], naive ratio and its sigma, corrected ratio and its sigma (Geant4 / PDG, our runs)
PTS = [(100, 1.0369, 0.0006, 0.9988, 0.0006), (200, 1.0045, 0.0009, 0.9991, 0.0009), (500, 0.9953, 0.0018, 0.9962, 0.0018),
       (1000, 0.9935, 0.0030, 0.9968, 0.0031), (10000, 0.8854, 0.0034, 0.9963, 0.0226)]


def frame(step, morph):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), "$ git checkout fault-1 && ./week05 trigger.mac", font=mono, fill=NEG)
    g.text((28, 50), "Walk the tree. Then ask whether", font=head, fill=FG)
    g.text((28, 88), "you compared the same thing.", font=head, fill=FG)
    top, bot = 150, 470
    g.rectangle([20, top, W - 20, bot], fill=DBG)
    for i, t in enumerate(TREE):
        y = top + 12 + 27 * i
        col = DMUTED
        mark = "  "
        if i < step:
            col, mark = (GREEN, "ok") if i != 1 else (RED, "!!")
        if i == step and step <= 1:
            col = YEL
        if step >= 2 and i > 1:
            col = (70, 78, 86)
        g.text((40, y), f"{mark:2s}  {t}", font=mono, fill=col)
        if i < len(EVID) and i < step:
            g.text((330, y + 2), EVID[i] if i == 0 else "z = -800 mm, outside the world", font=mono_s, fill=col)
    if step >= 2:
        g.text((40, bot - 46), "Geant4 11.4: no warning. The muon flew through 30 cm of", font=mono_s, fill=DFG)
        g.text((40, bot - 28), "air that does not exist. Fix L1; stop walking.", font=mono_s, fill=DFG)
    # ratio panel
    L0, R0, T0, B0 = 90, W - 40, 530, 800
    g.rectangle([20, 500, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    lo, hi = 0.86, 1.06
    Y = lambda v: B0 - (v - lo) / (hi - lo) * (B0 - T0)
    import math
    X = lambda T: L0 + (math.log10(T) - 1.8) / (4.2 - 1.8) * (R0 - L0)
    g.rectangle([L0, Y(1.01), R0, Y(0.99)], fill=(226, 240, 232))
    g.line([(L0, Y(1.0)), (R0, Y(1.0))], fill=NEU, width=1)
    for T, a, ea, b, eb in PTS:
        r = a + (b - a) * morph
        e = ea + (eb - ea) * morph
        x = X(T)
        bad = abs(r - 1) > 3 * (e ** 2 + (0.01) ** 2) ** 0.5
        col = NEG if bad else FG
        g.line([(x, Y(r + e)), (x, Y(r - e))], fill=col, width=2)
        g.ellipse([x - 5, Y(r) - 5, x + 5, Y(r) + 5], fill=col)
        g.text((x, B0 + 8), f"{T if T < 1000 else str(T // 1000) + 'k'}", font=mono_s, fill=MUTED, anchor="ma")
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for v in (0.88, 0.92, 0.96, 1.00, 1.04):
        g.line([(L0, Y(v)), (L0 + 7, Y(v))], fill=FRAME)
        g.text((L0 - 6, Y(v) - 7), f"{v:.2f}", font=mono_s, fill=MUTED, anchor="ra")
    lab = "naive: PDG at entry energy, 0-10 MeV/cm histogram" if morph < 0.5 else "like with like: path-averaged PDG, 0-1000 MeV/cm"
    g.text((L0 + 8, B0 - 40), "Geant4 / PDG, mean -dE/dx, 10 cm plastic", font=mono_s, fill=MUTED)
    g.text((L0 + 8, B0 - 22), lab, font=mono_s, fill=NEG if morph < 0.5 else NEU)
    g.text((R0, B0 + 26), "muon kinetic energy [MeV]; band: 1% reference uncertainty", font=mono_s, fill=MUTED, anchor="ra")
    g.text((28, 872), "From Track to Truth · Week 11 · Debug and validate", font=mono_s, fill=MUTED)
    return im


def main():
    frames, dur = [], []
    for s in range(0, 3):
        frames.append(frame(s, 0.0)); dur.append(1100)
    frames.append(frame(2, 0.0)); dur.append(1600)
    for k in range(1, 7):
        frames.append(frame(2, k / 6)); dur.append(220)
    dur[-1] = 2800
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
