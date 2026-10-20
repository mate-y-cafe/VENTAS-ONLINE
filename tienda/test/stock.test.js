import { test } from "node:test";
import assert from "node:assert/strict";
import { consumosDeItem, necesidades, faltantes } from "../js/stock.js";

const productos = {
  "combo-basico": { componentes: ["mate-algarrobo", "yerba-organica-suave"] },
};

test("producto simple consume su propio id", () => {
  assert.deepEqual(consumosDeItem({ id: "acc-termo", cantidad: 2 }, productos), { "acc-termo": 2 });
});

test("combo fijo consume sus componentes multiplicados por cantidad", () => {
  assert.deepEqual(
    consumosDeItem({ id: "combo-basico", cantidad: 3 }, productos),
    { "mate-algarrobo": 3, "yerba-organica-suave": 3 },
  );
});

test("combo armado consume mate, bombilla, yerba y extras", () => {
  const item = {
    id: "combo-armado",
    cantidad: 1,
    armado: { mate: "mate-algarrobo", bombilla: "bombilla-acero", yerba: "yerba-serranas", extras: ["acc-termo"] },
  };
  assert.deepEqual(consumosDeItem(item, productos), {
    "mate-algarrobo": 1,
    "bombilla-acero": 1,
    "yerba-serranas": 1,
    "acc-termo": 1,
  });
});

test("necesidades suma consumos de varios items", () => {
  const items = [
    { id: "acc-termo", cantidad: 1 },
    { id: "combo-basico", cantidad: 2 },
    { id: "acc-termo", cantidad: 2 },
  ];
  assert.deepEqual(necesidades(items, productos), {
    "acc-termo": 3,
    "mate-algarrobo": 2,
    "yerba-organica-suave": 2,
  });
});

test("faltantes detecta lo pedido por encima del stock y trata ids ausentes como 0", () => {
  const necesidad = { "acc-termo": 3, "mate-algarrobo": 1, "yerba-serranas": 2 };
  const stock = { "acc-termo": 2, "mate-algarrobo": 1 };
  assert.deepEqual(faltantes(necesidad, stock), [
    { id: "acc-termo", pedido: 3, disponible: 2 },
    { id: "yerba-serranas", pedido: 2, disponible: 0 },
  ]);
});
