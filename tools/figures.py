"""Insert (or refresh) the 3D event displays and static SVG figures on the course pages.

Every inserted block is wrapped in <!-- fig:NAME --> ... <!-- /fig:NAME --> markers, so running
this script again replaces the blocks instead of duplicating them. Event-display scenes live in
assets/evd-scenes.js (engine assets/evdisplay.js, real Geant4 data in assets/evd-data.js); SVG
figures live in tools/svgfigs.py.

Usage: python3 tools/figures.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from svgfigs import SVG  # noqa: E402


def bi(en, zh):
    return f'<span lang="en">{en}</span><span lang="zh-Hans">{zh}</span>'


# scene -> (section title en/zh, aria label, caption en/zh)
EVD = {
    "muography": (
        ("Watch a hill filter the sky.", "看一座山如何“过滤”天空。"),
        "3D animation: cosmic muons fall on a hill with a tunnel and a hidden void; most stop in the rock, a few reach a telescope in the tunnel",
        ("<b>TOY MODEL.</b> A hill of standard rock (2.65 g/cm³) with a tunnel and a 14 m void. Muons aimed at the telescope have a toy spectrum dN/dE ∝ E<sup>−2.7</sup> above 1 GeV and a cos²θ angular distribution (real sea-level spectra are flatter below about 10 GeV); directions are kept close to the drawing plane. A muon reaches the tunnel only if its range, from the PDG standard-rock table, exceeds the rock along its path; otherwise it stops where the range runs out. The telescope is drawn larger than life. Lines of sight through the void cross less rock, so slightly more muons arrive from there: that excess is the muography signal.",
         "<b>玩具模型。</b>一座标准岩石（2.65 g/cm³）山体，内有隧道和一个 14 m 的空洞。射向望远镜的缪子取玩具能谱 dN/dE ∝ E<sup>−2.7</sup>（1 GeV 以上）和 cos²θ 角分布（真实海平面能谱在 10 GeV 以下更平缓）；方向限制在绘图平面附近。只有当缪子的射程（取自 PDG 标准岩石表）大于路径上的岩石厚度时，它才能到达隧道；否则在射程耗尽处停下。望远镜画得比实际大。穿过空洞的视线所经岩石更少，从那里来的缪子会略多一些：这个超出就是缪子成像的信号。"),
    ),
    "shower": (
        ("Where your muons were born.", "你的缪子诞生在哪里。"),
        "3D animation: a cosmic proton hits the atmosphere at about 15 km, produces pions that decay into muons which reach the ground",
        ("<b>TOY MODEL.</b> Heights to scale in kilometres; sideways spread exaggerated about ten times; a real shower contains far more particles than drawn. Charged pions (blue π⁺, red π⁻) decay into muons and neutrinos (green dashed); neutral pions decay at once into two photons that start a short electromagnetic cascade, drawn schematically. Most muons are produced around 15 km and reach the ground with a mean energy of about 4 GeV (PDG).",
         "<b>玩具模型。</b>高度按公里等比例绘制；横向展开放大约十倍；真实簇射中的粒子远比图中多。带电 π 介子（蓝色 π⁺、红色 π⁻）衰变为缪子和中微子（绿色虚线）；中性 π 介子立即衰变为两个光子，引发一段短暂的电磁级联，仅作示意。大多数缪子产生于约 15 km 高度，到达地面时平均能量约 4 GeV（PDG）。"),
    ),
    "w01": (
        ("Your Monte Carlo, drawn ray by ray.", "把你的蒙特卡罗一条一条画出来。"),
        "3D animation: rays enter a two-layer telescope; some cross both layers and light them, the running efficiency is shown",
        ("<b>TOY MODEL: the Week 1 Monte Carlo, drawn.</b> Two 30 × 30 cm layers 50 cm apart; directions uniform in cos θ over the downward hemisphere and entry points uniform on the upper layer, exactly as in telescope_transmission.py. Yellow: a layer crossed. The display keeps a running ε = k/N with its binomial uncertainty. Track colour (more μ⁺ than μ⁻) is decoration.",
         "<b>玩具模型：把第 1 周的蒙特卡罗画出来。</b>两层 30 × 30 cm 的探测层相距 50 cm；方向在向下半球内按 cos θ 均匀抽样，入射点在上层均匀分布，与 telescope_transmission.py 完全相同。黄色：穿过了该层。显示屏实时给出 ε = k/N 及其二项分布不确定度。径迹颜色（μ⁺ 多于 μ⁻）仅作装饰。"),
    ),
    "w02": (
        ("Replay your own Geant4 events.", "回放你自己的 Geant4 事例。"),
        "3D replay of Geant4 events: 100 MeV negative pions from a gun at z equals minus 1 metre, some decaying into a muon and a neutrino",
        ("<b>GEANT4 11.4 DATA.</b> Sixteen events from our run of pion.mac (100 MeV π⁻, gun at z = −1 m, empty 3 m world): only the track end points Geant4 printed are drawn. Red: negative; green dashed: the neutrino, which no detector would see. We picked 12 decays and 4 pions that leave the world. In the full run of 1000, 198 pions decayed (19.8%), close to the 20.5% expected from a mean decay length of 10.9 m over 2.5 m.",
         "<b>GEANT4 11.4 数据。</b>取自我们运行 pion.mac（100 MeV π⁻，粒子枪位于 z = −1 m，3 m 空 world）的 16 个事例：只画出 Geant4 打印的径迹端点。红色：负电荷；绿色虚线：中微子，任何探测器都看不到它。我们挑了 12 个衰变事例和 4 个飞出 world 的事例。在完整的 1000 个事例中，有 198 个 π 介子衰变（19.8%），与平均衰变长度 10.9 m、飞行 2.5 m 时预期的 20.5% 接近。"),
    ),
    "w03": (
        ("Every dot is a step Geant4 took.", "每个点都是 Geant4 走的一步。"),
        "3D replay of Geant4 steps: a 1 GeV negative muon crosses a 10 cm lead block; step points coloured by the process that ended each step, with short delta-electron tracks",
        ("<b>GEANT4 11.4 DATA.</b> 1 GeV μ⁻ through 10 cm of lead: the first 20 events of our run1000.mac. Each dot is the end of a step, coloured by the process that ended it (blue muIoni, white Transportation at a boundary, red eIoni for δ-electrons). The printout is 2D (x–z), so everything sits in one plane; δ-electrons are drawn from the muon step nearest their first recorded point, because their starting point was not printed.",
         "<b>GEANT4 11.4 数据。</b>1 GeV μ⁻ 穿过 10 cm 铅：我们运行 run1000.mac 的前 20 个事例。每个点是一步的终点，按结束它的过程着色（蓝色 muIoni，白色 Transportation 表示到达边界，红色 eIoni 表示 δ 电子）。打印输出是二维的（x–z），所以所有点都在同一平面内；δ 电子的起点没有打印，因此从离其第一个记录点最近的缪子步画起。"),
    ),
    "w05": (
        ("From a passing muon to a trigger decision.", "从一个穿过的缪子到一次触发判定。"),
        "3D animation: a muon crosses two scintillator counters, light travels to a SiPM, pulses appear and the coincidence decides the trigger",
        ("<b>TOY MODEL.</b> The Week 5 geometry: two 10 × 10 × 1 cm counters 20 cm apart, cos²θ muons from a 30 × 30 cm plane. Light paths are schematic (real photons reflect many times before reaching the SiPM); pulse shapes, amplitudes and the noise rate are illustrative. A counter fires when its pulse crosses the dashed threshold; the trigger needs both counters within a 15 ns window.",
         "<b>玩具模型。</b>第 5 周的几何：两块 10 × 10 × 1 cm 的计数器相距 20 cm，cos²θ 缪子从 30 × 30 cm 平面射入。光路只作示意（真实光子到达 SiPM 前会反射多次）；脉冲形状、幅度和噪声率均为示意值。脉冲越过虚线阈值时计数器响应；触发要求两个计数器在 15 ns 窗口内同时响应。"),
    ),
    "w07": (
        ("Six points, one bend, one momentum.", "六个点、一次弯折、一个动量。"),
        "3D replay of Geant4 spectrometer events: a muon crosses three silicon planes, bends in a 1.5 tesla magnet, crosses three more planes; the momentum is reconstructed from the six crossing points",
        ("<b>GEANT4 11.4 DATA.</b> μ⁻ from our spectrometer runs at 1, 2, 5, 10 and 20 GeV/c. The six yellow points are the plane crossings Geant4 recorded; the path between them, and inside the magnet, is interpolated for drawing. The display reconstructs p from the six points with the two-line method of Eq. (7.1). At 20 GeV/c the deflection is only 22 mrad, which is why the resolution degrades with momentum.",
         "<b>GEANT4 11.4 数据。</b>取自我们 1、2、5、10、20 GeV/c 的谱仪运行的 μ⁻。六个黄点是 Geant4 记录的平面穿越点；它们之间以及磁铁内部的路径为绘图插值。显示屏用式 (7.1) 的两直线法由六个点重建 p。20 GeV/c 时偏转角只有 22 mrad，这就是分辨率随动量变差的原因。"),
    ),
    "w10": (
        ("Watch the spin turn, then see where the positron goes.", "看自旋转动，再看正电子飞向哪里。"),
        "3D animation of transverse-field muon spin rotation: a positive muon stops in a copper target, its spin arrow precesses, it decays and the positron hits the upper or lower counter; an asymmetry histogram builds up",
        ("<b>TOY MODEL.</b> The tf_musr.mac geometry: copper target, counters 45 mm above and below, B = 10 mT along x. Time is slowed: one microsecond of muon time lasts 1.1 s; decay times are cut at about 6 µs to keep the loop short. The positron direction is drawn from 1 + (1/3) S·n with no energy threshold and no material, on a straight path (in 10 mT a 30 MeV positron curves with a radius of about 10 m). The bars collect A(t) = (D − U)/(D + U); the dashed curve is the oscillation at 1.355 MHz. Real numbers: Week 10's Geant4 run.",
         "<b>玩具模型。</b>tf_musr.mac 的几何：铜靶，上下 45 mm 处各一块计数器，B = 10 mT 沿 x 方向。时间被放慢：缪子时间的 1 微秒在动画中持续 1.1 秒；为让循环不太长，衰变时间截断在约 6 µs。正电子方向按 1 + (1/3) S·n 抽样，无能量阈、无材料，沿直线飞行（10 mT 中 30 MeV 正电子的曲率半径约 10 m）。柱状图累计 A(t) = (D − U)/(D + U)；虚线是 1.355 MHz 的振荡。真实数值见第 10 周的 Geant4 运行。"),
    ),
}

DATA_SCENES = {"w02", "w03", "w07"}


def evd_figure(scene):
    title, label, cap = EVD[scene]
    return (f'<figure class="evd-fig"><div data-scene="{scene}" data-poster="media/evd-{scene}.gif" data-label="{label}"></div>'
            f'<figcaption class="evd-cap">{bi(*cap)}</figcaption></figure>')


def evd_section(scene):
    title = EVD[scene][0]
    return ('  <section class="run" aria-labelledby="h-evd">\n'
            f'    <p class="cmd">/vis/open TSG{bi("event display", "事例显示")}</p>\n'
            '    <div>\n'
            f'      <h2 id="h-evd" class="bi">{bi(*title)}</h2>\n'
            f'      {evd_figure(scene)}\n'
            '    </div>\n'
            '  </section>\n')


def svg_figure(name):
    svg, cap = SVG[name]
    return f'<figure class="fig-svg">{svg}<figcaption>{bi(*cap)}</figcaption></figure>'


# page -> list of (block name, html, where); where = ("after", regex) | ("before", regex)
PLAN = {
    "index.html": [("evd-muography", evd_section("muography"), ("before", r'  <section class="h-sec" aria-labelledby="h-learn">'))],
    "primer.html": [
        ("svg-shower", svg_figure("shower"), ("before", r'      <div class="box">\n        <p class="box-label"><span lang="en">Why muons reach')),
        ("evd-shower", evd_figure("shower"), ("before", r'      <p lang="en">What arrives at sea level')),
        ("svg-areal", svg_figure("areal"), ("before", r'      <p lang="en">In rock a muon loses roughly')),
        ("svg-modes", svg_figure("modes"), ("before", r'      <p lang="en">The price of a free probe is time')),
        ("evd-muography", evd_figure("muography"), ("before", r'      <p lang="en">The price of a free probe is time')),
    ],
}
WEEK_EVD = {1: "w01", 2: "w02", 3: "w03", 5: "w05", 7: "w07", 10: "w10"}
WEEK_SVG = {
    1: [("svg-w01", "telescope", "lesson")], 2: [("svg-w02", "hierarchy", "lesson")], 3: [("svg-w03", "geomlayers", "lesson")],
    4: [("svg-w04", "bethe", "lesson")], 5: [("svg-w05", "chain", "lesson")], 6: [("svg-w06", "physlist", "lesson")],
    7: [("svg-w07", "spectro", "lesson")], 8: [("svg-w08", "pipeline", "lesson")], 9: [("svg-w09", "layers", "lesson")],
    10: [("svg-w10", "spin", "lesson")], 11: [("svg-w11", "tree", "lesson")], 12: [("svg-w12", "workflow", "lesson")],
}

BLOCK = re.compile(r'<!-- fig:(?P<n>[\w-]+) -->.*?<!-- /fig:(?P=n) -->\n?', re.S)


def first_lesson_anchor(s):
    """Insert lesson figures before the first G4Exception, box or code block of the first lesson section after the background."""
    start = s.index('id="background"')
    sec = s.index('<section class="run', s.index('</section>', start))
    while 'aria-labelledby="h-evd"' in s[sec:sec + 200]:
        sec = s.index('<section class="run', s.index('</section>', sec))
    m = re.compile(r'\n\s*<(div class="(?:g4ex|code|box|aside)"|pre>|h3 )').search(s, sec)
    return m.start() + 1


def insert(s, name, html, where):
    block = f'<!-- fig:{name} -->\n{html}\n<!-- /fig:{name} -->\n'
    if where == "lesson":
        i = first_lesson_anchor(s)
        return s[:i] + block + s[i:]
    mode, pat = where
    m = re.search(pat, s)
    assert m, (name, pat)
    i = m.start() if mode == "before" else m.end()
    return s[:i] + block + s[i:]


def scripts(s, need_data):
    s = re.sub(r'<script src="assets/(evd-data|evdisplay|evd-scenes)\.js"></script>\n?', '', s)
    tags = ('<script src="assets/evd-data.js"></script>\n' if need_data else '') + \
        '<script src="assets/evdisplay.js"></script>\n<script src="assets/evd-scenes.js"></script>\n'
    i = s.index('<script src="assets/course.js"></script>') + len('<script src="assets/course.js"></script>\n')
    return s[:i] + tags + s[i:]


def main():
    plan = {k: list(v) for k, v in PLAN.items()}
    for n in range(1, 13):
        page = f"week{n:02d}.html"
        items = []
        if n in WEEK_EVD:
            items.append((f"evd-w{n:02d}", evd_section(WEEK_EVD[n]), ("after", r'(?s)<section class="run[^"]*" id="background".*?</section>\n')))
        for name, fig, where in WEEK_SVG.get(n, []):
            items.append((name, svg_figure(fig), where))
        plan[page] = items
    for page, items in plan.items():
        p = ROOT / page
        s = BLOCK.sub("", p.read_text(encoding="utf-8"))
        for name, html, where in items:
            s = insert(s, name, html, where)
        if any(name.startswith("evd") for name, _, _ in items):
            scenes = re.findall(r'data-scene="(\w+)"', s)
            s = scripts(s, any(x in DATA_SCENES for x in scenes))
        p.write_text(s, encoding="utf-8")
        print(page, [name for name, _, _ in items])


if __name__ == "__main__":
    main()
