/* Week 07 — toy tracker–magnet–tracker spectrometer (textbook Ch. 8).
   TOY MODEL, not Geant4. Same layout as the week07 app: planes at z = -1.0, -0.8, -0.6 and
   +0.6, +0.8, +1.0 m, a dipole from z = -0.5 to +0.5 m (length L) with field B along y.
   In the field the track is an exact circle (sin(theta) grows linearly with z, slope 1/R,
   R = p / (0.2998 B)). Multiple scattering: a Gaussian angle kick at each silicon plane
   (Highland formula, PDG Eq. 34.16 with beta = 1) plus one kick per air gap; energy loss ignored.
   Hits are smeared by the plane resolution. Reconstruction: two straight-line fits (default) or
   the textbook's single quadratic through all six hits. */
(function () {
  'use strict';
  var G = window.G4C, SEED = 20261024, KC = 0.299792458;
  var ZP = [-1.0, -0.8, -0.6, 0.6, 0.8, 1.0], ZM0 = -0.5, ZM1 = 0.5, Z0 = -1.2;
  var X0_SI = 0.0937, X0_AIR = 303.9;         /* radiation lengths [m] (PDG) */
  /* our Geant4 11.4 results (1,000 mu- each, sigma_x = 50 um, Si 300 um, B = 1.5 T) */
  var G4RES = [[1.101, 0.0040], [2.103, 0.0031], [5.105, 0.0042], [10.105, 0.0064], [20.105, 0.0113]];
  var el = function (id) { return document.getElementById(id); };

  function highland(p, xX0) { if (xX0 <= 0) return 0; return 0.0136 / p * Math.sqrt(xX0) * (1 + 0.038 * Math.log(xX0)); }
  function params() {
    return { p: Math.pow(10, +el('w7-p').value), B: +el('w7-B').value, sig: +el('w7-sig').value * 1e-6, tsi: +el('w7-t').value * 1e-6, method: el('w7-method').value };
  }
  /* propagate one track; returns hits [{z,x}] and a polyline for drawing */
  function track(p, P, r, keepPath) {
    var R = P.B > 0 ? p / (KC * P.B) : Infinity;
    var z = Z0, x = 0, s = 0, path = keepPath ? [[z, x]] : null, hits = [];
    var stops = ZP.slice(0, 3).concat([ZM0, 0, ZM1]).concat(ZP.slice(3)).sort(function (a, b) { return a - b; });
    var zPrev = Z0;
    stops.forEach(function (zs) {
      /* move from z to zs, with curvature only inside [ZM0, ZM1] */
      var nsub = keepPath ? 12 : 1;
      for (var k = 1; k <= nsub; k++) {
        var zn = z + (zs - z) * (1 / (nsub - k + 1));
        var inField = (z >= ZM0 - 1e-9 && zn <= ZM1 + 1e-9) && isFinite(R);
        if (inField) {
          var s1 = s + (zn - z) / R;
          if (Math.abs(s1) >= 1) { s1 = Math.sign(s1) * 0.999999; }
          x += R * (Math.sqrt(1 - s * s) - Math.sqrt(1 - s1 * s1));
          s = s1;
        } else {
          x += (zn - z) * s / Math.sqrt(1 - s * s);
        }
        z = zn;
        if (path) path.push([z, x]);
      }
      /* scattering kicks */
      var th = Math.asin(s), air = highland(p, (zs - zPrev) / X0_AIR), isPlane = ZP.indexOf(zs) >= 0;
      var kick = Math.sqrt(air * air + (isPlane ? Math.pow(highland(p, P.tsi / X0_SI), 2) : 0));
      th += kick * r.gauss(); s = Math.sin(th);
      if (isPlane) hits.push({ z: zs, x: x, xm: x + P.sig * r.gauss() });
      zPrev = zs;
    });
    return { hits: hits, path: path };
  }
  function slope(h) { var zm = 0, xm = 0; h.forEach(function (q) { zm += q.z; xm += q.xm; }); zm /= h.length; xm /= h.length; var a = 0, b = 0; h.forEach(function (q) { a += (q.z - zm) * (q.xm - xm); b += (q.z - zm) * (q.z - zm); }); return { t: a / b, zm: zm, xm: xm }; }
  function recTwo(h, P) {
    var a = slope(h.slice(0, 3)), b = slope(h.slice(3));
    var d = b.t / Math.sqrt(1 + b.t * b.t) - a.t / Math.sqrt(1 + a.t * a.t);
    return { p: KC * P.B * (ZM1 - ZM0) / Math.abs(d), a: a, b: b };
  }
  function recQuad(h, P) {   /* least squares x = c2 z^2 + c1 z + c0 */
    var S = [0, 0, 0, 0, 0], T = [0, 0, 0];
    h.forEach(function (q) { var z = q.z, zz = 1; for (var i = 0; i < 5; i++) { S[i] += zz; zz *= z; } T[0] += q.xm; T[1] += q.xm * z; T[2] += q.xm * z * z; });
    var M = [[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]];
    var det = function (m) { return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); };
    var D = det(M), M2 = M.map(function (row, i) { return [row[0], row[1], T[i]]; });
    var c2 = det(M2) / D;
    return { p: KC * P.B / Math.abs(2 * c2), c2: c2 };
  }
  function reco(h, P) { return P.method === 'quad' ? recQuad(h, P) : recTwo(h, P); }

  var st;
  function simulate() {
    var P = params(), r = G.rng(SEED), res = [], N = 2000;
    for (var i = 0; i < N; i++) { var t = track(P.p, P, r, false); res.push((reco(t.hits, P).p - P.p) / P.p); }
    var r2 = G.rng(SEED + 1), show = [];
    for (var j = 0; j < 12; j++) show.push(track(P.p, P, r2, true));
    /* resolution vs p, toy points */
    var curve = [], r3 = G.rng(SEED + 2);
    [0.5, 1, 2, 5, 10, 20, 50, 100].forEach(function (pp) {
      var a = [];
      for (var k = 0; k < 600; k++) a.push((reco(track(pp, P, r3, false).hits, P).p - pp) / pp);
      a.sort(function (u, v) { return u - v; });
      var q16 = a[Math.floor(0.16 * a.length)], q84 = a[Math.floor(0.84 * a.length)];
      curve.push([pp, (q84 - q16) / 2]);
    });
    st = { P: P, res: res, show: show, curve: curve };
  }
  function stats(a) { var s = 0, s2 = 0; a.forEach(function (v) { s += v; s2 += v * v; }); var m = s / a.length; return { mean: m, sd: Math.sqrt(Math.max(0, s2 / a.length - m * m)) }; }
  function median(a) { var b = a.slice().sort(function (u, v) { return u - v; }); return b[Math.floor(b.length / 2)]; }

  var DFG = 'rgba(220,227,232,', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  function drawDisplay() {
    var c = el('w7-display'), r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, h);
    var maxX = 0.05; st.show.forEach(function (t) { t.path.forEach(function (q) { maxX = Math.max(maxX, Math.abs(q[1])); }); });
    var sx = (w - 40) / 2.6, sy = Math.min((h - 50) / (2 * maxX * 1.1), sx * 400);
    var Zx = function (z) { return 20 + (z - Z0) * sx; }, Xy = function (v) { return h / 2 - v * sy; };
    x.fillStyle = 'rgba(115,147,255,0.12)'; x.fillRect(Zx(ZM0), 12, (ZM1 - ZM0) * sx, h - 36);
    x.fillStyle = DFG + '0.55)'; x.font = '10px ' + MONO; x.textAlign = 'center';
    x.fillText('B = ' + st.P.B.toFixed(2) + ' T  (y, out of page)', Zx(0), 24);
    ZP.forEach(function (z) { x.strokeStyle = DFG + '0.5)'; x.beginPath(); x.moveTo(Zx(z), 12); x.lineTo(Zx(z), h - 24); x.stroke(); });
    x.fillText(G.t('tracker 1', '径迹室 1'), Zx(-0.8), h - 10); x.fillText(G.t('tracker 2', '径迹室 2'), Zx(0.8), h - 10);
    st.show.forEach(function (t, i) {
      var last = i === st.show.length - 1;
      x.globalAlpha = last ? 1 : 0.35; x.strokeStyle = '#FF6369'; x.lineWidth = last ? 2 : 1;
      x.beginPath(); t.path.forEach(function (q, k) { if (k) x.lineTo(Zx(q[0]), Xy(q[1])); else x.moveTo(Zx(q[0]), Xy(q[1])); }); x.stroke();
      if (last) {
        x.fillStyle = '#F2D06B'; t.hits.forEach(function (q) { x.beginPath(); x.arc(Zx(q.z), Xy(q.xm), 3, 0, 2 * Math.PI); x.fill(); });
        if (st.P.method === 'two') {
          var rc = recTwo(t.hits, st.P);
          x.strokeStyle = '#E2B04A'; x.setLineDash([5, 4]); x.lineWidth = 1.2;
          [[rc.a, -1.15, 0.1], [rc.b, -0.1, 1.15]].forEach(function (L) { x.beginPath(); x.moveTo(Zx(L[1]), Xy(L[0].xm + L[0].t * (L[1] - L[0].zm))); x.lineTo(Zx(L[2]), Xy(L[0].xm + L[0].t * (L[2] - L[0].zm))); x.stroke(); });
          x.setLineDash([]);
        }
      }
    });
    x.globalAlpha = 1;
    x.fillStyle = DFG + '0.5)'; x.textAlign = 'left';
    x.fillText(G.t('top view: z → , x ↑ (x magnified ×', '俯视图：z →，x ↑（x 放大 ×') + (sy / sx).toFixed(0) + ')', 10, 24);
  }
  function drawHist() {
    var s = stats(st.res), sd = s.sd, lo = s.mean - 5 * sd, hi = s.mean + 5 * sd, nb = 60, bins = new Array(nb).fill(0);
    st.res.forEach(function (v) { var b = Math.floor((v - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) bins[b]++; });
    G.hist(el('w7-hist'), { bins: bins, lo: lo, hi: hi, name: 'dp_over_p', xlabel: '(p_rec − p_true) / p_true', ylabel: G.t('tracks / bin', '径迹数 / bin'),
      stats: [['Entries', String(st.res.length)], ['Mean', s.mean.toFixed(4)], ['Std Dev', sd.toFixed(4)]] });
    var P = st.P, dth = KC * P.B * (ZM1 - ZM0) / P.p;
    var sMeas = Math.SQRT2 * P.sig / Math.sqrt(0.08), meas = sMeas / dth;
    var ms = Math.sqrt(4 * Math.pow(highland(P.p, P.tsi / X0_SI), 2) + Math.pow(highland(P.p, 1.2 / X0_AIR), 2)) / dth;
    el('w7-defl').textContent = (dth * 1000).toFixed(1) + ' mrad';
    el('w7-meas').textContent = (100 * meas).toFixed(2) + ' %';
    el('w7-ms').textContent = (100 * ms).toFixed(2) + ' %';
    el('w7-tot').textContent = (100 * Math.sqrt(meas * meas + ms * ms)).toFixed(2) + ' %';
    el('w7-bias').textContent = (100 * median(st.res)).toFixed(2) + ' %';
    el('w7-sd').textContent = (100 * sd).toFixed(2) + ' %';
  }
  function drawCurve() {
    var P = st.P, pts = st.curve.slice();
    var std = P.B === 1.5 && Math.abs(P.sig - 50e-6) < 1e-9 && Math.abs(P.tsi - 300e-6) < 1e-9 && P.method === 'two';
    G.loglog(el('w7-curve'), {
      xlo: 0.3, xhi: 200, ylo: 1e-4, yhi: 1, pts: pts,
      line: function (pp) { var d = KC * P.B / pp, m = Math.SQRT2 * P.sig / Math.sqrt(0.08) / d, s = Math.sqrt(4 * Math.pow(highland(pp, P.tsi / X0_SI), 2) + Math.pow(highland(pp, 1.2 / X0_AIR), 2)) / d; return Math.sqrt(m * m + s * s); },
      xlabel: 'p [GeV/c]', ylabel: 'σ_p / p', lineLabel: G.t('measurement ⊕ scattering', '测量 ⊕ 散射')
    });
    el('w7-g4note').hidden = !std;
    if (std) {
      var c = el('w7-curve'), x = c.getContext('2d');
      /* overlay Geant4 points in green squares (same axes as G.loglog) */
      var w = c.clientWidth, h = c.clientHeight, L = 50, R = w - 12, T = 10, B = h - 32;
      var X = function (v) { return L + (Math.log10(v) - Math.log10(0.3)) / (Math.log10(200) - Math.log10(0.3)) * (R - L); };
      var Y = function (v) { return B - (Math.log10(v) + 4) / 4 * (B - T); };
      x.fillStyle = G.css('--neu'); G4RES.forEach(function (q) { x.fillRect(X(q[0]) - 4, Y(q[1]) - 4, 8, 8); });
    }
  }
  function drawAll() { drawDisplay(); drawHist(); drawCurve(); }
  G.onRedraw(drawAll);
  function sync() {
    var P = params();
    el('w7-p-out').textContent = +P.p.toPrecision(3) + ' GeV/c';
    el('w7-B-out').textContent = P.B.toFixed(2) + ' T';
    el('w7-sig-out').textContent = Math.round(P.sig * 1e6) + ' µm';
    el('w7-t-out').textContent = Math.round(P.tsi * 1e6) + ' µm Si';
  }
  function run() { sync(); simulate(); drawAll(); }
  ['w7-p', 'w7-B', 'w7-sig', 'w7-t'].forEach(function (id) { el(id).addEventListener('input', sync); el(id).addEventListener('change', run); });
  el('w7-method').addEventListener('change', run);
  function fillMethod() {
    var v = el('w7-method').value || 'two';
    el('w7-method').innerHTML = '<option value="two">' + G.t('two lines + deflection angle', '两条直线 + 偏转角') + '</option><option value="quad">' + G.t('textbook: one quadratic through all 6 hits', '教材：6 个点拟合一条抛物线') + '</option>';
    el('w7-method').value = v;
  }
  fillMethod(); window.addEventListener('g4c:lang', fillMethod);
  run();

  G.quiz(el('quiz'), 'w07', [
    { prompt: { en: 'A 10 GeV/c muon crosses a 1 m, 1.5 T dipole. What is its deflection angle?', zh: '10 GeV/c 缪子穿过 1 m、1.5 T 的二极磁铁，偏转角是多少？' },
      opts: [{ en: '4.5 mrad', zh: '4.5 mrad' }, { en: '45 mrad', zh: '45 mrad' }, { en: '0.45 rad', zh: '0.45 rad' }, { en: '1.5 mrad', zh: '1.5 mrad' }],
      a: 1, why: { en: 'Δθ ≈ 0.2998 · B · L / p = 0.2998 × 1.5 × 1 / 10 = 0.045 rad. Over the 0.6 m from the magnet to plane 5 that is a 27 mm sideways shift, measured with 50 µm planes.', zh: 'Δθ ≈ 0.2998 · B · L / p = 0.2998 × 1.5 × 1 / 10 = 0.045 rad。从磁铁到第 5 个平面的 0.6 m 内，横向偏移 27 mm，用 50 µm 分辨率的平面测量。' } },
    { prompt: { en: 'At high momentum, which term dominates σ<sub>p</sub>/p, and how does it scale?', zh: '高动量时，σ<sub>p</sub>/p 中哪一项占主导？如何标度？' },
      opts: [{ en: 'Multiple scattering, constant in p', zh: '多次散射，与 p 无关' }, { en: 'Position measurement, growing ∝ p', zh: '位置测量，∝ p 增长' }, { en: 'Energy loss, ∝ 1/p', zh: '能量损失，∝ 1/p' }, { en: 'Field integration, ∝ p²', zh: '场积分，∝ p²' }],
      a: 1, why: { en: 'The deflection falls as 1/p while the angle error from 50 µm hits stays fixed, so that term grows ∝ p. Scattering angles also fall as 1/p, so the scattering term is flat. Our Geant4 runs show 0.31% at 2 GeV rising to 1.13% at 20 GeV.', zh: '偏转角按 1/p 减小，而 50 µm 测点带来的角度误差不变，所以这一项 ∝ p 增长。散射角也按 1/p 减小，所以散射项与 p 无关。我们的 Geant4 结果：2 GeV 时 0.31%，20 GeV 时升至 1.13%。' } },
    { prompt: { en: 'Doubling the magnet length L (everything else fixed) changes the measurement term of σ<sub>p</sub>/p by…', zh: '磁铁长度 L 加倍（其他不变），σ<sub>p</sub>/p 的测量项变为……' },
      opts: [{ en: '×2 worse', zh: '差 2 倍' }, { en: '×1/2: twice the deflection, same angle errors', zh: '×1/2：偏转加倍，角度误差不变' }, { en: '×1/4', zh: '×1/4' }, { en: 'No change', zh: '不变' }],
      a: 1, why: { en: 'The deflection is ∝ B·L, so doubling L or doubling B halves the measurement term. (A longer magnet also adds a little scattering in air.) The textbook asks whether L and B act differently: for this layout, to first order they act the same through B·L.', zh: '偏转 ∝ B·L，所以 L 加倍或 B 加倍都使测量项减半（更长的磁铁也会在空气中多一点散射）。教材问 L 与 B 的作用是否不同：对这种布局，一阶近似下两者都通过 B·L 起作用。' } },
    { prompt: { en: 'Why does the textbook\'s single quadratic fit overestimate p by ~50–60% here?', zh: '为什么教材的单抛物线拟合在这里会把 p 高估约 50–60%？' },
      opts: [{ en: 'Too few points', zh: '点太少' }, { en: 'The track is straight–arc–straight, but the model puts the whole path inside the field', zh: '径迹是“直线–圆弧–直线”，而模型假设整条路径都在磁场中' }, { en: 'The field is not uniform', zh: '磁场不均匀' }, { en: 'Rounding in polyfit', zh: 'polyfit 的舍入误差' }],
      a: 1, why: { en: 'A parabola spread over 2 m of planes has a smaller curvature than the 1 m arc that really bends the track, so p = 0.3B/|2a| comes out too high. That model is right only for hits inside the field (a tracker in a solenoid). Here, fit a line on each side and use the change of slope.', zh: '在 2 m 范围的平面上拟合的抛物线，其曲率小于真正使径迹弯曲的 1 m 圆弧，所以 p = 0.3B/|2a| 偏大。这种模型只适用于测点都在磁场内的情形（如螺线管中的径迹室）。这里应在两侧各拟合一条直线，用斜率变化求 p。' } },
    { prompt: { en: 'You reconstruct p from Geant4 hits without smearing them. What have you measured?', zh: '用未经弥散的 Geant4 击中点重建 p，你测到的是什么？' },
      opts: [{ en: 'The detector resolution', zh: '探测器分辨率' }, { en: 'Only the scattering and field effects; the 50 µm detector resolution is missing', zh: '只有散射与磁场效应；缺了 50 µm 的探测器分辨率' }, { en: 'The true momentum exactly', zh: '精确的真实动量' }, { en: 'Nothing useful', zh: '没有任何用处' }],
      a: 1, why: { en: 'The CSV holds truth positions. Truth → measurement needs the smearing step; skipping it gives an optimistic resolution. reconstruct.py smears by 50 µm before fitting, keeping truth, measurement and reconstruction separate.', zh: 'CSV 中是真实位置。从真相到测量必须经过弥散这一步；跳过它会得到过于乐观的分辨率。reconstruct.py 在拟合前先做 50 µm 弥散，把真相、测量和重建分开。' } }
  ]);
  G.progress('w07');
  G.pager(el('pager'), 7);
})();
