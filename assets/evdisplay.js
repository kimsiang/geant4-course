/* From Track to Truth — shared 3D event display.
   three.js r128 + UnrealBloom + OrbitControls, loaded from pinned CDN URLs only when a display
   scrolls near the viewport. A scene (assets/evd-scenes.js) builds a static detector and returns
   one event at a time: tracks revealed along a timeline with a glowing head, detector elements
   that flash when a particle reaches them, and a HUD. Events loop.
   Behaviour: pauses off-screen and in background tabs; reduced motion shows a still, complete
   event; touch devices do not capture scrolling unless "rotate" is switched on; if WebGL or the
   libraries are unavailable, the GIF poster is shown instead. */
(function () {
  'use strict';
  var EVD = window.EVD = window.EVD || {};
  var scenes = {};
  EVD.scene = function (name, def) { scenes[name] = def; };
  EVD.C = { neg: '#FF6369', neu: '#4FC98A', pos: '#7393FF', hit: '#F2D06B', det: '#5B7690', detHi: '#8FA9C0', ink: '#DCE3E8', mute: '#8FA0AC', white: '#FFFFFF' };

  /* three.js r128 and its example add-ons, self-hosted under assets/vendor/three/ (MIT licence)
     so the displays work where public CDNs are slow or blocked */
  var VENDOR = 'assets/vendor/three/';
  var LIBS = ['three.min.js', 'OrbitControls.js', 'CopyShader.js', 'LuminosityHighPassShader.js',
    'EffectComposer.js', 'RenderPass.js', 'ShaderPass.js', 'UnrealBloomPass.js'].map(function (f) { return VENDOR + f; });
  var libPromise = null;
  function loadLibs() {
    if (libPromise) return libPromise;
    libPromise = LIBS.reduce(function (p, src) {
      return p.then(function () {
        return new Promise(function (res, rej) {
          var s = document.createElement('script'); s.src = src; s.async = false; s.crossOrigin = 'anonymous';
          s.onload = res; s.onerror = function () { rej(new Error('could not load ' + src)); };
          document.head.appendChild(s);
        });
      });
    }, Promise.resolve());
    return libPromise;
  }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  function bi(o) { return '<span lang="en">' + o.en + '</span><span lang="zh-Hans">' + o.zh + '</span>'; }
  EVD.bi = bi;

  /* seeded RNG (mulberry32) */
  function rng(seed) {
    var a = seed >>> 0;
    var f = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.gauss = function () { var u = 1 - f(), v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return f;
  }
  EVD.rng = rng;

  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function Display(el) {
    this.el = el; this.name = el.getAttribute('data-scene'); this.def = scenes[this.name];
    this.running = false; this.visible = false; this.userPaused = false; this.ready = false;
    this.build();
  }

  Display.prototype.build = function () {
    var el = this.el, self = this;
    el.classList.add('evd');
    el.innerHTML =
      '<div class="evd-stage">' +
        '<canvas aria-hidden="true"></canvas><div class="evd-labels"></div>' +
        '<div class="evd-hud"></div><div class="evd-tag"></div>' +
        '<div class="evd-ctl">' +
          '<button type="button" class="evd-play"></button>' +
          '<button type="button" class="evd-next">' + bi({ en: 'next event', zh: '下一事例' }) + '</button>' +
          '<button type="button" class="evd-rot" aria-pressed="false"></button>' +
        '</div>' +
        (el.getAttribute('data-poster') ? '<img class="evd-poster" alt="" src="' + el.getAttribute('data-poster') + '" loading="lazy">' : '') +
        '<p class="evd-msg" hidden></p>' +
      '</div>';
    this.stage = el.querySelector('.evd-stage');
    this.canvas = el.querySelector('canvas');
    this.labelsEl = el.querySelector('.evd-labels');
    this.hudEl = el.querySelector('.evd-hud');
    this.btnPlay = el.querySelector('.evd-play');
    this.btnNext = el.querySelector('.evd-next');
    this.btnRot = el.querySelector('.evd-rot');
    el.querySelector('.evd-tag').innerHTML = this.def ? this.def.tag : '';
    if (el.getAttribute('data-label')) { this.stage.setAttribute('role', 'group'); this.stage.setAttribute('aria-label', el.getAttribute('data-label')); this.canvas.setAttribute('role', 'img'); this.canvas.setAttribute('aria-label', el.getAttribute('data-label')); }
    this.setPlayLabel();
    this.rotOn = !coarse;
    this.setRotLabel();
    this.btnPlay.addEventListener('click', function () { self.userPaused = !self.userPaused; self.setPlayLabel(); self.sync(); });
    this.btnNext.addEventListener('click', function () { if (self.ready) { self.nextEvent(); if (self.userPaused || reduce) self.showStill(); } });
    this.btnRot.addEventListener('click', function () { self.rotOn = !self.rotOn; self.setRotLabel(); if (self.controls) self.controls.enabled = self.rotOn; });
  };
  Display.prototype.setPlayLabel = function () {
    var paused = this.userPaused;
    this.btnPlay.innerHTML = paused ? '▶ ' + bi({ en: 'play', zh: '播放' }) : '❚❚ ' + bi({ en: 'pause', zh: '暂停' });
  };
  Display.prototype.setRotLabel = function () {
    this.btnRot.setAttribute('aria-pressed', this.rotOn ? 'true' : 'false');
    this.btnRot.innerHTML = (this.rotOn ? '⟲ ' : '✋ ') + bi(this.rotOn ? { en: 'drag to rotate', zh: '拖动旋转' } : { en: 'rotate off', zh: '旋转关闭' });
  };

  Display.prototype.fail = function (msg) {
    this.el.classList.add('evd-fallback');
    var m = this.el.querySelector('.evd-msg'); m.hidden = false;
    m.innerHTML = bi({ en: '3D display unavailable here (' + msg + '). Showing the recorded animation.', zh: '此处无法显示 3D（' + msg + '），改为显示录制的动画。' });
  };

  Display.prototype.init = function () {
    var self = this, def = this.def;
    if (!def) { this.fail('no scene'); return; }
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    } catch (e) { this.fail('WebGL'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    var bg = getComputedStyle(document.documentElement).getPropertyValue('--display-bg').trim() || '#10161B';
    renderer.setClearColor(new THREE.Color(bg), 1);
    var scene = new THREE.Scene();
    var cam = def.camera || {};
    var camera = new THREE.PerspectiveCamera(cam.fov || 36, 1.6, cam.near || 0.01, cam.far || 5000);
    camera.position.set.apply(camera.position, cam.pos || [3, 2, 4]);
    var controls = new THREE.OrbitControls(camera, this.canvas);
    controls.target.set.apply(controls.target, cam.target || [0, 0, 0]);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enableZoom = false; controls.enablePan = false;
    controls.autoRotate = !reduce && def.autoRotate !== 0; controls.autoRotateSpeed = def.autoRotate || 0.6;
    controls.enabled = this.rotOn;
    controls.update();
    var composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    var b = def.bloom || {};
    var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), b.strength != null ? b.strength : 0.9, b.radius != null ? b.radius : 0.45, b.threshold != null ? b.threshold : 0.12);
    composer.addPass(bloom);
    Object.assign(this, { renderer: renderer, scene: scene, camera: camera, controls: controls, composer: composer, labels: [], glow: glowTex(), evGroup: null });
    this.A = this.api(scene);
    this.state = {};
    if (def.build) def.build(this.A, this.state);
    this.resize();
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(this.stage);
    else window.addEventListener('resize', function () { self.resize(); });
    window.addEventListener('g4c:lang', function () { self.updateHud(true); });
    this.evIndex = -1;
    this.ready = true;
    this.nextEvent();
    if (reduce) this.showStill();
    this.sync();
  };

  Display.prototype.resize = function () {
    if (!this.renderer) return;
    var w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    if (this.def.camera && this.def.camera.fitWidth) {   // keep a given horizontal extent on narrow screens
      var need = this.def.camera.fitWidth, d = this.camera.position.distanceTo(this.controls.target);
      var vfov = 2 * Math.atan(need / 2 / d / this.camera.aspect) * 180 / Math.PI;
      this.camera.fov = Math.max(this.def.camera.fov || 36, Math.min(80, vfov));
    }
    this.camera.updateProjectionMatrix();
    if (!this.running) this.render();
  };

  /* ---------------------------------------------------------------- helper API for scenes */
  Display.prototype.api = function (root) {
    var self = this;
    function V(p) { return new THREE.Vector3(p[0], p[1], p[2]); }
    function mat(o, line) {
      var m = line ? new THREE.LineBasicMaterial({ color: o.color || EVD.C.det, transparent: true, opacity: o.opacity != null ? o.opacity : 0.5, depthWrite: false })
        : new THREE.MeshBasicMaterial({ color: o.color || EVD.C.det, transparent: true, opacity: o.opacity != null ? o.opacity : 0.15, depthWrite: false, side: THREE.DoubleSide });
      if (o.additive) m.blending = THREE.AdditiveBlending;
      return m;
    }
    var A = {
      THREE: THREE, V: V, C: EVD.C,
      group: function (parent) { var g = new THREE.Group(); (parent || root).add(g); return g; },
      add: function (obj, parent) { (parent || root).add(obj); return obj; },
      box: function (c, s, o) {
        o = o || {}; var g = new THREE.Group(); g.position.set(c[0], c[1], c[2]);
        var geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
        if (o.fill !== false) { var m = new THREE.Mesh(geo, mat({ color: o.fillColor || o.color, opacity: o.fillOpacity != null ? o.fillOpacity : 0.06, additive: o.additive })); g.add(m); g.userData.fill = m; }
        if (o.edges !== false) { var e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat({ color: o.color, opacity: o.opacity != null ? o.opacity : 0.55 }, true)); g.add(e); g.userData.edges = e; }
        (o.parent || root).add(g); return g;
      },
      line: function (pts, o) {
        o = o || {};
        var geo = new THREE.BufferGeometry().setFromPoints(pts.map(V));
        var m = o.dashed ? new THREE.LineDashedMaterial({ color: o.color || EVD.C.det, dashSize: o.dash || 0.05, gapSize: o.gap || 0.04, transparent: true, opacity: o.opacity != null ? o.opacity : 0.6, depthWrite: false })
          : mat(o, true);
        var l = new THREE.Line(geo, m); if (o.dashed) l.computeLineDistances();
        (o.parent || root).add(l); return l;
      },
      segments: function (flat, o) {
        o = o || {}; var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
        var l = new THREE.LineSegments(geo, mat(o, true)); (o.parent || root).add(l); return l;
      },
      sphere: function (c, r, o) {
        o = o || {}; var geo = new THREE.SphereGeometry(r, o.seg || 20, o.seg ? o.seg / 2 : 12);
        var m = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat({ color: o.color, opacity: o.opacity != null ? o.opacity : 0.35 }, true));
        m.position.set(c[0], c[1], c[2]); (o.parent || root).add(m); return m;
      },
      cylinder: function (c, r, len, axis, o) {
        o = o || {}; var geo = new THREE.CylinderGeometry(r, r, len, o.seg || 32, 1, true);
        var g = new THREE.Group(); g.position.set(c[0], c[1], c[2]);
        var w = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), mat({ color: o.color, opacity: o.opacity != null ? o.opacity : 0.4 }, true));
        var f = new THREE.Mesh(geo, mat({ color: o.color, opacity: o.fillOpacity != null ? o.fillOpacity : 0.05 }));
        g.add(w); g.add(f);
        if (axis === 'x') g.rotation.z = Math.PI / 2; else if (axis === 'z') g.rotation.x = Math.PI / 2;
        (o.parent || root).add(g); return g;
      },
      surface: function (fn, x0, x1, z0, z1, nx, nz, o) {   // wireframe height field y = fn(x, z)
        o = o || {}; var flat = [];
        for (var i = 0; i <= nx; i++) for (var j = 0; j <= nz; j++) {
          var x = x0 + (x1 - x0) * i / nx, z = z0 + (z1 - z0) * j / nz;
          if (i < nx) { var xa = x0 + (x1 - x0) * (i + 1) / nx; flat.push(x, fn(x, z), z, xa, fn(xa, z), z); }
          if (j < nz) { var za = z0 + (z1 - z0) * (j + 1) / nz; flat.push(x, fn(x, z), z, x, fn(x, za), za); }
        }
        return A.segments(flat, o);
      },
      arrow: function (from, dir, len, o) {
        o = o || {}; var a = new THREE.ArrowHelper(V(dir).normalize(), V(from), len, new THREE.Color(o.color || EVD.C.mute).getHex(), o.head || len * 0.25, o.headW || len * 0.12);
        a.line.material.transparent = true; a.line.material.opacity = o.opacity != null ? o.opacity : 0.7;
        a.cone.material.transparent = true; a.cone.material.opacity = o.opacity != null ? o.opacity : 0.7;
        (o.parent || root).add(a); return a;
      },
      sprite: function (p, size, color, o) {
        o = o || {};
        var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: self.glow, color: new THREE.Color(color || '#fff'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: o.opacity != null ? o.opacity : 1 }));
        s.position.set(p[0], p[1], p[2]); s.scale.set(size, size, 1); (o.parent || root).add(s); return s;
      },
      label: function (p, text, cls) {
        var d = document.createElement('div'); d.className = 'lbl' + (cls ? ' ' + cls : '');
        d.innerHTML = typeof text === 'string' ? text : bi(text);
        self.labelsEl.appendChild(d); var L = { el: d, p: V(p), owner: self.evBuilding ? 'event' : 'static' };
        self.labels.push(L); return L;
      }
    };
    return A;
  };

  /* ---------------------------------------------------------------- events and timeline */
  Display.prototype.nextEvent = function () {
    var self = this;
    if (this.evGroup) {
      this.scene.remove(this.evGroup);
      this.evGroup.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    this.labels = this.labels.filter(function (L) { if (L.owner === 'event') { L.el.remove(); return false; } return true; });
    this.evIndex++;
    this.evGroup = new THREE.Group(); this.scene.add(this.evGroup);
    var Ae = Object.assign({}, this.A), g = this.evGroup;
    ['box', 'line', 'segments', 'sphere', 'cylinder', 'arrow', 'sprite'].forEach(function (k) {
      var f = self.A[k];
      Ae[k] = function () { var a = Array.prototype.slice.call(arguments); var last = a[a.length - 1];
        if (last && typeof last === 'object' && !Array.isArray(last)) { last.parent = last.parent || g; } else { a.push({ parent: g }); }
        return f.apply(null, a); };
    });
    Ae.add = function (o) { g.add(o); return o; };
    this.evBuilding = true;
    var E = this.def.event(this.evIndex, Ae, this.state);
    this.evBuilding = false;
    E.tracks = (E.tracks || []).map(function (T) { return self.makeTrack(T, g); });
    E.hits = (E.hits || []).map(function (H) { return self.makeHit(H, g); });
    E.hold = E.hold != null ? E.hold : 1.6;
    this.E = E; this.t = 0; this.hudT = -1;
    this.applyTime(0);
    this.updateHud(true);
  };

  Display.prototype.makeTrack = function (T, g) {
    var pts = T.pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    var L = cum[cum.length - 1] || 1;
    var N = Math.max(2, Math.min(400, T.samples || 160));
    var dense = [], k = 0;
    for (var j = 0; j < N; j++) {
      var s = L * j / (N - 1);
      while (k < cum.length - 2 && cum[k + 1] < s) k++;
      var seg = cum[k + 1] - cum[k], f = seg > 0 ? (s - cum[k]) / seg : 0;
      dense.push(pts[k].clone().lerp(pts[Math.min(k + 1, pts.length - 1)], Math.max(0, Math.min(1, f))));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(dense);
    var m = T.dashed ? new THREE.LineDashedMaterial({ color: T.color, dashSize: T.dash || L / 40, gapSize: T.gap || L / 60, transparent: true, opacity: T.opacity != null ? T.opacity : 0.9, depthWrite: false })
      : new THREE.LineBasicMaterial({ color: T.color, transparent: true, opacity: T.opacity != null ? T.opacity : 0.95, depthWrite: false });
    var line = new THREE.Line(geo, m); if (T.dashed) line.computeLineDistances();
    g.add(line);
    var head = null;
    if (T.head !== false) {
      head = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: new THREE.Color(T.headColor || '#ffffff'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      var hs = T.headSize || L / 30; head.scale.set(hs, hs, 1); g.add(head);
    }
    return { T: T, line: line, head: head, dense: dense, N: N };
  };

  Display.prototype.makeHit = function (H, g) {
    var o;
    if (H.box) {
      o = new THREE.Group(); o.position.set(H.pos[0], H.pos[1], H.pos[2]);
      var geo = new THREE.BoxGeometry(H.box[0], H.box[1], H.box[2]);
      var fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: H.color || EVD.C.hit, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      var edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: H.color || EVD.C.hit, transparent: true, opacity: 0, depthWrite: false }));
      o.add(fill); o.add(edge); g.add(o);
      return { H: H, fill: fill, edge: edge };
    }
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: new THREE.Color(H.color || EVD.C.hit), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    s.position.set(H.pos[0], H.pos[1], H.pos[2]); g.add(s);
    return { H: H, sprite: s };
  };

  Display.prototype.applyTime = function (t) {
    var E = this.E;
    E.tracks.forEach(function (R) {
      var T = R.T, t0 = T.t0 || 0, t1 = T.t1 != null ? T.t1 : t0 + 1;
      var f = t <= t0 ? 0 : t >= t1 ? 1 : (t - t0) / (t1 - t0);
      var n = Math.round(f * (R.N - 1));
      R.line.geometry.setDrawRange(0, f > 0 ? n + 1 : 0);
      if (R.head) { R.head.visible = f > 0 && f < 1; R.head.position.copy(R.dense[Math.min(n, R.N - 1)]); }
      if (T.fadeAfter != null && t > T.fadeAfter) R.line.material.opacity = Math.max(T.fadeTo != null ? T.fadeTo : 0.25, (T.opacity != null ? T.opacity : 0.95) - (t - T.fadeAfter) * 0.8);
    });
    E.hits.forEach(function (R) {
      var H = R.H, age = t - H.t, a = 0;
      if (age >= 0) a = (H.steady != null ? H.steady : 0.35) + (1 - (H.steady != null ? H.steady : 0.35)) * Math.exp(-age * (H.decay || 3));
      if (R.fill) { R.fill.material.opacity = a * (H.fillMax || 0.6); R.edge.material.opacity = a; }
      else { R.sprite.material.opacity = a; var sz = (H.size || 0.05) * (age >= 0 ? 1 + 1.5 * Math.exp(-age * 5) : 0); R.sprite.scale.set(sz + 1e-6, sz + 1e-6, 1); }
    });
    if (E.update) E.update(t);
  };

  Display.prototype.updateHud = function (force) {
    if (!this.E || !this.E.hud) return;
    var bucket = Math.floor(this.t * 10);
    if (!force && bucket === this.hudT) return;
    this.hudT = bucket;
    this.hudEl.innerHTML = this.E.hud(this.t, this.state);
  };

  Display.prototype.showStill = function () {
    this.t = this.E.dur;
    this.applyTime(this.t); this.updateHud(true); this.render();
  };

  Display.prototype.render = function () {
    if (!this.renderer) return;
    this.controls.update();
    this.composer.render();
    var w = this.stage.clientWidth, h = this.stage.clientHeight, cam = this.camera;
    this.labels.forEach(function (L) {
      var v = L.p.clone().project(cam);
      var vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      L.el.style.display = vis ? '' : 'none';
      if (vis) L.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px) translate(-50%,-50%)';
    });
  };

  Display.prototype.sync = function () {
    var want = this.ready && this.visible && !document.hidden && !this.userPaused;
    if (want && !this.running) { this.running = true; this.last = performance.now(); this.loop(); }
    else if (!want) this.running = false;
  };

  Display.prototype.loop = function () {
    if (!this.running) return;
    var self = this, now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.t += dt * (this.def.speed || 1);
    if (this.t > this.E.dur + this.E.hold) this.nextEvent();
    this.applyTime(this.t);
    this.updateHud(false);
    this.render();
    requestAnimationFrame(function () { self.loop(); });
  };

  function boot() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
    if (!els.length) return;
    var displays = els.map(function (el) { return new Display(el); });
    if (reduce) displays.forEach(function (d) { d.userPaused = true; d.setPlayLabel(); });   // still frame until the reader presses play
    function start(d) {
      if (d.started) return; d.started = true;
      loadLibs().then(function () {
        if (!window.THREE || !THREE.OrbitControls || !THREE.UnrealBloomPass) throw new Error('three.js');
        d.init();
      }).catch(function (e) { d.fail(e && e.message && /WebGL/.test(e.message) ? 'WebGL' : (window.G4C && G4C.t ? G4C.t('libraries blocked', '库加载失败') : 'libraries blocked')); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var d = displays[els.indexOf(en.target)];
          d.visible = en.isIntersecting;
          if (en.isIntersecting) start(d);
          d.sync();
        });
      }, { rootMargin: '200px 0px' });
      els.forEach(function (el) { io.observe(el); });
    } else displays.forEach(function (d) { d.visible = true; start(d); });
    document.addEventListener('visibilitychange', function () { displays.forEach(function (d) { d.sync(); }); });
    EVD.displays = displays;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
