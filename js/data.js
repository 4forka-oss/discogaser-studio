/* =====================================================================
   DISCOGASER STUDIO · DATOS DE LA WEB
   ---------------------------------------------------------------------
   ÚNICO sitio donde se cambian precios, servicios, extras y contacto.
   Las tablas de precios, el configurador, el mensaje de WhatsApp y el
   JSON-LD de servicios se generan a partir de este objeto.
   Edita solo los valores (lo que va entre comillas o los números).
   ===================================================================== */
window.DGS = {
  contacto: {
    // [TELÉFONO WHATSAPP] → formato internacional sin + ni espacios. Ej.: "34612345678"
    whatsapp: "34600000000",
    telefonoVisible: "[TELÉFONO WHATSAPP]",
    instagram: "discogaser_studio",
    email: "[EMAIL]",
    direccion: "[DIRECCIÓN EXACTA], Polígono La Paz",
    cp: "44195",
    ciudad: "Teruel",
    provincia: "Teruel",
    horario: "[HORARIO] · Lunes a sábado, con cita",
    mapaQuery: "Polígono La Paz, 44195 Teruel"
  },

  // Nota de impuestos que aparece bajo los precios (según el dossier 2027: IVA incluido).
  notaIVA: "Precios con IVA incluido. Masterizado del audio siempre incluido.",
  ivaCorto: "IVA incluido",

  // Precio de la hora suelta: sirve para calcular el ahorro de horas largas y bonos
  horaSuelta: 15,

  // Forma de pago: efectivo; Bizum o transferencia con recargo
  pago: "Todos los pagos se hacen en efectivo en el estudio. Por Bizum o transferencia hay un recargo del 15 %.",
  recargoBizum: 0.15,

  /* Suplemento de mezclador: se cobra POR SESIÓN (por visita), da igual
     que sea 1, 2 o 3 h. Packs: una vez por sesión de grabación (Pack Día
     en dos días = dos veces). Bonos: en cada visita. Planes: una sola vez al mes (15 € o 20 €/mes, se usen las horas que se usen). */
  mezcladores: [
    { id: "a9",    nombre: "Pioneer DJM-A9",            corto: "DJM-A9",  suplemento: 0 },
    { id: "model1",nombre: "PLAYdifferently Model 1",   corto: "Model 1", suplemento: 20 },
    { id: "xone",  nombre: "Allen & Heath Xone:96",     corto: "Xone:96", suplemento: 15 }
  ],
  platos: 4, // la cabina siempre lleva 4 CDJ-3000

  /* ---------- Pinchar / practicar ---------- */
  pinchar: {
    titulo: "Pinchar / practicar",
    sub: "Cabina sola con 4 CDJ-3000. Máximo 3 h seguidas.",
    tarifas: [
      { h: 1, precio: 15 },
      { h: 2, precio: 25 },
      { h: 3, precio: 30, destaca: true }
    ]
  },

  /* ---------- Bonos de práctica DJ ---------- */
  bonos: {
    titulo: "Bonos de práctica DJ",
    sub: "",
    /* sup: suplemento de mezclador para todo el bono (se paga una vez al
       comprarlo). Cuanto más grande el bono, menos sale por hora. */
    tarifas: [
      { h: 10, precio: 90,  caducaMeses: 3, sup: { xone: 35, model1: 40 } },
      { h: 20, precio: 160, caducaMeses: 4, sup: { xone: 60, model1: 70 } },
      { h: 30, precio: 210, caducaMeses: 6, sup: { xone: 75, model1: 90 }, destaca: true },
      { h: 40, precio: 240, caducaMeses: 6, sup: { xone: 80, model1: 100 } }
    ],
    condiciones: [
      "En cada visita reservas 1, 2 o 3 horas seguidas, nunca más de 3",
      "Cabina con 4 CDJ-3000. Con Xone:96 o Model 1, un suplemento único al comprar el bono",
      "Se pagan por adelantado y son personales",
      "El ahorro se calcula sobre la hora suelta (15 €/h)"
    ]
  },

  /* ---------- Grabar tu set ---------- */
  grabar: {
    titulo: "Grabar tu set",
    sub: "Cabina + audio + vídeo.",
    incluye: [
      "Audio WAV masterizado",
      "Vídeo en bruto: plano frontal + cenital",
      "Audio del set integrado en el vídeo",
      "Sin edición (si la quieres, mira los packs)",
      "Entrega en 48 h por enlace de descarga"
    ],
    tarifas: [
      { h: 1, precio: 25 },
      { h: 2, precio: 35 },
      { h: 3, precio: 45, destaca: true }
    ]
  },

  /* ---------- Packs de contenido ---------- */
  packs: [
    { id: "reels",  nombre: "Reels",       precio: 59,  horas: 1, destaca: false,
      items: ["1 h de grabación", "Vídeo con edición de planos", "2 reels editados", "Brutos + WAV masterizado"] },
    { id: "sesion", nombre: "Sesión",      precio: 79,  horas: 2, destaca: false,
      items: ["2 h de grabación", "Vídeo con edición de planos", "4 reels editados", "Brutos + WAV masterizado"] },
    { id: "pro",    nombre: "Pro",         precio: 99,  horas: 2, destaca: true,
      items: ["2 h de grabación", "8 reels editados", "Set con edición de planos", "Brutos + WAV masterizado"] },
    { id: "profoto",nombre: "Pro + Foto",  precio: 179, horas: 2, destaca: false, incluyeFoto: true,
      items: ["Todo el Pack Pro", "Fotógrafo durante la sesión", "Fotos editadas para press y redes"] },
    { id: "dia",    nombre: "Día",         precio: 189, horas: 3, destaca: false, incluyeFoto: true, sesiones: 1, sesionesPartido: 2,
      items: ["3 h de grabación, seguidas o 2 × 1 h 30 en días distintos", "8 reels editados", "Fotógrafo profesional durante la sesión", "Brutos + WAV masterizado"] }
  ],
  packsSub: "Aquí editamos nosotros: edición de planos, reels y todos los brutos. Entrega en 72 h.",

  /* ---------- Planes mensuales ----------
     practicaH / grabacionH: horas al mes que la app de reservas deja
     gastar con cada plan (cabina de práctica y horas de grabación). */
  planes: [
    { id: "basico",   nombre: "Básico",    precio: 49,  destaca: false, practicaH: 0, grabacionH: 1,
      items: ["1 h de grabación", "2 reels"] },
    { id: "residente",nombre: "Residente", precio: 69,  destaca: false, practicaH: 8, grabacionH: 1,
      items: ["8 h de cabina", "1 h de grabación"] },
    { id: "creador",  nombre: "Creador",   precio: 89,  destaca: true, practicaH: 2, grabacionH: 2,
      items: ["2 h de grabación", "4 reels", "2 h de práctica", "1 visual de regalo"] },
    { id: "artista",  nombre: "Artista",   precio: 159, destaca: false, practicaH: 4, grabacionH: 4,
      items: ["2 × 2 h de grabación", "8 reels", "4 h de práctica", "3 visuales de regalo"] }
  ],
  // Formas de pago de los planes (el descuento se aplica a la cuota, no al suplemento)
  planesPago: [
    { id: "1",  meses: 1,  dto: 0,    nombre: "Mes a mes" },
    { id: "6",  meses: 6,  dto: 0.05, nombre: "6 meses −5 %" },
    { id: "12", meses: 12, dto: 0.10, nombre: "12 meses −10 %" }
  ],
  planesSub: "Permanencia de 3 meses. Pagando 6 meses, −5 %. Pagando 12 meses, −10 %.",

  /* ---------- Extras ----------
     aplica: en qué servicios del configurador se pueden marcar
     ("grabar", "pack"). "noEnPack": ids de pack donde ya va incluido. */
  extras: [
    { id: "reel",     nombre: "Reels adicionales",            precio: 15,  aplica: ["grabar", "pack"],
      opciones: [{ n: 1, precio: 15 }, { n: 2, precio: 20 }, { n: 3, precio: 25 }, { n: 4, precio: 30 }] },
    { id: "edicion",  nombre: "Vídeo con edición de planos",  precio: 30,  aplica: ["grabar"] },
    { id: "foto",     nombre: "Fotógrafo",                     precio: 100, aplica: ["grabar", "pack"], noEnPack: ["profoto", "dia"] },
    { id: "visuales", nombre: "Pack 3 visuales con tu logo",   precio: 20,  aplica: ["grabar", "pack"] },
    { id: "urgente",  nombre: "Entrega urgente",               precio: 15,  aplica: ["grabar", "pack"] }
  ],

  /* ---------- Formato Club ---------- */
  club: {
    nombre: "Formato Club",
    precio: 50,
    nota: "Exclusivo · consúltanos disponibilidad",
    aforo: 12,
    antelacionDias: 7,
    aplica: ["grabar", "pack"]
  }
};
