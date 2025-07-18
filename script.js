const upload = document.getElementById("upload");
const procesarBtn = document.getElementById("procesarBtn");
const guardarBtn = document.getElementById("guardarBtn");
const sueldoSpan = document.getElementById("sueldoExtraido");
const fondoSpan = document.getElementById("fondoExtraido");
const porcentajeSpan = document.getElementById("porcentajeCalculado");
const advertenciaSpan = document.getElementById("advertencia");
const periodoSpan = document.getElementById("periodo");
const aporteSlider = document.getElementById("aporteManual");
const porcentajeManualSpan = document.getElementById("manualPorcentaje");
const tiempoSelect = document.getElementById("tiempo");
const simuladoSpan = document.getElementById("simulado");
const historialBtn = document.getElementById("toggleHistorial");
const historialDiv = document.getElementById("historial");

let datosActuales = {};

procesarBtn.addEventListener("click", async () => {
  const file = upload.files[0];
  if (!file) return alert("Selecciona una imagen primero.");

  const reader = new FileReader();
  reader.onload = async () => {
    const result = await Tesseract.recognize(reader.result, 'spa', {
      logger: m => console.log(m)
    });

    const text = result.data.text;

    // Limpieza simple de texto
    const cleanText = text.replace(/\s+/g, ' ').toUpperCase();

    // Buscar sueldo
    const sueldoMatch = cleanText.match(/SUELDO[^0-9]*([\d,]+\.\d{2})/);
    const sueldo = sueldoMatch ? parseFloat(sueldoMatch[1].replace(',', '')) : 0;

    // Buscar fondo de ahorro
    const fondoMatch = cleanText.match(/FONDO[^0-9]*([\d,]+\.\d{2})/);
    const fondo = fondoMatch ? parseFloat(fondoMatch[1].replace(',', '')) : 0;

    // Buscar periodo
    const periodoMatch = cleanText.match(/PERIODO[^A-Z0-9]*(\d{2}\/\d{2}\/\d{4})/);
    const periodo = periodoMatch ? periodoMatch[1] : "Sin periodo";

    sueldoSpan.textContent = sueldo.toFixed(2);
    fondoSpan.textContent = fondo.toFixed(2);
    periodoSpan.textContent = periodo;

    const porcentaje = sueldo > 0 ? (fondo / sueldo) * 100 : 0;
    porcentajeSpan.textContent = porcentaje.toFixed(2) + "%";
    advertenciaSpan.textContent = porcentaje > 9.10
      ? "⚠ CFE solo duplica hasta el 9.10%"
      : "";

    datosActuales = { sueldo, fondo, periodo, porcentaje };
    actualizarSimulado();
  };
  reader.readAsDataURL(file);
});

guardarBtn.addEventListener("click", () => {
  if (!datosActuales.periodo) return alert("Primero procesa una papeleta.");
  let historial = JSON.parse(localStorage.getItem("historialFondo")) || [];

  if (historial.some(e => e.periodo === datosActuales.periodo)) {
    alert("Ya procesaste esta papeleta.");
    return;
  }

  const cfe = Math.min(datosActuales.porcentaje, 9.1) / 100 * datosActuales.sueldo;
  const total = datosActuales.fondo + cfe;

  historial.push({ ...datosActuales, cfe, total });
  localStorage.setItem("historialFondo", JSON.stringify(historial));
  renderHistorial();
});

function renderHistorial() {
  const tabla = document.getElementById("tablaHistorial");
  tabla.innerHTML = "";
  const historial = JSON.parse(localStorage.getItem("historialFondo")) || [];
  let acumulado = 0;
  historial.forEach(h => {
    acumulado += h.total;
    tabla.innerHTML += `
      <tr>
        <td>${h.periodo}</td>
        <td>$${h.sueldo.toFixed(2)}</td>
        <td>$${h.fondo.toFixed(2)}</td>
        <td>${h.porcentaje.toFixed(2)}%</td>
        <td>$${h.cfe.toFixed(2)}</td>
        <td>$${h.total.toFixed(2)}</td>
      </tr>`;
  });
  document.getElementById("acumulado").textContent = "$" + acumulado.toFixed(2);
}

function actualizarSimulado() {
  const porcentaje = parseFloat(aporteSlider.value);
  const meses = parseInt(tiempoSelect.value);
  porcentajeManualSpan.textContent = porcentaje.toFixed(1);

  if (datosActuales.sueldo) {
    const aportacion = datosActuales.sueldo * (porcentaje / 100) * meses;
    const cfe = Math.min(porcentaje, 9.1) / 100 * datosActuales.sueldo * meses;
    simuladoSpan.textContent = "$" + (aportacion + cfe).toFixed(2);
  }
}

aporteSlider.addEventListener("input", actualizarSimulado);
tiempoSelect.addEventListener("change", actualizarSimulado);
historialBtn.addEventListener("click", () => {
  historialDiv.style.display = historialDiv.style.display === "none" ? "block" : "none";
});

renderHistorial();