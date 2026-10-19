/* Geant4 2.0 — scenes for the 3D event displays (engine: assets/evdisplay.js).
   Colours follow the Geant4 visualisation convention: red = negative, blue = positive,
   green = neutral; detector hits in yellow. Every scene is tagged DATA (real Geant4 11.4 output
   from this course, assets/evd-data.js) or TOY (simple model; approximations in the page caption). */
(function () {
  'use strict';
  var EVD = window.EVD, C = EVD.C, bi = EVD.bi;
  var DATA = '<span class="data">' + bi({ en: 'GEANT4 11.4 DATA', zh: 'GEANT4 11.4 数据' }) + '</span>';
  var TOY = '<span class="toy">' + bi({ en: 'TOY MODEL', zh: '玩具模型' }) + '</span>';
  function qcol(q) { return q < 0 ? C.neg : q > 0 ? C.pos : C.neu; }
  function fmt(x, d) { return (+x).toFixed(d); }

  /* PDG 2024 standard rock (rho = 2.65 g/cm3): muon kinetic energy [GeV] -> CSDA range [g/cm2] */
  var RT = [[1, 553.4], [2, 1088], [3, 1599], [5, 2581], [10, 4920], [20, 9360], [50, 21800], [100, 40840], [200, 74590], [500, 153800], [1000, 245300], [10000, 688100]];
  function rangeRock(E) {
    if (E <= RT[0][0]) return RT[0][1] * E / RT[0][0];
    for (var i = 1; i < RT.length; i++) if (E <= RT[i][0]) {
      var a = RT[i - 1], b = RT[i], f = Math.log(E / a[0]) / Math.log(b[0] / a[0]);
      return Math.exp(Math.log(a[1]) + f * Math.log(b[1] / a[1]));
    }
    return RT[RT.length - 1][1];
  }

  /* ================================================================ index: muography of a hill */
  (function () {
    var R = EVD.rng(7), H0 = 32, SIG = 45, TEL = [0, -6, 0], VOID = { c: [16, 14, 0], r: 7 }, RHO = 2.65;
    function surf(x) { return H0 * Math.exp(-x * x / (2 * SIG * SIG)); }
    function rockLength(p, d) {   // metres of rock along the ray p + s d (s > 0) above the telescope
      var L = 0, n = 400, smax = 260, ds = smax / n;
      for (var i = 0; i < n; i++) {
        var s = (i + 0.5) * ds, x = p[0] + s * d[0], y = p[1] + s * d[1], z = p[2] + s * d[2];
        if (y > surf(x)) continue;
        var dx = x - VOID.c[0], dy = y - VOID.c[1], dz = z - VOID.c[2];
        if (dx * dx + dy * dy + dz * dz < VOID.r * VOID.r) continue;
        if (y > -2 && Math.abs(x) < 3 && y < 2.5) continue;   // tunnel interior
        L += ds;
      }
      return L;
    }
    function exitPoint(p, d) { var s = 0; while (s < 400) { s += 0.5; var x = p[0] + s * d[0], y = p[1] + s * d[1]; if (y > surf(x) + 0.2) break; } return s; }
    EVD.scene('muography', {
      tag: TOY, camera: { pos: [150, 70, 190], target: [0, 8, 0], fov: 34, fitWidth: 230 }, autoRotate: 0.35,
      bloom: { strength: 0.95, radius: 0.5, threshold: 0.1 },
      build: function (A, S) {
        A.surface(function (x) { return surf(x); }, -110, 110, -45, 45, 44, 12, { color: C.det, opacity: 0.32 });
        A.surface(function () { return -14; }, -110, 110, -45, 45, 11, 6, { color: C.det, opacity: 0.08 });
        A.cylinder([0, 0, 0], 3, 90, 'z', { color: C.detHi, opacity: 0.45, fillOpacity: 0.05, seg: 24 });
        A.sphere(VOID.c, VOID.r, { color: C.neu, opacity: 0.45, seg: 16 });
        S.tel = A.box(TEL, [4, 1.2, 4], { color: C.hit, opacity: 0.9, fillOpacity: 0.25 });
        A.label([0, 0, 47], { en: 'tunnel', zh: '隧道' });
        A.label([VOID.c[0] + 9, VOID.c[1] + 8, 0], { en: 'hidden void', zh: '隐藏空洞' }, 'neu');
        A.label([TEL[0] + 9, TEL[1] - 3, 0], { en: 'muon telescope', zh: '缪子望远镜' }, 'hi');
        A.label([-70, surf(-70) + 10, 0], { en: 'rock, 2.65 g/cm³', zh: '岩石 2.65 g/cm³' });
        S.n = 0; S.hit = 0; S.voidHits = 0; S.Esum = 0;
      },
      event: function (i, A, S) {
        var tracks = [], hits = [], N = 26;
        for (var k = 0; k < N; k++) {
          var c = Math.pow(R(), 1 / 3), th = Math.acos(c) * 0.95, ph = 2 * Math.PI * R();
          var up = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph) * 0.35];
          var nrm = Math.hypot(up[0], up[1], up[2]); up = up.map(function (v) { return v / nrm; });
          var p0 = [TEL[0] + (R() - 0.5) * 3, TEL[1] + 0.6, TEL[2] + (R() - 0.5) * 3];
          var L = rockLength(p0, up);
          var E = Math.pow(1 - R(), -1 / 1.7);
          var se = exitPoint(p0, up), top = se + 30;
          var start = [p0[0] + up[0] * top, p0[1] + up[1] * top, p0[2] + up[2] * top];
          var q = R() < 0.56 ? 1 : -1, t0 = k * 0.22 + R() * 0.1;
          var Rm = rangeRock(E) / (RHO * 100);   // metres of rock this muon can cross
          var through = Rm >= L;
          var passV = (function () { var vx = VOID.c[0] - p0[0], vy = VOID.c[1] - p0[1], vz = VOID.c[2] - p0[2]; var s = vx * up[0] + vy * up[1] + vz * up[2]; var dx = vx - s * up[0], dy = vy - s * up[1], dz = vz - s * up[2]; return s > 0 && dx * dx + dy * dy + dz * dz < VOID.r * VOID.r; })();
          S.n++;
          if (through) {
            S.hit++; S.Esum += E; if (passV) S.voidHits++;
            tracks.push({ pts: [start, p0], t0: t0, t1: t0 + 0.9, color: qcol(q), headSize: 5, opacity: 0.95, fadeAfter: t0 + 1.4, fadeTo: 0.45 });
            hits.push({ pos: TEL, box: [4.2, 1.4, 4.2], t: t0 + 0.9, color: C.hit, steady: 0, decay: 2.2, fillMax: 0.8 });
          } else {
            var sStop = se - Math.max(0.5, Rm);   // stops Rm metres after entering the rock (void ignored here)
            var stop = [p0[0] + up[0] * sStop, p0[1] + up[1] * sStop, p0[2] + up[2] * sStop];
            var f = (top - sStop) / top;
            tracks.push({ pts: [start, stop], t0: t0, t1: t0 + 0.9 * f, color: qcol(q), headSize: 4, opacity: 0.55, fadeAfter: t0 + 1.2, fadeTo: 0.12 });
            hits.push({ pos: stop, t: t0 + 0.9 * f, color: '#A9B7C2', size: 3.5, steady: 0.15, decay: 3 });
          }
        }
        return {
          dur: N * 0.22 + 1.2, tracks: tracks, hits: hits,
          hud: function () {
            return bi({ en: 'cosmic muons aimed at the telescope', zh: '射向望远镜的宇宙线缪子' }) + '<br>' +
              '<span class="m">' + bi({ en: 'generated', zh: '已产生' }) + '</span> ' + S.n + ' · <span class="m">' + bi({ en: 'reached the tunnel', zh: '到达隧道' }) + '</span> <b>' + S.hit + '</b> (' + fmt(100 * S.hit / Math.max(1, S.n), 1) + '%)<br>' +
              '<span class="m">' + bi({ en: 'of which through the void', zh: '其中穿过空洞' }) + '</span> ' + S.voidHits + ' · <span class="m">' + bi({ en: 'mean E of survivors', zh: '存活者平均能量' }) + '</span> ' + (S.hit ? fmt(S.Esum / S.hit, 0) + ' GeV' : '–');
          }
        };
      }
    });
  })();

  /* ================================================================ primer: air shower */
  (function () {
    var R = EVD.rng(11), LAT = 0.35;   // lateral positions drawn about 10x wider than real
    EVD.scene('shower', {
      tag: TOY, camera: { pos: [22, 12, 30], target: [0, 10, 0], fov: 38, fitWidth: 24 }, autoRotate: 0.4,
      bloom: { strength: 1.0, radius: 0.5, threshold: 0.1 },
      build: function (A) {
        A.surface(function () { return 0; }, -8, 8, -8, 8, 16, 16, { color: C.det, opacity: 0.3 });
        [[15, { en: '≈ 15 km · first interaction', zh: '≈ 15 km · 首次相互作用' }], [10, { en: '10 km · airliners', zh: '10 km · 民航高度' }], [0, { en: 'sea level', zh: '海平面' }]].forEach(function (h) {
          var pts = []; for (var k = 0; k <= 48; k++) { var a = 2 * Math.PI * k / 48; pts.push([7 * Math.cos(a), h[0], 7 * Math.sin(a)]); }
          A.line(pts, { color: C.det, opacity: h[0] ? 0.25 : 0.4 });
          A.label([7.4, h[0], 0], h[1]);
        });
        A.line([[0, 0, 0], [0, 22, 0]], { color: C.det, opacity: 0.15, dashed: true, dash: 0.3, gap: 0.3 });
      },
      event: function (i, A, S) {
        var tracks = [], hits = [], top = [(R() - 0.5) * 2, 22, (R() - 0.5) * 2], vtx = [top[0] * 0.3, 15 - R() * 2, top[2] * 0.3];
        tracks.push({ pts: [top, vtx], t0: 0, t1: 0.9, color: C.pos, headSize: 0.7 });
        hits.push({ pos: vtx, t: 0.9, color: '#ffffff', size: 2.4, steady: 0, decay: 2 });
        var nPi = 5 + Math.floor(R() * 4), nMu = 0;
        for (var k = 0; k < nPi; k++) {
          var ang = 2 * Math.PI * R(), sp = LAT * (0.4 + R()), dir = [Math.cos(ang) * sp, -1, Math.sin(ang) * sp];
          var r = R(), q = r < 0.33 ? 1 : r < 0.66 ? -1 : 0;
          if (q === 0) {   // pi0 -> 2 gamma -> short electromagnetic cascade
            [-1, 1].forEach(function (s) {
              var d2 = [dir[0] + s * 0.08, -1, dir[2] - s * 0.08], len = 4 + R() * 3, end = [vtx[0] + d2[0] * len, vtx[1] - len, vtx[2] + d2[2] * len];
              tracks.push({ pts: [vtx, end], t0: 0.95, t1: 1.6, color: C.neu, opacity: 0.6, headSize: 0.35, dashed: true, dash: 0.2, gap: 0.15, fadeAfter: 2.2, fadeTo: 0.1 });
              for (var e = 0; e < 3; e++) {
                var e2 = [end[0] + (R() - 0.5) * 1.2, end[1] - 1 - R() * 2, end[2] + (R() - 0.5) * 1.2];
                tracks.push({ pts: [end, e2], t0: 1.6, t1: 2.0, color: R() < 0.5 ? C.neg : C.pos, opacity: 0.5, headSize: 0.25, fadeAfter: 2.4, fadeTo: 0.06 });
              }
            });
            continue;
          }
          var lpi = 1.5 + R() * 4, dec = [vtx[0] + dir[0] * lpi, vtx[1] - lpi, vtx[2] + dir[2] * lpi];
          tracks.push({ pts: [vtx, dec], t0: 0.95, t1: 0.95 + lpi * 0.12, color: qcol(q), headSize: 0.45, opacity: 0.85, fadeAfter: 3, fadeTo: 0.3 });
          var tm = 0.95 + lpi * 0.12, mdir = [dir[0] + (R() - 0.5) * 0.06, -1, dir[2] + (R() - 0.5) * 0.06], h = dec[1];
          var g = [dec[0] + mdir[0] * h, 0, dec[2] + mdir[2] * h];
          tracks.push({ pts: [dec, g], t0: tm, t1: tm + h * 0.11, color: qcol(q), headSize: 0.5, opacity: 0.95 });
          tracks.push({ pts: [dec, [dec[0] - mdir[0] * 0.2 + (R() - 0.5) * 0.4, 0, dec[2] + (R() - 0.5) * 0.4]], t0: tm, t1: tm + h * 0.11, color: C.neu, opacity: 0.25, dashed: true, dash: 0.15, gap: 0.25, head: false });
          hits.push({ pos: dec, t: tm, color: '#ffffff', size: 0.9, steady: 0, decay: 4 });
          hits.push({ pos: g, t: tm + h * 0.11, color: C.hit, size: 1.1, steady: 0.4, decay: 2 });
          nMu++;
        }
        return {
          dur: 3.4, tracks: tracks, hits: hits,
          hud: function (t) {
            return bi({ en: 'cosmic proton → pions → muons', zh: '宇宙线质子 → π 介子 → 缪子' }) + '<br>' +
              '<span class="pos">p</span> · <span class="pos">π⁺ μ⁺</span> · <span class="neg">π⁻ μ⁻</span> · <span class="neu">π⁰→γγ, ν</span><br>' +
              '<span class="m">' + bi({ en: 'muons reaching the ground', zh: '到达地面的缪子' }) + '</span> <b>' + (t > 2.2 ? nMu : '…') + '</b>';
          }
        };
      }
    });
  })();

  /* ================================================================ week 1: two-layer telescope */
  (function () {
    var R = EVD.rng(21), L = 0.3, D = 0.5;
    EVD.scene('w01', {
      tag: TOY, camera: { pos: [1.15, 0.75, 1.35], target: [0, 0.2, 0], fov: 34, fitWidth: 1.4 }, autoRotate: 0.5,
      build: function (A, S) {
        A.box([0, D, 0], [L, 0.012, L], { color: C.detHi, opacity: 0.8, fillOpacity: 0.08 });
        A.box([0, 0, 0], [L, 0.012, L], { color: C.detHi, opacity: 0.8, fillOpacity: 0.08 });
        A.label([L / 2 + 0.13, D, 0], { en: 'upper layer 30 × 30 cm', zh: '上层 30 × 30 cm' });
        A.label([L / 2 + 0.13, 0, 0], { en: 'lower layer', zh: '下层' });
        A.line([[-L / 2 - 0.05, 0, L / 2 + 0.05], [-L / 2 - 0.05, D, L / 2 + 0.05]], { color: C.mute, opacity: 0.6 });
        A.label([-L / 2 - 0.12, D / 2, L / 2 + 0.05], 'd = 50 cm');
        S.N = 0; S.k = 0;
      },
      event: function (i, A, S) {
        var tracks = [], hits = [], N = 8;
        for (var r = 0; r < N; r++) {
          var c = R(), th = Math.acos(c), ph = 2 * Math.PI * R();   // the Week 1 model: cos(theta) uniform
          var x0 = (R() - 0.5) * L, z0 = (R() - 0.5) * L;
          var dx = Math.tan(th) * Math.cos(ph), dz = Math.tan(th) * Math.sin(ph);
          var x1 = x0 + D * dx, z1 = z0 + D * dz, ok = Math.abs(x1) < L / 2 && Math.abs(z1) < L / 2;
          var nrm = Math.hypot(dx, 1, dz), dir = [dx / nrm, -1 / nrm, dz / nrm], p1 = [x0, D, z0];
          var start = [p1[0] - dir[0] * 0.45, p1[1] - dir[1] * 0.45, p1[2] - dir[2] * 0.45];
          var lLow = D * nrm, lTail = Math.min(lLow + 0.25, ok ? lLow + 0.25 : 0.9), end = [p1[0] + dir[0] * lTail, p1[1] + dir[1] * lTail, p1[2] + dir[2] * lTail];
          var q = R() < 0.56 ? 1 : -1, t0 = r * 0.42, tot = 0.45 + lTail, dur = 0.8;
          tracks.push({ pts: [start, p1, end], t0: t0, t1: t0 + dur, color: qcol(q), headSize: 0.05, opacity: ok ? 0.95 : 0.4, fadeAfter: t0 + 1.4, fadeTo: ok ? 0.35 : 0.08 });
          hits.push({ pos: p1, t: t0 + dur * 0.45 / tot, color: C.hit, size: 0.07, steady: 0.25 });
          if (ok) hits.push({ pos: [x1, 0, z1], t: t0 + dur * (0.45 + lLow) / tot, color: C.hit, size: 0.09, steady: 0.35 });
          S.N++; if (ok) S.k++;
        }
        return {
          dur: N * 0.42 + 0.9, tracks: tracks, hits: hits,
          hud: function () {
            var e = S.k / Math.max(1, S.N), s = Math.sqrt(e * (1 - e) / Math.max(1, S.N));
            return bi({ en: 'rays entering the upper layer', zh: '进入上层的径迹' }) + '<br><span class="m">N</span> ' + S.N + ' · <span class="m">' + bi({ en: 'crossed both', zh: '穿过两层' }) + '</span> <b>' + S.k + '</b><br>ε = ' + fmt(e, 3) + ' ± ' + fmt(s, 3) + '  <span class="m">(1/√N)</span>';
          }
        };
      }
    });
  })();

  /* ================================================================ week 2: real Geant4 pion events */
  (function () {
    var NAMES = { 'pi-': ['π⁻', -1], 'mu-': ['μ⁻', -1], 'mu+': ['μ⁺', 1], 'anti_nu_mu': ['ν̄μ', 0], 'nu_mu': ['νμ', 0], 'e-': ['e⁻', -1], 'gamma': ['γ', 0] };
    EVD.scene('w02', {
      tag: DATA, camera: { pos: [3.4, 1.7, 2.4], target: [0, 0, 0.2], fov: 34, fitWidth: 3.4 }, autoRotate: 0.4,
      build: function (A) {
        A.box([0, 0, 0], [3, 3, 3], { color: C.det, opacity: 0.25, fill: false });
        A.label([0, 1.62, 0], { en: 'world: 3 m cube, empty', zh: 'world：3 m 立方体，空' });
        A.sprite([0, 0, -1], 0.08, C.mute);
        A.label([0, -0.16, -1], { en: 'gun, z = −1 m', zh: '粒子枪 z = −1 m' });
        A.arrow([0, 0, -1.4], [0, 0, 1], 0.35, { color: C.mute });
      },
      event: function (i, A) {
        var ev = window.EVD_DATA.w02[i % window.EVD_DATA.w02.length], tracks = [], hits = [], lines = [];
        var byId = {}; ev.forEach(function (t) { byId[t.id] = t; });
        var tEnd = {};
        ev.forEach(function (t) {
          var nm = NAMES[t.p] || [t.p, 0], pts = t.xyz.map(function (p) { return [p[0] / 1000, p[1] / 1000, p[2] / 1000]; });
          var len = 0; for (var k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
          var t0 = t.par ? (tEnd[t.par] || 0) : 0, t1 = t0 + len * 0.7;
          tEnd[t.id] = t1;
          tracks.push({ pts: pts, t0: t0, t1: t1, color: qcol(nm[1]), dashed: nm[1] === 0, dash: 0.05, gap: 0.04, opacity: nm[1] === 0 ? 0.55 : 0.95, headSize: nm[1] === 0 ? 0.04 : 0.09, headColor: nm[1] === 0 ? C.neu : '#ffffff' });
          if (t.end === 'Decay') hits.push({ pos: pts[pts.length - 1], t: t1, color: '#ffffff', size: 0.12, steady: 0.3, decay: 3 });
          lines.push('<span class="' + (nm[1] < 0 ? 'neg' : nm[1] > 0 ? 'pos' : 'neu') + '">' + nm[0] + '</span> <span class="m">' + bi({ en: 'ends by', zh: '终止于' }) + '</span> ' + t.end + (t.end === 'Decay' ? ' <span class="m">z =</span> ' + fmt(t.xyz[t.xyz.length - 1][2] / 1000, 2) + ' m' : ''));
        });
        var dur = 0; Object.keys(tEnd).forEach(function (k) { dur = Math.max(dur, tEnd[k]); });
        return { dur: dur + 0.2, tracks: tracks, hits: hits,
          hud: function () { return bi({ en: 'event', zh: '事例' }) + ' <b>' + (i % window.EVD_DATA.w02.length + 1) + '</b> · π⁻ 100 MeV<br>' + lines.join('<br>'); } };
      }
    });
  })();

  /* ================================================================ week 3: real steps in lead */
  (function () {
    var PC = { muIoni: C.pos, msc: C.neu, Transportation: '#C9D2D8', eIoni: C.neg, eBrem: C.hit, CoupledTransportation: '#C9D2D8' };
    EVD.scene('w03', {
      tag: DATA, camera: { pos: [16, 7, 11], target: [0, 0, 0], fov: 34, fitWidth: 26 }, autoRotate: 0.45, bloom: { strength: 0.45, radius: 0.3, threshold: 0.4 },
      build: function (A) {
        A.box([0, 0, 0], [10, 10, 10], { color: C.detHi, opacity: 0.5, fillOpacity: 0.025 });
        A.label([0, 5.9, 0], { en: 'G4_Pb block, 10 cm', zh: 'G4_Pb 铅块，10 cm' });
        A.line([[0, 0, -14], [0, 0, -6.5]], { color: C.mute, opacity: 0.25, dashed: true, dash: 0.4, gap: 0.3 });
        A.label([0, -1.2, -12], { en: 'μ⁻ 1 GeV →', zh: 'μ⁻ 1 GeV →' }, 'neg');
      },
      event: function (i, A) {
        var ev = window.EVD_DATA.w03[i % window.EVD_DATA.w03.length], tracks = [], hits = [], count = {};
        var mu = ev['1'].filter(function (s) { return s[1] > -14 && s[1] < 14; });
        var pts = [[0, 0, -14]].concat(mu.map(function (s) { return [s[0], 0, s[1]]; }));
        var zEnd = pts[pts.length - 1][2], T = function (z) { return 0.15 + (z + 14) / 28 * 2.2; };
        tracks.push({ pts: pts, t0: T(-14), t1: T(zEnd), color: C.neg, headSize: 0.9, samples: 300 });
        mu.forEach(function (s) {
          var inside = s[1] > -5.001 && s[1] < 5.001;
          if (inside) count[s[2]] = (count[s[2]] || 0) + 1;
          hits.push({ pos: [s[0], 0, s[1]], t: T(s[1]), color: PC[s[2]] || C.hit, size: 0.22, steady: 0.5, decay: 4 });
        });
        var nsec = 0;
        Object.keys(ev).forEach(function (id) {
          if (id === '1') return;
          var sp = ev[id]; if (!sp.length) return;
          var first = sp[0], best = mu[0] || [0, -5];
          mu.forEach(function (s) { if (s[1] <= first[1] + 0.01 && s[1] > best[1]) best = s; });
          var tt = T(best[1]), path = [[best[0], 0, best[1]]].concat(sp.map(function (s) { return [s[0], 0, s[1]]; }));
          tracks.push({ pts: path, t0: tt, t1: tt + 0.35, color: C.neg, opacity: 0.7, headSize: 0.4 });
          sp.forEach(function (s, k) { hits.push({ pos: path[k + 1], t: tt + 0.35, color: PC[s[2]] || C.hit, size: 0.22, steady: 0.45 }); });
          nsec++;
        });
        var keys = Object.keys(count);
        return { dur: T(zEnd) + 0.6, tracks: tracks, hits: hits,
          hud: function () {
            return bi({ en: 'event', zh: '事例' }) + ' <b>' + (i % window.EVD_DATA.w03.length + 1) + '</b> · ' + bi({ en: 'steps in the block, by process that ended them', zh: '块内各步，按结束它的过程着色' }) + '<br>' +
              keys.map(function (k) { return '<span style="color:' + (PC[k] || C.hit) + '">●</span> ' + k + ' ' + count[k]; }).join(' · ') + '<br>' +
              '<span class="m">' + bi({ en: 'secondary electrons (δ-rays)', zh: '次级电子（δ 电子）' }) + '</span> <b>' + nsec + '</b>';
          } };
      }
    });
  })();

  /* ================================================================ week 5: scintillator, light, trigger */
  (function () {
    var R = EVD.rng(55);
    function pulseSvg(a, b, ta, tb, fired, coin) {
      function path(amp, t0, y0) {
        var d = 'M0 ' + y0; for (var k = 0; k <= 60; k++) { var t = k / 60 * 100, v = t < t0 ? 0 : amp * Math.exp(-(t - t0) / 9) * (1 - Math.exp(-(t - t0) / 1.5)); d += ' L' + (t * 1.8).toFixed(1) + ' ' + (y0 - v * 22).toFixed(1); }
        return d;
      }
      return '<svg width="190" height="70" viewBox="0 0 190 70" style="display:block;margin-top:4px">' +
        '<line x1="0" x2="180" y1="' + (30 - 0.25 * 22) + '" y2="' + (30 - 0.25 * 22) + '" stroke="#8FA0AC" stroke-dasharray="3 3" stroke-width="0.8"/>' +
        '<line x1="0" x2="180" y1="' + (64 - 0.25 * 22) + '" y2="' + (64 - 0.25 * 22) + '" stroke="#8FA0AC" stroke-dasharray="3 3" stroke-width="0.8"/>' +
        (coin ? '<rect x="' + (Math.min(ta, tb) * 1.8 - 4) + '" y="2" width="36" height="66" fill="#4FC98A" opacity="0.15"/>' : '') +
        '<path d="' + path(a, ta, 30) + '" fill="none" stroke="#F2D06B" stroke-width="1.4"/>' +
        '<path d="' + path(b, tb, 64) + '" fill="none" stroke="#F2D06B" stroke-width="1.4"/>' +
        '<text x="182" y="28" fill="#8FA0AC" font-size="9">A</text><text x="182" y="62" fill="#8FA0AC" font-size="9">B</text></svg>';
    }
    EVD.scene('w05', {
      tag: TOY, camera: { pos: [46, 18, 50], target: [0, 4, 0], fov: 34, fitWidth: 60 }, autoRotate: 0.45,
      build: function (A, S) {
        [10, -10].forEach(function (y, k) {
          A.box([0, y, 0], [10, 1, 10], { color: C.detHi, opacity: 0.7, fillOpacity: 0.08 });
          A.box([5.6, y, 0], [1.2, 1.2, 1.2], { color: C.mute, opacity: 0.8, fillOpacity: 0.2 });
          A.label([-9, y, 0], k ? { en: 'counter B', zh: '计数器 B' } : { en: 'counter A', zh: '计数器 A' });
        });
        A.label([8.2, 11.6, 0], 'SiPM');
        A.box([0, 20, 0], [30, 0.05, 30], { color: C.det, opacity: 0.25, fill: false });
        A.label([16, 20, 0], { en: 'source plane 30 × 30 cm', zh: '源平面 30 × 30 cm' });
        S.N = 0; S.a = 0; S.b = 0; S.trig = 0;
      },
      event: function (i, A, S) {
        var tracks = [], hits = [], c, th, ph, x0, z0, dx, dz, k = 0, want = R() < 0.8;   // 80%: show a muon through counter A
        do { c = Math.pow(R(), 0.25); th = Math.acos(c); ph = 2 * Math.PI * R(); x0 = (R() - 0.5) * 30; z0 = (R() - 0.5) * 30; dx = Math.tan(th) * Math.cos(ph); dz = Math.tan(th) * Math.sin(ph); k++; }
        while (want && k < 400 && !(Math.abs(x0 + 10 * dx) < 5 && Math.abs(z0 + 10 * dz) < 5));
        var hitA = Math.abs(x0 + 10 * dx) < 5 && Math.abs(z0 + 10 * dz) < 5, hitB = Math.abs(x0 + 30 * dx) < 5 && Math.abs(z0 + 30 * dz) < 5;
        var end = [x0 + 45 * dx, 20 - 45, z0 + 45 * dz], q = R() < 0.56 ? 1 : -1;
        tracks.push({ pts: [[x0, 20, z0], end], t0: 0, t1: 1.3, color: qcol(q), headSize: 1.6 });
        var tA = 1.3 * 10 / 45, tB = 1.3 * 30 / 45, ampA = 0, ampB = 0;
        function light(p, t, y) {
          hits.push({ pos: [0, y, 0], box: [10.2, 1.2, 10.2], t: t, color: C.hit, steady: 0.05, decay: 2.5, fillMax: 0.35 });
          for (var n = 0; n < 7; n++) {
            var tgt = [5.4, y + (R() - 0.5) * 0.8, (R() - 0.5) * 1];
            var mid = [p[0] + (R() - 0.5) * 6, y + (R() - 0.5) * 0.8, p[2] + (R() - 0.5) * 6];
            mid[0] = Math.max(-5, Math.min(5, mid[0])); mid[2] = Math.max(-5, Math.min(5, mid[2]));
            tracks.push({ pts: [p, mid, tgt], t0: t, t1: t + 0.35 + R() * 0.2, color: C.neu, opacity: 0.6, headSize: 0.5, headColor: C.neu, fadeAfter: t + 0.9, fadeTo: 0 });
          }
          hits.push({ pos: [5.6, y, 0], box: [1.4, 1.4, 1.4], t: t + 0.45, color: C.hit, steady: 0.2, decay: 2 });
        }
        if (hitA) { light([x0 + 10 * dx, 10, z0 + 10 * dz], tA, 10); ampA = (0.7 + 0.5 * R()) / c; }
        if (hitB) { light([x0 + 30 * dx, -10, z0 + 30 * dz], tB, -10); ampB = (0.7 + 0.5 * R()) / c; }
        if (!hitA && R() < 0.3) ampA = 0.3 + 0.2 * R();   // a random noise pulse
        var fa = ampA > 0.25, fb = ampB > 0.25;
        var ta = hitA ? 20 : 20 + R() * 60, tb = hitB ? 21 : 25 + R() * 60, trig = fa && fb && Math.abs(ta - tb) < 15;   // 15 ns window in this toy
        S.N++; if (fa) S.a++; if (fb) S.b++; if (trig) S.trig++;
        return { dur: 2.1, tracks: tracks, hits: hits,
          hud: function (t) {
            var show = t > 1.4;
            return bi({ en: 'muon → light → SiPM → pulse → trigger', zh: '缪子 → 光 → SiPM → 脉冲 → 触发' }) + '<br>' +
              '<span class="m">A</span> ' + (show ? (fa ? '<b>' + bi({ en: 'fired', zh: '响应' }) + '</b>' : '–') : '…') + ' · <span class="m">B</span> ' + (show ? (fb ? '<b>' + bi({ en: 'fired', zh: '响应' }) + '</b>' : '–') : '…') +
              ' · <span class="m">' + bi({ en: 'coincidence', zh: '符合' }) + '</span> ' + (show ? (trig ? '<span class="neu">' + bi({ en: 'YES', zh: '是' }) + '</span>' : bi({ en: 'no', zh: '否' })) : '…') +
              (show ? pulseSvg(ampA, ampB, ta, tb, fa && fb, trig) : '<br>') +
              '<span class="m">' + bi({ en: 'events', zh: '事例' }) + '</span> ' + S.N + ' · <span class="m">' + bi({ en: 'triggers', zh: '触发' }) + '</span> <b>' + S.trig + '</b>';
          } };
      }
    });
  })();

  /* ================================================================ week 7: real spectrometer hits */
  (function () {
    var KEYS = ['01', '02', '05', '10', '20'], ZM = 0.5, B = 1.5;
    function fitLine(z, x) { var n = z.length, sz = 0, sx = 0, szz = 0, szx = 0; for (var k = 0; k < n; k++) { sz += z[k]; sx += x[k]; szz += z[k] * z[k]; szx += z[k] * x[k]; } var b = (n * szx - sz * sx) / (n * szz - sz * sz); return { b: b, a: (sx - b * sz) / n }; }
    EVD.scene('w07', {
      tag: DATA, camera: { pos: [2.8, 1.5, 1.6], target: [0, 0, 0], fov: 36, fitWidth: 3.0 }, autoRotate: 0.35,
      build: function (A) {
        [-1, -0.8, -0.6, 0.6, 0.8, 1].forEach(function (z) { A.box([0, 0, z], [1, 1, 0.006], { color: C.detHi, opacity: 0.55, fillOpacity: 0.05 }); });
        A.box([0, 0, 0], [1, 1, 1], { color: C.pos, opacity: 0.35, fillOpacity: 0.04 });
        for (var x = -0.3; x <= 0.31; x += 0.3) for (var z = -0.3; z <= 0.31; z += 0.3) A.arrow([x, -0.35, z], [0, 1, 0], 0.5, { color: C.pos, opacity: 0.35 });
        A.label([0, 0.62, 0], { en: 'magnet 1 m, B = 1.5 T ↑', zh: '磁铁 1 m，B = 1.5 T ↑' }, 'pos');
        A.label([0, 0.6, -0.8], { en: 'tracker 1', zh: '径迹室 1' });
        A.label([0, 0.6, 0.8], { en: 'tracker 2', zh: '径迹室 2' });
      },
      event: function (i, A) {
        var key = KEYS[i % KEYS.length], rows = window.EVD_DATA.w07[key], r = rows[Math.floor(i / KEYS.length) % rows.length];
        var p = r[0], xs = r.slice(1, 7).map(function (v) { return v / 1000; }), zs = r.slice(7, 13).map(function (v) { return v / 1000; });
        var L1 = fitLine(zs.slice(0, 3), xs.slice(0, 3)), L2 = fitLine(zs.slice(3), xs.slice(3));
        var pin = [L1.a + L1.b * -ZM, -ZM], pout = [L2.a + L2.b * ZM, ZM];
        var pts = [[L1.a + L1.b * -1.2, 0, -1.2]];
        for (var k = 0; k <= 30; k++) {   // path inside the magnet: cubic Hermite between the two measured lines
          var s = k / 30, h00 = 2 * s * s * s - 3 * s * s + 1, h10 = s * s * s - 2 * s * s + s, h01 = -2 * s * s * s + 3 * s * s, h11 = s * s * s - s * s;
          pts.push([h00 * pin[0] + h10 * L1.b * 1 + h01 * pout[0] + h11 * L2.b * 1, 0, -ZM + s]);
        }
        pts.push([L2.a + L2.b * 1.25, 0, 1.25]);
        var s1 = L1.b / Math.hypot(1, L1.b), s2 = L2.b / Math.hypot(1, L2.b), prec = 0.299792458 * B * 2 * ZM / Math.abs(s2 - s1);
        var tracks = [{ pts: pts, t0: 0, t1: 1.8, color: C.neg, headSize: 0.08, samples: 220 }];
        var hits = xs.map(function (x, k) { return { pos: [x, 0, zs[k]], t: 1.8 * (zs[k] + 1.2) / 2.45, color: C.hit, size: 0.09, steady: 0.6 }; });
        return { dur: 2.3, hold: 1.4, tracks: tracks, hits: hits,
          hud: function (t) {
            return bi({ en: 'μ⁻, true p', zh: 'μ⁻，真实 p' }) + ' <b>' + fmt(p, 2) + ' GeV/c</b><br>' +
              '<span class="m">' + bi({ en: 'six plane crossings (Geant4)', zh: '六个平面的穿越点（Geant4）' }) + '</span><br>' +
              (t > 1.8 ? bi({ en: 'two-line reconstruction', zh: '两直线重建' }) + ': p = <b>' + fmt(prec, 2) + '</b> GeV/c <span class="m">(' + (prec / p - 1 >= 0 ? '+' : '') + fmt(100 * (prec / p - 1), 1) + '%)</span>' : '…');
          } };
      }
    });
  })();

  /* ================================================================ week 10: TF-muSR */
  (function () {
    var R = EVD.rng(101), TAU = 2.197, F = 1.3554, US = 1.1;   // animation seconds per microsecond
    function inBox(p, c, h) { return Math.abs(p[0] - c[0]) < h[0] && Math.abs(p[1] - c[1]) < h[1] && Math.abs(p[2] - c[2]) < h[2]; }
    EVD.scene('w10', {
      tag: TOY, camera: { pos: [150, 70, 120], target: [0, 0, -10], fov: 36, fitWidth: 210 }, autoRotate: 0.3,
      build: function (A, S) {
        A.box([0, 0, 0], [30, 30, 6], { color: C.detHi, opacity: 0.7, fillOpacity: 0.1 });
        A.box([0, 45, 0], [80, 6, 80], { color: C.pos, opacity: 0.55, fillOpacity: 0.05 });
        A.box([0, -45, 0], [80, 6, 80], { color: C.neg, opacity: 0.55, fillOpacity: 0.05 });
        A.label([0, 56, 0], { en: 'counter U · ID 11', zh: '计数器 U · ID 11' }, 'pos');
        A.label([0, -56, 0], { en: 'counter D · ID 1', zh: '计数器 D · ID 1' }, 'neg');
        A.label([22, 12, 0], { en: 'Cu target', zh: '铜靶' });
        [-30, 30].forEach(function (y) { A.arrow([-60, y * 0.5, 30], [1, 0, 0], 30, { color: C.mute, opacity: 0.45 }); });
        A.label([-36, 22, 30], 'B = 10 mT → x');
        S.U = 0; S.D = 0; S.hU = new Array(16).fill(0); S.hD = new Array(16).fill(0);
        S.spin = A.arrow([0, 0, -2.8], [0, 0, -1], 22, { color: '#ffffff', opacity: 0.95, head: 6, headW: 4 });
        S.spin.visible = false;
      },
      event: function (i, A, S) {
        var td = -TAU * Math.log(1 - R() * 0.93), stopZ = -2.9;
        var tStop = 0.9, tDec = tStop + td * US, w = 2 * Math.PI * F;
        var sy = -Math.sin(w * td), sz = -Math.cos(w * td), n;
        do { var cz = 2 * R() - 1, s = Math.sqrt(1 - cz * cz), ph = 2 * Math.PI * R(); n = [s * Math.cos(ph), s * Math.sin(ph), cz]; }
        while (R() * (4 / 3) > 1 + (1 / 3) * (sy * n[1] + sz * n[2]));
        var o = [(R() - 0.5) * 6, (R() - 0.5) * 6, stopZ], end = [o[0] + 130 * n[0], o[1] + 130 * n[1], o[2] + 130 * n[2]];
        var hitU = null, hitD = null;
        for (var k = 1; k <= 260; k++) { var p = [o[0] + n[0] * k * 0.5, o[1] + n[1] * k * 0.5, o[2] + n[2] * k * 0.5]; if (!hitU && inBox(p, [0, 45, 0], [40, 3, 40])) hitU = { p: p, f: k / 260 }; if (!hitD && inBox(p, [0, -45, 0], [40, 3, 40])) hitD = { p: p, f: k / 260 }; }
        var tracks = [{ pts: [[o[0], o[1], -90], o], t0: 0, t1: tStop, color: C.pos, headSize: 4 },
          { pts: [o, end], t0: tDec, t1: tDec + 0.5, color: C.pos, headSize: 3.5, opacity: 0.9 }];
        var hits = [{ pos: o, t: tDec, color: '#ffffff', size: 5, steady: 0, decay: 3 }];
        if (hitU) hits.push({ pos: [0, 45, 0], box: [80.5, 6.5, 80.5], t: tDec + 0.5 * hitU.f, color: C.pos, steady: 0.05, decay: 2, fillMax: 0.35 });
        if (hitD) hits.push({ pos: [0, -45, 0], box: [80.5, 6.5, 80.5], t: tDec + 0.5 * hitD.f, color: C.neg, steady: 0.05, decay: 2, fillMax: 0.35 });
        var counted = false, bin = Math.min(15, Math.floor(td / 0.4));
        return { dur: tDec + 0.7, hold: 0.9, tracks: tracks, hits: hits,
          update: function (t) {
            var sp = S.spin; sp.visible = t >= tStop && t < tDec; sp.position.set(o[0], o[1], o[2]);
            var tu = Math.max(0, Math.min(td, (t - tStop) / US));
            if (sp.visible) sp.setDirection(new A.THREE.Vector3(0, -Math.sin(w * tu), -Math.cos(w * tu)));
            if (!counted && t > tDec + 0.5) { counted = true; if (hitU) { S.U++; S.hU[bin]++; } if (hitD) { S.D++; S.hD[bin]++; } }
          },
          hud: function (t) {
            var tu = Math.max(0, Math.min(td, (t - tStop) / US)), bars = '';
            for (var b = 0; b < 16; b++) { var tot = S.hU[b] + S.hD[b], a = tot ? (S.hD[b] - S.hU[b]) / tot : 0, h = Math.round(Math.abs(a) * 22); bars += '<rect x="' + (b * 11) + '" y="' + (a > 0 ? 26 - h : 26) + '" width="8" height="' + Math.max(1, h) + '" fill="' + (a > 0 ? '#FF6369' : '#7393FF') + '" opacity="' + (tot ? 0.85 : 0.2) + '"/>'; }
            var curve = 'M0 26'; for (var x = 0; x <= 176; x += 2) { var tt = x / 11 * 0.4; curve += ' L' + x + ' ' + (26 - 22 * 0.26 * Math.sin(w * tt)).toFixed(1); }
            return bi({ en: 'μ⁺ stops, spin precesses, e⁺ remembers', zh: 'μ⁺ 停下，自旋进动，e⁺ 记住方向' }) + '<br>' +
              '<span class="m">t</span> ' + (t < tStop ? '–' : '<b>' + fmt(t < tDec ? tu : td, 2) + ' µs</b>') + ' · <span class="m">' + bi({ en: 'spin turned', zh: '自旋转过' }) + '</span> ' + (t < tStop ? '–' : fmt((w * tu * 180 / Math.PI) % 360, 0) + '°') + '<br>' +
              '<span class="pos">U ' + S.U + '</span> · <span class="neg">D ' + S.D + '</span> <span class="m">· A(t) = (D−U)/(D+U)</span>' +
              '<svg width="180" height="54" viewBox="0 0 180 54" style="display:block;margin-top:4px"><line x1="0" x2="176" y1="26" y2="26" stroke="#5B7690" stroke-width="0.6"/>' + bars + '<path d="' + curve + '" fill="none" stroke="#4FC98A" stroke-width="0.9" stroke-dasharray="2 2"/><text x="0" y="52" fill="#8FA0AC" font-size="8">0</text><text x="150" y="52" fill="#8FA0AC" font-size="8">6.4 µs</text></svg>';
          } };
      }
    });
  })();
})();
