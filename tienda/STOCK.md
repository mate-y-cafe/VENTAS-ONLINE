# Contrato de stock

Este documento define cómo la tienda habla con el sistema de stock. El único punto de conexión del servidor es `lib/stock.js`. Si cambian ids o reglas, actualizar este archivo.

> Estado: **provisorio**. `tienda/data/productos.json`, `armador.json` y `stock.json` son de ejemplo. `lib/stock.js` tiene stubs.

## Ids

- Productos simples: el id de `tienda/data/productos.json` (p. ej. `acc-termo`, `mate-algarrobo`).
- Opciones del armador: el id de cada opción de `tienda/data/armador.json` (p. ej. `bombilla-acero`, `yerba-serranas`).
- Ids de productos y de opciones del armador no deben repetirse entre sí.

## Reglas de consumo

- Producto simple: consume su propio id × cantidad.
- Combo fijo (si el producto tiene `componentes`): consume cada componente × cantidad.
- Armado: consume `mate`, `bombilla`, `yerba` y cada id de `extras`, × cantidad.
- Items con la misma clave (id + armado) se suman en el cálculo de necesidades.

## Lectura

- `leerStock(ids)` → `{ [id]: disponible }`. Id desconocido = 0.
- Expuesto al navegador por `GET /api/stock?ids=a,b,c`. Solo devuelve ids conocidos.

## Descuento

- `descontarStock(consumos, pagoId)` se llama **solo** cuando Mercado Pago confirma el pago como `approved`.
- El pago se verifica siempre en la API (`GET /v1/payments/{id}`), nunca con el cuerpo de la notificación.
- `consumos` sale de `metadata.consumos` del pago, que se guardó al crear la preferencia.

## Idempotencia

- Mercado Pago puede reenviar la misma notificación. Un mismo `pagoId` debe descontar **una sola vez**.
- El stub guarda los ids procesados en memoria. Esto **no alcanza en producción** (serverless): hay que persistirlos (base de datos) dentro de la misma transacción que el descuento.

## Transferencia y WhatsApp

- No crean pedido en el servidor ni reservan stock. El stock se verifica al cotizar, pero no se descuenta hasta confirmar el pago.

## Preguntas abiertas para el equipo de stock

1. ¿El stock se reserva al crear la preferencia o solo al aprobarse el pago?
2. ¿Qué pasa si el stock se agota entre que el cliente paga y el webhook llega?
3. ¿Transferencias y WhatsApp deben reservar stock? ¿Con qué vencimiento?
4. ¿Hay que exponer stock numérico al público o solo "disponible / sin stock"?
5. ¿Dónde se persisten los `pagoId` ya procesados?
