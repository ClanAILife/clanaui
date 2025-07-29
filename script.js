// ACG: Paso actual de la conversación (solo referencia interna, controlado por backend)
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
async function iniciarConversacion() {
  aliasGlobal = document.getElementById('alias').value.trim();
  emailGlobal = document.getElementById('email').value.trim();
  nivelGlobal = document.getElementById('nivel').value;

  if (!aliasGlobal || !emailGlobal) {
    alert('Por favor completa tu nombre y correo.');
    return;
  }

  // ACG: Elimina el formulario inicial del DOM
  document.querySelector('.formulario').remove();

  // ACG: Primer mensaje del usuario en el chat
  agregarMensaje(`👋 Hola, soy ${aliasGlobal} y quiero empezar el nivel ${nivelGlobal}.`, 'user');

  // ACG: Enviar mensaje inicial vacío al backend
  await enviarAlBackend('');
}

// ACG: Enviar datos al webhook de n8n y recibir respuesta
async function enviarAlBackend(respuestaUsuario) {
  const url = `https://n8n.serversnow.net/webhook/clanai-session-start?alias=${encodeURIComponent(aliasGlobal)}&email=${encodeURIComponent(emailGlobal)}&nivel=${encodeURIComponent(nivelGlobal)}&mensaje=${encodeURIComponent(respuestaUsuario)}&paso=${paso}`;

  try {
    const res = await fetch(url);

    // ACG: Validación del código de respuesta HTTP
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    console.log('✅ Respuesta cruda del backend:', data);

    // ACG: Mensaje predeterminado en caso de error
    let respuestaIA = '✨ Estoy aquí para ti.';

    // ACG: Validar estructura del mensaje recibido
    if (data && typeof data.message === 'string' && data.message.trim() !== '') {
      respuestaIA = data.message;
    } else {
      console.warn('⚠️ No se encontró un mensaje válido en la respuesta:', data);
    }

    console.log('📥 Mensaje IA procesado:', respuestaIA);

    // ACG: Mostrar respuesta de la IA en el chat
    agregarMensaje(respuestaIA, 'bot');

    // ACG: Si la sesión continúa, mostrar input
    if (!data.sesionTerminada) {
      paso = data.paso ?? paso;
      crearInputRespuesta();
    } else {
      agregarMensaje('🔀 Tu proceso ha terminado. Gracias por estar aquí.');
    }

  } catch (err) {
    console.error('❌ Error en la conexión o procesamiento:', err);
    agregarMensaje('❌ Error de conexión. Intenta más tarde.');
  }
}

// ACG: Agrega un mensaje al chat visual (bot o usuario)
function agregarMensaje(texto, tipo = 'bot') {
  const chat = document.getElementById('chat');
  const msg = document.createElement('div');
  msg.className = `chat-message ${tipo === 'user' ? 'user' : ''}`;
  msg.innerHTML = texto.replace(/\n/g, '<br>');
  chat.insertBefore(msg, document.getElementById('versionInfo'));
  chat.scrollTop = chat.scrollHeight;
}

// ACG: Crea campo de entrada para nueva respuesta del usuario
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

  // ACG: Permitir enviar con tecla Enter
  inputDiv.querySelector('input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      enviarRespuesta();
    }
  });
}

// ACG: Enviar respuesta del usuario al backend
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
