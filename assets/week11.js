/* Week 11 — debugging-tree walker and validation-ladder calculator.
   Not a simulation: every report and every piece of evidence below is copied from our Geant4
   11.4.p01 runs of the six fault-lab branches (make_faults.sh applied to the week05 counter,
   course test physics list), lightly trimmed. The calculator is discrepancy_sigma()
   from validate_dedx.py with the Definition 11.2 ladder. */
(function () {
  'use strict';
  var G = window.G4C;
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  var LAYERS = [
    { en: 'Is the deviation beyond 2–3σ?', zh: '偏差超过 2–3σ 了吗？', how: 'compare with the reference, in units of σ' },
    { en: 'Was the particle generated?', zh: '粒子产生了吗？', how: '/tracking/verbose 1, first step' },
    { en: 'Is the geometry correct?', zh: '几何正确吗？', how: 'placement overlap check' },
    { en: 'Did the particle enter the detector?', zh: '粒子进入探测器了吗？', how: 'NextVolume column of the trace' },
    { en: 'Is the physics enabled?', zh: '物理过程开启了吗？', how: '/process/list' },
    { en: 'Is the sensitive detector attached?', zh: '灵敏探测器挂上了吗？', how: 'initialisation messages' },
    { en: 'Was a hit generated?', zh: '击中产生了吗？', how: 'print Edep and the fired flag per event' },
    { en: 'Was the data recorded?', zh: '数据记录了吗？', how: 'entries in the ntuple' },
    { en: 'Is the analysis correct?', zh: '分析正确吗？', how: 'reread the selection' }
  ];
  var OK_TRACE = 'Step#  Z(mm)  KinE(MeV)  dE(MeV)  NextVolume  ProcName\n    0   -200     4e+03       0      World  initStep\n    1   -105     4e+03  0.0158    Counter  Transportation\n    2    -95     4e+03    1.59      World  Transportation';
  var OK = {
    1: OK_TRACE.split('\n').slice(0, 3).join('\n') + '\n  → starts at z = -200 mm, inside the world (half-length 500 mm)',
    2: 'Checking overlaps for volume Counter:0 (G4Box) ... OK!\nChecking overlaps for volume Counter:1 (G4Box) ... OK!',
    3: OK_TRACE,
    4: '/process/list\n  Transportation, Decay, phot, compt, conv, msc, eIoni, eBrem, annihil,\n  msc, muIoni, muBrems, muPairProd, msc, hIoni   (course test list)',
    5: 'no G4Exception at /run/initialize; MuonSD registered',
    6: 'event 5: Edep0 = 1.588 MeV  fired = 1   (threshold 0.1 MeV)\nevent 0: Edep0 = 0         fired = 0',
    7: 'Muons: 20000 entries, branches Edep0 Edep1 Evis0 Evis1 ADC0 ADC1 dt trigger',
    8: 'selection: trigger == 1, same as the RunAction printout'
  };
  var CASES = [
    { name: 'fault-1', broken: 1,
      report: 'vertical  trigger eff = 0.1079 +/- 0.0022   (main: 0.1095 +/- 0.0022)\ncos2      trigger eff = 0.0060 +/- 0.0005   (main: 0.0127 +/- 0.0008)\nNo warning, no exception. "The cos² acceptance halved overnight."',
      ev: { 0: 'cos2: (0.0127 - 0.0060) / sqrt(0.0008² + 0.0005²) = 7.1σ  → real\nvertical: 0.5σ  → this test cannot see the fault',
        1: 'Step#  Z(mm)  KinE(MeV)  dE(MeV)  NextVolume  ProcName\n    0   -800     4e+03       0      World  initStep\n    1   -720     4e+03  0.0113      World  muIoni\n  → the vertex is at z = -800 mm. The world box has half-length 500 mm.' },
      why: { en: 'The source plane was moved to z = −80 cm, outside a world of half-length 50 cm. Geant4 11.4 did not stop: it located the point "in World" and transported the muon through 30 cm of air that does not exist. Vertical muons still hit both counters, so only the cos² run shows the fault: from 70 cm the counters subtend a smaller solid angle.', zh: '源平面被移到 z = −80 cm，在半长 50 cm 的 world 之外。Geant4 11.4 并没有停下：它把这个点定位为“在 World 中”，让缪子穿过 30 cm 并不存在的空气。竖直缪子仍然击中两个计数器，所以只有 cos² 运行暴露了故障：从 70 cm 处看，计数器张的立体角更小。' } },
    { name: 'fault-2', broken: 6,
      report: 'vertical  top fired 0.8899   bottom fired 0.8895   both fired (truth) 0.8890\n          both ADC above threshold 0.1095   trigger 0.1095\n"Efficiency 89%? For a 10 x 10 counter under a 30 x 30 source?"',
      ev: { 0: '0.8899 vs 0.1101: hundreds of σ. Also impossible: the counter covers 1/9 of the source plane.',
        6: 'event 0: Edep0 = 0         fired = 1\nevent 5: Edep0 = 1.588 MeV  fired = 0   (threshold 0.1 MeV)\n  → EventAction.cc:43  fired = edep < fEdepThreshold' },
      why: { en: 'The event-level threshold comparison is inverted: every event WITHOUT a deposit counts as fired. The digitised ADC path is untouched, which is why the ADC and trigger rows still agree with main. Two counts that should agree and don\'t point straight at the line between them.', zh: '事例级阈值比较写反了：每个“没有”沉积的事例都被算作响应。数字化 ADC 路径没受影响，所以 ADC 和触发两行仍与 main 一致。本该一致的两个计数不一致，正指向它们之间的那一行。' } },
    { name: 'fault-3', broken: 5,
      report: '*** G4Exception : Run0053\n      issued by : G4VUserDetectorConstruction::SetSensitiveDetector()\nNo logical volume of name <counter> is found. The specified sensitive\ndetector <MuonSD> couldn\'t be assigned to any volume.\n*** Fatal Error In Argument *** core dump ***',
      ev: { 5: 'DetectorConstruction.cc: SetSensitiveDetector("counter", muonSD)\nlogical volume created as "Counter"' },
      why: { en: 'Lower-case "counter" matches no logical volume. You might expect this typo to fail silently; in Geant4 11.4 it is a fatal exception at initialisation, so read the message before anything else. The silent version today is attaching the detector to the wrong volume that does exist.', zh: '小写的 "counter" 找不到对应的逻辑体。你可能以为这个拼写错误会无声地失败；在 Geant4 11.4 中它在初始化时就是致命异常，所以先读报错信息。如今真正无声的版本，是把探测器挂到一个确实存在但错误的体积上。' } },
    { name: 'fault-4', broken: 4,
      report: 'vertical  top fired 0   bottom fired 0   trigger 0\ncos2      top fired 0   bottom fired 0   trigger 0\ncos2_noise trigger 52 (eff 0.0026)\n"The new list is much faster."',
      ev: { 0: '0 out of 20000 where main has 2191: not a fluctuation.',
        3: 'Step#  Z(mm)  KinE(MeV)  dE(MeV)  NextVolume  ProcName\n    1   -105     4e+03       0    Counter  Transportation\n    2    -95     4e+03       0      World  Transportation\n  → the muon crosses the counter and deposits nothing',
        4: '/process/list\n     Transportation,              Decay' },
      why: { en: 'A "lightweight" physics list with decay only: no ionisation, so nothing is ever deposited. The 52 triggers in the noise run are random noise coincidences, a reminder that a non-zero rate does not prove physics is on.', zh: '只有衰变的“轻量”物理列表：没有电离，所以什么也沉积不了。噪声运行中的 52 次触发是噪声的偶然符合，提醒你非零的计数率不能证明物理过程开着。' } },
    { name: 'fault-5', broken: 2,
      report: 'vertical  trigger eff = 0.1100 +/- 0.0022   (main: 0.1095)\ncos2      trigger eff = 0.1003 +/- 0.0021   (main: 0.0127)\nRun finished normally.',
      ev: { 0: 'cos2: (0.1003 - 0.0127)/0.0023 = 38σ  → real',
        2: '-------- WWWW ------- G4Exception-START -------- WWWW -------\n*** G4Exception : GeomVol1002\n      issued by : G4PVPlacement::CheckOverlaps()\nOverlap with volume already placed !\n  Overlap is detected for volume Counter:1 (G4Box) with Counter:0 (G4Box)\n*** This is just a warning message. ***' },
      why: { en: 'The bottom counter was placed at z = −9.5 cm, overlapping the top one at −10 cm. Geant4 printed a warning at construction and ran anyway. The two "counters" now see the same muons, so the cos² coincidence rate rose eightfold. Scroll up to the start of the log.', zh: '下计数器被放到 z = −9.5 cm，与 −10 cm 处的上计数器重叠。Geant4 在构建时打印了警告，然后照常运行。两个“计数器”现在看到的是同一批缪子，cos² 符合率升高了八倍。翻到日志开头去看。' } },
    { name: 'fault-6', broken: 0,
      report: 'vertical  trigger eff = 0.1250 +/- 0.0234   (main: 0.1095 +/- 0.0022)\ncos2_noise trigger eff = 0.0050 +/- 0.0050   (main: 0.0193 +/- 0.0010)\n"Something is off: vertical is 14% high and the noise run is four times low."',
      ev: { 0: 'vertical: (0.1250 - 0.1095) / 0.0234 = 0.7σ\ncos2_noise: expected σ for 200 events = sqrt(0.0193 x 0.981 / 200) = 0.0098 → 1.5σ\n  → trigger.mac: /run/beamOn 200' },
      why: { en: 'Nothing is broken: the run has 200 events instead of 20 000. Both "anomalies" are within 1.5σ. Ask the statistics question first; it costs one line of arithmetic.', zh: '什么都没坏：这次运行只有 200 个事例，而不是 20 000 个。两个“异常”都在 1.5σ 以内。先问统计问题，只需要一行算术。' } }
  ];

  var cur = 0, checked = {}, verdict = null;
  function renderCases() {
    el('w11-cases').innerHTML = CASES.map(function (c, i) { return '<button type="button" id="w11-c' + i + '" class="' + (i === cur ? 'on' : '') + '">' + c.name + '</button>'; }).join('');
    CASES.forEach(function (c, i) { el('w11-c' + i).addEventListener('click', function () { cur = i; checked = {}; verdict = null; renderAll(); }); });
  }
  function renderAll() {
    renderCases();
    var c = CASES[cur];
    el('w11-report').textContent = c.report;
    var n = Object.keys(checked).length;
    el('w11-tree').innerHTML = LAYERS.map(function (L, i) {
      var shown = checked[i], evid = shown ? (c.ev[i] || (i === 0 ? '' : OK[i]) || '') : '';
      if (shown && i === 0 && !c.ev[0]) evid = G.t('No numbers to compare: the run did not finish.', '没有可比较的数字：运行没有结束。');
      var cls = verdict === null ? '' : (i === c.broken ? ' is-broken' : '');
      return '<li class="w11-node' + cls + '"><div class="w11-row"><span class="w11-q"><b>L' + i + '</b> ' + G.bi(L) + ' <small>' + esc(L.how) + '</small></span>' +
        '<span class="w11-act"><button type="button" data-chk="' + i + '"' + (shown ? ' disabled' : '') + '>' + G.t('check', '检查') + '</button>' +
        '<button type="button" data-blame="' + i + '"' + (verdict !== null ? ' disabled' : '') + '>' + G.t('broken here', '坏在这里') + '</button></span></div>' +
        (shown ? '<pre class="w11-ev">' + esc(evid) + '</pre>' : '') + '</li>';
    }).join('');
    Array.prototype.forEach.call(el('w11-tree').querySelectorAll('[data-chk]'), function (b) { b.addEventListener('click', function () { checked[+b.dataset.chk] = 1; renderAll(); }); });
    Array.prototype.forEach.call(el('w11-tree').querySelectorAll('[data-blame]'), function (b) { b.addEventListener('click', function () { verdict = +b.dataset.blame; renderAll(); }); });
    var out = el('w11-verdict');
    if (verdict === null) { out.innerHTML = G.t('Checks used: ', '已用检查次数：') + n; return; }
    var right = verdict === c.broken, skipped = [];
    for (var k = 0; k < c.broken; k++) if (!checked[k] && !(k === 0 && c.broken === 5)) skipped.push('L' + k);
    out.innerHTML = '<span class="' + (right ? 'ok' : 'bad') + '">' + (right ? G.t('Correct: L', '正确：L') + c.broken : G.t('Not L', '不是 L') + verdict + G.t('. The fault is at L', '。故障在 L') + c.broken) + '</span> · ' +
      G.t('checks used: ', '检查次数：') + n + (skipped.length ? ' · <span class="p">' + G.t('skipped before it: ', '在它之前跳过了：') + skipped.join(', ') + '</span>' : '') +
      '<br>' + G.bi(c.why);
  }
  renderAll();

  /* ---- validation ladder ---- */
  var RUNGS = [
    { en: 'executable: runs and produces a defined observable', zh: '可执行：能运行并给出定义明确的可观测量' },
    { en: 'sanity checked: units, limits, geometry, numerical stability', zh: '完整性检查：单位、极限、几何、数值稳定性' },
    { en: 'physics benchmarked: vs an analytic result or established table', zh: '物理基准：与解析结果或公认数据表比较' },
    { en: 'detector benchmarked: response vs independent measurements', zh: '探测器基准：响应与独立测量比较' },
    { en: 'predictively validated: reproduces an observable not used to tune it', zh: '预测性验证：重现未用于调参的可观测量' },
    { en: 'domain qualified: assumptions, uncertainties, failure modes documented', zh: '领域限定：假设、不确定度和失效模式均有记录' }
  ];
  el('w11-rungs').innerHTML = RUNGS.map(function (r, i) { return '<label class="ctl" for="w11-r' + i + '"><span class="ctl-row"><span><b>' + (i + 1) + '</b> ' + G.bi(r) + '</span></span><input type="checkbox" id="w11-r' + i + '"' + (i < 3 ? ' checked' : '') + '></label>'; }).join('');
  var PRE = {
    entry: [2.3938, 0.0014, 2.3086, 0, 0.023],
    path: [2.3938, 0.0014, 2.3966, 0, 0.024],
    trunc: [2.2340, 0.0085, 2.5230, 0, 0.025],
    wide: [2.5138, 0.0571, 2.5230, 0, 0.025],
    book: [1.94, 0.03, 1.98, 0.02, 0.04]
  };
  function calc() {
    var v = ['w11-sim', 'w11-sime', 'w11-ref', 'w11-refs', 'w11-refy'].map(function (id) { return +el(id).value; });
    var comb = Math.sqrt(v[1] * v[1] + v[3] * v[3] + v[4] * v[4]), ns = comb > 0 ? Math.abs(v[0] - v[2]) / comb : NaN;
    var top = -1; for (var i = 0; i < RUNGS.length; i++) { if (el('w11-r' + i).checked) top = i; else break; }
    var gap = []; for (var j = top + 1; j < RUNGS.length; j++) if (el('w11-r' + j).checked) gap.push(j + 1);
    el('w11-out').innerHTML =
      'discrepancy_sigma = |' + v[0] + ' − ' + v[2] + '| / √(' + v[1] + '² + ' + v[3] + '² + ' + v[4] + '²) = <b>' + (isFinite(ns) ? ns.toFixed(1) : '—') + 'σ</b>\n' +
      (ns > 3 ? '<span class="bad">' + G.t('Disagreement. Before blaming the physics: are the two observables the same quantity?', '不一致。在怪物理之前先问：两个可观测量是同一个量吗？') + '</span>\n' : '<span class="ok">' + G.t('Consistent within the stated uncertainties, which is evidence, not proof.', '在给定不确定度内相容，这是证据，不是证明。') + '</span>\n') +
      G.t('Highest rung reached: ', '达到的最高阶：') + (top < 0 ? G.t('none', '无') : (top + 1) + ' · ' + G.t(RUNGS[top].en, RUNGS[top].zh)) +
      (gap.length ? '\n<span class="p">' + G.t('Ticked rungs ', '勾选了第 ') + gap.join(', ') + G.t(' do not count: a ladder is climbed in order.', ' 阶但不算数：阶梯必须按顺序爬。') + '</span>' : '');
  }
  Object.keys(PRE).forEach(function (k) {
    el('w11-p-' + k).addEventListener('click', function () { ['w11-sim', 'w11-sime', 'w11-ref', 'w11-refs', 'w11-refy'].forEach(function (id, i) { el(id).value = PRE[k][i]; }); calc(); });
  });
  ['w11-sim', 'w11-sime', 'w11-ref', 'w11-refs', 'w11-refy'].forEach(function (id) { el(id).addEventListener('input', calc); });
  RUNGS.forEach(function (_, i) { el('w11-r' + i).addEventListener('change', calc); });
  window.addEventListener('g4c:lang', function () { renderAll(); calc(); });
  calc();

  G.quiz(el('quiz'), 'w11', [
    { prompt: { en: 'A colleague says "Geant4 is broken: zero hits." Which question comes first on the tree?', zh: '同事说“Geant4 坏了：零击中。”决策树上先问哪个问题？' },
      opts: [{ en: 'Is the analysis correct?', zh: '分析正确吗？' }, { en: 'Was the particle generated (and where)?', zh: '粒子产生了吗（在哪里）？' }, { en: 'Is the physics list right?', zh: '物理列表对吗？' }, { en: 'Recompile with -O0', zh: '用 -O0 重新编译' }],
      a: 1, why: { en: 'The tree runs in causal order: no particle, nothing downstream can work. One /tracking/verbose 1 event answers it in seconds.', zh: '决策树按因果顺序排列：没有粒子，下游什么都不可能对。一个 /tracking/verbose 1 事例几秒钟就能回答。' } },
    { prompt: { en: 'In Geant4 11.4 the source sits 30 cm outside the world box, aimed inwards. What happens?', zh: '在 Geant4 11.4 中，源位于 world 盒外 30 cm 处并朝内发射，会发生什么？' },
      opts: [{ en: 'Fatal exception Tracking0010', zh: '致命异常 Tracking0010' }, { en: 'The muon is transported through 30 cm of air that does not exist, with no warning', zh: '缪子被输运穿过 30 cm 并不存在的空气，没有任何警告' }, { en: 'Zero tracks', zh: '零条径迹' }, { en: 'The world grows automatically', zh: 'world 自动变大' }],
      a: 1, why: { en: 'Our fault-1 trace: Step 0 at z = −800 mm, NextVolume World, world half-length 500 mm. Only the cos² acceptance changed (0.0127 → 0.0060). The obvious "fix", a gun at −1 m in a 1 m world, is the same accident.', zh: '我们的 fault-1 径迹：第 0 步在 z = −800 mm，NextVolume 为 World，而 world 半长 500 mm。只有 cos² 接受度变了（0.0127 → 0.0060）。显而易见的“修正”——把枪放在 1 m world 的 −1 m 处——是同一个意外。' } },
    { prompt: { en: 'Your efficiency is 0.125 ± 0.023; yesterday\'s was 0.1095 ± 0.0022. Bug?', zh: '你的效率是 0.125 ± 0.023，昨天是 0.1095 ± 0.0022。有 bug 吗？' },
      opts: [{ en: 'Yes: 14% is a big change', zh: '有：14% 变化很大' }, { en: 'No evidence of one: 0.7σ', zh: '没有证据：只有 0.7σ' }, { en: 'Yes: the error bars differ', zh: '有：误差棒不一样' }, { en: 'Cannot tell without the source', zh: '不看源码无法判断' }],
      a: 1, why: { en: '(0.125 − 0.1095)/0.023 = 0.7σ. The error bar is ten times larger because the run had 200 events (fault-6). Ask the statistics question before reading code.', zh: '(0.125 − 0.1095)/0.023 = 0.7σ。误差棒大了十倍，因为这次运行只有 200 个事例（fault-6）。读代码之前先问统计问题。' } },
    { prompt: { en: 'Geant4 gives 2.394 MeV/cm for 100 MeV muons in 10 cm of plastic; PDG lists 2.309 at 100 MeV. 3.7σ. Conclusion?', zh: 'Geant4 给出 100 MeV 缪子在 10 cm 塑料中为 2.394 MeV/cm；PDG 表在 100 MeV 处为 2.309。3.7σ。结论？' },
      opts: [{ en: 'Geant4\'s ionisation model is wrong by 4%', zh: 'Geant4 的电离模型错了 4%' }, { en: 'The observables differ: the muon slows to 76 MeV inside the slab; the path-averaged PDG value is 2.397, and that agrees to 0.1σ', zh: '可观测量不同：缪子在板内减速到 76 MeV；沿路径平均的 PDG 值为 2.397，相差 0.1σ' }, { en: 'Use more events', zh: '多用些事例' }, { en: 'PDG is wrong', zh: 'PDG 错了' }],
      a: 1, why: { en: 'Checking that the simulated and reference observables are the same quantity is part of the comparison, not something done afterwards.', zh: '确认模拟可观测量与参考可观测量是同一个量，本身就是比较的一部分，而不是事后补做的事。' } },
    { prompt: { en: 'At 10 GeV the histogram mean is 11% below PDG (10.9σ), with 99 entries in overflow. Why?', zh: '10 GeV 时直方图均值比 PDG 低 11%（10.9σ），溢出区有 99 个条目。为什么？' },
      opts: [{ en: 'Missing radiative processes', zh: '缺少辐射过程' }, { en: 'The histogram mean ignores overflow: a truncated mean, without the rare large δ-ray losses that the PDG mean includes', zh: '直方图均值忽略溢出：截断均值，不含 PDG 均值所包含的罕见大 δ 电子损失' }, { en: 'Too few events', zh: '事例太少' }, { en: 'Production cuts', zh: '产生阈' }],
      a: 1, why: { en: 'Widening the range to 0–1000 MeV/cm gives 2.514 ± 0.057 against 2.523: 0.1σ. Notice the error grew sevenfold: the mean of a heavy-tailed quantity is expensive.', zh: '把范围放宽到 0–1000 MeV/cm 后得到 2.514 ± 0.057，对比 2.523：0.1σ。注意误差增大了七倍：重尾量的均值代价高昂。' } },
    { prompt: { en: 'Your dE/dx agrees with the PDG table within 0.4σ at five energies. Which rung is that?', zh: '你的 dE/dx 在五个能量点上与 PDG 表相差都在 0.4σ 以内，这是哪一阶？' },
      opts: [{ en: 'Predictively validated', zh: '预测性验证' }, { en: 'Physics benchmarked', zh: '物理基准' }, { en: 'Detector benchmarked', zh: '探测器基准' }, { en: 'Fully validated', zh: '完全验证' }],
      a: 1, why: { en: 'A calculated table over a defined domain: physics benchmarked. Detector benchmarking needs measured detector response (spectrum, threshold, trigger). "Fully validated" is not on the ladder at all.', zh: '在限定范围内对照计算出的数据表：物理基准。探测器基准需要实测的探测器响应（能谱、阈值、触发）。“完全验证”根本不在阶梯上。' } }
  ]);
  G.progress('w11');
  G.pager(el('pager'), 11);
})();
