// ACG: Esperar a que cargue todo el DOM antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

  // ACG: Paso actual de la conversación (controlado desde backend, no se muestra al usuario)
  let paso = 0;

  // ACG: Variables globales para los datos del formulario
  let aliasGlobal = '';
  let emailGlobal = '';
  let nivelGlobal = '';

  // ACG: Mostrar versión y fecha de carga en pie de página
  const version = 'v1.0.0';
  const now = new Date();
  const fechaHora = now.toLocaleString();
  document.getElementById('versionInfo').innerText = `🧠 ClanAI ${version} – Última carga: ${fechaHora}`;

  // ACG: Inicia la conversación una vez el formulario está completo
  window.iniciarConversacion = async function () {
    // ACG: Obtener valores del formulario
    aliasGlobal = document.getElementById('alias').value.trim();
    emailGlobal = document.getElementById('email').value.trim();
    nivelGlobal = document.getElementById('nivel').value.trim();

    // ACG: Validación básica de campos
    if (!aliasGlobal || !emailGlobal) {
      alert('Por favor completa tu nombre y correo.');
      return;
    }

    // ACG: Eliminar formulario e iniciar conversación
    document.querySelector('.formulario').remove();
    agregarMensaje(`👋 Hola, soy ${aliasGlobal} y quiero empezar el nivel ${nivelGlobal}.`, 'user');

    // ACG: Enviar al backend sin mensaje inicial (solo configuración)
    await enviarAlBackend('');
  };

  // ACG: Enviar datos al backend (n8n) y manejar la respuesta
  async function enviarAlBackend(respuestaUsuario) {
    const url = `https://n8n.serversnow.net/webhook/clanai-session-start?alias=${encodeURIComponent(aliasGlobal)}&email=${encodeURIComponent(emailGlobal)}&nivel=${encodeURIComponent(nivelGlobal)}&mensaje=${encodeURIComponent(respuestaUsuario)}&paso=${paso}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      // ACG: Determinar contenido del mensaje
      let respuestaIA = '✨ Estoy aquí para ti.';
      if (typeof data.message === 'string' && data.message.trim() !== '') {
        respuestaIA = data.message;
      }

      console.log('Respuesta del backend:', data);
      console.log('Mensaje IA:', respuestaIA);

      agregarMensaje(respuestaIA, 'bot');

      // ACG: Si la sesión continúa, actualizar paso y crear input
      if (!data.sesionTerminada) {
        paso = data.paso ?? paso;
        crearInputRespuesta();
      } else {
        agregarMensaje('🔀 Tu proceso ha terminado. Gracias por estar aquí.');
      }

    } catch (err) {
      console.error('Error al conectar con el backend:', err);
      agregarMensaje('❌ Error de conexión. Intenta más tarde.');
    }
  }

  // ACG: Agrega un mensaje al chat visual (tipo: 'bot' o 'user')
  function agregarMensaje(texto, tipo = 'bot') {
    const chat = document.getElementById('chat');
    const msg = document.createElement('div');
    msg.className = `chat-message ${tipo === 'user' ? 'user' : ''}`;
    msg.innerHTML = texto.replace(/\n/g, '<br>');
    chat.insertBefore(msg, document.getElementById('versionInfo'));
    chat.scrollTop = chat.scrollHeight;
  }

  // ACG: Crea campo de entrada para la siguiente respuesta del usuario
  function crearInputRespuesta() {
    const chat = document.getElementById('chat');
    const inputDiv = document.createElement('div');
    inputDiv.className = 'chat-input';
    inputDiv.innerHTML = `
      <input type="text" id="respuesta" placeholder="Escribe tu respuesta..." />
      <button onclick="enviarRespuesta()">Enviar</button>
    `;
    chat.insertBefore(inputDiv, document.getElementById('versionInfo'));
    chat.scrollTop = chat.scrollHeight;

    // ACG: Permitir enviar con Enter
    inputDiv.querySelector('input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarRespuesta();
      }
    });
  }

  // ACG: Enviar respuesta del usuario al backend
  window.enviarRespuesta = async function () {
    const input = document.getElementById('respuesta');
    const respuesta = input.value.trim();
    if (!respuesta) return;

    input.parentElement.remove();
    agregarMensaje(respuesta, 'user');
    await enviarAlBackend(respuesta);
  };
});
