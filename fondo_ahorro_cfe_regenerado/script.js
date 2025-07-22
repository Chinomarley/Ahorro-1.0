
document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return window.location.href = "login.html";
  document.getElementById("usuarioNombre").textContent = usuario;

  const aporteInput = document.getElementById("aporte");
  const porcentajeManual = document.getElementById("porcentajeManual");
  aporteInput.addEventListener("input", () => {
    porcentajeManual.textContent = aporteInput.value + "%";
  });
});

function procesarImagen() {
  const file = document.getElementById("upload").files[0];
  const progress = document.getElementById("progress");
  const advertencia = document.getElementById("advertencia");

  if (!file || !file.type.startsWith("image/")) {
    advertencia.textContent = "Por favor sube una imagen válida de tu papeleta.";
    return;
  }

  advertencia.textContent = "";
  progress.style.display = "block";

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = async () => {
      const result = await Tesseract.recognize(img, 'spa', {
        logger: m => { if (m.status === 'recognizing text') progress.value = m.progress; }
      });
      progress.style.display = "none";
      const text = result.data.text;

      const sueldoMatch = text.match(/salario\s*:?\s*\$?(\d+[.,]\d{2})/i);
      const fondoMatch = text.match(/fondo de ahorro\s*:?\s*\$?(\d+[.,]\d{2})/i);

      let sueldo = 0, fondo = 0;

      if (sueldoMatch) sueldo = parseFloat(sueldoMatch[1].replace(',',''));
      if (fondoMatch) fondo = parseFloat(fondoMatch[1].replace(',',''));

      document.getElementById("sueldoDetectado").textContent = "$" + sueldo.toFixed(2);
      document.getElementById("fondoDetectado").textContent = "$" + fondo.toFixed(2);

      if (sueldo > 0) {
        const porcentaje = (fondo / sueldo) * 100;
        document.getElementById("porcentajeCalculado").textContent = porcentaje.toFixed(2) + "%";

        if (porcentaje > 9.10) {
          document.getElementById("alerta").innerHTML = "⚠️ Estás aportando más del 9.10%. CFE no duplica el excedente.";
        } else {
          document.getElementById("alerta").innerHTML = "";
        }
      }
    };
  };
  reader.readAsDataURL(file);
}
