// ACG: Paso actual de la conversación (controlado desde backend)
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

  document.querySelector('.formulario').remove();
  agregarMensaje(`👋 Hola, soy ${aliasGlobal} y quiero empezar el nivel ${nivelGlobal}.`, 'user');

  await enviarAlBackend('');
}

// ACG: Enviar datos al webhook de n8n y recibir respuesta
async function enviarAlBackend(respuestaUsuario) {
  const url = `https://n8n.serversnow.net/webhook/clanai-session-start?alias=${encodeURIComponent(aliasGlobal)}&email=${encodeURIComponent(emailGlobal)}&nivel=${encodeURIComponent(nivelGlobal)}&mensaje=${encodeURIComponent(respuestaUsuario)}&paso=${paso}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log('Respuesta cruda del backend:', data);

    let respuestaIA = '✨ Estoy aquí para ti.';

    // ACG: Procesar respuesta del backend
    if (typeof data.message === 'string') {
      respuestaIA = data.message;
    } else if (typeof data.message === 'object') {
      if ('content' in data.message) {
        respuestaIA = data.message.content;
      } else {
        const firstKey = Object.keys(data.message)[0];
        respuestaIA = data.message[firstKey] || respuestaIA;
      }
    }

    console.log('Mensaje IA procesado:', respuestaIA);
    agregarMensaje(respuestaIA, 'bot');

    // ACG: Si la sesión continúa, crear input para siguiente respuesta
    if (!data.sesionTerminada) {
      paso = data.paso ?? paso;
      crearInputRespuesta();
    } else {
      agregarMensaje('🔀 Tu proceso ha terminado. Gracias por estar aquí.');
    }
  } catch (err) {
    console.error('Error

