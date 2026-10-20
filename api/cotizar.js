// POST /api/cotizar: devuelve totales y faltantes de stock para mostrar en el carrito.
const { cotizar } = require("../lib/pedido");
const { leerBody, enviarJson } = require("../lib/http");
const { cargarModulos } = require("../lib/modulos");

module.exports = async (req, res) => {
  if (req.method !== "POST") return enviarJson(res, 405, { error: "Método no permitido" });
  try {
    const body = await leerBody(req);
    const r = await cotizar(body);
    const { config } = await cargarModulos();
    enviarJson(res, 200, {
      ok: r.ok,
      errores: r.errores,
      faltantes: r.faltantes,
      lineas: r.lineas,
      totales: r.totales,
      totalTransferencia: r.totalTransferencia,
      envioGratisDesde: config.envio.umbralGratis,
    });
  } catch (e) {
    console.error(e);
    enviarJson(res, 500, { error: "No se pudo cotizar el pedido." });
  }
};
