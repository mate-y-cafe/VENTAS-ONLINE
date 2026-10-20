// Armador: guarda el armado con ids. El precio NO se guarda: lo calcula el servidor desde armador.json.
import { agregarItem } from "./carrito.js";

const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

let pasos = [];

function render() {
  $("pasos").innerHTML = pasos.map((paso) => {
    const multiple = paso.id === "extras";
    const tipo = multiple ? "checkbox" : "radio";
    const marcado = (o, i) => (multiple ? "" : i === 0 ? "checked" : "");
    return `
      <fieldset style="border:0; padding:0; margin:0 0 1.25rem">
        <legend class="campo">${paso.titulo}</legend>
        <div class="opciones">
          ${paso.opciones.map((o, i) => `
            <label class="opcion">
              <input type="${tipo}" name="${paso.id}" value="${o.id}" ${marcado(o, i)}>
              <span style="flex:1">${o.nombre}</span>
              <span class="nota">${fmt(o.precio)}</span>
            </label>`).join("")}
        </div>
      </fieldset>`;
  }).join("");
}

function elegido(pasoId) {
  const seleccionados = [...document.querySelectorAll(`input[name="${pasoId}"]:checked`)].map((i) => i.value);
  return seleccionados;
}

$("armador").addEventListener("submit", (e) => {
  e.preventDefault();
  const mate = elegido("mate")[0];
  const bombilla = elegido("bombilla")[0];
  const yerba = elegido("yerba")[0];
  const extras = elegido("extras");

  if (!mate || !bombilla || !yerba) {
    $("error").textContent = "Elegí mate, bombilla y yerba para armar tu combo.";
    $("error").classList.remove("oculto");
    return;
  }
  $("error").classList.add("oculto");

  const nombre = [mate, bombilla, yerba, ...extras]
    .map((id) => pasos.flatMap((p) => p.opciones).find((o) => o.id === id)?.nombre ?? id)
    .join(" + ");
  agregarItem({ id: "armado", nombre: `Kit armado: ${nombre}`, cantidad: 1, armado: { mate, bombilla, yerba, extras } });
  location.href = "carrito.html";
});

const res = await fetch("data/armador.json");
pasos = (await res.json()).pasos;
render();
