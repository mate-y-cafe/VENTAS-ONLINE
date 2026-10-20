// Notificación de Mercado Pago. Verifica la firma (si hay secreto) y consulta el pago a la API antes de descontar stock.
const { consultarPago } = require("../lib/mercadopago");
const { descontarStock } = require("../lib/stock");
const { firmaValida } = require("../lib/firma");
const { leerBody, enviarJson } = require("../lib/http");

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const body = req.method === "POST" ? await leerBody(req).catch(() => ({})) : {};
    const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type ?? body.topic;
    const pagoId = url.searchParams.get("data.id") ?? body?.data?.id ?? url.searchParams.get("id");

    if (tipo !== "payment" || !pagoId) return enviarJson(res, 200, { ignorado: true });

    const valida = firmaValida({
      header: req.headers?.["x-signature"],
      requestId: req.headers?.["x-request-id"],
      dataId: pagoId,
      secreto: process.env.MP_WEBHOOK_SECRET,
    });
    if (!valida) return enviarJson(res, 401, { error: "Firma inválida" });

    // Siempre se consulta el pago a la API: la notificación solo indica qué mirar.
    const pago = await consultarPago(pagoId);
    if (pago.status === "approved") {
      await descontarStock(pago.metadata?.consumos ?? {}, pago.id);
    }
    enviarJson(res, 200, { status: pago.status });
  } catch (e) {
    // 500 para que Mercado Pago reintente la notificación.
    console.error(e);
    enviarJson(res, 500, { error: "Error procesando la notificación" });
  }
};
