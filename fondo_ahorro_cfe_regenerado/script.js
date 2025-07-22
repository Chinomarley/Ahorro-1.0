const upload = document.getElementById('upload');
const sueldoSpan = document.getElementById('sueldo');
const fondoSpan = document.getElementById('fondo');
const porcentajeSpan = document.getElementById('porcentaje');
const alerta = document.getElementById('alerta');

upload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) {
    alerta.textContent = '⚠️ Archivo inválido. Solo se aceptan imágenes.';
    return;
  }

  alerta.textContent = '⏳ Procesando imagen...';
  const reader = new FileReader();
  reader.onload = async () => {
    const img = new Image();
    img.src = reader.result;

    img.onload = async () => {
      const result = await Tesseract.recognize(img, 'spa', {
        logger: m => console.log(m)
      });

      const text = result.data.text;

      // Buscar sueldo
      const sueldoMatch = text.match(/SALARIO.*?\$?([\d,]+\.\d{2})/i);
      const fondoMatch = text.match(/FONDO.*?\$?([\d,]+\.\d{2})/i);
      const periodoMatch = text.match(/PERIODO\s+DE\s+PAGO\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);

      if (!sueldoMatch || !fondoMatch) {
        alerta.textContent = '❌ La imagen no contiene datos válidos para el cálculo.';
        return;
      }

      const sueldo = parseFloat(sueldoMatch[1].replace(',', ''));
      const fondo = parseFloat(fondoMatch[1].replace(',', ''));
      const periodoPago = periodoMatch ? periodoMatch[1] : new Date().toLocaleDateString();

      // Evitar duplicados
      const historial = JSON.parse(localStorage.getItem('historialFondo')) || [];
      if (historial.find(e => e.periodo === periodoPago)) {
        alerta.textContent = `⚠️ Esta papeleta ya fue procesada (${periodoPago})`;
        return;
      }

      const porcentaje = (fondo / sueldo) * 100;

      sueldoSpan.textContent = `$${sueldo.toFixed(2)}`;
      fondoSpan.textContent = `$${fondo.toFixed(2)}`;
      porcentajeSpan.textContent = `${porcentaje.toFixed(2)}%`;

      if (porcentaje > 9.10) {
        alerta.textContent = `🔔 Atención: CFE solo duplica hasta el 9.10%.`;
      } else {
        alerta.textContent = '';
      }

      // Guardar en historial
      historial.push({ periodo: periodoPago, sueldo, fondo, porcentaje });
      localStorage.setItem('historialFondo', JSON.stringify(historial));
    };
  };
  reader.readAsDataURL(file);
});