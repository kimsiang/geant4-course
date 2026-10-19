"""Render media/week03-steps.gif from REAL Geant4 11.4.p01 output.

Input: code/week03/pb_tracks_40ev.json, the first 40 events of `./week03 run1000.mac` with a
G4_Pb block (SteppingAction printout; course test physics list: standard-EM muon processes,
no-dataset electron/photon models). Side view z → (beam), x ↑, zoomed on the 10 cm block.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "media" / "week03-steps.gif"
EV = json.loads((ROOT / "code" / "week03" / "pb_tracks_40ev.json").read_text())

W, H = 720, 900
BG, PANEL, FG, MUTED, FRAME = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A"
DBG, DFG, DMUTED = "#10161B", "#DCE3E8", "#8FA0AC"
RED, AMBER, LIGHT, HIT, NEG, HISTC = "#FF6369", "#E2B04A", "#DCE3E8", "#F2D06B", "#D1323B", "#2C55E0"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)
PCOL = {"Transportation": LIGHT, "muIoni": AMBER, "muBrems": "#7393FF", "muPairProd": "#4FC98A"}


def blend(c, a):
    ca = [int(c[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(DBG[i:i + 2], 16) for i in (1, 3, 5)]
    return tuple(round(ca[i] * a + cb[i] * (1 - a)) for i in range(3))


def nsteps(ev):
    return sum(1 for s in ev["1"] if -5.0001 < s[1] <= 5.0001 and True) and \
        sum(1 for i, s in enumerate(ev["1"]) if (ev["1"][i - 1][1] if i else -99) >= -5.0001 and s[1] <= 5.0001 and s[1] > -5.0001)


def block_steps(ev):
    pts = ev["1"]
    n = 0
    for i, (x, z, proc) in enumerate(pts):
        zprev = pts[i - 1][1] if i else -1e9
        if zprev >= -5.0001 and z <= 5.0001 and z > -5.0001 + 1e-9:
            n += 1
    return n


def frame(k, hist):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), f"Idle> /run/beamOn 1   # event {k + 1} of {len(EV)}", font=mono, fill=NEG)
    g.text((28, 50), "One track, many steps:", font=head, fill=FG)
    g.text((28, 88), "a muon crosses 10 cm of lead.", font=head, fill=FG)
    top, bot = 150, 560
    disp = Image.new("RGB", (W - 40, bot - top), DBG)
    d = ImageDraw.Draw(disp)
    dw, dh = disp.size
    s = (dw - 60) / 13.0          # px per cm, z from -6.5 to 6.5 cm
    cx, cy = dw / 2, dh / 2 + 6
    X = lambda z: cx + z * s
    Y = lambda x: cy - x * s * 1.0
    d.rectangle([X(-5), Y(3.2), X(5), Y(-3.2)], fill=(20, 28, 44), outline=(110, 118, 125))
    d.text((X(-5) + 6, Y(3.2) + 4), "G4_Pb block, 10 cm   (z →, x ↑, same scale)", font=mono_s, fill=DMUTED)
    d.text((14, 10), "Geant4 11.4 output · SteppingAction printout", font=mono_s, fill=HIT)
    for j in range(max(0, k - 6), k + 1):
        ev = EV[j]
        a = 1.0 if j == k else 0.18
        prim = ev["1"]
        for tid, pts in ev.items():
            if tid == "1":
                continue
            poly = [(X(p[1]), Y(p[0])) for p in pts]
            if len(poly) > 1:
                d.line(poly, fill=blend(RED, a), width=1)
            else:
                d.ellipse([poly[0][0] - 1.5, poly[0][1] - 1.5, poly[0][0] + 1.5, poly[0][1] + 1.5], fill=blend(RED, a))
        prev = None
        for (x, z, proc) in prim:
            p = (X(z), Y(x))
            if prev is not None:
                d.line([prev, p], fill=blend(PCOL.get(proc, LIGHT), a), width=3 if j == k else 1)
                if j == k and -5.0001 <= z <= 5.0001:
                    d.line([(p[0], p[1] - 7), (p[0], p[1] + 7)], fill=blend(PCOL.get(proc, LIGHT), 1), width=2)
            prev = p
    ev = EV[k]
    d.text((14, dh - 26), f"primary steps in the block: {block_steps(ev)}    secondaries: {len(ev) - 1}", font=mono, fill=DFG)
    im.paste(disp, (20, top))
    g.text((28, 572), "segment colour = process that ended the step: amber muIoni, light Transportation", font=mono_s, fill=MUTED)
    # histogram of steps per crossing so far
    L0, R0, T0, B0 = 90, W - 30, 610, 820
    g.rectangle([20, 596, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    nb = 12
    bins = [0] * nb
    for v in hist:
        bins[min(v, nb - 1)] += 1
    mx = max(4, max(bins)) * 1.15
    bw = (R0 - L0) / nb
    pts = [(L0, B0)]
    for i, c in enumerate(bins):
        y = B0 - c / mx * (B0 - T0)
        pts += [(L0 + i * bw, y), (L0 + (i + 1) * bw, y)]
    pts.append((R0, B0))
    g.polygon(pts, fill=(222, 229, 251))
    g.line(pts, fill=HISTC, width=2)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for i in range(nb):
        g.line([(L0 + (i + 0.5) * bw, B0), (L0 + (i + 0.5) * bw, B0 - 6)], fill=FRAME)
        g.text((L0 + (i + 0.5) * bw, B0 + 6), str(i), font=mono_s, fill=MUTED, anchor="ma")
    n = len(hist)
    mean = sum(hist) / n
    sd = (sum((v - mean) ** 2 for v in hist) / n) ** 0.5
    bx, by = R0 - 170, T0 + 8
    g.rectangle([bx, by, R0 - 8, by + 68], fill=PANEL, outline=FRAME)
    g.line([(bx, by + 18), (R0 - 8, by + 18)], fill=FRAME)
    g.text(((bx + R0 - 8) / 2, by + 3), "nSteps", font=mono_s, fill=FG, anchor="ma")
    for i, (a, b) in enumerate((("Entries", str(n)), ("Mean", f"{mean:.2f}"), ("Std Dev", f"{sd:.2f}"))):
        g.text((bx + 8, by + 22 + 15 * i), a, font=mono_s, fill=FG)
        g.text((R0 - 16, by + 22 + 15 * i), b, font=mono_s, fill=FG, anchor="ra")
    g.text((R0, B0 + 24), "primary steps in the block", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L0 + 10, T0 + 8), "crossings", font=mono_s, fill=MUTED)
    g.text((28, 872), "Geant4 2.0 · Week 03 · Geometry, materials and steps", font=mono_s, fill=MUTED)
    return im


def main():
    frames, hist = [], []
    for k, ev in enumerate(EV):
        hist.append(block_steps(ev))
        frames.append(frame(k, list(hist)))
    dur = [700] * 5 + [260] * (len(frames) - 6) + [2600]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
