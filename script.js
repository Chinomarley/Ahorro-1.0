let datosActuales = {};
const uploadInput = document.getElementById("upload");
const procesarBtn = document.getElementById("procesar");
const sueldoSpan = document.getElementById("sueldoExtraido");
const fondoSpan = document.getElementById("fondoExtraido");
const periodoSpan = document.getElementById("periodoExtraido");
const porcentajeSpan = document.getElementById("porcentajeReal");
const advertenciaSpan = document.getElementById("advertencia");
const aportacionSpan = document.getElementById("aportacionCFE");
const totalFondoSpan = document.getElementById("totalFondo");

const barraPorcentaje = document.getElementById("aporteSlider");
const mesesSelect = document.getElementById("tiempoAhorro");

function calcularSimulado() {
  const sueldo = datosActuales.sueldo || 0;
  const porcentaje = parseFloat(barraPorcentaje.value);
  const meses = parseInt(mesesSelect.value);

  const aporteEmpleado = sueldo * (porcentaje / 100) * meses;
  const aporteCFE = Math.min(porcentaje, 9.1) / 100 * sueldo * meses;
  const total = aporteEmpleado + aporteCFE;

  aportacionSpan.textContent = `$${aporteCFE.toFixed(2)}`;
  totalFondoSpan.textContent = `$${total.toFixed(2)}`;
}

function guardarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historialFondo") || "[]");

  // Evitar duplicados por periodo
  const duplicado = historial.find(e => e.periodo === datosActuales.periodo);
  if (duplicado) {
    alert("⚠ Esta papeleta ya fue registrada. Consulta el historial para verla.");
    return;
  }

  const entrada = {
    fecha: new Date().toLocaleDateString(),
    sueldo: datosActuales.sueldo,
    fondo: datosActuales.fondo,
    periodo: datosActuales.periodo,
    porcentaje: datosActuales.porcentaje
  };

  historial.push(entrada);
  localStorage.setItem("historialFondo", JSON.stringify(historial));
}

procesarBtn.addEventListener("click", async () => {
  const archivo = uploadInput.files[0];
  if (!archivo) {
    alert("⚠ Por favor sube una imagen de la papeleta.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const result = await Tesseract.recognize(reader.result, 'spa', {
      logger: m => console.log(m)
    });

    const texto = result.data.text.replace(/\s+/g, " ").toUpperCase();

    const matchSalario = texto.match(/SALARIO\s+\d+\s+\$?([\d,]+\.\d{2})/);
    const matchFondo = texto.match(/FONDO\s+DE\s+AHORRO\s+\d+\s+\$?([\d,]+\.\d{2})/);
    const matchPeriodo = texto.match(/PERIODO\s+DE\s+PAGO[^A-Z0-9]*([0-9\/]+)\s+A\s+([0-9\/]+)/);

    const sueldo = matchSalario ? parseFloat(matchSalario[1].replace(',', '')) : 0;
    const fondo = matchFondo ? parseFloat(matchFondo[1].replace(',', '')) : 0;
    const periodo = matchPeriodo ? `${matchPeriodo[1]} - ${matchPeriodo[2]}` : "No detectado";

    if (!sueldo || !fondo || !periodo) {
      alert("⚠ No se encontraron todos los datos necesarios en la papeleta.");
      return;
    }

    sueldoSpan.textContent = sueldo.toFixed(2);
    fondoSpan.textContent = fondo.toFixed(2);
    periodoSpan.textContent = periodo;

    const porcentaje = (fondo / sueldo) * 100;
    porcentajeSpan.textContent = porcentaje.toFixed(2) + "%";
    advertenciaSpan.textContent = porcentaje > 9.1 ? "⚠ CFE solo duplica hasta el 9.10%" : "";

    datosActuales = { sueldo, fondo, periodo, porcentaje };
    guardarHistorial();
    calcularSimulado();
  };

  reader.readAsDataURL(archivo);
});

barraPorcentaje.addEventListener("input", calcularSimulado);
mesesSelect.addEventListener("change", calcularSimulado);