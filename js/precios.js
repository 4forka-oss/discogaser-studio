/* =====================================================================
   DISCOGASER STUDIO · CÁLCULO DE PRECIOS (compartido)
   ---------------------------------------------------------------------
   Lo usan la web (configurador) y la app de reservas, así el precio
   siempre sale igual en los dos sitios. Los importes salen de data.js.
   No hace falta tocar este archivo para cambiar precios.
   ===================================================================== */
(function () {
  "use strict";

  function D() { return window.DGS; }
  function byId(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0]; }
  function eur(n) { var r = Math.round(n * 100) / 100; return (r % 1 ? r.toFixed(2).replace(".", ",") : String(r)); }

  function mixer(id) { return byId(D().mezcladores, id) || D().mezcladores[0]; }
  function supOf(id) { var m = byId(D().mezcladores, id); return m ? (m.suplemento || 0) : 0; }
  function pack(id) { return byId(D().packs, id); }
  function plan(id) { return byId(D().planes, id); }
  function payOpt(id) { return byId(D().planesPago, id) || D().planesPago[0]; }
  function hourList(service) {
    var d = D();
    return service === "grabar" ? d.grabar.tarifas : (service === "bono" ? d.bonos.tarifas : d.pinchar.tarifas);
  }

  /* Suplemento de mezclador de un bono (una vez, al comprarlo) */
  function bonoSup(h, mixerId) {
    var t = (D().bonos.tarifas || []).filter(function (x) { return x.h === +h; })[0];
    if (!t || !mixerId || mixerId === "a9") return 0;
    return t.sup && t.sup[mixerId] != null ? t.sup[mixerId] : supOf(mixerId) * Math.ceil(t.h / 3);
  }
  /* Extra con cantidad (reels): devuelve {n, precio} o null */
  function extraPick(e, v) {
    if (!v) return null;
    if (!e.opciones) return { n: 1, precio: e.precio };
    var n = v === true ? 1 : +v;
    return e.opciones.filter(function (o) { return o.n === n; })[0] || e.opciones[0];
  }

  /* Horas de cabina que ocupa una reserva */
  function hoursOf(S) {
    if (S.service === "pack") { var p = pack(S.dur); return p ? p.horas : 2; }
    return +S.dur || 1;
  }

  /* ¿Qué extras admite este servicio? Devuelve {id: {ok, why}} */
  function extrasState(S) {
    var out = {}, d = D();
    d.extras.forEach(function (e) {
      var ok = e.aplica.indexOf(S.service) > -1, why = "";
      if (ok && S.service === "pack" && e.noEnPack && e.noEnPack.indexOf(S.dur) > -1) { ok = false; why = "Ya va incluido en este pack"; }
      if (!ok && !why && S.service === "pack" && e.id === "edicion") why = "Los packs ya llevan edición de planos";
      out[e.id] = { ok: ok, why: why };
    });
    out.club = { ok: d.club.aplica.indexOf(S.service) > -1, why: "" };
    return out;
  }

  /* S = { service, mixer, dur, pay, extras:{id:true}, club:bool }
     service: pinchar | grabar | pack | bono | plan
     + usoBono / usoPlan (reservas de la app que gastan horas ya pagadas) */
  function calc(S) {
    var d = D(), lines = [], total = 0, svcLabel, unit = "€", payNote = "", exNames = [], supNotaBono = "";
    var m = mixer(S.mixer), sp = supOf(S.mixer);

    if (S.service === "usoBono" || S.service === "usoPlan") {
      var tipo = S.service === "usoBono" ? "bono" : "plan";
      svcLabel = (S.kind === "grabacion" ? "Grabación" : "Práctica") + " " + S.dur + " h con tu " + tipo;
      lines.push([svcLabel, 0]);
      if (sp && S.service === "usoBono" && S.abonoMixer === S.mixer) supNotaBono = "Suplemento " + m.corto + " incluido en tu bono";
      else if (sp && S.service === "usoBono") { total += sp; lines.push(["Suplemento " + m.corto, sp]); exNames.push("suplemento " + m.corto + " (+" + sp + " €)"); }
      if (sp && S.service === "usoPlan") supNotaBono = "Suplemento " + m.corto + " incluido en tu cuota mensual";
      return { total: total, lines: lines, svcLabel: svcLabel, exNames: exNames, supNotaBono: supNotaBono, unit: unit, payNote: "", hours: +S.dur || 1 };
    }

    if (S.service === "plan") {
      var pl = plan(S.dur) || d.planes[0], po = payOpt(S.pay);
      var cuota = Math.round(pl.precio * po.meses * (1 - po.dto));
      svcLabel = "Plan " + pl.nombre + (po.meses > 1 ? " · " + po.meses + " meses" : " · mes a mes");
      lines.push([svcLabel + (po.dto ? " (−" + Math.round(po.dto * 100) + " %)" : ""), cuota]);
      total = cuota;
      if (sp) {
        var supT = sp * po.meses;
        lines.push(["Suplemento " + m.corto + (po.meses > 1 ? " (" + sp + " €/mes × " + po.meses + ")" : " (al mes)"), supT]);
        total += supT;
        exNames.push("suplemento " + m.corto + " (+" + supT + " €)");
      }
      if (po.meses === 1) { unit = "€/mes"; payNote = "Pago mensual por adelantado · permanencia 3 meses"; }
      else payNote = "Pago único por adelantado · sale a " + eur(total / po.meses) + " €/mes";
      return { total: total, lines: lines, svcLabel: svcLabel, exNames: exNames, supNotaBono: "", unit: unit, payNote: payNote, hours: 0 };
    }

    if (S.service === "pack") {
      var p = pack(S.dur) || d.packs[0]; total += p.precio; svcLabel = "Pack " + p.nombre;
      lines.push([svcLabel, p.precio]);
    } else {
      var t = hourList(S.service).filter(function (x) { return x.h === +S.dur; })[0] || hourList(S.service)[0];
      total += t.precio;
      svcLabel = (S.service === "grabar" ? "Grabar " : (S.service === "bono" ? "Bono de práctica " : "Pinchar ")) + t.h + " h";
      lines.push([svcLabel, t.precio]);
    }
    if (sp) {
      var spx = S.service === "bono" ? bonoSup(S.dur, S.mixer) : sp;
      total += spx; lines.push(["Suplemento " + m.corto + (S.service === "bono" ? " (todo el bono)" : ""), spx]); exNames.push("suplemento " + m.corto + " (+" + spx + " €)");
    }
    var st = extrasState(S);
    d.extras.forEach(function (e) {
      var pk = S.extras && st[e.id].ok ? extraPick(e, S.extras[e.id]) : null;
      if (pk) {
        var nm = e.opciones ? pk.n + (pk.n > 1 ? " reels adicionales" : " reel adicional") : e.nombre.toLowerCase();
        total += pk.precio; lines.push(["Extra: " + nm, pk.precio]); exNames.push("extra " + nm);
      }
    });
    if (S.club && st.club.ok) { total += d.club.precio; lines.push([d.club.nombre, d.club.precio]); exNames.push(d.club.nombre); }
    if (S.service !== "bono") payNote = "";
    return { total: total, lines: lines, svcLabel: svcLabel, exNames: exNames, supNotaBono: supNotaBono, unit: unit, payNote: payNote, hours: S.service === "bono" ? 0 : hoursOf(S) };
  }

  /* Horas que da cada plan al mes (para la app). Se leen de data.js
     (practicaH / grabacionH) y, si faltan, de los textos del plan. */
  function planHours(p) {
    if (!p) return { practica: 0, grabacion: 0 };
    if (p.practicaH != null || p.grabacionH != null) return { practica: p.practicaH || 0, grabacion: p.grabacionH || 0 };
    return { practica: 0, grabacion: 0 };
  }

  window.DGSPrecio = {
    calc: calc, eur: eur, mixer: mixer, supOf: supOf, pack: pack, plan: plan, payOpt: payOpt,
    hourList: hourList, hoursOf: hoursOf, bonoSup: bonoSup, extraPick: extraPick, extrasState: extrasState, planHours: planHours
  };
})();
