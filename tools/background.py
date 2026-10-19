"""Insert (or refresh) the "Background for non-physicists" section of each week page.

The section goes right after the learning-goals section. It is written for students from
civil engineering and geology who want to simulate muography projects: each week gets two or
three plain-language explainers and one note on how the week is used in muography.
Numbers come from the PDG Review of Particle Physics; see primer.html for sources.

Usage: python3 tools/background.py            # all weeks, idempotent
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

W = {}

W[1] = dict(
    title=("A Monte Carlo is a way to get an answer by rolling dice many times.",
           "蒙特卡罗方法：用“掷很多次骰子”得到答案。"),
    boxes=[
        ("Monte Carlo in engineering terms", "工程语言里的蒙特卡罗",
         "If you have estimated a failure probability by sampling random loads and strengths, you have already done Monte Carlo. Here the random inputs are a muon's direction and entry point, the model is a straight line, and the output is a yes/no: did it cross both detector layers? The fraction of yes answers estimates the probability.",
         "如果你曾通过随机抽取荷载和强度来估计结构的失效概率，你就已经做过蒙特卡罗了。这里的随机输入是缪子的方向和入射点，模型是一条直线，输出是“是/否”：它穿过两层探测器了吗？回答“是”的比例就是概率的估计值。"),
        ("Why the error shrinks only as 1/√N", "为什么误差只按 1/√N 缩小",
         "Each trial is a coin flip with probability ε. Counting k successes in N trials has a spread of √(Nε(1−ε)), so the estimate k/N has an uncertainty of √(ε(1−ε)/N). Ten times more trials buy only √10 ≈ 3.2 times more precision. Real muon counting obeys the same rule, which is why muography surveys take days.",
         "每次试验都像一次概率为 ε 的抛硬币。N 次试验中成功 k 次，其涨落为 √(Nε(1−ε))，所以估计值 k/N 的不确定度是 √(ε(1−ε)/N)。试验次数增加十倍，精度只提高 √10 ≈ 3.2 倍。真实的缪子计数遵循同样的规律，这就是缪子成像勘测要持续好几天的原因。"),
        ("cos²θ: why most muons come from overhead", "cos²θ：为什么大多数缪子来自头顶",
         "θ is the zenith angle, measured from straight down. Muons arriving at a slant cross much more air, so fewer survive and they are more energetic. Near 3 GeV the result is an intensity roughly proportional to cos²θ: at 60° it is a quarter of the vertical value.",
         "θ 是天顶角，从竖直向下方向量起。斜着来的缪子要穿过多得多的空气，存活下来的更少，能量也更高。在 3 GeV 附近，强度大致正比于 cos²θ：60° 时只有竖直方向的四分之一。"),
    ],
    mug=("The quantity you compute this week is a telescope's acceptance: which directions it sees and how often. In a muography survey, acceptance × sky intensity × time gives the number of muons expected along each line of sight. It is the first number in any feasibility study for a tunnel or slope.",
         "本周计算的是望远镜的接受度：它能看到哪些方向、看到的频率如何。在缪子成像勘测中，接受度 × 天空强度 × 时间，给出每条视线上预期的缪子数。这是隧道或边坡可行性研究中要算的第一个数。"),
)

W[2] = dict(
    title=("Before Geant4: particles, energy and why a muon lives long enough to reach you.",
           "进入 Geant4 之前：粒子、能量，以及缪子为什么能活着到达你身边。"),
    boxes=[
        ("Kinetic energy, momentum, mass", "动能、动量、质量",
         "Geant4's particle gun sets kinetic energy, the energy of motion. Momentum p and kinetic energy T are linked by p = √(T² + 2Tm) in units where c = 1; the muon mass is m = 105.7 MeV. For a 1 GeV muon, p = 1.10 GeV/c. Above a few GeV, p and T are nearly equal, so muography papers often quote either.",
         "Geant4 的粒子枪设定的是动能，即运动的能量。在 c = 1 的单位制中，动量 p 与动能 T 的关系是 p = √(T² + 2Tm)；缪子质量 m = 105.7 MeV。1 GeV 的缪子 p = 1.10 GeV/c。几个 GeV 以上时，p 和 T 几乎相等，所以缪子成像文献两种说法都有。"),
        ("Decay and time dilation", "衰变与时间膨胀",
         "A muon at rest lives 2.197 µs on average and then decays into an electron and two neutrinos. A moving muon's clock runs slow by the factor γ = E/m. A 1 GeV muon (γ ≈ 10.5) travels about 7 km on average before decaying, so in any detector-sized world you will almost never see it decay in flight. Stopped muons, as in Week 10, do decay in front of you.",
         "静止的缪子平均寿命 2.197 µs，之后衰变为一个电子和两个中微子。运动缪子的时钟按因子 γ = E/m 变慢。1 GeV 的缪子（γ ≈ 10.5）平均要飞约 7 km 才衰变，所以在探测器尺度的模拟世界里几乎看不到它在飞行中衰变。停下来的缪子（如第 10 周）才会在你面前衰变。"),
        ("Run, event, track, step in plain words", "用大白话说运行、事例、径迹、步",
         "A run is one experiment with fixed settings, like one load case. An event is one muon arriving, plus everything it causes. A track is the path of one particle, including the electrons it knocks out. A step is one short segment of a track, ending at a material boundary or where something happens. Geant4 computes physics step by step, much as a time-stepping solver advances a structure.",
         "一次运行是设置固定的一次实验，类似一个工况。一个事例是一个缪子到来及其引起的一切。一条径迹是一个粒子的路径，包括被它打出来的电子。一步是径迹中的一小段，在材料边界或发生某种过程时结束。Geant4 一步一步地计算物理，就像时间步进求解器一步步推进结构响应。"),
    ],
    mug=("A muography data set is millions of events, each one cosmic muon. Changing particle, energy, position and direction is exactly how you will later aim a simulated sky at a model of a hillside.",
         "缪子成像的数据集由数百万个事例组成，每个事例是一个宇宙线缪子。改变粒子种类、能量、位置和方向，正是你以后把模拟天空“对准”山坡模型的方法。"),
)

W[3] = dict(
    title=("A muon does not see shapes, it sees grams per square centimetre.",
           "缪子看不见形状，它“看见”的是每平方厘米多少克。"),
    boxes=[
        ("Shape, material, placement", "形状、材料、放置",
         "Geant4 separates three decisions an engineer makes anyway: the geometry of a part (solid), what it is made of (logical volume with a material), and where it sits (physical placement). A tunnel lining, a rock layer and a detector plane are each built the same way.",
         "Geant4 把工程师本来就要做的三个决定分开：部件的几何（实体）、它由什么做成（带材料的逻辑体）、它放在哪里（物理放置）。隧道衬砌、岩层和探测平面都是这样搭建的。"),
        ("Materials for engineers", "给工程师的材料说明",
         "Geant4 ships a NIST database: G4_CONCRETE (2.3 g/cm³), G4_WATER, G4_Fe, G4_Pb, G4_SILICON_DIOXIDE and many more. Rock is usually defined by hand from its measured density and its main oxides or elements. For muon absorption the density matters most; the composition shifts the energy loss by a few percent.",
         "Geant4 自带 NIST 材料库：G4_CONCRETE（2.3 g/cm³）、G4_WATER、G4_Fe、G4_Pb、G4_SILICON_DIOXIDE 等。岩石通常要根据实测密度和主要氧化物或元素手工定义。对缪子吸收来说，密度最重要；成分只会让能量损失改变几个百分点。"),
        ("Areal density: the number that matters", "面密度：真正重要的数",
         "Density × thickness, in g/cm². Ten metres of concrete (2.3 g/cm³) is 2 300 g/cm², the same as 23 m of water or about 8.7 m of standard rock (2.65 g/cm³). Muography measures this quantity along each direction, not density or thickness alone.",
         "密度 × 厚度，单位 g/cm²。10 米混凝土（2.3 g/cm³）是 2 300 g/cm²，等于 23 米水，或约 8.7 米标准岩石（2.65 g/cm³）。缪子成像测量的是沿每个方向的这个量，而不是单独的密度或厚度。"),
    ],
    mug=("A site model is this week's skill at scale: terrain from a digital elevation model, layers from boreholes, a tunnel from the design drawings, often imported through CAD/GDML. Run the overlap check after every change; an overlap between rock layers silently doubles or loses mass along some lines of sight.",
         "场地模型就是本周技能的放大版：地形来自数字高程模型，地层来自钻孔，隧道来自设计图纸，常通过 CAD/GDML 导入。每次修改后都要做重叠检查；岩层之间的重叠会在某些视线上悄悄多算或漏算质量。"),
)

W[4] = dict(
    title=("Why a muon loses about half a GeV per metre of rock.",
           "为什么缪子每穿过一米岩石大约损失半个 GeV。"),
    boxes=[
        ("Ionisation, like friction", "电离，就像摩擦",
         "As a fast charged particle passes atoms, its electric field tugs on their electrons and knocks some loose. Each kick takes a little energy. Summed over billions of atoms, the loss is smooth and predictable, described by the Bethe formula of this week. Slow particles lose more, because they spend longer near each atom.",
         "快速带电粒子经过原子时，它的电场拉扯原子中的电子，把一些电子打出来。每次撞击带走一点能量。对数十亿个原子求和，损失是平滑可预测的，由本周的 Bethe 公式描述。慢的粒子损失更多，因为它在每个原子附近停留得更久。"),
        ("The minimum-ionising muon", "最小电离的缪子",
         "The loss per g/cm² has a broad minimum near a few hundred MeV and rises only slowly above it. Most cosmic muons sit near this minimum, losing roughly 1.7 to 2.5 MeV per g/cm² in rock. That is about 0.5 GeV per metre of standard rock and about 0.2 GeV per metre of water.",
         "每 g/cm² 的能量损失在几百 MeV 附近有一个宽的最小值，之后只缓慢上升。大多数宇宙线缪子处在这个最小值附近，在岩石中每 g/cm² 损失约 1.7 到 2.5 MeV，相当于每米标准岩石约 0.5 GeV、每米水约 0.2 GeV。"),
        ("Mean and most probable are different", "平均值与最可几值不同",
         "Occasionally a muon kicks one electron very hard. These rare large losses pull the average up, while the typical event loses less. Engineers who know skewed distributions such as floods or wind gusts will recognise the long tail. Week 11 shows how a histogram that cuts the tail gives a wrong mean.",
         "偶尔缪子会把某个电子打得很重。这些罕见的大损失把平均值拉高，而典型事例损失得更少。熟悉洪水或阵风这类偏态分布的工程师会认出这条长尾。第 11 周会展示截掉尾巴的直方图如何给出错误的平均值。"),
    ],
    mug=("This energy loss is the physics of absorption muography. Under a given overburden only muons above a threshold energy survive (see the range table in the primer: about 10 GeV for 19 m of standard rock). The steep cosmic spectrum turns every change in overburden into a measurable change in rate.",
         "这种能量损失就是吸收式缪子成像的物理基础。在给定的覆盖层下，只有高于阈值能量的缪子能存活（见入门页的射程表：19 米标准岩石约需 10 GeV）。宇宙线能谱很陡，所以覆盖层的每一点变化都会变成可测量的计数率变化。"),
)

W[5] = dict(
    title=("How a detector turns a passing muon into a number.",
           "探测器如何把一个穿过的缪子变成一个数字。"),
    boxes=[
        ("Scintillator and photosensor", "闪烁体与光电器件",
         "A plastic scintillator emits a faint flash of light when a charged particle deposits energy in it, about 2 MeV per centimetre for a muon. A photomultiplier tube (PMT) or silicon photomultiplier (SiPM) turns the flash into an electrical pulse that electronics digitise into an ADC number.",
         "带电粒子在塑料闪烁体中沉积能量时会发出微弱的闪光，缪子约每厘米 2 MeV。光电倍增管（PMT）或硅光电倍增器（SiPM）把闪光转换成电脉冲，电子学再把它数字化为一个 ADC 数值。"),
        ("Threshold, efficiency, noise", "阈值、效率、噪声",
         "A signal counts only if it exceeds a threshold. Set it too high and real muons are missed (lower efficiency); too low and electronic noise or natural radioactivity fire it (more fake hits). Efficiency is the fraction of real muons recorded, and it always needs an uncertainty.",
         "信号只有超过阈值才被计入。阈值太高会漏掉真实缪子（效率降低）；太低则电子学噪声或天然放射性也会触发（假击中增多）。效率是被记录下来的真实缪子比例，它必须附带不确定度。"),
        ("Coincidence", "符合",
         "Requiring two or more planes to fire within a short window, say 20 ns, rejects most noise, because random pulses rarely line up in time. It also defines a direction: a muon telescope is two or more planes in coincidence.",
         "要求两层或更多探测平面在短时间窗（比如 20 ns）内同时响应，可以去掉大部分噪声，因为随机脉冲很少在时间上对齐。这同时也定义了方向：缪子望远镜就是两层或多层处于符合状态的探测平面。"),
    ],
    mug=("Field muography telescopes are stacks of scintillator strips, resistive plate chambers or nuclear emulsion. Outdoors and underground, temperature, humidity and radon change noise and efficiency. Simulate the detector response, not just the muons, so that efficiency changes are not mistaken for density changes.",
         "野外缪子成像望远镜由闪烁体条、阻性板室或核乳胶叠成。在室外和地下，温度、湿度和氡会改变噪声和效率。要模拟探测器响应而不仅是缪子，这样效率的变化才不会被误认为密度的变化。"),
)

W[6] = dict(
    title=("A physics list is the material model of a particle simulation.",
           "物理列表就是粒子模拟中的“本构模型”。"),
    boxes=[
        ("What a physics list is", "物理列表是什么",
         "In finite-element work you choose a constitutive model, linear elastic or plastic, and the answer depends on it. A Geant4 physics list plays the same role: it decides which interactions exist, such as ionisation, scattering, photon processes, nuclear reactions and decay. A missing process gives no error message, only a wrong answer.",
         "在有限元分析中，你要选本构模型（线弹性还是塑性），答案依赖于它。Geant4 的物理列表起同样的作用：它决定存在哪些相互作用，例如电离、散射、光子过程、核反应和衰变。缺少某个过程不会报错，只会给出错误的答案。"),
        ("Production cuts", "产生阈",
         "Following every tiny electron knocked out by a muon would be very slow. A production cut tells Geant4 not to create secondaries that would travel less than a set distance (0.7 mm by default) and to deposit their energy locally instead. It is like choosing a mesh size: too coarse loses detail, too fine wastes time.",
         "追踪缪子打出的每个微小电子会非常慢。产生阈告诉 Geant4：射程短于设定距离（默认 0.7 mm）的次级粒子不再单独产生，其能量就地沉积。这就像选网格尺寸：太粗丢细节，太细浪费时间。"),
    ],
    mug=("For muon transport through rock, standard electromagnetic physics with muon processes and decay carries most of the result; a reference list such as FTFP_BERT includes them. Hadronic physics matters for backgrounds (neutrons, showers) and for very deep sites. For scattering muography, compare multiple-scattering models, because the scattering angle is the signal.",
         "对于缪子穿过岩石的输运，标准电磁物理加上缪子过程和衰变决定了大部分结果，FTFP_BERT 这样的参考列表包含了它们。强子物理对本底（中子、簇射）和很深的场地才重要。做散射式缪子成像时，要比较不同的多次散射模型，因为散射角本身就是信号。"),
)

W[7] = dict(
    title=("Magnets bend charged particles: that is how momentum is measured.",
           "磁场使带电粒子拐弯，这就是测量动量的方法。"),
    boxes=[
        ("The bending rule", "拐弯的规律",
         "In a magnetic field B a charged particle moves on a circle of radius R, with p [GeV/c] = 0.3 B [T] R [m]. A stiffer, more energetic particle bends less. Measuring positions before and after a magnet gives the radius, hence the momentum.",
         "带电粒子在磁场 B 中沿半径为 R 的圆运动，p [GeV/c] = 0.3 B [T] R [m]。能量越高、越“硬”的粒子拐得越少。在磁铁前后测量位置就能得到半径，进而得到动量。"),
        ("Does the Earth's field matter?", "地磁场有影响吗？",
         "Barely, at detector scale. The geomagnetic field is about 50 µT, so a 4 GeV/c muon would curve with a radius of roughly 270 km. Across a 2 m telescope the deflection is negligible. The field does matter for the incoming cosmic-ray flux, which depends on latitude.",
         "在探测器尺度上几乎没有影响。地磁场约 50 µT，4 GeV/c 的缪子曲率半径约 270 km。穿过 2 米长的望远镜，偏转可以忽略。但地磁场会影响入射宇宙线的通量，通量随纬度变化。"),
    ],
    mug=("Most muography telescopes have no magnet, so the momentum of each muon is unknown. That is a key uncertainty: low-momentum muons scatter more and blur the image. Some detectors add a lead or iron absorber layer to reject soft muons. Simulating with and without such a layer is a typical design study.",
         "大多数缪子成像望远镜没有磁铁，所以每个缪子的动量未知。这是一个关键的不确定因素：低动量缪子散射更大，会使图像模糊。有些探测器加一层铅或铁吸收体来剔除软缪子。有无这层吸收体的对比模拟是一项典型的设计研究。"),
)

W[8] = dict(
    title=("Data are tables: one row per event, one column per measured quantity.",
           "数据就是表格：一行一个事例，一列一个测量量。"),
    boxes=[
        ("ROOT files and ntuples", "ROOT 文件与 ntuple",
         "An ntuple is a table, like a spreadsheet or a CSV file, where each row is an event and each column a quantity: time, energy deposited, which channel fired. ROOT is the particle-physics file format and toolkit for such tables. With the Python package uproot you can read it into NumPy without installing ROOT.",
         "ntuple 就是一张表，像电子表格或 CSV 文件：每一行是一个事例，每一列是一个量，比如时间、沉积能量、哪个通道响应。ROOT 是粒子物理处理这类表格的文件格式和工具包。用 Python 包 uproot 可以直接读入 NumPy，无需安装 ROOT。"),
        ("Truth versus measurement", "真值与测量值",
         "A simulation knows everything: the muon's true energy and path. A real detector only knows hit times, positions and pulse heights. Keep the two in separate tables, and make the measured one look exactly like the real data acquisition (DAQ) output. Then the same analysis program runs on both.",
         "模拟知道一切：缪子的真实能量和路径。真实探测器只知道击中时间、位置和脉冲幅度。把两者放在不同的表里，并让测量表与真实数据采集（DAQ）的输出完全一致。这样同一个分析程序可以在两者上运行。"),
    ],
    mug=("A muography result is usually a ratio: the measured count along each direction divided by the simulated count for a reference model (or by an open-sky measurement). That only works if field data and simulation pass through the same reconstruction code, which is this week's DAQ-parity rule.",
         "缪子成像的结果通常是一个比值：每个方向上的实测计数除以参考模型的模拟计数（或除以开阔天空的测量）。只有当野外数据和模拟经过同一套重建代码时，这才行得通，也就是本周的 DAQ 一致性原则。"),
)

W[9] = dict(
    title=("An application layer: running Geant4 from a text file.",
           "应用层：用一个文本文件驱动 Geant4。"),
    boxes=[
        ("What musrSim is", "musrSim 是什么",
         "musrSim is a Geant4 application written for μSR, a materials-science technique that implants muons from an accelerator into a sample. Its geometry, beam and output are set in a text macro instead of C++. The idea transfers: many groups build such an application once and then run many configurations from macros.",
         "musrSim 是为 μSR 编写的 Geant4 应用程序。μSR 是一种材料科学技术，把加速器产生的缪子注入样品。它的几何、束流和输出都在文本宏中设置，而不是写在 C++ 里。这种思路是通用的：许多课题组把应用程序写一次，然后用宏运行各种配置。"),
        ("Jagged arrays", "锯齿数组",
         "One muon may fire one detector plane, or five. A table column such as \"detector IDs hit\" then holds a list of different length in each row: a jagged array. Select the plane you want before flattening the lists, or rows from different events get mixed up.",
         "一个缪子可能只触发一个探测平面，也可能触发五个。于是像“被击中的探测器编号”这样的列，每一行是一个长度不同的列表：锯齿数组。先选出你要的平面，再把列表展平，否则不同事例的行会被混在一起。"),
    ],
    mug=("If you are on the muography track, skim this week for the macro-driven workflow and the jagged-array analysis. Both appear in every multi-plane telescope analysis. The μSR beam details can be skipped.",
         "如果你走缪子成像方向，本周略读即可，重点看由宏驱动的工作流程和锯齿数组分析，这两者在每一个多层望远镜的分析中都会出现。μSR 束流的细节可以跳过。"),
)

W[10] = dict(
    title=("Spin: the muon is a tiny compass needle that wobbles in a magnetic field.",
           "自旋：缪子是一根在磁场中摆动的小磁针。"),
    boxes=[
        ("Spin and precession", "自旋与进动",
         "Besides charge and mass, a muon has spin, which makes it a tiny magnet. In a magnetic field its spin axis turns around the field direction, like a tilted spinning top, at a frequency proportional to the field: 135.5 MHz per tesla. Measure the frequency and you have measured the field inside the material.",
         "除了电荷和质量，缪子还有自旋，这让它成为一个微小的磁体。在磁场中，它的自旋轴绕磁场方向转动，就像一个倾斜旋转的陀螺，频率正比于磁场：每特斯拉 135.5 MHz。测出频率，就测出了材料内部的磁场。"),
        ("How the spin is seen", "怎样看到自旋",
         "When a positive muon decays, its positron is more likely to fly out along the spin direction. Two counters on opposite sides therefore see their rates rise and fall in turn as the spin rotates. Their normalised difference, the asymmetry, oscillates at the precession frequency.",
         "正缪子衰变时，正电子更倾向于沿自旋方向飞出。所以随着自旋转动，两侧相对的计数器计数率此起彼伏。两者归一化后的差值，即不对称度，以进动频率振荡。"),
    ],
    mug=("μSR is not muography: it uses accelerator muons stopped in small samples to study magnetism and superconductivity. On the muography track this week is optional. Worth keeping: field maps must be printed and checked before use, and a fit that converges can still be meaningless (the no-spin control).",
         "μSR 不是缪子成像：它把加速器缪子停在小样品中，研究磁性和超导。对缪子成像方向来说，本周为选修。值得记住的有两点：场图在使用前必须打印出来核对；拟合收敛不代表结果有意义（不加自旋的对照运行就是例子）。"),
)

W[11] = dict(
    title=("Verification asks \"did I build it right?\" Validation asks \"did I build the right thing?\"",
           "检验问“我搭对了吗？”，验证问“我搭的是对的东西吗？”"),
    boxes=[
        ("V&V, as in engineering", "工程中的 V&V",
         "Engineers already know verification and validation from computational mechanics: first check that the code solves its equations correctly, then compare it with experiments. Geant4 work follows the same order. Debugging is verification; comparing with the PDG tables or a field measurement is validation.",
         "工程师在计算力学中已经熟悉“检验与验证”：先确认代码正确地求解了方程，再与实验比较。Geant4 工作遵循同样的顺序。调试属于检验；与 PDG 表或野外测量比较属于验证。"),
        ("What \"σ\" means", "“σ”是什么意思",
         "σ is a standard deviation, the typical size of random scatter. For a Gaussian error, 68% of repeated measurements fall within 1σ and 95% within 2σ. A difference of 0.7σ is ordinary noise; 3σ or more deserves an explanation. Always state which uncertainties went into σ.",
         "σ 是标准差，即随机涨落的典型大小。对于高斯误差，重复测量有 68% 落在 1σ 以内，95% 落在 2σ 以内。0.7σ 的差别是普通涨落；3σ 以上就需要解释。一定要说明 σ 包含了哪些不确定度。"),
    ],
    mug=("Before trusting a density map, validate the simulation where the answer is known: the open-sky rate and its zenith-angle dependence at the site, and a calibration run through a known thickness such as a building or a tunnel section with surveyed overburden.",
         "在相信一张密度图之前，先在答案已知的地方验证模拟：现场开阔天空的计数率及其随天顶角的变化，以及穿过已知厚度的标定测量，比如一栋建筑或覆盖层已测绘的一段隧道。"),
)

W[12] = dict(
    title=("A research question for a muography project fits in one sentence.",
           "一个缪子成像项目的研究问题，一句话就能说清。"),
    boxes=[
        ("Example questions", "问题示例",
         "Can a 1 m² telescope in the tunnel at chainage 2+300 detect a 3 m void within 20 m above the crown in one month? How precisely can three months of data measure the mean density of the overburden above a planned shaft? Does a 5 cm lead absorber improve the contrast enough to pay for its weight?",
         "隧道里程 2+300 处的一台 1 m² 望远镜，能否在一个月内探测到拱顶以上 20 m 范围内一个 3 m 的空洞？三个月的数据能把拟建竖井上方覆盖层的平均密度测到多准？5 cm 厚的铅吸收体带来的对比度提升，值不值得它的重量？"),
        ("Significance of a feature", "特征的显著性",
         "If the model without the void predicts N muons along a direction and the void adds ΔN, the feature stands out by about ΔN/√N standard deviations. Both N and ΔN grow with exposure time, so significance grows only as √time. That is the 1/√N rule of Week 1 again, now deciding how long the instrument stays underground.",
         "若无空洞的模型在某个方向上预测 N 个缪子，空洞使其增加 ΔN，则这个特征的显著性约为 ΔN/√N 个标准差。N 和 ΔN 都随测量时间增长，所以显著性只按 √时间 增长。这又是第 1 周的 1/√N 规律，只是现在它决定仪器要在地下待多久。"),
    ],
    mug=("Use the feasibility planner on this page with your site's numbers. A good muography proposal states the target (void size, density contrast), the overburden and its uncertainty, the detector area and acceptance, the exposure time, and the significance it expects, before any data are taken.",
         "用本页的可行性规划器代入你场地的数字。一份好的缪子成像提案应当在采集任何数据之前写明：目标（空洞尺寸、密度对比）、覆盖层厚度及其不确定度、探测器面积和接受度、测量时间，以及预期的显著性。"),
)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def section(n):
    d = W[n]
    parts = [
        '  <section class="run" id="background" aria-labelledby="h-bg">',
        '    <p class="cmd">/control/echo background<span lang="en">background · for non-physicists</span><span lang="zh-Hans">背景知识 · 写给非物理专业</span></p>',
        '    <div class="prose">',
        f'      <h2 id="h-bg" class="bi"><span lang="en">{esc(d["title"][0])}</span><span lang="zh-Hans">{esc(d["title"][1])}</span></h2>',
    ]
    for le, lz, te, tz in d["boxes"]:
        parts += [
            '      <div class="box">',
            f'        <p class="box-label">Background · <span lang="en">{esc(le)}</span><span lang="zh-Hans">{esc(lz)}</span></p>',
            f'        <p lang="en">{esc(te)}</p>',
            f'        <p lang="zh-Hans">{esc(tz)}</p>',
            '      </div>',
        ]
    parts += [
        '      <div class="aside">',
        '        <p class="aside-label"><span lang="en">For muography projects</span><span lang="zh-Hans">用于缪子成像工程</span></p>',
        f'        <p lang="en">{esc(d["mug"][0])}</p>',
        f'        <p lang="zh-Hans">{esc(d["mug"][1])}</p>',
        '      </div>',
        '      <p class="cap"><span lang="en">New to muons, units such as g/cm² or m.w.e., or muography? Start with the <a href="primer.html">background primer</a>.</span><span lang="zh-Hans">还不熟悉缪子、g/cm² 或米水当量这类单位，或缪子成像？先读<a href="primer.html">入门背景</a>。</span></p>',
        '    </div>',
        '  </section>',
    ]
    return "\n".join(parts) + "\n"


OLD = re.compile(r'  <section class="run[^"]*" id="background".*?</section>\n\n?', re.S)
GOALS = re.compile(r'(<section class="run[^"]*"[^>]*aria-labelledby="h-goals">.*?</section>\n)', re.S)
# afterwards run tools/figures.py (the Week 1-10 displays sit after this section) and tools/shell.py

if __name__ == "__main__":
    for n in range(1, 13):
        p = ROOT / f"week{n:02d}.html"
        s = p.read_text(encoding="utf-8")
        s = OLD.sub("", s)
        s, k = GOALS.subn(lambda m: m.group(1) + "\n" + section(n), s, count=1)
        assert k == 1, p
        p.write_text(s, encoding="utf-8")
        print(p.name, "background:", len(W[n]["boxes"]), "boxes")
