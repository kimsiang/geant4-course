/* Week 04 — Bethe–Bloch curve and a toy energy-loss straggling Monte Carlo (Week 4).
   Curve: PDG Eq. (34.5) mean stopping power with the Sternheimer density-effect correction
   (parameters from the PDG atomic and nuclear properties tables); spin and shell terms neglected.
   TOY MODEL for the deposit histogram, not Geant4: energy loss in a slab =
     continuous restricted loss below T_c  +  sum of delta-ray energies above T_c,
   delta-rays drawn as a Poisson process from the PDG 1/T^2 spectrum (spin-1/2 term neglected).
   T_c is chosen per setting so that ~300 delta-rays are sampled per event (>= 1 keV).
   A delta-ray deposits the fraction of its energy that fits before the back face of the slab,
   using the Katz-Penfold CSDA range and a straight forward path; lateral leakage is ignored.
   Muon slowing down inside the slab is ignored (constant beta). */
(function () {
  'use strict';
  var G = window.G4C, SEED = 20261021;
  var K = 0.307075, ME = 0.51099895, MMU = 105.6583755, LN10 = Math.log(10);
  /* Z/A, rho [g/cm3], I [eV], Cbar, x0, x1, a, k, delta0, PDG minimum dE/dx [MeV cm2/g] */
  var MAT = {
    'G4_PLASTIC_SC_VINYLTOLUENE': { ZA: 0.54141, rho: 1.032, I: 64.7, C: 3.1997, x0: 0.1464, x1: 2.4855, a: 0.1610, k: 3.2393, d0: 0,    min: 1.956, en: 'plastic scintillator', zh: '塑料闪烁体' },
    'G4_lH2':                     { ZA: 0.99212, rho: 0.0708, I: 21.8, C: 3.0977, x0: 0.4400, x1: 1.8856, a: 0.1348, k: 5.6249, d0: 0,    min: 4.034, en: 'liquid hydrogen', zh: '液氢' },
    'G4_Al':                      { ZA: 0.48181, rho: 2.699, I: 166.0, C: 4.2395, x0: 0.1708, x1: 3.0127, a: 0.0802, k: 3.6345, d0: 0.12, min: 1.615, en: 'aluminium', zh: '铝' },
    'G4_CONCRETE':                { ZA: 0.50274, rho: 2.300, I: 135.2, C: 3.9464, x0: 0.1301, x1: 3.0466, a: 0.0751, k: 3.5467, d0: 0,    min: 1.711, en: 'concrete', zh: '混凝土' },
    'G4_Cu':                      { ZA: 0.45636, rho: 8.960, I: 322.0, C: 4.4190, x0: -0.0254, x1: 3.2792, a: 0.1434, k: 2.9044, d0: 0.08, min: 1.403, en: 'copper', zh: '铜' },
    'G4_Pb':                      { ZA: 0.39575, rho: 11.35, I: 823.0, C: 6.2018, x0: 0.3776, x1: 3.8073, a: 0.0936, k: 3.1608, d0: 0.14, min: 1.122, en: 'lead', zh: '铅' }
  };
  /* Geant4 11.4 results from the week04 app (10 cm PVT, 10^4 events each): filled from our runs */
  var G4PTS = window.W4_G4PTS || [];

  function kin(bg) { var g = Math.sqrt(1 + bg * bg), b2 = bg * bg / (g * g), r = ME / MMU; return { g: g, b2: b2, wmax: 2 * ME * bg * bg / (1 + 2 * g * r + r * r) }; }
  function delta(m, bg) {
    var x = Math.log10(bg);
    if (x >= m.x1) return 2 * LN10 * x - m.C;
    if (x >= m.x0) return 2 * LN10 * x - m.C + m.a * Math.pow(m.x1 - x, m.k);
    return m.d0 * Math.pow(10, 2 * (x - m.x0));
  }
  function bethe(m, bg) {  /* MeV cm2/g */
    var k = kin(bg);
    return K * m.ZA / k.b2 * (0.5 * Math.log(2 * ME * bg * bg * k.wmax / Math.pow(m.I * 1e-6, 2)) - k.b2 - delta(m, bg) / 2);
  }
  function restricted(m, bg, tc) {  /* MeV cm2/g, energy transfers below tc */
    var k = kin(bg); tc = Math.min(tc, k.wmax);
    return K * m.ZA / k.b2 * (0.5 * Math.log(2 * ME * bg * bg * tc / Math.pow(m.I * 1e-6, 2)) - k.b2 / 2 * (1 + tc / k.wmax) - delta(m, bg) / 2);
  }
  G.w4 = { bethe: bethe, restricted: restricted, MAT: MAT };
  function bgOf(T) { var g = 1 + T / MMU; return Math.sqrt(g * g - 1); }
  function rangeCSDA(T) { /* g/cm2, Katz-Penfold */
    if (T < 2.5) { var n = 1.265 - 0.0954 * Math.log(Math.max(T, 0.01)); return 0.412 * Math.pow(T, n); }
    return 0.530 * T - 0.106;
  }

  var el = function (id) { return document.getElementById(id); };
  function params() { return { mat: el('w4-mat').value, T: Math.pow(10, +el('w4-T').value), t: Math.pow(10, +el('w4-t').value) }; }
  function fmtE(mev) { return mev >= 1000 ? +(mev / 1000).toPrecision(3) + ' GeV' : +mev.toPrecision(3) + ' MeV'; }
  function fmtL(cm) { return cm >= 1 ? +cm.toPrecision(3) + ' cm' : +(cm * 10).toPrecision(3) + ' mm'; }

  var st;
  function simulate(n) {
    var p = params(), m = MAT[p.mat], bg = bgOf(p.T), k = kin(bg), r = G.rng(SEED + Math.round(p.t * 1000) + Math.round(p.T));
    var pref = 0.5 * K * m.ZA * m.rho / k.b2 * p.t;               /* per event, per (1/T) */
    var tc = Math.max(0.001, pref / 300);
    if (tc >= k.wmax) tc = k.wmax * 0.5;
    var nu = pref * (1 / tc - 1 / k.wmax - k.b2 / k.wmax * Math.log(k.wmax / tc));
    var cont = restricted(m, bg, tc) * m.rho * p.t;
    var loss = [], dep = [], esc = 0, nd = 0;
    for (var e = 0; e < n; e++) {
      /* Poisson by normal approximation when nu is large */
      var nn = nu > 50 ? Math.max(0, Math.round(nu + Math.sqrt(nu) * r.gauss())) : (function () { var L = Math.exp(-nu), kk = 0, pp = 1; do { kk++; pp *= r(); } while (pp > L); return kk - 1; })();
      var dl = cont, dd = cont;
      for (var i = 0; i < nn; i++) {
        var T;
        for (;;) { var u = r(); T = tc * k.wmax / (k.wmax - u * (k.wmax - tc)); if (r() < 1 - k.b2 * T / k.wmax) break; }
        dl += T; nd++;
        var room = (1 - r()) * p.t * m.rho, R = rangeCSDA(T);    /* g/cm2 left before the back face */
        if (R > room) { dd += T * room / R; esc++; } else dd += T;
      }
      loss.push(dl); dep.push(dd);
    }
    st = { p: p, m: m, bg: bg, loss: loss, dep: dep, escFrac: nd ? esc / nd : 0, tc: tc, nu: nu, mean: bethe(m, bg) * m.rho * p.t };
  }
  function stats(a) { var s = 0, s2 = 0; a.forEach(function (v) { s += v; s2 += v * v; }); var mu = s / a.length; return { mean: mu, sd: Math.sqrt(Math.max(0, s2 / a.length - mu * mu)) }; }

  function drawCurve() {
    var p = params(), m = MAT[p.mat];
    var pts = [];
    if (p.mat === 'G4_PLASTIC_SC_VINYLTOLUENE') G4PTS.forEach(function (q) { pts.push([q[0], q[1] / m.rho]); });
    pts.push([bgOf(p.T), bethe(m, bgOf(p.T))]);
    G.loglog(el('w4-curve'), {
      xlo: 0.3, xhi: 1e4, ylo: 1, yhi: 20, pts: pts,
      line: function (bg) { return bethe(m, bg); },
      xlabel: 'βγ', ylabel: '⟨−dE/dx⟩ [MeV cm²/g]', lineLabel: 'Bethe + δ(βγ), ' + p.mat.replace('G4_', '')
    });
    var bgmin = 0.1, vmin = 1e9;
    for (var i = 0; i < 2000; i++) { var bg = Math.pow(10, -1 + 5 * i / 2000), v = bethe(m, bg); if (v < vmin) { vmin = v; bgmin = bg; } }
    el('w4-min').textContent = vmin.toFixed(3) + ' MeV cm²/g @ βγ = ' + bgmin.toFixed(2);
    el('w4-pdg').textContent = m.min.toFixed(3) + ' MeV cm²/g';
    el('w4-now').textContent = bethe(m, bgOf(p.T)).toFixed(3) + ' MeV cm²/g = ' + (bethe(m, bgOf(p.T)) * m.rho).toFixed(2) + ' MeV/cm';
    el('w4-bg').textContent = bgOf(p.T).toFixed(3);
  }
  function drawHist() {
    var a = st.dep, s = stats(a), sl = stats(st.loss);
    var hi = Math.max(st.mean * 2.6, s.mean * 2.6), nb = 100, bins = new Array(nb).fill(0);
    a.forEach(function (v) { var b = Math.floor(v / hi * nb); if (b >= 0 && b < nb) bins[b]++; });
    var mpvBin = bins.indexOf(Math.max.apply(null, bins)), mpv = (mpvBin + 0.5) * hi / nb;
    G.hist(el('w4-hist'), {
      bins: bins, lo: 0, hi: hi, name: 'Edep',
      xlabel: G.t('energy deposit in the slab [MeV]', '板中沉积能量 [MeV]'), ylabel: G.t('events / bin', '事例数 / bin'),
      stats: [['Entries', String(a.length)], ['Mean', s.mean.toFixed(3)], ['Std Dev', s.sd.toFixed(3)]]
    });
    el('w4-mloss').textContent = sl.mean.toFixed(3) + ' MeV';
    el('w4-mbethe').textContent = st.mean.toFixed(3) + ' MeV';
    el('w4-mdep').textContent = s.mean.toFixed(3) + ' MeV';
    el('w4-mpv').textContent = mpv.toFixed(3) + ' MeV';
    el('w4-esc').textContent = (100 * st.escFrac).toFixed(1) + ' %';
  }
  function sync() { var p = params(); el('w4-T-out').textContent = fmtE(p.T) + ' · βγ = ' + bgOf(p.T).toFixed(2); el('w4-t-out').textContent = fmtL(p.t); }
  function run() { sync(); simulate(3000); drawCurve(); drawHist(); }
  G.onRedraw(function () { drawCurve(); drawHist(); });
  function fillMats() {
    var v = el('w4-mat').value || 'G4_PLASTIC_SC_VINYLTOLUENE';
    el('w4-mat').innerHTML = Object.keys(MAT).map(function (k) { return '<option value="' + k + '">' + k + ' · ' + G.t(MAT[k].en, MAT[k].zh) + '</option>'; }).join('');
    el('w4-mat').value = v;
  }
  fillMats(); window.addEventListener('g4c:lang', fillMats);
  ['w4-T', 'w4-t'].forEach(function (id) { el(id).addEventListener('input', sync); el(id).addEventListener('change', run); });
  el('w4-mat').addEventListener('change', run);
  el('w4-run').addEventListener('click', run);
  run();

  G.quiz(el('quiz'), 'w04', [
    { prompt: { en: 'A 1 GeV muon (βγ ≈ 10.4) and a 100 MeV muon (βγ ≈ 1.67) cross plastic. Which loses more energy per cm?', zh: '1 GeV 缪子（βγ ≈ 10.4）和 100 MeV 缪子（βγ ≈ 1.67）穿过塑料，哪个每厘米损失的能量更多？' },
      opts: [{ en: 'The 1 GeV muon: more energy, more loss', zh: '1 GeV 缪子：能量越高损失越多' }, { en: 'The 100 MeV muon, about 10–15% more', zh: '100 MeV 缪子，约多 10–15%' }, { en: 'They are equal: both are MIPs', zh: '相等：两者都是最小电离粒子' }, { en: 'The 100 MeV muon, about 10× more', zh: '100 MeV 缪子，约多 10 倍' }],
      a: 1, why: { en: 'The minimum sits near βγ ≈ 3–4. At βγ = 1.67 the 1/β² rise has begun; at 10.4 the relativistic rise is gentle. In polyvinyltoluene the formula gives 2.31 and 2.13 MeV/cm at the entrance energies; Geant4 gives 2.39 and 2.12, because the 100 MeV muon also slows down inside the slab (step 4).', zh: '最小值在 βγ ≈ 3–4 附近。βγ = 1.67 时 1/β² 的上升已经开始，10.4 时相对论上升还很平缓。对聚乙烯基甲苯，公式在入射能量处给出 2.31 和 2.13 MeV/cm；Geant4 给出 2.39 和 2.12，因为 100 MeV 缪子在板内还会减速（见第 4 步）。' } },
    { prompt: { en: 'Why is the mean energy deposit larger than the most probable one?', zh: '为什么平均能量沉积大于最可几值？' },
      opts: [{ en: 'Rounding in the histogram', zh: '直方图的舍入误差' }, { en: 'Rare hard collisions make a long high-energy tail', zh: '少见的硬碰撞形成长长的高能尾巴' }, { en: 'The muon slows down', zh: '缪子减速了' }, { en: 'Detector noise', zh: '探测器噪声' }],
      a: 1, why: { en: 'Most collisions transfer little energy, but occasionally a δ-ray takes up to T<sub>max</sub> (≈ 100 MeV at 1 GeV). That Landau tail pulls the mean above the peak. Compare a histogram\'s Mean with its peak in the toy model.', zh: '绝大多数碰撞只转移很少能量，但偶尔一个 δ 电子能带走接近 T<sub>max</sub>（1 GeV 时约 100 MeV）的能量。这条朗道尾巴把均值拉到峰值之上。可以在玩具模型中比较直方图的 Mean 与峰位。' } },
    { prompt: { en: 'The primary-muon −dE/dx and Edep/10 cm differ by a few percent. Which statement is right?', zh: '主缪子的 −dE/dx 与 Edep/10 cm 相差几个百分点。哪种说法正确？' },
      opts: [{ en: 'One of them is a bug', zh: '其中一个有 bug' }, { en: 'Edep is lower because energetic δ-rays leave the slab', zh: 'Edep 较低，因为高能 δ 电子逃出了板' }, { en: 'Edep is higher because of photons from outside', zh: 'Edep 较高，因为有外来光子' }, { en: 'They must agree exactly', zh: '两者必须完全一致' }],
      a: 1, why: { en: 'The primary loses energy to δ-rays; a δ-ray whose range exceeds the distance to the back face carries part of it out. Edep is a detector-response quantity, the primary loss is closer to the stopping power. Do not force them to be equal.', zh: '主粒子把能量交给 δ 电子；射程超过到后表面距离的 δ 电子会把一部分能量带出去。Edep 是探测器响应量，主粒子损失更接近阻止本领。不要强求两者相等。' } },
    { prompt: { en: 'You run 10<sup>4</sup> events per energy. The Edep rms is 4 MeV. What is the statistical uncertainty on the mean?', zh: '每个能量点 10<sup>4</sup> 个事例，Edep 的 rms 为 4 MeV。均值的统计不确定度是多少？' },
      opts: [{ en: '4 MeV', zh: '4 MeV' }, { en: '0.04 MeV', zh: '0.04 MeV' }, { en: '0.4 MeV', zh: '0.4 MeV' }, { en: '0.0004 MeV', zh: '0.0004 MeV' }],
      a: 1, why: { en: 'σ<sub>mean</sub> = rms/√N = 4/100 = 0.04 MeV: the same 1/√N tax as Week 1. The rms describes single events; the error of the mean describes your measurement.', zh: 'σ<sub>均值</sub> = rms/√N = 4/100 = 0.04 MeV，与第 1 周一样的 1/√N 税。rms 描述单个事例，均值误差描述你的测量。' } },
    { prompt: { en: 'Why are cosmic muons such a common calibration source?', zh: '为什么宇宙线缪子是如此常用的刻度源？' },
      opts: [{ en: 'They are all exactly at the minimum', zh: '它们都恰好处于最小值' }, { en: 'Over a wide momentum range their dE/dx stays within ~10–20% of the minimum', zh: '在很宽的动量范围内，它们的 dE/dx 与最小值相差在 10–20% 以内' }, { en: 'They do not produce δ-rays', zh: '它们不产生 δ 电子' }, { en: 'They are monoenergetic', zh: '它们是单能的' }],
      a: 1, why: { en: 'The sea-level spectrum peaks at a few GeV, where the curve is flat: roughly 1–2 MeV cm²/g in most materials. A muon peak in an ADC spectrum is therefore an almost universal energy reference.', zh: '海平面缪子能谱的峰在几 GeV，那里曲线很平坦：大多数材料中约为 1–2 MeV cm²/g。因此 ADC 谱中的缪子峰几乎是一个通用的能量标尺。' } },
    { prompt: { en: 'You book the Edep histogram from 0 to 20 MeV for 10 cm of scintillator. What goes wrong?', zh: '为 10 cm 闪烁体把 Edep 直方图设为 0–20 MeV，会出什么问题？' },
      opts: [{ en: 'Nothing', zh: '没有问题' }, { en: 'The peak sits at the edge and most of the tail lands in overflow, so the histogram mean is biased low', zh: '峰位于边缘，大部分尾巴落入溢出，直方图均值被低估' }, { en: 'Geant4 refuses to fill it', zh: 'Geant4 拒绝填充' }, { en: 'The run gets slower', zh: '运行变慢' }],
      a: 1, why: { en: 'At the minimum, 10 cm of polyvinyltoluene gives ≈ 20 MeV; at 100 MeV kinetic energy about 24 MeV. A histogram mean only counts in-range entries, so a 20 MeV ceiling clips most events. This course books 0–80 MeV.', zh: '最小电离时 10 cm 聚乙烯基甲苯约沉积 20 MeV，100 MeV 动能时约 24 MeV。直方图均值只统计范围内的条目，20 MeV 上限会截掉大部分事例。本课程设为 0–80 MeV。' } }
  ]);
  G.progress('w04');
  G.pager(el('pager'), 4);
})();
