// Carga los módulos ESM compartidos con el navegador (tienda/js). Desde CommonJS se usa import() dinámico.
let cache = null;

async function cargarModulos() {
  if (!cache) {
    const [precios, stock, config] = await Promise.all([
      import("../tienda/js/precios.js"),
      import("../tienda/js/stock.js"),
      import("../tienda/js/config.js"),
    ]);
    cache = { precios, stock, config: config.CONFIG };
  }
  return cache;
}

module.exports = { cargarModulos };
