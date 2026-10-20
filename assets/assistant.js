/* From Track to Truth · optional AI assistant ("bring your own key").

   Where it appears
     · every hands-on lab:            "Stuck? Ask the lab assistant"
     · Week 11 (all labs):            a Socratic debugging tutor that never reveals the fault-lab answers
     · Week 12 labs:                  also "Mock referee" (practice defence scored on Definition 12.2)
     · setup.html (every item):       install troubleshooter

   Your API key — where it goes, and where it never goes
     · It is kept in this browser only: by default in sessionStorage (this tab, forgotten when the
       tab closes); in localStorage only if you tick "Remember on this device".
     · It is sent in one place only: the HTTPS request to the provider you chose (Anthropic or an
       OpenAI-compatible endpoint on the allow-list below). The course has no server and no analytics.
     · It is never written into the page, a URL, a log, an error message or a download.
     · On GitHub Pages a Content-Security-Policy (inserted by every page's head) limits network
       connections to this site and the provider hosts below, so even a mistake in the page could
       not send it elsewhere.
     · Replies are shown as escaped text (a tiny Markdown subset: code blocks, `code`, **bold**,
       lists). No HTML, links or images from a reply are ever rendered, so a reply cannot make the
       browser contact another server.
   Caveat: every page on the same origin (https://<you>.github.io, all your project sites) can read
   that origin's browser storage. Host the course on its own custom domain, or do not tick
   "Remember", if other pages you publish there are not yours to trust.

   What is sent with a question: the text and code of the section you asked from (in your language
   mode), the expected outputs shown there, your message and this conversation. Nothing else. */
