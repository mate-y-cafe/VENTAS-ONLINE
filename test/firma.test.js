const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("crypto");
const { firmaValida } = require("../lib/firma");

const secreto = "secreto-de-prueba";

function firmar({ dataId, requestId, ts }) {
  const manifiesto = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secreto).update(manifiesto).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

test("firma correcta es válida", () => {
  const header = firmar({ dataId: "123", requestId: "abc", ts: "1700000000" });
  assert.equal(firmaValida({ header, requestId: "abc", dataId: "123", secreto }), true);
});

test("firma con otro id de pago es inválida", () => {
  const header = firmar({ dataId: "123", requestId: "abc", ts: "1700000000" });
  assert.equal(firmaValida({ header, requestId: "abc", dataId: "999", secreto }), false);
});

test("sin secreto configurado no se verifica", () => {
  assert.equal(firmaValida({ header: undefined, requestId: undefined, dataId: "1", secreto: "" }), true);
});

test("con secreto y sin header, es inválida", () => {
  assert.equal(firmaValida({ header: undefined, requestId: "abc", dataId: "1", secreto }), false);
});
