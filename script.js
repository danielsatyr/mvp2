// script.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔌 script.js cargado');
  const form = document.getElementById('miFormulario');
  form.addEventListener('submit', event => {
    event.preventDefault();

    // Recogemos los valores
    const nombre = document.getElementById('nombre').value;
    const edad   = document.getElementById('edad').value;
    const ingles = document.getElementById('ingles').value;

    const qs = `nombre=${encodeURIComponent(nombre)}&edad=${encodeURIComponent(edad)}&ingles=${encodeURIComponent(ingles)}`;
    console.log('QueryString →', qs);

    // Redirige a resultado.html con parámetros
    window.location.href = `resultado?${qs}`;
  });
});