/* Week 02 — toy event-model explorer (Week 2).
   TOY MODEL, not Geant4: an empty (vacuum) world, so the primary meets no matter. Each primary
   flies straight along z until it either reaches the world boundary (Transportation) or decays
   (Decay) after a distance sampled from an exponential with mean λ = βγcτ. Masses and lifetimes are
   the values Geant4 11.4 prints with /particle/property/dump (PDG). Decay products are listed with the
   Geant4 decay table but are NOT transported; their drawn directions are random and only decorative.
   The vertex check mimics Geant4 11.4: /gun/position is refused outside the world once the run is
   initialised (Event0401); a position set in the C++ constructor is not checked. */
(function () {
  'use strict';
  var G = window.G4C, SEED = 20261019;
  var C_MM_PER_NS = 299.792458;
  var P = {
    'mu-':    { m: 105.6583755, tau: 2196.9811, q: -1, dk: ['e-', 'anti_nu_e', 'nu_mu'] },
    'mu+':    { m: 105.6583755, tau: 2196.9811, q: 1,  dk: ['e+', 'nu_e', 'anti_nu_mu'] },
    'pi-':    { m: 139.57039,   tau: 26.033,    q: -1, dk: ['mu-', 'anti_nu_mu'] },
    'pi+':    { m: 139.57039,   tau: 26.033,    q: 1,  dk: ['mu+', 'nu_mu'] },
    'proton': { m: 938.272088,  tau: Infinity,  q: 1,  dk: null },
    'e-':     { m: 0.51099895,  tau: Infinity,  q: -1, dk: null },
    'gamma':  { m: 0,           tau: Infinity,  q: 0,  dk: null }
  };
  function chargeOf(name) { if (/^nu|anti_nu|gamma/.test(name)) return 0; return /\+$/.test(name) ? 1 : -1; }

  var el = function (id) { return document.getElementById(id); };
  var cv = el('w2-display'), hc = el('w2-hist');
  var st;

  /* ---------- controls ---------- */
  function logSlider(id) { return Math.pow(10, +el(id).value); }
  function fmtLen(mm) { return mm >= 1e6 ? (mm / 1e6).toPrecision(3) + ' km' : mm >= 1000 ? (mm / 1000).toPrecision(3) + ' m' : mm.toPrecision(3) + ' mm'; }
  function fmtE(mev) { return mev >= 1000 ? +(mev / 1000).toPrecision(3) + ' GeV' : +mev.toPrecision(3) + ' MeV'; }
  function params() {
    return {
      name: el('w2-particle').value,
      T: logSlider('w2-T'),                 /* MeV */
      half: logSlider('w2-half') * 1000,    /* mm */
      zf: +el('w2-z').value,                /* vertex z in units of the half-length */
      dir: +el('w2-dir').value,
      how: el('w2-how').value               /* 'ctor' | 'gun' */
    };
  }
  function syncLabels() {
    var p = params();
    el('w2-T-out').textContent = fmtE(p.T);
    el('w2-half-out').textContent = fmtLen(p.half) + G.t(' half-length', ' 半长');
    el('w2-z-out').textContent = 'z = ' + fmtLen(Math.abs(p.zf * p.half)).replace(/^/, p.zf < 0 ? '−' : '');
  }
  function lambda(p) {
    var d = P[p.name];
    if (!isFinite(d.tau)) return Infinity;
    var gam = 1 + p.T / d.m, bg = Math.sqrt(gam * gam - 1);
    return bg * d.tau * C_MM_PER_NS;
  }

  function reset() {
    var p = params();
    st = { p: p, rng: G.rng(SEED), run: -1, events: 0, calls: 0, lengths: [], decays: 0, last: [], warn: null, z0: -2 / 3 * p.half, lam: lambda(p) };
    /* where is the gun? */
    var want = p.zf * p.half, inside = Math.abs(want) < p.half;
    if (p.how === 'gun' && !inside) {
      st.warn = 'Event0401';
      st.z0 = Math.max(-p.half * 0.999, Math.min(p.half * 0.999, -2 / 3 * p.half)); /* unchanged: constructor default inside */
    } else {
      st.z0 = want;
      st.warn = inside ? null : (want * p.dir > 0 ? 'outward' : 'inward');
    }
  }
  function distToBoundary() {
    var z = st.z0, h = st.p.half, d = st.p.dir;
    if (Math.abs(z) >= h) return (z * d > 0) ? 0 : Math.abs(z) + h; /* outside: outward -> 0; inward -> to far face */
    return d > 0 ? h - z : h + z;
  }
  function beamOn(n) {
    st.run++;
    var D = distToBoundary(), lam = st.lam, r = st.rng;
    for (var i = 0; i < n; i++) {
      st.calls++; st.events++;
      var s = isFinite(lam) ? -lam * Math.log(1 - r()) : Infinity;
      var dec = s < D, len = dec ? s : D;
      if (dec) st.decays++;
      st.lengths.push(dec ? len : -1);
      if (n - i <= 16) {
        var sec = dec ? P[st.p.name].dk.map(function (nm) { return { name: nm, a: r() * 2 * Math.PI }; }) : [];
        st.last.push({ id: i, len: len, dec: dec, sec: sec });
      }
    }
    if (st.last.length > 16) st.last = st.last.slice(-16);
    st.lastN = n;
  }

  /* ---------- C++ ostream-like number format: precision 3, %g style ---------- */
  function g3(v) {
    if (v === 0 || Math.abs(v) < 1e-12) return '0';
    var e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    if (e < -4 || e >= 3) {
      var m = v.toExponential(2).split('e'), mant = m[0].replace(/\.?0+$/, ''), ex = +m[1];
      return mant + 'e' + (ex < 0 ? '-' : '+') + (Math.abs(ex) < 10 ? '0' : '') + Math.abs(ex);
    }
    return v.toPrecision(3).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  function pad(s, w) { s = String(s); while (s.length < w) s = ' ' + s; return s; }
  function row(step, z, T, sl, tl, vol, proc) {
    return pad(step, 5) + pad('0', 9) + pad('0', 9) + pad(g3(z), 9) + pad(g3(T), 10) + pad('0', 9) + pad(g3(sl), 9) + pad(g3(tl), 10) + pad(vol, 12) + ' ' + proc;
  }
  var HDR = 'Step#    X(mm)    Y(mm)    Z(mm) KinE(MeV)  dE(MeV) StepLeng TrackLeng  NextVolume ProcName';
  var BAR = '*********************************************************************************************************';

  function verbose() {
    var ev = st.last[st.last.length - 1]; if (!ev) return '';
    var p = st.p, z1 = st.z0 + p.dir * ev.len;
    var out = BAR + '\n* G4Track Information:   Particle = ' + p.name + ',   Track ID = 1,   Parent ID = 0\n' + BAR + '\n\n' + HDR + '\n';
    out += row(0, st.z0, p.T, 0, 0, 'World', 'initStep') + '\n';
    out += row(1, z1, p.T, ev.len, ev.len, ev.dec ? 'World' : 'OutOfWorld', ev.dec ? 'Decay' : 'Transportation') + '\n';
    if (ev.dec) out += '\n<span class="c">// toy: the ' + ev.sec.length + ' secondaries are created here but not transported</span>';
    return out;
  }
  function tree() {
    var ev = st.last[st.last.length - 1]; if (!ev) return '';
    var p = st.p;
    var s = 'Run ' + st.run + '\n└─ Event ' + ev.id + (st.lastN > 1 ? '   <span class="c">(last of ' + st.lastN.toLocaleString('en') + ')</span>' : '') + '\n';
    var nT = 1 + ev.sec.length;
    s += '   ' + (nT > 1 ? '├' : '└') + '─ Track 1 · ' + p.name + ' · parent 0 · ' + G.t('1 step', '1 步') + ' → ' + (ev.dec ? 'Decay' : 'Transportation (OutOfWorld)') + '\n';
    s += '   ' + (nT > 1 ? '│' : ' ') + '    └─ Step 1 · ' + g3(ev.len) + ' mm\n';
    ev.sec.forEach(function (sc, i) {
      s += '   ' + (i === ev.sec.length - 1 ? '└' : '├') + '─ Track ' + (i + 2) + ' · ' + sc.name + ' · parent 1\n';
    });
    return s;
  }

  /* ---------- drawing ---------- */
  var RED = '#FF6369', BLUE = '#7393FF', GREEN = '#4FC98A', HIT = '#F2D06B', DFG = 'rgba(220,227,232,', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  function col(q) { return q < 0 ? RED : q > 0 ? BLUE : GREEN; }
  function drawDisplay() {
    var r = G.size(cv), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, h);
    var p = st.p, H = p.half;
    /* world box (side view z horizontal), plus margin to show an outside vertex */
    var span = Math.max(H, Math.abs(st.z0)) * 1.15;
    var sc = Math.min((w - 40) / (2 * span), (h - 60) / (2 * H) * 0.9);
    var cx = w / 2, cy = h / 2 + 6;
    x.strokeStyle = DFG + '0.45)'; x.lineWidth = 1;
    x.strokeRect(cx - H * sc + .5, cy - H * sc + .5, 2 * H * sc, 2 * H * sc);
    x.fillStyle = DFG + '0.5)'; x.font = '10px ' + MONO; x.textAlign = 'left';
    x.fillText('World · G4_Galactic · ' + fmtLen(2 * H) + G.t(' cube', ' 立方体'), cx - H * sc + 6, cy - H * sc + 14);
    x.textAlign = 'center'; x.fillText('z →', cx + H * sc - 16, cy + H * sc - 8);
    var zx = function (z) { return cx + z * sc; };
    st.last.forEach(function (ev, k) {
      var a = 0.25 + 0.75 * (k + 1) / st.last.length, z1 = st.z0 + p.dir * ev.len;
      x.globalAlpha = a;
      x.strokeStyle = col(P[p.name].q); x.lineWidth = k === st.last.length - 1 ? 2 : 1.2;
      var dy = 0;
      x.beginPath(); x.moveTo(zx(st.z0), cy + dy); x.lineTo(zx(z1), cy + dy); x.stroke();
      if (ev.dec) {
        ev.sec.forEach(function (sc2) {
          var q = chargeOf(sc2.name), L = 64;
          x.save(); x.strokeStyle = col(q); x.lineWidth = 1.5; if (q === 0) x.setLineDash([3, 3]);
          x.beginPath(); x.moveTo(zx(z1), cy + dy); x.lineTo(zx(z1) + L * Math.cos(sc2.a), cy + dy + L * Math.sin(sc2.a)); x.stroke(); x.restore();
        });
        x.fillStyle = HIT; x.beginPath(); x.arc(zx(z1), cy + dy, 2.5, 0, 2 * Math.PI); x.fill();
      }
    });
    x.globalAlpha = 1;
    /* gun */
    x.fillStyle = HIT; x.beginPath();
    var gx = zx(st.z0), d = p.dir;
    x.moveTo(gx - 8 * d, cy - 6); x.lineTo(gx, cy); x.lineTo(gx - 8 * d, cy + 6); x.closePath(); x.fill();
    x.fillStyle = DFG + '0.6)'; x.textAlign = 'center';
    x.fillText(G.t('gun', '粒子枪'), gx, cy - 12);
    if (st.warn) {
      x.fillStyle = '#E2B04A'; x.textAlign = 'left';
      var msg = st.warn === 'Event0401' ? G.t('Event0401: /gun/position refused, gun NOT moved', 'Event0401：/gun/position 被拒绝，枪位置未改变')
        : st.warn === 'outward' ? G.t('vertex outside world, pointing out: zero-length track', '顶点在世界外且朝外：零长度径迹')
        : G.t('vertex outside world (constructor, unchecked): track length includes the outside part', '顶点在世界外（构造函数，未检查）：径迹长度包含世界外部分');
      x.fillText(msg, 12, h - 12);
    }
    el('w2-runlabel').textContent = 'Run ' + Math.max(0, st.run) + ' · ' + st.events.toLocaleString('en') + G.t(' events', ' 个事件');
  }
  function drawHist() {
    var D = distToBoundary(), nb = 20, bins = new Array(nb).fill(0), esc = 0, sum = 0, n = 0, lam = st.lam;
    st.lengths.forEach(function (l) {
      if (l < 0) { esc++; return; }
      var b = Math.floor(l / D * nb); if (b >= nb) b = nb - 1; bins[b]++; sum += l; n++;
    });
    var N = st.lengths.length, bw = D / nb;
    var unit = D >= 1e6 ? 1e6 : D >= 1000 ? 1000 : 1, uname = unit === 1e6 ? 'km' : unit === 1000 ? 'm' : 'mm';
    G.hist(hc, {
      bins: bins, lo: 0, hi: D / unit, name: 'decayLength',
      xlabel: G.t('distance to decay [' + uname + ']', '衰变前飞行距离 [' + uname + ']'),
      ylabel: G.t('decays / bin', '衰变数 / bin'),
      stats: [['Entries', String(N)], ['Mean', n ? (sum / n / unit).toPrecision(3) : '0'], ['Overflow', String(esc)]],
      curve: isFinite(lam) && D > 0 ? function (xv) { var x0 = xv * unit; return N * (Math.exp(-(x0 - bw / 2) / lam) - Math.exp(-(x0 + bw / 2) / lam)); } : null,
      curveLabel: G.t('exp(−x/λ) prediction', 'exp(−x/λ) 预言')
    });
    var pred = isFinite(lam) ? 1 - Math.exp(-D / lam) : 0, f = N ? st.decays / N : 0, s = N ? Math.sqrt(Math.max(f * (1 - f), 1e-12) / N) : 0;
    var d = P[st.p.name], gam = 1 + st.p.T / Math.max(d.m, 1e-9), bg = d.m > 0 ? Math.sqrt(gam * gam - 1) : Infinity;
    el('w2-bg').textContent = d.m > 0 ? bg.toPrecision(4) : '∞ (massless)';
    el('w2-lam').textContent = isFinite(lam) ? fmtLen(lam) : G.t('∞ (stable)', '∞（稳定）');
    el('w2-D').textContent = fmtLen(D);
    el('w2-pred').textContent = isFinite(lam) ? (pred < 1e-3 ? pred.toExponential(2) : pred.toFixed(4)) : '0';
    el('w2-meas').textContent = N ? f.toFixed(4) + ' ± ' + s.toFixed(4) : '—';
    el('w2-calls').textContent = st.calls.toLocaleString('en');
    var pull = s > 0 && N && isFinite(lam) ? (f - pred) / s : NaN;
    el('w2-pull').textContent = isFinite(pull) ? (pull >= 0 ? '+' : '') + pull.toFixed(2) + ' σ' : '—';
  }
  function drawText() { el('w2-verbose').innerHTML = verbose(); el('w2-tree').innerHTML = tree(); }
  function drawAll() { drawDisplay(); drawHist(); drawText(); }
  G.onRedraw(drawAll);

  /* ---------- wiring ---------- */
  function restart() { syncLabels(); reset(); beamOn(1); drawAll(); }
  ['w2-T', 'w2-half', 'w2-z'].forEach(function (id) { el(id).addEventListener('input', syncLabels); el(id).addEventListener('change', restart); });
  ['w2-particle', 'w2-dir', 'w2-how'].forEach(function (id) { el(id).addEventListener('change', restart); });
  el('w2-b1').addEventListener('click', function () { beamOn(1); drawAll(); });
  el('w2-b100').addEventListener('click', function () { beamOn(100); drawAll(); });
  el('w2-b10k').addEventListener('click', function () { beamOn(10000); drawAll(); });
  el('w2-reset').addEventListener('click', restart);
  el('w2-preset-pi').addEventListener('click', function () {
    el('w2-particle').value = 'pi-'; el('w2-T').value = 2; el('w2-half').value = Math.log10(1.5); el('w2-z').value = -0.6667; el('w2-dir').value = 1; el('w2-how').value = 'ctor';
    restart(); beamOn(999); drawAll();
  });
  function fillHow() {
    var v = el('w2-how').value || 'ctor';
    el('w2-how').innerHTML = '<option value="ctor">' + G.t('C++ constructor (not checked)', 'C++ 构造函数（不检查）') + '</option><option value="gun">' + G.t('/gun/position after init (checked)', '初始化后 /gun/position（检查）') + '</option>';
    el('w2-how').value = v;
    var dv = el('w2-dir').value || '1';
    el('w2-dir').innerHTML = '<option value="1">+z ' + G.t('(toward the far wall)', '（射向远端）') + '</option><option value="-1">−z ' + G.t('(reversed)', '（反向）') + '</option>';
    el('w2-dir').value = dv;
  }
  fillHow(); window.addEventListener('g4c:lang', fillHow);
  restart();

  /* ---------- self-check ---------- */
  G.quiz(el('quiz'), 'w02', [
    { prompt: { en: 'A macro runs <code>/run/beamOn 100</code>. How many times is <code>GeneratePrimaries()</code> called?', zh: '宏执行 <code>/run/beamOn 100</code>，<code>GeneratePrimaries()</code> 被调用几次？' },
      opts: [{ en: 'Once, at the start of the run', zh: '一次，在运行开始时' }, { en: '100 times, once per event', zh: '100 次，每个事件一次' }, { en: 'Once per step', zh: '每一步一次' }, { en: 'Zero: the constructor already fired the particle', zh: '零次：构造函数已经发射了粒子' }],
      a: 1, why: { en: 'GeneratePrimaries is called once per Event and creates that event\'s primary vertex. The constructor runs once and only sets up the gun. To vary energy or position event by event, change them inside GeneratePrimaries.', zh: 'GeneratePrimaries 每个事件调用一次，用来产生该事件的初级顶点。构造函数只运行一次，只负责配置粒子枪。要让能量或位置逐事件变化，应在 GeneratePrimaries 中修改。' } },
    { prompt: { en: 'In the Week 2 world (a 3 m vacuum cube), a 1 GeV μ⁻ starts at z = −1 m heading +z. How many steps does its track have?', zh: '在第 2 周的世界（3 m 真空立方体）中，一个 1 GeV μ⁻ 从 z = −1 m 沿 +z 出发。它的径迹有几步？' },
      opts: [{ en: 'One: Transportation to the world boundary', zh: '一步：Transportation 到世界边界' }, { en: 'Thousands, one per millimetre', zh: '几千步，每毫米一步' }, { en: 'Two: initStep and Transportation are both steps', zh: '两步：initStep 和 Transportation 都是步' }, { en: 'Zero: nothing happens in vacuum', zh: '零步：真空里什么都不发生' }],
      a: 0, why: { en: 'A step ends at a geometry boundary or a physics process. In an empty world the only boundary is the world surface, 2.5 m away, so step 1 is a single 2.5 m Transportation step ending OutOfWorld. Row 0 (initStep) is the starting point, not a step.', zh: '一步结束于几何边界或物理过程。空世界里唯一的边界是 2.5 m 外的世界表面，所以第 1 步就是一次 2.5 m 的 Transportation，以 OutOfWorld 结束。第 0 行（initStep）是起点，不是一步。' } },
    { prompt: { en: 'Why does the 1 GeV muon not decay in this world?', zh: '为什么 1 GeV 缪子在这个世界里不衰变？' },
      opts: [{ en: 'Decay needs matter, and the world is vacuum', zh: '衰变需要物质，而世界是真空' }, { en: 'Its mean decay length βγcτ ≈ 6.9 km is far longer than the 2.5 m path', zh: '它的平均衰变长度 βγcτ ≈ 6.9 km 远大于 2.5 m 的路径' }, { en: 'FTFP_BERT has no decay process', zh: 'FTFP_BERT 没有衰变过程' }, { en: 'Muons are stable in Geant4', zh: '缪子在 Geant4 中是稳定的' }],
      a: 1, why: { en: 'Decay is a property of the particle and runs with or without matter. With βγ = 10.42 and cτ = 658.6 m, λ = 6.86 km, so the chance of decaying within 2.5 m is 1 − e<sup>−2.5/6860</sup> ≈ 3.6 × 10⁻⁴.', zh: '衰变是粒子自身的性质，有没有物质都会发生。βγ = 10.42、cτ = 658.6 m，λ = 6.86 km，在 2.5 m 内衰变的概率为 1 − e<sup>−2.5/6860</sup> ≈ 3.6 × 10⁻⁴。' } },
    { prompt: { en: 'Which hierarchy is correct?', zh: '哪种层级关系是正确的？' },
      opts: [{ en: 'Event ⊃ Run ⊃ Step ⊃ Track', zh: 'Event ⊃ Run ⊃ Step ⊃ Track' }, { en: 'Run ⊃ Event ⊃ Track ⊃ Step', zh: 'Run ⊃ Event ⊃ Track ⊃ Step' }, { en: 'Run ⊃ Track ⊃ Event ⊃ Step', zh: 'Run ⊃ Track ⊃ Event ⊃ Step' }, { en: 'Track ⊃ Event ⊃ Step ⊃ Run', zh: 'Track ⊃ Event ⊃ Step ⊃ Run' }],
      a: 1, why: { en: 'A Run shares one geometry and physics setup and holds Events; each Event holds the Tracks of every particle it produced; each Track is a sequence of Steps. GEANT3, FLUKA and MCNP use the same skeleton.', zh: 'Run 共享同一套几何与物理设置并包含若干 Event；每个 Event 包含其产生的所有粒子的 Track；每条 Track 由一串 Step 组成。GEANT3、FLUKA 和 MCNP 也用同样的骨架。' } },
    { prompt: { en: 'After <code>/run/initialize</code> you type <code>/gun/position 0 0 2 m</code>, outside the 3 m world. What happens?', zh: '<code>/run/initialize</code> 之后输入 <code>/gun/position 0 0 2 m</code>（在 3 m 世界之外），会发生什么？' },
      opts: [{ en: 'Geant4 crashes with a fatal error', zh: 'Geant4 致命错误崩溃' }, { en: 'Warning Event0401, and the gun stays where it was', zh: '警告 Event0401，粒子枪留在原处' }, { en: 'The gun moves to z = 2 m and the track has zero length', zh: '枪移到 z = 2 m，径迹长度为零' }, { en: 'The world grows to include the gun', zh: '世界自动扩大以包含粒子枪' }],
      a: 1, why: { en: 'In the Idle state G4VPrimaryGenerator::SetParticlePosition checks the vertex against the world solid, prints Event0401 ("Gun position has NOT been changed!") and keeps the old position. The run then proceeds from the old position, so it is easy to miss.', zh: '在 Idle 状态下，G4VPrimaryGenerator::SetParticlePosition 会检查顶点是否在世界内，打印 Event0401（“Gun position has NOT been changed!”）并保留原位置。随后的运行仍从旧位置出发，因此很容易被忽略。' } },
    { prompt: { en: 'You fire 1,000 π⁻ of 100 MeV kinetic energy from z = −1 m. Roughly how many events contain a μ⁻ track?', zh: '从 z = −1 m 发射 1,000 个动能 100 MeV 的 π⁻，大约多少个事件中会出现 μ⁻ 径迹？' },
      opts: [{ en: 'None: pions do not decay in vacuum', zh: '零个：π 在真空中不衰变' }, { en: 'About 205 ± 13', zh: '约 205 ± 13 个' }, { en: 'About 1,000', zh: '约 1,000 个' }, { en: 'About 2', zh: '约 2 个' }],
      a: 1, why: { en: 'For a π⁻ at 100 MeV, βγ = 1.395 and cτ = 7.80 m, so λ = 10.9 m. Over 2.5 m, P = 1 − e<sup>−2.5/10.9</sup> = 0.205. Every π⁻ decay in Geant4 gives μ⁻ ν̄<sub>μ</sub>, so expect 205 ± √(1000·0.205·0.795) ≈ 205 ± 13. Our Geant4 11.4 run gave 198.', zh: '100 MeV 的 π⁻：βγ = 1.395，cτ = 7.80 m，λ = 10.9 m。在 2.5 m 内 P = 1 − e<sup>−2.5/10.9</sup> = 0.205。Geant4 中每次 π⁻ 衰变都产生 μ⁻ ν̄<sub>μ</sub>，所以预期 205 ± √(1000·0.205·0.795) ≈ 205 ± 13。我们用 Geant4 11.4 实测为 198。' } }
  ]);
  G.progress('w02');
  G.pager(el('pager'), 2);
})();
