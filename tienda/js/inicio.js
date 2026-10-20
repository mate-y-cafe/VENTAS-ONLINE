// Home de la tienda: catálogo simple y contador del carrito. Los precios se muestran solo para orientar; el total real lo calcula el servidor.
import { agregarItem, leerCarrito } from "./carrito.js";

const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function actualizarContador() {
  const total = leerCarrito().reduce((s, i) => s + i.cantidad, 0);
  document.getElementById("contador").textContent = total ? `(${total})` : "";
}

async function cargar() {
  const res = await fetch("data/productos.json");
  const { productos } = await res.json();
  const cont = document.getElementById("catalogo");
  cont.innerHTML = productos.filter((p) => p.activo).map((p) => `
    <div class="linea">
      <div>
        <div class="nombre">${p.nombre}</div>
        <div class="nota">${p.categoria}</div>
      </div>
      <div class="precio">${fmt(p.precio)}</div>
      <button type="button" class="btn" data-id="${p.id}" data-nombre="${p.nombre}">Agregar</button>
    </div>`).join("");

  cont.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-id]");
    if (!boton) return;
    agregarItem({ id: boton.dataset.id, nombre: boton.dataset.nombre });
    actualizarContador();
    boton.textContent = "Agregado ✓";
    setTimeout(() => (boton.textContent = "Agregar"), 1200);
  });
}

actualizarContador();
cargar();
