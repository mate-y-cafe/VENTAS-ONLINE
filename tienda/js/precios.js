// Cálculo de totales. Función pura: la usan el navegador (solo para mostrar) y el servidor (única fuente de verdad).
import { CONFIG } from "./config.js";

// items: [{ precio, cantidad }] con precio ya validado por el servidor.
// opciones: { entrega: "envio" | "retiro", pago: "mercadopago" | "transferencia" | "whatsapp" }
export function calcularTotales(items, { entrega, pago }, cfg = CONFIG) {
  const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);

  // El descuento de transferencia es solo sobre productos, nunca sobre el envío.
  const descuento = pago === "transferencia"
    ? Math.round((subtotal * cfg.transferenciaPct) / 100)
    : 0;

  let envio = 0;
  if (entrega === "envio" && subtotal < cfg.envio.umbralGratis) {
    envio = cfg.envio.costo;
  }

  const total = subtotal - descuento + envio;
  return { subtotal, descuento, envio, total };
}
