// ACG: Variables globales para los datos del formulario
let aliasGlobal = '';
let emailGlobal = '';
let nivelGlobal = '';

// ACG: Mostrar versión y fecha de carga en pie de página
const version = 'v1.0.0';
const now = new Date();
const fechaHora = now.toLocaleString();
document.getElementById('versionInfo').innerText = `🧠 ClanAI ${version} – Última carga: ${fechaHora}`;

/**
 * ACG: Inicia la conversación una vez el formulario está completo
 */
async function iniciarConversacion() {
  aliasGlobal = document.getElementById('alias').value.trim();
  emailGlobal = document.getElementById('email').value.trim();
  nivelGlobal = document.getElementById('nivel').value;

  if (!aliasGlobal || !emailGlobal) {
    alert('Por favor completa tu nombre y correo.');
    return;
  }

  document.querySelector('.formulario').remove();
  agregarMensaje(`👋 Hola, ${aliasGlobal}, elegiste empezar el nivel ${nivelGlobal}.`, 'user');

  await enviarAlBackend('');
}

/**
 * ACG: Enviar datos al webhook de n8n y recibir respuesta
 * @param {string} respuestaUsuario - texto enviado por el usuario
 */
async function enviarAlBackend(respuestaUsuario) {
  const url = `https://n8n.serversnow.net/webhook/clanai-session-start?alias=${encodeURIComponent(aliasGlobal)}&email=${encodeURIComponent(emailGlobal)}&nivel=${encodeURIComponent(nivelGlobal)}&mensaje=${encodeURIComponent(respuestaUsuario)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    // ACG: Debug en consola para inspección
    console.log('🧾 Respuesta JSON completa recibida del backend:', JSON.stringify(data, null, 2));

    let respuestaIA = '✨ Estoy aquí para ti.';

    // ACG: Soporte tanto para objeto plano como para array con un objeto
    let mensaje = null;
    if (Array.isArray(data) && data.length > 0) {
      mensaje = data[0].message || data[0].mensaje_coach;
    } else if (typeof data === 'object') {
      mensaje = data.message || data.mensaje_coach;
    }

    if (typeof mensaje === 'string' && mensaje.trim() !== '') {
      respuestaIA = mensaje;
    } else {
      console.warn('⚠️ No se encontró un mensaje válido en la respuesta:', data);
    }

    console.log('📥 Mensaje IA procesado:', respuestaIA);
    agregarMensaje(respuestaIA, 'bot');
    crearInputRespuesta();
  } catch (err) {
    console.error('❌ Error en la conexión o procesamiento:', err);
    agregarMensaje('❌ Error de conexión o formato inesperado. Intenta más tarde.');
  }
}

/**
 * ACG: Agrega un mensaje al chat visual
 * @param {string} texto - Contenido del mensaje
 * @param {'bot' | 'user'} tipo - Remitente del mensaje
 */
function agregarMensaje(texto, tipo = 'bot') {
  const chat = document.getElementById('chat');
  const msg = document.createElement('div');
  msg.className = `chat-message ${tipo === 'user' ? 'user' : ''}`;
  msg.innerHTML = texto.replace(/\n/g, '<br>');
  chat.insertBefore(msg, document.getElementById('versionInfo'));
  chat.scrollTop = chat.scrollHeight;
}

/**
 * ACG: Crea campo de entrada para nueva respuesta del usuario
 */
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

  inputDiv.querySelector('input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      enviarRespuesta();
    }
  });
}

/**
 * ACG: Funcionalidad para enviar respuesta del usuario al backend
 */
async function enviarRespuesta() {
  const input = document.getElementById('respuesta');
  const respuesta = input.value.trim();
  if (!respuesta) return;

  input.parentElement.remove();
  agregarMensaje(respuesta, 'user');
  await enviarAlBackend(respuesta);
}

// ACG: Exponer funciones globales usadas desde el HTML
window.iniciarConversacion = iniciarConversacion;
window.enviarRespuesta = enviarRespuesta;

console.log("✅ script.js está corriendo correctamente");
