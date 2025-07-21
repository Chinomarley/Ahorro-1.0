
function iniciarSesion() {
  const user = document.getElementById('usuario').value;
  const pass = document.getElementById('password').value;
  const error = document.getElementById('error');

  if (USUARIOS[user] && USUARIOS[user].password === pass) {
    localStorage.setItem("usuarioActivo", user);
    window.location.href = user === "admin" ? "admin.html" : "index.html";
  } else {
    error.textContent = "Usuario o contraseña incorrectos.";
  }
}
