/* Geant4 2.0 course pages — shared script.
   Language toggle, course manifest + navigation, ROOT-style canvas plots, quiz engine,
   copy buttons and per-viewer progress (localStorage, convenience only). */
(function () {
  'use strict';
  var G = window.G4C = window.G4C || {};

  /* ---------------- storage (may throw or be empty: always optional) ---------------- */
  G.load = function (k, d) { try { var v = localStorage.getItem('g4c.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  G.save = function (k, v) { try { localStorage.setItem('g4c.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

  /* ---------------- course manifest (proposed mapping, pending approval) ---------------- */
  G.stages = [
    { id: 1, en: 'See it', zh: '观测' },
    { id: 2, en: 'Measure it', zh: '度量' },
    { id: 3, en: 'Understand it', zh: '理解' },
    { id: 4, en: 'Build it', zh: '建造' },
    { id: 5, en: 'Trust it', zh: '取信' }
  ];
  G.weeks = [
    { n: 1,  stage: 1, ch: '1',     file: 'week01.html', live: true,  en: 'A Monte Carlo primer', zh: '蒙特卡罗入门' },
    { n: 2,  stage: 1, ch: '2',     file: 'week02.html', live: true,  en: 'Run, Event, Track, Step', zh: '运行、事件、径迹、步' },
    { n: 3,  stage: 1, ch: '3–4',   file: 'week03.html', live: true,  en: 'Geometry, materials and steps', zh: '几何、材料与步' },
    { n: 4,  stage: 2, ch: '5',     file: 'week04.html', live: true,  en: 'Energy loss and Bethe–Bloch', zh: '能量损失与 Bethe–Bloch 公式' },
    { n: 5,  stage: 2, ch: '6',     file: 'week05.html', live: true,  en: 'From energy deposit to a hit', zh: '从能量沉积到击中' },
    { n: 6,  stage: 3, ch: '7',     file: 'week06.html', live: true,  en: 'Physics lists and production cuts', zh: '物理列表与产生阈' },
    { n: 7,  stage: 3, ch: '8',     file: 'week07.html', live: true,  en: 'Momentum from a magnetic field', zh: '用磁场测量动量' },
    { n: 8,  stage: 4, ch: '9',     file: 'week08.html', live: true,  en: 'The full analysis chain', zh: '完整分析链' },
    { n: 9,  stage: 4, ch: '10–11', file: 'week09.html', live: false, en: 'musrSim and the t1 tree', zh: 'musrSim 与 t1 树' },
    { n: 10, stage: 4, ch: '12',    file: 'week10.html', live: false, en: 'Transverse-field μSR capstone', zh: '横场 μSR 综合实验' },
    { n: 11, stage: 5, ch: '13–14', file: 'week11.html', live: false, en: 'Debug and validate', zh: '调试与验证' },
    { n: 12, stage: 5, ch: '15–16', file: 'week12.html', live: false, en: 'Proposal and defence', zh: '选题与答辩' }
  ];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  G.pad = pad;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* bilingual inline markup; strings are authored by us, so HTML inside them is allowed */
  G.bi = function (o) { return '<span lang="en">' + o.en + '</span><span lang="zh-Hans">' + o.zh + '</span>'; };

  /* ---------------- language ---------------- */
  var LANGS = ['en', 'zh', 'both'];
  function initialLang() {
    var s = G.load('lang', null);
    if (LANGS.indexOf(s) >= 0) return s;
    var n = (navigator.language || 'en').toLowerCase();
    return n.indexOf('zh') === 0 ? 'zh' : 'en';
  }
  G.setLang = function (l) {
    if (LANGS.indexOf(l) < 0) l = 'en';
    document.documentElement.setAttribute('data-lang', l);
    document.documentElement.setAttribute('lang', l === 'zh' ? 'zh-Hans' : 'en');
    document.querySelectorAll('[data-setlang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-setlang') === l)); });
    G.save('lang', l);
    G.lang = l;
    window.dispatchEvent(new CustomEvent('g4c:lang', { detail: l }));
  };
  /* text for canvas labels, which cannot show both languages: English unless zh-only */
  G.t = function (en, zh) { return G.lang === 'zh' ? zh : en; };
  G.setLang(initialLang());

  /* ---------------- canvas helpers ---------------- */
  G.css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };
  G.size = function (c) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return [x, w, h];
  };
  /* redraw hooks: theme, language and resize */
  var hooks = [];
  G.onRedraw = function (fn) { hooks.push(fn); };
  function redraw() { hooks.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(redraw, 80); });
  window.addEventListener('g4c:lang', redraw);
  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', redraw); }
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* seeded RNG (mulberry32) so a page always reproduces the same "run" after Reset */
  G.rng = function (seed) {
    var a = seed >>> 0;
    var f = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.gauss = function () { var u = 1 - f(), v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return f;
  };

  var FONT = '11px "IBM Plex Mono", ui-monospace, monospace';
  function niceStep(range, target) {
    var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  G.niceStep = niceStep;
  function decimals(step) { return Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); }

  /* ROOT-style stat box drawn on a canvas */
  G.statBox = function (x, R, T, title, rows) {
    var fg = G.css('--fg'), frame = G.css('--frame'), panel = G.css('--panel');
    x.font = FONT;
    var bw = 26;
    rows.forEach(function (r) { bw = Math.max(bw, x.measureText(r[0]).width + x.measureText(r[1]).width + 30); });
    bw = Math.max(bw, x.measureText(title).width + 20);
    var lh = 15, bh = lh * (rows.length + 1) + 6, bx = R - bw - 6, by = T + 6;
    x.fillStyle = panel; x.fillRect(bx, by, bw, bh);
    x.strokeStyle = frame; x.lineWidth = 1; x.strokeRect(bx + .5, by + .5, bw, bh);
    x.beginPath(); x.moveTo(bx, by + lh + 3.5); x.lineTo(bx + bw, by + lh + 3.5); x.stroke();
    x.fillStyle = fg; x.textAlign = 'center'; x.fillText(title, bx + bw / 2, by + 14);
    rows.forEach(function (r, j) {
      x.textAlign = 'left'; x.fillText(r[0], bx + 8, by + 14 + (j + 1) * lh + 3);
      x.textAlign = 'right'; x.fillText(r[1], bx + bw - 8, by + 14 + (j + 1) * lh + 3);
    });
    x.textAlign = 'left';
  };

  /* ROOT-style 1D histogram (step line, inward ticks, stat box).
     o: {bins:[], lo, hi, xlabel, ylabel, name, stats:[[k,v]...], curve: fn(xc)->expected count, curveLabel} */
  G.hist = function (c, o) {
    var r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    var muted = G.css('--muted'), frame = G.css('--frame'), col = G.css('--hist'), panel = G.css('--panel'), neu = G.css('--neu');
    x.fillStyle = panel; x.fillRect(0, 0, w, h);
    var L = 46, R = w - 10, T = 10, B = h - 32, nb = o.bins.length;
    var max = Math.max(1, Math.max.apply(null, o.bins));
    if (o.curve) for (var q = 0; q < nb; q++) max = Math.max(max, o.curve(o.lo + (q + 0.5) * (o.hi - o.lo) / nb));
    max *= 1.18;
    var bw = (R - L) / nb;
    x.lineWidth = 1.4; x.strokeStyle = col; x.fillStyle = col + '22';
    x.beginPath(); x.moveTo(L, B);
    for (var i = 0; i < nb; i++) { var y = B - o.bins[i] / max * (B - T); x.lineTo(L + i * bw, y); x.lineTo(L + (i + 1) * bw, y); }
    x.lineTo(R, B); x.closePath(); x.fill(); x.stroke();
    if (o.curve) {
      x.save(); x.strokeStyle = neu; x.setLineDash([5, 4]); x.lineWidth = 1.4; x.beginPath();
      for (var p = 0; p <= 120; p++) { var xv = o.lo + p / 120 * (o.hi - o.lo), yv = B - o.curve(xv) / max * (B - T); if (p) x.lineTo(L + p / 120 * (R - L), yv); else x.moveTo(L, yv); }
      x.stroke(); x.restore();
    }
    x.strokeStyle = frame; x.lineWidth = 1; x.strokeRect(L + .5, T + .5, R - L - 1, B - T);
    x.fillStyle = muted; x.font = FONT; x.textAlign = 'center';
    var st = niceStep(o.hi - o.lo, Math.max(3, Math.floor((R - L) / 80))), dg = decimals(st);
    for (var v = Math.ceil(o.lo / st) * st; v <= o.hi + 1e-12; v += st) {
      var tx = L + (v - o.lo) / (o.hi - o.lo) * (R - L);
      x.beginPath(); x.moveTo(tx, B); x.lineTo(tx, B - 8); x.stroke();
      x.fillText(v.toFixed(dg), tx, B + 14);
      var hx = tx + (st / 2) / (o.hi - o.lo) * (R - L);
      if (hx < R) { x.beginPath(); x.moveTo(hx, B); x.lineTo(hx, B - 4); x.stroke(); }
    }
    x.textAlign = 'right'; x.fillText(o.xlabel || '', R, h - 2);
    var ys = niceStep(max, 4);
    for (var cc = ys; cc < max; cc += ys) {
      var ty = B - cc / max * (B - T);
      x.beginPath(); x.moveTo(L, ty); x.lineTo(L + 7, ty); x.stroke();
      x.fillText(String(+cc.toFixed(6)), L - 6, ty + 4);
    }
    if (o.ylabel) { x.save(); x.translate(11, T); x.rotate(-Math.PI / 2); x.textAlign = 'right'; x.fillText(o.ylabel, 0, 0); x.restore(); }
    if (o.stats) G.statBox(x, R, T, o.name || 'h1', o.stats);
    if (o.curve && o.curveLabel) { x.fillStyle = neu; x.textAlign = 'left'; x.fillText('- - ' + o.curveLabel, L + 8, T + 16); }
    x.textAlign = 'left';
  };

  /* ROOT TGraph-style log–log plot: points + optional theory line.
     o: {xlo, xhi, ylo, yhi, pts:[[x,y]], line: fn(x)->y, xlabel, ylabel, lineLabel} */
  G.loglog = function (c, o) {
    var r = G.size(c), x = r[0], w = r[1], h = r[2];
    if (!w) return;
    var muted = G.css('--muted'), frame = G.css('--frame'), col = G.css('--neg'), panel = G.css('--panel'), neu = G.css('--neu'), fg = G.css('--fg');
    x.fillStyle = panel; x.fillRect(0, 0, w, h);
    var L = 50, R = w - 12, T = 10, B = h - 32;
    var lx0 = Math.log10(o.xlo), lx1 = Math.log10(o.xhi), ly0 = Math.log10(o.ylo), ly1 = Math.log10(o.yhi);
    function X(v) { return L + (Math.log10(v) - lx0) / (lx1 - lx0) * (R - L); }
    function Y(v) { return B - (Math.log10(v) - ly0) / (ly1 - ly0) * (B - T); }
    x.save(); x.beginPath(); x.rect(L, T, R - L, B - T); x.clip();
    if (o.line) {
      x.strokeStyle = neu; x.setLineDash([5, 4]); x.lineWidth = 1.4; x.beginPath();
      for (var p = 0; p <= 60; p++) { var xv = Math.pow(10, lx0 + p / 60 * (lx1 - lx0)), yv = o.line(xv); if (p) x.lineTo(X(xv), Y(yv)); else x.moveTo(X(xv), Y(yv)); }
      x.stroke(); x.setLineDash([]);
    }
    o.pts.forEach(function (pt, i) {
      var px = X(pt[0]), py = Y(pt[1]);
      if (pt[2]) { x.strokeStyle = col; x.lineWidth = 1; x.beginPath(); x.moveTo(px, Y(Math.max(o.ylo, pt[1] - pt[2]))); x.lineTo(px, Y(pt[1] + pt[2])); x.stroke(); }
      x.fillStyle = i === o.pts.length - 1 ? col : fg; x.beginPath(); x.arc(px, py, i === o.pts.length - 1 ? 4 : 3, 0, 2 * Math.PI); x.fill();
    });
    x.restore();
    x.strokeStyle = frame; x.lineWidth = 1; x.strokeRect(L + .5, T + .5, R - L - 1, B - T);
    x.fillStyle = muted; x.font = FONT;
    for (var e = Math.ceil(lx0); e <= Math.floor(lx1); e++) {
      var tx = X(Math.pow(10, e));
      x.beginPath(); x.moveTo(tx, B); x.lineTo(tx, B - 8); x.stroke();
      x.textAlign = 'center'; x.fillText('10' + sup(e), tx, B + 14);
      for (var m = 2; m < 10; m++) { var mx = X(m * Math.pow(10, e)); if (mx < R) { x.beginPath(); x.moveTo(mx, B); x.lineTo(mx, B - 4); x.stroke(); } }
    }
    for (var f = Math.ceil(ly0); f <= Math.floor(ly1); f++) {
      var ty = Y(Math.pow(10, f));
      x.beginPath(); x.moveTo(L, ty); x.lineTo(L + 8, ty); x.stroke();
      x.textAlign = 'right'; x.fillText('10' + sup(f), L - 6, ty + 4);
      for (var n = 2; n < 10; n++) { var ny = Y(n * Math.pow(10, f)); if (ny > T) { x.beginPath(); x.moveTo(L, ny); x.lineTo(L + 4, ny); x.stroke(); } }
    }
    x.textAlign = 'right'; x.fillText(o.xlabel || '', R, h - 2);
    if (o.ylabel) { x.save(); x.translate(11, T); x.rotate(-Math.PI / 2); x.textAlign = 'right'; x.fillText(o.ylabel, 0, 0); x.restore(); }
    if (o.lineLabel) { x.fillStyle = neu; x.textAlign = 'right'; x.fillText('- - ' + o.lineLabel, R - 8, T + 16); }
    x.textAlign = 'left';
  };
  function sup(e) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(e).split('').map(function (ch) { return m[ch]; }).join(''); }

  /* ---------------- quiz engine ----------------
     qs: [{prompt:{en,zh}, opts:[{en,zh}], a: index, why:{en,zh}}] */
  G.quiz = function (root, key, qs) {
    var saved = G.load('quiz.' + key, {});
    var scoreEl = document.createElement('div'); scoreEl.className = 'score';
    function render() {
      root.innerHTML = '';
      var box = document.createElement('div'); box.className = 'quiz';
      qs.forEach(function (q, qi) {
        var d = document.createElement('div'); d.className = 'q';
        d.innerHTML = '<p class="q-head">Q' + (qi + 1) + ' / ' + qs.length + '</p><p class="q-prompt">' + G.bi(q.prompt) + '</p>';
        var ops = document.createElement('div'); ops.className = 'q-opts'; ops.setAttribute('role', 'group');
        var fb = document.createElement('div'); fb.className = 'q-fb'; fb.setAttribute('aria-live', 'polite');
        q.opts.forEach(function (op, oi) {
          var b = document.createElement('button'); b.type = 'button'; b.id = 'q-' + key + '-' + qi + '-' + oi;
          b.innerHTML = '<span class="o">' + 'abcdef'[oi] + '</span>' + G.bi(op);
          b.addEventListener('click', function () { saved[qi] = oi; G.save('quiz.' + key, saved); show(qi, ops, fb); tally(); });
          ops.appendChild(b);
        });
        d.appendChild(ops); d.appendChild(fb); box.appendChild(d);
        if (saved[qi] !== undefined) show(qi, ops, fb);
      });
      root.appendChild(box); root.appendChild(scoreEl); tally();
    }
    function show(qi, ops, fb) {
      var q = qs[qi], pick = saved[qi], ok = pick === q.a;
      Array.prototype.forEach.call(ops.children, function (b, oi) {
        b.disabled = true; b.classList.toggle('right', oi === q.a); b.classList.toggle('wrong', oi === pick && !ok);
        b.setAttribute('aria-pressed', String(oi === pick));
      });
      fb.innerHTML = '<b class="' + (ok ? 'right' : 'wrong') + '">' + (ok ? G.bi({ en: 'Correct.', zh: '正确。' }) : G.bi({ en: 'Not quite. The answer is (' + 'abcdef'[q.a] + ').', zh: '不对。正确答案是 (' + 'abcdef'[q.a] + ')。' })) + '</b>' +
        '<p lang="en">' + q.why.en + '</p><p lang="zh-Hans">' + q.why.zh + '</p>';
    }
    function tally() {
      var n = 0, right = 0;
      qs.forEach(function (q, i) { if (saved[i] !== undefined) { n++; if (saved[i] === q.a) right++; } });
      scoreEl.innerHTML = '<span>' + G.bi({ en: 'Answered <b>' + n + '/' + qs.length + '</b> · correct <b>' + right + '</b>', zh: '已答 <b>' + n + '/' + qs.length + '</b> · 答对 <b>' + right + '</b>' }) + '</span>';
      var rb = document.createElement('button'); rb.type = 'button'; rb.className = 'btn'; rb.id = 'quiz-reset-' + key;
      rb.innerHTML = G.bi({ en: 'Try again', zh: '重新作答' });
      rb.addEventListener('click', function () { saved = {}; G.save('quiz.' + key, saved); render(); });
      scoreEl.appendChild(rb);
    }
    render();
  };

  /* ---------------- copy buttons: <button class="copy" data-copy="id-of-pre"> ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.copy'); if (!b) return;
    if (b.closest('summary')) e.preventDefault();
    var pre = document.getElementById(b.getAttribute('data-copy')); if (!pre) return;
    var text = pre.textContent;
    function done(msg) { var old = b.getAttribute('data-label') || b.textContent; b.setAttribute('data-label', old); b.textContent = msg; setTimeout(function () { b.textContent = old; }, 1400); }
    function fallback() { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done(G.t('Selected · press Ctrl+C', '已选中 · 按 Ctrl+C')); }
    try { navigator.clipboard.writeText(text).then(function () { done(G.t('Copied', '已复制')); }, fallback); } catch (err) { fallback(); }
  });
  /* language buttons */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-setlang]'); if (b) G.setLang(b.getAttribute('data-setlang'));
  });
  document.querySelectorAll('[data-setlang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-setlang') === G.lang)); });

  /* ---------------- progress checkboxes: <input type=checkbox data-progress="w01" id="..."> ---------------- */
  G.progress = function (key) {
    var boxes = document.querySelectorAll('input[data-progress="' + key + '"]');
    var st = G.load('progress.' + key, {});
    var out = document.querySelector('[data-progress-out="' + key + '"]');
    function upd() {
      var n = 0; boxes.forEach(function (b) { if (b.checked) n++; var li = b.closest('li'); if (li) li.classList.toggle('is-done', b.checked); });
      if (out) out.innerHTML = G.bi({ en: '<b>' + n + ' of ' + boxes.length + '</b> steps done (saved in this browser only)', zh: '已完成 <b>' + n + ' / ' + boxes.length + '</b> 步（仅保存在本浏览器）' });
      G.save('progress.' + key + '.count', [n, boxes.length]);
    }
    boxes.forEach(function (b) { b.checked = !!st[b.id]; b.addEventListener('change', function () { st[b.id] = b.checked; G.save('progress.' + key, st); upd(); }); });
    upd();
  };

  /* ---------------- pager + course index ---------------- */
  function stageOf(w) { return G.stages[w.stage - 1]; }
  G.pager = function (el, n) {
    var i = n - 1, prev = G.weeks[i - 1], next = G.weeks[i + 1];
    function cell(w, cls, fallback) {
      if (!w) return '<a class="' + cls + '" href="' + fallback.href + '"><small>' + G.bi(fallback.small) + '</small><strong>' + G.bi(fallback.title) + '</strong></a>';
      var small = { en: (cls === 'prev' ? '← ' : '') + 'Week ' + pad(w.n) + (cls === 'next' ? ' →' : ''), zh: (cls === 'prev' ? '← ' : '') + '第 ' + pad(w.n) + ' 周' + (cls === 'next' ? ' →' : '') };
      if (!w.live) { small = { en: small.en + ' · in preparation', zh: small.zh + ' · 准备中' }; return '<span class="' + cls + ' off" aria-disabled="true"><small>' + G.bi(small) + '</small><strong>' + G.bi(w) + '</strong></span>'; }
      return '<a class="' + cls + '" href="' + w.file + '"><small>' + G.bi(small) + '</small><strong>' + G.bi(w) + '</strong></a>';
    }
    var idx = { href: 'index.html', small: { en: '← Course index', zh: '← 课程目录' }, title: { en: 'All 12 weeks', zh: '全部 12 周' } };
    el.innerHTML = cell(prev, 'prev', idx) + cell(next, 'next', idx);
  };
  G.weekList = function (el) {
    var html = '', last = 0;
    G.weeks.forEach(function (w) {
      if (w.stage !== last) { var s = stageOf(w); html += '<div class="wk-stage"><b>' + s.id + ' · ' + s.en + '</b> ' + s.zh + '</div>'; last = w.stage; }
      var prog = G.load('progress.w' + pad(w.n) + '.count', null);
      var st = w.live ? (prog && prog[0] ? G.bi({ en: prog[0] + '/' + prog[1] + ' steps', zh: prog[0] + '/' + prog[1] + ' 步' }) : G.bi({ en: 'open', zh: '已开放' })) : G.bi({ en: 'in preparation', zh: '准备中' });
      var inner = '<span class="num">W' + pad(w.n) + '</span><span class="t">' + G.bi(w) + '<span class="ch">' + G.bi({ en: 'Textbook ch. ' + w.ch, zh: '教材第 ' + w.ch + ' 章' }) + '</span></span><span class="st' + (w.live ? ' live' : '') + '">' + st + '</span>';
      html += w.live ? '<a class="wk-row" href="' + w.file + '">' + inner + '</a>' : '<div class="wk-row">' + inner + '</div>';
    });
    el.innerHTML = html;
  };
})();
