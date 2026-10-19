/* Week 10 — toy transverse-field muSR (textbook Ch. 12).
   TOY MODEL, not Geant4 and not musrSim. Every muon stops at the target centre at t = 0 with spin
   P·(0,0,-1) and decays after an exponential time (tau = 2.1969811 us, PDG). Its spin precesses about
   B = B x-hat at gamma_mu/2pi = 135.5388 MHz/T, so S(t) = P(0, -sin wt, -cos wt). The positron
   direction n is drawn from 1 + a S·n with a = 1/3, the energy-integrated Michel asymmetry (no energy
   threshold, no material). A counter fires when n lies inside a cone of half-angle alpha around +y
   (U, ID 11) or -y (D, ID 1): a cone, not the real 80 x 80 mm square slab. "Field spread" gives each
   muon its own B drawn from a Gaussian, which dephases the ensemble. Unticking "spin-aware decay" sets
   a = 0, which is what Geant4's plain G4MuonDecayChannel does. Fit: Levenberg–Marquardt on
   A(t) = A0 exp(-lambda t) sin(2 pi f t + phi), seeded by a periodogram. */
(function () {
  'use strict';
  var G = window.G4C, TAU = 2.1969811, GAM = 0.1355388;   // us; MHz per mT
  var el = function (id) { return document.getElementById(id); };
  var NB = 200, TMAX = 10;                                  // as asymmetry.py: 200 bins of 50 ns

  function params() {
    return { B: +el('w10-B').value, P: +el('w10-P').value / 100, alpha: +el('w10-a').value, spread: +el('w10-g').value / 100,
      spin: el('w10-spin').checked, N: Math.max(1000, Math.round(Math.pow(10, +el('w10-N').value) / 1000) * 1000), t: +el('w10-t').value };
  }

  function simulate(P) {
    var r = G.rng(20261101), NU = new Array(NB).fill(0), ND = new Array(NB).fill(0);
    var a = P.spin ? 1 / 3 : 0, ca = Math.cos(P.alpha * Math.PI / 180), w0 = 2 * Math.PI * GAM * P.B;
    for (var i = 0; i < P.N; i++) {
      var t = -TAU * Math.log(1 - r());
      var w = w0 * (1 + P.spread * r.gauss());
      var sy = -P.P * Math.sin(w * t), sz = -P.P * Math.cos(w * t);
      var ny, nz, nx;
      do {
        nz = 2 * r() - 1; var s = Math.sqrt(1 - nz * nz), ph = 2 * Math.PI * r();
        nx = s * Math.cos(ph); ny = s * Math.sin(ph);
      } while (r() * (1 + a) > 1 + a * (sy * ny + sz * nz));
      if (t >= TMAX) continue;
      var b = Math.floor(t / TMAX * NB);
      if (ny > ca) NU[b]++; else if (-ny > ca) ND[b]++;
    }
    return { NU: NU, ND: ND, a: a, ca: ca };
  }

  function model(p, t) { return p[0] * Math.exp(-p[3] * t) * Math.sin(2 * Math.PI * p[1] * t + p[2]); }
  function fit(tg, A, E, f0) {
    var p = [0.25, f0, 0, 0.02], lam = 1e-3, n = tg.length;
    function chi(q) { var c = 0; for (var i = 0; i < n; i++) { var d = (A[i] - model(q, tg[i])) / E[i]; c += d * d; } return c; }
    var c0 = chi(p), JTJ, cov;
    for (var it = 0; it < 80; it++) {
      JTJ = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; var g = [0, 0, 0, 0];
      for (var i = 0; i < n; i++) {
        var J = [], m = model(p, tg[i]);
        for (var k = 0; k < 4; k++) { var h = 1e-6 * Math.max(1e-3, Math.abs(p[k])), q = p.slice(); q[k] += h; J[k] = (model(q, tg[i]) - m) / h / E[i]; }
        var res = (A[i] - m) / E[i];
        for (var k2 = 0; k2 < 4; k2++) { g[k2] += J[k2] * res; for (var l = 0; l < 4; l++) JTJ[k2][l] += J[k2] * J[l]; }
      }
      var M = JTJ.map(function (row, k) { return row.map(function (v, l) { return k === l ? v * (1 + lam) : v; }); });
      var d = solve(M, g); if (!d) break;
      var np = p.map(function (v, k) { return v + d[k]; }), c1 = chi(np);
      if (c1 < c0) { var done = c0 - c1 < 1e-7 * c0; p = np; c0 = c1; lam *= 0.3; if (done) break; } else lam *= 10;
    }
    cov = inv(JTJ);
    return { p: p, e: cov ? [0, 1, 2, 3].map(function (k) { return Math.sqrt(Math.abs(cov[k][k])); }) : [NaN, NaN, NaN, NaN], chi2: c0, ndf: n - 4 };
  }
  function solve(M, b) { var I = inv(M); return I && I.map(function (row) { return row.reduce(function (s, v, k) { return s + v * b[k]; }, 0); }); }
  function inv(M) {
    var n = M.length, A = M.map(function (r, i) { return r.concat(r.map(function (_, j) { return i === j ? 1 : 0; })); });
    for (var c = 0; c < n; c++) {
      var piv = c; for (var r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-300) return null;
      var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp;
      var d = A[c][c]; for (var j = 0; j < 2 * n; j++) A[c][j] /= d;
      for (var r2 = 0; r2 < n; r2++) if (r2 !== c) { var f = A[r2][c]; for (var j2 = 0; j2 < 2 * n; j2++) A[r2][j2] -= f * A[c][j2]; }
    }
    return A.map(function (r) { return r.slice(n); });
  }

  function analyse(P, S) {
    var tg = [], A = [], E = [];
    for (var i = 0; i < NB; i++) {
      var tot = S.NU[i] + S.ND[i]; if (tot <= 20) continue;
      var a = (S.ND[i] - S.NU[i]) / tot;
      tg.push((i + 0.5) * TMAX / NB); A.push(a); E.push(Math.sqrt((1 - a * a) / tot));
    }
    /* periodogram seed */
    var best = 0, f0 = GAM * P.B || 0.5;
    for (var f = 0.05; f <= 6.5; f += 0.005) {
      var sc = 0, cc = 0; for (var k = 0; k < tg.length; k++) { var wgt = 1 / (E[k] * E[k]); sc += wgt * A[k] * Math.sin(2 * Math.PI * f * tg[k]); cc += wgt * A[k] * Math.cos(2 * Math.PI * f * tg[k]); }
      var pw = sc * sc + cc * cc; if (pw > best) { best = pw; f0 = f; }
    }
    var F = tg.length > 8 ? fit(tg, A, E, f0) : null;
    return { tg: tg, A: A, E: E, F: F };
  }

  var st;
  function run() {
    var P = params();
    el('w10-B-out').textContent = P.B + ' mT';
    el('w10-P-out').textContent = Math.round(P.P * 100) + '%';
    el('w10-a-out').textContent = P.alpha + '°';
    el('w10-g-out').textContent = (P.spread * 100).toFixed(1) + '%';
    el('w10-N-out').textContent = P.N.toLocaleString('en-US');
    el('w10-t-out').textContent = P.t.toFixed(2) + ' µs';
    var S = simulate(P);
    st = { P: P, S: S, R: analyse(P, S) };
    drawAll();
  }
  function scrub() { if (!st) return; st.P.t = +el('w10-t').value; el('w10-t-out').textContent = st.P.t.toFixed(2) + ' µs'; drawDisplay(); }

  function drawDisplay() {
    var c = el('w10-display'), r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    var P = st.P, MONO = '"IBM Plex Mono", ui-monospace, monospace';
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, h);
    var cx = w * 0.5, cy = h * 0.5, sc = Math.min(w, h) / 120;     // px per mm
    /* field box + label */
    x.fillStyle = 'rgba(115,147,255,0.07)'; x.fillRect(0, 0, w, h);
    x.font = '10px ' + MONO; x.fillStyle = 'rgba(220,227,232,0.6)'; x.textAlign = 'left';
    x.fillText('B = ' + P.B + ' mT  ⊙ ' + G.t('out of the page (+x)', '指出纸面 (+x)'), 10, h - 10);
    x.fillText('z → ' + G.t('beam', '束流') + '   y ↑', 10, 16);
    /* counters: 80 mm wide, 6 mm thick, at y = ±45 */
    [[45, '#7393FF', 'CounterU · ID 11'], [-45, '#FF6369', 'CounterD · ID 1']].forEach(function (k) {
      x.fillStyle = k[1] + '55'; x.strokeStyle = k[1];
      x.fillRect(cx - 40 * sc, cy - (k[0] + 3) * sc, 80 * sc, 6 * sc); x.strokeRect(cx - 40 * sc, cy - (k[0] + 3) * sc, 80 * sc, 6 * sc);
      x.fillStyle = k[1]; x.fillText(k[2], cx - 40 * sc, k[0] > 0 ? cy - (k[0] + 3) * sc - 6 : cy - (k[0] - 3) * sc + 13);
    });
    /* acceptance cones (toy) */
    var ta = Math.tan(P.alpha * Math.PI / 180);
    x.setLineDash([3, 4]); x.strokeStyle = 'rgba(220,227,232,0.35)';
    [1, -1].forEach(function (sg) { x.beginPath(); x.moveTo(cx - 52 * ta * sc, cy - sg * 52 * sc); x.lineTo(cx, cy); x.lineTo(cx + 52 * ta * sc, cy - sg * 52 * sc); x.stroke(); });
    x.setLineDash([]);
    /* target 30 x 6 mm (z extent 6) */
    x.fillStyle = 'rgba(200,205,210,0.5)'; x.fillRect(cx - 3 * sc, cy - 15 * sc, 6 * sc, 30 * sc);
    /* beam */
    x.strokeStyle = '#F2D06B'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, cy); x.lineTo(cx - 3 * sc, cy); x.stroke();
    x.fillStyle = '#F2D06B'; x.fillText('μ⁺ 29.8 MeV/c', 10, cy - 8);
    /* emission lobe 1 + aP cos(theta) around the spin, in the y-z plane */
    var wv = 2 * Math.PI * GAM * P.B, sy = -Math.sin(wv * P.t), sz = -Math.cos(wv * P.t), a = st.S.a * P.P;
    x.beginPath();
    for (var k = 0; k <= 120; k++) {
      var th = k / 120 * 2 * Math.PI, ny = Math.sin(th), nz = Math.cos(th), rr = 22 * sc * (1 + a * (sy * ny + sz * nz));
      var px = cx + rr * nz, py = cy - rr * ny; if (k) x.lineTo(px, py); else x.moveTo(px, py);
    }
    x.closePath(); x.fillStyle = 'rgba(79,201,138,0.18)'; x.fill(); x.strokeStyle = '#4FC98A'; x.lineWidth = 1.2; x.stroke();
    /* spin arrow */
    var L = 30 * sc * Math.max(0.15, P.P);
    x.strokeStyle = '#DCE3E8'; x.fillStyle = '#DCE3E8'; x.lineWidth = 2.4;
    var ex = cx + L * sz, ey = cy - L * sy;
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(ex, ey); x.stroke();
    var an = Math.atan2(ey - cy, ex - cx);
    x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex - 9 * Math.cos(an - 0.4), ey - 9 * Math.sin(an - 0.4)); x.lineTo(ex - 9 * Math.cos(an + 0.4), ey - 9 * Math.sin(an + 0.4)); x.closePath(); x.fill();
    x.fillStyle = 'rgba(220,227,232,0.85)'; x.textAlign = 'right';
    x.fillText('t = ' + P.t.toFixed(2) + ' µs   ωt = ' + ((wv * P.t * 180 / Math.PI) % 360).toFixed(0) + '°', w - 10, 16);
    x.fillStyle = '#4FC98A'; x.fillText(G.t('green: 1 + a·P·cos θ  (a = ', '绿色：1 + a·P·cos θ（a = ') + (st.S.a ? '1/3' : '0') + ')', w - 10, h - 10);
    x.textAlign = 'left';
  }

  function frame(c) {
    var r = G.size(c), x = r[0], w = r[1], h = r[2];
    x.fillStyle = G.css('--panel'); x.fillRect(0, 0, w, h);
    return { x: x, w: w, h: h, L: 50, R: w - 10, T: 10, B: h - 32 };
  }
  function axes(f, ylo, yhi, xlabel, ylabel) {
    var x = f.x, muted = G.css('--muted'), frameC = G.css('--frame');
    x.strokeStyle = frameC; x.lineWidth = 1; x.strokeRect(f.L + .5, f.T + .5, f.R - f.L - 1, f.B - f.T);
    x.fillStyle = muted; x.font = '11px "IBM Plex Mono", ui-monospace, monospace'; x.textAlign = 'center';
    for (var v = 0; v <= TMAX; v += 1) { var tx = f.L + v / TMAX * (f.R - f.L); x.beginPath(); x.moveTo(tx, f.B); x.lineTo(tx, f.B - 6); x.stroke(); if (v % 2 === 0) x.fillText(String(v), tx, f.B + 14); }
    var ys = G.niceStep(yhi - ylo, 4);
    x.textAlign = 'right';
    for (var y = Math.ceil(ylo / ys) * ys; y <= yhi + 1e-9; y += ys) { var ty = f.B - (y - ylo) / (yhi - ylo) * (f.B - f.T); x.beginPath(); x.moveTo(f.L, ty); x.lineTo(f.L + 6, ty); x.stroke(); x.fillText(String(+y.toFixed(3)), f.L - 5, ty + 4); }
    x.fillText(xlabel, f.R, f.h - 2);
    x.save(); x.translate(11, f.T); x.rotate(-Math.PI / 2); x.fillText(ylabel, 0, 0); x.restore();
    x.textAlign = 'left';
  }
  function drawCounts() {
    var f = frame(el('w10-counts')); if (!f.w) return;
    var S = st.S, max = 1.15 * Math.max(1, Math.max.apply(null, S.NU.concat(S.ND))), x = f.x;
    [[S.NU, G.css('--pos')], [S.ND, G.css('--neg')]].forEach(function (k) {
      x.strokeStyle = k[1]; x.lineWidth = 1.3; x.beginPath();
      for (var i = 0; i < NB; i++) { var y = f.B - k[0][i] / max * (f.B - f.T), x0 = f.L + i / NB * (f.R - f.L), x1 = f.L + (i + 1) / NB * (f.R - f.L); if (i) x.lineTo(x0, y); else x.moveTo(x0, y); x.lineTo(x1, y); }
      x.stroke();
    });
    axes(f, 0, max, G.t('decay time [µs]', '衰变时间 [µs]'), G.t('positrons / 50 ns', '正电子数 / 50 ns'));
    var su = S.NU.reduce(function (a, b) { return a + b; }, 0), sd = S.ND.reduce(function (a, b) { return a + b; }, 0);
    G.statBox(x, f.R, f.T, 'N(t)', [['U (ID 11)', String(su)], ['D (ID 1)', String(sd)]]);
    x.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    x.fillStyle = G.css('--pos'); x.fillText('— U', f.L + 10, f.T + 16); x.fillStyle = G.css('--neg'); x.fillText('— D', f.L + 50, f.T + 16);
  }
  function drawAsym() {
    var f = frame(el('w10-asym')); if (!f.w) return;
    var R = st.R, P = st.P, x = f.x, lo = -0.42, hi = 0.42;
    function Y(v) { return f.B - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (f.B - f.T); }
    function X(t) { return f.L + t / TMAX * (f.R - f.L); }
    x.strokeStyle = G.css('--rule'); x.beginPath(); x.moveTo(f.L, Y(0)); x.lineTo(f.R, Y(0)); x.stroke();
    var A0e = st.S.a * P.P * (1 + st.S.ca) / 2, wv = 2 * Math.PI * GAM * P.B;
    x.save(); x.strokeStyle = G.css('--neu'); x.setLineDash([5, 4]); x.lineWidth = 1.3; x.beginPath();
    for (var k = 0; k <= 600; k++) { var t = k / 600 * TMAX, damp = Math.exp(-0.5 * Math.pow(P.spread * wv * t, 2)); if (k) x.lineTo(X(t), Y(A0e * damp * Math.sin(wv * t))); else x.moveTo(X(t), Y(0)); }
    x.stroke(); x.restore();
    x.strokeStyle = G.css('--fg'); x.fillStyle = G.css('--fg'); x.lineWidth = 1;
    for (var i = 0; i < R.tg.length; i++) { var px = X(R.tg[i]); x.beginPath(); x.moveTo(px, Y(R.A[i] - R.E[i])); x.lineTo(px, Y(R.A[i] + R.E[i])); x.stroke(); x.fillRect(px - 1.5, Y(R.A[i]) - 1.5, 3, 3); }
    if (R.F) {
      x.strokeStyle = G.css('--hist'); x.lineWidth = 1.6; x.beginPath();
      for (var q = 0; q <= 600; q++) { var tt = q / 600 * TMAX; if (q) x.lineTo(X(tt), Y(model(R.F.p, tt))); else x.moveTo(X(tt), Y(model(R.F.p, tt))); }
      x.stroke();
    }
    axes(f, lo, hi, G.t('decay time [µs]', '衰变时间 [µs]'), 'A(t) = (N_D − N_U)/(N_D + N_U)');
    var stats = '';
    if (R.F) {
      var p = R.F.p, e = R.F.e;
      stats = 'A0 = ' + p[0].toFixed(3) + ' ± ' + e[0].toFixed(3) + '    f = ' + p[1].toFixed(4) + ' ± ' + e[1].toFixed(4) + ' MHz    λ = ' + p[3].toFixed(3) + ' ± ' + e[3].toFixed(3) + ' /µs    χ²/ndf = ' + R.F.chi2.toFixed(0) + '/' + R.F.ndf;
    }
    el('w10-fit').innerHTML = '<span style="color:var(--hist)">— ' + G.t('fit', '拟合') + '</span>   ' + stats + '\n<span style="color:var(--neu)">- - ' + G.t('expected  A0 = a·P·(1+cos α)/2 = ', '期望  A0 = a·P·(1+cos α)/2 = ') + A0e.toFixed(3) + ', f = ' + (GAM * P.B).toFixed(4) + ' MHz</span>';
    var bad = R.F && (Math.abs(R.F.p[0]) < 3 * R.F.e[0] || !isFinite(R.F.e[1]));
    el('w10-verdict').innerHTML = !R.F ? '' : bad
      ? '<span class="bad">' + G.t('No significant oscillation: the fitted "frequency" is noise. Recovered B is meaningless.', '没有显著的振荡：拟合出的“频率”只是噪声，反推出的 B 没有意义。') + '</span>'
      : '<span class="ok">' + G.t('Configured ', '设定 ') + P.B + ' mT → ' + G.t('recovered ', '反推 ') + (R.F.p[1] / GAM).toFixed(3) + ' ± ' + (R.F.e[1] / GAM).toFixed(3) + ' mT</span>';
  }
  function drawAll() { drawDisplay(); drawCounts(); drawAsym(); }

  G.onRedraw(function () { if (st) drawAll(); });
  var tmr;
  ['w10-B', 'w10-P', 'w10-a', 'w10-g', 'w10-N'].forEach(function (id) { el(id).addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(run, 60); }); });
  el('w10-spin').addEventListener('change', run);
  el('w10-t').addEventListener('input', scrub);
  var playing = null;
  el('w10-play').addEventListener('click', function () {
    if (playing) { cancelAnimationFrame(playing); playing = null; el('w10-play').textContent = '▶ ' + G.t('play', '播放'); return; }
    el('w10-play').textContent = '❚❚ ' + G.t('pause', '暂停');
    var last = performance.now();
    (function step(now) {
      var v = +el('w10-t').value + (now - last) / 1000 * 0.25; last = now;   // 0.25 us of muon time per second
      if (v > 5) v = 0; el('w10-t').value = v; scrub(); playing = requestAnimationFrame(step);
    })(last);
  });
  run();

  G.quiz(el('quiz'), 'w10', [
    { prompt: { en: 'The textbook macro sets 10 mT. What precession frequency and period should the fit find?', zh: '教材宏设定 10 mT，拟合应得到什么进动频率和周期？' },
      opts: [{ en: '13.55 MHz, 74 ns', zh: '13.55 MHz，74 ns' }, { en: '1.355 MHz, 0.738 µs', zh: '1.355 MHz，0.738 µs' }, { en: '135.5 MHz, 7.4 ns', zh: '135.5 MHz，7.4 ns' }, { en: '0.455 MHz, 2.2 µs', zh: '0.455 MHz，2.2 µs' }],
      a: 1, why: { en: 'f = (γμ/2π)·B = 135.5388 MHz/T × 0.010 T = 1.3554 MHz; T = 1/f = 0.738 µs, about three turns per muon lifetime. Our Geant4 run gave the number on this page.', zh: 'f = (γμ/2π)·B = 135.5388 MHz/T × 0.010 T = 1.3554 MHz；T = 1/f = 0.738 µs，每个缪子寿命内约转三圈。我们的 Geant4 运行结果见本页。' } },
    { prompt: { en: 'Why form A = (N_D − N_U)/(N_D + N_U) instead of fitting N_U(t) alone?', zh: '为什么要构造 A = (N_D − N_U)/(N_D + N_U)，而不是只拟合 N_U(t)？' },
      opts: [{ en: 'It has more events', zh: '它的事例更多' }, { en: 'The common exp(−t/τ) envelope and normalisation cancel, leaving the oscillation', zh: '共同的 exp(−t/τ) 包络和归一化相消，只剩下振荡' }, { en: 'ROOT cannot fit exponentials', zh: 'ROOT 不能拟合指数' }, { en: 'It removes the field', zh: '它能去掉磁场' }],
      a: 1, why: { en: 'Both counters see N0 e^{−t/τ}(1 ± A0 sin ωt). The ratio removes e^{−t/τ} and N0. It does not remove a relative efficiency difference between U and D, which real analyses fit as a parameter α.', zh: '两个计数器都看到 N0 e^{−t/τ}(1 ± A0 sin ωt)。比值消去了 e^{−t/τ} 和 N0，但消不掉 U 与 D 之间的相对效率差，实际分析中会把它作为参数 α 拟合。' } },
    { prompt: { en: 'An application registers FTFP_BERT with its stock G4DecayPhysics and nothing else. What does A(t) look like?', zh: '某应用只注册了带默认 G4DecayPhysics 的 FTFP_BERT，A(t) 是什么样子？' },
      opts: [{ en: 'The textbook oscillation', zh: '教材中的振荡' }, { en: 'Flat at zero: the positrons are emitted isotropically', zh: '在零附近平坦：正电子各向同性发射' }, { en: 'A faster oscillation', zh: '更快的振荡' }, { en: 'The run crashes', zh: '运行崩溃' }],
      a: 1, why: { en: 'G4MuonDecayChannel "neglects muon polarization" (its source says so, in 10.7.2 and 11.4) and G4Decay does not precess the spin at rest. Our Geant4 11.4 control run without G4SpinDecayPhysics gives A0 consistent with zero.', zh: 'G4MuonDecayChannel“忽略缪子极化”（10.7.2 和 11.4 的源码都这样写），G4Decay 也不会在静止时让自旋进动。我们不加 G4SpinDecayPhysics 的 Geant4 11.4 对照运行给出的 A0 与零相容。' } },
    { prompt: { en: 'You add a field gradient across the target. What changes in the fit?', zh: '在靶上加一个磁场梯度，拟合中什么会变？' },
      opts: [{ en: 'Only f', zh: '只有 f' }, { en: 'Mainly λ: muons precess at slightly different rates and dephase', zh: '主要是 λ：缪子以略有不同的速率进动而失相' }, { en: 'Only A0 at t = 0', zh: '只有 t = 0 时的 A0' }, { en: 'Nothing', zh: '没有变化' }],
      a: 1, why: { en: 'A spread of fields is a spread of frequencies: the ensemble loses phase coherence and the oscillation damps. Lower polarisation or a smaller solid angle lowers A0 instead; changing B changes f.', zh: '磁场的分布就是频率的分布：整体失去相位相干，振荡衰减。降低极化或减小立体角则降低 A0；改变 B 才改变 f。' } },
    { prompt: { en: 'Your question is the TF-μSR asymmetry. Should you switch on /musr/command G4OpticalPhotons true?', zh: '你研究的是 TF-μSR 不对称度，要不要打开 /musr/command G4OpticalPhotons true？' },
      opts: [{ en: 'Yes, always: it is more accurate', zh: '要，永远要：更精确' }, { en: 'No: the observable needs which counter fired and when, not photon transport', zh: '不要：这个可观测量只需要哪个计数器何时响应，不需要光子输运' }, { en: 'Yes, or there are no hits', zh: '要，否则没有击中' }, { en: 'Only for μ⁻', zh: '只对 μ⁻' }],
      a: 1, why: { en: 'Optical photons multiply the tracked particles enormously. Turn them on when the observable needs photon arrival times, surfaces or photocathode response, and say what the parameterised response discards.', zh: '光学光子会让被追踪的粒子数暴增。只有当可观测量需要光子到达时间、表面或光阴极响应时才打开，并说明参数化响应舍弃了什么。' } },
    { prompt: { en: 'Spin starts along −z, B along +x. Which counter sees the excess first?', zh: '自旋初始沿 −z，B 沿 +x。哪个计数器先看到多出的正电子？' },
      opts: [{ en: 'U (+y)', zh: 'U（+y）' }, { en: 'D (−y)', zh: 'D（−y）' }, { en: 'Both equally, forever', zh: '两者始终相同' }, { en: 'It depends on the beam momentum', zh: '取决于束流动量' }],
      a: 1, why: { en: 'dS/dt = γμ S × B with γμ > 0 for μ⁺: (0,0,−1) × (B,0,0) points along −y. Our Geant4 truth spin at t = 0.283 µs was (S_y, S_z) = (−0.668, +0.745), matching (−sin ωt, −cos ωt). That is why the fit starts with A0 > 0 and φ ≈ 0.', zh: 'dS/dt = γμ S × B，μ⁺ 的 γμ > 0：(0,0,−1) × (B,0,0) 指向 −y。我们 Geant4 中 t = 0.283 µs 时的真值自旋为 (S_y, S_z) = (−0.668, +0.745)，与 (−sin ωt, −cos ωt) 吻合。所以拟合从 A0 > 0、φ ≈ 0 开始。' } }
  ]);
  G.progress('w10');
  G.pager(el('pager'), 10);
})();
