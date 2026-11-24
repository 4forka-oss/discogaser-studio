/* =====================================================================
   DISCOGASER STUDIO · main.js
   IIFE clásico (sin módulos). Cada bloque va en safe(): si uno falla,
   el resto sigue funcionando. El contenido está en el HTML; JS enriquece.
   ===================================================================== */
(function () {
  "use strict";
  var D = window.DGS;
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia && matchMedia("(pointer: fine)").matches;
  var HAS_GSAP = function () { return !!(window.gsap && window.ScrollTrigger); };
  var lenis = null;
  var booth = null;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[DGS] " + name + " falló:", e); } }
  function eur(n) {
    var dec = Math.round(n * 100) % 100 !== 0;
    return n.toLocaleString("es-ES", { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: 2 });
  }
  function waURL(text) {
    return "https://wa.me/" + D.contacto.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(n) { return '<span class="num" data-count="' + n + '">' + n + "</span>"; }

  /* ---------- Contacto y enlaces de WhatsApp ---------- */
  function initContact() {
    var c = D.contacto;
    c.direccionCompleta = c.direccion + ", " + c.cp + " " + c.ciudad;
    $$("[data-c]").forEach(function (el) { var v = c[el.getAttribute("data-c")]; if (v) el.textContent = v; });
    $$("[data-wa]").forEach(function (a) { a.href = waURL(a.getAttribute("data-wa-text") || ""); });
    var iva = $("#ivaNote"); if (iva) iva.textContent = D.notaIVA;
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Dibujos SVG (fallback 3D y frames) ---------- */
  function initDrawings() {
    if (!window.DGSCabinaSVG) return;
    $$("[data-cenital]").forEach(function (el) {
      if (el.children.length) return;
      var p = el.getAttribute("data-cenital").split(",");
      el.innerHTML = DGSCabinaSVG({ decks: +p[0], mixer: p[1], mode: +p[0] === 4 ? "b2b" : "solo" });
    });
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
    var onScroll = function () { nav.classList.toggle("is-compact", window.scrollY > 40); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    function close() { burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menú"); menu.hidden = true; root.style.overflow = ""; if (lenis) lenis.start(); }
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      if (!open) return close();
      burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Cerrar menú");
      menu.hidden = false; root.style.overflow = "hidden"; if (lenis) lenis.stop();
      var first = $("a", menu); if (first) first.focus();
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", close); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { close(); burger.focus(); } });
  }

  /* ---------- Scroll suave (Lenis solo en escritorio con ratón) ---------- */
  function initScroll() {
    if (window.Lenis && FINE && !REDUCED) {
      lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
      if (HAS_GSAP()) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
      }
    }
    doc.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = doc.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -64, duration: 1.2 });
      else t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
      if (a.hasAttribute("data-preset")) return; // el foco se queda en el configurador
      setTimeout(function () { if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }, 700);
    });
  }

  /* ---------- Precios (generados desde data.js) ---------- */
  function rows(list, unit, meta) {
    return '<ul class="rows">' + list.map(function (t) {
      return '<li><span class="r-name">' + t.h + (t.h === 1 ? " hora" : " horas") + (t.destaca ? '<span class="r-badge">Más elegido</span>' : "") + (meta ? '<span class="r-meta">' + meta(t) + "</span>" : "") + '</span><span class="price">' + num(t.precio) + " €" + (unit ? "<small>" + unit + "</small>" : "") + "</span></li>";
    }).join("") + "</ul>";
  }
  function tier(p, unit, waText, per) {
    return '<article class="tier' + (p.destaca ? " tier--hot" : "") + '">' +
      (p.destaca ? '<span class="badge">Más elegido</span>' : "") +
      "<h4>" + esc(p.nombre) + "</h4>" +
      '<p class="price">' + num(p.precio) + " €" + (unit ? "<small>" + unit + "</small>" : "") + "</p>" +
      (per ? '<p class="tier__per">' + per + "</p>" : "") +
      "<ul>" + p.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" +
      '<a class="btn ' + (p.destaca ? "btn--red" : "btn--ghost") + ' btn--block" target="_blank" rel="noopener" href="' + waURL(waText) + '">Reservar</a>' +
      "</article>";
  }
  // Suplemento de mezclador (por sesión)
  function supOf(id) { var m = D.mezcladores.filter(function (x) { return x.id === id; })[0]; return m ? (m.suplemento || 0) : 0; }
  function supMixers() { return D.mezcladores.filter(function (m) { return m.suplemento > 0; }); }
  // "Xone:96 +15 € · Model 1 +20 €" multiplicado por n sesiones
  function supText(n, unit) {
    return supMixers().map(function (m) { return m.corto + " +" + eur(m.suplemento * (n || 1)) + " €" + (unit || ""); }).join(" · ");
  }
  function supNote() {
    return '<p class="p-sup"><strong>Suplemento de mezclador por sesión:</strong> DJM-A9 incluido · ' + supText(1) + "</p>";
  }

  // "12,50 €/h · ahorras 5 €" respecto a la primera hora suelta
  function ahorroMeta(base) {
    return function (t) {
      var a = base * t.h - t.precio;
      return eur(t.precio / t.h) + " €/h" + (a > 0 ? " · ahorras " + eur(a) + " €" : "");
    };
  }
  function renderPrices() {
    var P = D;
    var bon = $("#panel-bonos"), pin = $("#panel-pinchar"), gra = $("#panel-grabar"), pac = $("#panel-packs"), pla = $("#panel-planes"), ext = $("#panel-extras");
    if (pin && !pin.children.length) {
      pin.innerHTML =
        '<div class="p-block"><div class="p-head"><h3>' + P.pinchar.titulo + "</h3><p>" + P.pinchar.sub + "</p></div>" + rows(P.pinchar.tarifas, "", ahorroMeta(P.pinchar.tarifas[0].precio)) + supNote() +
        '<p class="p-more">¿Vienes a menudo? Con un bono la hora te sale desde ' + eur(Math.min.apply(null, P.bonos.tarifas.map(function (t) { return t.precio / t.h; }))) + ' €. <button type="button" class="linkbtn" data-goto-tab="tab-bonos">Ver bonos de práctica</button></p></div>';
    }
    if (bon && !bon.children.length) {
      bon.innerHTML = '<div class="p-head"><h3>' + P.bonos.titulo + "</h3><p>" + P.bonos.sub + "</p></div>" +
        '<div class="tiers tiers--4">' + P.bonos.tarifas.map(function (t) {
          var ahorro = P.horaSuelta * t.h - t.precio;
          return tier({ nombre: "Bono " + t.h + " h", precio: t.precio, destaca: t.destaca,
            items: ["Ahorras " + eur(ahorro) + " €", "Caduca a los " + t.caducaMeses + " meses", "De 1 a 3 h por visita", supText(1) + " por visita"] },
            "", "Hola, quiero el bono de " + t.h + " h de práctica (" + t.precio + " €) en Discogaser Studio",
            "Sale a <strong>" + eur(t.precio / t.h) + " €/h</strong>");
        }).join("") + "</div>" +
        '<ul class="incl">' + P.bonos.condiciones.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>";
    }
    if (gra && !gra.children.length) {
      gra.innerHTML = '<div class="p-block"><div class="p-head"><h3>' + P.grabar.titulo + "</h3><p>" + P.grabar.sub + "</p></div>" + rows(P.grabar.tarifas, "", ahorroMeta(P.grabar.tarifas[0].precio)) + supNote() +
        '<ul class="incl">' + P.grabar.incluye.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
    }
    if (pac && !pac.children.length) {
      pac.innerHTML = '<div class="p-head"><h3>Packs de contenido</h3><p>' + P.packsSub + "</p></div>" +
        '<div class="tiers tiers--5">' + P.packs.map(function (p) {
          var per = "Con " + supText(p.sesiones || 1) + (p.sesionesPartido ? "<br>(en dos días, " + supText(p.sesionesPartido) + ")" : "");
          return tier(p, "", "Hola, quiero el Pack " + p.nombre + " (" + p.precio + " €) en Discogaser Studio", '<span class="tier__sup">' + per + "</span>");
        }).join("") + "</div>";
    }
    if (pla && !pla.children.length) {
      pla.innerHTML = '<div class="p-head"><h3>Planes mensuales</h3><p>' + P.planesSub + "</p></div>" +
        '<div class="tiers tiers--4">' + P.planes.map(function (p) {
          return tier(p, "/mes", "Hola, me interesa el plan " + p.nombre + " (" + p.precio + " €/mes) de Discogaser Studio",
            '<span class="tier__sup">Con ' + supText(1, "/mes") + "</span>");
        }).join("") + "</div>" +
        '<p class="hint" style="margin-top:18px">Baja antes de 3 meses: se abonan los meses pendientes. Después, baja avisando con 15 días.</p>';
    }
    if (ext && !ext.children.length) {
      ext.innerHTML = '<div class="p-head"><h3>Extras</h3><p>Se suman a una grabación o a un pack.</p></div><ul class="rows">' +
        P.extras.map(function (e) { return '<li><span class="r-name">' + esc(e.nombre) + '</span><span class="price">' + num(e.precio) + " €</span></li>"; }).join("") +
        '<li><span class="r-name">' + P.club.nombre + '<span class="r-meta">Con público, hasta ' + P.club.aforo + " personas · reserva con " + P.club.antelacionDias + ' días</span></span><span class="price price--red">+' + num(P.club.precio) + " €</span></li>" +
        '<li><span class="r-name">Masterizado del audio</span><span class="price" style="font-size:24px">Incluido</span></li></ul>' +
        '<div class="p-block"><div class="p-head"><h3>Suplemento de mezclador</h3><p>Por sesión, da igual que sean 1, 2 o 3 h. En packs, una vez por sesión de grabación; con bono, en cada visita; en planes, una vez al mes.</p></div><ul class="rows">' +
        P.mezcladores.map(function (m) {
          return '<li><span class="r-name">' + esc(m.nombre) + '</span><span class="price' + (m.suplemento ? "" : '" style="font-size:24px') + '">' + (m.suplemento ? "+" + num(m.suplemento) + " €<small>/sesión</small>" : "Incluido") + "</span></li>";
        }).join("") + "</ul></div>";
    }
  }

  function countUp(scope) {
    var els = $$(".num", scope);
    if (REDUCED || !window.gsap) return;
    els.forEach(function (el) {
      var to = +el.getAttribute("data-count"), o = { v: 0 };
      gsap.to(o, { v: to, duration: 0.7, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(o.v); }, onComplete: function () { el.textContent = to; } });
    });
  }

  function initTabs() {
    var tabs = $$('#priceTabs [role="tab"]'), ink = $(".tabs__ink"), wrap = $("#pricePanels");
    if (!tabs.length) return;
    var busy = false;
    function moveInk(t) { if (!ink) return; ink.style.width = t.offsetWidth + "px"; ink.style.transform = "translateX(" + t.offsetLeft + "px)"; }
    function select(t, focus) {
      var cur = tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0];
      if (t === cur || busy) return;
      var from = doc.getElementById(cur.getAttribute("aria-controls")), to = doc.getElementById(t.getAttribute("aria-controls"));
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
      moveInk(t);
      if (focus) t.focus();
      t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: REDUCED ? "auto" : "smooth" });
      if (!window.gsap || REDUCED) { from.hidden = true; to.hidden = false; return; }
      busy = true;
      var h0 = wrap.offsetHeight;
      gsap.to(from, { opacity: 0, x: -12, duration: 0.22, ease: "power2.in", onComplete: function () {
        from.hidden = true; gsap.set(from, { clearProps: "all" });
        to.hidden = false;
        var h1 = wrap.offsetHeight;
        gsap.fromTo(wrap, { height: h0 }, { height: h1, duration: 0.45, ease: "expo.out", clearProps: "height" });
        gsap.fromTo(to, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out", clearProps: "all", onComplete: function () { busy = false; } });
        var items = $$(".tier, .rows li", to);
        if (items.length) gsap.from(items, { y: 14, opacity: 0, duration: 0.5, ease: "quart.out", stagger: 0.04, clearProps: "all" });
        countUp(to);
      } });
      setTimeout(function () { busy = false; }, 1200);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (k === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === "Home") n = tabs[0];
        else if (k === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    doc.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-goto-tab]");
      if (b) { var t = doc.getElementById(b.getAttribute("data-goto-tab")); if (t) select(t, true); }
    });
    moveInk(tabs[0]);
    window.addEventListener("resize", function () { moveInk(tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0]); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { moveInk(tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0]); });
    // contador la primera vez que se ven los precios
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { countUp($("#panel-pinchar")); io.disconnect(); } }, { threshold: 0.05 });
      io.observe(wrap);
    }
  }

  /* ---------- Configurador ---------- */
  function initConfigurator() {
    var form = $("#cfgForm"); if (!form) return;
    var durBox = $("#cfgDuration"), exBox = $("#cfgExtras"), hint = $("#cfgExtrasHint");
    var S = { mixer: "a9", decks: 2, mode: "solo", service: "pinchar", dur: 1, extras: {}, club: false };

    function mixerName(id) { return D.mezcladores.filter(function (m) { return m.id === id; })[0].corto; }
    function pack(id) { return D.packs.filter(function (p) { return p.id === id; })[0]; }

    function plan(id) { return D.planes.filter(function (p) { return p.id === id; })[0]; }
    function payOpt(id) { return D.planesPago.filter(function (o) { return o.id === id; })[0] || D.planesPago[0]; }
    S.pay = "1";
    function buildPay() {
      var box = $("#cfgPay"); if (!box || box.children.length) return;
      box.innerHTML = D.planesPago.map(function (o) {
        return '<label><input type="radio" name="pay" value="' + o.id + '"' + (o.id === S.pay ? " checked" : "") + "><span>" + esc(o.nombre.replace(/ [−-]\d+ %$/, "")) + "<small>" + (o.dto ? "−" + Math.round(o.dto * 100) + " %" : "cuota mensual") + "</small></span></label>";
      }).join("");
    }
    function hourList() {
      return S.service === "grabar" ? D.grabar.tarifas : (S.service === "bono" ? D.bonos.tarifas : D.pinchar.tarifas);
    }
    function buildDurations() {
      var html = "", list;
      var isPlan = S.service === "plan";
      $("#cfgPayWrap").hidden = !isPlan;
      $("#cfgExtrasWrap").hidden = isPlan;
      if (isPlan) {
        if (!plan(S.dur)) S.dur = "creador";
        html = D.planes.map(function (p) {
          return '<label><input type="radio" name="dur" value="' + p.id + '"' + (S.dur === p.id ? " checked" : "") + "><span>" + esc(p.nombre) + "<small>" + p.precio + " €/mes</small></span></label>";
        }).join("");
        durBox.classList.remove("is-packs"); durBox.classList.add("is-4");
        $("#cfgDurLegend").textContent = "3 · Plan";
      } else if (S.service === "pack") {
        list = D.packs;
        if (!pack(S.dur)) S.dur = "pro";
        html = list.map(function (p) {
          return '<label><input type="radio" name="dur" value="' + p.id + '"' + (S.dur === p.id ? " checked" : "") + "><span>" + esc(p.nombre) + "<small>" + p.precio + " €</small></span></label>";
        }).join("");
        durBox.classList.add("is-packs");
        $("#cfgDurLegend").textContent = "3 · Pack";
      } else {
        list = hourList();
        if (!list.some(function (t) { return t.h === S.dur; })) S.dur = list[0].h;
        html = list.map(function (t) {
          return '<label><input type="radio" name="dur" value="' + t.h + '"' + (S.dur === t.h ? " checked" : "") + "><span>" + t.h + " h<small>" + t.precio + " €</small></span></label>";
        }).join("");
        durBox.classList.remove("is-packs");
        durBox.classList.toggle("is-4", list.length === 4);
        $("#cfgDurLegend").textContent = S.service === "bono" ? "3 · Bono" : "3 · Duración";
      }
      durBox.innerHTML = html;
    }

    function buildExtras() {
      if (exBox.children.length) return;
      var html = D.extras.map(function (e) {
        return '<label class="check" data-extra="' + e.id + '"><input type="checkbox" name="extra" value="' + e.id + '"><span class="check__t">' + esc(e.nombre) + '<span class="check__note"></span></span><span class="check__p">+' + e.precio + " €</span></label>";
      }).join("");
      html += '<label class="check" data-extra="club"><input type="checkbox" name="club" value="1"><span class="check__t">' + D.club.nombre + '<span class="check__note">Con público, hasta ' + D.club.aforo + " personas · reserva " + D.club.antelacionDias + ' días antes</span></span><span class="check__p">+' + D.club.precio + " €</span></label>";
      exBox.innerHTML = html;
    }

    function syncExtras() {
      var svc = S.service, anyOn = false;
      $$(".check", exBox).forEach(function (lab) {
        var id = lab.getAttribute("data-extra"), input = $("input", lab), note = $(".check__note", lab);
        var ok, why = "";
        if (id === "club") { ok = D.club.aplica.indexOf(svc) > -1; }
        else {
          var e = D.extras.filter(function (x) { return x.id === id; })[0];
          ok = e.aplica.indexOf(svc) > -1;
          if (ok && svc === "pack" && e.noEnPack && e.noEnPack.indexOf(S.dur) > -1) { ok = false; why = "Ya va incluido en este pack"; }
          if (!ok && !why && svc === "pack" && id === "edicion") why = "Los packs ya llevan edición de planos";
          if (note && id !== "club") note.textContent = why;
        }
        lab.classList.toggle("is-off", !ok);
        input.disabled = !ok;
        if (!ok) { input.checked = false; }
        if (ok) anyOn = true;
      });
      hint.hidden = anyOn;
    }

    function read() {
      var fd = new FormData(form);
      S.mixer = fd.get("mixer"); S.decks = D.platos || 4; S.mode = "solo";
      var svc = fd.get("service");
      if (svc !== S.service) { S.service = svc; S.dur = svc === "pack" ? "pro" : (svc === "plan" ? "creador" : (typeof S.dur === "number" ? S.dur : 2)); buildDurations(); }
      else { var d = fd.get("dur"); if (d) S.dur = (S.service === "pack" || S.service === "plan") ? d : +d; }
      S.pay = fd.get("pay") || S.pay;
      syncExtras();
      S.extras = {}; fd = new FormData(form);
      fd.getAll("extra").forEach(function (id) { S.extras[id] = true; });
      S.club = !!fd.get("club");
    }

    function compute() {
      // El cálculo vive en js/precios.js (lo comparte la app de reservas)
      return window.DGSPrecio.calc(S);
    }

    var lastTotal = null, schemaKey = "";
    function render(animate) {
      read();
      var r = compute();
      var cab = mixerName(S.mixer) + " + " + S.decks + " CDJ-3000";
      var html = '<li><span>Cabina</span><b>' + cab + "</b></li>" +
        r.lines.map(function (l) { return "<li><span>" + esc(l[0]) + "</span><b>" + l[1] + " €</b></li>"; }).join("");
      $("#cfgSummary").innerHTML = html;

      var totEl = $("#cfgTotal");
      if (animate && window.gsap && !REDUCED && lastTotal !== null && lastTotal !== r.total) {
        var o = { v: lastTotal };
        gsap.to(o, { v: r.total, duration: 0.5, ease: "power3.out", onUpdate: function () { totEl.textContent = Math.round(o.v); } });
        gsap.fromTo(totEl.parentNode, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "expo.out" });
      } else totEl.textContent = r.total;
      lastTotal = r.total;
      var pay = $("#cfgPayLine");
      $("#cfgUnit").textContent = r.unit;
      if (r.payNote) pay.textContent = r.payNote;
      else if (S.service === "bono") pay.textContent = "Bono: se paga por adelantado y es personal" + (r.supNotaBono ? ". " + r.supNotaBono : "");
      else pay.innerHTML = "Señal para reservar (" + Math.round(D.senal * 100) + " %): <strong>" + eur(r.total * D.senal) + " €</strong>";
      var tip = $("#cfgTip"), pf = pack("profoto");
      if (S.service === "pack" && S.dur === "pro" && S.extras.foto && pf) {
        var fotoP = D.extras.filter(function (x) { return x.id === "foto"; })[0].precio;
        tip.textContent = "Con fotógrafo te sale mejor el Pack " + pf.nombre + ": " + pf.precio + " € en vez de " + (pack("pro").precio + fotoP) + " €.";
        tip.hidden = false;
      } else tip.hidden = true;
      $("#cfgBarTotal").textContent = r.total + " " + r.unit;

      var key = S.decks + S.mixer + S.mode;
      if (key !== schemaKey) {
        schemaKey = key;
        var box = $("#cfgSchema");
        if (!booth && window.DGSBooth) {
          booth = window.DGSBooth.mount(box);
          box.insertAdjacentHTML("beforeend", '<span class="schema__tag"></span>');
        }
        if (booth) booth.set({ decks: S.decks, mixer: S.mixer, mode: S.mode });
        var tag = $(".schema__tag", box);
        if (tag) tag.textContent = S.decks + " CDJ · " + mixerName(S.mixer) + (S.mode === "b2b" ? " · B2B" : "");
        box.setAttribute("aria-label", "Cabina montada: " + cab + (S.mode === "b2b" ? ", back to back" : ""));
      }

      var isPlan = S.service === "plan";
      var msg = (isPlan ? "Hola, quiero apuntarme a un plan: " : "Hola, quiero reservar: ") + cab + (S.mode === "b2b" ? ", back to back" : "") + ", " + r.svcLabel +
        (r.exNames.length ? ", " + r.exNames.join(", ") : "") + ". Total " + r.total + " " + r.unit + " (" + D.ivaCorto + ")" + (r.supNotaBono ? " + " + r.supNotaBono.replace(mixerName(S.mixer) + ": ", "suplemento " + mixerName(S.mixer) + " ") : "") + (isPlan ? ". ¿Cómo me doy de alta?" : ". ¿Qué días tenéis libres?");
      $("#cfgWa").href = waURL(msg);

      // Enlace a la reserva online con todo preseleccionado
      var q = "s=" + S.service + "&m=" + S.mixer + "&d=" + encodeURIComponent(S.dur);
      var ex = Object.keys(S.extras).filter(function (k) { return S.extras[k]; });
      if (ex.length) q += "&x=" + ex.join(",");
      if (S.club) q += "&c=1";
      var book = $("#cfgBook");
      if (book) {
        book.href = "reservar/?" + q;
        book.textContent = isPlan ? "Apuntarme al plan" : (S.service === "bono" ? "Pedir este bono" : "Reservar online · " + r.total + " €");
      }
      drawSlots(q);
    }

    /* Huecos libres reales (API de reservas). Si la API no está, no se muestra nada. */
    var avail = null, availReq = null;
    function drawSlots(q) {
      var box = $("#cfgSlots"), list = $("#cfgSlotsList");
      if (!box) return;
      if (S.service === "plan" || S.service === "bono") { box.hidden = true; return; }
      if (!avail) {
        if (!availReq) availReq = fetch("api/?r=disponibilidad&dias=21").then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { avail = j && j.dias ? j : { dias: [] }; drawSlots(q); }).catch(function () { avail = { dias: [] }; });
        return;
      }
      var hrs = S.service === "pack" ? (window.DGSPrecio.pack(S.dur) || {}).horas || 2 : +S.dur, out = [];
      var minDay = S.club ? new Date(Date.now() + (avail.clubDias || 7) * 864e5).toISOString().slice(0, 10) : "";
      avail.dias.forEach(function (d) {
        if (out.length >= 4 || d.dia < minDay) return;
        (d.abierto || []).forEach(function (rg) {
          for (var h = rg[0]; h + hrs <= rg[1] && out.length < 4; h++) {
            if (h < d.desdeHora) continue;
            if (d.ocupado.some(function (b) { return h < b[1] && h + hrs > b[0]; })) continue;
            out.push([d.dia, h]); break; // uno por tramo para que salgan días distintos
          }
        });
      });
      if (!out.length) { box.hidden = true; return; }
      var DS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
      list.innerHTML = out.map(function (x) {
        var p = x[0].split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]);
        return '<a class="slot" href="reservar/?' + q + "&f=" + x[0] + "&h=" + x[1] + '"><b>' + DS[dt.getDay()] + " " + dt.getDate() + "</b><span>" + x[1] + ":00</span></a>";
      }).join("");
      box.hidden = false;
    }

    $$('input[name="mixer"]', form).forEach(function (inp) {
      var m = D.mezcladores.filter(function (x) { return x.id === inp.value; })[0];
      if (m) inp.nextElementSibling.innerHTML = esc(m.corto) + "<small>" + (m.suplemento ? "+" + m.suplemento + " €/sesión" : "Incluido") + "</small>";
    });
    buildPay(); buildDurations(); buildExtras(); render(false);
    form.addEventListener("change", function () { render(true); });

    // Accesos directos desde las tarjetas ("Configurar grabación", etc.)
    $$("[data-preset]").forEach(function (a) {
      a.addEventListener("click", function () {
        var v = a.getAttribute("data-preset"), r = $('input[name="service"][value="' + v + '"]', form);
        if (r) { r.checked = true; render(false); setTimeout(function () { r.focus({ preventScroll: true }); }, 900); }
      });
    });

    // barra de total en móvil: se oculta cuando se ve el resumen
    var bar = $("#cfgBar"), sum = $(".summary");
    if (bar && sum && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { bar.classList.toggle("is-hidden", en[0].isIntersecting); }, { threshold: 0.05 }).observe(sum);
    }
  }

  /* ---------- JSON-LD de servicios (desde data.js) ---------- */
  function renderServicesLD() {
    var base = "https://discogaserstudio.es/";
    function offer(name, price, unit) {
      var o = { "@type": "Offer", name: name, price: price, priceCurrency: "EUR",
        priceSpecification: { "@type": unit ? "UnitPriceSpecification" : "PriceSpecification", price: price, priceCurrency: "EUR", valueAddedTaxIncluded: true } };
      if (unit) o.priceSpecification.unitCode = "MON";
      return o;
    }
    function svc(name, desc, offers) {
      return { "@type": "Service", name: name, description: desc, serviceType: name, areaServed: "Teruel, Aragón", provider: { "@id": base + "#estudio" }, offers: offers };
    }
    var graph = [
      svc("Alquiler de cabina DJ en Teruel", "Sala de práctica DJ con 4 CDJ-3000 y DJM-A9, Model 1 o Xone:96.",
        D.pinchar.tarifas.map(function (t) { return offer("Pinchar " + t.h + " h", t.precio); })
          .concat(D.bonos.tarifas.map(function (t) { return offer("Bono " + t.h + " h de cabina", t.precio); }))),
      svc("Grabar set DJ en vídeo", "Grabación de sesión DJ con plano frontal y cenital y audio WAV masterizado.",
        D.grabar.tarifas.map(function (t) { return offer("Grabar " + t.h + " h", t.precio); })),
      svc("Packs de contenido para DJs", D.packsSub, D.packs.map(function (p) { return offer("Pack " + p.nombre, p.precio); })),
      svc("Planes mensuales para DJs", D.planesSub, D.planes.map(function (p) { return offer("Plan " + p.nombre, p.precio, true); })),
      svc("Suplemento de mezclador", "Suplemento por sesión al elegir Allen & Heath Xone:96 o PLAYdifferently Model 1. El DJM-A9 va incluido.",
        supMixers().map(function (m) { return offer("Suplemento " + m.nombre + " (por sesión)", m.suplemento); })),
      svc("Extras de grabación DJ", "Extras para grabaciones y packs.",
        D.extras.map(function (e) { return offer(e.nombre, e.precio); }).concat([offer(D.club.nombre, D.club.precio)]))
    ];
    var s = doc.createElement("script");
    s.type = "application/ld+json"; s.id = "ld-servicios";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    if (!$("#ld-servicios")) doc.head.appendChild(s);
  }

  /* ---------- Microinteracciones ---------- */
  function initTilt() {
    if (!FINE) return;
    $$(".tilt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--ry", ((x - 0.5) * (REDUCED ? 0 : 10)).toFixed(2) + "deg");
        c.style.setProperty("--rx", ((0.5 - y) * (REDUCED ? 0 : 8)).toFixed(2) + "deg");
        c.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      });
      c.addEventListener("pointerleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }
  function initMagnetic() {
    if (!FINE || REDUCED) return;
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });
  }

  /* ---------- Revelados al hacer scroll ---------- */
  function splitWords(el) {
    if (el.getAttribute("data-split-done")) return [];
    el.setAttribute("data-split-done", "1");
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><span class="wi">' + esc(w) + "</span></span>"; }).join(" ");
    return $$(".wi", el);
  }
  function initReveals() {
    if (!HAS_GSAP() || REDUCED) return;
    gsap.registerPlugin(ScrollTrigger);
    var st = function (el, start) { return { trigger: el, start: start || "top 88%", once: true }; };

    // Hero: líneas del h1 suben desde una máscara
    $$(".hero__title .ln").forEach(function (ln) { ln.style.overflow = "hidden"; ln.style.padding = ".12em 0 .04em"; ln.style.margin = "-.12em 0 -.04em"; ln.innerHTML = '<span style="display:inline-block">' + ln.innerHTML + "</span>"; });
    gsap.from(".hero__title .ln > span", { yPercent: 105, duration: 0.9, ease: "expo.out", stagger: 0.08, delay: 0.05 });
    gsap.from([".hero__lead", ".hero__ctas"], { y: 18, opacity: 0, duration: 0.8, ease: "quart.out", stagger: 0.08, delay: 0.35, clearProps: "transform,opacity" });

    $$("[data-split]").forEach(function (h) {
      var w = splitWords(h);
      if (w.length) gsap.from(w, { yPercent: 110, duration: 0.8, ease: "expo.out", stagger: 0.045, scrollTrigger: st(h) });
    });
    $$(".mask").forEach(function (m) {
      gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.out", scrollTrigger: st(m, "top 92%") });
    });
    $$(".cards3, .club__stats").forEach(function (g) {
      gsap.from(g.children, { y: 40, opacity: 0, duration: 0.8, ease: "quart.out", stagger: 0.1, clearProps: "transform,opacity", scrollTrigger: st(g) });
    });
    $$(".acc details, .config__grid > *, .contacto__grid > *, .tabs").forEach(function (el) {
      gsap.from(el, { y: 28, opacity: 0, duration: 0.7, ease: "quart.out", clearProps: "transform,opacity", scrollTrigger: st(el, "top 92%") });
    });

    // Red de seguridad: si algo no se ha revelado en 6 s y está en pantalla, se muestra.
    setTimeout(function () {
      ScrollTrigger.refresh();
      $$(".wi, .ficha, .card, .step, .acc details, .mask").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === "0") gsap.set(el, { clearProps: "all" });
      });
    }, 6000);
  }

  /* ---------- Escenario de fotos de «La cabina» ---------- */
  // Zoom sobre la foto de cabina: centro (x, y en fracción de la foto) y escala
  var ZOOM = { cdj: [0.178, 0.376, 2.1], a9: [0.505, 0.354, 2.3], sound: [0.5, 0.5, 1], cams: [0.5, 0.42, 1.12], cab: [0.5, 0.5, 1] };
  function zoomCSS(z) {
    var tx = (0.5 - z[0]) * z[2] * 100, ty = (0.5 - z[1]) * z[2] * 100;
    return "translate(-50%,-50%) translate(" + tx.toFixed(2) + "%," + ty.toFixed(2) + "%) scale(" + z[2] + ")";
  }
  var stageBooth = null, stageMixer = null;
  function stageFocus(k) {
    var st = $("#stage"); if (!st) return;
    if (stageBooth) {
      // Cabina por piezas: los 4 CDJ se quedan y solo cambia el mezclador
      var mx = (k === "model1" || k === "xone") ? k : "a9";
      if (mx !== stageMixer) { stageMixer = mx; stageBooth.set({ decks: 4, mixer: mx, mode: "solo" }); }
      return;
    }
    var layerKey = (k === "model1" || k === "xone") ? k : "cab";
    $$(".stage__layer", st).forEach(function (l) { l.classList.toggle("is-on", l.getAttribute("data-k") === layerKey); });
    if (layerKey === "cab") { var img = $(".stage__layer--cab img", st); img.style.transform = zoomCSS(ZOOM[k] || ZOOM.cab); }
  }
  function initStage() {
    $$(".ficha__img--zoom").forEach(function (f) { var z = ZOOM[f.getAttribute("data-zoom")]; if (z) $("img", f).style.transform = zoomCSS(z); });
    var st = $("#stage"); if (!st) return;
    var bx = $("#stageBooth");
    if (bx && window.DGSBooth) {
      stageBooth = window.DGSBooth.mount(bx);
      if (stageBooth) st.classList.add("has-booth");
    }
    stageFocus("cab");
    if (FINE && !REDUCED) {
      st.addEventListener("pointermove", function (e) {
        var r = st.getBoundingClientRect();
        st.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + "deg");
        st.style.setProperty("--rx", ((0.5 - (e.clientY - r.top) / r.height) * 6).toFixed(2) + "deg");
      });
      st.addEventListener("pointerleave", function () { st.style.setProperty("--ry", "0deg"); st.style.setProperty("--rx", "0deg"); });
    }
  }

  /* ---------- Foto del hero: inclinación con el ratón y zoom al bajar ---------- */
  function initHeroVisual() {
    var v = $("#heroVisual"); if (!v) return;
    if (FINE && !REDUCED) {
      window.addEventListener("pointermove", function (e) {
        v.style.setProperty("--ry", ((e.clientX / innerWidth - 0.5) * 10).toFixed(2) + "deg");
        v.style.setProperty("--rx", ((0.5 - e.clientY / innerHeight) * 6).toFixed(2) + "deg");
      }, { passive: true });
    }
    if (HAS_GSAP() && !REDUCED) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo(v, { "--sc": 1, "--ty": "0%" }, { "--sc": 1.14, "--ty": "8%", ease: "none", scrollTrigger: { trigger: "#inicio", start: "top top", end: "bottom top", scrub: true } });
      gsap.from($("img", v), { opacity: 0, y: 40, scale: 0.96, duration: 1.2, ease: "expo.out", delay: 0.15 });
    }
  }

  /* ---------- Fichas de la cabina (resaltado + foto) ---------- */
  function initFichas() {
    var fichas = $$(".ficha");
    if (!fichas.length || !HAS_GSAP()) return;
    gsap.registerPlugin(ScrollTrigger);
    fichas.forEach(function (f) {
      ScrollTrigger.create({
        trigger: f, start: "top 62%", end: "bottom 38%",
        onToggle: function (self) {
          f.classList.toggle("is-active", self.isActive);
          if (self.isActive) stageFocus(f.getAttribute("data-focus"));
        }
      });
    });
  }

  /* ---------- Escena 3D diferida ---------- */
  function canDo3D() {
    if (REDUCED) return false;
    var c = navigator.connection; if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return false;
    var mobile = matchMedia("(pointer: coarse)").matches && innerWidth < 1000;
    if (mobile && ((navigator.hardwareConcurrency || 4) < 6 || (navigator.deviceMemory || 4) < 4)) return false;
    try { var cv = doc.createElement("canvas"); if (!(cv.getContext("webgl2") || cv.getContext("webgl"))) return false; } catch (e) { return false; }
    return true;
  }
  function loadScript(src) {
    return new Promise(function (ok, ko) { var s = doc.createElement("script"); s.src = src; s.async = true; s.onload = ok; s.onerror = ko; doc.body.appendChild(s); });
  }
  var threeP = null;
  function loadThree() {
    if (!threeP) threeP = loadScript("https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js");
    return threeP;
  }
  function init3D() {
    if (!canDo3D()) return;
    var go = function () {
      loadThree()
        .then(function () { return loadScript("js/hero3d.js?v=20261123l"); })
        .then(function () {
          if (!window.DGS3D || !window.THREE) return;
          var canvas = $("#stage3d");
          var mobile = innerWidth < 1000;
          var ctl = window.DGS3D.init(canvas, { mobile: mobile, target: $("#heroVisual img") });
          if (!ctl) return;
          root.classList.add("has-3d");
          wire3D(ctl, canvas, mobile);
        })
        .catch(function (e) { console.warn("[DGS] 3D no disponible", e); });
    };
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 400); };
    if (doc.readyState === "complete") idle(go, { timeout: 1800 });
    else window.addEventListener("load", function () { idle(go, { timeout: 1800 }); });
  }
  function wire3D(ctl, canvas, mobile) {
    var hero = $("#inicio"), heroOn = true;
    function upd() { canvas.classList.toggle("is-on", heroOn); ctl.setActive(heroOn); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { heroOn = en[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero);
    }
    upd();
    if (FINE) window.addEventListener("pointermove", function (e) { ctl.setPointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); }, { passive: true });
  }

  /* ---------- Mapa (facade: Google solo carga al pulsar) ---------- */
  function initMap() {
    var b = $("#mapBtn"), m = $("#map"); if (!b) return;
    b.addEventListener("click", function () {
      if ($("iframe", m)) return;
      var f = doc.createElement("iframe");
      f.title = "Mapa: Discogaser Studio, estudio DJ en el Polígono La Paz, Teruel";
      f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      f.src = "https://www.google.com/maps?q=" + encodeURIComponent(D.contacto.mapaQuery) + "&output=embed";
      m.appendChild(f);
    });
  }

  /* ---------- Formulario → WhatsApp ---------- */
  function initForm() {
    var f = $("#contactForm"), err = $("#formErr"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(f), nombre = (d.get("nombre") || "").trim();
      if (!nombre) { err.hidden = false; f.nombre.focus(); return; }
      err.hidden = true;
      var fecha = d.get("fecha");
      if (fecha) { var p = fecha.split("-"); fecha = p[2] + "/" + p[1] + "/" + p[0]; }
      var msg = "Hola, soy " + nombre + ". Quiero: " + d.get("servicio") + "." + (fecha ? " Fecha: " + fecha + "." : "") + (d.get("mensaje") ? " " + d.get("mensaje").trim() : "");
      window.open(waURL(msg), "_blank", "noopener");
    });
  }

  function boot() {
    if (!D) { console.warn("[DGS] Falta data.js"); return; }
    safe(initContact, "contacto");
    safe(initDrawings, "dibujos");
    safe(initNav, "nav");
    safe(initScroll, "scroll");
    safe(renderPrices, "precios");
    safe(initTabs, "pestañas");
    safe(initConfigurator, "configurador");
    safe(renderServicesLD, "json-ld");
    safe(initTilt, "tilt");
    safe(initMagnetic, "magnético");
    safe(initReveals, "revelados");
    safe(initStage, "escenario cabina");
    safe(initHeroVisual, "foto hero");
    safe(initFichas, "fichas");
    safe(initMap, "mapa");
    safe(initForm, "formulario");
    safe(init3D, "3d");
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})();
