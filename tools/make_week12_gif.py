"""Render media/week12-journey.gif: the textbook's section 16.2 chain, each step tagged with the
week that taught it, ending in RESEARCH and the core principle. Bottom panel: our real
reproducibility check of the Week 10 headline (same macro, three runs on two threads).
Usage: python3 tools/make_week12_gif.py
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "media" / "week12-journey.gif"
W, H = 720, 900
BG, PANEL, FG, MUTED, NEG, NEU, POS = "#F6F7F5", "#FFFFFF", "#12161A", "#59636D", "#D1323B", "#23935A", "#2C55E0"
DBG, DFG, DMUTED, GREEN, YEL, BLUE = "#10161B", "#DCE3E8", "#8FA0AC", "#4FC98A", "#F2D06B", "#7393FF"
FONTS = "/usr/share/fonts/truetype/dejavu/"
mono = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 15)
mono_s = ImageFont.truetype(FONTS + "DejaVuSansMono.ttf", 12)
head = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 34)
big = ImageFont.truetype(FONTS + "DejaVuSansCondensed-Bold.ttf", 22)

CHAIN = [("I have a physics question", "W1"), ("What should I measure?", "W1"), ("What detector do I need?", "W3"),
         ("What particle enters it?", "W2"), ("What physics happens?", "W4 W6"), ("How do I simulate it?", "W2 W3"),
         ("How do I detect it?", "W5"), ("How do I record it?", "W8"), ("How do I analyse it?", "W8 W9"),
         ("Does it agree with reality?", "W11"), ("Can I trust this result?", "W11"),
         ("...and through musrSim?", "W9 W10")]
RUNS = ["run 1 (published page)   f = 1.3573 +/- 0.0020 MHz", "run 2                    f = 1.3578 +/- 0.0020 MHz",
        "run 3                    f = 1.3572 +/- 0.0020 MHz"]


def frame(n, k, final):
    im = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((28, 22), "$ git tag v1.0 && bash repro_check.sh ...", font=mono, fill=NEG)
    g.text((28, 50), "Twelve weeks, one method:", font=head, fill=FG)
    g.text((28, 88), "question to defended answer.", font=head, fill=FG)
    top, bot = 150, 600
    g.rectangle([20, top, W - 20, bot], fill=DBG)
    for i, (q, wk) in enumerate(CHAIN[:n]):
        y = top + 14 + 31 * i
        cur = i == n - 1 and not final
        g.text((44, y), ("> " if cur else "  ") + q, font=mono, fill=YEL if cur else DFG)
        g.text((W - 44, y), wk, font=mono, fill=BLUE, anchor="ra")
    if final:
        g.text((44, top + 14 + 31 * len(CHAIN) + 2), "RESEARCH", font=big, fill=GREEN)
        g.text((W - 44, top + 14 + 31 * len(CHAIN) + 6), "W12", font=mono, fill=BLUE, anchor="ra")
    g.rectangle([20, 620, W - 20, 860], fill=PANEL, outline=(214, 216, 214))
    g.text((36, 634), "Week 10 headline, same macro, two threads:", font=mono_s, fill=MUTED)
    for i, r in enumerate(RUNS[:k]):
        g.text((36, 660 + 22 * i), r, font=mono, fill=FG)
    if k >= 3:
        g.text((36, 738), "within 0.0040 MHz (2 sigma) of each other: REPRODUCED", font=mono, fill=NEU)
        g.text((36, 760), "bit for bit: NO  (decay-channel race between threads)", font=mono, fill=NEG)
    if final:
        g.text((36, 800), "Don't learn Geant4. Learn to turn a physics question", font=mono_s, fill=FG)
        g.text((36, 818), "into a virtual experiment you can trust.", font=mono_s, fill=FG)
    g.text((28, 872), "Geant4 2.0 · Week 12 · Proposal and defence", font=mono_s, fill=MUTED)
    return im


def main():
    frames, dur = [], []
    for n in range(1, len(CHAIN) + 1):
        frames.append(frame(n, 0, False)); dur.append(420)
    for k in (1, 2, 3):
        frames.append(frame(len(CHAIN), k, False)); dur.append(700)
    frames.append(frame(len(CHAIN), 3, True)); dur.append(3600)
    pal = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True, disposal=1)
    print(OUT, f"{OUT.stat().st_size / 1e6:.2f} MB", len(frames), "frames", file=sys.stderr)


if __name__ == "__main__":
    main()
