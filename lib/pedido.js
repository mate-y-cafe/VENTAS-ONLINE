// Valida y cotiza el pedido. Nunca toma precios del navegador: todo sale del catálogo y del armador.
const { productos, pasosArmador } = require("./catalogo");
const { leerStock } = require("./stock");
const { cargarModulos } = require("./modulos");

const ENTREGAS = ["envio", "retiro"];
const PAGOS = ["mercadopago", "transferencia", "whatsapp"];

function opcionDe(pasoId, opcionId) {
  const paso = pasosArmador.find((p) => p.id === pasoId);
  return paso?.opciones.find((o) => o.id === opcionId);
}

// Cotiza los items: arma las líneas con precios del servidor, controla stock y calcula totales.
// No valida datos del comprador (eso lo hace validarPedido).
async function cotizar({ items, entrega, pago }) {
  const { precios, stock, config } = await cargarModulos();
  const errores = [];
  const lineas = [];

  if (!Array.isArray(items) || items.length === 0) errores.push("El carrito está vacío.");
  if (!ENTREGAS.includes(entrega)) errores.push("Elegí envío o retiro.");

  for (const raw of Array.isArray(items) ? items : []) {
    const cantidad = Number.isInteger(raw?.cantidad) ? raw.cantidad : 0;
    if (cantidad < 1 || cantidad > 99) {
      errores.push("La cantidad de un producto no es válida.");
      continue;
    }

    if (raw.armado) {
      const a = raw.armado;
      const extras = Array.isArray(a.extras) ? a.extras : [];
      const mate = opcionDe("mate", a.mate);
      const bombilla = opcionDe("bombilla", a.bombilla);
      const yerba = opcionDe("yerba", a.yerba);
      const extrasOk = extras.map((id) => opcionDe("extras", id));
      if (!mate || !bombilla || !yerba || extrasOk.some((e) => !e)) {
        errores.push("Hay una opción del armado que ya no está disponible.");
        continue;
      }
      const precio = [mate, bombilla, yerba, ...extrasOk].reduce((s, o) => s + o.precio, 0);
      lineas.push({
        id: "armado",
        nombre: `Kit armado (${mate.nombre} + ${yerba.nombre})`,
        precio,
        cantidad,
        armado: { mate: a.mate, bombilla: a.bombilla, yerba: a.yerba, extras },
      });
    } else {
      const p = productos.find((x) => x.id === raw.id && x.activo);
      if (!p) {
        errores.push("Hay un producto que ya no está disponible.");
        continue;
      }
      lineas.push({ id: p.id, nombre: p.nombre, precio: p.precio, cantidad });
    }
  }

  // Stock: consumos por id, comparados con lo disponible.
  const mapa = Object.fromEntries(productos.map((p) => [p.id, p]));
  const necesidad = stock.necesidades(lineas, mapa);
  const disponible = await leerStock(Object.keys(necesidad));
  const faltantes = stock.faltantes(necesidad, disponible);

  const totales = precios.calcularTotales(lineas, { entrega, pago: pago ?? "mercadopago" }, config);
  const totalTransferencia = precios.calcularTotales(lineas, { entrega, pago: "transferencia" }, config).total;

  return {
    ok: errores.length === 0 && faltantes.length === 0 && lineas.length > 0,
    errores,
    faltantes,
    lineas,
    necesidad,
    totales,
    totalTransferencia,
  };
}

// Valida el pedido completo (cotización + datos del comprador + forma de pago).
async function validarPedido(body) {
  const cotizacion = await cotizar(body ?? {});
  const comprador = body?.comprador ?? {};
  const errores = [...cotizacion.errores];

  if (!PAGOS.includes(body?.pago)) errores.push("Elegí una forma de pago.");
  if (!String(comprador.nombre ?? "").trim()) errores.push("Falta el nombre.");
  if (!String(comprador.telefono ?? "").trim()) errores.push("Falta el teléfono.");
  if (body?.entrega === "envio" && !String(comprador.direccion ?? "").trim()) {
    errores.push("Para envío a domicilio falta la dirección.");
  }

  return { ...cotizacion, errores, ok: errores.length === 0 && cotizacion.faltantes.length === 0 };
}

module.exports = { cotizar, validarPedido };
