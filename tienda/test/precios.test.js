import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularTotales } from "../js/precios.js";

const cfg = {
  envio: { costo: 5000, umbralGratis: 80000 },
  transferenciaPct: 10,
};

test("envío a domicilio por debajo del umbral cobra costo de envío", () => {
  const r = calcularTotales([{ precio: 10000, cantidad: 2 }], { entrega: "envio", pago: "mercadopago" }, cfg);
  assert.deepEqual(r, { subtotal: 20000, descuento: 0, envio: 5000, total: 25000 });
});

test("envío gratis desde el umbral", () => {
  const r = calcularTotales([{ precio: 40000, cantidad: 2 }], { entrega: "envio", pago: "mercadopago" }, cfg);
  assert.equal(r.envio, 0);
  assert.equal(r.total, 80000);
});

test("retiro en el local no cobra envío", () => {
  const r = calcularTotales([{ precio: 1000, cantidad: 1 }], { entrega: "retiro", pago: "mercadopago" }, cfg);
  assert.equal(r.envio, 0);
  assert.equal(r.total, 1000);
});

test("transferencia descuenta solo sobre productos, no sobre el envío", () => {
  const r = calcularTotales([{ precio: 10000, cantidad: 1 }], { entrega: "envio", pago: "transferencia" }, cfg);
  assert.equal(r.descuento, 1000);
  assert.equal(r.envio, 5000);
  assert.equal(r.total, 10000 - 1000 + 5000);
});

test("el umbral de envío gratis se mide sobre el subtotal antes del descuento", () => {
  const r = calcularTotales([{ precio: 80000, cantidad: 1 }], { entrega: "envio", pago: "transferencia" }, cfg);
  assert.equal(r.envio, 0);
  assert.equal(r.descuento, 8000);
  assert.equal(r.total, 72000);
});
