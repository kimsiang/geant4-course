"""Render media/week05-trigger.gif from REAL Geant4 11.4.p01 output.

Input: code/week05/run_c_both_above.json, the events of run C (cos^2 source + background pulses,
p = 0.3 per counter, 20000 events) in which BOTH ADCs were above threshold, in event order,
with their time difference dt = t0 - t1 and the trigger decision (|dt| < 20 ns).
The histogram fills in event order; two counters compare "both above threshold" with the trigger.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "media" / "week05-trigger.gif"
D = json.loads((ROOT / "code" / "week05" / "run_c_both_above.json").read_text())
W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, HIST, NEG, NEU = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#2C55E0", "#D1323B", "#23935A"
DBG, DFG, DMUTED, HIT = "#10161B", "#DCE3E8", "#8FA0AC", "#F2D06B"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_b = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 22)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)


def frame(n_ev):
    sel = [i for i, e in enumerate(D["event"]) if e < n_ev]
    dts = [D["dt"][i] for i in sel]
    trig = sum(D["trig"][i] for i in sel)
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), f"Idle> /week05/noise 0.3   /run/beamOn {n_ev}", font=mono, fill=NEG)
    g.text((28, 50), "Two hits are not a coincidence.", font=head, fill=FG)
    g.text((28, 88), "Twenty nanoseconds are.", font=head, fill=FG)
    # counters panel (dark)
    g.rectangle([20, 150, W - 20, 300], fill=DBG)
    g.text((36, 162), "Geant4 11.4 output · run C · cos² muons + background pulses", font=mono_s, fill=HIT)
    g.text((36, 196), "both ADC above threshold", font=mono, fill=DMUTED)
    g.text((W - 40, 190), f"{len(dts):5d}", font=mono_b, fill=DFG, anchor="ra")
    g.text((36, 236), "trigger: both + |Δt| < 20 ns", font=mono, fill=DMUTED)
    g.text((W - 40, 230), f"{trig:5d}", font=mono_b, fill=HIT, anchor="ra")
    g.text((36, 272), f"events generated {n_ev:,}", font=mono_s, fill=DMUTED)
    # dt histogram
    g.rectangle([20, 320, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    L0, R0, T0, B0 = 80, W - 34, 346, 800
    lo, hi, nb = -500.0, 500.0, 50
    bins = [0] * nb
    for v in dts:
        b = int((v - lo) / (hi - lo) * nb)
        if 0 <= b < nb:
            bins[b] += 1
    mx = max(10, max(bins)) * 1.12
    mx = max(mx, 450)
    bw = (R0 - L0) / nb
    pts = [(L0, B0)]
    for i, c in enumerate(bins):
        y = B0 - c / mx * (B0 - T0)
        pts += [(L0 + i * bw, y), (L0 + (i + 1) * bw, y)]
    pts.append((R0, B0))
    g.polygon(pts, fill=(222, 229, 251))
    g.line(pts, fill=HIST, width=2)
    x20a = L0 + (-20 - lo) / (hi - lo) * (R0 - L0)
    x20b = L0 + (20 - lo) / (hi - lo) * (R0 - L0)
    g.rectangle([x20a, T0, x20b, B0], outline=NEG, width=2)
    g.text((x20b + 6, T0 + 28), "±20 ns window", font=mono_s, fill=NEG)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for v in range(-500, 501, 100):
        x = L0 + (v - lo) / (hi - lo) * (R0 - L0)
        g.line([(x, B0), (x, B0 - 8)], fill=FRAME)
        g.text((x, B0 + 6), str(v), font=mono_s, fill=MUTED, anchor="ma")
    for c in (100, 200, 300, 400):
        y = B0 - c / mx * (B0 - T0)
        g.line([(L0, y), (L0 + 8, y)], fill=FRAME)
        g.text((L0 - 8, y - 7), str(c), font=mono_s, fill=MUTED, anchor="ra")
    g.text((R0, B0 + 26), "Δt = t(top) − t(bottom) [ns]", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 10, T0 + 8), "events with both ADC above threshold", font=mono_s, fill=MUTED)
    g.text((28, 872), "Geant4 2.0 · Week 05 · From energy deposit to a hit", font=mono_s, fill=MUTED)
    return im


def main():
    steps = [200, 500, 1000, 2000, 3500, 5000, 7000, 9000, 11000, 13500, 16000, 18000, 20000]
    frames = [frame(n) for n in steps]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=[450] * (len(frames) - 1) + [3000], loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
