// Cálculo de consumo de stock. Funciones puras; obtenerStock es la única que hace red.
// Contrato completo en tienda/STOCK.md.

// item: { id, cantidad, armado?: { mate, bombilla, yerba, extras: [] } }
// productos: mapa id -> producto (con `componentes` opcional para combos fijos)
// Devuelve { [id]: cantidad } con los ids que consume el item.
export function consumosDeItem(item, productos = {}) {
  const ids = [];
  if (item.armado) {
    const { mate, bombilla, yerba, extras = [] } = item.armado;
    ids.push(mate, bombilla, yerba, ...extras);
  } else if (productos[item.id]?.componentes) {
    ids.push(...productos[item.id].componentes);
  } else {
    ids.push(item.id);
  }
  const consumos = {};
  for (const id of ids) {
    consumos[id] = (consumos[id] ?? 0) + item.cantidad;
  }
  return consumos;
}

// Suma los consumos de todos los items del carrito.
export function necesidades(items, productos = {}) {
  const total = {};
  for (const item of items) {
    for (const [id, cant] of Object.entries(consumosDeItem(item, productos))) {
      total[id] = (total[id] ?? 0) + cant;
    }
  }
  return total;
}

// Devuelve los ids donde lo pedido supera el stock disponible.
// stock: { [id]: disponible }. Un id ausente cuenta como 0.
export function faltantes(necesidad, stock = {}) {
  return Object.entries(necesidad)
    .filter(([id, pedido]) => pedido > (stock[id] ?? 0))
    .map(([id, pedido]) => ({ id, pedido, disponible: stock[id] ?? 0 }));
}

// Lee el stock del servidor: GET /api/stock?ids=a,b,c -> { stock: { id: n } }
export async function obtenerStock(ids, fetchImpl = fetch, base = "") {
  const url = `${base}/api/stock?ids=${encodeURIComponent(ids.join(","))}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`No se pudo leer el stock (${res.status})`);
  const data = await res.json();
  return data.stock ?? {};
}
