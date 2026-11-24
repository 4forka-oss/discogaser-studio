/* =====================================================================
   DISCOGASER STUDIO · modelos 3D del equipo (Three.js r158, UMD)
   CDJ-3000, DJM-A9, PLAYdifferently Model 1 y Allen & Heath Xone:96.
   Chasis con bisel + controles en relieve (potes, botones, pads,
   faders, jog y pantalla) colocados donde están en el aparato real.
   La cara superior de cada pieza usa la foto cenital como textura,
   proyectada desde arriba, así se leen serigrafías y colores reales.
   Coordenadas: u (0 izq → 1 der), v (0 fondo → 1 frente) sobre la foto
   original; "crop" es lo recortado arriba en la textura -3d.
   ===================================================================== */
(function () {
  "use strict";

  function cols(list, fn) { var out = []; list.forEach(function (c) { out = out.concat(fn(c)); }); return out; }

  var A9C = [0.303, 0.407, 0.511, 0.615];
  var M1C = [0.203, 0.318, 0.432, 0.546, 0.661, 0.775];
  var XNC = [0.399, 0.507, 0.608, 0.703];

  var SPEC = {
    cdj: {
      src: "img/equipo/cdj-3000-3d.webp", aspect: 0.7256, crop: 0, w: 0.9, h: 0.22,
      side: 0x18181a, metal: 0.65, knob: 0x101010,
      jog: { u: 0.455, v: 0.70, r: 0.30, platter: 0.25, disp: 0.075 },
      screen: { u0: 0.185, u1: 0.815, v0: 0.045, v1: 0.315, lift: 0.075 },
      K: [[0.89, 0.19, 0.042], [0.91, 0.39, 0.02], [0.78, 0.48, 0.018], [0.845, 0.82, 0.018]],
      B: [[0.08, 0.828, 0.05, 1], [0.08, 0.93, 0.05, 1], [0.055, 0.425, 0.028, 1], [0.13, 0.425, 0.028, 1],
          [0.225, 0.425, 0.02], [0.055, 0.49, 0.022], [0.13, 0.49, 0.022], [0.70, 0.425, 0.016], [0.745, 0.425, 0.02], [0.80, 0.425, 0.016]],
      P: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return [0.206 + i * 0.085, 0.37, 0.07, 0.024, 1]; })
           .concat([[0.9, 0.42, 0.06, 0.03], [0.9, 0.49, 0.06, 0.03]]),
      F: [[0.905, 0.82, 0.05, 0.022]]
    },
    a9: {
      src: "img/equipo/djm-a9-3d.webp", aspect: 0.9647, crop: 0.075, w: 1.04, h: 0.2,
      side: 0x17171a, metal: 0.6, knob: 0x0f0f0f,
      screen: { u0: 0.80, u1: 0.955, v0: 0.26, v1: 0.40, lift: 0, flat: true },
      K: cols(A9C, function (c) { return [[c, 0.222, 0.021], [c, 0.29, 0.021], [c, 0.358, 0.021], [c, 0.428, 0.021], [c, 0.522, 0.032]]; })
        .concat([[0.72, 0.145, 0.026], [0.725, 0.465, 0.02], [0.725, 0.545, 0.02], [0.73, 0.735, 0.02], [0.73, 0.80, 0.02],
                 [0.07, 0.23, 0.022], [0.07, 0.30, 0.022], [0.07, 0.38, 0.022], [0.07, 0.445, 0.022], [0.07, 0.66, 0.026], [0.07, 0.785, 0.026],
                 [0.18, 0.66, 0.022], [0.18, 0.785, 0.02], [0.18, 0.87, 0.02], [0.815, 0.155, 0.022], [0.815, 0.22, 0.022],
                 [0.885, 0.605, 0.028], [0.885, 0.775, 0.026], [0.885, 0.855, 0.022]]),
      B: [[0.885, 0.93, 0.03, 1]],
      P: cols(A9C, function (c) { return [[c - 0.02, 0.61, 0.035, 0.02, 1], [c + 0.028, 0.61, 0.028, 0.02]]; })
        .concat([[0.715, 0.61, 0.035, 0.02, 1], [0.17, 0.505, 0.04, 0.022], [0.23, 0.505, 0.04, 0.022], [0.17, 0.55, 0.04, 0.022],
                 [0.23, 0.55, 0.04, 0.022], [0.17, 0.595, 0.04, 0.022], [0.23, 0.595, 0.04, 0.022]]),
      F: cols(A9C, function (c) { return [[c, 0.755, 0.045, 0.016]]; }).concat([[0.46, 0.95, 0.018, 0.04]])
    },
    model1: {
      src: "img/equipo/model-1-3d.webp", aspect: 0.8838, crop: 0.011, w: 1.12, h: 0.18,
      side: 0x141414, metal: 0.55, knob: 0x0d0d0d,
      K: cols(M1C, function (c) { return [[c, 0.083, 0.02], [c - 0.005, 0.167, 0.02], [c - 0.005, 0.235, 0.02], [c, 0.33, 0.032], [c, 0.41, 0.022], [c - 0.01, 0.485, 0.022], [c, 0.575, 0.032]]; })
        .concat([[0.09, 0.085, 0.02], [0.085, 0.215, 0.02], [0.09, 0.315, 0.02], [0.085, 0.46, 0.02], [0.09, 0.57, 0.022], [0.09, 0.655, 0.03], [0.085, 0.74, 0.03], [0.085, 0.85, 0.02],
                 [0.895, 0.27, 0.02], [0.895, 0.36, 0.02], [0.895, 0.43, 0.02], [0.895, 0.50, 0.02], [0.895, 0.60, 0.02], [0.895, 0.66, 0.02], [0.895, 0.72, 0.02], [0.9, 0.80, 0.02]]),
      B: cols(M1C, function (c) { return [[c + 0.026, 0.674, 0.018], [c - 0.013, 0.706, 0.018]]; }).concat([[0.945, 0.955, 0.028, 1]]),
      P: [],
      F: cols(M1C, function (c) { return [[c + 0.032, 0.93, 0.045, 0.018]]; })
    },
    xone: {
      src: "img/equipo/xone-96-3d.webp", aspect: 0.848, crop: 0.03, w: 0.92, h: 0.19,
      side: 0xc8c8c3, metal: 0.75, knob: 0x121212,
      K: cols(XNC.concat([0.085, 0.18]), function (c) {
          var vs = c < 0.3 ? [0.085, 0.148, 0.265, 0.315, 0.385, 0.445, 0.505] : [0.085, 0.148, 0.265, 0.315, 0.38, 0.44, 0.5];
          return vs.map(function (v) { return [c, v, 0.026]; });
        })
        .concat([[0.285, 0.54, 0.026], [0.285, 0.79, 0.03], [0.815, 0.47, 0.02], [0.815, 0.54, 0.026], [0.815, 0.79, 0.03],
                 [0.285, 0.155, 0.022], [0.285, 0.33, 0.022], [0.285, 0.47, 0.02],
                 [0.93, 0.1, 0.024], [0.93, 0.16, 0.024], [0.93, 0.3, 0.02], [0.93, 0.35, 0.02], [0.93, 0.39, 0.02], [0.93, 0.45, 0.022], [0.93, 0.71, 0.022], [0.93, 0.79, 0.022]]),
      B: cols(XNC, function (c) { return [[c, 0.62, 0.03]]; })
        .concat([[0.085, 0.6, 0.03, 1], [0.18, 0.6, 0.03],
                 [0.285, 0.61, 0.028, 1], [0.285, 0.665, 0.028], [0.285, 0.72, 0.028], [0.285, 0.875, 0.028, 1],
                 [0.815, 0.61, 0.028], [0.815, 0.665, 0.028], [0.815, 0.72, 0.028, 1], [0.815, 0.875, 0.028, 1],
                 [0.285, 0.1, 0.016, 1], [0.285, 0.215, 0.027, 1], [0.285, 0.28, 0.016], [0.285, 0.39, 0.027],
                 [0.78, 0.135, 0.02, 1], [0.84, 0.135, 0.02, 1]]),
      P: [],
      F: cols(XNC, function (c) { return [[c, 0.711, 0.05, 0.02]]; }).concat([[0.085, 0.70, 0.05, 0.02], [0.18, 0.77, 0.05, 0.02], [0.51, 0.925, 0.02, 0.045]])
    }
  };

  function dims(key) {
    var s = SPEC[key];
    return { w: s.w, d: s.w / s.aspect, h: s.h };
  }

  var texCache = {};
  function getTex(T, key, o) {
    if (!texCache[key]) {
      var t = new T.TextureLoader().load(SPEC[key].src, o && o.onLoad);
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = (o && o.aniso) || 4;
      texCache[key] = t;
    } else if (o && o.onLoad) { setTimeout(o.onLoad, 0); }
    return texCache[key];
  }

  /* Proyecta la foto desde arriba sobre las caras que miran hacia arriba */
  function mapTop(geo, ox, oz, W, D) {
    var pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
    for (var i = 0; i < pos.count; i++) {
      if (nor.getY(i) > 0.3) {
        uv.setXY(i, (ox + pos.getX(i)) / W + 0.5, 1 - ((oz + pos.getZ(i)) / D + 0.5));
      }
    }
    uv.needsUpdate = true;
  }

  function build(T, key, o) {
    o = o || {};
    var s = SPEC[key], W = s.w, D = W / s.aspect, H = s.h;
    var seg = o.mobile ? 14 : 24;
    var tex = getTex(T, key, o);
    var base = o.glow != null ? o.glow : 0.3;

    var top = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: base, roughness: 0.48, metalness: 0.22 });
    top.userData.k = base;
    var glow = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: base * 2.8, roughness: 0.3, metalness: 0.1 });
    glow.userData.k = base * 2.8;
    var side = new T.MeshStandardMaterial({ color: s.side, metalness: s.metal, roughness: 0.38 });
    var rub = new T.MeshStandardMaterial({ color: s.knob, metalness: 0.15, roughness: 0.72 });
    var btn = new T.MeshStandardMaterial({ color: 0x222224, metalness: 0.3, roughness: 0.5 });
    var cap = new T.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.4 });

    var g = new T.Group();
    var shadows = !o.mobile;
    function add(m) { m.castShadow = shadows; m.receiveShadow = shadows; g.add(m); return m; }
    function P(u, v) { var vc = (v - s.crop) / (1 - s.crop); return { x: (u - 0.5) * W, z: (vc - 0.5) * D }; }
    var dv = D / (1 - s.crop); // de fracción de v original a unidades

    /* Chasis con esquinas redondeadas y bisel */
    var r = 0.035, hw = W / 2, hd = D / 2;
    var sh = new T.Shape();
    sh.moveTo(-hw + r, -hd); sh.lineTo(hw - r, -hd); sh.quadraticCurveTo(hw, -hd, hw, -hd + r);
    sh.lineTo(hw, hd - r); sh.quadraticCurveTo(hw, hd, hw - r, hd); sh.lineTo(-hw + r, hd);
    sh.quadraticCurveTo(-hw, hd, -hw, hd - r); sh.lineTo(-hw, -hd + r); sh.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    var bev = 0.008;
    var cg = new T.ExtrudeGeometry(sh, { depth: H - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 5 });
    cg.rotateX(-Math.PI / 2);
    cg.translate(0, bev, 0);
    mapTop(cg, 0, 0, W, D);
    add(new T.Mesh(cg, [top, side]));
    // pie/goma inferior
    var foot = add(new T.Mesh(new T.BoxGeometry(W * 0.94, 0.012, D * 0.94), rub)); foot.position.y = -0.004;

    var Y = H; // cara superior

    /* Potenciómetros */
    s.K.forEach(function (k) {
      var p = P(k[0], k[1]), rr = k[2] * W, hh = rr > 0.025 ? 0.05 : 0.04;
      var geo = new T.CylinderGeometry(rr * 0.86, rr, hh, seg);
      geo.translate(0, hh / 2, 0);
      mapTop(geo, p.x, p.z, W, D);
      var m = add(new T.Mesh(geo, [rub, top, rub])); m.position.set(p.x, Y, p.z);
      // falda del pote
      var sk = new T.CylinderGeometry(rr * 1.18, rr * 1.22, 0.008, seg);
      sk.translate(0, 0.004, 0);
      mapTop(sk, p.x, p.z, W, D);
      var ms = add(new T.Mesh(sk, [rub, top, rub])); ms.position.set(p.x, Y, p.z);
    });

    /* Botones redondos */
    s.B.forEach(function (b) {
      var p = P(b[0], b[1]), rr = b[2] * W, hh = 0.016;
      var geo = new T.CylinderGeometry(rr, rr * 1.04, hh, seg);
      geo.translate(0, hh / 2, 0);
      mapTop(geo, p.x, p.z, W, D);
      var m = add(new T.Mesh(geo, [btn, b[3] ? glow : top, btn])); m.position.set(p.x, Y, p.z);
    });

    /* Pads / botones rectangulares */
    s.P.forEach(function (q) {
      var p = P(q[0], q[1]), w = q[2] * W, d = q[3] * dv, hh = 0.012;
      var geo = new T.BoxGeometry(w, hh, d);
      geo.translate(0, hh / 2, 0);
      mapTop(geo, p.x, p.z, W, D);
      var tm = q[4] ? glow : top;
      var m = add(new T.Mesh(geo, [btn, btn, tm, btn, btn, btn])); m.position.set(p.x, Y, p.z);
    });

    /* Faders (tapas) */
    s.F.forEach(function (f) {
      var p = P(f[0], f[1]), w = f[2] * W, d = f[3] * dv, hh = 0.04;
      var geo = new T.BoxGeometry(w, hh, d);
      geo.translate(0, hh / 2, 0);
      mapTop(geo, p.x, p.z, W, D);
      var m = add(new T.Mesh(geo, [cap, cap, top, cap, cap, cap])); m.position.set(p.x, Y, p.z);
      var stem = add(new T.Mesh(new T.BoxGeometry(Math.min(w, d) * 0.25, 0.02, Math.min(w, d) * 0.25), cap)); stem.position.set(p.x, Y - 0.005, p.z);
    });

    /* Jog (CDJ) */
    var spin = null;
    if (s.jog) {
      var j = s.jog, pj = P(j.u, j.v);
      var R = j.r * W, Rp = j.platter * W, Rd = j.disp * W;
      var hg = new T.CylinderGeometry(R, R * 1.01, 0.018, seg * 3);
      hg.translate(0, 0.009, 0); mapTop(hg, pj.x, pj.z, W, D);
      var hm = add(new T.Mesh(hg, [side, top, side])); hm.position.set(pj.x, Y, pj.z);
      spin = new T.Group(); spin.position.set(pj.x, Y + 0.018, pj.z); g.add(spin);
      var pg = new T.CylinderGeometry(Rp, Rp, 0.026, seg * 3);
      pg.translate(0, 0.013, 0); mapTop(pg, 0, 0, W, D);
      // la textura del plato se centra en el jog y gira con él
      var uvA = pg.attributes.uv, posA = pg.attributes.position, norA = pg.attributes.normal;
      for (var i = 0; i < posA.count; i++) if (norA.getY(i) > 0.3) uvA.setXY(i, (pj.x + posA.getX(i)) / W + 0.5, 1 - ((pj.z + posA.getZ(i)) / D + 0.5));
      var platMetal = new T.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.95, roughness: 0.25 });
      var pm = new T.Mesh(pg, [platMetal, top, platMetal]); pm.castShadow = shadows; spin.add(pm);
      var dg = new T.CylinderGeometry(Rd, Rd, 0.03, seg * 2);
      dg.translate(0, 0.015, 0); mapTop(dg, pj.x, pj.z, W, D);
      var dm = add(new T.Mesh(dg, [btn, glow, btn])); dm.position.set(pj.x, Y + 0.03, pj.z);
    }

    /* Pantalla (inclinada en el CDJ, a ras en el A9) */
    if (s.screen) {
      var sc = s.screen, a = P(sc.u0, sc.v0), b = P(sc.u1, sc.v1);
      var sw = b.x - a.x, sd = b.z - a.z, cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
      var st = 0.02;
      var sg = new T.BoxGeometry(sw, st, sd);
      mapTop(sg, cx, cz, W, D);
      var smat = [side, side, glow, side, side, side];
      if (sc.flat) {
        var sm = add(new T.Mesh(sg, smat)); sm.position.set(cx, Y + st / 2 - 0.004, cz);
      } else {
        var piv = new T.Group(); piv.position.set(cx, Y, b.z); g.add(piv);
        var ang = Math.atan2(sc.lift, sd);
        piv.rotation.x = ang;
        var sm2 = new T.Mesh(sg, smat); sm2.position.set(0, st / 2, -sd / 2); sm2.castShadow = shadows; piv.add(sm2);
        // carcasa trasera que sostiene la pantalla
        var back = add(new T.Mesh(new T.BoxGeometry(sw, sc.lift + 0.01, 0.03), side));
        back.position.set(cx, Y + (sc.lift + 0.01) / 2, a.z + 0.012);
      }
    }

    mergeStatic(T, g, spin, shadows);
    return { group: g, w: W, d: D, h: H, accents: [top, glow], spin: spin };
  }

  /* Une todas las piezas fijas del aparato en una malla por material
     (de ~100 llamadas de dibujo a ~6). El plato del jog queda aparte porque gira. */
  function mergeStatic(T, g, keep, shadows) {
    g.updateMatrixWorld(true);
    var inv = new T.Matrix4().copy(g.matrixWorld).invert();
    var buckets = {}, order = [], victims = [];
    var m4 = new T.Matrix4(), n3 = new T.Matrix3(), v = new T.Vector3();
    g.traverse(function (o) {
      if (!o.isMesh) return;
      for (var p = o.parent; p; p = p.parent) if (p === keep) return;
      victims.push(o);
      var geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      m4.multiplyMatrices(inv, o.matrixWorld); n3.getNormalMatrix(m4);
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      var groups = geo.groups.length ? geo.groups : [{ start: 0, count: geo.attributes.position.count, materialIndex: 0 }];
      var P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv;
      groups.forEach(function (gr) {
        var mat = mats[gr.materialIndex] || mats[0];
        var b = buckets[mat.uuid];
        if (!b) { b = buckets[mat.uuid] = { mat: mat, p: [], n: [], u: [] }; order.push(mat.uuid); }
        for (var i = gr.start; i < gr.start + gr.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m4); b.p.push(v.x, v.y, v.z);
          v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); b.n.push(v.x, v.y, v.z);
          if (U) b.u.push(U.getX(i), U.getY(i)); else b.u.push(0, 0);
        }
      });
    });
    victims.forEach(function (o) { o.parent.remove(o); o.geometry.dispose(); });
    // los grupos vacíos (pivote de la pantalla) se quitan
    g.children.slice().forEach(function (c) { if (c !== keep && !c.isMesh && c.children.length === 0) g.remove(c); });
    order.forEach(function (id) {
      var b = buckets[id], geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(b.p, 3));
      geo.setAttribute("normal", new T.Float32BufferAttribute(b.n, 3));
      geo.setAttribute("uv", new T.Float32BufferAttribute(b.u, 2));
      var m = new T.Mesh(geo, b.mat); m.castShadow = shadows; m.receiveShadow = shadows;
      g.add(m);
    });
  }

  window.DGSEquipo = { build: build, dims: dims, spec: SPEC };
})();
