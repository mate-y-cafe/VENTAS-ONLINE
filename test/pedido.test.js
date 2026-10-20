const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cotizar, validarPedido } = require("../lib/pedido");

const comprador = { nombre: "Ana", telefono: "1155555555" };

test("el precio enviado por el navegador se ignora", async () => {
  const r = await cotizar({
    items: [{ id: "acc-termo", cantidad: 1, precio: 1 }],
    entrega: "retiro",
    pago: "mercadopago",
  });
  assert.equal(r.lineas[0].precio, 22900);
  assert.equal(r.totales.total, 22900);
});

test("un id de producto inexistente produce error", async () => {
  const r = await cotizar({ items: [{ id: "no-existe", cantidad: 1 }], entrega: "retiro", pago: "mercadopago" });
  assert.equal(r.ok, false);
  assert.match(r.errores[0], /no está disponible/);
});

test("cantidad fuera de rango produce error", async () => {
  const r = await cotizar({ items: [{ id: "acc-termo", cantidad: 0 }], entrega: "retiro", pago: "mercadopago" });
  assert.equal(r.ok, false);
});

test("armado: el precio es la suma de las opciones del servidor", async () => {
  const r = await cotizar({
    items: [{
      id: "armado",
      cantidad: 2,
      armado: { mate: "mate-algarrobo", bombilla: "bombilla-alpaca", yerba: "yerba-organica-suave", extras: ["acc-termo"] },
    }],
    entrega: "retiro",
    pago: "mercadopago",
  });
  assert.equal(r.lineas[0].precio, 52900);
  assert.equal(r.totales.subtotal, 105800);
});

test("armado con una opción que no existe produce error", async () => {
  const r = await cotizar({
    items: [{ id: "armado", cantidad: 1, armado: { mate: "fantasma", bombilla: "bombilla-alpaca", yerba: "yerba-organica-suave", extras: [] } }],
    entrega: "retiro",
    pago: "mercadopago",
  });
  assert.equal(r.ok, false);
});

test("sin stock suficiente marca faltantes", async () => {
  const r = await cotizar({ items: [{ id: "acc-termo", cantidad: 99 }], entrega: "retiro", pago: "mercadopago" });
  assert.equal(r.ok, false);
  assert.deepEqual(r.faltantes, [{ id: "acc-termo", pedido: 99, disponible: 10 }]);
});

test("transferencia: el total de transferencia descuenta 10 % sobre productos, no sobre envío", async () => {
  const r = await cotizar({ items: [{ id: "acc-termo", cantidad: 1 }], entrega: "envio", pago: "mercadopago" });
  // 22900 con 10 % = 2290 de descuento; envío 5000 (subtotal < umbral)
  assert.equal(r.totalTransferencia, 22900 - 2290 + 5000);
});

test("validarPedido exige dirección para envío a domicilio", async () => {
  const r = await validarPedido({
    items: [{ id: "acc-termo", cantidad: 1 }],
    entrega: "envio",
    pago: "mercadopago",
    comprador,
  });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /dirección/.test(e)));
});

test("validarPedido acepta retiro con datos completos", async () => {
  const r = await validarPedido({
    items: [{ id: "acc-termo", cantidad: 1 }],
    entrega: "retiro",
    pago: "transferencia",
    comprador,
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errores, []);
});

test("validarPedido exige forma de pago válida", async () => {
  const r = await validarPedido({
    items: [{ id: "acc-termo", cantidad: 1 }],
    entrega: "retiro",
    pago: "efectivo",
    comprador,
  });
  assert.equal(r.ok, false);
});
