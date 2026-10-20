// Página de gracias. Vacía el carrito solo si el pago quedó aprobado.
import { vaciarCarrito } from "./carrito.js";

const MENSAJES = {
  aprobado: ["¡Pago aprobado!", "Recibimos tu pago. Te escribimos para coordinar la entrega o el retiro."],
  pendiente: ["Pago pendiente", "Mercado Pago todavía no confirmó el pago. Cuando se acredite te avisamos. Tu carrito queda guardado."],
  rechazado: ["El pago no se completó", "No pudimos procesar el pago. Tu carrito sigue guardado: podés intentar de nuevo."],
};

const estado = new URLSearchParams(location.search).get("estado");
const [titulo, mensaje] = MENSAJES[estado] ?? ["Gracias", "Si tenés alguna consulta, escribinos por WhatsApp."];

document.getElementById("titulo").textContent = titulo;
document.getElementById("mensaje").textContent = mensaje;

if (estado === "aprobado") vaciarCarrito();
