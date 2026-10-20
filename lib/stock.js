// ÚNICO punto de conexión con el sistema de stock. Hoy son stubs; el contrato está en tienda/STOCK.md.
const { stockEjemplo } = require("./catalogo");

// Ids ya descontados, para que el webhook no descuente dos veces el mismo pago.
// TODO: en producción persistir esto (base de datos); en serverless una variable en memoria no alcanza.
const procesados = new Set();

// Devuelve { [id]: disponible } para los ids pedidos. TODO: reemplazar por el sistema real.
async function leerStock(ids) {
  const stock = {};
  for (const id of ids) stock[id] = stockEjemplo[id] ?? 0;
  return stock;
}

// consumos: { [id]: cantidad }. TODO: descontar de forma atómica en el sistema real.
async function descontarStock(consumos, pagoId) {
  const clave = String(pagoId);
  if (procesados.has(clave)) return { yaProcesado: true };
  procesados.add(clave);
  console.log(`[stock] pago ${clave}: descontar`, consumos);
  return { yaProcesado: false };
}

module.exports = { leerStock, descontarStock };
