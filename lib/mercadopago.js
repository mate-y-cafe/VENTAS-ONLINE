// Cliente de Mercado Pago. Credenciales solo desde variables de entorno.
const { randomUUID } = require("crypto");

const MP_API = "https://api.mercadopago.com";

function env(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

async function mp(path, opciones = {}) {
  const res = await fetch(`${MP_API}${path}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${env("MP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...opciones.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}: ${data.message ?? ""}`);
  return data;
}

// Crea la preferencia. `metadata.consumos` viaja con el pago para que el webhook sepa qué descontar.
async function crearPreferencia({ lineas, envio, comprador, consumos }) {
  const base = env("PUBLIC_BASE_URL");
  const pedidoId = randomUUID();

  const items = lineas.map((l) => ({
    id: l.id,
    title: l.nombre,
    quantity: l.cantidad,
    unit_price: l.precio,
    currency_id: "ARS",
  }));
  if (envio > 0) {
    items.push({ id: "envio", title: "Envío a domicilio", quantity: 1, unit_price: envio, currency_id: "ARS" });
  }

  const preferencia = await mp("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items,
      external_reference: pedidoId,
      payer: { name: comprador.nombre },
      notification_url: `${base}/api/webhook-mp`,
      back_urls: {
        success: `${base}/tienda/gracias.html?estado=aprobado`,
        pending: `${base}/tienda/gracias.html?estado=pendiente`,
        failure: `${base}/tienda/gracias.html?estado=rechazado`,
      },
      auto_return: "approved",
      metadata: { consumos },
    }),
  });

  return { pedidoId, initPoint: preferencia.init_point };
}

// Consulta el pago a la API. Nunca confiar en el cuerpo de la notificación.
async function consultarPago(pagoId) {
  return mp(`/v1/payments/${encodeURIComponent(pagoId)}`);
}

module.exports = { crearPreferencia, consultarPago };
