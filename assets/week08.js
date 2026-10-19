/* Week 08 — toy event stream through the simulation-to-data chain (Week 8 lesson).
   TOY MODEL, not Geant4. Events follow the week08 app: cos^2-crossing muons from a 30 x 30 cm
   plane 10 cm above the top counter; two 10 x 10 x 1 cm counters 20 cm apart. Energy deposit:
   Moyal approximation to the Landau distribution (MPV 1.75 MeV per cm, width 0.11 MeV, scaled by
   path length); digitization as in Week 5 (25 p.e./MeV, 4 ADC counts per p.e., pedestal 50,
   noise 3 counts). Events are dealt to worker threads at random. The output-file behaviour
   (per-thread files without SetNtupleMerging, an unreadable file without Write/CloseFile)
   is what we observed with Geant4 11.4; the toy only reproduces it. */
(function () {
  'use strict';
  var G = window.G4C, SEED = 20261025, N = 20000;
  var el = function (id) { return document.getElementById(id); };

  function gen() {
    var r = G.rng(SEED), ev = [];
    for (var i = 0; i < N; i++) {
      var c = Math.pow(r(), 0.25), s = Math.sqrt(1 - c * c), ph = 2 * Math.PI * r();
      var x = (r() * 2 - 1) * 15, y = (r() * 2 - 1) * 15, tx = s / c * Math.cos(ph), ty = s / c * Math.sin(ph);
      var hit = [false, false], edep = [0, 0], adc = [0, 0], t = [0, 0];
      [10, 30].forEach(function (dz, k) {
        var xx = x + tx * dz, yy = y + ty * dz;
        if (Math.abs(xx) < 5 && Math.abs(yy) < 5) {
          hit[k] = true;
          var z = r.gauss(), moy = -Math.log(z * z + 1e-12);
          edep[k] = Math.max(0.05, (1.75 + 0.11 * moy) / c);
        }
      });
      for (var k = 0; k < 2; k++) {
        var evis = edep[k] / (1 + 0.0126 * 1.9), mu = 25 * evis, pe = 0;
        if (mu > 30) pe = Math.max(0, Math.round(mu + Math.sqrt(mu) * r.gauss())); else { var L = Math.exp(-mu), p = 1; do { pe++; p *= r(); } while (p > L); pe--; }
        adc[k] = 50 + 4 * pe + 3 * r.gauss();
        t[k] = (k ? 20 / c / 29.98 : 0) + 0.5 * r.gauss();
      }
      var a0 = adc[0] > 70, a1 = adc[1] > 70, co = a0 && a1 && Math.abs(t[0] - t[1]) < 20;
      ev.push({ id: i, thread: 0, edep: edep, adc: adc, t: t, word: (a0 ? 1 : 0) | (a1 ? 2 : 0) | (co ? 4 : 0), trig: co, u: r() });
    }
    return ev;
  }
  var EV = gen();

  function params() { return { threads: +el('w8-thr').value, merge: el('w8-merge').checked, close: el('w8-close').checked, truthInDaq: el('w8-truth').checked, readOne: el('w8-readone').checked }; }
  function compute() {
    var P = params(), nt = P.threads;
    EV.forEach(function (e) { e.thread = Math.min(nt - 1, Math.floor(e.u * nt)); });
    var files = [];
    if (P.merge || nt === 1) files.push({ name: 'muons.root', threads: null });
    else for (var i = 0; i < nt; i++) files.push({ name: 'muons_t' + i + '.root', threads: i });
    files.forEach(function (f) {
      var rows = EV.filter(function (e) { return f.threads === null || e.thread === f.threads; });
      f.truth = rows.length; f.daq = rows.filter(function (e) { return e.trig; }).length;
      f.readable = P.close;
      f.sizeKB = Math.round((f.truth * 0.022 + f.daq * 0.06) * 10) / 10;
    });
    /* what read_muons.py sees */
    var out = [], ok = true;
    var main = files.filter(function (f) { return f.name === 'muons.root'; })[0];
    var target = main || (P.readOne ? files[0] : null);
    if (!target) { out.push(['bad', 'FileNotFoundError: muons.root (the run wrote ' + files.map(function (f) { return f.name; }).join(', ') + ')']); ok = false; }
    else if (!target.readable) { out.push(['bad', target.name + ' exists (' + target.sizeKB + ' kB) but holds no readable trees: uproot finds 0 keys']); ok = false; }
    else {
      var rows = EV.filter(function (e) { return target.threads === null || e.thread === target.threads; });
      var trig = rows.filter(function (e) { return e.trig; });
      var eff = trig.length / rows.length, err = Math.sqrt(eff * (1 - eff) / rows.length);
      out.push([target.threads === null ? 'ok' : 'warn', 'events generated (truth rows)   ' + rows.length + (target.threads === null ? '' : '   ← thread ' + target.threads + ' only, of ' + N)]);
      out.push(['ok', 'events recorded  (daq rows)     ' + trig.length]);
      out.push(['ok', 'trigger efficiency              ' + eff.toFixed(4) + ' +/- ' + err.toFixed(4)]);
      var m0 = 0; trig.forEach(function (e) { m0 += e.adc[0]; }); m0 /= Math.max(1, trig.length);
      out.push(['ok', 'mean ADC top                    ' + m0.toFixed(1)]);
      if (P.truthInDaq) { out.push(['warn', 'daq tree also has Edep0_MeV: no hardware analogue. The lab decoder cannot fill it,']); out.push(['warn', 'so any cut on it makes simulation and data disagree by construction.']); ok = false; }
      if (target.threads !== null) ok = false;
    }
    return { P: P, files: files, out: out, ok: ok };
  }

  var st;
  var COLS = ['#7393FF', '#4FC98A', '#E2B04A', '#FF6369', '#B58CFF', '#5ED0E0', '#F2D06B', '#DCE3E8'];
  function drawStream() {
    var c = el('w8-display'), r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, h);
    var P = st.P, nt = P.threads, MONO = '"IBM Plex Mono", ui-monospace, monospace';
    x.font = '10px ' + MONO; x.textAlign = 'left'; x.fillStyle = 'rgba(220,227,232,0.6)';
    var stages = [G.t('events', '事件'), G.t('worker threads', '工作线程'), G.t('output files', '输出文件'), 'read_muons.py'];
    var colx = [0.04, 0.30, 0.58, 0.84].map(function (f) { return f * w; });
    stages.forEach(function (s, i) { x.fillText(s, colx[i], 16); });
    /* events column: 120 dots */
    for (var i = 0; i < 120; i++) {
      var e = EV[i], ex = colx[0] + (i % 10) * 9, ey = 32 + Math.floor(i / 10) * 9;
      x.fillStyle = e.trig ? '#F2D06B' : COLS[e.thread % COLS.length]; x.globalAlpha = e.trig ? 1 : 0.55;
      x.fillRect(ex, ey, 6, 6);
    }
    x.globalAlpha = 1;
    /* threads */
    var lane = (h - 50) / nt;
    for (var t = 0; t < nt; t++) {
      var y = 30 + t * lane + lane / 2;
      x.strokeStyle = COLS[t % COLS.length]; x.lineWidth = 2;
      x.beginPath(); x.moveTo(colx[0] + 95, y); x.lineTo(colx[1] + 100, y); x.stroke();
      x.fillStyle = COLS[t % COLS.length]; x.fillText('G4WT' + t + '  ' + EV.filter(function (e) { return e.thread === t; }).length, colx[1], y - 5);
    }
    /* files */
    var fl = (h - 50) / st.files.length;
    st.files.forEach(function (f, k) {
      var y = 30 + k * fl + fl / 2;
      for (var t = 0; t < nt; t++) {
        if (f.threads !== null && f.threads !== t) continue;
        var y0 = 30 + t * lane + lane / 2;
        x.strokeStyle = COLS[t % COLS.length]; x.globalAlpha = 0.6; x.lineWidth = 1;
        x.beginPath(); x.moveTo(colx[1] + 100, y0); x.bezierCurveTo(colx[1] + 150, y0, colx[2] - 50, y, colx[2] - 6, y); x.stroke();
      }
      x.globalAlpha = 1;
      x.fillStyle = f.readable ? '#DCE3E8' : '#FF6369';
      x.fillText(f.name + (f.readable ? '' : '  ✗'), colx[2], y - 5);
      x.fillStyle = 'rgba(220,227,232,0.55)';
      x.fillText(f.readable ? 'daq ' + f.daq + ' · truth ' + f.truth : G.t('no keys', '无可读树'), colx[2], y + 9);
    });
    /* reader */
    x.fillStyle = st.ok ? '#4FC98A' : '#FF6369';
    x.fillText(st.ok ? G.t('chain OK', '链路正常') : G.t('chain broken', '链路断开'), colx[3], h / 2);
  }
  function drawOut() {
    el('w8-out').innerHTML = st.out.map(function (l) { return '<span class="' + (l[0] === 'bad' ? 'bad' : l[0] === 'warn' ? 'p' : '') + '">' + l[1] + '</span>'; }).join('\n');
    /* ADC histogram of the triggered events in what was read */
    var rows = EV.filter(function (e) { return e.trig; }), nb = 60, lo = 0, hi = 600, bins = new Array(nb).fill(0), s = 0, s2 = 0;
    rows.forEach(function (e) { var b = Math.floor((e.adc[0] - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) bins[b]++; s += e.adc[0]; s2 += e.adc[0] * e.adc[0]; });
    var m = s / rows.length;
    G.hist(el('w8-hist'), { bins: bins, lo: lo, hi: hi, name: 'ch0_adc', xlabel: G.t('ch0_adc, triggered events [ADC counts]', 'ch0_adc，触发事例 [ADC 计数]'), ylabel: G.t('events / bin', '事例数 / bin'),
      stats: [['Entries', String(rows.length)], ['Mean', m.toFixed(1)], ['Std Dev', Math.sqrt(s2 / rows.length - m * m).toFixed(1)]] });
  }
  function run() { el('w8-thr-out').textContent = el('w8-thr').value; st = compute(); drawStream(); drawOut(); }
  G.onRedraw(function () { if (st) { drawStream(); drawOut(); } });
  ['w8-thr', 'w8-merge', 'w8-close', 'w8-truth', 'w8-readone'].forEach(function (id) { el(id).addEventListener(id === 'w8-thr' ? 'input' : 'change', run); });
  run();

  G.quiz(el('quiz'), 'w08', [
    { prompt: { en: 'A two-thread run without <code>SetNtupleMerging(true)</code> finishes. What is on disk?', zh: '一个未调用 <code>SetNtupleMerging(true)</code> 的双线程运行结束后，磁盘上有什么？' },
      opts: [{ en: 'muons.root with all events', zh: '包含全部事例的 muons.root' }, { en: 'muons_t0.root and muons_t1.root, and no muons.root', zh: 'muons_t0.root 和 muons_t1.root，没有 muons.root' }, { en: 'muons.root with half the events', zh: '只含一半事例的 muons.root' }, { en: 'Nothing', zh: '什么都没有' }],
      a: 1, why: { en: 'Each worker writes its own ntuple file. Our Geant4 11.4 run gave muons_t0.root (10,130 truth rows) and muons_t1.root (9,870). Histograms are merged automatically; ntuples need the explicit opt-in.', zh: '每个工作线程写自己的 ntuple 文件。我们的 Geant4 11.4 运行生成了 muons_t0.root（truth 10,130 行）和 muons_t1.root（9,870 行）。直方图自动合并，ntuple 需要显式开启。' } },
    { prompt: { en: 'You forget <code>CloseFile()</code>. What happens?', zh: '忘了调用 <code>CloseFile()</code>，会怎样？' },
      opts: [{ en: 'Geant4 prints an error', zh: 'Geant4 打印错误' }, { en: 'A file of normal size appears, but it holds no readable trees, and nothing warns you', zh: '出现一个大小正常的文件，但其中没有可读的树，而且没有任何警告' }, { en: 'The file is complete; closing is optional', zh: '文件完整，关闭是可选的' }, { en: 'The run crashes', zh: '运行崩溃' }],
      a: 1, why: { en: 'In our test the file was 404 kB and uproot found 0 keys. A file that "won\'t open" or a count that "doesn\'t add up": check Write/CloseFile and MT merging first.', zh: '在我们的测试中文件有 404 kB，uproot 却找不到任何键。文件“打不开”或计数“对不上”时，先检查 Write/CloseFile 和多线程合并。' } },
    { prompt: { en: 'Why keep <code>Edep0_MeV</code> out of the <code>daq</code> tree?', zh: '为什么不把 <code>Edep0_MeV</code> 放进 <code>daq</code> 树？' },
      opts: [{ en: 'To save disk space', zh: '为了节省磁盘空间' }, { en: 'The hardware cannot measure it, so the same analysis could not run on real data', zh: '硬件测不到它，同一个分析就无法在真实数据上运行' }, { en: 'ROOT cannot store doubles', zh: 'ROOT 不能存双精度数' }, { en: 'It is always zero', zh: '它总是零' }],
      a: 1, why: { en: 'DAQ parity: the detector-facing record has exactly the fields a real digitizer writes. Truth goes in a separate tree, for debugging and efficiency studies, never for selections the real analysis must also make.', zh: 'DAQ 一致性：面向探测器的记录只包含真实数字化器会写出的字段。真值放在单独的树里，用于调试和效率研究，绝不用于真实分析也必须做的选择。' } },
    { prompt: { en: 'read_muons.py gives the same efficiency as the RunAction printout. What does that prove?', zh: 'read_muons.py 给出的效率与 RunAction 打印值相同，这证明了什么？' },
      opts: [{ en: 'The physics model is correct', zh: '物理模型正确' }, { en: 'The Geant4 → ROOT → Python chain carried that observable without loss', zh: 'Geant4 → ROOT → Python 链路无损地传递了这个可观测量' }, { en: 'The detector is efficient', zh: '探测器效率高' }, { en: 'Nothing', zh: '什么都没证明' }],
      a: 1, why: { en: 'It is an end-to-end consistency check of serialisation, not a validation of physics or detector response. Validation against independent data comes in Week 11.', zh: '这是对序列化过程的端到端一致性检查，不是对物理或探测器响应的验证。与独立数据的验证在第 11 周进行。' } },
    { prompt: { en: 'In a two-thread run, a plain <code>G4int</code> counter in RunAction prints on the master…', zh: '双线程运行中，RunAction 里普通的 <code>G4int</code> 计数器在主线程上打印出……' },
      opts: [{ en: 'The total of both threads', zh: '两个线程的总和' }, { en: 'Zero, because the master processes no events', zh: '零，因为主线程不处理事例' }, { en: 'Thread 0\'s count', zh: '线程 0 的计数' }, { en: 'A random number', zh: '一个随机数' }],
      a: 1, why: { en: 'Each worker has its own RunAction; the master\'s copy never sees an event. G4Accumulable values are summed into the master by G4AccumulableManager::Merge(), which the week08 RunAction uses.', zh: '每个工作线程有自己的 RunAction，主线程的那一份从不处理事例。G4Accumulable 的值由 G4AccumulableManager::Merge() 汇总到主线程，week08 的 RunAction 就是这样做的。' } }
  ]);
  G.progress('w08');
  G.pager(el('pager'), 8);
})();
