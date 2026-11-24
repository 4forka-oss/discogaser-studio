/* Vista cenital de la cabina en SVG con fotos reales del equipo
   (configurador, fallback del 3D y frames de ejemplo). IIFE, sin módulos. */
(function () {
  "use strict";
  var uid = 0;
  // Fotos cenitales y proporción ancho/alto de cada una (img/equipo/)
  var EQ = {
    cdj:    { src: "img/equipo/cdj-3000.webp", r: 0.727, name: "CDJ-3000" },
    a9:     { src: "img/equipo/djm-a9.webp",   r: 0.893, name: "DJM-A9" },
    model1: { src: "img/equipo/model-1.webp",  r: 0.875, name: "MODEL 1" },
    xone:   { src: "img/equipo/xone-96.webp",  r: 0.823, name: "XONE:96" }
  };

  window.DGSCabinaSVG = function (opts) {
    opts = opts || {};
    var n = Math.max(2, Math.min(4, +opts.decks || 2));
    var type = EQ[opts.mixer] && opts.mixer !== "cdj" ? opts.mixer : "a9";
    var b2b = opts.mode === "b2b";
    var id = "c" + (++uid);
    var H = 168, gap = 8, y = 104;
    var cw = Math.round(H * EQ.cdj.r), mw = Math.round(H * EQ[type].r);
    var total = n * cw + mw + n * gap;
    var x = 360 - total / 2;
    var left = Math.ceil(n / 2), right = n - left;
    var units = "", labels = "";

    function lab(cx, t, red) {
      labels += '<text x="' + cx.toFixed(1) + '" y="' + (y - 12) + '" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="600" letter-spacing="1.2" fill="' + (red ? "#FF4A4F" : "#9A9A92") + '">' + t + "</text>";
    }
    function unit(key, ux, w) {
      return '<g class="u u-' + key + '">' +
        '<rect x="' + (ux - 2) + '" y="' + (y - 2) + '" width="' + (w + 4) + '" height="' + (H + 4) + '" rx="6" fill="#000" opacity=".55" filter="url(#sh' + id + ')"/>' +
        '<image href="' + EQ[key].src + '" x="' + ux + '" y="' + y + '" width="' + w + '" height="' + H + '" preserveAspectRatio="xMidYMid slice"/>' +
        "</g>";
    }
    for (var i = 0; i < left; i++) { units += unit("cdj", x, cw); lab(x + cw / 2, "CDJ-3000"); x += cw + gap; }
    units += unit(type, x, mw); lab(x + mw / 2, EQ[type].name, true); x += mw + gap;
    for (var j = 0; j < right; j++) { units += unit("cdj", x, cw); lab(x + cw / 2, "CDJ-3000"); x += cw + gap; }

    var djs = "";
    (b2b ? [300, 420] : [360]).forEach(function (px, k) {
      djs += '<circle cx="' + px + '" cy="322" r="17" fill="#1d1d1b" stroke="' + (k === 0 ? "#E1060F" : "#9A9A92") + '" stroke-width="2"/>';
      djs += '<text x="' + px + '" y="326" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#F4F4F0">' + (b2b ? "DJ" + (k + 1) : "DJ") + "</text>";
    });

    return '<svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<filter id="gl' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="sh' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '<radialGradient id="lt' + id + '" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#E1060F" stop-opacity=".22"/><stop offset="1" stop-color="#E1060F" stop-opacity="0"/></radialGradient>' +
      "</defs>" +
      '<rect x="20" y="84" width="680" height="206" rx="14" fill="#121211" stroke="#2a2a27"/>' +
      '<rect x="20" y="84" width="680" height="206" rx="14" fill="url(#lt' + id + ')"/>' +
      '<rect x="20" y="284" width="680" height="4" rx="2" fill="#E1060F" filter="url(#gl' + id + ')" opacity=".9"/>' +
      labels + units + djs +
      '<g stroke="#F4F4F0" stroke-width="2" fill="none" opacity=".55">' +
      '<path d="M8 30 V8 H30"/><path d="M690 8 H712 V30"/><path d="M8 330 V352 H30"/><path d="M712 330 V352 H690"/></g>' +
      '<circle cx="22" cy="44" r="5" fill="#E1060F"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle>' +
      '<text x="34" y="48" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" fill="#F4F4F0">REC · CENITAL</text>' +
      '<text x="698" y="48" text-anchor="end" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" letter-spacing="1.5" fill="#9A9A92">' + n + " CDJ · " + EQ[type].name + (b2b ? " · B2B" : "") + "</text>" +
      "</svg>";
  };
})();
