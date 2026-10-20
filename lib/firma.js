// Verificación de la firma x-signature de Mercado Pago (manifiesto HMAC-SHA256).
// Si no hay MP_WEBHOOK_SECRET, la verificación queda desactivada: el pago igual se consulta a la API.
const { createHmac, timingSafeEqual } = require("crypto");

// header: valor de x-signature ("ts=...,v1=..."). requestId: header x-request-id.
function firmaValida({ header, requestId, dataId, secreto }) {
  if (!secreto) return true;
  if (!header || !dataId) return false;

  const partes = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=")).filter((p) => p.length === 2),
  );
  const { ts, v1 } = partes;
  if (!ts || !v1) return false;

  const manifiesto = `id:${String(dataId).toLowerCase()};request-id:${requestId ?? ""};ts:${ts};`;
  const esperada = createHmac("sha256", secreto).update(manifiesto).digest("hex");

  const a = Buffer.from(esperada);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

module.exports = { firmaValida };
