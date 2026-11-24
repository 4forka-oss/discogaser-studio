/* =====================================================================
   DISCOGASER STUDIO · cabina del configurador con fotos reales
   Las fotos cenitales oficiales se colocan sobre una mesa en perspectiva
   (CSS 3D): cada aparato tiene grosor (frontal y laterales) y sombra.
   La cabina se inclina siguiendo el ratón y los aparatos caen a su sitio.
   Sin WebGL ni librerías: funciona en cualquier móvil.
   API: DGSBooth.mount(contenedor) → { set({decks, mixer, mode}) }
   ===================================================================== */
(function () {
  "use strict";

  // Medidas en "unidades" (1 ≈ 36 cm) y foto cenital de cada aparato
  var EQ = {
    cdj:    { src: "img/equipo/cdj-3000-top.webp", w: 0.90, aspect: 0.7263, h: 0.20, front: "dark",   name: "CDJ-3000" },
    a9:     { src: "img/equipo/djm-a9-top.webp",   w: 1.04, aspect: 0.8889, h: 0.19, front: "dark",   name: "DJM-A9", alpha: true },
    model1: { src: "img/equipo/model-1-top.webp",  w: 1.12, aspect: 0.8719, h: 0.17, front: "dark",   name: "Model 1" },
    xone:   { src: "img/equipo/xone-96-top.webp",  w: 0.92, aspect: 0.8252, h: 0.18, front: "silver", name: "Xone:96" }
  };
  var GAP = 0.05, TABLE_D = 1.75, TABLE_H = 0.16;

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }

  function makeDev(key) {
    var s = EQ[key];
    var d = el("div", "dev dev--" + key + " dev--" + s.front);
    var sh = el("div", "dev__shadow", d);
    var f = el("div", "dev__front", d);
    var l = el("div", "dev__side dev__side--l", d);
    var r = el("div", "dev__side dev__side--r", d);
    var top = el("img", "dev__top", d);
    top.src = s.src; top.alt = ""; top.decoding = "async"; top.draggable = false;
    d.__key = key;
    return d;
  }

  function mount(box) {
    if (!box) return null;
    var root = el("div", "booth", box);
    root.setAttribute("aria-hidden", "true");
    var stage = el("div", "booth__stage", root);
    var table = el("div", "booth__table", stage);
    el("div", "booth__tfront", table);
    var djs = [el("div", "booth__dj", stage), el("div", "booth__dj", stage)];
    var pool = { cdj: [], mixers: {} };
    var state = { decks: 2, mixer: "a9", mode: "solo" };
    var k = 100, first = true;

    function getCdj(i) {
      if (!pool.cdj[i]) { pool.cdj[i] = makeDev("cdj"); stage.appendChild(pool.cdj[i]); }
      return pool.cdj[i];
    }
    function getMixer(key) {
      if (!pool.mixers[key]) { pool.mixers[key] = makeDev(key); stage.appendChild(pool.mixers[key]); }
      return pool.mixers[key];
    }

    function place(dev, key, cx, on) {
      var s = EQ[key], w = s.w * k, d = (s.w / s.aspect) * k, h = s.h * k;
      dev.style.width = w + "px"; dev.style.height = d + "px";
      dev.style.left = (cx * k - w / 2) + "px";
      dev.style.top = (-d / 2) + "px";
      dev.style.setProperty("--h", h + "px");
      var was = dev.classList.contains("is-on");
      if (on && !was) {
        dev.classList.remove("is-on");
        dev.classList.add("is-drop");
        void dev.offsetWidth;          // fuerza el estado inicial antes de animar
        dev.classList.remove("is-drop");
        dev.classList.add("is-on");
      } else if (!on && was) {
        dev.classList.remove("is-on");
      }
    }

    function layout() {
      var n = state.decks, mk = state.mixer;
      var cw = EQ.cdj.w, mw = EQ[mk].w;
      var total = n * cw + mw + n * GAP;
      // escala para que la cabina quepa en el recuadro
      var bw = box.clientWidth || 600, bh = box.clientHeight || 360;
      k = Math.min((bw * 0.9) / (total + 0.35), (bh * 1.05) / TABLE_D);
      stage.style.setProperty("--k", k + "px");

      var x = -total / 2, left = Math.ceil(n / 2), cx = [];
      for (var i = 0; i < left; i++) { cx.push(x + cw / 2); x += cw + GAP; }
      var mx = x + mw / 2; x += mw + GAP;
      for (var j = left; j < n; j++) { cx.push(x + cw / 2); x += cw + GAP; }

      for (var c = 0; c < 4; c++) {
        var dv = getCdj(c);
        if (c < n) place(dv, "cdj", cx[c], true); else place(dv, "cdj", dv.__lastX || 0, false);
        if (c < n) dv.__lastX = cx[c];
      }
      Object.keys(EQ).forEach(function (key) {
        if (key === "cdj") return;
        if (key === mk) place(getMixer(key), key, mx, true);
        else if (pool.mixers[key]) place(pool.mixers[key], key, mx, false);
      });

      var tw = (total + 0.35) * k, td = TABLE_D * k;
      table.style.width = tw + "px"; table.style.height = td + "px";
      table.style.left = (-tw / 2) + "px"; table.style.top = (-td / 2) + "px";
      table.style.setProperty("--th", TABLE_H * k + "px");

      var b2b = state.mode === "b2b";
      djs[0].textContent = b2b ? "DJ1" : "DJ"; djs[1].textContent = "DJ2";
      djs[1].style.display = b2b ? "" : "none";
      var dy = td / 2 + 0.28 * k;
      djs[0].style.transform = "translate(" + ((b2b ? -0.45 : 0) * k - 18) + "px," + (dy - 18) + "px)";
      djs[1].style.transform = "translate(" + (0.45 * k - 18) + "px," + (dy - 18) + "px)";
      if (first) { first = false; root.classList.add("is-ready"); }
    }

    /* Inclinación con el ratón */
    var fine = window.matchMedia && matchMedia("(pointer: fine)").matches;
    var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fine && !reduced) {
      box.addEventListener("pointermove", function (e) {
        var r = box.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty("--rz", (px * -16).toFixed(2) + "deg");
        stage.style.setProperty("--rx", (52 + py * 10).toFixed(2) + "deg");
      });
      box.addEventListener("pointerleave", function () { stage.style.setProperty("--rz", "0deg"); stage.style.setProperty("--rx", "52deg"); });
    }

    if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); }).observe(box);
    else window.addEventListener("resize", layout);
    layout();

    return {
      set: function (s) { state.decks = +s.decks; state.mixer = EQ[s.mixer] ? s.mixer : "a9"; state.mode = s.mode; layout(); }
    };
  }

  window.DGSBooth = { mount: mount, eq: EQ };
})();
