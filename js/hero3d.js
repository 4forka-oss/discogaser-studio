/* =====================================================================
   DISCOGASER STUDIO · ambiente 3D del hero (Three.js r158, UMD)
   Haz de luz roja volumétrico, humo y partículas alrededor de la foto
   real de la cabina (que va en HTML, encima). El haz sigue a la foto.
   API: DGS3D.init(canvas, {mobile, target}) → { setActive, setHeroProgress, setPointer }
   ===================================================================== */
(function () {
  "use strict";

  function init(canvas, opts) {
    var T = window.THREE; if (!T) return null;
    opts = opts || {};
    var mobile = !!opts.mobile, target = opts.target || null;
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.setClearColor(0x000000, 0);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(40, 1, 0.1, 60);
    camera.position.set(0, 0, 10);

    function canvasTex(w, h, draw) {
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      draw(c.getContext("2d"), w, h);
      var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
    }
    var dotTex = canvasTex(64, 64, function (g, w) {
      var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    var smokeTex = canvasTex(256, 256, function (g, w) {
      for (var i = 0; i < 16; i++) {
        var x = w / 2 + (Math.random() - 0.5) * w * 0.4, y = w / 2 + (Math.random() - 0.5) * w * 0.4, r = w * (0.18 + Math.random() * 0.22);
        var gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, "rgba(255,255,255,.2)"); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr; g.fillRect(0, 0, w, w);
      }
    });
    var glowTex = canvasTex(256, 256, function (g, w) {
      var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, "rgba(255,40,30,.9)"); gr.addColorStop(0.45, "rgba(216,0,10,.28)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });

    /* Haz de luz (shader con borde suave) */
    var beamMat = new T.ShaderMaterial({
      uniforms: { uColor: { value: new T.Color(0xff1a10) }, uOp: { value: 1 } },
      vertexShader: "varying vec3 vN; varying vec3 vV; varying float vY;\nvoid main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }",
      fragmentShader: "uniform vec3 uColor; uniform float uOp; varying vec3 vN; varying vec3 vV; varying float vY;\nvoid main(){ float rim = pow(abs(dot(vN, vV)), 1.5); float a = rim * mix(0.0, 0.26, pow(vY, 1.1)) * uOp; gl_FragColor = vec4(uColor * a, a); }",
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
    });
    var beam = new T.Mesh(new T.ConeGeometry(2.6, 9, 64, 1, true), beamMat);
    scene.add(beam);
    var beam2 = new T.Mesh(new T.ConeGeometry(1.2, 9, 48, 1, true), beamMat);
    scene.add(beam2);

    /* Reflejo rojo bajo la cabina */
    var pool = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.85 }));
    scene.add(pool);

    /* Partículas de polvo en el haz */
    var N = mobile ? 180 : 480;
    var pg = new T.BufferGeometry(), pos = new Float32Array(N * 3), spd = new Float32Array(N);
    for (var i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = (Math.random() - 0.5) * 10; pos[i * 3 + 2] = (Math.random() - 0.5) * 4; spd[i] = 0.08 + Math.random() * 0.2; }
    pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    var dust = new T.Points(pg, new T.PointsMaterial({ size: 0.07, map: dotTex, color: 0xff5a48, transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
    scene.add(dust);

    /* Humo */
    var smokes = [];
    for (var s = 0; s < (mobile ? 5 : 9); s++) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, color: 0x8a1010, transparent: true, opacity: 0.2, depthWrite: false, blending: T.AdditiveBlending }));
      var sc = 4 + Math.random() * 4; sp.scale.set(sc, sc, 1);
      sp.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 5, -1 - Math.random() * 2);
      sp.userData.v = (Math.random() - 0.5) * 0.12; sp.userData.r = (Math.random() - 0.5) * 0.05;
      scene.add(sp); smokes.push(sp);
    }

    var st = { active: true, hero: 0, px: 0, py: 0, cx: 0, cy: 0, cw: 6 };
    var W = 1, H = 1;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener("resize", resize);

    // pantalla → mundo en el plano z = 0
    function toWorld(px, py) {
      var hh = Math.tan(camera.fov * Math.PI / 360) * camera.position.z, hw = hh * camera.aspect;
      return { x: (px / W * 2 - 1) * hw, y: -(py / H * 2 - 1) * hh, s: hw * 2 / W };
    }
    function track() {
      if (!target) return;
      var r = target.getBoundingClientRect();
      var c = toWorld(r.left + r.width / 2, r.top + r.height * 0.62);
      st.cx = c.x; st.cy = c.y; st.cw = r.width * c.s;
    }

    var clock = new T.Clock(), raf = 0, t = 0;
    function frame() {
      raf = 0;
      var dt = Math.min(clock.getDelta(), 0.05); t += dt;
      track();
      var bh = 9;
      beam.position.set(st.cx, st.cy + bh / 2 - 0.2, 0);
      beam.scale.set(st.cw / 4.2, 1, 1);
      beam2.position.copy(beam.position); beam2.scale.set(st.cw / 5.5, 1, 1);
      pool.position.set(st.cx, st.cy - st.cw * 0.06, -0.5); pool.scale.set(st.cw * 1.25, st.cw * 0.42, 1);
      // pulso a 128 BPM
      var beat = Math.pow(1 - ((t * 128 / 60) % 1), 4);
      beamMat.uniforms.uOp.value = 0.8 + beat * 0.3;
      pool.material.opacity = 0.7 + beat * 0.25;
      // parallax con el ratón
      camera.position.x += (st.px * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (-st.py * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      var pa = pg.attributes.position.array;
      for (var i = 0; i < N; i++) {
        pa[i * 3 + 1] += spd[i] * dt; pa[i * 3] += Math.sin(t * 0.6 + i) * 0.002;
        if (pa[i * 3 + 1] > 5) pa[i * 3 + 1] = -5;
      }
      pg.attributes.position.needsUpdate = true;
      smokes.forEach(function (sp) { sp.position.x += sp.userData.v * dt; if (Math.abs(sp.position.x) > 7) sp.userData.v *= -1; sp.material.rotation += sp.userData.r * dt; });
      renderer.render(scene, camera);
      if (st.active) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (st.active && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); }
    });

    return {
      setActive: function (on) { st.active = on; if (on && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); } },
      setHeroProgress: function (p) { st.hero = p; },
      setPointer: function (x, y) { st.px = x; st.py = y; },
      setCabina: function () {}, setFocus: function () {}
    };
  }

  window.DGS3D = { init: init };
})();
