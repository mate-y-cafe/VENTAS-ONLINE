// GET /api/stock?ids=a,b,c: devuelve el stock disponible solo para ids conocidos.
const { productos, idsArmador } = require("../lib/catalogo");
const { leerStock } = require("../lib/stock");
const { enviarJson } = require("../lib/http");

module.exports = async (req, res) => {
  if (req.method !== "GET") return enviarJson(res, 405, { error: "Método no permitido" });
  try {
    const url = new URL(req.url, "http://localhost");
    const conocidos = new Set([...productos.map((p) => p.id), ...idsArmador]);
    const pedidos = (url.searchParams.get("ids") ?? "").split(",").filter((id) => conocidos.has(id));
    const stock = await leerStock(pedidos);
    enviarJson(res, 200, { stock });
  } catch (e) {
    console.error(e);
    enviarJson(res, 500, { error: "No se pudo leer el stock." });
  }
};
