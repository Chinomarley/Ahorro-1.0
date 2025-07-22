document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("procesarBtn");
  btn.addEventListener("click", procesarImagen);
});

function procesarImagen() {
  const file = document.getElementById("upload").files[0];
  const progress = document.getElementById("progress");
  const mensaje = document.getElementById("mensaje");

  if (!file || !file.type.startsWith("image")) {
    mensaje.textContent = "Por favor, sube una imagen válida.";
    return;
  }

  mensaje.textContent = "";
  progress.style.display = "block";

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = async () => {
      const result = await Tesseract.recognize(img, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            progress.value = m.progress;
          }
        }
      });

      progress.style.display = "none";

      const text = result.data.text;

      // Extraer salario
      const sueldoMatch = text.match(/salario\s*:?[\s$]*([\d,]+\.\d{2})/i);
      const fondoMatch = text.match(/fondo de ahorro\s*:?[\s$]*([\d,]+\.\d{2})/i);

      const sueldo = sueldoMatch ? parseFloat(sueldoMatch[1].replace(',', '')) : 0;
      const fondo = fondoMatch ? parseFloat(fondoMatch[1].replace(',', '')) : 0;

      document.getElementById("sueldo").textContent = `$${sueldo.toFixed(2)}`;
      document.getElementById("fondo").textContent = `$${fondo.toFixed(2)}`;

      if (sueldo > 0 && fondo > 0) {
        const porcentaje = ((fondo / sueldo) * 100).toFixed(2);
        document.getElementById("porcentaje").textContent = `${porcentaje}%`;

        if (porcentaje > 9.1) {
          mensaje.textContent = "⚠️ CFE no duplica más allá del 9.10%";
        }
      } else {
        mensaje.textContent = "No se detectaron valores válidos en la imagen.";
      }
    };
  };
  reader.readAsDataURL(file);
}