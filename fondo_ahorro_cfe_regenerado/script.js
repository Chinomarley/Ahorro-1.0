document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("procesarBtn");
  if (!btn) {
    alert("❌ ERROR: No se encontró el botón 'Procesar'. Verifica el ID en el HTML.");
    return;
  }

  alert("✅ Botón 'Procesar' detectado correctamente");
  btn.addEventListener("click", procesarImagen);
});

async function procesarImagen() {
  alert("📎 Botón 'Procesar' fue presionado");

  const fileInput = document.getElementById("upload");
  const file = fileInput?.files[0];

  if (!file) {
    alert("❌ No se ha seleccionado ningún archivo.");
    return;
  }

  if (!file.type.includes("image")) {
    alert("⚠️ Solo se aceptan archivos de imagen (JPG o PNG).");
    return;
  }

  alert("📁 Archivo detectado: " + file.name);

  const reader = new FileReader();
  reader.onload = async () => {
    const img = new Image();
    img.src = reader.result;

    img.onload = async () => {
      alert("🧠 Imagen cargada. Iniciando OCR...");

      const result = await Tesseract.recognize(img, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const text = result.data.text;
      alert("✅ OCR terminado. Resultado parcial:\n\n" + text.slice(0, 300));

      // Intentar extraer datos
      const sueldoMatch = text.match(/salario.*?\$?([\d,.]+)/i);
      const fondoMatch = text.match(/fondo.*?\$?([\d,.]+)/i);

      const sueldo = sueldoMatch ? parseFloat(sueldoMatch[1].replace(",", "")) : 0;
      const fondo = fondoMatch ? parseFloat(fondoMatch[1].replace(",", "")) : 0;
      const porcentaje = sueldo ? (fondo / sueldo * 100).toFixed(2) : 0;

      alert(`💡 Datos detectados:\nSueldo: $${sueldo}\nFondo: $${fondo}\n% Aportado: ${porcentaje}%`);

      document.getElementById("sueldo")?.textContent = `$${sueldo.toFixed(2)}`;
      document.getElementById("fondo")?.textContent = `$${fondo.toFixed(2)}`;
      document.getElementById("porcentaje")?.textContent = `${porcentaje}%`;

      if (porcentaje > 9.10) {
        alert("⚠️ Recuerda: CFE solo duplica hasta el 9.10% del salario base.");
      }
    };
  };

  reader.readAsDataURL(file);
}