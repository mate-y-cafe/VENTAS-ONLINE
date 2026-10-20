// POST /api/crear-preferencia: valida el pedido completo y devuelve el link de pago de Mercado Pago.
const { validarPedido } = require("../lib/pedido");
const { crearPreferencia } = require("../lib/mercadopago");
const { leerBody, enviarJson } = require("../lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") return enviarJson(res, 405, { error: "Método no permitido" });
  try {
    const body = await leerBody(req);
    const pedido = await validarPedido(body);
    if (!pedido.ok) {
      return enviarJson(res, 422, { errores: pedido.errores, faltantes: pedido.faltantes });
    }
    if (body.pago !== "mercadopago") {
      return enviarJson(res, 422, { errores: ["Esta ruta es solo para Mercado Pago."] });
    }

    const { pedidoId, initPoint } = await crearPreferencia({
      lineas: pedido.lineas,
      envio: pedido.totales.envio,
      comprador: body.comprador,
      consumos: pedido.necesidad,
    });
    enviarJson(res, 200, { pedidoId, init_point: initPoint });
  } catch (e) {
    console.error(e);
    enviarJson(res, 500, { error: "No se pudo crear el pago. Probá de nuevo." });
  }
};
