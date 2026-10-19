"""Static SVG concept figures for the course pages (inserted by tools/figures.py).

Figures use the course CSS classes (.s-fg, .s-pos, .neg, .m ...) so they follow the light and
dark themes. Every label has an English and a Chinese <text>; CSS shows the one for the reader's
language (English in EN+中 mode, where the caption carries both). Numbers are from the PDG or
from this course's own Geant4 runs, as stated in each caption.
"""
import math

W = 820


def T(x, y, en, zh=None, cls="", anchor="start", size=None):
    st = f' font-size="{size}"' if size else ""
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    c = f' class="{cls}"' if cls else ""
    if zh is None:
        return f'<text x="{x}" y="{y}"{a}{c}{st}>{en}</text>'
    return (f'<text x="{x}" y="{y}"{a}{c}{st} lang="en">{en}</text>'
            f'<text x="{x}" y="{y}"{a}{c}{st} lang="zh-Hans">{zh}</text>')


def L(x1, y1, x2, y2, cls="s-fg", w=1.2, dash=None, arrow=False):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    m = ' marker-end="url(#ah)"' if arrow else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}" stroke-width="{w}"{d}{m} fill="none"/>'


def R(x, y, w, h, cls="s-fg", fill="none", sw=1.2, rx=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    f = f' class="{cls} {fill}"' if fill != "none" else f' class="{cls}" fill="none"'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{f} stroke-width="{sw}"{d}/>'


def P(d, cls="s-fg", w=1.4, fill="none", arrow=False, dash=None):
    m = ' marker-end="url(#ah)"' if arrow else ""
    ds = f' stroke-dasharray="{dash}"' if dash else ""
    f = f' class="{cls} {fill}"' if fill != "none" else f' class="{cls}" fill="none"'
    return f'<path d="{d}"{f} stroke-width="{w}"{m}{ds}/>'


def svg(h, body, label):
    defs = ('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--muted)"/></marker></defs>')
    return f'<svg viewBox="0 0 {W} {h}" role="img" aria-label="{label}">{defs}{"".join(body)}</svg>'


SVG = {}

# ------------------------------------------------------------------ primer: air shower
b = []
b.append(L(70, 30, 70, 300, "s-m", 1))
for km, y in [(20, 30), (15, 97), (10, 165), (5, 232), (0, 300)]:
    b.append(L(64, y, 70, y, "s-m", 1)); b.append(T(58, y + 4, f"{km} km", None, "m", "end", 11))
b.append(L(70, 300, 780, 300, "s-fg", 1.4))
b.append(T(80, 294, "sea level", "海平面", "m", "start", 11))
b.append(L(330, 30, 330, 97, "s-pos", 2, arrow=True))
b.append(T(340, 46, "cosmic-ray proton", "宇宙线质子", "pos"))
b.append(f'<circle cx="330" cy="97" r="6" class="f-hit"/>')
b.append(T(345, 101, "first collision ≈ 15 km", "≈ 15 km 处首次碰撞", ""))
for dx, q in [(-120, "pos"), (-60, "neg"), (40, "pos"), (110, "neg")]:
    xe, ye = 330 + dx * 0.55, 165
    b.append(L(330, 97, xe, ye, f"s-{q}", 1.4))
    b.append(f'<circle cx="{xe}" cy="{ye}" r="3" class="f-{q}"/>')
    b.append(L(xe, ye, 330 + dx * 1.15, 298, f"s-{q}", 1.8, arrow=True))
    b.append(L(xe, ye, xe + dx * 0.12 + 18, ye + 40, "s-neu", 1, dash="3 3"))
b.append(T(140, 160, "π⁺ π⁻ decay → μ + ν", "π⁺ π⁻ 衰变 → μ + ν", ""))
b.append(L(330, 97, 520, 150, "s-neu", 1.2, dash="4 3"))
b.append(L(520, 150, 560, 200, "s-neg", 1)); b.append(L(520, 150, 590, 185, "s-pos", 1))
b.append(T(530, 140, "π⁰ → γγ → e⁺e⁻ (stopped in the air)", "π⁰ → γγ → e⁺e⁻（在空气中被吸收）", "m", size=11))
b.append(T(470, 225, "muons reach the ground:", "到达地面的缪子：", ""))
b.append(T(470, 243, "≈ 1 per cm² per minute, mean ≈ 4 GeV", "每平方厘米每分钟约 1 个，平均约 4 GeV", "m", size=11))
b.append(T(470, 261, "γ ≈ 38 at 4 GeV → decay length ≈ 25 km", "4 GeV 时 γ ≈ 38 → 衰变长度约 25 km", "m", size=11))
SVG["shower"] = (svg(320, b, "Air shower diagram: a cosmic proton collides at about 15 km, pions decay into muons which reach sea level"),
                 ("Schematic, heights to scale. Charged pions decay to muons; the electromagnetic part from π⁰ is absorbed in the air. Numbers: PDG; the 25 km decay length is γβcτ for a 4 GeV muon.",
                  "示意图，高度按比例。带电 π 介子衰变为缪子；π⁰ 产生的电磁成分在空气中被吸收。数字取自 PDG；25 km 衰变长度是 4 GeV 缪子的 γβcτ。"))

# ------------------------------------------------------------------ primer: areal density
b = []
rows = [("standard rock", "标准岩石", 2.65, 1.00), ("concrete", "混凝土", 2.30, 1.152), ("water", "水", 1.00, 2.65)]
for k, (en, zh, rho, t) in enumerate(rows):
    y = 24 + k * 70
    b.append(T(20, y + 22, en, zh, ""))
    b.append(T(20, y + 38, f"ρ = {rho:.2f} g/cm³", None, "m", size=11))
    w = t * 200
    b.append(R(200, y, w, 44, "s-fg", "f-soft", 1.2))
    b.append(L(170, y + 22, 200 + w + 40, y + 22, "s-neg", 1.6, arrow=True))
    b.append(T(200 + w / 2, y + 60, f"{t:.2f} m", None, "m", "middle", 11))
b.append(L(740, 30, 740, 210, "s-m", 1, dash="3 3"))
b.append(T(732, 92, "same 265 g/cm²", "同为 265 g/cm²", "", "end"))
b.append(T(732, 110, "same ≈ 0.5 GeV lost", "同样约损失 0.5 GeV", "m", "end", 11))
b.append(T(732, 128, "by a cosmic muon", "（宇宙线缪子）", "m", "end", 11))
SVG["areal"] = (svg(240, b, "Three slabs of different thickness with the same areal density of 265 grams per square centimetre"),
                ("A muon's energy loss depends on mass per area (density × thickness), not on thickness alone: 1 m of rock, 1.15 m of concrete and 2.65 m of water each present 265 g/cm².",
                 "缪子的能量损失取决于单位面积的质量（密度 × 厚度），而不只是厚度：1 m 岩石、1.15 m 混凝土和 2.65 m 水都相当于 265 g/cm²。"))

# ------------------------------------------------------------------ primer: two muography modes
b = []
b.append(T(20, 22, "absorption (transmission)", "吸收式（透射）", ""))
b.append(P("M30 230 Q200 30 370 230 Z", "s-fg", 1.4, "f-soft"))
b.append('<ellipse cx="236" cy="150" rx="26" ry="18" class="s-neu" fill="none" stroke-width="1.4" stroke-dasharray="4 3"/>')
b.append(T(266, 140, "void", "空洞", "neu", size=11))
b.append(R(185, 236, 40, 10, "s-hit", "f-hit", 1))
b.append(T(205, 268, "detector", "探测器", "m", "middle", 11))
for x0, ok in [(60, False), (120, False), (300, True), (360, False), (250, True)]:
    b.append(L(x0, 30, 205, 236, "s-pos" if ok else "s-m", 1.2 if ok else 0.9, dash=None if ok else "3 3"))
b.append(T(20, 290, "count survivors per direction → mass along each line", "统计每个方向的存活缪子 → 每条线上的质量", "m", size=11))
b.append(L(420, 20, 420, 290, "s-rule", 1))
b.append(T(440, 22, "scattering", "散射式", ""))
for y in (50, 70, 210, 230):
    b.append(L(520, y, 760, y, "s-hit", 2))
b.append(R(590, 110, 100, 60, "s-fg", "f-soft", 1.4))
b.append(T(684, 165, "object", "物体", "m", "end", 11))
b.append(P("M600 30 L630 140 L700 250", "s-neg", 1.6, arrow=True))
b.append(L(630, 140, 660, 250, "s-m", 1, dash="3 3"))
b.append(T(668, 268, "deflection angle → density, atomic number", "偏转角 → 密度、原子序数", "m", "middle", 11))
b.append(T(770, 60, "in", "入射", "m", "end", 11)); b.append(T(770, 222, "out", "出射", "m", "end", 11))
SVG["modes"] = (svg(300, b, "Two kinds of muography: absorption through a mountain with a void, and scattering of a muon in a dense object between detector planes"),
                ("Absorption muography counts muons that survive the overburden; directions through a void see more. Scattering muography measures the deflection between detector planes above and below a smaller object.",
                 "吸收式缪子成像统计穿过覆盖层存活下来的缪子，穿过空洞的方向计数更多。散射式缪子成像测量较小物体上下两侧探测平面之间的偏转角。"))

# ------------------------------------------------------------------ W1: telescope geometry
b = []
b.append(R(260, 60, 300, 10, "s-fg", "f-soft", 1.4, 1)); b.append(R(260, 230, 300, 10, "s-fg", "f-soft", 1.4, 1))
b.append(T(570, 69, "upper layer, side L", "上层，边长 L", "")); b.append(T(570, 239, "lower layer", "下层", ""))
b.append(L(240, 65, 240, 235, "s-m", 1, arrow=True)); b.append(T(230, 155, "d", None, "", "end"))
b.append(L(340, 20, 380, 65, "s-pos", 1.8)); b.append(L(380, 65, 470, 235, "s-pos", 1.8, arrow=True))
b.append(T(472, 200, "transmitted", "穿过两层", "pos", size=11))
b.append(L(470, 20, 520, 65, "s-neg", 1.6)); b.append(L(520, 65, 700, 260, "s-neg", 1.6, dash="4 3", arrow=True))
b.append(T(640, 210, "misses", "未击中", "neg", size=11))
b.append(L(380, 65, 380, 140, "s-m", 0.8, dash="2 3")); b.append(P("M380 100 A35 35 0 0 0 398 96", "s-m", 1)); b.append(T(386, 122, "θ", None, "m"))
b.append(T(20, 120, "ε ≈ k / N", None, "", size=15))
b.append(T(20, 145, "σε ≈ √(ε(1−ε)/N)", None, "m", size=13))
b.append(T(20, 170, "×100 events → ÷10 error", "事例 ×100 → 误差 ÷10", "m", size=11))
SVG["telescope"] = (svg(280, b, "Side view of a two-layer telescope with a transmitted and a missed ray"),
                    ("The Week 1 experiment: of N rays entering the upper layer, k also cross the lower one. The estimate k/N carries a binomial uncertainty that shrinks only as 1/√N.",
                     "第 1 周的实验：进入上层的 N 条径迹中有 k 条也穿过下层。估计值 k/N 带有二项分布不确定度，只按 1/√N 缩小。"))

# ------------------------------------------------------------------ W2: run / event / track / step
b = []
boxes = [("Run", "运行", "G4Run · BeginOfRunAction / EndOfRunAction", 20, 20, 780, 250),
         ("Event", "事例", "G4Event · BeginOfEventAction / EndOfEventAction", 45, 60, 560, 190),
         ("Track", "径迹", "G4Track · PreUserTrackingAction", 70, 100, 400, 130),
         ("Step", "步", "G4Step · UserSteppingAction", 95, 140, 240, 70)]
for en, zh, cls, x, y, w, h in boxes:
    b.append(R(x, y, w, h, "s-fg", "none", 1.3))
    b.append(T(x + 12, y + 20, en, zh, "", size=13))
    b.append(T(x + 12, y + 36, cls, None, "m", size=10))
b.append(T(630, 100, "same geometry and", "同一几何与", "m", size=11)); b.append(T(630, 116, "physics for the run", "物理设置", "m", size=11))
b.append(T(490, 140, "one particle,", "一个粒子，", "m", size=11)); b.append(T(490, 156, "creation to end", "从产生到终止", "m", size=11))
b.append(T(350, 180, "ends at a boundary", "在边界或", "m", size=11)); b.append(T(350, 196, "or a process", "某个过程处结束", "m", size=11))
SVG["hierarchy"] = (svg(280, b, "Nested boxes: a run contains events, an event contains tracks, a track contains steps, with the matching Geant4 classes and user hooks"),
                    ("Run → Event → Track → Step, with the Geant4 class for each level and the user-action method Geant4 calls there.",
                     "运行 → 事例 → 径迹 → 步，每一层对应的 Geant4 类，以及 Geant4 在该层调用的用户动作方法。"))

# ------------------------------------------------------------------ W3: solid / logical / physical
b = []
items = [("G4VSolid", "shape only", "只有形状", "G4Box(\"Block\", 5, 5, 5 cm)"),
         ("G4LogicalVolume", "+ material (+ SD, field)", "+ 材料（+ 灵敏探测器、场）", "G4_CONCRETE"),
         ("G4PVPlacement", "+ position in a mother", "+ 在母体中的位置", "in World at (0, 0, 0)")]
for k, (cls, en, zh, ex) in enumerate(items):
    x = 20 + k * 270
    b.append(R(x, 40, 230, 120, "s-fg", "none", 1.3))
    b.append(T(x + 14, 66, cls, None, "", size=13))
    b.append(T(x + 14, 90, en, zh, "m", size=11))
    b.append(T(x + 14, 140, ex, None, "pos", size=11))
    if k < 2:
        b.append(L(x + 232, 100, x + 268, 100, "s-m", 1.2, arrow=True))
b.append(T(20, 196, "pattern → fabric → where it hangs: change one without touching the other two", "版型 → 布料 → 挂在哪里：改其中一个，不必动另外两个", "m", size=11))
SVG["geomlayers"] = (svg(210, b, "Three boxes: solid, logical volume with material, physical placement in a mother volume"),
                     ("The three geometry layers of Definition 3.1, with this week's concrete block as the example.",
                      "定义 3.1 中的三层几何，以本周的混凝土块为例。"))

# ------------------------------------------------------------------ W4: Bethe curve from the PDG table
TT = [50, 55, 60, 70, 80, 90, 100, 120, 140, 170, 200, 250, 300, 350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1200, 1400, 1700, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 9000, 10000]
SS = [2.861, 2.744, 2.647, 2.498, 2.388, 2.303, 2.237, 2.143, 2.082, 2.025, 1.992, 1.966, 1.957, 1.957, 1.962, 1.969, 1.978, 1.987, 1.997, 2.016, 2.034, 2.051, 2.067, 2.096, 2.121, 2.153, 2.181, 2.219, 2.249, 2.275, 2.297, 2.317, 2.334, 2.350, 2.364, 2.389, 2.410, 2.429, 2.445]
M = 105.658
X0, X1, Y0, Y1 = 90, 780, 250, 30
lx0, lx1, sy0, sy1 = math.log10(1), math.log10(100), 1.8, 3.0
def bx(bg): return X0 + (math.log10(bg) - lx0) / (lx1 - lx0) * (X1 - X0)
def by(s): return Y0 - (s - sy0) / (sy1 - sy0) * (Y0 - Y1)
pts = []
for t, s in zip(TT, SS):
    g = 1 + t / M; pts.append((bx(math.sqrt(g * g - 1)), by(s)))
b = [R(X0, Y1, X1 - X0, Y0 - Y1, "s-fg", "none", 1, 0)]
for v in (1, 2, 5, 10, 20, 50, 100):
    b.append(L(bx(v), Y0, bx(v), Y0 - 6, "s-fg", 1)); b.append(T(bx(v), Y0 + 16, str(v), None, "m", "middle", 11))
for v in (1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0):
    b.append(L(X0, by(v), X0 + 6, by(v), "s-fg", 1)); b.append(T(X0 - 6, by(v) + 4, f"{v:.1f}", None, "m", "end", 11))
b.append(P("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts), "s-pos", 2))
for t, lab in [(100, "100 MeV μ"), (1000, "1 GeV μ")]:
    g = 1 + t / M; x = bx(math.sqrt(g * g - 1)); s = SS[TT.index(t)]
    b.append(f'<circle cx="{x:.1f}" cy="{by(s):.1f}" r="5" class="f-neg"/>'); b.append(T(x + 8, by(s) - 8, lab, None, "neg", size=11))
gm = 1 + 324.6 / M; xm = bx(math.sqrt(gm * gm - 1))
b.append(L(xm, by(1.957) + 6, xm, Y0, "s-m", 1, dash="3 3")); b.append(T(xm + 6, Y0 - 10, "minimum ≈ 1.96 (MIP)", "最小值 ≈ 1.96（MIP）", "m", size=11))
b.append(T(110, 52, "slow: ∝ 1/β²", "慢速区：∝ 1/β²", "m", size=11)); b.append(T(770, 120, "relativistic rise", "相对论上升", "m", "end", 11))
b.append(T(X1, Y0 + 34, "βγ = p/(mc)", None, "m", "end", 11))
b.append(f'<text x="22" y="{(Y0 + Y1) / 2}" transform="rotate(-90 22 {(Y0 + Y1) / 2})" text-anchor="middle" class="m" font-size="11">−dE/dx [MeV cm²/g]</text>')
SVG["bethe"] = (svg(300, b, "Measured-table curve of muon energy loss in plastic scintillator against beta gamma, with a minimum near beta gamma 3"),
                ("Mean muon energy loss in polyvinyltoluene plastic scintillator, plotted from the PDG 2024 muon table (50 MeV to 10 GeV kinetic energy). The two red points are this week's 100 MeV and 1 GeV muons.",
                 "聚乙烯基甲苯塑料闪烁体中缪子的平均能量损失，按 PDG 2024 缪子表绘制（动能 50 MeV 到 10 GeV）。两个红点是本周的 100 MeV 和 1 GeV 缪子。"))

# ------------------------------------------------------------------ W5: readout chain
b = []
steps = [("muon", "缪子", "", "pos"), ("energy deposit", "能量沉积", "Edep (MeV)", ""), ("light", "光", "~10⁴ γ / MeV", "neu"),
         ("photoelectrons", "光电子", "Poisson", ""), ("pulse", "脉冲", "gain + noise", ""), ("ADC number", "ADC 数值", "threshold", "hit")]
for k, (en, zh, sub, c) in enumerate(steps):
    x = 14 + k * 134
    b.append(R(x, 50, 118, 64, "s-fg", "none", 1.3))
    b.append(T(x + 59, 78, en, zh, c if c != "hit" else "", "middle", 12))
    b.append(T(x + 59, 98, sub, None, "m", "middle", 10))
    if k < 5:
        b.append(L(x + 120, 82, x + 132, 82, "s-m", 1.2, arrow=True))
for x0, x1, en, zh in [(14, 266, "Geant4 truth", "Geant4 真值"), (282, 534, "detector response", "探测器响应"), (550, 804, "measurement", "测量")]:
    b.append(L(x0, 136, x1, 136, "s-m", 1)); b.append(L(x0, 130, x0, 136, "s-m", 1)); b.append(L(x1, 130, x1, 136, "s-m", 1))
    b.append(T((x0 + x1) / 2, 154, en, zh, "m", "middle", 11))
SVG["chain"] = (svg(170, b, "Readout chain from a muon to an ADC number, grouped into truth, detector response and measurement"),
                ("The chain this week builds. Plastic scintillators emit of order 10⁴ photons per MeV deposited; only a fraction becomes photoelectrons, which is why Poisson fluctuations matter.",
                 "本周搭建的链条。塑料闪烁体每沉积 1 MeV 发出约 10⁴ 个光子；其中只有一部分变成光电子，所以泊松涨落很重要。"))

# ------------------------------------------------------------------ W6: what FTFP_BERT contains + cuts
b = []
ctors = [("G4EmStandardPhysics", "EM: ionisation, scattering…", "电磁：电离、散射等"), ("G4EmExtraPhysics", "photo- and electro-nuclear", "光核与电核反应"),
         ("G4DecayPhysics", "decays", "衰变"), ("G4HadronElasticPhysics", "hadron elastic", "强子弹性散射"),
         ("G4HadronPhysicsFTFP_BERT", "inelastic: FTF + Bertini", "非弹性：FTF + Bertini"),
         ("G4StoppingPhysics", "stopped μ⁻, π⁻, K⁻ …", "停止的 μ⁻、π⁻、K⁻ 等"), ("G4IonPhysics", "ions", "离子"), ("G4NeutronTrackingCut", "kill slow neutrons", "终止慢中子")]
b.append(T(20, 22, "FTFP_BERT =", None, "", size=13))
for k, (cls, en, zh) in enumerate(ctors):
    y = 34 + k * 30
    b.append(R(20, y, 430, 24, "s-pos" if k == 0 else "s-fg", "none", 1.2 if k else 1.8))
    b.append(T(30, y + 16, cls, None, "", size=11)); b.append(T(442, y + 16, en, zh, "m", "end", 10))
b.append(T(480, 22, "production cut 0.7 mm → thresholds", "产生阈 0.7 mm → 能量阈值", "", size=12))
cuts = [("plastic", "塑料", 0.282, 2.10), ("concrete", "混凝土", 0.433, 4.92), ("Al", "铝", 0.461, 5.85), ("Pb", "铅", 1.007, 94.7), ("Cu", "铜", 1.034, 20.6)]
b.append(T(570, 46, "e⁻ [MeV]", None, "m", size=10)); b.append(T(790, 46, "γ [keV]", None, "m", "end", 10))
for k, (en, zh, e, g) in enumerate(cuts):
    y = 66 + k * 26
    b.append(T(480, y, en, zh, "", size=11))
    b.append(R(570, y - 10, e * 100, 12, "s-neg", "f-neg", 0.5, 1)); b.append(T(570 + e * 100 + 4, y, f"{e:.2f}", None, "m", size=10))
    b.append(T(790, y, f"{g:.1f}", None, "m", "end", 10))
b.append(T(480, 214, "one range, different energies per material", "同一射程，不同材料对应不同能量", "m", size=10))
SVG["physlist"] = (svg(280, b, "List of the eight physics constructors in FTFP_BERT, and bars of production thresholds for a 0.7 millimetre cut in five materials"),
                   ("Left: the eight constructors FTFP_BERT registers in Geant4 11.4. Right: what the default 0.7 mm range cut means in energy, from our Week 6 Geant4 run.",
                    "左：Geant4 11.4 中 FTFP_BERT 注册的八个构造器。右：默认 0.7 mm 射程阈对应的能量，取自我们第 6 周的 Geant4 运行。"))

# ------------------------------------------------------------------ W7: spectrometer top view
b = []
for z in (60, 110, 160, 520, 570, 620):
    b.append(L(z, 40, z, 240, "s-fg", 2))
b.append(R(250, 50, 180, 180, "s-pos", "none", 1.4))
for x in (290, 340, 390):
    for y in (90, 140, 190):
        b.append(f'<circle cx="{x}" cy="{y}" r="7" class="s-pos" fill="none" stroke-width="1"/><circle cx="{x}" cy="{y}" r="1.8" class="f-pos"/>')
b.append(T(340, 44, "B ⊥ page, length L", "B 垂直于纸面，长度 L", "pos", "middle", 11))
b.append(P("M20 140 L250 140 Q340 140 430 115 L700 40", "s-neg", 2, arrow=True))
for z, x in [(60, 140), (110, 140), (160, 140), (520, 90), (570, 76), (620, 62)]:
    b.append(f'<circle cx="{z}" cy="{x}" r="4.5" class="f-hit"/>')
b.append(T(110, 260, "tracker 1: line in", "径迹室 1：入射直线", "m", "middle", 11)); b.append(T(570, 260, "tracker 2: line out", "径迹室 2：出射直线", "m", "middle", 11))
b.append(T(340, 284, "sin θout − sin θin = 0.3 B[T] L[m] / p[GeV/c]", None, "", "middle", 12))
SVG["spectro"] = (svg(296, b, "Top view of the tracker magnet tracker spectrometer with a bending track and six hits"),
                  ("Fit one straight line in each tracker; the change in angle across a known field gives p (Eq. 7.1). For 10 GeV/c in 1.5 T × 1 m the deflection is 45 mrad.",
                   "在每组径迹室中各拟合一条直线；穿过已知磁场的角度变化给出 p（式 7.1）。10 GeV/c 在 1.5 T × 1 m 中偏转 45 mrad。"))

# ------------------------------------------------------------------ W8: data pipeline
b = []
st = [("Geant4 steps", "Geant4 步", 20), ("hits / digits", "击中 / 数字化", 150), ("EventAction", "EventAction", 280), ("ntuple rows", "ntuple 行", 410), ("muons.root", "muons.root", 540), ("Python", "Python", 670)]
for en, zh, x in st:
    b.append(R(x, 40, 120, 44, "s-fg", "none", 1.3)); b.append(T(x + 60, 67, en, zh, "", "middle", 12))
for k in range(5):
    x = st[k][2] + 121; b.append(L(x, 62, x + 8, 62, "s-m", 1.2, arrow=True))
b.append(R(540, 100, 120, 26, "s-neu", "none", 1.2)); b.append(T(600, 117, "tree: daq", "树：daq", "neu", "middle", 11))
b.append(R(540, 132, 120, 26, "s-m", "none", 1.2, dash="3 3")); b.append(T(600, 149, "tree: truth", "树：truth", "m", "middle", 11))
b.append(R(280, 180, 250, 40, "s-fg", "none", 1.2)); b.append(T(405, 205, "lab DAQ → decoder", "实验室 DAQ → 解码器", "", "middle", 12))
b.append(P("M530 200 Q525 113 538 113", "s-neu", 1.3, arrow=True))
b.append(T(20, 250, "same branch names, units and trigger word: the same analysis runs on both", "相同的分支名、单位和触发字：同一分析程序在两者上都能运行", "m", size=11))
SVG["pipeline"] = (svg(265, b, "Pipeline from Geant4 steps through hits and ntuples to a ROOT file read in Python, with a lab DAQ feeding the same tree"),
                   ("The chain this week builds. Detector-facing quantities go in the daq tree, simulation truth in a separate tree; a decoder writes real DAQ data into the same daq format.",
                    "本周搭建的链条。面向探测器的量写入 daq 树，模拟真值写入单独的树；解码器把真实 DAQ 数据写成同样的 daq 格式。"))

# ------------------------------------------------------------------ W9: three layers of musrSim
b = []
lay = [("your macro", "你的宏", "/musr/command construct …\n/gun/momentum 29.8 MeV\n/run/beamOn 2000"),
       ("musrSim executable", "musrSim 可执行程序", "parses commands, builds\ngeometry, fields, output"),
       ("Geant4 + ROOT", "Geant4 + ROOT", "transport and physics;\ndata/musrSim_<run>.root\ntree t1")]
for k, (en, zh, sub) in enumerate(lay):
    x = 20 + k * 270
    b.append(R(x, 40, 240, 120, "s-fg", "none", 1.3)); b.append(T(x + 14, 66, en, zh, "", size=13))
    for j, line in enumerate(sub.split("\n")):
        b.append(T(x + 14, 92 + j * 18, line.replace("<", "&lt;").replace(">", "&gt;"), None, "m", size=10.5))
    if k < 2:
        b.append(L(x + 242, 100, x + 268, 100, "s-m", 1.2, arrow=True))
b.append(T(20, 196, "you edit text; the C++ is compiled once (Geant4 10.7.x for musrsim-sms)", "你只改文本；C++ 只需编译一次（musrsim-sms 用 Geant4 10.7.x）", "m", size=11))
SVG["layers"] = (svg(210, b, "Three boxes: macro, musrSim executable, Geant4 and ROOT"),
                 ("Definition 9.1: the three layers of a musrSim run.", "定义 9.1：一次 musrSim 运行的三层。"))

# ------------------------------------------------------------------ W10: spin geometry
b = []
cx, cy = 300, 150
b.append(R(270, 120, 60, 60, "s-fg", "f-soft", 1.3))
b.append(R(160, 20, 280, 22, "s-pos", "none", 1.6)); b.append(T(450, 36, "U (+y)", None, "pos", size=12))
b.append(R(160, 258, 280, 22, "s-neg", "none", 1.6)); b.append(T(450, 274, "D (−y)", None, "neg", size=12))
b.append(L(40, 150, 266, 150, "s-pos", 2, arrow=True)); b.append(T(40, 140, "μ⁺, spin ← (−z)", "μ⁺，自旋 ←（−z）", "pos", size=11))
b.append('<circle cx="560" cy="80" r="14" class="s-m" fill="none" stroke-width="1.3"/>' + L(550, 70, 570, 90, "s-m", 1.3) + L(570, 70, 550, 90, "s-m", 1.3))
b.append(T(582, 78, "B along +x, into the page", "B 沿 +x，垂直纸面向里", "m", size=11)); b.append(T(582, 96, "axes: z →, y ↑", "坐标：z →，y ↑", "m", size=11))
b.append(P(f"M{cx - 60} {cy} A60 60 0 0 0 {cx} {cy + 60}", "s-m", 1.2, arrow=True, dash="4 3"))
b.append(L(cx, cy, cx - 42, cy + 42, "s-fg", 2.2, arrow=True)); b.append(T(cx - 92, cy + 62, "S(t)", None, "", size=12))
b.append(T(520, 150, "f = (γμ/2π) B", None, "", size=14)); b.append(T(520, 172, "= 135.5 MHz/T × B", None, "m", size=12))
b.append(T(520, 194, "10 mT → 1.355 MHz", None, "m", size=12))
b.append(T(520, 228, "e⁺ prefers the spin direction:", "e⁺ 倾向沿自旋方向发射：", "m", size=11))
b.append(T(520, 246, "dN/dΩ ∝ 1 + a cos θ, ⟨a⟩ = 1/3", None, "m", size=11))
SVG["spin"] = (svg(300, b, "Side view: the muon stops in the target, its spin rotates about the field, counters above and below"),
               ("Spin starting along −z in B ∥ +x turns towards −y first, so counter D sees the excess first. a = 1/3 is the asymmetry averaged over the whole positron spectrum.",
                "在 B ∥ +x 中初始沿 −z 的自旋先转向 −y，所以计数器 D 先看到多出的正电子。a = 1/3 是对整个正电子能谱平均的不对称参数。"))

# ------------------------------------------------------------------ W11: debugging tree
b = []
layers = [("L0", "beyond 2–3σ?", "超过 2–3σ？"), ("L1", "particle generated?", "粒子产生了？"), ("L2", "geometry correct?", "几何正确？"),
          ("L3", "reached detector?", "进入探测器？"), ("L4", "physics enabled?", "物理开启？"), ("L5", "SD attached?", "SD 挂上？"),
          ("L6", "hit generated?", "产生击中？"), ("L7", "data recorded?", "数据记录？"), ("L8", "analysis correct?", "分析正确？")]
for k, (lab, en, zh) in enumerate(layers):
    x = 14 + (k % 5) * 160 if k < 5 else 94 + (k - 5) * 160
    y = 30 if k < 5 else 130
    b.append(R(x, y, 150, 52, "s-neg" if k == 0 else "s-fg", "none", 1.3))
    b.append(T(x + 10, y + 22, lab, None, "", size=13)); b.append(T(x + 10, y + 40, en, zh, "m", size=9.6))
    if k < 4: b.append(L(x + 151, y + 26, x + 159, y + 26, "s-m", 1.2, arrow=True))
    if 5 <= k < 8: b.append(L(x + 151, y + 26, x + 159, y + 26, "s-m", 1.2, arrow=True))
b.append(P("M720 82 Q730 110 170 110 Q110 112 110 128", "s-m", 1.2, arrow=True))
b.append(T(20, 214, "walk in this order every time; stop at the first layer whose evidence fails", "每次都按这个顺序走；在第一个证据不成立的层停下", "m", size=11))
SVG["tree"] = (svg(228, b, "The debugging tree as nine boxes from L0 statistics to L8 analysis"),
               ("Definition 11.1, with a statistics check (L0) added in front.",
                "定义 11.1，并在最前面加上了统计检查（L0）。"))

# ------------------------------------------------------------------ W12: research workflow
b = []
wf = [("question", "问题", "1 sentence"), ("proposal", "提案", "criterion"), ("pilot run", "试跑", "ms/event"),
      ("production", "生产", "seeds, tag"), ("analysis", "分析", "uncertainty"), ("validation", "验证", "rung, σ"), ("defence", "答辩", "10 min")]
for k, (en, zh, sub) in enumerate(wf):
    x = 14 + k * 115
    b.append(R(x, 50, 100, 60, "s-fg" if k not in (5,) else "s-neu", "none", 1.3 if k != 5 else 1.9))
    b.append(T(x + 50, 76, en, zh, "", "middle", 12)); b.append(T(x + 50, 96, sub, None, "m", "middle", 9.5))
    if k < 6: b.append(L(x + 101, 80, x + 113, 80, "s-m", 1.2, arrow=True))
b.append(P("M704 112 Q520 170 300 116", "s-m", 1.2, arrow=True, dash="4 3"))
b.append(T(500, 166, "disagreement → back to the model or the question", "不一致 → 回到模型或问题", "m", "middle", 10.5))
b.append(T(14, 34, "weights: problem 20 · implementation 20 · validation 25 · analysis 15 · communication 10 · code 10", "权重：问题 20 · 实现 20 · 验证 25 · 分析 15 · 表达 10 · 代码 10", "m", size=10.5))
SVG["workflow"] = (svg(190, b, "Research workflow from question to defence, with validation highlighted"),
                   ("From exercise to research. Validation carries the largest weight in the defence.",
                    "从练习到研究。验证在答辩中权重最大。"))


# give every figure its own arrow-marker id (several figures can share a page)
for _k in list(SVG):
    _svg, _cap = SVG[_k]
    SVG[_k] = (_svg.replace('id="ah"', f'id="ah-{_k}"').replace('url(#ah)', f'url(#ah-{_k})'), _cap)
