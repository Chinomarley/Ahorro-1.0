document.addEventListener("DOMContentLoaded", () => {
  const u = localStorage.getItem("usuario");
  if (!u) return window.location.href = "login.html";
  document.getElementById("usuarioNombre").textContent = u;
  const input = document.getElementById("aporte");
  const label = document.getElementById("porcentajeManual");
  input.oninput = () => label.textContent = input.value + "%";
});

function procesarImagen() {
  const file = document.getElementById("upload").files[0];
  const prog = document.getElementById("progress");
  const alertEl = document.getElementById("alerta");
  if (!file || !file.type.startsWith("image")) {
    alertEl.textContent = "Por favor sube una imagen.";
    return;
  }
  alertEl.textContent = "";
  prog.style.display = "block";
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = async () => {
      const res = await Tesseract.recognize(img, 'spa', {
        logger: m => { if (m.status === 'recognizing text') prog.value = m.progress; }
      });
      prog.style.display = "none";
      const text = res.data.text;
      const sal = (text.match(/salario\\s*:?\\s*\\$?([\\d,]+\\.\\d{2})/i)||["","0"])[1];
      const fond = (text.match(/fondo de ahorro\\s*:?\\s*\\$?([\\d,]+\\.\\d{2})/i)||["","0"])[1];
      const s = parseFloat(sal.replace(',','')), f = parseFloat(fond.replace(',',''));
      document.getElementById("sueldoDetectado").textContent = "$"+s.toFixed(2);
      document.getElementById("fondoDetectado").textContent = "$"+f.toFixed(2);
      if (s > 0) {
        const pct = (f/s*100).toFixed(2);
        document.getElementById("porcentajeCalculado").textContent = pct+"%";
        if (pct > 9.1) alertEl.textContent = "⚠️ Estás pasando del 9.10%. CFE no duplica el exceso.";
        else alertEl.textContent = "";
      }
    };
  };
  reader.readAsDataURL(file);
}