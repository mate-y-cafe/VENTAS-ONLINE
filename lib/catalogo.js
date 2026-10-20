// Catálogo del servidor. Los JSON se leen con require literal para que Vercel los incluya en el bundle.
const productosJson = require("../tienda/data/productos.json");
const armadorJson = require("../tienda/data/armador.json");
const stockJson = require("../tienda/data/stock.json");

const productos = productosJson.productos;
const pasosArmador = armadorJson.pasos;
const stockEjemplo = stockJson.stock;

// Ids válidos de opciones del armador, para validar el stock pedido por el navegador.
const idsArmador = pasosArmador.flatMap((paso) => paso.opciones.map((o) => o.id));

module.exports = { productos, pasosArmador, stockEjemplo, idsArmador };
