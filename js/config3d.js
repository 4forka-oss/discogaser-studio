/* =====================================================================
   DISCOGASER STUDIO · cabina 3D del configurador
   Monta en 3D la cabina elegida (2-4 CDJ-3000 + mezclador) con los
   modelos de js/equipo3d.js. Se gira arrastrando. Solo dibuja mientras
   se ve en pantalla.
   API: DGSConfig3D.init(contenedor, {mobile}) → { set({decks, mixer, mode}) }
   ===================================================================== */
(function () {
  "use strict";

  function init(box, opts) {
    var T = window.THREE, EQB = window.DGSEquipo;
    if (!T || !EQB) return null;
    opts = opts || {};
    var mobile = !!opts.mobile;
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.className = "schema3d";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 2, 0.1, 50);

    /* Entorno para reflejos */
    var pmrem = new T.PMREMGenerator(renderer), env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x050505, side: T.BackSide })));
    function envPanel(col, k, w, h, x, y, z) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    }
    envPanel(0xffffff, 2.2, 10, 2, 0, 9, 2);
    envPanel(0xff2020, 2.4, 4, 8, 8, 2, -4);
    envPanel(0xffffff, 1.0, 6, 1, -7, 3, 5);
    scene.environment = pmrem.fromScene(env, 0.04).texture;

    /* Luces: neutras para que el equipo se vea tal cual, con un toque rojo */
    scene.add(new T.HemisphereLight(0xffffff, 0x1a0505, 0.55));
    var key = new T.DirectionalLight(0xffffff, 2.1);
    key.position.set(1.5, 6, 3.5); key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0005;
    scene.add(key);
    var rim = new T.SpotLight(0xff1a10, 22, 0, 0.9, 0.8, 2); rim.position.set(0, 3.5, -3); rim.target.position.set(0, 0, 0); scene.add(rim, rim.target);
    var fill = new T.PointLight(0xff2a20, 4, 0, 2); fill.position.set(0, 0.6, 2.2); scene.add(fill);

    /* Mesa de la cabina */
    var tableMat = new T.MeshStandardMaterial({ color: 0x0f0f0f, metalness: 0.7, roughness: 0.42 });
    var table = new T.Mesh(new T.BoxGeometry(1, 0.08, 1.7), tableMat);
    table.position.y = -0.04; table.receiveShadow = true; scene.add(table);
    var ledMat = new T.MeshStandardMaterial({ color: 0x1a0000, emissive: 0xe1060f, emissiveIntensity: 3 });
    var led = new T.Mesh(new T.BoxGeometry(1, 0.015, 0.015), ledMat); led.position.set(0, -0.03, 0.86); scene.add(led);

    /* Marcadores de DJ delante de la mesa */
    function djSprite(txt, red) {
      var c = document.createElement("canvas"); c.width = c.height = 128;
      var g = c.getContext("2d");
      g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fillStyle = "rgba(20,20,20,.92)"; g.fill();
      g.lineWidth = 8; g.strokeStyle = red ? "#E1060F" : "#9A9A92"; g.stroke();
      g.fillStyle = "#fff"; g.font = "700 36px Inter, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 66);
      var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
      var sp = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false }));
      sp.scale.set(0.26, 0.26, 1); sp.renderOrder = 5; scene.add(sp); return sp;
    }
    var djSolo = djSprite("DJ", true), dj1 = djSprite("DJ1", true), dj2 = djSprite("DJ2", false);

    /* Aparatos (se crean una vez y se reutilizan) */
    var aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var bOpts = { mobile: mobile, aniso: aniso, glow: 0.12, onLoad: function () { dirty = 2; } };
    var cdjs = [], mixers = {}, jogs = [];
    for (var i = 0; i < 4; i++) {
      var c = EQB.build(T, "cdj", bOpts);
      c.group.visible = false; c.group.userData.anim = { x: 0, y: 0, s: 0, tx: 0, ty: 0, ts: 0 };
      scene.add(c.group); cdjs.push(c.group); if (c.spin) jogs.push(c.spin);
    }
    function mixer(k) {
      if (!mixers[k]) {
        var m = EQB.build(T, k, bOpts);
        m.group.visible = false; m.group.userData.anim = { x: 0, y: 0.5, s: 0, tx: 0, ty: 0.5, ts: 0 };
        scene.add(m.group); mixers[k] = m.group;
      }
      return mixers[k];
    }

    var state = { decks: 2, mixer: "a9", mode: "solo" };
    var view = { yaw: 0, pitch: 0.86, tyaw: 0, tpitch: 0.86, dist: 6, tdist: 6, tableW: 3, ttableW: 3 };
    var dirty = 2, running = false, visible = true, t0 = performance.now();

    function layout() {
      var n = state.decks, cw = EQB.dims("cdj").w, gap = 0.04;
      var mk = state.mixer, mw = EQB.dims(mk).w;
      var total = n * cw + mw + n * gap;
      var x = -total / 2, left = Math.ceil(n / 2);
      var targets = [];
      for (var i = 0; i < left; i++) { targets.push(x + cw / 2); x += cw + gap; }
      var mx = x + mw / 2; x += mw + gap;
      for (var j = left; j < n; j++) { targets.push(x + cw / 2); x += cw + gap; }
      cdjs.forEach(function (g, i) {
        var a = g.userData.anim;
        if (i < n) {
          if (!g.visible) { g.visible = true; a.x = targets[i]; a.y = 0.7; a.s = 0.6; }
          a.tx = targets[i]; a.ty = 0; a.ts = 1;
        } else { a.ty = 0.7; a.ts = 0; }
      });
      Object.keys(mixers).concat([mk]).forEach(function (k) {
        var g = mixer(k), a = g.userData.anim;
        if (k === mk) {
          if (!g.visible) { g.visible = true; a.x = mx; a.y = 0.7; a.s = 0.6; }
          a.tx = mx; a.ty = 0; a.ts = 1;
        } else { a.ty = 0.7; a.ts = 0; }
      });
      view.ttableW = total + 0.5;
      // DJ delante de la mesa
      var b2b = state.mode === "b2b";
      djSolo.visible = !b2b; dj1.visible = dj2.visible = b2b;
      djSolo.position.set(0, 0.05, 1.15); dj1.position.set(-0.42, 0.05, 1.15); dj2.position.set(0.42, 0.05, 1.15);
      fit();
      wake();
    }

    function fit() {
      var w = box.clientWidth || 600, h = box.clientHeight || 320;
      var aspect = w / h, vf = camera.fov * Math.PI / 180;
      var hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
      var half = view.ttableW / 2 + 0.15;
      view.tdist = Math.max(half / Math.tan(hf / 2), 1.15 / Math.tan(vf / 2)) * 0.96;
    }

    function resize() {
      var w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      fit(); wake();
    }

    /* Arrastrar para girar (en horizontal; el scroll vertical sigue funcionando en móvil) */
    var drag = null;
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, yaw: view.tyaw, pitch: view.tpitch }; canvas.setPointerCapture(e.pointerId); box.classList.add("is-dragging"); });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      view.tyaw = Math.max(-0.9, Math.min(0.9, drag.yaw - (e.clientX - drag.x) * 0.008));
      view.tpitch = Math.max(0.35, Math.min(1.35, drag.pitch + (e.clientY - drag.y) * 0.005));
      wake();
    });
    function end() { drag = null; box.classList.remove("is-dragging"); }
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);

    function frame(now) {
      running = false;
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      var e = 1 - Math.pow(0.0008, dt), moving = false;
      function ease(o, k, tk) { var d = o[tk] - o[k]; if (Math.abs(d) > 0.0005) { o[k] += d * e; moving = true; } else o[k] = o[tk]; }
      ease(view, "yaw", "tyaw"); ease(view, "pitch", "tpitch"); ease(view, "dist", "tdist"); ease(view, "tableW", "ttableW");
      var all = cdjs.concat(Object.keys(mixers).map(function (k) { return mixers[k]; }));
      all.forEach(function (g) {
        if (!g.visible) return;
        var a = g.userData.anim;
        ease(a, "x", "tx"); ease(a, "y", "ty"); ease(a, "s", "ts");
        g.position.set(a.x, a.y, 0); g.scale.setScalar(Math.max(0.001, a.s));
        if (a.ts === 0 && a.s < 0.02) g.visible = false;
      });
      table.scale.x = view.tableW; led.scale.x = view.tableW - 0.1;
      // giro lento de los jogs
      jogs.forEach(function (j, i) { j.rotation.y -= dt * (i % 2 ? 1.4 : 1.1); });
      var idle = drag ? 0 : Math.sin(now / 2600) * 0.06;
      var yaw = view.yaw + idle, p = view.pitch, d = view.dist;
      camera.position.set(Math.sin(yaw) * Math.cos(p) * d, Math.sin(p) * d + 0.1, Math.cos(yaw) * Math.cos(p) * d + 0.15);
      camera.lookAt(0, 0.05, 0.12);
      renderer.render(scene, camera);
      if (dirty > 0) dirty--;
      if (visible) { running = true; requestAnimationFrame(frame); } // los jogs siguen girando mientras se ve
    }
    function wake() { if (!running && visible) { running = true; t0 = performance.now(); requestAnimationFrame(frame); } }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }, { threshold: 0 }).observe(box);
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(box); else window.addEventListener("resize", resize);
    resize();
    layout();

    return {
      set: function (s) {
        if (!s) return;
        state.decks = s.decks; state.mixer = s.mixer; state.mode = s.mode;
        layout();
      }
    };
  }

  window.DGSConfig3D = { init: init };
})();
