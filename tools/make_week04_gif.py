"""Render media/week04-bethe.gif from REAL Geant4 11.4.p01 output.

Input: code/week04/edep_hists.json, the Edep histograms and means of the five runs of
`./week04 run_bethe_bloch.mac` (course test physics list, 10^4 events each).
Top: the Edep histogram of the current energy (ROOT style). Bottom: PDG Bethe curve for
polyvinyltoluene with the Geant4 primary -dE/dx points added one energy at a time.
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "media" / "week04-bethe.gif"
H = json.loads((ROOT / "code" / "week04" / "edep_hists.json").read_text())
W, HT = 720, 900
BG, PANEL, FG, MUTED, FRAME, HIST, NEG, NEU = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#12161A", "#2C55E0", "#D1323B", "#23935A"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 13)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)
M_MU, M_E, K = 105.6583755, 0.51099895, 0.307075
ZA, RHO, I_EV, CBAR, X0, X1, A_D, K_D = 0.54141, 1.032, 64.7, 3.1997, 0.1464, 2.4855, 0.1610, 3.2393
SUP = {-1: "⁻¹", 0: "⁰", 1: "¹", 2: "²", 3: "³"}


def bethe(bg):
    g = math.sqrt(1 + bg * bg)
    b2 = bg * bg / (g * g)
    r = M_E / M_MU
    w = 2 * M_E * bg * bg / (1 + 2 * g * r + r * r)
    x = math.log10(bg)
    d = 2 * math.log(10) * x - CBAR if x >= X1 else (2 * math.log(10) * x - CBAR + A_D * (X1 - x) ** K_D if x >= X0 else 0)
    return K * ZA / b2 * (0.5 * math.log(2 * M_E * bg * bg * w / (I_EV * 1e-6) ** 2) - b2 - d / 2) * RHO


def bg_of(T):
    g = 1 + T / M_MU
    return math.sqrt(g * g - 1)


ORDER = ["100", "200", "500", "1000", "10000"]


def frame(k):
    im = Image.new("RGB", (W, HT), BG)
    g = ImageDraw.Draw(im)
    T = ORDER[k]
    h = H[T]
    lab = f"{int(T) // 1000} GeV" if int(T) >= 1000 else f"{T} MeV"
    g.text((28, 22), f"Idle> /gun/energy {lab}   /run/beamOn 10000", font=mono, fill=NEG)
    g.text((28, 50), "Five energies, one formula:", font=head, fill=FG)
    g.text((28, 88), "muons through 10 cm of plastic.", font=head, fill=FG)
    # histogram panel
    g.rectangle([20, 150, W - 20, 470], fill=PANEL, outline=(214, 216, 214))
    L0, R0, T0, B0 = 76, W - 34, 166, 430
    bins = h["edep"][:100]           # 0-40 MeV of the 0-80 MeV histogram
    hi = h["lo"] + (h["hi"] - h["lo"]) * len(bins) / len(h["edep"])
    mx = max(bins) * 1.15
    bw = (R0 - L0) / len(bins)
    pts = [(L0, B0)]
    for i, c in enumerate(bins):
        y = B0 - c / mx * (B0 - T0)
        pts += [(L0 + i * bw, y), (L0 + (i + 1) * bw, y)]
    pts.append((R0, B0))
    g.polygon(pts, fill=(222, 229, 251))
    g.line(pts, fill=HIST, width=2)
    g.rectangle([L0, T0, R0, B0], outline=FRAME)
    for v in range(0, int(hi) + 1, 5):
        x = L0 + v / hi * (R0 - L0)
        g.line([(x, B0), (x, B0 - (8 if v % 10 == 0 else 4))], fill=FRAME)
        if v % 10 == 0:
            g.text((x, B0 + 6), str(v), font=mono_s, fill=MUTED, anchor="ma")
    g.text((R0, B0 + 22), "Edep in 10 cm PVT [MeV]", font=mono_s, fill=MUTED, anchor="ra")
    bx, by = R0 - 190, T0 + 8
    g.rectangle([bx, by, R0 - 8, by + 68], fill=PANEL, outline=FRAME)
    g.line([(bx, by + 18), (R0 - 8, by + 18)], fill=FRAME)
    g.text(((bx + R0 - 8) / 2, by + 3), f"Edep  {lab}", font=mono_s, fill=FG, anchor="ma")
    for i, (a, b) in enumerate((("Entries", str(h["entries"])), ("Mean", f"{h['mean']:.3f}"), ("dE/dx prim", f"{h['dedx']:.3f}"))):
        g.text((bx + 8, by + 22 + 15 * i), a, font=mono_s, fill=FG)
        g.text((R0 - 16, by + 22 + 15 * i), b, font=mono_s, fill=FG, anchor="ra")
    g.text((L0 + 8, T0 + 8), "Geant4 11.4 output", font=mono_s, fill=MUTED)
    # Bethe panel
    g.rectangle([20, 490, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    L1, R1, T1, B1 = 90, W - 34, 506, 812
    lx0, lx1, ly0, ly1 = -1, 3, math.log10(1.5), math.log10(6)
    X = lambda v: L1 + (math.log10(v) - lx0) / (lx1 - lx0) * (R1 - L1)
    Y = lambda v: B1 - (math.log10(v) - ly0) / (ly1 - ly0) * (B1 - T1)
    prev = None
    for i in range(200):
        bg = 10 ** (math.log10(0.35) + i / 199 * (lx1 - math.log10(0.35)))
        v = bethe(bg)
        p = (X(bg), Y(min(max(v, 1.5), 6)))
        if prev:
            g.line([prev, p], fill=NEU, width=2)
        prev = p
    for j in range(k + 1):
        hh = H[ORDER[j]]
        bg = bg_of(int(ORDER[j]))
        r = 6 if j == k else 4
        g.ellipse([X(bg) - r, Y(hh["dedx"]) - r, X(bg) + r, Y(hh["dedx"]) + r], fill=NEG if j == k else FG)
    g.rectangle([L1, T1, R1, B1], outline=FRAME)
    for e in range(lx0, lx1 + 1):
        x = X(10 ** e)
        g.line([(x, B1), (x, B1 - 8)], fill=FRAME)
        g.text((x, B1 + 6), "10" + SUP[e], font=mono_s, fill=MUTED, anchor="ma")
    for v in (2, 3, 4, 5):
        g.line([(L1, Y(v)), (L1 + 8, Y(v))], fill=FRAME)
        g.text((L1 - 8, Y(v) - 7), str(v), font=mono_s, fill=MUTED, anchor="ra")
    g.text((R1, B1 + 24), "βγ", font=mono_s, fill=MUTED, anchor="ra")
    g.text((L1 + 10, T1 + 8), "-dE/dx [MeV/cm]   line: PDG Bethe   dots: Geant4 primary", font=mono_s, fill=MUTED)
    g.text((28, 872), "Geant4 2.0 · Week 04 · Energy loss and Bethe–Bloch", font=mono_s, fill=MUTED)
    return im


def main():
    frames = [frame(k) for k in range(5)]
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=[1500, 1500, 1500, 1500, 3000], loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
