/* =====================================================================
   DISCOGASER STUDIO · cabina del configurador con fotos reales
   Las fotos cenitales oficiales se colocan sobre una cabina de club en
   perspectiva (CSS 3D): mesa, frontal con logo y LED, aparatos con
   grosor y sombra, y el nombre de cada aparato en el frontal.
   La cabina se inclina siguiendo el ratón (o se balancea sola) y los
   aparatos caen a su sitio al cambiar el mezclador.
   Sin WebGL ni librerías: funciona en cualquier móvil.
   API: DGSBooth.mount(contenedor) → { set({decks, mixer, mode}) }
   ===================================================================== */
(function () {
  "use strict";

  // Medidas en "unidades" (1 ≈ 36 cm) y foto cenital de cada aparato
  var EQ = {
    cdj:    { src: "img/equipo/cdj-3000-top.webp", w: 0.90, aspect: 0.7263, h: 0.20, front: "dark",   name: "CDJ-3000" },
    a9:     { src: "img/equipo/djm-a9-top.webp",   w: 1.00, aspect: 0.8889, h: 0.19, front: "dark",   name: "DJM-A9" },
    model1: { src: "img/equipo/model-1-top.webp",  w: 1.08, aspect: 0.8719, h: 0.17, front: "dark",   name: "Model 1" },
    xone:   { src: "img/equipo/xone-96-top.webp",  w: 0.92, aspect: 0.8252, h: 0.18, front: "silver", name: "Xone:96" }
  };
  var GAP = 0.035, PAD = 0.12, TABLE_D = 1.48, FRONT_H = 0.62, RX = 46;

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }

  function makeDev(key) {
    var s = EQ[key];
    var d = el("div", "dev dev--" + key + " dev--" + s.front);
    el("div", "dev__shadow", d);
    el("div", "dev__front", d);
    el("div", "dev__side dev__side--l", d);
    el("div", "dev__side dev__side--r", d);
    var top = el("img", "dev__top", d);
    top.src = s.src; top.alt = ""; top.decoding = "async"; top.draggable = false;
    el("div", "dev__gloss", d);
    d.__key = key;
    return d;
  }

  function mount(box) {
    if (!box) return null;
    var root = el("div", "booth", box);
    root.setAttribute("aria-hidden", "true");
    el("div", "booth__spot", root);
    var stage = el("div", "booth__stage", root);
    var table = el("div", "booth__table", stage);
    var front = el("div", "booth__tfront", table);
    var logo = el("img", "booth__logo", front);
    logo.src = "img/logo-discogaser-312.webp"; logo.alt = ""; logo.decoding = "async";
    var labels = el("div", "booth__labels", front);
    el("div", "booth__led", front);
    var pool = { cdj: [], mixers: {} };
    var state = { decks: 4, mixer: "a9", mode: "solo" };
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
      dev.style.top = (-d / 2 - 0.08 * k) + "px";
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
      var n = 4, mk = state.mixer;           // la cabina siempre lleva 4 CDJ-3000
      var cw = EQ.cdj.w, mw = EQ[mk].w;
      var total = n * cw + mw + n * GAP;
      var tu = total + PAD * 2;
      // escala para que la cabina (mesa + frontal en perspectiva) llene el recuadro
      var bw = box.clientWidth || 600, bh = box.clientHeight || 360, rad = RX * Math.PI / 180;
      var projH = TABLE_D * Math.cos(rad) + FRONT_H * Math.sin(rad);
      k = Math.min((bw * 0.84) / tu, (bh * 0.72) / projH);
      stage.style.top = (bh / 2 - (FRONT_H * Math.sin(rad) * k) / 2 + bh * 0.06) + "px";

      var x = -total / 2, left = n / 2, cx = [], names = [];
      for (var i = 0; i < left; i++) { cx.push(x + cw / 2); names.push([x + cw / 2, cw, EQ.cdj.name]); x += cw + GAP; }
      var mx = x + mw / 2; names.push([mx, mw, EQ[mk].name, true]); x += mw + GAP;
      for (var j = left; j < n; j++) { cx.push(x + cw / 2); names.push([x + cw / 2, cw, EQ.cdj.name]); x += cw + GAP; }

      for (var c = 0; c < 4; c++) place(getCdj(c), "cdj", cx[c], true);
      Object.keys(EQ).forEach(function (key) {
        if (key === "cdj") return;
        if (key === mk) place(getMixer(key), key, mx, true);
        else if (pool.mixers[key]) place(pool.mixers[key], key, mx, false);
      });

      var tw = tu * k, td = TABLE_D * k;
      table.style.width = tw + "px"; table.style.height = td + "px";
      table.style.left = (-tw / 2) + "px"; table.style.top = (-td / 2) + "px";
      table.style.setProperty("--th", FRONT_H * k + "px");
      table.style.setProperty("--k", k + "px");

      labels.innerHTML = names.map(function (nm) {
        return '<span class="booth__lab' + (nm[3] ? " is-mixer" : "") + '" style="left:' + ((nm[0] - nm[1] / 2 + tu / 2) * k) + "px;width:" + (nm[1] * k) + 'px">' + nm[2] + "</span>";
      }).join("");
      if (first) { first = false; requestAnimationFrame(function () { root.classList.add("is-ready"); }); }
    }

    /* Inclinación con el ratón; si no hay ratón, un balanceo suave */
    var fine = window.matchMedia && matchMedia("(pointer: fine)").matches;
    var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function tilt(px, py) {
      stage.style.setProperty("--rz", (px * -14).toFixed(2) + "deg");
      stage.style.setProperty("--rx", (RX + py * 10).toFixed(2) + "deg");
    }
    if (!reduced) {
      var hover = false;
      if (fine) {
        box.addEventListener("pointermove", function (e) {
          hover = true;
          var r = box.getBoundingClientRect();
          tilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
        });
        box.addEventListener("pointerleave", function () { hover = false; });
      }
      var t0 = performance.now(), visible = true;
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);
      (function idle(now) {
        if (!hover && visible) { var t = (now - t0) / 1000; tilt(Math.sin(t * 0.45) * 0.35, Math.sin(t * 0.3) * 0.15); }
        requestAnimationFrame(idle);
      })(t0);
    }

    if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); }).observe(box);
    else window.addEventListener("resize", layout);
    layout();

    return {
      set: function (s) { state.mixer = EQ[s.mixer] ? s.mixer : "a9"; state.mode = s.mode; layout(); }
    };
  }

  window.DGSBooth = { mount: mount, eq: EQ };
})();
