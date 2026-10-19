/* Week 12 — toy feasibility planner and defence-weight calculator.
   TOY MODEL. Statistical precision: for an efficiency, sigma/eps = sqrt((1-eps)/(eps N));
   for a mean, sigma/mean = r / sqrt(N eps), with r the relative RMS of the per-event quantity.
   Total relative uncertainty = sqrt(stat^2 + sys^2): beyond the systematic floor, more events do
   not help. Cost: constant CPU time per generated event (default 0.34 ms, measured in our Week 10
   Geant4 run: 200 000 muons in 67 CPU-seconds), perfect scaling over cores, no queueing, no
   failed jobs, no analysis time. Grades: the Definition 12.2 weights. */
(function () {
  'use strict';
  var G = window.G4C;
  var el = function (id) { return document.getElementById(id); };

  function P() {
    return { kind: el('w12-kind').value, prec: +el('w12-prec').value / 100, sys: +el('w12-sys').value / 100,
      eps: +el('w12-eps').value / 100, r: +el('w12-r').value, ms: +el('w12-ms').value, cores: +el('w12-cores').value,
      pts: +el('w12-pts').value, vars: +el('w12-vars').value, days: +el('w12-days').value };
  }
  function statRel(p, N) { return p.kind === 'eff' ? Math.sqrt((1 - p.eps) / (p.eps * N)) : p.r / Math.sqrt(N * p.eps); }
  function solveN(p) {   // events per configuration so that sqrt(stat^2 + sys^2) = prec
    if (p.sys >= p.prec) return Infinity;
    var s = Math.sqrt(p.prec * p.prec - p.sys * p.sys);
    return p.kind === 'eff' ? (1 - p.eps) / (p.eps * s * s) : (p.r * p.r) / (p.eps * s * s);
  }
  function fmtN(n) { return !isFinite(n) ? '∞' : n >= 1e9 ? (n / 1e9).toFixed(1) + 'G' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'k' : String(Math.round(n)); }
  function fmtT(h) { return !isFinite(h) ? '∞' : h < 1 ? (h * 60).toFixed(0) + ' min' : h < 48 ? h.toFixed(1) + ' h' : (h / 24).toFixed(1) + ' d'; }

  var st;
  function run() {
    var p = P();
    el('w12-prec-out').textContent = (p.prec * 100).toFixed(1) + '%';
    el('w12-sys-out').textContent = (p.sys * 100).toFixed(1) + '%';
    el('w12-eps-out').textContent = (p.eps * 100).toFixed(p.eps < 0.1 ? 1 : 0) + '%';
    el('w12-r-out').textContent = p.r.toFixed(2);
    el('w12-ms-out').textContent = p.ms.toFixed(2) + ' ms';
    el('w12-cores-out').textContent = String(p.cores);
    el('w12-pts-out').textContent = String(p.pts);
    el('w12-vars-out').textContent = String(p.vars);
    el('w12-days-out').textContent = p.days + ' d';
    el('w12-r-row').style.display = p.kind === 'eff' ? 'none' : '';
    var N = solveN(p), runs = p.pts * (1 + p.vars), cpuH = N * runs * p.ms / 3.6e6, wallH = cpuH / p.cores;
    st = { p: p, N: N, runs: runs, cpuH: cpuH, wallH: wallH };
    draw();
    var ok = isFinite(wallH) && wallH <= p.days * 24 * 0.5;
    var lines = [
      ['', G.t('events per configuration', '每个配置的事例数') + '   ' + fmtN(N)],
      ['', G.t('configurations', '配置数') + ' = ' + p.pts + ' × (1 + ' + p.vars + ' ' + G.t('systematic variations', '系统变化') + ') = ' + runs],
      ['', G.t('CPU time', 'CPU 时间') + '   ' + fmtT(cpuH) + '    ' + G.t('wall time on ', '墙钟时间（') + p.cores + G.t(' cores', ' 核）') + '   ' + fmtT(wallH)],
      [!isFinite(N) ? 'bad' : ok ? 'ok' : 'bad', !isFinite(N)
        ? G.t('Impossible: the systematic floor is above the target. More events cannot help; reduce the systematic or loosen the target.', '不可能：系统误差下限高于目标。再多事例也无济于事；降低系统误差或放宽目标。')
        : ok ? G.t('Feasible: production uses at most half the time budget, leaving the rest for validation and the defence.', '可行：生产最多占用一半时间预算，其余留给验证和答辩。')
          : G.t('Not feasible as stated: narrow the question, accept a looser target, or cut configurations.', '按现在的设定不可行：收窄问题、放宽目标，或减少配置。')]
    ];
    el('w12-out').innerHTML = lines.map(function (l) { return '<span class="' + l[0] + '">' + l[1] + '</span>'; }).join('\n');
  }

  function draw() {
    var c = el('w12-plot'), r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    var p = st.p, L = 54, R = w - 12, T = 12, B = h - 34;
    x.fillStyle = G.css('--panel'); x.fillRect(0, 0, w, h);
    var lx0 = 2, lx1 = 9, ly0 = -4, ly1 = 0;   // N from 1e2 to 1e9; rel. unc. 1e-4 .. 1
    function X(n) { return L + (Math.log10(n) - lx0) / (lx1 - lx0) * (R - L); }
    function Y(v) { return B - (Math.log10(Math.max(1e-4, Math.min(1, v))) - ly0) / (ly1 - ly0) * (B - T); }
    x.save(); x.beginPath(); x.rect(L, T, R - L, B - T); x.clip();
    /* target band */
    x.fillStyle = G.css('--neu') + '22'; x.fillRect(L, Y(p.prec), R - L, B - Y(p.prec));
    x.strokeStyle = G.css('--neu'); x.setLineDash([5, 4]); x.beginPath(); x.moveTo(L, Y(p.prec)); x.lineTo(R, Y(p.prec)); x.stroke();
    /* systematic floor */
    if (p.sys > 0) { x.strokeStyle = G.css('--neg'); x.beginPath(); x.moveTo(L, Y(p.sys)); x.lineTo(R, Y(p.sys)); x.stroke(); }
    x.setLineDash([]);
    /* statistical and total curves */
    [[function (n) { return statRel(p, n); }, G.css('--muted'), 1.2], [function (n) { var s = statRel(p, n); return Math.sqrt(s * s + p.sys * p.sys); }, G.css('--hist'), 2]].forEach(function (k) {
      x.strokeStyle = k[1]; x.lineWidth = k[2]; x.beginPath();
      for (var i = 0; i <= 140; i++) { var n = Math.pow(10, lx0 + i / 140 * (lx1 - lx0)); if (i) x.lineTo(X(n), Y(k[0](n))); else x.moveTo(X(n), Y(k[0](n))); }
      x.stroke();
    });
    if (isFinite(st.N) && st.N >= 100 && st.N <= 1e9) { x.fillStyle = G.css('--neg'); x.beginPath(); x.arc(X(st.N), Y(p.prec), 5, 0, 2 * Math.PI); x.fill(); }
    x.restore();
    x.strokeStyle = G.css('--frame'); x.lineWidth = 1; x.strokeRect(L + .5, T + .5, R - L - 1, B - T);
    x.fillStyle = G.css('--muted'); x.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    x.textAlign = 'center';
    for (var e = lx0; e <= lx1; e++) { var tx = X(Math.pow(10, e)); x.beginPath(); x.moveTo(tx, B); x.lineTo(tx, B - 7); x.stroke(); x.fillText('1e' + e, tx, B + 14); }
    x.textAlign = 'right';
    [1, 0.1, 0.01, 0.001, 0.0001].forEach(function (v) { var ty = Y(v); x.beginPath(); x.moveTo(L, ty); x.lineTo(L + 7, ty); x.stroke(); x.fillText((v * 100) + '%', L - 5, ty + 4); });
    x.fillText(G.t('events per configuration', '每个配置的事例数'), R, h - 2);
    x.save(); x.translate(12, T); x.rotate(-Math.PI / 2); x.fillText(G.t('relative uncertainty', '相对不确定度'), 0, 0); x.restore();
    x.textAlign = 'left';
    x.fillStyle = G.css('--hist'); x.fillText('— ' + G.t('total', '总计'), L + 8, B - 26);
    x.fillStyle = G.css('--muted'); x.fillText('— ' + G.t('statistical, 1/√N', '统计，1/√N'), L + 70, B - 26);
    x.fillStyle = G.css('--neg'); x.fillText('- - ' + G.t('systematic floor', '系统误差下限'), L + 8, B - 10);
    x.fillStyle = G.css('--neu'); x.fillText('- - ' + G.t('target', '目标'), L + 160, B - 10);
  }

  /* defence weights, Definition 12.2 */
  var W = [['w12-g1', 20], ['w12-g2', 20], ['w12-g3', 25], ['w12-g4', 15], ['w12-g5', 10], ['w12-g6', 10]];
  function grade() {
    var tot = 0;
    W.forEach(function (k) { var v = +el(k[0]).value; el(k[0] + '-out').textContent = v; tot += v * k[1] / 100; });
    el('w12-grade').innerHTML = G.t('weighted grade', '加权总分') + '   <b>' + tot.toFixed(1) + '</b> / 100';
  }

  G.onRedraw(function () { if (st) { run(); } });
  ['w12-prec', 'w12-sys', 'w12-eps', 'w12-r', 'w12-ms', 'w12-cores', 'w12-pts', 'w12-vars', 'w12-days'].forEach(function (id) { el(id).addEventListener('input', run); });
  el('w12-kind').addEventListener('change', run);
  W.forEach(function (k) { el(k[0]).addEventListener('input', grade); });
  el('w12-ex-a').addEventListener('click', function () { [['w12-g1', 80], ['w12-g2', 95], ['w12-g3', 20], ['w12-g4', 70], ['w12-g5', 80], ['w12-g6', 100]].forEach(function (k) { el(k[0]).value = k[1]; }); grade(); });
  el('w12-ex-b').addEventListener('click', function () { [['w12-g1', 85], ['w12-g2', 60], ['w12-g3', 90], ['w12-g4', 80], ['w12-g5', 75], ['w12-g6', 55]].forEach(function (k) { el(k[0]).value = k[1]; }); grade(); });
  run(); grade();

  G.quiz(el('quiz'), 'w12', [
    { prompt: { en: 'Which is a workable research question for a one-week project?', zh: '下面哪个是适合一周项目的研究问题？' },
      opts: [{ en: 'Study every aspect of muon detectors', zh: '研究缪子探测器的方方面面' }, { en: 'How does the two-layer trigger efficiency change when the layer gap grows from 10 to 40 cm, to 1% precision?', zh: '两层触发效率随层间距从 10 cm 增到 40 cm 如何变化，精度 1%？' }, { en: 'Make Geant4 faster', zh: '让 Geant4 更快' }, { en: 'Simulate the SHINE facility', zh: '模拟 SHINE 装置' }],
      a: 1, why: { en: 'It is answerable by simulation, has one observable, a stated precision and a boundary. "If you could use only one sentence to describe your result, what would it be?"', zh: '它能用模拟回答，有一个可观测量、一个明确精度和边界。“如果只能用一句话描述你的结果，你会怎么说？”' } },
    { prompt: { en: 'Your systematic uncertainty is 1.5% and your target is 1%. What do more events buy you?', zh: '系统不确定度为 1.5%，目标是 1%。更多事例能带来什么？' },
      opts: [{ en: 'The target, eventually', zh: '最终能达到目标' }, { en: 'Nothing that reaches the target: the total cannot fall below the systematic floor', zh: '达不到目标：总不确定度不可能低于系统误差下限' }, { en: 'A smaller systematic', zh: '更小的系统误差' }, { en: 'A faster run', zh: '更快的运行' }],
      a: 1, why: { en: 'Total = √(stat² + sys²) ≥ sys. Reduce the systematic (a better model, a calibration, a narrower question) or change the target. The planner above shows the floor.', zh: '总不确定度 = √(stat² + sys²) ≥ sys。要么降低系统误差（更好的模型、刻度、更窄的问题），要么改变目标。上面的规划器显示了这一下限。' } },
    { prompt: { en: 'Two defences: A has elegant code but no comparison with any reference; B has rough code and an honest validation. Under Definition 12.2, which scores higher?', zh: '两场答辩：A 代码优雅但没有与任何参照比较；B 代码粗糙但验证诚实。按定义 12.2，哪个得分更高？' },
      opts: [{ en: 'A, code quality matters most', zh: 'A，代码质量最重要' }, { en: 'B: validation is 25%, code quality and reproducibility 10%', zh: 'B：验证占 25%，代码质量与可复现性占 10%' }, { en: 'They tie', zh: '平分' }, { en: 'Neither passes', zh: '都不及格' }],
      a: 1, why: { en: 'Try the two presets in the weight calculator. A simulation never compared with anything has less scientific value, however clean the code.', zh: '在权重计算器里试试两个预设。一个从未与任何东西比较过的模拟，代码再干净，科学价值也更低。' } },
    { prompt: { en: 'What must every defence\'s boundary statement contain?', zh: '每场答辩的边界声明必须包含什么？' },
      opts: [{ en: 'A list of Geant4 classes used', zh: '所用 Geant4 类的列表' }, { en: 'At least one physically important effect the simulation ignores, and its consequence', zh: '至少一个被模拟忽略的重要物理效应及其后果' }, { en: 'The CPU model', zh: 'CPU 型号' }, { en: 'Nothing; boundaries weaken a talk', zh: '不需要；边界会削弱报告' }],
      a: 1, why: { en: 'And with musrSim, one application-specific behaviour verified against the installed source. Course-W10-a (no spin in the decay) is exactly such a behaviour.', zh: '如果用了 musrSim，还要有一个对照已安装源码核实过的应用特有行为。Course-W10-a（衰变中没有自旋）正是这样的行为。' } },
    { prompt: { en: 'An evaluator clones your repository. What must reproduce the headline number without asking you anything?', zh: '评审克隆了你的仓库。不问你任何问题，要复现核心数字需要什么？' },
      opts: [{ en: 'The slides', zh: '幻灯片' }, { en: 'Source and macros at a tagged commit, the Geant4/ROOT versions, the seed strategy and the analysis script', zh: '某个标签提交下的源码与宏、Geant4/ROOT 版本、种子策略以及分析脚本' }, { en: 'The ROOT files only', zh: '只要 ROOT 文件' }, { en: 'A screenshot of the plot', zh: '图的截图' }],
      a: 1, why: { en: 'This is the 10% for code quality and reproducibility, checked by actually rebuilding. repro_check.sh on this page is the minimal version.', zh: '这就是代码质量与可复现性的 10%，通过实际重新编译来检查。本页的 repro_check.sh 是最简版本。' } }
  ]);
  G.progress('w12');
  G.pager(el('pager'), 12);
})();
