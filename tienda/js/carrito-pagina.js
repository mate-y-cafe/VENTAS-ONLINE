// Página del carrito. Solo muestra: los totales y el stock vienen del servidor (/api/cotizar).
import { leerCarrito, guardarCarrito } from "./carrito.js";

const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const $ = (id) => document.getElementById(id);
let items = leerCarrito();
let cotizacion = null;

function render() {
  const hayItems = items.length > 0;
  $("vacio").classList.toggle("oculto", hayItems);
  $("contenido").classList.toggle("oculto", !hayItems);
  if (!hayItems) return;

  const faltantes = new Set((cotizacion?.faltantes ?? []).map((f) => f.id));
  $("lineas").innerHTML = items.map((item, i) => {
    const lineaSinStock = !item.armado && faltantes.has(item.id);
    const avisoStock = lineaSinStock ? `<p class="aviso-stock">Sin stock suficiente</p>` : "";
    return `
      <div class="linea ${lineaSinStock ? "sin-stock" : ""}" data-i="${i}">
        <div>
          <div class="nombre">${item.nombre}</div>
          ${avisoStock}
        </div>
        <div class="controles">
          <button type="button" class="sec" data-accion="menos" aria-label="Restar">−</button>
          <span class="cantidad">${item.cantidad}</span>
          <button type="button" class="sec" data-accion="mas" aria-label="Sumar">+</button>
          <button type="button" class="sec" data-accion="quitar">Quitar</button>
        </div>
      </div>`;
  }).join("");

  const t = cotizacion?.totales;
  $("subtotal").textContent = t ? fmt(t.subtotal) : "…";
  $("envio").textContent = t ? (t.envio === 0 ? "Gratis" : fmt(t.envio)) : "…";
  $("total").textContent = t ? fmt(t.total) : "…";

  const envioActual = document.querySelector('input[name="entrega"]:checked')?.value;
  $("aviso-envio").textContent = t
    ? envioActual === "retiro"
      ? "Retirás en el local, sin costo de envío."
      : t.envio > 0
        ? `Envío gratis desde ${fmt(cotizacion.envioGratisDesde)} de compra.`
        : "¡Tenés envío gratis!"
    : "";
  $("aviso-transferencia").textContent = cotizacion
    ? `Pagando por transferencia tenés 10 % de descuento sobre productos: ${fmt(cotizacion.totalTransferencia)} en total.`
    : "";

  const hayFaltantes = faltantes.size > 0;
  $("error-stock").classList.toggle("oculto", !hayFaltantes);
  $("seguir").disabled = hayFaltantes || !cotizacion;
}

async function cotizar() {
  $("error-general").classList.add("oculto");
  if (items.length === 0) return render();
  const entrega = document.querySelector('input[name="entrega"]:checked').value;
  try {
    const res = await fetch("/api/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, entrega }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "No se pudo cotizar");
    cotizacion = data;
    if (data.errores?.length) {
      $("error-general").textContent = data.errores.join(" ");
      $("error-general").classList.remove("oculto");
    }
  } catch (e) {
    $("error-general").textContent = "No pudimos calcular el total. Revisá tu conexión e intentá de nuevo.";
    $("error-general").classList.remove("oculto");
  }
  render();
}

function cambiar(i, cambio) {
  const item = items[i];
  if (!item) return;
  if (cambio === "quitar") items.splice(i, 1);
  else if (cambio === "mas") item.cantidad = Math.min(99, item.cantidad + 1);
  else if (cambio === "menos") item.cantidad = Math.max(1, item.cantidad - 1);
  guardarCarrito(items);
  cotizar();
}

$("lineas").addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const i = Number(boton.closest(".linea").dataset.i);
  cambiar(i, boton.dataset.accion);
});

document.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", cotizar));

$("seguir").addEventListener("click", () => {
  const entrega = document.querySelector('input[name="entrega"]:checked').value;
  sessionStorage.setItem("mc_entrega", entrega);
  location.href = "checkout.html";
});

cotizar();
