/* Week 09 — toy musrSim macro parser and geometry builder (Week 9 lesson).
   TOY, not musrSim. It reads "/musr/command construct" lines with the grammar documented in the
   musrsim-sms tutorial and source (box: half-x half-y half-z; tubs: rmin rmax half-z phi0 dphi;
   positions local to the mother; mother named log_<name>; sensitivity musr/ScintSD or dead;
   integer volume ID), draws an x–z side view and checks the rules the lesson teaches. It does not
   run Geant4, place rotations, or know fork-specific solids (e.g. GPDcollimator), which it skips. */
(function () {
  'use strict';
  var G = window.G4C;
  var el = function (id) { return document.getElementById(id); };
  var PRESETS = {
    first: '# first_sim.mac (the same file as in the lab)\n# ---- GEOMETRY (half-lengths in mm) ----\n/musr/command construct box World 500 500 500 G4_AIR 0 0 0 no_logical_volume norot dead -1\n/musr/command construct box Slab 50 50 5 G4_PLASTIC_SC_VINYLTOLUENE 0 0 0 log_World norot musr/ScintSD 1\n# ---- OUTPUT ----\n/musr/command SetOutputFileName DEFAULT\n/musr/command storeOnlyEventsWithHits true\n# ---- BEAM ----\n/gun/primaryparticle mu+\n/gun/vertex 0 0 -100 mm\n/gun/vertexsigma 5 5 0 mm\n/gun/momentum 29.8 MeV\n/gun/muonPolarizVector 0 0 -1\n/gun/muonPolarizFraction 1\n/gun/decaytimelimits -1 -1 2197.03 ns\n# ---- GO (no /run/initialize: musrSim initialises in C++) ----\n/run/beamOn 2000',
    tf: '# tf_musr.mac geometry (Week 10)\n/musr/command construct box World 400 400 400 G4_AIR 0 0 0 no_logical_volume norot dead -1\n/musr/command construct box Target 15 15 3 G4_Cu 0 0 0 log_World norot dead 5\n/musr/command construct box CounterU 40 3 40 G4_PLASTIC_SC_VINYLTOLUENE 0 45 0 log_World norot musr/ScintSD 11\n/musr/command construct box CounterD 40 3 40 G4_PLASTIC_SC_VINYLTOLUENE 0 -45 0 log_World norot musr/ScintSD 1\n/musr/command globalfield TF 400 400 400 uniform 0 0 0 log_World 0.01 0 0 0 0 0\n/run/beamOn 200000',
    order: '# broken: a daughter before its mother, and a stray /run/initialize\n/musr/command construct box World 500 500 500 G4_AIR 0 0 0 no_logical_volume norot dead -1\n/musr/command construct box Wrapping 1 52 52 G4_MYLAR 0 0 0 log_Slab norot dead 2\n/musr/command construct box Slab 50 50 5 G4_PLASTIC_SC_VINYLTOLUENE 0 0 0 log_World norot musr/ScintSD 1\n/run/initialize\n/run/beamOn 2000',
    full: '# broken: full lengths typed as half-lengths (a 100 x 100 x 10 mm slab wanted)\n/musr/command construct box World 100 100 100 G4_AIR 0 0 0 no_logical_volume norot dead -1\n/musr/command construct box Slab 100 100 10 G4_PLASTIC_SC_VINYLTOLUENE 0 0 0 log_World norot musr/ScintSD 1\n/musr/command construct box Slab2 100 100 10 G4_PLASTIC_SC_VINYLTOLUENE 0 0 40 log_World norot musr/ScintSD 1'
  };

  function parse(text) {
    var vols = {}, order = [], msgs = [], ids = {};
    text.split('\n').forEach(function (raw, ln) {
      var line = raw.trim();
      if (!line || line[0] === '#') return;
      var t = line.split(/\s+/);
      if (t[0] === '/run/initialize') { msgs.push(['warn', 'line ' + (ln + 1) + ': /run/initialize in a musrSim macro. musrSim initialises in its C++ layer; remove this line.']); return; }
      if (t[0] !== '/musr/command' || t[1] !== 'construct') return;
      var solid = t[2], name = t[3], nd = solid === 'box' ? 3 : solid === 'tubs' ? 5 : -1;
      if (nd < 0) { msgs.push(['info', 'line ' + (ln + 1) + ': solid "' + solid + '" is not drawn by this toy (fork-specific or not supported here).']); return; }
      var need = 4 + nd + 1 + 3 + 4;
      if (t.length < need) { msgs.push(['bad', 'line ' + (ln + 1) + ': ' + name + ' has ' + t.length + ' fields, ' + need + ' expected for a ' + solid + '.']); return; }
      var dims = t.slice(4, 4 + nd).map(Number), k = 4 + nd;
      var v = { name: name, solid: solid, dims: dims, mat: t[k], pos: t.slice(k + 1, k + 4).map(Number), mother: t[k + 4], rot: t[k + 5], sens: t[k + 6], id: +t[k + 7], line: ln + 1 };
      v.half = solid === 'box' ? { x: dims[0], y: dims[1], z: dims[2] } : { x: dims[1], y: dims[1], z: dims[2] };
      if (v.mother === 'no_logical_volume') { if (name !== 'World') msgs.push(['bad', 'line ' + v.line + ': only World may have no mother.']); v.abs = v.pos.slice(); }
      else {
        var mname = v.mother.replace(/^log_/, '');
        if (!/^log_/.test(v.mother)) msgs.push(['bad', 'line ' + v.line + ': mother "' + v.mother + '" must be written log_<name>.']);
        var m = vols[mname];
        if (!m) { msgs.push(['bad', 'line ' + v.line + ': mother ' + v.mother + ' is not defined yet. Daughters must come AFTER their mother.']); v.abs = v.pos.slice(); }
        else {
          v.abs = [m.abs[0] + v.pos[0], m.abs[1] + v.pos[1], m.abs[2] + v.pos[2]];
          var out = ['x', 'y', 'z'].filter(function (a, i) { return Math.abs(v.pos[i]) + v.half[a] > m.half[a] + 1e-9; });
          if (out.length) msgs.push(['bad', 'line ' + v.line + ': ' + name + ' sticks out of ' + mname + ' along ' + out.join(', ') + '. Remember: the numbers are HALF-lengths.']);
        }
      }
      if (v.id > 0) { if (ids[v.id]) msgs.push(['warn', 'line ' + v.line + ': volume ID ' + v.id + ' is also used by ' + ids[v.id] + '. Hits from both will share det_ID ' + v.id + '.']); else ids[v.id] = name; }
      if (vols[name]) msgs.push(['bad', 'line ' + v.line + ': a volume called ' + name + ' already exists.']);
      vols[name] = v; order.push(v);
    });
    if (!vols.World) msgs.push(['bad', 'no World volume: construct World first, with mother no_logical_volume.']);
    if (!msgs.some(function (m) { return m[0] === 'bad'; })) msgs.unshift(['ok', order.length + ' volumes parsed; every daughter fits in its mother.']);
    return { vols: order, msgs: msgs };
  }

  var st;
  function draw() {
    var c = el('w9-display'), r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    x.fillStyle = G.css('--display-bg'); x.fillRect(0, 0, w, h);
    var world = st.vols.filter(function (v) { return v.name === 'World'; })[0] || st.vols[0];
    if (!world) return;
    var sx = (w - 40) / (2 * world.half.z * 1.08), sy = (h - 40) / (2 * world.half.x * 1.08), s = Math.min(sx, sy);
    var cx = w / 2, cy = h / 2;
    var Z = function (z) { return cx + z * s; }, X = function (v) { return cy - v * s; };
    var MONO = '"IBM Plex Mono", ui-monospace, monospace';
    st.vols.forEach(function (v) {
      var x0 = Z(v.abs[2] - v.half.z), y0 = X(v.abs[0] + v.half.x), ww = 2 * v.half.z * s, hh = 2 * v.half.x * s;
      var sens = /ScintSD/.test(v.sens), isW = v.name === 'World';
      x.fillStyle = isW ? 'rgba(220,227,232,0.03)' : sens ? 'rgba(115,147,255,0.35)' : 'rgba(220,227,232,0.18)';
      x.strokeStyle = isW ? 'rgba(220,227,232,0.45)' : sens ? '#7393FF' : 'rgba(220,227,232,0.6)';
      x.lineWidth = 1;
      x.fillRect(x0, y0, Math.max(ww, 1), Math.max(hh, 1)); x.strokeRect(x0 + .5, y0 + .5, Math.max(ww, 1), Math.max(hh, 1));
      x.fillStyle = sens ? '#7393FF' : 'rgba(220,227,232,0.75)'; x.font = '10px ' + MONO; x.textAlign = 'left';
      var lab = v.name + (v.id > 0 ? ' · ID ' + v.id : '');
      x.fillText(lab, isW ? x0 + 6 : x0 + Math.max(ww, 1) + 4, isW ? y0 + 14 : y0 + Math.max(hh, 1) / 2 + 3);
    });
    x.fillStyle = 'rgba(220,227,232,0.5)'; x.textAlign = 'left';
    x.fillText(G.t('side view: z → (beam), x ↑ · mm, drawn from HALF-lengths', '侧视图：z →（束流），x ↑ · mm，按半长绘制'), 10, h - 10);
  }
  function table() {
    var rows = st.vols.map(function (v) {
      var full = v.solid === 'box' ? (2 * v.dims[0]) + ' × ' + (2 * v.dims[1]) + ' × ' + (2 * v.dims[2]) : 'Ø' + (2 * v.dims[1]) + ' × ' + (2 * v.dims[2]);
      return '<tr><td class="n">' + v.name + '</td><td>' + v.solid + ' ' + v.dims.join(' ') + '</td><td>' + full + ' mm</td><td class="m">' + v.mother + '</td><td class="m">' + v.sens + '</td><td>' + v.id + '</td></tr>';
    }).join('');
    el('w9-table').innerHTML = '<thead><tr><th>' + G.t('volume', '体积') + '</th><th>' + G.t('as typed (half)', '输入值（半长）') + '</th><th>' + G.t('full size', '全尺寸') + '</th><th>mother</th><th>' + G.t('sensitivity', '灵敏性') + '</th><th>ID</th></tr></thead><tbody>' + rows + '</tbody>';
    el('w9-msgs').innerHTML = st.msgs.map(function (m) { return '<span class="' + (m[0] === 'bad' ? 'bad' : m[0] === 'ok' ? 'ok' : m[0] === 'warn' ? 'p' : 'c') + '">' + m[1] + '</span>'; }).join('\n');
  }
  function run() { st = parse(el('w9-macro').value); draw(); table(); }
  G.onRedraw(function () { if (st) { draw(); table(); } });
  el('w9-macro').addEventListener('input', function () { clearTimeout(run.t); run.t = setTimeout(run, 250); });
  document.querySelectorAll('[data-w9preset]').forEach(function (b) { b.addEventListener('click', function () { el('w9-macro').value = PRESETS[b.getAttribute('data-w9preset')]; run(); }); });
  el('w9-macro').value = PRESETS.first;
  run();

  /* jagged-array demo: mask first, then flatten */
  var EVJ = [{ id: [1, 11], e: [4.12, 1.74] }, { id: [11], e: [1.62] }, { id: [], e: [] }, { id: [201, 1, 11], e: [3.98, 1.81, 2.05] }, { id: [1], e: [1.55] }];
  function jag() {
    var want = +el('w9-det').value;
    var rows = EVJ.map(function (ev, i) { return '<tr><td class="wk">' + i + '</td><td>' + ev.id.length + '</td><td>[' + ev.id.join(', ') + ']</td><td>[' + ev.e.map(function (v) { return v.toFixed(2); }).join(', ') + ']</td><td>[' + ev.id.map(function (d) { return d === want; }).join(', ') + ']</td></tr>'; }).join('');
    el('w9-jag').innerHTML = '<thead><tr><th>event</th><th>det_n</th><th>det_ID</th><th>det_edep [MeV]</th><th>det_ID == ' + want + '</th></tr></thead><tbody>' + rows + '</tbody>';
    var right = []; EVJ.forEach(function (ev) { ev.id.forEach(function (d, k) { if (d === want) right.push(ev.e[k].toFixed(2)); }); });
    el('w9-right').textContent = 'ak.flatten(d.det_edep[mask])  →  [' + right.join(', ') + ']';
    var flatN = EVJ.reduce(function (a, ev) { return a + ev.id.length; }, 0);
    el('w9-wrong').textContent = 'ak.flatten(d.det_edep)[mask]  →  IndexError: a jagged mask (5 events) cannot index a flat array of ' + flatN + ' hits';
  }
  el('w9-det').addEventListener('change', jag); jag();

  G.quiz(el('quiz'), 'w09', [
    { prompt: { en: '<code>/musr/command construct box Slab 50 50 5 …</code> builds a slab of what size?', zh: '<code>/musr/command construct box Slab 50 50 5 …</code> 构建的板有多大？' },
      opts: [{ en: '50 × 50 × 5 mm', zh: '50 × 50 × 5 mm' }, { en: '100 × 100 × 10 mm', zh: '100 × 100 × 10 mm' }, { en: '50 × 50 × 5 cm', zh: '50 × 50 × 5 cm' }, { en: 'It depends on the material', zh: '取决于材料' }],
      a: 1, why: { en: 'Box dimensions are half-lengths in mm, exactly as for G4Box. So World 500 500 500 is a 1 m cube.', zh: '盒子的尺寸是以 mm 为单位的半长，与 G4Box 完全一样。所以 World 500 500 500 是一个 1 m 的立方体。' } },
    { prompt: { en: 'You run 50 jobs with <code>../musrSim 201.mac job$i $i</code> and the original 201.mac. What do you get?', zh: '用原始 201.mac 运行 50 个作业：<code>../musrSim 201.mac job$i $i</code>。会得到什么？' },
      opts: [{ en: '50 independent samples', zh: '50 个独立样本' }, { en: '50 identical samples: the seed offset is ignored unless the macro says /musr/run/randomOption 1', zh: '50 个完全相同的样本：除非宏中写了 /musr/run/randomOption 1，否则种子偏移被忽略' }, { en: 'A crash', zh: '程序崩溃' }, { en: 'Only job 1 runs', zh: '只运行作业 1' }],
      a: 1, why: { en: 'In musrsim-sms the offset enters only the randomOption 1 branch (seeds from system time + 100 × offset). 201.mac uses randomOption 2, which seeds every event with its event number, the same in every job. Merging them multiplies the file size, not the statistics.', zh: '在 musrsim-sms 中，偏移只在 randomOption 1 分支起作用（种子 = 系统时间 + 100 × 偏移）。201.mac 使用 randomOption 2，用事例号为每个事例设种子，每个作业都一样。合并它们只会增加文件大小，不会增加统计量。' } },
    { prompt: { en: 'Which line selects the energy deposits of detector 11 correctly?', zh: '哪一行能正确选出探测器 11 的能量沉积？' },
      opts: [{ en: '<code>ak.flatten(d.det_edep)[d.det_ID == 11]</code>', zh: '<code>ak.flatten(d.det_edep)[d.det_ID == 11]</code>' }, { en: '<code>ak.flatten(d.det_edep[d.det_ID == 11])</code>', zh: '<code>ak.flatten(d.det_edep[d.det_ID == 11])</code>' }, { en: '<code>d.det_edep[11]</code>', zh: '<code>d.det_edep[11]</code>' }, { en: '<code>np.asarray(d.det_edep)[11]</code>', zh: '<code>np.asarray(d.det_edep)[11]</code>' }],
      a: 1, why: { en: 'The mask has the same jagged shape as det_edep, so apply it first and flatten second. Flattening first destroys the event structure; awkward then raises an IndexError, as our run shows. d.det_edep[11] is event number 11, not detector 11.', zh: '掩码与 det_edep 具有相同的锯齿结构，所以先掩码、再展平。先展平会破坏事例结构，awkward 随即抛出 IndexError（见我们的运行）。d.det_edep[11] 是第 11 个事例，不是探测器 11。' } },
    { prompt: { en: 'What is muDecayTime = −1000?', zh: 'muDecayTime = −1000 表示什么？' },
      opts: [{ en: 'A muon that decayed before it was produced', zh: '一个在产生前就衰变的缪子' }, { en: 'A sentinel: not defined for this event', zh: '哨兵值：该事例中未定义' }, { en: 'A time in nanoseconds', zh: '以纳秒为单位的时间' }, { en: 'A decay in volume −1000', zh: '在体积 −1000 中衰变' }],
      a: 1, why: { en: 'musrSim initialises event-level branches to −1000 each event. Remove sentinels before any statistic: in our synthetic test the mean decay time came out −57.96 µs with them and 2.184 µs without.', zh: 'musrSim 每个事例都把事例级分支初始化为 −1000。做任何统计之前先去掉哨兵值：在我们的合成测试中，保留它们时平均衰变时间为 −57.96 µs，去掉后为 2.184 µs。' } },
    { prompt: { en: 'Your macro is <code>run/201.mac</code> and you start <code>../musrSim run/201.mac</code>. Which output file appears?', zh: '宏文件是 <code>run/201.mac</code>，你执行 <code>../musrSim run/201.mac</code>。会生成哪个输出文件？' },
      opts: [{ en: 'data/musrSim_201.root', zh: 'data/musrSim_201.root' }, { en: 'data/musrSim_0.root, because the run number is atoi() of the whole argument', zh: 'data/musrSim_0.root，因为运行号是整个参数的 atoi()' }, { en: 'run/musrSim_201.root', zh: 'run/musrSim_201.root' }, { en: 'No file', zh: '没有文件' }],
      a: 1, why: { en: 'musrSim.cc takes the run number as atoi(argv[1]); atoi("run/201.mac") is 0. Run from the directory that holds 201.mac, and create data/ first, or ROOT cannot open the file.', zh: 'musrSim.cc 用 atoi(argv[1]) 作为运行号，而 atoi("run/201.mac") 为 0。请在 201.mac 所在目录运行，并先建立 data/ 目录，否则 ROOT 无法创建文件。' } }
  ]);
  G.progress('w09');
  G.pager(el('pager'), 9);
})();
