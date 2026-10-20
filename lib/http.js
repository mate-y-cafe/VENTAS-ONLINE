// Helpers HTTP para las funciones de api/ (compatibles con Vercel y con Node puro).

function leerBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  }
  return new Promise((resolver, rechazar) => {
    let datos = "";
    req.on("data", (trozo) => (datos += trozo));
    req.on("end", () => {
      try {
        resolver(datos ? JSON.parse(datos) : {});
      } catch (e) {
        rechazar(e);
      }
    });
    req.on("error", rechazar);
  });
}

function enviarJson(res, status, cuerpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(cuerpo));
}

module.exports = { leerBody, enviarJson };
