/* Week 05 — toy digitization chain and coincidence trigger (Week 5).
   TOY MODEL, not Geant4.
   Chain: Edep (1 cm PVT, 4 GeV muon) drawn from a Moyal approximation to the Landau distribution
   with MPV 1.78 MeV and width xi = 0.086 MeV (xi = K/2 Z/A rho x / beta^2; MPV from our Geant4 run),
   -> Birks: Evis = Edep / (1 + kB dE/dx) with dE/dx = Edep / 1 cm (event-level, unlike the per-step
   Geant4 code) -> photoelectrons ~ Poisson(LY * Evis) -> ADC = pedestal + gain * npe + Gauss(noise).
   Coincidence: two independent Poisson pulse trains; accidental rate 2 tau R1 R2 (standard result for
   a symmetric window |t1 - t2| < tau), checked by a short Monte Carlo. */
(function () {
  'use strict';
  var G = window.G4C, SEED = 20261022;
  var el = function (id) { return document.getElementById(id); };
  var PED = 50, GAIN = 4, MPV = 1.78, XI = 0.0857;

  function moyal(r) { /* Moyal sample: lambda = -ln(z^2), z ~ N(0,1); x = MPV + xi * lambda */
    var z = r.gauss(); return MPV + XI * (-Math.log(z * z + 1e-300));
  }
  function poisson(r, mu) {
    if (mu > 40) return Math.max(0, Math.round(mu + Math.sqrt(mu) * r.gauss()));
    var L = Math.exp(-mu), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1;
  }
  function p() { return { ly: Math.pow(10, +el('w5-ly').value), noise: +el('w5-noise').value, kb: +el('w5-kb').value, thr: +el('w5-thr').value }; }
  var st;
  function simulate() {
    var q = p(), r = G.rng(SEED), N = 4000, pts = [];
    for (var i = 0; i < N; i++) {
      var e = Math.min(moyal(r), 30), ev = e / (1 + q.kb * e / 10);    /* dE/dx in MeV/mm over 10 mm */
      var npe = poisson(r, q.ly * ev), adc = PED + GAIN * npe + q.noise * r.gauss();
      pts.push([e, ev, adc]);
    }
    /* pedestal-only events (no muon) to show what the threshold must reject */
    var ped = []; for (var j = 0; j < 4000; j++) ped.push(PED + q.noise * r.gauss());
    st = { q: q, pts: pts, ped: ped };
  }
  function drawScatter() {
    var c = el('w5-scatter'), rr = G.size(c), x = rr[0], w = rr[1], h = rr[2];
    if (!w) return;
    var panel = G.css('--panel'), frame = G.css('--frame'), muted = G.css('--muted'), col = G.css('--hist'), neg = G.css('--neg');
    x.fillStyle = panel; x.fillRect(0, 0, w, h);
    var L = 52, R = w - 10, T = 10, B = h - 32, emax = 6, amax = PED + GAIN * st.q.ly * 6 * 1.05 + 4 * st.q.noise;
    var X = function (e) { return L + e / emax * (R - L); }, Y = function (a) { return B - (a - 0) / amax * (B - T); };
    x.globalAlpha = 0.35; x.fillStyle = col;
    st.pts.forEach(function (pt) { if (pt[0] < emax) x.fillRect(X(pt[0]) - 1, Y(pt[2]) - 1, 2, 2); });
    x.globalAlpha = 1;
    /* ideal line: no fluctuations, no quenching */
    x.strokeStyle = G.css('--neu'); x.setLineDash([5, 4]); x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(X(0), Y(PED)); x.lineTo(X(emax), Y(PED + GAIN * st.q.ly * emax)); x.stroke(); x.setLineDash([]);
    /* threshold */
    x.strokeStyle = neg; x.beginPath(); x.moveTo(L, Y(st.q.thr)); x.lineTo(R, Y(st.q.thr)); x.stroke();
    x.fillStyle = neg; x.font = '11px "IBM Plex Mono", monospace'; x.textAlign = 'right'; x.fillText(G.t('threshold ', '阈值 ') + st.q.thr + ' ADC', R - 4, Y(st.q.thr) - 4);
    x.strokeStyle = frame; x.lineWidth = 1; x.strokeRect(L + .5, T + .5, R - L - 1, B - T);
    x.fillStyle = muted; x.textAlign = 'center';
    for (var e = 0; e <= emax; e++) { x.beginPath(); x.moveTo(X(e), B); x.lineTo(X(e), B - 7); x.strokeStyle = frame; x.stroke(); x.fillText(String(e), X(e), B + 14); }
    var step = G.niceStep(amax, 5);
    x.textAlign = 'right';
    for (var a = step; a < amax; a += step) { x.beginPath(); x.moveTo(L, Y(a)); x.lineTo(L + 7, Y(a)); x.stroke(); x.fillText(String(Math.round(a)), L - 6, Y(a) + 4); }
    x.fillText(G.t('Edep (Geant4 truth) [MeV]', 'Edep（Geant4 真相）[MeV]'), R, h - 2);
    x.save(); x.translate(12, T); x.rotate(-Math.PI / 2); x.fillText('ADC [counts]', 0, 0); x.restore();
    x.fillStyle = G.css('--neu'); x.textAlign = 'left'; x.fillText(G.t('- - ideal: no fluctuations, no quenching', '- - 理想：无涨落、无猝灭'), L + 8, T + 16);
  }
  function drawHist() {
    var q = st.q, amax = PED + GAIN * q.ly * 6 * 1.05 + 4 * q.noise, nb = 80, bins = new Array(nb).fill(0);
    st.pts.forEach(function (pt) { var b = Math.floor(pt[2] / amax * nb); if (b >= 0 && b < nb) bins[b]++; });
    var above = st.pts.filter(function (pt) { return pt[2] > q.thr; }).length, N = st.pts.length;
    var fake = st.ped.filter(function (a) { return a > q.thr; }).length;
    var s = 0, s2 = 0; st.pts.forEach(function (pt) { s += pt[2]; s2 += pt[2] * pt[2]; });
    var mean = s / N, sd = Math.sqrt(s2 / N - mean * mean);
    G.hist(el('w5-hist'), { bins: bins, lo: 0, hi: amax, name: 'ADC', xlabel: 'ADC [counts]', ylabel: G.t('events / bin', '事例数 / bin'),
      stats: [['Entries', String(N)], ['Mean', mean.toFixed(1)], ['Std Dev', sd.toFixed(1)]] });
    var e = above / N, ee = Math.sqrt(e * (1 - e) / N), mpe = q.ly * MPV / (1 + q.kb * MPV / 10);
    el('w5-pe').textContent = mpe.toFixed(1);
    el('w5-res').textContent = (100 / Math.sqrt(Math.max(mpe, 1e-9))).toFixed(1) + ' %';
    el('w5-eff').textContent = e.toFixed(4) + ' ± ' + ee.toFixed(4);
    el('w5-fake').textContent = (fake / st.ped.length).toFixed(4);
    el('w5-quench').textContent = (1 / (1 + q.kb * MPV / 10)).toFixed(3);
  }
  function syncOut() {
    var q = p();
    el('w5-ly-out').textContent = q.ly.toFixed(q.ly < 10 ? 1 : 0) + ' p.e./MeV';
    el('w5-noise-out').textContent = q.noise.toFixed(1) + ' ADC';
    el('w5-kb-out').textContent = q.kb.toFixed(3) + ' mm/MeV';
    el('w5-thr-out').textContent = q.thr + ' ADC';
  }
  function runChain() { syncOut(); simulate(); drawScatter(); drawHist(); }

  /* ---------- coincidence ---------- */
  function cq() { return { r1: Math.pow(10, +el('w5-r1').value), r2: Math.pow(10, +el('w5-r2').value), tau: Math.pow(10, +el('w5-tau').value), rt: +el('w5-rt').value }; }
  function fmtR(v) { return v >= 1 ? v.toPrecision(3) + ' Hz' : v >= 1e-3 ? (v * 1e3).toPrecision(3) + ' mHz' : v.toExponential(2) + ' Hz'; }
  function mcAccidentals(q) {
    /* simulate T seconds of two independent Poisson trains (capped at ~4e5 pulses) */
    var r = G.rng(SEED + 9), T = Math.min(100, 4e5 / Math.max(q.r1 + q.r2, 1)), tau = q.tau * 1e-9;
    function train(R) { var t = 0, a = []; for (;;) { t += -Math.log(1 - r()) / R; if (t > T) break; a.push(t); } return a; }
    var a = train(q.r1), b = train(q.r2), j = 0, n = 0;
    for (var i = 0; i < a.length; i++) {
      while (j < b.length && b[j] < a[i] - tau) j++;
      var k = j; while (k < b.length && b[k] < a[i] + tau) { n++; k++; }
    }
    return { n: n, T: T };
  }
  function drawCoinc() {
    var q = cq(), acc = 2 * q.tau * 1e-9 * q.r1 * q.r2, mc = mcAccidentals(q);
    el('w5-r1-out').textContent = fmtR(q.r1); el('w5-r2-out').textContent = fmtR(q.r2);
    el('w5-tau-out').textContent = q.tau.toPrecision(3) + ' ns'; el('w5-rt-out').textContent = fmtR(q.rt);
    el('w5-acc').textContent = fmtR(acc);
    el('w5-accmc').textContent = mc.n + G.t(' in ', ' 次 / ') + mc.T.toPrecision(3) + ' s = ' + fmtR(mc.n / mc.T) + (mc.n > 0 ? ' ± ' + fmtR(Math.sqrt(mc.n) / mc.T) : '');
    el('w5-purity').textContent = (100 * q.rt / (q.rt + acc)).toFixed(acc / q.rt < 1e-4 ? 4 : 2) + ' %';
    var pts = [];
    G.loglog(el('w5-coinc'), {
      xlo: 1, xhi: 1e4, ylo: 1e-6, yhi: 1e4, pts: [[q.tau, Math.max(acc, 1.01e-6)], [q.tau, Math.max(q.rt, 1.01e-6)]],
      line: function (t) { return 2 * t * 1e-9 * q.r1 * q.r2; },
      xlabel: G.t('coincidence window τ [ns]', '符合窗口 τ [ns]'), ylabel: G.t('rate [Hz]', '计数率 [Hz]'), lineLabel: G.t('accidentals 2τR₁R₂', '偶然符合 2τR₁R₂')
    });
  }
  G.onRedraw(function () { drawScatter(); drawHist(); drawCoinc(); });
  ['w5-ly', 'w5-noise', 'w5-kb', 'w5-thr'].forEach(function (id) { el(id).addEventListener('input', syncOut); el(id).addEventListener('change', runChain); });
  ['w5-r1', 'w5-r2', 'w5-tau', 'w5-rt'].forEach(function (id) { el(id).addEventListener('change', drawCoinc); el(id).addEventListener('input', function () { var q = cq(); el('w5-r1-out').textContent = fmtR(q.r1); el('w5-r2-out').textContent = fmtR(q.r2); el('w5-tau-out').textContent = q.tau.toPrecision(3) + ' ns'; }); });
  runChain(); drawCoinc();

  G.quiz(el('quiz'), 'w05', [
    { prompt: { en: 'Where should the 0.1 MeV threshold be applied?', zh: '0.1 MeV 阈值应该在哪里施加？' },
      opts: [{ en: 'In ProcessHits, on each step', zh: '在 ProcessHits 中，对每一步' }, { en: 'After the event, on the accumulated deposit of each counter', zh: '事例结束后，对每个计数器累计的沉积' }, { en: 'In the primary generator', zh: '在初级粒子产生器中' }, { en: 'In the physics list', zh: '在物理列表中' }],
      a: 1, why: { en: 'Geant4 splits one traversal into several steps (Week 3). A per-step threshold makes the efficiency depend on how the transport engine happened to cut the track, a fake detector effect. Accumulate first, threshold after.', zh: 'Geant4 会把一次穿越拆成好几步（第 3 周）。按步施加阈值会让效率取决于输运引擎如何切分径迹，这是假的探测器效应。先累加，再判阈。' } },
    { prompt: { en: 'Vertical muons are spread uniformly over a 30 × 30 cm plane above a 10 × 10 cm counter. What efficiency do you expect?', zh: '竖直缪子均匀分布在 10 × 10 cm 计数器上方 30 × 30 cm 的平面上，预期效率是多少？' },
      opts: [{ en: '1.0, a MIP always fires', zh: '1.0，MIP 总会触发' }, { en: 'About 0.111 = 100/900', zh: '约 0.111 = 100/900' }, { en: 'About 0.5', zh: '约 0.5' }, { en: 'It depends on the light yield only', zh: '只取决于光产额' }],
      a: 1, why: { en: 'Efficiency is defined for a stated input population and threshold. Here almost every muon that crosses fires, so the efficiency is the area fraction: our Geant4 run gave 0.1133 ± 0.0022.', zh: '效率是相对于给定的入射粒子总体和阈值来定义的。这里几乎每个穿过的缪子都会触发，所以效率就是面积比：我们的 Geant4 运行给出 0.1133 ± 0.0022。' } },
    { prompt: { en: 'You raise the light yield fourfold. Which part of the Edep–ADC band narrows, in relative terms?', zh: '把光产额提高 4 倍，Edep–ADC 带的哪部分在相对意义上变窄？' },
      opts: [{ en: 'Nothing changes', zh: '什么都不变' }, { en: 'The Poisson photoelectron spread, by a factor of 2', zh: '光电子泊松涨落，变窄 2 倍' }, { en: 'The Landau tail of Edep', zh: 'Edep 的朗道尾巴' }, { en: 'The quenching, by a factor of 4', zh: '猝灭，变为 1/4' }],
      a: 1, why: { en: 'Relative Poisson spread is 1/√N<sub>pe</sub>: 4× the photoelectrons halves it. The Landau shape is physics in the scintillator and quenching is a material property; neither cares about light collection.', zh: '泊松相对涨落为 1/√N<sub>pe</sub>：光电子数增加 4 倍，涨落减半。朗道形状是闪烁体中的物理，猝灭是材料属性，两者都与光收集无关。' } },
    { prompt: { en: 'Two counters each fire at 100 Hz from background. With a 20 ns window, what accidental coincidence rate do you expect?', zh: '两个计数器的本底计数率各为 100 Hz，符合窗口 20 ns，预期偶然符合率是多少？' },
      opts: [{ en: '200 Hz', zh: '200 Hz' }, { en: '4 × 10⁻⁴ Hz', zh: '4 × 10⁻⁴ Hz' }, { en: '2 Hz', zh: '2 Hz' }, { en: 'Zero', zh: '零' }],
      a: 1, why: { en: 'R<sub>acc</sub> = 2τR₁R₂ = 2 × 20 ns × 100 Hz × 100 Hz = 4 × 10⁻⁴ Hz, about one per 40 minutes, against a true muon coincidence rate of order 0.3 Hz for these counters.', zh: 'R<sub>acc</sub> = 2τR₁R₂ = 2 × 20 ns × 100 Hz × 100 Hz = 4 × 10⁻⁴ Hz，约 40 分钟一次；而这对计数器的真实缪子符合率约为 0.3 Hz 量级。' } },
    { prompt: { en: 'In the noise run, "both ADC above threshold" was 2032 events but the trigger with |Δt| < 20 ns was 403. What made the difference?', zh: '噪声运行中，“两路 ADC 均超阈”有 2032 个事例，而加上 |Δt| < 20 ns 的触发只有 403 个。差别来自哪里？' },
      opts: [{ en: 'A bug in the time calculation', zh: '时间计算有 bug' }, { en: 'Background pulses are random in time, so most pairs fall outside 20 ns', zh: '本底脉冲在时间上随机，大部分配对落在 20 ns 之外' }, { en: 'The muons were too slow', zh: '缪子太慢' }, { en: 'The threshold changed', zh: '阈值变了' }],
      a: 1, why: { en: 'A background pulse lands anywhere in the 1 µs window; a 40 ns wide coincidence accepts only 4% of such pairs. Two hits in one event is not a coincidence: timing is part of the trigger definition.', zh: '本底脉冲可能落在 1 µs 读出窗口的任何位置，40 ns 宽的符合窗只接受其中 4% 的配对。同一事例中有两个击中不等于符合：时间条件是触发定义的一部分。' } },
    { prompt: { en: 'A common EventAction looks up the hits-collection ID in its constructor. Why does this course do it lazily in EndOfEventAction?', zh: '常见的 EventAction 写法在构造函数中查找 hits collection ID。本课程为何改为在 EndOfEventAction 中延迟查找？' },
      opts: [{ en: 'Style only', zh: '只是风格问题' }, { en: 'User actions are built before the sensitive detector exists, so the ID would be −1', zh: '用户动作在灵敏探测器创建之前构建，ID 会是 −1' }, { en: 'It is faster', zh: '这样更快' }, { en: 'The constructor cannot call Geant4', zh: '构造函数不能调用 Geant4' }],
      a: 1, why: { en: 'In a sequential run, ActionInitialization::Build() runs when it is registered, before Initialize() calls ConstructSDandField(). The collection is not registered yet. Looking it up on first use, as the official examples do, always works.', zh: '在串行运行中，ActionInitialization::Build() 在注册时就执行，早于 Initialize() 调用 ConstructSDandField()，此时集合尚未注册。像官方示例那样在第一次使用时查找，总是可靠的。' } }
  ]);
  G.progress('w05');
  G.pager(el('pager'), 5);
})();