(function () {
  'use strict';
  var G = window.G4C; if (!G) return;
  var d = document;

  /* ---------------- providers (keep in sync with the CSP list in tools/shell.py) ---------------- */
  var PROVIDERS = {
    anthropic:   { kind: 'anthropic', label: 'Claude (Anthropic)', base: 'https://api.anthropic.com', model: 'claude-haiku-5-5', keyHint: 'sk-ant-…' },
    deepseek:    { kind: 'openai', label: 'DeepSeek 深度求索', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', keyHint: 'sk-…' },
    moonshot:    { kind: 'openai', label: 'Kimi (Moonshot) 月之暗面', base: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k', keyHint: 'sk-…' },
    qwen:        { kind: 'openai', label: 'Qwen 通义千问 (DashScope)', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', keyHint: 'sk-…' },
    zhipu:       { kind: 'openai', label: 'GLM 智谱', base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', keyHint: '…' },
    siliconflow: { kind: 'openai', label: 'SiliconFlow 硅基流动', base: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3', keyHint: 'sk-…' },
    openai:      { kind: 'openai', label: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', keyHint: 'sk-…' },
    openrouter:  { kind: 'openai', label: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', keyHint: 'sk-or-…' }
  };
  var ALLOWED_HOSTS = ['api.anthropic.com', 'api.deepseek.com', 'api.moonshot.cn', 'dashscope.aliyuncs.com', 'open.bigmodel.cn', 'api.siliconflow.cn', 'api.openai.com', 'openrouter.ai'];
  G.AI_ALLOWED_HOSTS = ALLOWED_HOSTS;

  /* ---------------- storage: settings (no secrets) and the key ---------------- */
  var CFG_KEY = 'g4c.ai.cfg', KEY_KEY = 'g4c.ai.key';
  function ls(op, k, v) { try { return op === 'get' ? localStorage.getItem(k) : op === 'set' ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { return null; } }
  function ss(op, k, v) { try { return op === 'get' ? sessionStorage.getItem(k) : op === 'set' ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) { return null; } }
  var cfg = (function () { var c = null; try { c = JSON.parse(ls('get', CFG_KEY) || 'null'); } catch (e) { /* ignore */ } return Object.assign({ provider: 'anthropic', model: '', base: '', remember: false }, c || {}); })();
  var memKey = ss('get', KEY_KEY) || (cfg.remember ? ls('get', KEY_KEY) : null) || '';
  function prov() { return PROVIDERS[cfg.provider] || PROVIDERS.anthropic; }
  function model() { return cfg.model || prov().model; }
  function base() { return cfg.base || prov().base; }
  function ready() { return !!memKey && !!model(); }
  function saveCfg(c, key) {
    cfg = Object.assign(cfg, c);
    ls('set', CFG_KEY, JSON.stringify({ provider: cfg.provider, model: cfg.model, base: cfg.base, remember: cfg.remember }));
    if (key !== undefined) memKey = key;
    ss('remove', KEY_KEY); ls('remove', KEY_KEY);
    if (memKey) { if (cfg.remember) ls('set', KEY_KEY, memKey); else ss('set', KEY_KEY, memKey); }
  }
  function forget() { memKey = ''; ss('remove', KEY_KEY); ls('remove', KEY_KEY); }
  function hostOf(u) { try { var x = new URL(u); return x.protocol === 'https:' ? x.hostname : ''; } catch (e) { return ''; } }

  /* ---------------- helpers ---------------- */
  function icon(n) { return '<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bi(en, zh) { return G.bi({ en: en, zh: zh }); }
  function t(en, zh) { return G.lang === 'zh' ? zh : en; }
  /* Escaped Markdown subset. Everything is escaped first; only a few tags are produced, never links or images. */
  function md(src) {
    var parts = String(src).split(/```[a-zA-Z0-9_+-]*\n?/), out = '';
    parts.forEach(function (p, i) {
      if (i % 2) { out += '<pre class="ai-pre">' + esc(p.replace(/\n$/, '')) + '</pre>'; return; }
      var lines = esc(p).split('\n'), html = '', list = null;
      lines.forEach(function (ln) {
        var m = ln.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        if (m) { if (!list) { list = /^\s*\d/.test(ln) ? 'ol' : 'ul'; html += '<' + list + '>'; } html += '<li>' + inline(m[1]) + '</li>'; return; }
        if (list) { html += '</' + list + '>'; list = null; }
        if (/^#{1,4}\s/.test(ln)) { html += '<p class="ai-h">' + inline(ln.replace(/^#+\s/, '')) + '</p>'; return; }
        if (ln.trim()) html += '<p>' + inline(ln) + '</p>';
      });
      if (list) html += '</' + list + '>';
      out += html;
    });
    return out;
  }
  function inline(s) { return s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }

  /* ---------------- context: what the assistant may see ---------------- */
  function sectionText(sec) {
    var c = sec.cloneNode(true), lang = G.lang;
    c.querySelectorAll('[data-ai="exclude"], .item-end, .item-tag, script, style, svg, canvas, button, .ai-launch, .evd-fig').forEach(function (e) { e.remove(); });
    c.querySelectorAll('pre[data-src*="make_faults"]').forEach(function (e) { e.textContent = '[script omitted: it contains the fault-lab answers]'; });
    if (lang !== 'both') c.querySelectorAll('[lang]').forEach(function (e) { var l = e.getAttribute('lang'); if ((lang === 'zh' && l === 'en') || (lang === 'en' && l === 'zh-Hans')) e.remove(); });
    c.querySelectorAll('details').forEach(function (e) { e.setAttribute('open', ''); });
    c.querySelectorAll('pre').forEach(function (p) {
      var src = p.getAttribute('data-src'), head = src ? '\n--- file: ' + src.replace(/^code\//, '') + ' ---\n' : '\n--- block ---\n';
      p.textContent = head + p.textContent + '\n--- end ---\n';
    });
    c.querySelectorAll('p, li, h2, h3, tr, div, figcaption').forEach(function (e) { e.insertAdjacentText('afterend', '\n'); });
    return c.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function pageTitle() { var h = d.querySelector('.nav-title [lang="en"]'), w = d.querySelector('#s-complete'); return (w && +w.getAttribute('data-week') ? 'Week ' + w.getAttribute('data-week') + ' · ' : '') + (h ? h.textContent : d.title); }
  function sectionTitle(sec) { var a = d.querySelector('.nav-items a[data-item="' + sec.id + '"] .t [lang="en"]'); return a ? a.textContent : sec.id; }
  var LIMIT = 45000;

  var MODES = {
    lab: {
      en: 'Lab assistant', zh: '实验助手',
      sys: 'You are the teaching assistant of "From Track to Truth", a bilingual course on Geant4 11.4 muon simulation. The student is working on the lab given below. Ground every answer in that course material; when you use general Geant4/C++/physics knowledge instead, say so in a few words. When the student pastes output, compare their numbers with the expected output: judge agreement in units of the stated uncertainty (say if none is stated) and remember the course\'s expected outputs come from a reduced, dataset-free physics list, so FTFP_BERT can differ slightly. For errors, name the likely cause, the file and step to check, and the smallest fix. Never invent run results or numbers that are not in the material or the student\'s message. Be brief: under 250 words unless asked for more. Answer in the language the student writes in.'
    },
    tutor: {
      en: 'Debugging tutor', zh: '调试导师',
      sys: 'You are a Socratic debugging tutor for Week 11 of the From Track to Truth course. Guide the student down the course\'s debugging tree one layer at a time (L0 statistics → L1 generator → L2 geometry → L3 entered the detector → L4 physics → L5 sensitive detector → L6 hit → L7 data → L8 analysis). At each step ask for one concrete piece of evidence (a command to run, a number to read) and interpret what they report. NEVER state which fault a branch contains, never give the fix for a fault-lab branch, and never decode or guess the hidden script; if asked for the answer, decline kindly and give the next question. For the dE/dx validation lab you may explain statistics fully. Be brief. Answer in the language the student writes in.'
    },
    referee: {
      en: 'Mock referee', zh: '模拟审稿人',
      sys: 'You are a demanding but fair referee for the Week 12 defence of the From Track to Truth course. This is practice, not a grade, and you must say so once. Read the student\'s proposal or results when they paste them. Ask up to five hard questions, ONE at a time, about the question, the implementation, the validation, the analysis and the honesty of the claims; wait for each answer. When the student says they are done, score them with the course rubric (Definition 12.2 weights in the material below) giving each criterion a level and one sentence of evidence, then name the single most important improvement. Do not invent facts about their project. Answer in the language the student writes in.'
    },
    setup: {
      en: 'Setup helper', zh: '安装助手',
      sys: 'You help students install the software for the From Track to Truth course using ONLY the routes on the setup page below (conda-forge, the course Docker image, WSL2 on Windows, optional musrSim environment). First make sure you know their OS, the route they chose and the exact error text; then give the smallest next command and how to check it worked. Mention mainland-China mirrors when relevant. Never ask for passwords or keys. Be brief. Answer in the language the student writes in.'
    }
  };
  function modeFor(sec) {
    if (/setup\.html$/.test(location.pathname)) return 'setup';
    var w = d.querySelector('#s-complete'); var wk = w ? +w.getAttribute('data-week') : 0;
    return wk === 11 ? 'tutor' : 'lab';
  }

  /* ---------------- network: the only place the key is used ---------------- */
  var ctl = null;
  function ask(sys, msgs) {
    var p = prov(), b = base(), h = hostOf(p.kind === 'anthropic' ? p.base : b);
    if (!h || ALLOWED_HOSTS.indexOf(h) < 0) return Promise.reject(new Error(t('This endpoint is not on the course allow-list (HTTPS only).', '该接口不在课程允许列表中（仅限 HTTPS）。')));
    ctl = new AbortController(); var timer = setTimeout(function () { ctl.abort(); }, 90000);
    var req;
    if (p.kind === 'anthropic') {
      req = fetch(p.base + '/v1/messages', {
        method: 'POST', signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'content-type': 'application/json', 'x-api-key': memKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: model(), max_tokens: 1200, system: sys, messages: msgs })
      });
    } else {
      req = fetch(b.replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST', signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + memKey },
        body: JSON.stringify({ model: model(), max_tokens: 1200, temperature: 0.3, messages: [{ role: 'system', content: sys }].concat(msgs) })
      });
    }
    return req.then(function (r) {
      return r.text().then(function (txt) {
        var body = null; try { body = JSON.parse(txt); } catch (e) { /* not JSON */ }
        if (!r.ok) {
          var m = body && (body.error && (body.error.message || body.error.type) || body.message) || ('HTTP ' + r.status);
          m = String(m).split(memKey).join('•••').slice(0, 300);          /* never echo the key */
          if (r.status === 401 || r.status === 403) m = t('The provider rejected the key (', '服务商拒绝了该 Key（') + r.status + '). ' + m;
          throw new Error(m);
        }
        var out = p.kind === 'anthropic' ? (body.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('')
          : (body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content) || '';
        return out || t('(empty reply)', '（空回复）');
      });
    }, function (e) {
      if (e && e.name === 'AbortError') throw new Error(t('Stopped.', '已停止。'));
      throw new Error(t('Network error: the provider could not be reached (blocked network, VPN, or CORS not allowed by this provider).', '网络错误：无法连接服务商（网络被阻断、VPN，或该服务商不允许浏览器直接调用）。'));
    }).finally(function () { clearTimeout(timer); ctl = null; });
  }

  /* ---------------- UI ---------------- */
  var panel, state = { sec: null, mode: 'lab', convos: {} };
  function build() {
    if (panel) return;
    panel = d.createElement('div'); panel.className = 'ai-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'ai-title');
    panel.innerHTML =
      '<div class="ai-box">' +
        '<div class="ai-head"><p id="ai-title" class="ai-title">' + icon('quiz') + '<span class="ai-mode"></span></p>' +
          '<button type="button" class="ai-x" data-ai-close aria-label="Close / 关闭">' + icon('close') + '</button></div>' +
        '<p class="ai-ctx"></p>' +
        '<div class="ai-chat" aria-live="polite"></div>' +
        '<form class="ai-form" autocomplete="off">' +
          '<label class="sr" for="ai-in">' + bi('Your message', '你的消息') + '</label>' +
          '<textarea id="ai-in" rows="4" spellcheck="false"></textarea>' +
          '<div class="ai-row"><button type="submit" class="btn-p ai-send">' + bi('Send', '发送') + '</button>' +
          '<button type="button" class="btn-s ai-stop" hidden>' + bi('Stop', '停止') + '</button>' +
          '<button type="button" class="ai-link" data-ai-new>' + bi('New conversation', '新对话') + '</button>' +
          '<button type="button" class="ai-link" data-ai-settings>' + icon('lab') + bi('Settings and key', '设置与 Key') + '</button></div>' +
        '</form>' +
        '<form class="ai-settings" hidden autocomplete="off">' +
          '<p class="ai-sub">' + bi('Optional: bring your own API key', '可选：使用你自己的 API Key') + '</p>' +
          '<label>' + bi('Provider', '服务商') + '<select data-f="provider"></select></label>' +
          '<label>' + bi('API key', 'API Key') + '<input data-f="key" type="password" autocomplete="off" spellcheck="false" name="g4c-ai-' + Math.random().toString(36).slice(2) + '"></label>' +
          '<label>' + bi('Model', '模型') + '<input data-f="model" type="text" spellcheck="false"></label>' +
          '<label class="ai-base">' + bi('Endpoint (OpenAI-compatible)', '接口地址（OpenAI 兼容）') + '<input data-f="base" type="url" spellcheck="false"></label>' +
          '<label class="ai-check"><input data-f="remember" type="checkbox">' + bi('Remember the key on this device (otherwise it is forgotten when this tab closes)', '在本设备上记住 Key（否则关闭此标签页即忘记）') + '</label>' +
          '<div class="ai-row"><button type="submit" class="btn-p">' + bi('Save', '保存') + '</button><button type="button" class="btn-s" data-ai-forget>' + bi('Forget my key', '删除我的 Key') + '</button><button type="button" class="ai-link" data-ai-back>' + bi('Back to chat', '返回对话') + '</button></div>' +
          '<ul class="ai-privacy">' +
            '<li>' + bi('Your key stays in this browser. It is sent only to the provider you choose, over HTTPS, and never to this course site or anyone else. The course has no server and no tracking.', '你的 Key 只保存在本浏览器中，只通过 HTTPS 发送给你选择的服务商，不会发送给本课程网站或任何其他人。本课程没有服务器，也没有任何追踪。') + '</li>' +
            '<li>' + bi('With each question the assistant receives the text and code of the section you asked from, plus your message. Do not paste passwords, keys or confidential data.', '每次提问时，助手会收到你所在小节的文字和代码以及你的消息。请不要粘贴密码、密钥或机密数据。') + '</li>' +
            '<li>' + bi('Usage is billed to your account. Use a personal key with a spending limit, and do not tick "Remember" on a shared computer.', '费用计入你自己的账户。请使用设有消费上限的个人 Key，在公共电脑上不要勾选“记住”。') + '</li>' +
            '<li>' + bi('The assistant can be wrong. The course pages and your own runs are the reference.', '助手可能会出错。以课程页面和你自己的运行结果为准。') + '</li>' +
          '</ul>' +
        '</form>' +
      '</div>';
    d.body.appendChild(panel);
    var sel = panel.querySelector('[data-f="provider"]');
    sel.innerHTML = Object.keys(PROVIDERS).map(function (k) { return '<option value="' + k + '">' + esc(PROVIDERS[k].label) + '</option>'; }).join('');
    sel.addEventListener('change', function () { var p = PROVIDERS[sel.value]; panel.querySelector('[data-f="model"]').value = p.model; panel.querySelector('[data-f="base"]').value = p.kind === 'openai' ? p.base : ''; panel.querySelector('.ai-base').hidden = p.kind !== 'openai'; panel.querySelector('[data-f="key"]').placeholder = p.keyHint; });
    panel.addEventListener('click', function (e) {
      if (e.target === panel || e.target.closest('[data-ai-close]')) close();
      if (e.target.closest('[data-ai-settings]')) showSettings(true);
      if (e.target.closest('[data-ai-back]')) showSettings(false);
      if (e.target.closest('[data-ai-new]')) { state.convos[convKey()] = []; render(); }
      if (e.target.closest('[data-ai-forget]')) { forget(); panel.querySelector('[data-f="key"]').value = ''; note(t('Key deleted from this browser.', '已从本浏览器删除 Key。')); }
      if (e.target.closest('.ai-stop') && ctl) ctl.abort();
    });
    panel.querySelector('.ai-settings').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = function (n) { return panel.querySelector('[data-f="' + n + '"]'); }, p = PROVIDERS[f('provider').value];
      var b = p.kind === 'openai' ? (f('base').value.trim() || p.base) : '';
      if (b && ALLOWED_HOSTS.indexOf(hostOf(b)) < 0) { note(t('That endpoint is not allowed: use HTTPS and a provider from the list.', '该接口不被允许：请使用 HTTPS 和列表中的服务商。')); return; }
      saveCfg({ provider: f('provider').value, model: f('model').value.trim(), base: b === p.base ? '' : b, remember: f('remember').checked }, f('key').value.trim() || undefined);
      f('key').value = ''; showSettings(false);
    });
    panel.querySelector('.ai-form').addEventListener('submit', function (e) { e.preventDefault(); send(); });
    panel.querySelector('#ai-in').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && !panel.hidden) close(); });
  }
  function note(msg) { var c = panel.querySelector('.ai-chat'), p = d.createElement('p'); p.className = 'ai-note'; p.textContent = msg; (panel.querySelector('.ai-settings').hidden ? c : panel.querySelector('.ai-settings')).appendChild(p); }
  function showSettings(on) {
    var s = panel.querySelector('.ai-settings'), f = function (n) { return panel.querySelector('[data-f="' + n + '"]'); };
    s.hidden = !on; panel.querySelector('.ai-form').hidden = on; panel.querySelector('.ai-chat').hidden = on; panel.querySelector('.ai-ctx').hidden = on;
    if (on) {
      s.querySelectorAll('.ai-note').forEach(function (n) { n.remove(); });
      f('provider').value = cfg.provider; var p = prov();
      f('model').value = model(); f('base').value = p.kind === 'openai' ? base() : ''; s.querySelector('.ai-base').hidden = p.kind !== 'openai';
      f('remember').checked = !!cfg.remember; f('key').value = ''; f('key').placeholder = memKey ? t('saved · leave empty to keep', '已保存 · 留空则保留') : p.keyHint;
      f('provider').focus();
    } else panel.querySelector('#ai-in').focus();
    if (on) return;
    renderCtx();
  }
  function convKey() { return location.pathname + '#' + (state.sec ? state.sec.id : '') + ':' + state.mode; }
  function renderCtx() {
    var ctx = panel.querySelector('.ai-ctx'), txt = state.sec ? sectionText(state.sec) : '';
    var files = state.sec ? state.sec.querySelectorAll('pre[data-src]').length : 0;
    ctx.innerHTML = bi('Uses: ', '使用：') + '<b>' + esc(pageTitle() + ' · ' + (state.sec ? sectionTitle(state.sec) : '')) + '</b> · ' +
      bi(files + ' files, ' + Math.min(txt.length, LIMIT).toLocaleString('en') + ' characters', files + ' 个文件，' + Math.min(txt.length, LIMIT).toLocaleString('en') + ' 个字符') +
      ' · ' + (ready() ? esc(prov().label + ' · ' + model()) : '<b>' + bi('no key yet', '尚未设置 Key') + '</b>');
  }
  function render() {
    var c = panel.querySelector('.ai-chat'), conv = state.convos[convKey()] || [];
    var m = MODES[state.mode];
    panel.querySelector('.ai-mode').innerHTML = bi(m.en, m.zh) + ' <span class="ai-opt">' + bi('optional · your key', '可选 · 使用你的 Key') + '</span>';
    var hint = {
      lab: ['Paste your output or error, or ask about a step. The assistant sees this lab’s text, code and expected output.', '粘贴你的输出或报错，或者问某一步。助手能看到本实验的文字、代码和预期输出。'],
      tutor: ['Describe the symptom and paste the evidence. The tutor asks you questions layer by layer and never gives the fault-lab answers.', '描述症状并粘贴证据。导师会逐层向你提问，不会给出故障实验的答案。'],
      referee: ['Paste your proposal or headline result and write "start". The referee asks one question at a time, then scores you on the Definition 12.2 rubric. Practice only.', '粘贴你的提案或主要结果，然后写“开始”。审稿人每次问一个问题，最后按定义 12.2 的评分表打分。仅供练习。'],
      setup: ['Tell it your operating system, the route you chose and paste the exact error.', '告诉它你的操作系统、所选安装方式，并粘贴完整报错。']
    }[state.mode];
    c.innerHTML = (conv.length ? '' : '<p class="ai-note">' + bi(hint[0], hint[1]) + '</p>') + conv.map(function (x) {
      return '<div class="ai-msg ' + x.role + (x.err ? ' err' : '') + '">' + (x.role === 'user' ? '<pre class="ai-pre ai-mine">' + esc(x.content) + '</pre>' : md(x.content)) + '</div>';
    }).join('');
    c.scrollTop = c.scrollHeight;
    renderCtx();
  }
  function open(sec, mode) {
    build(); state.sec = sec; state.mode = mode || modeFor(sec);
    panel.hidden = false; d.documentElement.classList.add('ai-open');
    render(); showSettings(!ready());
  }
  function close() { panel.hidden = true; d.documentElement.classList.remove('ai-open'); if (state.btn) state.btn.focus(); }
  function busy(on) { panel.querySelector('.ai-send').disabled = on; panel.querySelector('.ai-stop').hidden = !on; panel.querySelector('.ai-box').classList.toggle('busy', on); }
  function send() {
    var inp = panel.querySelector('#ai-in'), msg = inp.value.trim(); if (!msg) return;
    if (!ready()) { showSettings(true); return; }
    var k = convKey(), conv = state.convos[k] = state.convos[k] || [];
    conv.push({ role: 'user', content: msg }); inp.value = ''; render(); busy(true);
    var material = state.sec ? sectionText(state.sec).slice(0, LIMIT) : '';
    if (state.mode === 'referee') { var r = d.getElementById('s-def'); if (r) material = (sectionText(r) + '\n\n' + material).slice(0, LIMIT); }
    var sys = MODES[state.mode].sys + '\n\nCOURSE MATERIAL (' + pageTitle() + ' · ' + (state.sec ? sectionTitle(state.sec) : '') + '):\n<<<\n' + material + '\n>>>';
    var msgs = conv.filter(function (x) { return !x.err; }).map(function (x) { return { role: x.role, content: x.content }; }).slice(-16);
    ask(sys, msgs).then(function (out) { conv.push({ role: 'assistant', content: out }); }, function (e) { conv.push({ role: 'assistant', content: '⚠ ' + e.message, err: true }); })
      .then(function () { busy(false); render(); });
  }

  /* ---------------- launch buttons ---------------- */
  function launcher(sec, mode, en, zh, cls) {
    var b = d.createElement('button'); b.type = 'button'; b.className = 'ai-launch ' + (cls || '');
    b.innerHTML = icon('quiz') + bi(en, zh) + '<small>' + bi('optional · your API key', '可选 · 使用你的 API Key') + '</small>';
    b.addEventListener('click', function () { state.btn = b; open(sec, mode); });
    return b;
  }
  function place(sec, btn) {
    var h = sec.querySelector('.dl') || sec.querySelector('h2');
    var wrap = sec.querySelector('.ai-launches');
    if (!wrap) { wrap = d.createElement('div'); wrap.className = 'ai-launches'; if (h) h.insertAdjacentElement('afterend', wrap); else sec.insertBefore(wrap, sec.firstChild); }
    wrap.appendChild(btn);
  }
  function init() {
    if (!d.querySelector('.player')) return;
    var setup = /setup\.html$/.test(location.pathname), w = d.querySelector('#s-complete'), wk = w ? +w.getAttribute('data-week') : 0;
    d.querySelectorAll('main section.item').forEach(function (sec) {
      var type = sec.getAttribute('data-type');
      if (setup) { place(sec, launcher(sec, 'setup', 'Stuck installing? Ask the setup helper', '安装卡住了？问问安装助手')); return; }
      if (type !== 'lab') return;
      if (wk === 11) place(sec, launcher(sec, 'tutor', 'Stuck? Ask the debugging tutor', '卡住了？问问调试导师'));
      else place(sec, launcher(sec, 'lab', 'Stuck? Ask the lab assistant', '卡住了？问问实验助手'));
      if (wk === 12) place(sec, launcher(sec, 'referee', 'Rehearse with a mock referee', '与模拟审稿人演练', 'alt'));
    });
    window.addEventListener('g4c:lang', function () { if (panel && !panel.hidden) render(); });
  }
  G.assistant = { open: open, ready: ready, forget: forget };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
