// --- LOGIN ---
const usuarios = [
  { usuario: "admin", password: "admin123", rol: "admin" },
  { usuario: "juan", password: "clave123", rol: "user" },
  { usuario: "lupita", password: "contraseña", rol: "user" }
];

function login() {
  const u = document.getElementById("usuario").value.trim();
  const p = document.getElementById("password").value.trim();
  const encontrado = usuarios.find(uData => uData.usuario === u && uData.password === p);

  if (encontrado) {
    localStorage.setItem("usuarioActivo", u);
    window.location.href = "app.html";
  } else {
    document.getElementById("login-error").textContent = "Credenciales inválidas.";
  }
}

// --- APP ---
if (window.location.pathname.includes("app.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("usuarioActivo")) {
      window.location.href = "index.html";
    }
  });
}

let datosActuales = {};

function procesarImagen() {
  const input = document.getElementById("papeleta");
  const archivo = input.files[0];
  const progreso = document.getElementById("progreso");
  const mensaje = document.getElementById("mensajeError");
  mensaje.textContent = "";

  if (!archivo || !archivo.type.startsWith("image/")) {
    mensaje.textContent = "Por favor, selecciona una imagen válida.";
    return;
  }

  const lector = new FileReader();
  lector.onload = function () {
    const imagen = new Image();
    imagen.src = lector.result;

    imagen.onload = async () => {
      progreso.style.display = "block";
      const resultado = await Tesseract.recognize(imagen, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            progreso.value = m.progress;
          }
        }
      });
      progreso.style.display = "none";

      const texto = resultado.data.text;

      const fondoMatch = texto.match(/FONDO\s*DE\s*AHORRO\s*\$?\s*([\d,]+\.\d{2})/i);
      const salarioMatch = texto.match(/SALARIO\s*BASE\s*\$?\s*([\d,]+\.\d{2})/i);
      const periodoPagoMatch = texto.match(/PERIODO\s*PAGO\s*:? ([\d\-\/]+)/i);
      const periodoAsistenciaMatch = texto.match(/PERIODO\s*ASISTENCIA\s*:? ([\d\-\/]+)/i);

      const fondo = fondoMatch ? parseFloat(fondoMatch[1].replace(/,/g, '')) : 0;
      const salario = salarioMatch ? parseFloat(salarioMatch[1].replace(/,/g, '')) : 0;
      const porcentaje = salario ? (fondo / salario * 100) : 0;

      datosActuales = {
        fondo,
        salario,
        porcentaje,
        periodoPago: periodoPagoMatch ? periodoPagoMatch[1] : '',
        periodoAsistencia: periodoAsistenciaMatch ? periodoAsistenciaMatch[1] : '',
        meses: parseInt(document.getElementById("meses").value)
      };

      document.getElementById("fondoDescontado").textContent = `$${fondo.toFixed(2)}`;
      document.getElementById("salarioBase").textContent = `$${salario.toFixed(2)}`;
      document.getElementById("porcentajeCalculado").textContent = `${porcentaje.toFixed(2)}%`;

      const advertencia = document.getElementById("advertencia");
      if (porcentaje > 9.1) {
        advertencia.textContent = "⚠️ CFE solo duplica hasta el 9.10%. El excedente no será duplicado.";
      } else {
        advertencia.textContent = "";
      }
    };
  };
  lector.readAsDataURL(archivo);
}

function guardarHistorial() {
  if (!datosActuales.fondo || !datosActuales.salario) {
    alert("Primero debes procesar una papeleta válida.");
    return;
  }

  const historial = JSON.parse(localStorage.getItem("historialPapeletas") || "[]");

  const yaExiste = historial.some(p =>
    p.periodoPago === datosActuales.periodoPago
  );

  if (yaExiste) {
    alert("Ya procesaste esta papeleta.");
    return;
  }

  historial.push({
    ...datosActuales,
    fecha: new Date().toLocaleDateString()
  });

  localStorage.setItem("historialPapeletas", JSON.stringify(historial));
  alert("Papeleta guardada exitosamente.");
}

function mostrarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historialPapeletas") || "[]");
  const contenedor = document.getElementById("historialContainer");

  if (!historial.length) {
    contenedor.innerHTML = "<p>No hay datos registrados.</p>";
    return;
  }

  let tabla = `<table><thead>
    <tr><th>Fecha</th><th>Salario</th><th>Fondo</th><th>%</th><th>Meses</th><th>Periodo Pago</th></tr>
    </thead><tbody>`;

  historial.forEach(d => {
    tabla += `<tr>
      <td>${d.fecha}</td>
      <td>$${d.salario.toFixed(2)}</td>
      <td>$${d.fondo.toFixed(2)}</td>
      <td>${d.porcentaje.toFixed(2)}%</td>
      <td>${d.meses}</td>
      <td>${d.periodoPago}</td>
    </tr>`;
  });

  tabla += "</tbody></table>";
  contenedor.innerHTML = tabla;
}