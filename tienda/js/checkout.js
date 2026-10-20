// Checkout: datos del comprador y tres formas de pago. Los totales siempre vienen del servidor.
import { leerCarrito } from "./carrito.js";
import { CONFIG } from "./config.js";

const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const $ = (id) => document.getElementById(id);
const form = $("form");

let items = leerCarrito();
let cotizacion = null;

function entregaActual() {
  return document.querySelector('input[name="entrega"]:checked').value;
}
function pagoActual() {
  return document.querySelector('input[name="pago"]:checked').value;
}

function mostrarError(msg) {
  $("error").textContent = msg;
  $("error").classList.toggle("oculto", !msg);
}

function pintarResumen() {
  const entrega = entregaActual();
  const pago = pagoActual();
  $("bloque-direccion").classList.toggle("oculto", entrega !== "envio");
  if (!cotizacion) return;

  const t = cotizacion.totales;
  const descuento = pago === "transferencia" ? t.subtotal * CONFIG.transferenciaPct / 100 : 0;
  const total = pago === "transferencia" ? cotizacion.totalTransferencia : t.total;

  $("resumen-lineas").innerHTML = cotizacion.lineas
    .map((l) => `<p style="margin:.25rem 0">${l.cantidad} × ${l.nombre}</p>`).join("");
  $("r-subtotal").textContent = fmt(t.subtotal);
  $("r-descuento").textContent = descuento ? `− ${fmt(Math.round(descuento))}` : "$0";
  $("r-envio").textContent = t.envio === 0 ? "Gratis" : fmt(t.envio);
  $("r-total").textContent = fmt(total);
}

async function cotizar() {
  try {
    const res = await fetch("/api/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, entrega: entregaActual() }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      const msg = data.errores?.join(" ") || "Hay productos sin stock suficiente. Volvé al carrito.";
      mostrarError(msg);
      $("enviar").disabled = true;
      cotizacion = null;
      return;
    }
    cotizacion = data;
    $("enviar").disabled = false;
    mostrarError("");
    pintarResumen();
  } catch {
    mostrarError("No pudimos calcular el total. Revisá tu conexión.");
  }
}

function datosComprador() {
  const fd = new FormData(form);
  return {
    nombre: fd.get("nombre")?.trim() ?? "",
    telefono: fd.get("telefono")?.trim() ?? "",
    email: fd.get("email")?.trim() ?? "",
    direccion: entregaActual() === "envio" ? fd.get("direccion")?.trim() ?? "" : "",
  };
}

function textoPedido(comprador) {
  const lineas = cotizacion.lineas.map((l) => `- ${l.cantidad} x ${l.nombre}`).join("\n");
  const entrega = entregaActual() === "envio" ? `Envío a ${comprador.direccion}` : "Retiro en el local";
  const total = pagoActual() === "transferencia" ? cotizacion.totalTransferencia : cotizacion.totales.total;
  return `Hola! Quiero hacer este pedido:\n${lineas}\n${entrega}\nTotal: ${fmt(total)}\nNombre: ${comprador.nombre}\nTeléfono: ${comprador.telefono}`;
}

function linkWhatsApp(texto) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

async function enviar(e) {
  e.preventDefault();
  if (!cotizacion) return;
  const comprador = datosComprador();
  const pago = pagoActual();
  const entrega = entregaActual();

  // Validación de forma en el navegador. El servidor vuelve a validar todo.
  if (!comprador.nombre || !comprador.telefono) return mostrarError("Completá nombre y teléfono.");
  if (entrega === "envio" && !comprador.direccion) return mostrarError("Para envío a domicilio falta la dirección.");
  mostrarError("");

  if (pago === "mercadopago") {
    $("enviar").disabled = true;
    try {
      const res = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, entrega, pago, comprador }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errores?.join(" ") || data.error || "No se pudo crear el pago.");
      location.href = data.init_point;
    } catch (err) {
      mostrarError(err.message);
      $("enviar").disabled = false;
    }
    return;
  }

  if (pago === "transferencia") {
    $("alias").textContent = CONFIG.alias;
    $("monto").textContent = fmt(cotizacion.totalTransferencia);
    $("wa-transferencia").href = linkWhatsApp(textoPedido(comprador));
    $("instrucciones-transferencia").classList.remove("oculto");
    $("instrucciones-transferencia").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // Coordinar por WhatsApp
  location.href = linkWhatsApp(textoPedido(comprador));
}

// Entrega: viene del carrito, pero se puede cambiar acá.
const entregaGuardada = sessionStorage.getItem("mc_entrega");
if (entregaGuardada) {
  const r = document.querySelector(`input[name="entrega"][value="${entregaGuardada}"]`);
  if (r) r.checked = true;
} else {
  document.querySelector('input[name="entrega"][value="envio"]').checked = true;
}

if (items.length === 0) {
  mostrarError("Tu carrito está vacío.");
  $("enviar").disabled = true;
} else {
  cotizar();
}

document.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", cotizar));
document.querySelectorAll('input[name="pago"]').forEach((r) => r.addEventListener("change", () => {
  $("instrucciones-transferencia").classList.add("oculto");
  pintarResumen();
}));
form.addEventListener("submit", enviar);
