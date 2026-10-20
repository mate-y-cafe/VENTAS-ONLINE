// Almacenamiento del carrito en localStorage. Solo guarda ids, cantidades y armado: nunca precios.
const CLAVE = "mc_carrito";

export function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function guardarCarrito(items) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Storage bloqueado: el carrito sigue funcionando solo en memoria de la página.
  }
}

export function vaciarCarrito() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer si el storage no está disponible.
  }
}

// Agrega o suma una línea. `armado` es opcional: { mate, bombilla, yerba, extras }.
export function agregarItem({ id, nombre, cantidad = 1, armado = null }) {
  const items = leerCarrito();
  const clave = JSON.stringify({ id, armado });
  const existente = items.find((i) => JSON.stringify({ id: i.id, armado: i.armado }) === clave);
  if (existente) existente.cantidad = Math.min(99, existente.cantidad + cantidad);
  else items.push({ id, nombre, cantidad, armado });
  guardarCarrito(items);
  return items;
}
