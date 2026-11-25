/* =====================================================================
   DISCOGASER STUDIO · APP DE RESERVAS (web + iOS + Android)
   ---------------------------------------------------------------------
   Clientes: reservar, mis reservas, bonos/planes, perfil.
   Equipo (emails de admin en api/config.php): hoy, agenda, clientes,
   ajustes. Precios: js/data.js + js/precios.js (los mismos de la web).
   ===================================================================== */
(function () {
  "use strict";

  var C = window.DGS_APP || { api: "../api/", web: "../" };
  var D = window.DGS, P = window.DGSPrecio;
  var view = document.getElementById("view");
  var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  var DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var ESTADOS = { pendiente: "Pendiente", confirmada: "Confirmada", rechazada: "No disponible", cancelada: "Cancelada", completada: "Hecha", no_vino: "No vino",
    solicitado: "Solicitado", activo: "Activo", cancelado: "Cancelado" };

  /* ---------- utilidades ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseDay(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return ymd(d); }
  function today() { return ymd(new Date()); }
  function fechaCorta(s) { var d = parseDay(s); return DIAS_L[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }
  function franja(h, n) { return h + ":00 – " + (h + n) + ":00"; }
  function waLink(text) { return "https://wa.me/" + ((D && D.contacto && D.contacto.whatsapp) || "") + "?text=" + encodeURIComponent(text || ""); }
  function webUrl(path) { return (C.web || "../") + (path || ""); }

  var toastT;
  function toast(msg, err) {
    var t = $("#toast"); t.textContent = msg; t.className = "toast is-on" + (err ? " is-err" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast" + (err ? " is-err" : ""); }, 3200);
  }

  /* ---------- sesión y API ---------- */
  var S = { token: store("dgs_token") || "", user: null, abonos: [], ajustes: null, pend: 0 };

  function api(route, data, method) {
    var url = C.api + "?r=" + route;
    var opt = { method: method || (data !== undefined ? "POST" : "GET"), headers: { "Content-Type": "application/json" } };
    if (S.token) opt.headers["X-Token"] = S.token;
    if (data !== undefined) opt.body = JSON.stringify(data);
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return { error: "Respuesta no válida del servidor (" + r.status + ")." }; }).then(function (j) {
        if (r.status === 401 && S.token) { setToken(""); S.user = null; }
        if (!r.ok || j.error) { var e = new Error(j.error || "Error " + r.status); e.status = r.status; throw e; }
        return j;
      });
    }, function () { throw new Error("Sin conexión. Revisa tu internet y vuelve a probar."); });
  }
  function setToken(t) { S.token = t; store("dgs_token", t || null); }
  function isAdmin() { return S.user && S.user.role === "admin"; }

  function loadMe() {
    if (!S.token) return Promise.resolve(null);
    return api("yo").then(function (j) { S.user = j.usuario; S.abonos = j.abonos || []; S.ajustes = j.ajustes; return j; })
      .catch(function (e) { if (e.status === 401) { S.user = null; } return null; });
  }

  /* ---------- hoja inferior ---------- */
  var sheet = $("#sheet"), sheetBody = $("#sheetBody"), lastFocus = null;
  function openSheet(html, onMount) {
    lastFocus = document.activeElement;
    sheetBody.innerHTML = html; sheet.hidden = false; document.body.style.overflow = "hidden";
    if (onMount) onMount(sheetBody);
    var f = $("input, select, textarea, button:not(.sheet__x)", sheetBody); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function closeSheet() { sheet.hidden = true; sheetBody.innerHTML = ""; document.body.style.overflow = ""; if (lastFocus) try { lastFocus.focus(); } catch (e) {} }
  sheet.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });

  function confirmSheet(title, text, okText, danger) {
    return new Promise(function (res) {
      openSheet('<h3>' + esc(title) + '</h3><p class="muted">' + text + '</p><div class="btns" style="margin-top:18px"><button class="btn ' + (danger ? "btn--danger" : "btn--red") + '" data-ok>' + esc(okText) + '</button><button class="btn btn--ghost" data-no>Volver</button></div>', function (b) {
        $("[data-ok]", b).onclick = function () { closeSheet(); res(true); };
        $("[data-no]", b).onclick = function () { closeSheet(); res(false); };
      });
    });
  }

  /* ---------- acceso con código por email ---------- */
  function loginFlow(reason) {
    return new Promise(function (resolve) {
      var email = "";
      function stepEmail(err) {
        openSheet('<h3>Entra con tu email</h3><p class="muted small">' + esc(reason || "Te mandamos un código de 6 cifras. Sin contraseñas.") + '</p>' +
          '<form id="fEmail"><label class="field"><span>Email</span><input class="input" type="email" name="email" autocomplete="email" inputmode="email" required value="' + esc(email) + '"></label>' +
          (err ? '<p class="err">' + esc(err) + '</p>' : "") +
          '<button class="btn btn--red btn--block" style="margin-top:16px">Enviarme el código</button></form>' +
          '<p class="hint">Al entrar aceptas la <a href="' + webUrl("privacidad.html") + '" target="_blank" rel="noopener">política de privacidad</a>.</p>', function (b) {
          $("#fEmail", b).onsubmit = function (e) {
            e.preventDefault(); email = e.target.email.value.trim();
            var btn = $("button.btn", b); btn.disabled = true; btn.textContent = "Enviando…";
            api("auth/codigo", { email: email }).then(function (j) { stepCode(j.codigoPruebas); }).catch(function (x) { stepEmail(x.message); });
          };
        });
      }
      function stepCode(devCode, err) {
        openSheet('<h3>Escribe el código</h3><p class="muted small">Lo hemos enviado a <b>' + esc(email) + '</b>. Mira también en spam.</p>' +
          '<form id="fCode"><label class="field"><span>Código</span><input class="input code" name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label>' +
          (devCode ? '<p class="hint">Modo pruebas: el código es <b>' + esc(devCode) + "</b></p>" : "") +
          (err ? '<p class="err">' + esc(err) + '</p>' : "") +
          '<button class="btn btn--red btn--block" style="margin-top:16px">Entrar</button></form>' +
          '<p class="hint"><button class="link" data-back>Cambiar email o pedir otro código</button></p>', function (b) {
          var inp = $("input", b);
          inp.addEventListener("input", function () { if (inp.value.replace(/\D/g, "").length === 6) $("#fCode", b).requestSubmit ? $("#fCode", b).requestSubmit() : null; });
          $("[data-back]", b).onclick = function () { stepEmail(); };
          $("#fCode", b).onsubmit = function (e) {
            e.preventDefault();
            var btn = $("button.btn", b); btn.disabled = true;
            api("auth/verificar", { email: email, codigo: inp.value }).then(function (j) {
              setToken(j.token); S.user = j.usuario;
              return loadMe().then(function () {
                if (!isAdmin() && (!S.user.name || !S.user.phone)) stepProfile(); else { closeSheet(); afterLogin(); resolve(true); }
              });
            }).catch(function (x) { stepCode(devCode, x.message); });
          };
        });
      }
      function stepProfile(err) {
        openSheet('<h3>Tus datos</h3><p class="muted small">Solo para tu reserva: te llamamos si hay que cambiar algo.</p>' + profileForm(err) , function (b) {
          bindProfile(b, function () { closeSheet(); afterLogin(); resolve(true); }, stepProfile);
        });
      }
      sheet.addEventListener("click", function onX(e) { if (e.target.closest("[data-close]")) { sheet.removeEventListener("click", onX); resolve(false); } });
      stepEmail();
    });
  }
  function profileForm(err) {
    var u = S.user || {};
    return '<form id="fProf"><label class="field"><span>Nombre (o nombre artístico)</span><input class="input" name="nombre" autocomplete="name" required value="' + esc(u.name) + '"></label>' +
      '<label class="field"><span>Teléfono</span><input class="input" name="telefono" type="tel" autocomplete="tel" inputmode="tel" required value="' + esc(u.phone) + '"></label>' +
      (err ? '<p class="err">' + esc(err) + "</p>" : "") + '<button class="btn btn--red btn--block" style="margin-top:16px">Guardar</button></form>';
  }
  function bindProfile(b, done, retry) {
    $("#fProf", b).onsubmit = function (e) {
      e.preventDefault();
      api("yo", { nombre: e.target.nombre.value, telefono: e.target.telefono.value }).then(function (j) { S.user = j.usuario; toast("Datos guardados"); done(); })
        .catch(function (x) { retry(x.message); });
    };
  }
  function afterLogin() {
    renderTabs();
    // El equipo entra directo a "Hoy" (salvo que esté en una pantalla de equipo)
    if (isAdmin() && ["hoy", "agenda", "clientes", "cliente", "ajustes"].indexOf(route().name) < 0) {
      if (location.hash === "#/hoy") render(); else go("hoy");
      api("admin/resumen").then(function (j) { S.pend = j.pendientes.length; renderTabs(); }).catch(function () {});
    }
  }

  /* ---------- navegación ---------- */
  var ICON = {
    reservar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>',
    reservas: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    bonos: '<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
    perfil: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    hoy: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    agenda: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h3M7 17h6"/></svg>',
    clientes: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.8 5"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    entrar: '<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>'
  };
  function tabsFor() {
    if (isAdmin()) return [["hoy", "Hoy"], ["agenda", "Agenda"], ["clientes", "Clientes"], ["ajustes", "Ajustes"]];
    if (S.user) return [["inicio", "Reservar", "reservar"], ["reservas", "Reservas"], ["bonos", "Bonos"], ["perfil", "Perfil"]];
    return [["inicio", "Reservar", "reservar"], ["bonos", "Bonos y planes", "bonos"], ["perfil", "Entrar", "entrar"]];
  }
  function renderTabs() {
    var cur = route().name;
    $("#tabs").innerHTML = '<div class="tabs__in">' + tabsFor().map(function (t) {
      return '<a class="tab' + (cur === t[0] ? " is-on" : "") + '" href="#/' + t[0] + '"' + (cur === t[0] ? ' aria-current="page"' : "") + ">" + ICON[t[2] || t[0]] + "<span>" + t[1] + "</span>" +
        (t[0] === "hoy" && S.pend ? '<span class="tab__badge">' + S.pend + "</span>" : "") + "</a>";
    }).join("") + "</div>";
    var tag = $("#topTag"); tag.textContent = isAdmin() ? "Equipo" : ""; tag.classList.toggle("is-admin", !!isAdmin());
  }
  function route() {
    var h = location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
    return { name: h[0] || (isAdmin() ? "hoy" : "inicio"), arg: h[1] || "" };
  }
  function go(name) { location.hash = "#/" + name; }

  var ROUTES = {};
  var timer = null;
  function render() {
    var r = route();
    clearInterval(timer); timer = null;
    if (!sheet.hidden) closeSheet();
    var adminOnly = ["hoy", "agenda", "clientes", "cliente", "ajustes"];
    if (adminOnly.indexOf(r.name) > -1 && !isAdmin()) { go("inicio"); return; }
    renderTabs();
    var fn = ROUTES[r.name] || ROUTES.inicio;
    window.scrollTo(0, 0);
    fn(r.arg);
  }
  function loading() { view.innerHTML = '<div class="spin" aria-label="Cargando"></div>'; }
  function showError(e, retry) {
    view.innerHTML = '<section class="pad"><h1 class="h1">Vaya</h1><p class="muted">' + esc(e.message) + '</p><button class="btn btn--red" id="retry">Reintentar</button></section>';
    $("#retry").onclick = retry || render;
  }
  function autoRefresh(fn) { timer = setInterval(function () { if (document.visibilityState === "visible" && sheet.hidden) fn(true); }, 30000); }

  /* =====================================================================
     CLIENTE · RESERVAR
     ===================================================================== */
  var W = defaultDraft();
  function defaultDraft() { return { service: "pinchar", mixer: "a9", dur: 2, kind: "practica", abono: null, extras: {}, club: false, day: null, hour: null, notes: "" }; }
  try { var sd = JSON.parse(sstore("dgs_draft") || "null"); if (sd) W = Object.assign(W, sd); } catch (e) {}
  function saveDraft() { sstore("dgs_draft", JSON.stringify(W)); }

  // Viene del configurador de la web: ?s=grabar&m=xone&d=2&x=reel,foto&c=1
  (function prefill() {
    var q = new URLSearchParams(location.search); if (!q.get("s")) return;
    var s = q.get("s");
    if (["pinchar", "grabar", "pack"].indexOf(s) > -1) { W = defaultDraft(); W.service = s; }
    if (q.get("m")) W.mixer = q.get("m");
    if (q.get("d")) W.dur = s === "pack" ? q.get("d") : +q.get("d");
    (q.get("x") || "").split(",").forEach(function (x) { var m = /^([a-z]+?)(\d)$/.exec(x); if (m) W.extras[m[1]] = +m[2]; else if (x) W.extras[x] = true; });
    W.club = q.get("c") === "1";
    if (q.get("f")) { W.day = q.get("f"); W.hour = q.get("h") != null ? +q.get("h") : null; }
    if (s === "bono" || s === "plan") { history.replaceState(null, "", location.pathname + "#/bonos"); return; }
    saveDraft(); history.replaceState(null, "", location.pathname + "#/inicio");
  })();

  var AV = { from: null, days: [], max: 3, club: 7, loaded: 0 };
  function loadAvail(force) {
    if (!force && AV.loaded && Date.now() - AV.loaded < 60000) return Promise.resolve(AV);
    var cfgP = S.ajustes ? Promise.resolve({ ajustes: S.ajustes }) : api("config");
    return cfgP.then(function (c) {
      S.ajustes = c.ajustes;
      var total = Math.min(120, (c.ajustes.diasVista || 60) + 1), from = today(), calls = [];
      for (var i = 0; i < total; i += 62) calls.push(api("disponibilidad&desde=" + addDays(from, i) + "&dias=" + Math.min(62, total - i)));
      return Promise.all(calls);
    }).then(function (parts) {
      AV.days = [].concat.apply([], parts.map(function (p) { return p.dias; }));
      AV.max = parts[0].maxHoras; AV.club = parts[0].clubDias; AV.loaded = Date.now();
      return AV;
    });
  }

  function activeAbonos(tipo) { return (S.abonos || []).filter(function (a) { return a.tipo === tipo && a.vigente; }); }
  function abonoById(id) { return (S.abonos || []).filter(function (a) { return a.id === id; })[0]; }
  function bookHours() {
    if (W.service === "pack") { var p = P.pack(W.dur); return p ? p.horas : 2; }
    return +W.dur || 1;
  }
  function maxForAbono() {
    var a = abonoById(W.abono); if (!a) return 0;
    if (a.tipo === "bono") return Math.min(AV.max || 3, a.quedan);
    var left = W.kind === "grabacion" ? a.grabacionH - a.grabacionUsadas : a.practicaH - a.practicaUsadas;
    return Math.max(0, Math.min(AV.max || 3, left));
  }
  function freeStarts(day, hours) {
    var out = [];
    (day.abierto || []).forEach(function (r) {
      for (var h = r[0]; h + hours <= r[1]; h++) {
        if (h < day.desdeHora) continue;
        if (day.ocupado.some(function (b) { return h < b[1] && h + hours > b[0]; })) continue;
        out.push(h);
      }
    });
    return out;
  }
  function dayAllowed(d) {
    if (W.club && d.dia < addDays(today(), AV.club)) return false;
    var a = abonoById(W.abono);
    if ((W.service === "usoBono" || W.service === "usoPlan") && a && a.hasta && d.dia > a.hasta) return false;
    return true;
  }
  function priceNow() {
    var ab = W.abono ? (S.abonos || []).filter(function (a) { return a.id === W.abono; })[0] : null;
    return P.calc({ service: W.service, mixer: W.mixer, dur: W.dur, extras: W.extras, club: W.club, kind: W.kind, pay: "1", abonoMixer: ab ? ab.mixer : null });
  }

  ROUTES.inicio = function () {
    loading();
    Promise.all([loadAvail(), S.user ? Promise.resolve() : Promise.resolve()]).then(drawBooking).catch(function (e) { showError(e); });
  };

  function drawBooking() {
    var bono = activeAbonos("bono").filter(function (a) { return a.quedan > 0; })[0], plan = activeAbonos("plan")[0];
    if (W.service === "usoBono" && !bono) W.service = "pinchar";
    if (W.service === "usoPlan" && !plan) W.service = "pinchar";
    if (W.service === "usoBono") W.abono = bono.id;
    if (W.service === "usoPlan") W.abono = plan.id;
    var msg = S.ajustes && S.ajustes.mensaje;
    var nb = $("#notice"); nb.hidden = !msg; nb.textContent = msg || "";

    var svc = [["pinchar", "Pinchar", "Practicar"], ["grabar", "Grabar", "Audio + vídeo"], ["pack", "Pack", "Con edición"]];
    if (bono) svc.push(["usoBono", "Mi bono", "Quedan " + bono.quedan + " h"]);
    if (plan) svc.push(["usoPlan", "Mi plan", plan.nombre]);

    var html = '<section class="pad">' +
      '<h1 class="h1">Reserva tu<br><span class="red">cabina</span></h1>' +
      '<p class="lead">4 CDJ-3000 y el mezclador que elijas. Elige, mira los huecos libres y reserva.</p>' +
      '<div class="step"><b>1</b>¿Qué vas a hacer?</div>' +
      '<div class="opts" id="oSvc">' + svc.map(function (s) { return opt("svc", s[0], s[1], s[2], W.service === s[0]); }).join("") + "</div>" +
      '<div class="step"><b>2</b>Mezclador</div>' +
      '<div class="opts" id="oMix">' + D.mezcladores.map(function (m) {
        var note = m.suplemento ? (W.service === "usoPlan" ? "Incluido en tu cuota" : "+" + m.suplemento + " €/sesión") : "Incluido";
        return opt("mix", m.id, m.corto, note, W.mixer === m.id);
      }).join("") + "</div>" +
      '<div id="durBox"></div>' +
      '<div id="exBox"></div>' +
      '<div class="step"><b id="nDay">4</b>Día y hora</div><div id="calBox"></div>' +
      '<div id="sumBox"></div>' +
      "</section>";
    view.innerHTML = html;
    $("#oSvc").addEventListener("change", function (e) {
      W.service = e.target.value; W.day = null; W.hour = null;
      if (W.service === "pack") W.dur = "pro"; else W.dur = typeof W.dur === "number" ? W.dur : 2;
      if (W.service === "usoBono") W.abono = bono.id; else if (W.service === "usoPlan") W.abono = plan.id; else W.abono = null;
      saveDraft(); drawBooking();
    });
    $("#oMix").addEventListener("change", function (e) { W.mixer = e.target.value; saveDraft(); drawSummary(); });
    drawDur(); drawExtras(); drawCal(); drawSummary();
  }
  function opt(name, val, title, sub, on, disabled) {
    return '<label class="opt"><input type="radio" name="' + name + '" value="' + esc(val) + '"' + (on ? " checked" : "") + (disabled ? " disabled" : "") + "><span>" + esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span></label>";
  }

  function drawDur() {
    var box = $("#durBox"), html = "";
    if (W.service === "pack") {
      if (!P.pack(W.dur)) W.dur = "pro";
      html = '<div class="step"><b>3</b>Pack</div><div class="opts opts--2" id="oDur">' + D.packs.map(function (p) {
        return opt("dur", p.id, p.nombre + " · " + p.precio + " €", p.horas + " h · " + p.items[p.items.length > 2 ? 2 : 1], W.dur === p.id);
      }).join("") + "</div>";
    } else if (W.service === "usoBono" || W.service === "usoPlan") {
      var max = 0, a = abonoById(W.abono);
      if (W.service === "usoPlan") {
        html += '<div class="step"><b>3</b>¿Práctica o grabación?</div><div class="opts opts--2" id="oKind">' +
          opt("kind", "practica", "Práctica", "Quedan " + Math.max(0, a.practicaH - a.practicaUsadas) + " h este mes", W.kind === "practica", a.practicaH - a.practicaUsadas <= 0) +
          opt("kind", "grabacion", "Grabación", "Quedan " + Math.max(0, a.grabacionH - a.grabacionUsadas) + " h este mes", W.kind === "grabacion", a.grabacionH - a.grabacionUsadas <= 0) + "</div>";
        if (W.kind === "practica" && a.practicaH - a.practicaUsadas <= 0 && a.grabacionH - a.grabacionUsadas > 0) W.kind = "grabacion";
      } else W.kind = "practica";
      max = maxForAbono();
      if (+W.dur > max) W.dur = Math.max(1, max);
      html += '<div class="step"><b>' + (W.service === "usoPlan" ? "3b" : "3") + '</b>Horas</div>' +
        (max > 0 ? '<div class="opts" id="oDur">' + [1, 2, 3].map(function (h) { return opt("dur", h, h + " h", h <= max ? "De tus horas" : "No te quedan", +W.dur === h, h > max); }).join("") + "</div>"
          : '<div class="empty">No te quedan horas' + (W.service === "usoPlan" ? " de este tipo este mes" : " en el bono") + ".</div>");
    } else {
      var list = P.hourList(W.service);
      if (!list.some(function (t) { return t.h === +W.dur; })) W.dur = list[0].h;
      html = '<div class="step"><b>3</b>Duración</div><div class="opts" id="oDur">' + list.map(function (t) {
        return opt("dur", t.h, t.h + " h", t.precio + " €", +W.dur === t.h);
      }).join("") + "</div>";
    }
    box.innerHTML = html;
    var od = $("#oDur", box); if (od) od.addEventListener("change", function (e) { W.dur = W.service === "pack" ? e.target.value : +e.target.value; W.hour = null; saveDraft(); drawExtras(); drawCal(); drawSummary(); });
    var ok = $("#oKind", box); if (ok) ok.addEventListener("change", function (e) { W.kind = e.target.value; W.hour = null; saveDraft(); drawDur(); drawCal(); drawSummary(); });
  }

  function drawExtras() {
    var box = $("#exBox");
    if (["grabar", "pack"].indexOf(W.service) < 0) { box.innerHTML = ""; W.extras = {}; W.club = false; $("#nDay") && ($("#nDay").textContent = "4"); return; }
    var st = P.extrasState(W);
    box.innerHTML = '<div class="step"><b>+</b>Extras (opcional)</div><div class="checks" id="oEx">' + D.extras.map(function (e) {
      var s = st[e.id]; if (!s.ok) delete W.extras[e.id];
      if (e.opciones) {
        var cur = W.extras[e.id] === true ? 1 : (+W.extras[e.id] || 0);
        return '<div class="check' + (s.ok ? "" : " is-off") + '" style="flex-wrap:wrap"><span class="check__t">' + esc(e.nombre) + '</span><select class="input" data-qty="' + e.id + '" style="width:auto;min-width:150px"' + (s.ok ? "" : " disabled") + '><option value="0">No</option>' +
          e.opciones.map(function (o) { return '<option value="' + o.n + '"' + (cur === o.n ? " selected" : "") + ">" + o.n + " por " + o.precio + " €</option>"; }).join("") + "</select></div>";
      }
      return '<label class="check' + (s.ok ? "" : " is-off") + '"><input type="checkbox" value="' + e.id + '"' + (W.extras[e.id] ? " checked" : "") + (s.ok ? "" : " disabled") + '><span class="check__t">' + esc(e.nombre) + (s.why ? "<small>" + esc(s.why) + "</small>" : "") + '</span><span class="check__p">+' + e.precio + " €</span></label>";
    }).join("") +
      '<label class="check"><input type="checkbox" value="club"' + (W.club ? " checked" : "") + '><span class="check__t">' + esc(D.club.nombre) + "<small>Exclusivo · con público, hasta " + D.club.aforo + ' personas · te confirmamos disponibilidad</small></span><span class="check__p">+' + D.club.precio + " €</span></label></div>";
    $("#oEx").addEventListener("change", function (e) {
      if (e.target.getAttribute("data-qty")) { var n = +e.target.value; if (n) W.extras[e.target.getAttribute("data-qty")] = n; else delete W.extras[e.target.getAttribute("data-qty")]; }
      else if (e.target.value === "club") { W.club = e.target.checked; W.day = null; W.hour = null; drawCal(); }
      else W.extras[e.target.value] = e.target.checked;
      saveDraft(); drawSummary();
    });
  }

  function drawCal() {
    var box = $("#calBox"), hrs = bookHours();
    if ((W.service === "usoBono" || W.service === "usoPlan") && maxForAbono() <= 0) { box.innerHTML = ""; return; }
    var days = AV.days.filter(function (d) { return (d.abierto || []).length; });
    if (!days.length) { box.innerHTML = '<div class="empty">No hay días abiertos para reservar ahora mismo.</div>'; return; }
    var info = days.map(function (d) { var n = dayAllowed(d) ? freeStarts(d, hrs).length : 0; return { d: d, n: n }; });
    if (W.day && !info.some(function (x) { return x.d.dia === W.day && x.n; })) { W.day = null; W.hour = null; }
    if (!W.day) { var first = info.filter(function (x) { return x.n; })[0]; if (first) W.day = first.d.dia; }
    var lastMonth = "";
    box.innerHTML = '<p class="month" id="calMonth"></p><div class="days" id="oDays">' + info.map(function (x) {
      var dt = parseDay(x.d.dia);
      return '<button type="button" class="day' + (x.n ? " is-free" : " is-full") + (W.day === x.d.dia ? " is-on" : "") + '" data-day="' + x.d.dia + '" data-m="' + MESES[dt.getMonth()] + " " + dt.getFullYear() + '"' + (x.n ? "" : " disabled") +
        ' aria-label="' + fechaCorta(x.d.dia) + (x.n ? ", " + x.n + " horas libres" : ", completo") + '"><small>' + DIAS[dt.getDay()] + "</small><b>" + dt.getDate() + "</b><i>" + (x.n ? x.n + " libres" : "Completo") + "</i></button>";
    }).join("") + '</div><div id="hourBox" style="margin-top:12px"></div>';
    var on = $(".day.is-on", box); if (on) { $("#calMonth").textContent = on.getAttribute("data-m"); setTimeout(function () { on.scrollIntoView({ inline: "center", block: "nearest" }); }, 0); }
    else $("#calMonth").textContent = $(".day", box).getAttribute("data-m");
    $("#oDays").addEventListener("click", function (e) {
      var b = e.target.closest(".day"); if (!b || b.disabled) return;
      W.day = b.getAttribute("data-day"); W.hour = null; saveDraft();
      $$(".day", box).forEach(function (x) { x.classList.toggle("is-on", x === b); });
      $("#calMonth").textContent = b.getAttribute("data-m");
      drawHours(); drawSummary();
    });
    drawHours();
  }
  function drawHours() {
    var box = $("#hourBox"); if (!box) return;
    var d = AV.days.filter(function (x) { return x.dia === W.day; })[0];
    if (!d) { box.innerHTML = W.club ? '<div class="empty">El Formato Club se reserva con ' + AV.club + " días de antelación.</div>" : '<div class="empty">No quedan huecos con esta duración. Prueba con menos horas.</div>'; return; }
    var hrs = bookHours(), list = freeStarts(d, hrs);
    if (W.hour != null && list.indexOf(W.hour) < 0) W.hour = null;
    box.innerHTML = '<p class="small muted" style="margin:0 0 8px">' + fechaCorta(W.day) + " · elige la hora de entrada (" + hrs + " h)</p>" +
      (list.length ? '<div class="hours" id="oHours">' + list.map(function (h) {
        return '<button type="button" class="hour' + (W.hour === h ? " is-on" : "") + '" data-h="' + h + '">' + h + ":00<small>a " + (h + hrs) + ":00</small></button>";
      }).join("") + "</div>" : '<div class="empty">Este día no tiene huecos de ' + hrs + " h.</div>");
    var oh = $("#oHours", box);
    if (oh) oh.addEventListener("click", function (e) {
      var b = e.target.closest(".hour"); if (!b) return;
      W.hour = +b.getAttribute("data-h"); saveDraft();
      $$(".hour", box).forEach(function (x) { x.classList.toggle("is-on", x === b); });
      drawSummary(true);
    });
  }

  function drawSummary(scroll) {
    var box = $("#sumBox"); if (!box) return;
    var r = priceNow(), m = P.mixer(W.mixer), ready = W.day && W.hour != null;

    box.innerHTML = '<div class="step"><b>✓</b>Resumen</div><div class="card card--red" id="sumCard">' +
      '<ul class="lines"><li><span>Cabina</span><b>' + esc(m.corto) + " + " + (D.platos || 4) + " CDJ-3000</b></li>" +
      r.lines.map(function (l) { return "<li><span>" + esc(l[0]) + "</span><b>" + l[1] + " €</b></li>"; }).join("") +
      (ready ? "<li><span>Cuándo</span><b>" + esc(fechaCorta(W.day)) + ", " + franja(W.hour, bookHours()) + "</b></li>" : "") + "</ul>" +
      '<div class="total"><span class="muted small">' + esc(D.ivaCorto || "IVA incluido") + (r.supNotaBono ? "<br>" + esc(r.supNotaBono) : "") + "</span><strong>" + P.eur(r.total) + " €</strong></div>" +
      '<p class="small muted" style="margin:8px 0 0">Te confirmamos la reserva por email. ' + esc(D.pago || "") + "</p>" +
      '<label class="field"><span>Notas para el estudio (opcional)</span><textarea class="input" id="iNotes" maxlength="600" placeholder="Ej.: traigo mi USB, vengo con un amigo, quiero probar el Model 1…">' + esc(W.notes) + "</textarea></label>" +
      "</div>" +
      '<div class="cta-bar"><button class="btn btn--red btn--block" id="bBook"' + (ready ? "" : " disabled") + ">" + (ready ? "Solicitar reserva · " + P.eur(r.total) + " €" : "Elige día y hora") + "</button></div>" +
      '<p class="hint" style="text-align:center">¿Dudas? <a href="' + waLink("Hola, tengo una duda sobre una reserva en Discogaser Studio") + '" target="_blank" rel="noopener">Escríbenos por WhatsApp</a></p>';
    $("#iNotes").addEventListener("input", function (e) { W.notes = e.target.value; saveDraft(); });
    $("#bBook").onclick = submitBooking;
    if (scroll) setTimeout(function () { $("#bBook").scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
  }

  function submitBooking() {
    var go_ = function () {
      if (!S.user.name || !S.user.phone) {
        openSheet("<h3>Tus datos</h3>" + profileForm(), function (b) { bindProfile(b, function () { closeSheet(); submitBooking(); }, function (m) { toast(m, true); }); });
        return;
      }
      var r = priceNow(), m = P.mixer(W.mixer), btn = $("#bBook");
      btn.disabled = true; btn.textContent = "Reservando…";
      api("reservas", {
        servicio: W.service, detalle: String(W.dur), horas: bookHours(), mixer: W.mixer, tipo: W.kind, abono: W.abono,
        extras: Object.keys(W.extras).filter(function (k) { return W.extras[k]; }).map(function (k) { return W.extras[k] > 1 ? k + W.extras[k] : k; }), club: W.club,
        dia: W.day, hora: W.hour, precio: r.total, texto: r.svcLabel + " · " + m.corto, lineas: r.lines, notas: W.notes
      }).then(function (j) {
        var b = j.reserva; W = defaultDraft(); sstore("dgs_draft", null); AV.loaded = 0;
        loadMe();
        view.innerHTML = '<section class="pad"><h1 class="h1">¡Solicitud<br><span class="red">enviada!</span></h1>' +
          '<p class="lead">Te confirmamos por email en cuanto la revisemos.</p>' + bookingCard(b) +
          '<div class="btns" style="margin-top:18px"><a class="btn btn--red" href="#/reservas">Ver mis reservas</a><a class="btn btn--ghost" href="#/inicio" id="again">Otra reserva</a></div></section>';
        $("#again").onclick = function (e) { e.preventDefault(); render(); };
        window.scrollTo(0, 0);
      }).catch(function (e) {
        toast(e.message, true);
        if (e.status === 409) { AV.loaded = 0; loadAvail(true).then(function () { W.hour = null; drawCal(); drawSummary(); }); }
        else drawSummary();
      });
    };
    if (!S.user) loginFlow("Para reservar entra con tu email: te mandamos un código de 6 cifras.").then(function (ok) { if (ok) { if (isAdmin()) { toast("Eres del equipo: las reservas manuales se hacen desde Agenda."); return; } go_(); } });
    else go_();
  }

  /* =====================================================================
     CLIENTE · MIS RESERVAS
     ===================================================================== */
  function bookingCard(b, actions) {
    var dt = parseDay(b.dia);
    return '<div class="card"><div class="bk"><div class="bk__date"><small>' + DIAS[dt.getDay()] + "</small><b>" + dt.getDate() + "</b><small>" + MESES[dt.getMonth()].slice(0, 3) + "</small></div>" +
      '<div><div class="row" style="align-items:flex-start"><div class="bk__t">' + esc(b.texto || b.servicio) + '</div><span class="badge badge--' + b.estado + '">' + (ESTADOS[b.estado] || b.estado) + "</span></div>" +
      '<div class="bk__m">' + franja(b.hora, b.horas) + " · " + P.eur(b.precio) + " €" + (b.club ? " · Formato Club" : "") + "</div>" +
      (b.nombre ? '<div class="bk__m">' + esc(b.nombre) + (b.telefono ? " · " + esc(b.telefono) : "") + "</div>" : "") +
      (b.notas ? '<div class="bk__m">“' + esc(b.notas) + '”</div>' : "") +
      (actions || "") + "</div></div></div>";
  }

  ROUTES.reservas = function () {
    if (!S.user) { needLogin("Entra para ver tus reservas."); return; }
    loading();
    api("reservas").then(function (j) {
      var t = today(), up = [], past = [];
      j.reservas.forEach(function (b) { (b.dia >= t && (b.estado === "pendiente" || b.estado === "confirmada") ? up : past).push(b); });
      up.sort(function (a, b) { return (a.dia + pad(a.hora)).localeCompare(b.dia + pad(b.hora)); });
      view.innerHTML = '<section class="pad"><h1 class="h1">Mis<br><span class="red">reservas</span></h1>' +
        '<h2 class="h2">Próximas <small>' + up.length + "</small></h2>" +
        (up.length ? up.map(function (b) {
          return bookingCard(b, b.cancelable ? '<div class="btns" style="margin-top:10px"><button class="btn btn--sm btn--danger" data-cancel="' + b.id + '">Cancelar</button></div>'
            : '<p class="hint">Para cambiarla, escríbenos por WhatsApp.</p>');
        }).join("") : '<div class="empty">No tienes reservas próximas. <a href="#/inicio">Reserva tu cabina</a></div>') +
        (past.length ? '<h2 class="h2">Historial</h2>' + past.slice(0, 30).map(function (b) { return bookingCard(b); }).join("") : "") +
        "</section>";
      $$("[data-cancel]").forEach(function (b) {
        b.onclick = function () {
          confirmSheet("¿Cancelar la reserva?", "Se libera la hora para otra persona.", "Sí, cancelar", true).then(function (ok) {
            if (!ok) return;
            api("reservas/cancelar", { id: +b.getAttribute("data-cancel") }).then(function () { toast("Reserva cancelada"); AV.loaded = 0; loadMe(); render(); }).catch(function (e) { toast(e.message, true); });
          });
        };
      });
    }).catch(function (e) { showError(e); });
  };
  function needLogin(text) {
    view.innerHTML = '<section class="pad"><h1 class="h1">Entra con<br><span class="red">tu email</span></h1><p class="lead">' + esc(text) + '</p><button class="btn btn--red" id="bLogin">Entrar</button></section>';
    $("#bLogin").onclick = function () { loginFlow().then(function (ok) { if (ok) render(); }); };
  }

  /* =====================================================================
     CLIENTE · BONOS Y PLANES
     ===================================================================== */
  function abonoCard(a, admin) {
    var body = "";
    if (a.tipo === "bono") {
      var pct = a.horas ? Math.round(a.usadas / a.horas * 100) : 0;
      body = '<div class="bar"><i style="width:' + pct + '%"></i></div><div class="row small"><span>' + a.quedan + " h libres de " + a.horas + " h</span><span class=\"muted\">" + (a.hasta ? "Caduca " + parseDay(a.hasta).toLocaleDateString("es-ES") : "") + "</span></div>";
    } else {
      body = '<div class="small" style="margin-top:8px">Este mes: práctica ' + a.practicaUsadas + "/" + a.practicaH + " h · grabación " + a.grabacionUsadas + "/" + a.grabacionH + " h</div>" +
        (a.hasta ? '<div class="small muted">Pagado hasta el ' + parseDay(a.hasta).toLocaleDateString("es-ES") + "</div>" : "");
    }
    var mx = P.mixer(a.mixer);
    return '<div class="card' + (a.vigente ? " card--red" : "") + '"><div class="row"><b>' + esc(a.nombre) + '</b><span class="badge badge--' + a.estado + '">' + (ESTADOS[a.estado] || a.estado) + "</span></div>" +
      (a.estado === "solicitado" ? '<p class="small muted" style="margin:6px 0 0">Lo activamos cuando lo pagues en el estudio (' + P.eur(a.precio) + " €).</p>" : body) +
      (a.mixer && a.mixer !== "a9" ? '<div class="small muted">Mezclador: ' + esc(mx.corto) + "</div>" : "") +
      (admin ? '<div class="btns" style="margin-top:10px">' +
        (a.estado === "solicitado" ? '<button class="btn btn--sm btn--ok" data-ab="activar" data-id="' + a.id + '">Activar (pagado)</button>' : "") +
        (a.estado === "activo" && a.tipo === "plan" ? '<button class="btn btn--sm" data-ab="renovar" data-id="' + a.id + '">Renovar 1 mes</button>' : "") +
        (a.estado !== "cancelado" ? '<button class="btn btn--sm btn--danger" data-ab="cancelar" data-id="' + a.id + '">Cancelar</button>' : "") + "</div>" : "") +
      "</div>";
  }

  ROUTES.bonos = function () {
    var mine = (S.abonos || []).filter(function (a) { return a.estado !== "cancelado"; });
    var bonosHtml = D.bonos.tarifas.map(function (t) {
      return '<div class="card"><div class="row"><div><b>Bono ' + t.h + ' h</b><div class="small muted">' + P.eur(t.precio / t.h) + " €/h · caduca en " + t.caducaMeses + " meses</div></div>" +
        '<button class="btn btn--sm' + (t.destaca ? " btn--red" : "") + '" data-req="bono" data-v="' + t.h + '">' + t.precio + " €</button></div></div>";
    }).join("");
    var planesHtml = D.planes.map(function (p) {
      return '<div class="card"><div class="row"><div><b>Plan ' + esc(p.nombre) + '</b><div class="small muted">' + esc(p.items.join(" · ")) + "</div></div>" +
        '<button class="btn btn--sm' + (p.destaca ? " btn--red" : "") + '" data-req="plan" data-v="' + p.id + '">' + p.precio + " €/mes</button></div></div>";
    }).join("");
    view.innerHTML = '<section class="pad"><h1 class="h1">Bonos<br><span class="red">y planes</span></h1>' +
      (S.user ? '<h2 class="h2">Los tuyos</h2>' + (mine.length ? mine.map(function (a) { return abonoCard(a); }).join("") : '<div class="empty">Aún no tienes bonos ni planes.</div>') : "") +
      '<h2 class="h2">Bonos de práctica</h2><p class="small muted" style="margin-top:-6px">' + esc(D.bonos.sub) + "</p>" + bonosHtml +
      '<h2 class="h2">Planes mensuales</h2><p class="small muted" style="margin-top:-6px">' + esc(D.planesSub) + "</p>" + planesHtml +
      '<p class="hint">Lo solicitas aquí y lo pagas en el estudio. En cuanto esté pagado lo activamos y reservas tus horas desde la app.</p></section>';
    $$("[data-req]").forEach(function (b) { b.onclick = function () { requestAbono(b.getAttribute("data-req"), b.getAttribute("data-v")); }; });
  };

  function requestAbono(tipo, v) {
    var start = function () {
      var st = { mixer: "a9", pay: "1" };
      function body() {
        var r, html, data;
        if (tipo === "bono") {
          var t = D.bonos.tarifas.filter(function (x) { return String(x.h) === String(v); })[0];
          r = P.calc({ service: "bono", dur: t.h, mixer: st.mixer });
          data = { tipo: "bono", ref: String(t.h), nombre: "Bono " + t.h + " h", horas: t.h, meses: t.caducaMeses, precio: r.total, mixer: st.mixer };
          html = "<h3>Bono " + t.h + " h</h3><p class=\"muted small\">" + esc(D.bonos.condiciones.join(". ")) + ".</p>";
        } else {
          var p = P.plan(v), po = P.payOpt(st.pay), ph = P.planHours(p);
          r = P.calc({ service: "plan", dur: p.id, mixer: st.mixer, pay: st.pay });
          data = { tipo: "plan", ref: p.id, nombre: "Plan " + p.nombre + (po.meses > 1 ? " · " + po.meses + " meses" : ""), meses: po.meses, practicaH: ph.practica, grabacionH: ph.grabacion, precio: r.total, mixer: st.mixer };
          html = "<h3>Plan " + esc(p.nombre) + '</h3><p class="muted small">' + esc(p.items.join(" · ")) + ". " + esc(D.planesSub) + "</p>" +
            '<div class="step">Forma de pago</div><div class="opts" id="oPay">' + D.planesPago.map(function (o) { return opt("pay", o.id, o.nombre.replace(/ [−-]\d+ %$/, ""), o.dto ? "−" + Math.round(o.dto * 100) + " %" : "Cada mes", st.pay === o.id); }).join("") + "</div>";
        }
        html += '<div class="step">Mezclador habitual</div><div class="opts" id="oMx">' + D.mezcladores.map(function (m) { return opt("mx", m.id, m.corto, m.suplemento ? "+" + (tipo === "plan" ? m.suplemento + " €/mes" : P.bonoSup(v, m.id) + " €") : "Incluido", st.mixer === m.id); }).join("") + "</div>" +
          '<ul class="lines" style="margin-top:14px">' + r.lines.map(function (l) { return "<li><span>" + esc(l[0]) + "</span><b>" + l[1] + " €</b></li>"; }).join("") + "</ul>" +
          '<div class="total"><span class="small muted">' + esc(r.payNote || r.supNotaBono || D.ivaCorto) + "</span><strong>" + P.eur(r.total) + " " + r.unit + "</strong></div>" +
          '<button class="btn btn--red btn--block" style="margin-top:16px" id="bReq">Solicitar · pago en efectivo</button>';
        openSheet(html, function (b) {
          var op = $("#oPay", b); if (op) op.onchange = function (e) { st.pay = e.target.value; body(); };
          $("#oMx", b).onchange = function (e) { st.mixer = e.target.value; body(); };
          $("#bReq", b).onclick = function () {
            this.disabled = true;
            api("abonos/solicitar", data).then(function () { closeSheet(); toast("¡Solicitado! Te lo activamos al pagarlo en el estudio."); return loadMe(); }).then(render).catch(function (e) { toast(e.message, true); closeSheet(); });
          };
        });
      }
      body();
    };
    if (!S.user) loginFlow("Entra con tu email para solicitar tu " + tipo + ".").then(function (ok) { if (ok) start(); });
    else start();
  }

  /* =====================================================================
     CLIENTE · PERFIL
     ===================================================================== */
  ROUTES.perfil = function () {
    if (!S.user) { needLogin("Entra para reservar, ver tus reservas y tus bonos. Te mandamos un código al email, sin contraseñas."); return; }
    view.innerHTML = '<section class="pad"><h1 class="h1">Tu<br><span class="red">perfil</span></h1>' +
      '<div class="card"><div class="small muted">Email</div><b>' + esc(S.user.email) + "</b>" + profileForm() + "</div>" +
      '<h2 class="h2">Contacto</h2><div class="card stack small"><div>' + esc(D.contacto.direccion) + ", " + esc(D.contacto.cp) + " " + esc(D.contacto.ciudad) + "</div>" +
      '<div class="btns"><a class="btn btn--sm" href="' + waLink("Hola, escribo desde la app de Discogaser Studio") + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="btn btn--sm" href="https://www.instagram.com/' + esc(D.contacto.instagram) + '/" target="_blank" rel="noopener">Instagram</a>' +
      '<a class="btn btn--sm" href="' + webUrl("") + '" target="_blank" rel="noopener">Web</a></div></div>' +
      '<div class="btns" style="margin-top:22px"><button class="btn btn--ghost" id="bOut">Cerrar sesión</button></div>' +
      (isAdmin() ? "" : '<p class="hint" style="margin-top:24px"><button class="link" id="bDel">Borrar mi cuenta</button> · <a href="' + webUrl("privacidad.html") + '" target="_blank" rel="noopener">Privacidad</a></p>') +
      "</section>";
    bindProfile(view, function () { render(); }, function (m) { toast(m, true); });
    $("#bOut").onclick = logout;
    var del = $("#bDel");
    if (del) del.onclick = function () {
      confirmSheet("¿Borrar tu cuenta?", "Se borran tu nombre, email y teléfono, y se cancelan tus reservas futuras. Los bonos pagados se pierden. No se puede deshacer.", "Borrar cuenta", true).then(function (ok) {
        if (!ok) return;
        api("yo/borrar", {}).then(function () { setToken(""); S.user = null; S.abonos = []; toast("Cuenta borrada"); go("inicio"); render(); }).catch(function (e) { toast(e.message, true); });
      });
    };
  };
  function logout() {
    api("auth/salir", {}).catch(function () {}).then(function () { setToken(""); S.user = null; S.abonos = []; S.pend = 0; toast("Sesión cerrada"); go("inicio"); render(); });
  }

  /* =====================================================================
     EQUIPO · HOY
     ===================================================================== */
  ROUTES.hoy = function (silent) {
    if (silent !== true) loading();
    api("admin/resumen").then(function (j) {
      S.pend = j.pendientes.length; renderTabs();
      view.innerHTML = '<section class="pad"><h1 class="h1">Hoy en<br><span class="red">el estudio</span></h1>' +
        '<div class="kpis"><div class="kpi"><b>' + j.pendientes.length + '</b><span>Por confirmar</span></div><div class="kpi"><b>' + j.hoy.length + '</b><span>Hoy</span></div><div class="kpi"><b>' + j.proximas + "</b><span>Confirmadas</span></div></div>" +
        '<h2 class="h2">Por confirmar</h2>' + (j.pendientes.length ? j.pendientes.map(function (b) {
          return bookingCard(b, '<div class="btns" style="margin-top:10px"><button class="btn btn--sm btn--ok" data-st="confirmada" data-id="' + b.id + '">Confirmar</button><button class="btn btn--sm btn--danger" data-st="rechazada" data-id="' + b.id + '">No puedo</button><button class="btn btn--sm btn--ghost" data-open="' + b.id + '">Ver</button></div>');
        }).join("") : '<div class="empty">Nada pendiente. 👌</div>') +
        (j.abonosSolicitados.length ? '<h2 class="h2">Bonos y planes solicitados</h2>' + j.abonosSolicitados.map(function (a) {
          return '<div class="card"><div class="row"><div><b>' + esc(a.nombre) + '</b><div class="small muted">' + esc(a.cliente) + " · " + esc(a.telefono) + " · " + P.eur(a.precio) + ' €</div></div></div><div class="btns" style="margin-top:10px"><button class="btn btn--sm btn--ok" data-ab="activar" data-id="' + a.id + '">Activar (pagado)</button><a class="btn btn--sm btn--ghost" href="#/cliente/' + a.clienteId + '">Cliente</a></div></div>';
        }).join("") : "") +
        '<h2 class="h2">Hoy <small>' + esc(fechaCorta(today())) + "</small></h2>" + (j.hoy.length ? j.hoy.map(function (b) { return bookingCard(b, '<div class="btns" style="margin-top:10px"><button class="btn btn--sm btn--ghost" data-open="' + b.id + '">Gestionar</button></div>'); }).join("") : '<div class="empty">Hoy no hay reservas.</div>') +
        '<div class="btns" style="margin-top:20px"><a class="btn btn--red" href="#/agenda">Abrir agenda</a></div></section>';
      var byId = {}; j.pendientes.concat(j.hoy).forEach(function (b) { byId[b.id] = b; });
      bindAdminButtons(byId, function () { ROUTES.hoy(true); });
    }).catch(function (e) { showError(e); });
    if (silent !== true) autoRefresh(ROUTES.hoy);
  };

  function bindAdminButtons(byId, refresh) {
    $$("[data-st]").forEach(function (b) {
      b.onclick = function () { setStatus(+b.getAttribute("data-id"), b.getAttribute("data-st"), refresh); };
    });
    $$("[data-open]").forEach(function (b) { b.onclick = function () { bookingSheet(byId[+b.getAttribute("data-open")], refresh); }; });
    $$("[data-ab]").forEach(function (b) {
      b.onclick = function () {
        var acc = b.getAttribute("data-ab");
        var go2 = function () { api("admin/abonos", { id: +b.getAttribute("data-id"), accion: acc }).then(function () { toast(acc === "activar" ? "Activado y avisado por email" : "Hecho"); refresh(); }).catch(function (e) { toast(e.message, true); }); };
        if (acc === "cancelar") confirmSheet("¿Cancelar?", "El cliente dejará de poder reservar con él.", "Cancelar", true).then(function (ok) { if (ok) go2(); }); else go2();
      };
    });
  }
  function setStatus(id, st, refresh, msg) {
    var send = function (m) { api("admin/reservas/estado", { id: id, estado: st, mensaje: m || "" }).then(function () { toast(st === "confirmada" ? "Confirmada · cliente avisado" : "Hecho"); closeSheet(); refresh(); }).catch(function (e) { toast(e.message, true); }); };
    if (st === "rechazada" || st === "cancelada") {
      openSheet('<h3>' + (st === "rechazada" ? "No puedes atenderla" : "Cancelar reserva") + '</h3><p class="muted small">El cliente recibe un email. Puedes añadir un mensaje.</p><textarea class="input" id="iMsg" placeholder="Ej.: ese día tenemos evento, ¿te viene bien el jueves a la misma hora?"></textarea><button class="btn btn--danger btn--block" style="margin-top:14px" id="bGo">Enviar y liberar la hora</button>', function (b) {
        $("#bGo", b).onclick = function () { send($("#iMsg", b).value); };
      });
    } else send(msg);
  }

  function bookingSheet(b, refresh) {
    if (!b) return;
    var phone = (b.telefono || "").replace(/[^\d+]/g, ""), wa = phone.replace(/^\+/, ""); if (wa && wa.length === 9) wa = "34" + wa;
    var html = '<h3>' + esc(b.texto || b.servicio) + '</h3><span class="badge badge--' + b.estado + '">' + ESTADOS[b.estado] + "</span>" +
      '<ul class="lines" style="margin-top:12px"><li><span>Cuándo</span><b>' + esc(fechaCorta(b.dia)) + ", " + franja(b.hora, b.horas) + "</b></li>" +
      "<li><span>Cliente</span><b>" + esc(b.nombre || "—") + "</b></li>" + (b.email ? "<li><span>Email</span><b>" + esc(b.email) + "</b></li>" : "") +
      "<li><span>Total</span><b>" + P.eur(b.precio) + " €</b></li>" + (b.lineas || []).map(function (l) { return "<li><span>· " + esc(l[0]) + "</span><b>" + l[1] + " €</b></li>"; }).join("") +
      (b.notas ? "<li><span>Notas</span><b style=\"white-space:normal;text-align:right\">" + esc(b.notas) + "</b></li>" : "") + "</ul>" +
      (phone ? '<div class="btns" style="margin-top:12px"><a class="btn btn--sm" href="tel:' + esc(phone) + '">Llamar</a><a class="btn btn--sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '">WhatsApp</a>' + (b.usuario ? '<a class="btn btn--sm btn--ghost" href="#/cliente/' + b.usuario + '">Ficha</a>' : "") + "</div>" : "") +
      '<label class="field"><span>Nota interna (solo la veis vosotros)</span><textarea class="input" id="iNote">' + esc(b.notaInterna) + "</textarea></label>" +
      '<div class="step">Cambiar estado</div><div class="btns">' +
      (b.estado !== "confirmada" ? '<button class="btn btn--sm btn--ok" data-s="confirmada">Confirmar</button>' : "") +
      (b.estado === "confirmada" ? '<button class="btn btn--sm" data-s="completada">Hecha</button><button class="btn btn--sm" data-s="no_vino">No vino</button>' : "") +
      (b.estado === "pendiente" ? '<button class="btn btn--sm btn--danger" data-s="rechazada">No puedo</button>' : "") +
      (b.estado === "confirmada" ? '<button class="btn btn--sm btn--danger" data-s="cancelada">Cancelar</button>' : "") +
      "</div>" +
      '<div class="step">Mover</div><div class="grid2"><input class="input" type="date" id="mDay" value="' + b.dia + '"><select class="input" id="mHour">' + hourOptions(b.hora) + "</select></div>" +
      '<label class="check" style="margin-top:8px"><input type="checkbox" id="mWarn" checked><span class="check__t">Avisar al cliente por email</span></label>' +
      '<div class="btns" style="margin-top:14px"><button class="btn btn--red" id="bSave">Guardar</button></div>';
    openSheet(html, function (s) {
      $$("[data-s]", s).forEach(function (x) { x.onclick = function () { saveNote().then(function () { setStatus(b.id, x.getAttribute("data-s"), refresh); }); }; });
      function saveNote() {
        var n = $("#iNote", s).value; if (n === (b.notaInterna || "")) return Promise.resolve();
        return api("admin/reservas/estado", { id: b.id, estado: b.estado, notaInterna: n });
      }
      $("#bSave", s).onclick = function () {
        var d = $("#mDay", s).value, h = +$("#mHour", s).value, moved = d !== b.dia || h !== b.hora;
        saveNote().then(function () {
          if (!moved) return;
          return api("admin/reservas/mover", { id: b.id, dia: d, hora: h, avisar: $("#mWarn", s).checked }).catch(function (e) {
            if (e.status !== 409) throw e;
            return confirmSheet("Hueco ocupado", esc(e.message) + " ¿La mueves igualmente?", "Mover igualmente").then(function (ok) { if (ok) return api("admin/reservas/mover", { id: b.id, dia: d, hora: h, forzar: true, avisar: true }); throw new Error("No se ha movido"); });
          });
        }).then(function () { toast("Guardado"); closeSheet(); refresh(); }).catch(function (e) { toast(e.message, true); });
      };
    });
  }
  function hourOptions(sel) { var o = ""; for (var h = 7; h <= 23; h++) o += '<option value="' + h + '"' + (h === sel ? " selected" : "") + ">" + h + ":00</option>"; return o; }

  /* =====================================================================
     EQUIPO · AGENDA
     ===================================================================== */
  var A = { day: today() };
  ROUTES.agenda = function (silent) {
    if (silent !== true) loading();
    api("admin/reservas&desde=" + A.day + "&hasta=" + A.day).then(function (j) {
      var open = j.abierto[A.day] || [], list = j.reservas, blocks = j.bloqueos;
      var lo = 24, hi = 0;
      open.forEach(function (r) { lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); });
      list.forEach(function (b) { lo = Math.min(lo, b.hora); hi = Math.max(hi, b.hora + b.horas); });
      if (lo >= hi) { lo = 10; hi = 22; }
      var isOpen = function (h) { return open.some(function (r) { return h >= r[0] && h < r[1]; }); };
      var ROW = 56, rows = "", evs = "";
      for (var h = lo; h < hi; h++) rows += '<div class="tl__h' + (isOpen(h) ? "" : " is-closed") + '"><span>' + h + ":00</span><div></div></div>";
      blocks.forEach(function (x) {
        var s = Math.max(lo, x.desde), e = Math.min(hi, x.hasta); if (e <= s) return;
        evs += '<button class="tl__ev is-block" style="top:' + ((s - lo) * ROW + 2) + "px;height:" + ((e - s) * ROW - 4) + 'px" data-block="' + x.id + '"><b>Bloqueado</b>' + esc(x.motivo || "") + "</button>";
      });
      var shown = list.filter(function (b) { return ["pendiente", "confirmada", "completada", "no_vino"].indexOf(b.estado) > -1; });
      // reservas que coinciden en hora: se reparten en columnas
      var lanes = [], groups = [], grp = null, grpEnd = -1;
      shown.slice().sort(function (a, b) { return a.hora - b.hora; }).forEach(function (b) {
        if (b.hora >= grpEnd) { grp = { n: 0 }; groups.push(grp); lanes = []; }
        var l = 0; while (lanes[l] > b.hora) l++;
        lanes[l] = b.hora + b.horas; b._lane = l; b._grp = grp; grp.n = Math.max(grp.n, l + 1); grpEnd = Math.max(grpEnd, b.hora + b.horas);
      });
      shown.forEach(function (b) {
        var w = 100 / b._grp.n, lane = "left:calc(50px + (100% - 50px) * " + (b._lane * w / 100) + ");right:auto;width:calc((100% - 50px) * " + (w / 100) + " - 4px);";
        evs += '<button class="tl__ev is-' + b.estado + '" style="' + lane + "top:" + ((b.hora - lo) * ROW + 2) + "px;height:" + (b.horas * ROW - 4) + 'px" data-open="' + b.id + '"><b>' + esc(b.nombre || "Cliente") + "</b>" + esc(b.texto) + " · " + franja(b.hora, b.horas) + (b.estado === "pendiente" ? " · PENDIENTE" : "") + "</button>";
      });
      var off = list.filter(function (b) { return shown.indexOf(b) < 0; });
      view.innerHTML = '<section class="pad"><h1 class="h1">Agenda</h1>' +
        '<div class="daynav"><button class="iconbtn" id="dPrev" aria-label="Día anterior">‹</button><input class="input" type="date" id="dPick" value="' + A.day + '"><button class="iconbtn" id="dNext" aria-label="Día siguiente">›</button></div>' +
        '<p class="small muted" style="margin:10px 0 0;text-transform:capitalize">' + esc(fechaCorta(A.day)) + (open.length ? " · abierto " + open.map(function (r) { return r[0] + "–" + r[1] + " h"; }).join(", ") : " · cerrado") +
        (A.day !== today() ? ' · <button class="link" id="dToday">Hoy</button>' : "") + "</p>" +
        '<div class="btns" style="margin-top:12px"><button class="btn btn--sm btn--red" id="bNew">+ Reserva</button><button class="btn btn--sm" id="bBlock">Bloquear horas</button></div>' +
        '<div class="tl">' + rows + evs + "</div>" +
        (off.length ? '<h2 class="h2">Canceladas / rechazadas</h2>' + off.map(function (b) { return bookingCard(b); }).join("") : "") + "</section>";
      var byId = {}; list.forEach(function (b) { byId[b.id] = b; });
      var refresh = function () { ROUTES.agenda(true); };
      bindAdminButtons(byId, refresh);
      $$("[data-block]").forEach(function (x) {
        x.onclick = function () { confirmSheet("¿Quitar el bloqueo?", "Esas horas vuelven a estar libres para reservar.", "Quitar bloqueo").then(function (ok) { if (ok) api("admin/bloqueos/borrar", { id: +x.getAttribute("data-block") }).then(refresh); }); };
      });
      $("#dPrev").onclick = function () { A.day = addDays(A.day, -1); ROUTES.agenda(); };
      $("#dNext").onclick = function () { A.day = addDays(A.day, 1); ROUTES.agenda(); };
      $("#dPick").onchange = function (e) { if (e.target.value) { A.day = e.target.value; ROUTES.agenda(); } };
      var dt = $("#dToday"); if (dt) dt.onclick = function () { A.day = today(); ROUTES.agenda(); };
      $("#bNew").onclick = function () { manualBooking(refresh); };
      $("#bBlock").onclick = function () { blockSheet(refresh); };
    }).catch(function (e) { showError(e); });
    if (silent !== true) autoRefresh(ROUTES.agenda);
  };

  function blockSheet(refresh) {
    openSheet('<h3>Bloquear horas</h3><p class="muted small">Vacaciones, eventos, mantenimiento… Nadie podrá reservar esas horas.</p>' +
      '<div class="grid2"><label class="field"><span>Desde el día</span><input class="input" type="date" id="bD1" value="' + A.day + '"></label><label class="field"><span>Hasta el día</span><input class="input" type="date" id="bD2" value="' + A.day + '"></label></div>' +
      '<label class="check" style="margin-top:12px"><input type="checkbox" id="bAll" checked><span class="check__t">Todo el día</span></label>' +
      '<div class="grid2" id="bHrs" hidden><label class="field"><span>De</span><select class="input" id="bH1">' + hourOptions(16) + '</select></label><label class="field"><span>A</span><select class="input" id="bH2">' + hourOptions(22) + "</select></label></div>" +
      '<label class="field"><span>Motivo (solo lo veis vosotros)</span><input class="input" id="bWhy" placeholder="Ej.: vacaciones"></label>' +
      '<button class="btn btn--red btn--block" style="margin-top:16px" id="bGo">Bloquear</button>', function (s) {
      $("#bAll", s).onchange = function (e) { $("#bHrs", s).hidden = e.target.checked; };
      $("#bGo", s).onclick = function () {
        var all = $("#bAll", s).checked;
        api("admin/bloqueos", { dia: $("#bD1", s).value, hastaDia: $("#bD2", s).value, desde: all ? 0 : +$("#bH1", s).value, hasta: all ? 24 : +$("#bH2", s).value, motivo: $("#bWhy", s).value })
          .then(function (j) { toast(j.dias + (j.dias === 1 ? " día bloqueado" : " días bloqueados")); closeSheet(); refresh(); }).catch(function (e) { toast(e.message, true); });
      };
    });
  }

  function manualBooking(refresh, preUser) {
    var M = { user: preUser || null, abonos: [], service: "pinchar", dur: 2, mixer: "a9", kind: "practica", abono: null };
    function draw() {
      var svcs = [["pinchar", "Pinchar"], ["grabar", "Grabar"], ["pack", "Pack"]];
      var ab = M.abonos.filter(function (a) { return a.vigente; });
      ab.forEach(function (a) { svcs.push([(a.tipo === "bono" ? "usoBono" : "usoPlan") + ":" + a.id, a.nombre]); });
      var cur = M.abono ? (M.service + ":" + M.abono) : M.service;
      var durSel = M.service === "pack" ? D.packs.map(function (p) { return '<option value="' + p.id + '"' + (M.dur === p.id ? " selected" : "") + ">" + esc(p.nombre) + " (" + p.horas + " h)</option>"; }).join("")
        : [1, 2, 3].map(function (h) { return '<option value="' + h + '"' + (+M.dur === h ? " selected" : "") + ">" + h + " h</option>"; }).join("");
      var hrs = M.service === "pack" ? (P.pack(M.dur) || {}).horas || 2 : +M.dur;
      var r = P.calc({ service: M.service, dur: M.dur, mixer: M.mixer, kind: M.kind, extras: {}, club: false });
      openSheet('<h3>Nueva reserva</h3>' +
        (M.user ? '<div class="card row"><div><b>' + esc(M.user.name || M.user.email) + '</b><div class="small muted">' + esc(M.user.phone || "") + " · " + esc(M.user.email) + '</div></div><button class="link" id="mChange">Cambiar</button></div>'
          : '<label class="field"><span>Buscar cliente con cuenta</span><input class="input" id="mSearch" placeholder="Nombre, email o teléfono"></label><div id="mResults"></div>' +
            '<p class="small muted" style="margin:12px 0 0">…o sin cuenta (por WhatsApp o teléfono):</p><div class="grid2"><input class="input" id="mName" placeholder="Nombre"><input class="input" id="mPhone" type="tel" placeholder="Teléfono"></div>') +
        '<label class="field"><span>Servicio</span><select class="input" id="mSvc">' + svcs.map(function (s) { return '<option value="' + s[0] + '"' + (cur === s[0] ? " selected" : "") + ">" + esc(s[1]) + "</option>"; }).join("") + "</select></label>" +
        (M.service === "usoPlan" ? '<label class="field"><span>Tipo</span><select class="input" id="mKind"><option value="practica">Práctica</option><option value="grabacion"' + (M.kind === "grabacion" ? " selected" : "") + ">Grabación</option></select></label>" : "") +
        '<div class="grid2"><label class="field"><span>' + (M.service === "pack" ? "Pack" : "Horas") + '</span><select class="input" id="mDur">' + durSel + '</select></label><label class="field"><span>Mezclador</span><select class="input" id="mMix">' +
        D.mezcladores.map(function (m) { return '<option value="' + m.id + '"' + (M.mixer === m.id ? " selected" : "") + ">" + esc(m.corto) + "</option>"; }).join("") + "</select></label></div>" +
        '<div class="grid2"><label class="field"><span>Día</span><input class="input" type="date" id="mDay" value="' + (M.day || A.day) + '"></label><label class="field"><span>Hora</span><select class="input" id="mHour">' + hourOptions(M.hour || 17) + "</select></label></div>" +
        '<label class="field"><span>Precio (€)</span><input class="input" id="mPrice" inputmode="numeric" value="' + (M.price != null ? M.price : r.total) + '"></label>' +
        '<label class="field"><span>Nota interna</span><input class="input" id="mNote"></label>' +
        (M.user ? '<label class="check" style="margin-top:10px"><input type="checkbox" id="mWarn" checked><span class="check__t">Enviarle la confirmación por email</span></label>' : "") +
        '<button class="btn btn--red btn--block" style="margin-top:16px" id="mGo">Reservar ' + hrs + " h</button>", function (s) {
        var keep = function () { M.day = $("#mDay", s).value; M.hour = +$("#mHour", s).value; M.price = null; };
        $("#mSvc", s).onchange = function (e) { keep(); var v = e.target.value.split(":"); M.service = v[0]; M.abono = v[1] ? +v[1] : null; M.dur = M.service === "pack" ? "pro" : 2; draw(); };
        $("#mDur", s).onchange = function (e) { keep(); M.dur = M.service === "pack" ? e.target.value : +e.target.value; draw(); };
        $("#mMix", s).onchange = function (e) { keep(); M.mixer = e.target.value; draw(); };
        var mk = $("#mKind", s); if (mk) mk.onchange = function (e) { keep(); M.kind = e.target.value; draw(); };
        var ch = $("#mChange", s); if (ch) ch.onclick = function () { keep(); M.user = null; M.abonos = []; M.abono = null; if (M.service.indexOf("uso") === 0) M.service = "pinchar"; draw(); };
        var se = $("#mSearch", s), st;
        if (se) se.oninput = function () {
          clearTimeout(st); var q = se.value.trim(); if (q.length < 2) { $("#mResults", s).innerHTML = ""; return; }
          st = setTimeout(function () {
            api("admin/clientes&buscar=" + encodeURIComponent(q)).then(function (j) {
              $("#mResults", s).innerHTML = j.clientes.slice(0, 6).map(function (c) { return '<button class="card client" style="width:100%;margin-top:6px;text-align:left" data-c="' + c.id + '"><span><b>' + esc(c.name || c.email) + '</b><br><small class="muted">' + esc(c.phone) + " · " + esc(c.email) + "</small></span><span>›</span></button>"; }).join("") || '<p class="small muted">Sin resultados.</p>';
              $$("[data-c]", s).forEach(function (b) {
                b.onclick = function () {
                  keep(); api("admin/cliente&id=" + b.getAttribute("data-c")).then(function (c) { M.user = { id: c.cliente.id, name: c.cliente.name, phone: c.cliente.phone, email: c.cliente.email }; M.abonos = c.abonos; draw(); });
                };
              });
            });
          }, 250);
        };
        $("#mGo", s).onclick = function () {
          var p = { servicio: M.service, detalle: String(M.dur), horas: hrs, mixer: M.mixer, tipo: M.kind, abono: M.abono, dia: $("#mDay", s).value, hora: +$("#mHour", s).value,
            precio: +$("#mPrice", s).value || 0, texto: r.svcLabel + " · " + P.mixer(M.mixer).corto, lineas: r.lines, notaInterna: $("#mNote", s).value, estado: "confirmada" };
          if (M.user) { p.usuario = M.user.id; p.avisar = $("#mWarn", s).checked; } else { p.nombre = $("#mName", s).value; p.telefono = $("#mPhone", s).value; }
          var send = function (force) {
            p.forzar = !!force;
            return api("admin/reservas", p).then(function () { toast("Reserva creada"); closeSheet(); A.day = p.dia; refresh(); });
          };
          send(false).catch(function (e) {
            if (e.status === 409) confirmSheet("Hueco ocupado", esc(e.message) + " ¿Reservar igualmente?", "Reservar igualmente").then(function (ok) { if (ok) send(true).catch(function (x) { toast(x.message, true); }); });
            else toast(e.message, true);
          });
        };
      });
    }
    if (preUser) api("admin/cliente&id=" + preUser.id).then(function (c) { M.abonos = c.abonos; draw(); }); else draw();
  }

  /* =====================================================================
     EQUIPO · CLIENTES
     ===================================================================== */
  var CL = { q: "" };
  ROUTES.clientes = function () {
    view.innerHTML = '<section class="pad"><h1 class="h1">Clientes</h1><div class="search"><input class="input" id="cQ" type="search" placeholder="Buscar por nombre, email o teléfono" value="' + esc(CL.q) + '"></div>' +
      '<div class="btns" style="margin:4px 0 8px"><button class="btn btn--sm" id="cNew">+ Cliente</button></div><div id="cList"><div class="spin"></div></div></section>';
    var t;
    function load() {
      api("admin/clientes&buscar=" + encodeURIComponent(CL.q)).then(function (j) {
        $("#cList").innerHTML = j.clientes.length ? j.clientes.map(function (c) {
          return '<a class="card client" href="#/cliente/' + c.id + '"><span><b>' + esc(c.name || "(sin nombre)") + (c.role === "admin" ? ' <span class="badge">Equipo</span>' : "") + '</b><br><small class="muted">' + esc(c.phone || "") + " · " + esc(c.email) + "</small></span>" +
            '<span class="small muted" style="text-align:right">' + c.reservas + " res." + (+c.abonos ? "<br>" + c.abonos + " bono/plan" : "") + "</span></a>";
        }).join("") : '<div class="empty">Sin clientes' + (CL.q ? " con esa búsqueda" : " todavía") + ".</div>";
      }).catch(function (e) { $("#cList").innerHTML = '<p class="err">' + esc(e.message) + "</p>"; });
    }
    $("#cQ").oninput = function (e) { CL.q = e.target.value; clearTimeout(t); t = setTimeout(load, 250); };
    $("#cNew").onclick = function () {
      openSheet('<h3>Nuevo cliente</h3><p class="muted small">Para clientes que aún no usan la app. Cuando entren con este email verán sus reservas y bonos.</p>' +
        '<label class="field"><span>Email</span><input class="input" id="nE" type="email"></label><label class="field"><span>Nombre</span><input class="input" id="nN"></label><label class="field"><span>Teléfono</span><input class="input" id="nP" type="tel"></label>' +
        '<button class="btn btn--red btn--block" style="margin-top:16px" id="nGo">Crear</button>', function (s) {
        $("#nGo", s).onclick = function () {
          api("admin/cliente", { email: $("#nE", s).value, nombre: $("#nN", s).value, telefono: $("#nP", s).value }).then(function (j) { closeSheet(); go("cliente/" + j.id); }).catch(function (e) { toast(e.message, true); });
        };
      });
    };
    load();
  };

  ROUTES.cliente = function (id) {
    loading();
    api("admin/cliente&id=" + encodeURIComponent(id)).then(function (j) {
      var c = j.cliente, refresh = function () { ROUTES.cliente(id); };
      view.innerHTML = '<section class="pad"><p class="small"><a href="#/clientes">‹ Clientes</a></p><h1 class="h1" style="font-size:34px">' + esc(c.name || c.email) + "</h1>" +
        '<div class="card"><div class="small muted">' + esc(c.email) + " · cliente desde " + new Date(c.alta * 1000).toLocaleDateString("es-ES") + "</div>" +
        '<label class="field"><span>Nombre</span><input class="input" id="eN" value="' + esc(c.name) + '"></label><label class="field"><span>Teléfono</span><input class="input" id="eP" value="' + esc(c.phone) + '"></label>' +
        '<label class="field"><span>Notas (solo equipo)</span><textarea class="input" id="eNotes" placeholder="Estilo, equipo que trae, preferencias…">' + esc(c.notas) + "</textarea></label>" +
        '<div class="btns" style="margin-top:12px"><button class="btn btn--sm btn--red" id="eSave">Guardar</button><button class="btn btn--sm" id="eBook">+ Reserva</button></div></div>' +
        '<h2 class="h2">Bonos y planes <button class="btn btn--sm" id="aNew">+ Añadir</button></h2>' + (j.abonos.length ? j.abonos.map(function (a) { return abonoCard(a, true); }).join("") : '<div class="empty">Sin bonos ni planes.</div>') +
        '<h2 class="h2">Reservas <small>' + j.reservas.length + "</small></h2>" + (j.reservas.length ? j.reservas.map(function (b) { return bookingCard(b); }).join("") : '<div class="empty">Sin reservas.</div>') + "</section>";
      bindAdminButtons({}, refresh);
      $("#eSave").onclick = function () { api("admin/cliente", { id: c.id, nombre: $("#eN").value, telefono: $("#eP").value, notas: $("#eNotes").value }).then(function () { toast("Guardado"); }).catch(function (e) { toast(e.message, true); }); };
      $("#eBook").onclick = function () { manualBooking(refresh, { id: c.id, name: c.name, phone: c.phone, email: c.email }); };
      $("#aNew").onclick = function () { abonoSheet(c, refresh); };
    }).catch(function (e) { showError(e); });
  };

  function abonoSheet(c, refresh) {
    var opts = D.bonos.tarifas.map(function (t) { return { v: "bono:" + t.h, label: "Bono " + t.h + " h · " + t.precio + " €", d: { tipo: "bono", ref: String(t.h), nombre: "Bono " + t.h + " h", horas: t.h, meses: t.caducaMeses, precio: t.precio } }; })
      .concat(D.planes.map(function (p) { var ph = P.planHours(p); return { v: "plan:" + p.id, label: "Plan " + p.nombre + " · " + p.precio + " €/mes", d: { tipo: "plan", ref: p.id, nombre: "Plan " + p.nombre, practicaH: ph.practica, grabacionH: ph.grabacion, meses: 1, precio: p.precio } }; }));
    openSheet('<h3>Añadir bono o plan</h3><p class="muted small">Queda activo desde hoy (ya pagado).</p>' +
      '<label class="field"><span>¿Qué?</span><select class="input" id="aT">' + opts.map(function (o) { return '<option value="' + o.v + '">' + esc(o.label) + "</option>"; }).join("") + "</select></label>" +
      '<div class="grid2"><label class="field"><span>Meses de validez</span><input class="input" id="aM" inputmode="numeric"></label><label class="field"><span>Precio cobrado (€)</span><input class="input" id="aP" inputmode="numeric"></label></div>' +
      '<label class="field"><span>Mezclador</span><select class="input" id="aX">' + D.mezcladores.map(function (m) { return '<option value="' + m.id + '">' + esc(m.corto) + "</option>"; }).join("") + "</select></label>" +
      '<button class="btn btn--red btn--block" style="margin-top:16px" id="aGo">Añadir</button>', function (s) {
      function pick() { return opts.filter(function (x) { return x.v === $("#aT", s).value; })[0]; }
      function fill() { var o = pick(); $("#aM", s).value = o.d.meses; $("#aP", s).value = o.d.precio; }
      $("#aT", s).onchange = fill; fill();
      $("#aGo", s).onclick = function () {
        var d = Object.assign({}, pick().d, { usuario: c.id, meses: +$("#aM", s).value || 1, precio: +$("#aP", s).value || 0, mixer: $("#aX", s).value, estado: "activo" });
        api("admin/abonos", d).then(function () { toast("Añadido"); closeSheet(); refresh(); }).catch(function (e) { toast(e.message, true); });
      };
    });
  }

  /* =====================================================================
     EQUIPO · AJUSTES
     ===================================================================== */
  ROUTES.ajustes = function () {
    loading();
    api("admin/ajustes").then(function (j) {
      var a = j.ajustes, order = ["1", "2", "3", "4", "5", "6", "0"];
      var sched = order.map(function (d) {
        var r = a.horario[d] || [], r1 = r[0] || ["", ""], r2 = r[1] || ["", ""];
        return '<div class="sched" data-d="' + d + '"><b>' + DIAS[+d] + '</b><input class="input" inputmode="numeric" placeholder="Cerrado" value="' + (r1[0] !== "" ? r1[0] + "-" + r1[1] : "") + '" aria-label="' + DIAS_L[+d] + ' tramo 1">' +
          '<input class="input" inputmode="numeric" placeholder="2º tramo" value="' + (r2[0] !== "" ? r2[0] + "-" + r2[1] : "") + '" aria-label="' + DIAS_L[+d] + ' tramo 2"><span></span></div>';
      }).join("");
      function num(k, label, hint) { return '<label class="field"><span>' + label + '</span><input class="input" inputmode="numeric" data-k="' + k + '" value="' + a[k] + '"><div class="hint">' + hint + "</div></label>"; }
      view.innerHTML = '<section class="pad"><h1 class="h1">Ajustes</h1>' +
        '<h2 class="h2">Horario de reservas</h2><p class="small muted" style="margin-top:-6px">Escribe los tramos como <b>16-22</b>. Vacío = cerrado. Para vacaciones o eventos usa “Bloquear horas” en la agenda.</p>' + sched +
        '<h2 class="h2">Normas</h2>' +
        num("avisoMinHoras", "Antelación mínima (horas)", "Con menos antelación no se puede reservar desde la app.") +
        num("cancelHoras", "Cancelación gratis hasta (horas antes)", "Después, el cliente tiene que escribiros.") +
        num("diasVista", "Días que se pueden reservar por delante", "") +
        num("maxHoras", "Horas seguidas por reserva", "") +
        num("clubDias", "Formato Club: días de antelación", "") +
        '<label class="field"><span>Aviso en la app (opcional)</span><input class="input" data-k="mensaje" value="' + esc(a.mensaje) + '" placeholder="Ej.: del 24 al 26 de diciembre cerramos"></label>' +
        '<button class="btn btn--red btn--block" style="margin-top:18px" id="sSave">Guardar ajustes</button>' +
        '<h2 class="h2">Tu cuenta</h2><div class="card"><div class="small muted">Has entrado como</div><b>' + esc(S.user.email) + '</b><div class="btns" style="margin-top:12px"><a class="btn btn--sm" href="#/inicio">Ver como cliente</a><button class="btn btn--sm btn--ghost" id="bOut">Cerrar sesión</button></div></div></section>';
      $("#bOut").onclick = logout;
      $("#sSave").onclick = function () {
        var h = {}, bad = false;
        $$(".sched").forEach(function (row) {
          var d = row.getAttribute("data-d"); h[d] = [];
          $$("input", row).forEach(function (inp) {
            var v = inp.value.replace(/\s/g, ""); if (!v) return;
            var m = v.match(/^(\d{1,2})[-–:a](\d{1,2})$/);
            if (!m || +m[2] <= +m[1] || +m[2] > 24) { bad = true; inp.style.borderColor = "var(--red)"; return; }
            inp.style.borderColor = ""; h[d].push([+m[1], +m[2]]);
          });
        });
        if (bad) { toast("Revisa los tramos marcados en rojo (formato 16-22)", true); return; }
        var data = { horario: h };
        $$("[data-k]").forEach(function (i) { data[i.getAttribute("data-k")] = i.getAttribute("data-k") === "mensaje" ? i.value : +i.value; });
        api("admin/ajustes", data).then(function () { toast("Ajustes guardados"); S.ajustes = null; AV.loaded = 0; }).catch(function (e) { toast(e.message, true); });
      };
    }).catch(function (e) { showError(e); });
  };

  /* =====================================================================
     ARRANQUE
     ===================================================================== */
  function loadRemoteData() {
    // En las apps nativas, descarga los precios actuales de la web (si falla, usa los que trae la app)
    if (!C.datosRemotos) return Promise.resolve();
    return new Promise(function (res) {
      var s = document.createElement("script"), done = false, fin = function () { if (!done) { done = true; D = window.DGS; res(); } };
      s.src = C.datosRemotos + (C.datosRemotos.indexOf("?") > -1 ? "&" : "?") + "t=" + Math.floor(Date.now() / 600000);
      s.onload = fin; s.onerror = fin; setTimeout(fin, 3500);
      document.head.appendChild(s);
    });
  }

  function boot() {
    if (!D || !P) { view.innerHTML = '<section class="pad"><h1 class="h1">Vaya</h1><p class="muted">No se han podido cargar los precios. Recarga la página.</p></section>'; return; }
    var tw = $("#topWeb"); tw.href = webUrl(""); if (C.nativa) { tw.target = "_blank"; tw.rel = "noopener"; }
    loadRemoteData().then(loadMe).then(function () {
      if (isAdmin()) api("admin/resumen").then(function (j) { S.pend = j.pendientes.length; renderTabs(); }).catch(function () {});
      window.addEventListener("hashchange", render);
      render();
    });
  }
  boot();
})();
