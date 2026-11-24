/* Dónde está la API de reservas.
   En la web: carpeta /api del mismo dominio.
   En las apps de iOS/Android este archivo se reescribe al compilar
   (app-movil/preparar.mjs) con la dirección completa del dominio. */
window.DGS_APP = {
  api: "../api/",
  // En las apps: se descargan los precios actualizados de la web al abrir
  datosRemotos: "",
  web: "../",
  nativa: false
};
