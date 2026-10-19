/* Week 03 — toy step-by-step crossing (Week 3).
   TOY MODEL, not Geant4. A muon crosses a 10 cm block in a straight line. Its steps end either at
   the block boundary (Transportation) or where it knocks out a delta-ray electron above the
   production threshold Tcut (muIoni). Delta-rays above Tcut are a Poisson process with
     dN/dx = (K/2)(Z/A) rho (1/beta^2) [1/Tcut - 1/Tmax - (beta^2/Tmax) ln(Tmax/Tcut)]
   (PDG passage-of-particles-through-matter, delta-ray spectrum for spin-0; the spin-1/2 term is
   neglected). Tcut for each material is the value Geant4 11.4 derives from the default 0.7 mm range
   cut (/run/dumpCouples). Ignored: energy loss along the block, muBrems/muPairProd (~0.01 per
   crossing in Cu/Pb), multiple scattering, and delta-ray transport (stubs are drawn for show). */
(function () {
  'use strict';
  var G = window.G4C, SEED = 20261020;
  var K = 0.307075, ME = 0.51099895, MMU = 105.6583755;
  var MAT = {
    'G4_lH2':                     { ZA: 0.99212, rho: 0.0708, tcut: 0.0884943, g4: 2.21, en: 'liquid hydrogen', zh: '液氢' },
    'G4_PLASTIC_SC_VINYLTOLUENE': { ZA: 0.54141, rho: 1.032,  tcut: 0.281883, g4: 4.02, en: 'plastic scintillator', zh: '塑料闪烁体' },
    'G4_Al':                      { ZA: 0.48181, rho: 2.699,  tcut: 0.46119,  g4: 5.22, en: 'aluminium', zh: '铝' },
    'G4_CONCRETE':                { ZA: 0.50274, rho: 2.3,    tcut: 0.433296, g4: 5.01, en: 'concrete', zh: '混凝土' },
    'G4_Cu':                      { ZA: 0.45636, rho: 8.96,   tcut: 1.03403,  g4: 6.72, en: 'copper', zh: '铜' },
    'G4_Pb':                      { ZA: 0.39575, rho: 11.35,  tcut: 1.00699,  g4: 7.67, en: 'lead', zh: '铅' }
  };
  var L = 10; /* cm */
  var el = function (id) { return document.getElementById(id); };
  var cv = el('w3-display'), hc = el('w3-hist');
  var st;

  function kin(T) {
    var g = 1 + T / MMU, bg2 = g * g - 1, b2 = bg2 / (g * g);
    var r = ME / MMU, tmax = 2 * ME * bg2 / (1 + 2 * g * r + r * r);
    return { b2: b2, tmax: tmax };
  }
  function rate(mat, T) {   /* delta-rays per cm above Tcut */
    var m = MAT[mat], k = kin(T), tc = m.tcut;
    if (tc >= k.tmax) return 0;
    return 0.5 * K * m.ZA * m.rho / k.b2 * (1 / tc - 1 / k.tmax - k.b2 / k.tmax * Math.log(k.tmax / tc));
  }
  G.w3rate = rate;
  function params() { return { mat: el('w3-mat').value, T: Math.pow(10, +el('w3-T').value) }; }
  function fmtE(mev) { return mev >= 1000 ? +(mev / 1000).toPrecision(3) + ' GeV' : +mev.toPrecision(3) + ' MeV'; }

  function reset() { var p = params(); st = { p: p, rng: G.rng(SEED), nu: rate(p.mat, p.T) * L, k: kin(p.T), counts: [], last: null, run: 0, N: 0 }; }
  function poisson(r, mu) { var Lm = Math.exp(-mu), k = 0, p = 1; do { k++; p *= r(); } while (p > Lm); return k - 1; }
  function sampleT(r) {  /* 1/T^2 between Tcut and Tmax, with (1 - b2 T/Tmax) rejection */
    var tc = MAT[st.p.mat].tcut, tm = st.k.tmax;
    for (;;) {
      var u = r(), T = tc * tm / (tm - u * (tm - tc));
      if (r() < 1 - st.k.b2 * T / tm) return T;
    }
  }
  function crossing() {
    var r = st.rng, n = poisson(r, st.nu), ev = [];
    for (var i = 0; i < n; i++) ev.push({ z: r() * L, T: sampleT(r), a: (0.15 + 0.35 * r()) * Math.PI * (r() < 0.5 ? -1 : 1) });
    ev.sort(function (a, b) { return a.z - b.z; });
    return ev;
  }
  function beamOn(n) {
    st.run++;
    for (var i = 0; i < n; i++) { var ev = crossing(); st.counts.push(ev.length + 1); st.N++; if (i === n - 1) st.last = ev; }
  }

  var DFG = 'rgba(220,227,232,', AMBER = '#E2B04A', LIGHT = '#DCE3E8', RED = '#FF6369', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  function drawDisplay() {
    var r = G.size(cv), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, h);
    var bx = w * 0.18, bw = w * 0.64, by = h * 0.18, bh = h * 0.64, cy = by + bh / 2;
    x.fillStyle = 'rgba(115,147,255,0.10)'; x.fillRect(bx, by, bw, bh);
    x.strokeStyle = DFG + '0.45)'; x.strokeRect(bx + .5, by + .5, bw, bh);
    x.fillStyle = DFG + '0.55)'; x.font = '10px ' + MONO; x.textAlign = 'left';
    x.fillText('Block · ' + st.p.mat + ' · 10 cm', bx + 6, by + 14);
    x.fillText('World · G4_AIR', 8, 14);
    var zx = function (z) { return bx + z / L * bw; };
    /* incoming segment in air */
    x.strokeStyle = LIGHT; x.lineWidth = 1.5; x.setLineDash([5, 4]);
    x.beginPath(); x.moveTo(8, cy); x.lineTo(bx, cy); x.stroke();
    x.beginPath(); x.moveTo(bx + bw, cy); x.lineTo(w - 8, cy); x.stroke(); x.setLineDash([]);
    /* steps inside: each segment coloured by the process that ENDED it */
    var ev = st.last || [], z0 = 0;
    ev.concat([{ z: L, end: true }]).forEach(function (d) {
      x.strokeStyle = d.end ? LIGHT : AMBER; x.lineWidth = 3;
      x.beginPath(); x.moveTo(zx(z0) + 1, cy); x.lineTo(zx(d.z) - 1, cy); x.stroke();
      x.fillStyle = d.end ? LIGHT : AMBER; x.fillRect(zx(d.z) - 1, cy - 7, 2, 14);
      if (!d.end) {
        var len = Math.min(bh * 0.45, 10 + 16 * Math.log10(d.T / MAT[st.p.mat].tcut * 10));
        x.strokeStyle = RED; x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(zx(d.z), cy);
        x.quadraticCurveTo(zx(d.z) + len * 0.6 * Math.cos(d.a), cy + len * 0.6 * Math.sin(d.a), zx(d.z) + len * Math.cos(d.a) + 6, cy + len * Math.sin(d.a) * 1.1);
        x.stroke();
        x.fillStyle = DFG + '0.6)'; x.textAlign = 'center';
        x.fillText((d.T >= 1 ? d.T.toFixed(1) + ' MeV' : (d.T * 1000).toFixed(0) + ' keV'), zx(d.z) + len * Math.cos(d.a), cy + len * Math.sin(d.a) * 1.1 + (d.a > 0 ? 12 : -6));
      }
      z0 = d.z;
    });
    x.fillStyle = DFG + '0.5)'; x.textAlign = 'left';
    x.fillText(G.t('μ⁻ 1 track · ', 'μ⁻ 一条径迹 · ') + (ev.length + 1) + G.t(' steps in the block', ' 步在块内'), bx, by + bh + 18);
    el('w3-runlabel').textContent = 'Run ' + st.run + ' · ' + st.N.toLocaleString('en') + G.t(' crossings', ' 次穿越');
  }
  function drawTable() {
    var ev = st.last || [], out = '', z0 = 0;
    ev.concat([{ z: L, end: true }]).forEach(function (d) {
      out += ' step ends via ' + (d.end ? 'Transportation' : 'muIoni        ') + ' in Block trk 1  stepLen=' + ((d.z - z0) * 10).toFixed(2).padStart(6) + ' mm' +
        (d.end ? '   <span class="c">// boundary</span>' : '   <span class="c">// δ-ray, T = ' + (d.T >= 1 ? d.T.toFixed(2) + ' MeV' : (d.T * 1000).toFixed(0) + ' keV') + '</span>') + '\n';
      z0 = d.z;
    });
    el('w3-steps').innerHTML = out;
  }
  function drawHist() {
    var max = 1; st.counts.forEach(function (c) { if (c > max) max = c; });
    var nb = Math.max(8, max + 2), bins = new Array(nb).fill(0), sum = 0, s2 = 0;
    st.counts.forEach(function (c) { bins[c]++; sum += c; s2 += c * c; });
    var N = st.counts.length, mean = sum / N, sd = Math.sqrt(Math.max(0, s2 / N - mean * mean)), nu = st.nu;
    var lf = function (k) { var l = 0; for (var i = 2; i <= k; i++) l += Math.log(i); return l; };
    G.hist(hc, {
      bins: bins, lo: -0.5, hi: nb - 0.5, name: 'nSteps',
      xlabel: G.t('primary steps in the block', '主粒子在块内的步数'), ylabel: G.t('crossings', '穿越次数'),
      stats: [['Entries', String(N)], ['Mean', mean.toFixed(3)], ['Std Dev', sd.toFixed(3)]],
      curve: function (xv) { var k = Math.round(xv) - 1; if (k < 0 || Math.abs(xv - Math.round(xv)) > 0.49) return 0; return N * Math.exp(-nu + k * Math.log(Math.max(nu, 1e-12)) - lf(k)); },
      curveLabel: G.t('1 + Poisson(ν)', '1 + 泊松(ν)')
    });
    var m = MAT[st.p.mat];
    el('w3-tcut').textContent = (m.tcut >= 1 ? m.tcut.toFixed(3) + ' MeV' : (m.tcut * 1000).toFixed(1) + ' keV');
    el('w3-tmax').textContent = fmtE(st.k.tmax);
    el('w3-nu').textContent = nu.toFixed(2);
    el('w3-pred').textContent = (1 + nu).toFixed(2);
    el('w3-meas').textContent = mean.toFixed(2) + ' ± ' + (sd / Math.sqrt(N)).toFixed(2);
    var at1 = Math.abs(st.p.T - 1000) < 1;
    el('w3-g4').textContent = at1 ? m.g4.toFixed(2) : G.t('only at 1 GeV', '仅 1 GeV');
  }
  function drawAll() { drawDisplay(); drawTable(); drawHist(); }
  G.onRedraw(drawAll);

  function fillMats() {
    var v = el('w3-mat').value || 'G4_CONCRETE';
    el('w3-mat').innerHTML = Object.keys(MAT).map(function (k) { return '<option value="' + k + '">' + k + ' · ' + G.t(MAT[k].en, MAT[k].zh) + '</option>'; }).join('');
    el('w3-mat').value = v;
  }
  function sync() { el('w3-T-out').textContent = fmtE(Math.pow(10, +el('w3-T').value)); }
  function restart() { sync(); reset(); beamOn(1000); drawAll(); }
  fillMats(); window.addEventListener('g4c:lang', fillMats);
  el('w3-mat').addEventListener('change', restart);
  el('w3-T').addEventListener('input', sync); el('w3-T').addEventListener('change', restart);
  el('w3-b1').addEventListener('click', function () { beamOn(1); drawAll(); });
  el('w3-b1k').addEventListener('click', function () { beamOn(1000); drawAll(); });
  el('w3-reset').addEventListener('click', restart);
  restart();

  G.quiz(el('quiz'), 'w03', [
    { prompt: { en: 'You swap <code>G4_CONCRETE</code> for <code>G4_Pb</code>. Which of the three geometry layers did you change?', zh: '把 <code>G4_CONCRETE</code> 换成 <code>G4_Pb</code>，你改动的是三层几何中的哪一层？' },
      opts: [{ en: 'The solid (G4Box)', zh: '实体（G4Box）' }, { en: 'The logical volume (material binding)', zh: '逻辑体（材料绑定）' }, { en: 'The physical volume (placement)', zh: '物理体（放置）' }, { en: 'All three', zh: '三层都改了' }],
      a: 1, why: { en: 'G4LogicalVolume binds a solid to a material. The shape (G4Box) and the placement (G4PVPlacement) are untouched; only one string in the logical-volume line changes.', zh: 'G4LogicalVolume 把实体与材料绑定在一起。形状（G4Box）和放置（G4PVPlacement）都没动，只改了逻辑体那一行里的一个字符串。' } },
    { prompt: { en: 'For a 1 GeV μ⁻ crossing 10 cm, which material gives the larger energy deposit?', zh: '1 GeV μ⁻ 穿过 10 cm，哪种材料中的能量沉积更大？' },
      opts: [{ en: 'Concrete', zh: '混凝土' }, { en: 'Lead, about 3.5× more', zh: '铅，约多 3.5 倍' }, { en: 'They are equal: a MIP is a MIP', zh: '相等：最小电离粒子都一样' }, { en: 'Lead, about 100× more', zh: '铅，约多 100 倍' }],
      a: 1, why: { en: 'Per g/cm² the two are similar (Pb is actually lower), but lead is about 5× denser. Our Geant4 runs gave 142 MeV in Pb against 41 MeV in concrete. Week 4 makes this quantitative with Bethe–Bloch.', zh: '按 g/cm² 计两者相近（铅反而略低），但铅的密度约为混凝土的 5 倍。我们的 Geant4 运行给出铅中 142 MeV、混凝土中 41 MeV。第 4 周会用 Bethe–Bloch 公式定量说明。' } },
    { prompt: { en: 'What ends a Geant4 step?', zh: '什么会结束 Geant4 的一步？' },
      opts: [{ en: 'A fixed distance, 1 mm by default', zh: '固定距离，默认 1 mm' }, { en: 'A geometry boundary or a physics process', zh: '几何边界或物理过程' }, { en: 'Every energy deposit above 1 keV', zh: '每次超过 1 keV 的能量沉积' }, { en: 'The end of the event', zh: '事件结束' }],
      a: 1, why: { en: 'Each process proposes a distance; the shortest one, or the boundary, wins and its name goes into GetProcessDefinedStep(). That is why step lengths in the printout vary from fractions of a millimetre to tens of centimetres.', zh: '每个过程都提出一个步长，最短者（或几何边界）胜出，其名称记入 GetProcessDefinedStep()。所以输出中的步长从不到 1 mm 到几十厘米不等。' } },
    { prompt: { en: 'In the printout, which process name belongs to the muon\'s ionisation steps?', zh: '输出中，哪一个过程名属于缪子的电离步？' },
      opts: [{ en: '<code>eIoni</code>', zh: '<code>eIoni</code>' }, { en: '<code>muIoni</code>', zh: '<code>muIoni</code>' }, { en: '<code>msc</code>', zh: '<code>msc</code>' }, { en: '<code>hIoni</code>', zh: '<code>hIoni</code>' }],
      a: 1, why: { en: 'Geant4 gives each particle family its own process instance: muIoni, muBrems, muPairProd and muMsc for muons; eIoni, eBrem and msc for electrons. eIoni appears in the printout only on the δ-ray electrons (trk 2, 3, …).', zh: 'Geant4 为每类粒子分配各自的过程：缪子是 muIoni、muBrems、muPairProd 和 muMsc；电子是 eIoni、eBrem 和 msc。输出中的 eIoni 只出现在 δ 电子（trk 2、3……）上。' } },
    { prompt: { en: 'Replace the lead block with liquid hydrogen (160× less dense). Do the muon\'s steps in the block go up or down?', zh: '把铅块换成液氢（密度低约 160 倍），缪子在块内的步数会增加还是减少？' },
      opts: [{ en: 'Up, because hydrogen has more electrons per gram', zh: '增加，因为氢每克电子更多' }, { en: 'Down: about 2.2 instead of 7.7', zh: '减少：约 2.2 步，而铅中为 7.7 步' }, { en: 'Unchanged: steps depend only on geometry', zh: '不变：步数只取决于几何' }, { en: 'Down to exactly 1', zh: '减少到正好 1 步' }],
      a: 1, why: { en: 'muIoni steps are δ-rays above the production threshold. Fewer electrons per cm means fewer δ-rays, partly offset by a lower threshold in lH2 (88 keV against 1.01 MeV in Pb). Geant4: 2.21 against 7.67 steps per crossing.', zh: 'muIoni 步就是超过产生阈的 δ 电子。每厘米电子更少，δ 电子就更少；液氢的阈值更低（88 keV，铅为 1.01 MeV），部分抵消了这一点。Geant4 结果：每次穿越 2.21 步对 7.67 步。' } },
    { prompt: { en: 'The overlap check prints <code>GeomVol1002 … protrusion … by 3 cm</code> but the run continues. What should you do?', zh: '重叠检查打印 <code>GeomVol1002 … protrusion … by 3 cm</code>，但运行仍在继续。该怎么办？' },
      opts: [{ en: 'Nothing, it is only a warning', zh: '什么都不做，只是警告' }, { en: 'Fix the placement before trusting any result', zh: '先修正放置，再相信任何结果' }, { en: 'Use more events to average it out', zh: '用更多事例把它平均掉' }, { en: 'Switch physics list', zh: '换物理列表' }],
      a: 1, why: { en: 'A daughter sticking out of its mother is undefined navigation: Geant4 may deposit energy in the wrong volume without complaining again. Run the overlap check after every geometry change, before any physics.', zh: '子体伸出母体属于未定义的导航：Geant4 可能把能量记到错误的体积里而不再报警。每次修改几何后，在做任何物理之前都要运行重叠检查。' } }
  ]);
  G.progress('w03');
  G.pager(el('pager'), 3);
})();
