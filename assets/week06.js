/* Week 06 — production-cut explorer (Week 6).
   Range cut -> energy threshold: interpolated (log-log) in the table Geant4 11.4 prints with
   /run/dumpCouples for 10 cut values (code/week06/cut_thresholds_g4_11.4.json); the 990 eV floor
   is Geant4's lower limit for production thresholds.
   TOY MODEL for the split of the mean energy loss of a 1 GeV mu- in 10 cm (not Geant4):
     continuous part  = restricted Bethe below T_cut (PDG Eq. 34.12, density effect included)
     explicit part    = Bethe - restricted, carried by delta-rays produced as tracks
     delta-rays/cm    = PDG 1/T^2 rate above T_cut (spin-1/2 term neglected) — reproduces our Geant4
                        muIoni counts in Pb to within 7% at all four cuts. Radiative losses ignored. */
(function () {
  'use strict';
  var G = window.G4C;
  var K = 0.307075, ME = 0.51099895, MMU = 105.6583755, LN10 = Math.log(10);
  var CUTS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 0.7, 1, 3, 10];
  var TH = { /* e- thresholds [MeV], Geant4 11.4 /run/dumpCouples */
    'G4_PLASTIC_SC_VINYLTOLUENE': { e: [0.00099, 0.00174, 0.014538, 0.0432233, 0.086341, 0.165624, 0.281883, 0.356841, 0.787503, 2.18979], g: [0.00099, 0.00099, 0.00099, 0.00099, 0.0010004, 0.0015243, 0.0020972, 0.0023988, 0.0036288, 0.0057169] },
    'G4_Al':       { e: [0.0010106, 0.0069816, 0.0341058, 0.0645098, 0.131218, 0.26003, 0.46119, 0.597438, 1.44925, 4.56335], g: [0.00099, 0.00099, 0.00099, 0.0013292, 0.0023416, 0.0039261, 0.0058471, 0.0069157, 0.0115926, 0.0204222] },
    'G4_CONCRETE': { e: [0.00099, 0.0058611, 0.0326118, 0.061565, 0.124767, 0.24588, 0.433296, 0.559255, 1.33768, 4.14069], g: [0.00099, 0.00099, 0.00099, 0.0011554, 0.0020051, 0.0033244, 0.0049179, 0.0058011, 0.0096661, 0.0171371] },
    'G4_Cu':       { e: [0.0065987, 0.0303142, 0.0615477, 0.118179, 0.250496, 0.533592, 1.03403, 1.40308, 3.99809, 14.6188], g: [0.00099, 0.0011422, 0.0021622, 0.0038697, 0.0073248, 0.013114, 0.0205458, 0.0248228, 0.0444271, 0.0703495] },
    'G4_Pb':       { e: [0.0064384, 0.0267121, 0.0579161, 0.112507, 0.240662, 0.516238, 1.00699, 1.37158, 3.98276, 15.2047], g: [0.0012183, 0.0026038, 0.0059849, 0.0127891, 0.0293967, 0.0628289, 0.0946952, 0.101797, 0.138286, 0.284912] },
    'G4_lH2':      { e: [0.00099, 0.00099, 0.00099, 0.0020083, 0.0270709, 0.0546281, 0.0884943, 0.108788, 0.209937, 0.461185], g: [0.00099, 0.00099, 0.00099, 0.00099, 0.00099, 0.00099, 0.00099, 0.00099, 0.00099, 0.00099] }
  };
  var MAT = {
    'G4_PLASTIC_SC_VINYLTOLUENE': { ZA: 0.54141, rho: 1.032, I: 64.7, C: 3.1997, x0: 0.1464, x1: 2.4855, a: 0.1610, k: 3.2393, d0: 0, en: 'plastic scintillator', zh: '塑料闪烁体' },
    'G4_Al':       { ZA: 0.48181, rho: 2.699, I: 166.0, C: 4.2395, x0: 0.1708, x1: 3.0127, a: 0.0802, k: 3.6345, d0: 0.12, en: 'aluminium', zh: '铝' },
    'G4_CONCRETE': { ZA: 0.50274, rho: 2.300, I: 135.2, C: 3.9464, x0: 0.1301, x1: 3.0466, a: 0.0751, k: 3.5467, d0: 0, en: 'concrete', zh: '混凝土' },
    'G4_Cu':       { ZA: 0.45636, rho: 8.960, I: 322.0, C: 4.4190, x0: -0.0254, x1: 3.2792, a: 0.1434, k: 2.9044, d0: 0.08, en: 'copper', zh: '铜' },
    'G4_Pb':       { ZA: 0.39575, rho: 11.35, I: 823.0, C: 6.2018, x0: 0.3776, x1: 3.8073, a: 0.0936, k: 3.1608, d0: 0.14, en: 'lead', zh: '铅' },
    'G4_lH2':      { ZA: 0.99212, rho: 0.0708, I: 21.8, C: 3.0977, x0: 0.4400, x1: 1.8856, a: 0.1348, k: 5.6249, d0: 0, en: 'liquid hydrogen', zh: '液氢' }
  };
  /* Geant4 11.4, 1 GeV mu- through 10 cm Pb in vacuum (week06 cuts.mac, 1000 events each) */
  var G4PB = [[10, 0.241, 141.235, 0.03, 2.387], [0.7, 6.658, 141.530, 0.06, 9.354], [0.1, 28.831, 141.806, 0.13, 35.859], [0.01, 120.312, 140.792, 0.36, 150.667]];
  var T = 1000, L = 10;

  function interp(arr, cut) {
    if (cut <= CUTS[0]) return arr[0];
    for (var i = 0; i < CUTS.length - 1; i++) if (cut <= CUTS[i + 1]) {
      var f = (Math.log(cut) - Math.log(CUTS[i])) / (Math.log(CUTS[i + 1]) - Math.log(CUTS[i]));
      return Math.exp(Math.log(arr[i]) + f * (Math.log(arr[i + 1]) - Math.log(arr[i])));
    }
    return arr[arr.length - 1];
  }
  function kin() { var g = 1 + T / MMU, bg = Math.sqrt(g * g - 1), b2 = bg * bg / (g * g), r = ME / MMU; return { bg: bg, b2: b2, wmax: 2 * ME * bg * bg / (1 + 2 * g * r + r * r) }; }
  function delta(m, bg) { var x = Math.log10(bg); if (x >= m.x1) return 2 * LN10 * x - m.C; if (x >= m.x0) return 2 * LN10 * x - m.C + m.a * Math.pow(m.x1 - x, m.k); return m.d0 * Math.pow(10, 2 * (x - m.x0)); }
  function bethe(m) { var k = kin(); return K * m.ZA / k.b2 * (0.5 * Math.log(2 * ME * k.bg * k.bg * k.wmax / Math.pow(m.I * 1e-6, 2)) - k.b2 - delta(m, k.bg) / 2) * m.rho * L; }
  function restricted(m, tc) { var k = kin(); tc = Math.min(tc, k.wmax); return K * m.ZA / k.b2 * (0.5 * Math.log(2 * ME * k.bg * k.bg * tc / Math.pow(m.I * 1e-6, 2)) - k.b2 / 2 * (1 + tc / k.wmax) - delta(m, k.bg) / 2) * m.rho * L; }
  function nDelta(m, tc) { var k = kin(); if (tc >= k.wmax) return 0; return 0.5 * K * m.ZA * m.rho / k.b2 * (1 / tc - 1 / k.wmax - k.b2 / k.wmax * Math.log(k.wmax / tc)) * L; }

  var el = function (id) { return document.getElementById(id); };
  function params() { return { mat: el('w6-mat').value, cut: Math.pow(10, +el('w6-cut').value) }; }
  function fmtE(m) { return m >= 1 ? m.toPrecision(3) + ' MeV' : m >= 1e-3 ? (m * 1e3).toPrecision(3) + ' keV' : (m * 1e6).toFixed(0) + ' eV'; }
  function fmtL(mm) { return mm >= 1 ? +mm.toPrecision(3) + ' mm' : +(mm * 1000).toPrecision(3) + ' µm'; }

  function drawSplit() {
    var c = el('w6-split'), r = G.size(c), x = r[0], w = r[1], h = r[2]; if (!w) return;
    var p = params(), m = MAT[p.mat], th = TH[p.mat], tot = bethe(m);
    var panel = G.css('--panel'), frame = G.css('--frame'), muted = G.css('--muted'), pos = G.css('--pos'), neg = G.css('--neg'), neu = G.css('--neu'), fg = G.css('--fg');
    x.fillStyle = panel; x.fillRect(0, 0, w, h);
    var Lp = 52, R = w - 12, Tp = 12, B = h - 32, ymax = tot * 1.6;
    var X = function (cut) { return Lp + (Math.log10(cut) + 3) / 4 * (R - Lp); }, Y = function (v) { return B - v / ymax * (B - Tp); };
    function curve(fn, col, dash) {
      x.strokeStyle = col; x.lineWidth = 2; x.setLineDash(dash || []); x.beginPath();
      for (var i = 0; i <= 120; i++) { var cut = Math.pow(10, -3 + 4 * i / 120), v = fn(cut); if (i) x.lineTo(X(cut), Y(v)); else x.moveTo(X(cut), Y(v)); }
      x.stroke(); x.setLineDash([]);
    }
    curve(function () { return tot; }, fg, [6, 4]);
    curve(function (cut) { return restricted(m, interp(th.e, cut)); }, pos);
    curve(function (cut) { return tot - restricted(m, interp(th.e, cut)); }, neg);
    if (p.mat === 'G4_Pb') G4PB.forEach(function (q) { x.fillStyle = neu; x.beginPath(); x.arc(X(q[0]), Y(q[2]), 4, 0, 2 * Math.PI); x.fill(); });
    x.strokeStyle = muted; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(X(p.cut), Tp); x.lineTo(X(p.cut), B); x.stroke(); x.setLineDash([]);
    x.strokeStyle = frame; x.lineWidth = 1; x.strokeRect(Lp + .5, Tp + .5, R - Lp - 1, B - Tp);
    x.fillStyle = muted; x.font = '11px "IBM Plex Mono", monospace'; x.textAlign = 'center';
    ['1 µm', '10 µm', '0.1 mm', '1 mm', '10 mm'].forEach(function (lab, i) { var xx = X(Math.pow(10, i - 3)); x.beginPath(); x.moveTo(xx, B); x.lineTo(xx, B - 8); x.stroke(); x.fillText(lab, xx, B + 14); });
    var st = G.niceStep(ymax, 5); x.textAlign = 'right';
    for (var v = st; v < ymax; v += st) { x.beginPath(); x.moveTo(Lp, Y(v)); x.lineTo(Lp + 7, Y(v)); x.stroke(); x.fillText(String(+v.toFixed(3)), Lp - 6, Y(v) + 4); }
    x.fillText(G.t('range cut (/run/setCut)', '射程阈 (/run/setCut)'), R, h - 2);
    x.save(); x.translate(12, Tp); x.rotate(-Math.PI / 2); x.fillText(G.t('MeV per 10 cm', 'MeV / 10 cm'), 0, 0); x.restore();
    x.textAlign = 'left'; x.fillStyle = fg; x.fillText(G.t('- - total mean loss (Bethe)', '- - 总平均损失（Bethe）'), Lp + 8, Tp + 16);
    x.fillStyle = pos; x.fillText(G.t('— continuous, below T_cut', '— 连续部分，低于 T_cut'), Lp + 8, Tp + 31);
    x.fillStyle = neg; x.fillText(G.t('— carried by δ-ray tracks', '— 由 δ 电子径迹带走'), Lp + 8, Tp + 46);
    if (p.mat === 'G4_Pb') { x.fillStyle = neu; x.fillText(G.t('● Geant4 Edep in Pb', '● Geant4 铅中 Edep'), Lp + 8, Tp + 61); }
  }
  function drawCount() {
    var p = params(), m = MAT[p.mat], th = TH[p.mat];
    G.loglog(el('w6-count'), {
      xlo: 1e-3, xhi: 10, ylo: 0.1, yhi: 3000,
      pts: p.mat === 'G4_Pb' ? G4PB.map(function (q) { return [q[0], q[1]]; }) : [[p.cut, Math.max(0.11, nDelta(m, interp(th.e, p.cut)))]],
      line: function (cut) { return Math.max(0.1, nDelta(m, interp(th.e, cut))); },
      xlabel: G.t('range cut [mm]', '射程阈 [mm]'), ylabel: G.t('δ-rays per crossing', '每次穿越 δ 电子数'), lineLabel: G.t('PDG rate above T_cut', 'PDG 产生率（T_cut 以上）')
    });
  }
  function drawStats() {
    var p = params(), m = MAT[p.mat], th = TH[p.mat], te = interp(th.e, p.cut), tg = interp(th.g, p.cut), nd = nDelta(m, te), tot = bethe(m), rest = restricted(m, te);
    el('w6-cut-out').textContent = fmtL(p.cut);
    el('w6-te').textContent = fmtE(te) + (te <= 0.00099001 ? G.t(' (floor)', '（下限）') : '');
    el('w6-tg').textContent = fmtE(tg) + (tg <= 0.00099001 ? G.t(' (floor)', '（下限）') : '');
    el('w6-nd').textContent = nd.toPrecision(3);
    el('w6-cont').textContent = rest.toFixed(1) + ' MeV (' + (100 * rest / tot).toFixed(0) + ' %)';
    el('w6-expl').textContent = (tot - rest).toFixed(1) + ' MeV (' + (100 * (tot - rest) / tot).toFixed(0) + ' %)';
    el('w6-tot').textContent = tot.toFixed(1) + ' MeV';
  }
  function draw() { drawSplit(); drawCount(); drawStats(); }
  G.onRedraw(draw);
  function fillMats() {
    var v = el('w6-mat').value || 'G4_Pb';
    el('w6-mat').innerHTML = Object.keys(MAT).map(function (k) { return '<option value="' + k + '">' + k + ' · ' + G.t(MAT[k].en, MAT[k].zh) + '</option>'; }).join('');
    el('w6-mat').value = v;
  }
  fillMats(); window.addEventListener('g4c:lang', fillMats);
  el('w6-mat').addEventListener('change', draw);
  el('w6-cut').addEventListener('input', draw);
  draw();

  G.quiz(el('quiz'), 'w06', [
    { prompt: { en: 'You lower the production cut in lead from 0.7 mm to 0.01 mm. What happens to the energy deposited by a 1 GeV muon in 10 cm?', zh: '把铅中的产生阈从 0.7 mm 降到 0.01 mm，1 GeV 缪子在 10 cm 中的沉积能量会怎样？' },
      opts: [{ en: 'It rises about 16×, like the number of electrons', zh: '像电子数一样增加约 16 倍' }, { en: 'It stays the same within errors; only how it is shared changes', zh: '在误差内不变，只是分配方式改变' }, { en: 'It drops to zero', zh: '降为零' }, { en: 'It doubles', zh: '翻倍' }],
      a: 1, why: { en: 'Energy below the threshold is deposited continuously along the step; above it, it goes into δ-ray tracks that mostly deposit it nearby. Our runs: 141.5 ± 0.5 MeV at 0.7 mm and 140.8 ± 0.5 MeV at 0.01 mm, while electrons per event went from 9.4 to 151 and CPU time rose 6×.', zh: '阈值以下的能量沿步连续沉积；阈值以上的能量交给 δ 电子径迹，而它们大多就近沉积。我们的运行：0.7 mm 时 141.5 ± 0.5 MeV，0.01 mm 时 140.8 ± 0.5 MeV；而每事例电子数从 9.4 增至 151，CPU 时间增加 6 倍。' } },
    { prompt: { en: 'What is a production cut in Geant4?', zh: 'Geant4 中的产生阈是什么？' },
      opts: [{ en: 'An energy below which every particle is killed', zh: '低于该能量的所有粒子都被杀死' }, { en: 'A range, converted per material into an energy threshold for creating selected secondaries (γ, e⁻, e⁺, p)', zh: '一个射程，按材料换算成产生特定次级粒子（γ、e⁻、e⁺、p）的能量阈值' }, { en: 'The maximum step length', zh: '最大步长' }, { en: 'A tracking cut for the primary', zh: '主粒子的径迹截断' }],
      a: 1, why: { en: 'One range (0.7 mm by default) becomes 1.01 MeV for e⁻ in Pb but 282 keV in plastic: the same spatial resolution of secondaries in every material. Particles that are produced are tracked down to a low limit (1 keV for e± by default) and deposit the rest there; the cut only decides whether a secondary is created as a track.', zh: '同一个射程（默认 0.7 mm）在铅中对 e⁻ 是 1.01 MeV，在塑料中是 282 keV：在每种材料中对次级粒子有相同的空间分辨。已产生的粒子会被追踪到很低的下限（e± 默认 1 keV），剩余能量在那里沉积；阈值只决定次级粒子是否以径迹形式产生。' } },
    { prompt: { en: 'A 1 GeV μ⁻ crosses 10 cm of lead. Do you need FTFP_BERT\'s hadronic physics to study its ionisation energy loss?', zh: '1 GeV μ⁻ 穿过 10 cm 铅。研究它的电离能损需要 FTFP_BERT 的强子物理吗？' },
      opts: [{ en: 'Yes, always use the heaviest list', zh: '需要，总是用最重的列表' }, { en: 'No: muon–nucleus interactions are so rare here that EM + decay gives the same answer, faster', zh: '不需要：这里缪子–原子核相互作用极其罕见，EM + 衰变给出相同结果且更快' }, { en: 'Yes, muons are hadrons', zh: '需要，缪子是强子' }, { en: 'It cannot be studied in Geant4', zh: 'Geant4 无法研究' }],
      a: 1, why: { en: 'The muon feels no strong force; its photonuclear interaction has a tiny cross section. The heavier list costs initialisation time and memory with no visible benefit for this observable. A process is included because an observable depends on it.', zh: '缪子不参与强相互作用，其光核相互作用截面极小。更重的列表会增加初始化时间和内存，却对这个可观测量没有可见好处。一个过程被纳入，是因为某个可观测量依赖它。' } },
    { prompt: { en: 'Now fire a 1 GeV π⁻ through 10 cm of lead with the EM-only list. What goes silently wrong?', zh: '现在用纯电磁列表让 1 GeV π⁻ 穿过 10 cm 铅，什么会悄悄出错？' },
      opts: [{ en: 'Nothing: pions only ionise', zh: '没问题：π 介子只会电离' }, { en: 'About 40% of pions should interact with a nucleus; without hadronic physics those secondaries and energy simply never appear', zh: '约 40% 的 π 介子本应与原子核作用；没有强子物理，这些次级粒子和能量就根本不会出现' }, { en: 'Geant4 crashes', zh: 'Geant4 崩溃' }, { en: 'The pion decays immediately', zh: 'π 介子立即衰变' }],
      a: 1, why: { en: 'With the PDG pion interaction length in Pb, 226 g/cm² ≈ 19.9 cm (a high-energy value), P(interact in 10 cm) ≈ 1 − e<sup>−10/19.9</sup> ≈ 0.4. The EM-only run finishes without any warning: our test run shows only hIoni, eIoni and photon processes.', zh: '按 PDG 给出的铅中 π 介子相互作用长度 226 g/cm² ≈ 19.9 cm（高能值），10 cm 内发生作用的概率约 1 − e<sup>−10/19.9</sup> ≈ 0.4。纯电磁运行会毫无警告地结束：我们的测试运行只出现 hIoni、eIoni 和光子过程。' } },
    { prompt: { en: 'In plastic, the γ threshold stops changing below about 0.03 mm, and the e⁻ threshold stops at a 1 µm cut. Why does lowering the cut eventually change nothing?', zh: '在塑料中，射程阈低于约 0.03 mm 后 γ 阈值不再变化，e⁻ 阈值在 1 µm 处也不再变化。为什么继续降低射程阈最终不起作用？' },
      opts: [{ en: 'A bug in the conversion', zh: '换算有 bug' }, { en: 'Geant4 never produces secondaries below its 990 eV lower limit', zh: 'Geant4 不会产生低于其 990 eV 下限的次级粒子' }, { en: 'Plastic has no electrons', zh: '塑料没有电子' }, { en: 'The cut is in cm', zh: '阈值单位是 cm' }],
      a: 1, why: { en: 'Both thresholds reach a floor at 990 eV, the default lower edge of production thresholds: γ already at 0.03 mm, e⁻ only at 1 µm (14.5 keV at 10 µm). Below that the models are not meant to produce secondaries, so asking for a smaller range changes nothing. The explorer marks it "(floor)".', zh: '两个阈值最终都停在 990 eV 的下限，即产生阈值的默认下边界：γ 在 0.03 mm 就到了，e⁻ 要到 1 µm 才到（10 µm 时仍为 14.5 keV）。低于此值，模型本就不应产生次级粒子，所以要求更小的射程不会改变什么。探索器中会标注“（下限）”。' } },
    { prompt: { en: 'You must choose a physics list for a muography study of a mountain. What is the first question to ask?', zh: '你要为一项山体缪子成像研究选择物理列表。首先应该问什么？' },
      opts: [{ en: 'Which list is the newest?', zh: '哪个列表最新？' }, { en: 'Which observable do I need, and which processes can change it?', zh: '我需要哪个可观测量，哪些过程会改变它？' }, { en: 'Which list runs fastest?', zh: '哪个列表最快？' }, { en: 'Which list my supervisor used in 2015?', zh: '导师 2015 年用的是哪个？' }],
      a: 1, why: { en: 'Muography depends on muon range and scattering over hundreds of metres of rock: energy loss including radiative processes, and multiple scattering. Choose and validate for that. The list is part of the scientific specification, not a configuration formality.', zh: '缪子成像取决于缪子在数百米岩石中的射程和散射：包括辐射过程在内的能量损失，以及多次散射。应针对这些来选择和验证。物理列表是科学规格的一部分，而不是配置形式。' } }
  ]);
  G.progress('w06');
  G.pager(el('pager'), 6);
})();
