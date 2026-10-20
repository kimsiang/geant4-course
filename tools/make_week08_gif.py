"""Render media/week08-daq.gif from REAL Geant4 11.4.p01 output (merged muons.root from
./week08 daq.mac on two threads, course test physics list).
Top: the 'daq' tree scrolling past like a DAQ terminal. Bottom: ch0_adc filling a histogram.
Usage: python3 tools/make_week08_gif.py <dir with muons.root>
"""
import sys
from pathlib import Path

import numpy as np
import uproot
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "media" / "week08-daq.gif"
with uproot.open(Path(sys.argv[1]) / "muons.root") as f:
    D = f["daq"].arrays(library="np")
    NT = int(f["truth"].num_entries)
order = np.argsort(D["event"])
D = {k: v[order] for k, v in D.items()}
N = len(D["event"])

W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME, NEG, NEU, HISTC = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#D1323B", "#23935A", "#2C55E0"
DBG, DFG, DMUTED, HIT = "#10161B", "#DCE3E8", "#8FA0AC", "#F2D06B"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)


def frame(k):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), "Idle> /run/beamOn 20000   # 2 threads, ntuples merged", font=mono, fill=NEG)
    g.text((28, 50), "A simulated event that looks", font=head, fill=FG)
    g.text((28, 88), "like a real DAQ event.", font=head, fill=FG)
    top, bot = 150, 560
    g.rectangle([20, top, W - 20, bot], fill=DBG)
    g.text((34, top + 10), "muons.root:daq   (triggered events only)", font=mono_s, fill=HIT)
    g.text((34, top + 34), " run  event   timestamp_ns  word  ch0_adc  ch1_adc", font=mono_s, fill=DMUTED)
    lo = max(0, k - 20)
    for j, i in enumerate(range(lo, k)):
        y = top + 54 + j * 16
        col = DFG if i == k - 1 else (150, 160, 168)
        g.text((34, y), f"{D['run'][i]:4d} {D['event'][i]:6d} {D['timestamp_ns'][i]:14.0f}  {D['trigger_word'][i]:4d}  {D['ch0_adc'][i]:7.1f}  {D['ch1_adc'][i]:7.1f}", font=mono_s, fill=col)
    g.text((34, bot - 26), f"recorded {k} of {N} triggers  ·  truth tree: {NT} events", font=mono, fill=DFG)
    L0, R0, T0, B0 = 80, W - 30, 610, 820
    g.rectangle([20, 596, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    nb, hi = 50, 600.0
    bins = np.histogram(D["ch0_adc"][:k], bins=nb, range=(0, hi))[0]
    mx = max(5, bins.max()) * 1.18
    bw = (R0 - L0) / nb
    pts = [(L0, B0)]
    for i, c in enumerate(bins):
        y = B0 - c / mx * (B0 - T0)
        pts += [(L0 + i * bw, y), (L0 + (i + 1) * bw, y)]
    pts.append((R0, B0))
    g.polygon(pts, fill=(222, 229, 251))
    g.line(pts, fill=HISTC, width=2)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for v in range(0, 601, 100):
        x = L0 + v / hi * (R0 - L0)
        g.line([(x, B0), (x, B0 - 7)], fill=FRAME)
        g.text((x, B0 + 6), str(v), font=mono_s, fill=MUTED, anchor="ma")
    a = D["ch0_adc"][:k]
    bx, by = R0 - 170, T0 + 8
    g.rectangle([bx, by, R0 - 8, by + 68], fill=PANEL, outline=FRAME)
    g.line([(bx, by + 18), (R0 - 8, by + 18)], fill=FRAME)
    g.text(((bx + R0 - 8) / 2, by + 3), "ch0_adc", font=mono_s, fill=FG, anchor="ma")
    for i, (lab, val) in enumerate((("Entries", str(k)), ("Mean", f"{a.mean():.1f}"), ("Std Dev", f"{a.std():.1f}"))):
        g.text((bx + 8, by + 22 + 15 * i), lab, font=mono_s, fill=FG)
        g.text((R0 - 16, by + 22 + 15 * i), val, font=mono_s, fill=FG, anchor="ra")
    g.text((R0, B0 + 24), "ch0_adc [ADC counts]", font=mono_s, fill=MUTED, anchor="ra")
    g.text((28, 872), "From Track to Truth · Week 08 · From simulation to experimental data", font=mono_s, fill=MUTED)
    return im


def main():
    ks = sorted(set([1, 2, 3, 5, 8, 12, 18, 25, 35, 50, 70, 95, 125, 160, 200, 245, 290, N]))
    frames = [frame(k) for k in ks]
    dur = [450] * 4 + [220] * (len(frames) - 5) + [2600]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
