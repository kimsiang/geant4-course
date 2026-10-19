/* Week 01 — toy Monte Carlo of a two-layer telescope (Week 1, Example 1.2).
   TOY MODEL, not Geant4: straight lines in vacuum, zero-thickness 100%-efficient square layers,
   impact points uniform on the upper layer, directions from the chosen beam model.
   The reference value is a numerical integral of the same model, so it checks the sampling and
   the statistics, not the physics of real muons. */
(function () {
  'use strict';
  var G = window.G4C;
  var SEED = 20261018;

  /* ---------- beam models: how cos(theta) is sampled ---------- */
  var MODELS = {
    iso:   { en: 'Isotropic in solid angle (first pass)', zh: '立体角内各向同性（第一版）', cos: function (u) { return u; }, w: function (th) { return Math.sin(th); } },
    cos2:  { en: 'cos²θ intensity (sea-level shape, PDG)', zh: 'cos²θ 强度（海平面形状，PDG）', cos: function (u) { return Math.cbrt(u); }, w: function (th) { var c = Math.cos(th); return 3 * c * c * Math.sin(th); } },
    cos3:  { en: 'cos²θ crossing a horizontal plane (× cosθ)', zh: 'cos²θ 穿过水平面（再乘 cosθ）', cos: function (u) { return Math.sqrt(Math.sqrt(u)); }, w: function (th) { var c = Math.cos(th); return 4 * c * c * c * Math.sin(th); } },
    vert:  { en: 'Vertical only (limiting case: ε = 1)', zh: '仅竖直入射（极限情形：ε = 1）', cos: function () { return 1; }, w: null },
    thetaU:{ en: 'BROKEN: θ uniform in [0, π/2]', zh: '错误示范：θ 在 [0, π/2] 均匀', cos: function (u) { return Math.cos(u * Math.PI / 2); }, w: function () { return 2 / Math.PI; } }
  };

  /* Reference ε: integrate the overlap fraction of the shifted lower square over the beam model.
     For a ray with horizontal shift (dx, dy) = d·tanθ·(cosφ, sinφ), the fraction of upper-layer
     impact points that land on the lower layer is (1 − |dx|/L)(1 − |dy|/L), clipped at zero. */
  function refEps(model, L, d) {
    var m = MODELS[model];
    if (!m.w) return 1;
    var thMax = Math.atan(Math.SQRT2 * L / d), NT = 900, NP = 240, sum = 0;
    for (var i = 0; i < NT; i++) {
      var th = (i + 0.5) / NT * thMax, a = d * Math.tan(th) / L, fphi = 0;
      for (var j = 0; j < NP; j++) {
        var ph = (j + 0.5) / NP * Math.PI / 2;
        fphi += Math.max(0, 1 - a * Math.cos(ph)) * Math.max(0, 1 - a * Math.sin(ph));
      }
      sum += m.w(th) * fphi / NP;
    }
    return sum * thMax / NT;
  }
  G.refEps = refEps; /* exposed for checking */

  /* ---------- state ---------- */
  var st = {};
  var el = function (id) { return document.getElementById(id); };
  var cv = el('tele'), hc = el('pe-hist'), gc = el('conv');
  function params() { return { model: el('w1-model').value, L: +el('w1-L').value, d: +el('w1-d').value, npe: +el('w1-npe').value }; }

  function reset() {
    var p = params();
    st = { p: p, rng: G.rng(SEED), N: 0, k: 0, run: 0, rays: [], land: [], hist: [], ref: refEps(p.model, p.L, p.d), pe: null };
  }
  function shoot(n) {
    var p = st.p, r = st.rng, m = MODELS[p.model], L = p.L, h = L / 2;
    for (var i = 0; i < n; i++) {
      var c = m.cos(r()), phi = 2 * Math.PI * r(), x0 = (r() - 0.5) * L, y0 = (r() - 0.5) * L;
      var t = c > 0 ? Math.sqrt(Math.max(0, 1 - c * c)) / c : 1e9;
      var x1 = x0 + p.d * t * Math.cos(phi), y1 = y0 + p.d * t * Math.sin(phi);
      var hit = Math.abs(x1) < h && Math.abs(y1) < h;
      st.N++; if (hit) st.k++;
      if (n - i <= 60) { st.rays.push({ x0: x0, x1: x1, t: t, phi: phi, hit: hit, q: r() < 0.56 ? 1 : -1 }); }
      if (n - i <= 600) st.land.push([x1, y1, hit]);
    }
    if (st.rays.length > 60) st.rays = st.rays.slice(-60);
    if (st.land.length > 600) st.land = st.land.slice(-600);
    st.run++;
    var e = st.k / st.N;
    if (st.k > 0 && st.k < st.N) st.hist.push([st.N, Math.sqrt(e * (1 - e) / st.N) / e]);
  }
  /* pseudo-experiments: M independent runs of npe events each */
  function pseudo() {
    var p = st.p, r = G.rng(SEED + 7 + p.npe), m = MODELS[p.model], L = p.L, h = L / 2, M = 400, est = [];
    for (var j = 0; j < M; j++) {
      var k = 0;
      for (var i = 0; i < p.npe; i++) {
        var c = m.cos(r()), phi = 2 * Math.PI * r(), x0 = (r() - 0.5) * L, y0 = (r() - 0.5) * L;
        var t = c > 0 ? Math.sqrt(Math.max(0, 1 - c * c)) / c : 1e9;
        if (Math.abs(x0 + p.d * t * Math.cos(phi)) < h && Math.abs(y0 + p.d * t * Math.sin(phi)) < h) k++;
      }
      est.push(k / p.npe);
    }
    st.pe = est;
  }

  /* ---------- drawing ---------- */
  var RED = '#FF6369', BLUE = '#7393FF', HIT = '#F2D06B', DFG = 'rgba(220,227,232,', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  function drawDisplay() {
    var r = G.size(cv), x = r[0], w = r[1], hgt = r[2];
    if (!w) return;
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, hgt);
    var stacked = w < 560, p = st.p;
    var side = stacked ? { x: 0, y: 0, w: w, h: hgt * 0.58 } : { x: 0, y: 0, w: w * 0.62, h: hgt };
    var top = stacked ? { x: 0, y: hgt * 0.58, w: w, h: hgt * 0.42 } : { x: w * 0.62, y: 0, w: w * 0.38, h: hgt };
    /* side view, equal scale on both axes so angles are honest */
    var s = Math.min(side.w / (p.L * 2.6), side.h * 0.70 / p.d);
    var cx = side.x + side.w / 2, yU = side.y + side.h * 0.16, yD = yU + p.d * s;
    x.save(); x.beginPath(); x.rect(side.x, side.y, side.w, side.h); x.clip();
    [yU, yD].forEach(function (y, i) {
      x.fillStyle = 'rgba(115,147,255,0.14)'; x.fillRect(cx - p.L / 2 * s, y - 2.5, p.L * s, 5);
      x.strokeStyle = DFG + '0.45)'; x.lineWidth = 1; x.strokeRect(cx - p.L / 2 * s + .5, y - 2.5 + .5, p.L * s - 1, 4);
      x.fillStyle = DFG + '0.55)'; x.font = '10px ' + MONO; x.textAlign = 'left';
      x.fillText(i ? G.t('lower layer', '下层') : G.t('upper layer', '上层'), cx + p.L / 2 * s + 8, y + 3);
    });
    /* dimension marks */
    x.strokeStyle = DFG + '0.30)'; x.setLineDash([2, 3]);
    x.beginPath(); x.moveTo(cx - p.L / 2 * s - 14, yU); x.lineTo(cx - p.L / 2 * s - 14, yD); x.stroke(); x.setLineDash([]);
    x.fillStyle = DFG + '0.55)'; x.textAlign = 'right';
    x.fillText('d = ' + p.d.toFixed(2) + ' m', cx - p.L / 2 * s - 20, (yU + yD) / 2 + 3);
    x.textAlign = 'center'; x.fillText('L = ' + p.L.toFixed(2) + ' m', cx, yD + 20);
    var ext = 22 / s;
    st.rays.forEach(function (ry, i) {
      var slope = ry.t * Math.cos(ry.phi);
      var xa = ry.x0 - ext * slope, xb = ry.x1 + (ry.hit ? ext : 0) * slope;
      x.globalAlpha = ry.hit ? 0.35 + 0.65 * (i + 1) / st.rays.length : 0.28;
      x.strokeStyle = ry.q < 0 ? RED : BLUE; x.lineWidth = i === st.rays.length - 1 ? 2 : 1.1;
      x.setLineDash(ry.hit ? [] : [4, 4]);
      x.beginPath(); x.moveTo(cx + xa * s, yU - 22); x.lineTo(cx + xb * s, yD + (ry.hit ? 22 : 0)); x.stroke();
      x.setLineDash([]);
      x.fillStyle = HIT; x.beginPath(); x.arc(cx + ry.x0 * s, yU, 2, 0, 2 * Math.PI); x.fill();
      if (ry.hit) { x.beginPath(); x.arc(cx + ry.x1 * s, yD, 2, 0, 2 * Math.PI); x.fill(); }
    });
    x.globalAlpha = 1;
    x.fillStyle = DFG + '0.5)'; x.textAlign = 'left'; x.font = '10px ' + MONO;
    x.fillText(G.t('side view (x–z), last 60 tracks', '侧视图 (x–z)，最近 60 条径迹'), side.x + 10, side.y + side.h - 10);
    x.restore();
    /* top view of the lower layer */
    x.save(); x.beginPath(); x.rect(top.x, top.y, top.w, top.h); x.clip();
    x.strokeStyle = 'rgba(220,227,232,0.16)'; x.beginPath();
    if (stacked) { x.moveTo(0, top.y + .5); x.lineTo(w, top.y + .5); } else { x.moveTo(top.x + .5, 0); x.lineTo(top.x + .5, hgt); }
    x.stroke();
    var span = p.L * 2.4, ts = Math.min(top.w, top.h - 30) * 0.86 / span, tcx = top.x + top.w / 2, tcy = top.y + (top.h - 18) / 2 + 4;
    x.fillStyle = 'rgba(115,147,255,0.10)'; x.fillRect(tcx - p.L / 2 * ts, tcy - p.L / 2 * ts, p.L * ts, p.L * ts);
    x.strokeStyle = DFG + '0.45)'; x.strokeRect(tcx - p.L / 2 * ts + .5, tcy - p.L / 2 * ts + .5, p.L * ts - 1, p.L * ts - 1);
    st.land.forEach(function (pt) {
      var px = tcx + pt[0] * ts, py = tcy - pt[1] * ts;
      if (Math.abs(pt[0]) > span / 2 || Math.abs(pt[1]) > span / 2) return;
      x.fillStyle = pt[2] ? HIT : DFG + '0.22)';
      x.fillRect(px - 1, py - 1, 2.2, 2.2);
    });
    x.fillStyle = DFG + '0.5)'; x.textAlign = 'left';
    x.fillText(G.t('lower layer, top view (x–y)', '下层俯视图 (x–y)'), top.x + 10, top.y + top.h - 10);
    x.restore();
    el('w1-runlabel').textContent = G.t('Run ', '运行 ') + st.run + ' · ' + st.N.toLocaleString('en') + G.t(' tracks', ' 条径迹');
  }
  function fmt(v, n) { return isFinite(v) ? v.toFixed(n) : '—'; }
  function drawReadout() {
    var e = st.N ? st.k / st.N : 0, s = Math.sqrt(e * (1 - e) / Math.max(1, st.N)), pull = s > 0 ? (e - st.ref) / s : NaN;
    el('r-N').textContent = st.N.toLocaleString('en');
    el('r-k').textContent = st.k.toLocaleString('en');
    el('r-e').textContent = fmt(e, 4);
    el('r-s').textContent = st.k === 0 || st.k === st.N ? G.t('0 (formula fails)', '0（公式失效）') : fmt(s, 4);
    el('r-rel').textContent = st.k > 0 && st.k < st.N ? (100 * s / e).toFixed(2) + ' %' : '—';
    el('r-ref').textContent = st.ref.toFixed(4);
    el('r-pull').textContent = isFinite(pull) ? (pull >= 0 ? '+' : '') + pull.toFixed(2) + ' σ' : '—';
    var row = el('r-pull').parentNode; row.classList.toggle('good', isFinite(pull) && Math.abs(pull) < 2); row.classList.toggle('bad', isFinite(pull) && Math.abs(pull) >= 3);
  }
  function drawPE() {
    if (!st.pe) return;
    var p = st.p, eps = st.ref, sig = Math.sqrt(eps * (1 - eps) / p.npe), M = st.pe.length;
    var mean = 0, s2 = 0; st.pe.forEach(function (v) { mean += v; }); mean /= M;
    st.pe.forEach(function (v) { s2 += (v - mean) * (v - mean); });
    var sd = Math.sqrt(s2 / M);
    var lo, hi, bw, nb;
    if (sig > 0) {
      /* bins aligned to multiples of 1/N so the discrete k/N values never comb */
      bw = Math.max(1, Math.round(10 * sig * p.npe / 36)) / p.npe;
      lo = Math.max(0, Math.floor((eps - 5 * sig) / bw) * bw); hi = lo + Math.ceil((Math.min(1, eps + 5 * sig) - lo) / bw) * bw;
      lo -= bw / 2; hi += bw / 2;
    } else { bw = 0.02; lo = eps - 0.2; hi = eps + 0.2; }
    nb = Math.max(1, Math.round((hi - lo) / bw));
    var bins = new Array(nb).fill(0);
    st.pe.forEach(function (v) { var b = Math.floor((v - lo) / bw); if (b >= 0 && b < nb) bins[b]++; });
    G.hist(hc, {
      bins: bins, lo: lo, hi: lo + nb * bw, name: 'eps_hat',
      xlabel: G.t('ε̂ = k/N per run (N = ', '每次运行的 ε̂ = k/N（N = ') + p.npe.toLocaleString('en') + ')',
      ylabel: G.t('runs / bin', '运行次数 / bin'),
      stats: [['Entries', String(M)], ['Mean', mean.toFixed(4)], ['Std Dev', sd.toFixed(4)]],
      curve: sig > 0 ? function (xv) { return M * bw / (sig * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow((xv - eps) / sig, 2)); } : null,
      curveLabel: G.t('binomial σ = ', '二项 σ = ') + sig.toFixed(4)
    });
    el('pe-note').innerHTML = G.bi({
      en: 'Std Dev of the ' + M + ' estimates is <b>' + sd.toFixed(4) + '</b>. The formula √(ε(1−ε)/N) predicts <b>' + sig.toFixed(4) + '</b>.',
      zh: M + ' 个估计值的标准差为 <b>' + sd.toFixed(4) + '</b>，公式 √(ε(1−ε)/N) 预言 <b>' + sig.toFixed(4) + '</b>。'
    });
  }
  function drawConv() {
    var eps = st.ref, maxN = st.N;
    var xhi = Math.max(1e6, Math.pow(10, Math.ceil(Math.log10(Math.max(10, maxN)) + 0.3)));
    G.loglog(gc, {
      xlo: 100, xhi: xhi, ylo: 1e-3, yhi: 1, pts: st.hist,
      line: eps > 0 && eps < 1 ? function (n) { return Math.sqrt((1 - eps) / (eps * n)); } : null,
      xlabel: G.t('events N (cumulative)', '事例数 N（累计）'), ylabel: G.t('σ / ε̂', 'σ / ε̂'), lineLabel: '∝ 1/√N'
    });
  }
  function drawAll() { drawDisplay(); drawReadout(); drawPE(); drawConv(); }
  G.onRedraw(drawAll);

  /* ---------- wiring ---------- */
  function syncLabels() {
    el('w1-L-out').textContent = (+el('w1-L').value).toFixed(2) + ' m';
    el('w1-d-out').textContent = (+el('w1-d').value).toFixed(2) + ' m';
  }
  function restart() { syncLabels(); reset(); shoot(1000); pseudo(); drawAll(); }
  ['w1-L', 'w1-d'].forEach(function (id) { el(id).addEventListener('input', syncLabels); el(id).addEventListener('change', restart); });
  el('w1-model').addEventListener('change', restart);
  el('w1-npe').addEventListener('change', function () { st.p.npe = +el('w1-npe').value; pseudo(); drawPE(); });
  el('b-1k').addEventListener('click', function () { shoot(1000); drawAll(); });
  el('b-10k').addEventListener('click', function () { shoot(10000); drawAll(); });
  el('b-100k').addEventListener('click', function () { shoot(100000); drawAll(); });
  el('b-reset').addEventListener('click', restart);
  var sel = el('w1-model');
  function fillModels() {
    var v = sel.value || 'iso';
    sel.innerHTML = Object.keys(MODELS).map(function (k) { return '<option value="' + k + '">' + G.t(MODELS[k].en, MODELS[k].zh) + '</option>'; }).join('');
    sel.value = v;
  }
  fillModels(); window.addEventListener('g4c:lang', fillModels);
  restart();

  /* ---------- self-check ---------- */
  G.quiz(el('quiz'), 'w01', [
    { prompt: { en: 'You raise N from 1,000 to 100,000. By roughly what factor does the relative uncertainty on ε shrink?', zh: '把 N 从 1,000 提高到 100,000，ε 的相对不确定度大约缩小多少倍？' },
      opts: [{ en: '100', zh: '100 倍' }, { en: '10', zh: '10 倍' }, { en: '√10 ≈ 3.2', zh: '√10 ≈ 3.2 倍' }, { en: 'It does not change', zh: '不变' }],
      a: 1, why: { en: 'σ<sub>ε</sub> = √(ε(1−ε)/N) scales as 1/√N, so 100× the events gives 10× the precision. √10 is the gain for each tenfold step, as the three lines of the script output show.', zh: 'σ<sub>ε</sub> = √(ε(1−ε)/N) 按 1/√N 变化，事例数增加 100 倍，精度只提高 10 倍。√10 是每增加 10 倍时的改进，正如脚本输出的三行所示。' } },
    { prompt: { en: 'At N = 100,000 the script prints ε = 0.0482 ± 0.0007. The numerical integral of the same model gives 0.0490. What do you conclude?', zh: 'N = 100,000 时脚本输出 ε = 0.0482 ± 0.0007，同一模型的数值积分给出 0.0490。结论是什么？' },
      opts: [{ en: 'The code has a bug: the values differ', zh: '代码有错：两个数不相等' }, { en: 'They agree: the difference is about 1.1σ', zh: '两者一致：差约 1.1σ' }, { en: 'You need more decimal places to decide', zh: '需要更多小数位才能判断' }, { en: 'The integral must be wrong', zh: '数值积分一定错了' }],
      a: 1, why: { en: '(0.0490 − 0.0482)/0.0007 ≈ 1.1. Fluctuations of 1–2σ are expected; about one run in three lands more than 1σ away. Suspect a bug only when the deviation exceeds 2–3σ (Week 11 debugs with the same rule).', zh: '(0.0490 − 0.0482)/0.0007 ≈ 1.1。1–2σ 的涨落是正常的，大约三次中就有一次偏离超过 1σ。只有偏差超过 2–3σ 时才怀疑程序有错（第 11 周调试时也用同样的规则）。' } },
    { prompt: { en: 'What does ε = k/N measure in this toy experiment?', zh: '在这个玩具实验中，ε = k/N 测量的是什么？' },
      opts: [{ en: 'The geometric acceptance AΩ of the telescope', zh: '望远镜的几何接受度 AΩ' }, { en: 'The fraction of tracks through the upper layer that also cross the lower layer', zh: '穿过上层的径迹中，同时穿过下层的比例' }, { en: 'The detector efficiency of the scintillators', zh: '闪烁体的探测效率' }, { en: 'The cosmic-ray muon flux', zh: '宇宙线缪子通量' }],
      a: 1, why: { en: 'It is a conditional transmission probability: every sampled track already hits the upper layer. Acceptance AΩ (m²·sr) needs a defined flux and a phase-space integral; efficiency needs a detector response and a threshold (Week 5).', zh: '这是条件透射概率：每条抽样径迹都已经击中上层。几何接受度 AΩ（m²·sr）需要给定通量和相空间积分；探测效率需要探测器响应和阈值（第 5 周）。' } },
    { prompt: { en: 'Which line samples directions isotropically over the downward hemisphere?', zh: '哪一行代码能在向下半球内各向同性地抽样方向？' },
      opts: [{ en: '<code>theta = rng.uniform(0, np.pi/2, N)</code>', zh: '<code>theta = rng.uniform(0, np.pi/2, N)</code>' }, { en: '<code>theta = np.arccos(rng.uniform(0, 1, N))</code>', zh: '<code>theta = np.arccos(rng.uniform(0, 1, N))</code>' }, { en: '<code>theta = np.arccos(rng.uniform(0, 1, N)**2)</code>', zh: '<code>theta = np.arccos(rng.uniform(0, 1, N)**2)</code>' }, { en: '<code>theta = np.zeros(N)</code>', zh: '<code>theta = np.zeros(N)</code>' }],
      a: 1, why: { en: 'The solid-angle element is dΩ = d(cosθ) dφ, so isotropy means cosθ is uniform. Uniform θ ignores the sinθ factor, puts too many tracks near vertical and gives ε ≈ 0.171 instead of 0.049 for L = 0.3 m, d = 0.5 m.', zh: '立体角元 dΩ = d(cosθ) dφ，所以各向同性意味着 cosθ 均匀分布。θ 均匀忽略了 sinθ 因子，使接近竖直的径迹过多；对 L = 0.3 m、d = 0.5 m，会得到 ε ≈ 0.171 而不是 0.049。' } },
    { prompt: { en: 'Keep L = 0.3 m and double the separation d from 0.5 m to 1.0 m. What happens to ε?', zh: '保持 L = 0.3 m，把间距 d 从 0.5 m 加倍到 1.0 m，ε 会怎样？' },
      opts: [{ en: 'It goes up', zh: '变大' }, { en: 'It goes down', zh: '变小' }, { en: 'It stays the same', zh: '不变' }, { en: 'It depends on N', zh: '取决于 N' }],
      a: 1, why: { en: 'A longer lever arm turns the same angle into a larger lateral shift d·tanθ, so fewer tracks still land on the lower square. Try it in the explainer: ε drops from 0.049 to about 0.014.', zh: '更长的间距把同样的角度变成更大的横向位移 d·tanθ，落在下层方块内的径迹更少。可以在上面的演示中试一试：ε 从 0.049 降到约 0.014。' } },
    { prompt: { en: 'A run gives k = 0 transmitted tracks out of N = 200. What should you report?', zh: '一次运行中 N = 200 条径迹里透射数 k = 0。应该怎样报告？' },
      opts: [{ en: 'ε = 0 ± 0', zh: 'ε = 0 ± 0' }, { en: 'ε < 3/N ≈ 0.015 at about 95% confidence', zh: '在约 95% 置信度下 ε < 3/N ≈ 0.015' }, { en: 'Nothing can be said', zh: '无法得出任何结论' }, { en: 'ε = 1/N = 0.005', zh: 'ε = 1/N = 0.005' }],
      a: 1, why: { en: 'At k = 0 the binomial formula returns σ = 0, which is meaningless. The probability of seeing zero is (1−ε)<sup>N</sup>; setting it to 5% gives the "rule of three" upper limit ε < 3/N. This is a standard statistical result.', zh: 'k = 0 时二项公式给出 σ = 0，这没有意义。观测到零的概率为 (1−ε)<sup>N</sup>，令其等于 5% 即得到“三法则”上限 ε < 3/N。这是统计学标准结论。' } }
  ]);
  G.progress('w01');
  G.pager(el('pager'), 1);
})();
