// PROPORCIONADO: conector técnico y barrera de confirmación.
// F5: integrarlo desde server.js y desde el formulario de chat; adaptar el prompt.
import crypto from 'node:crypto';
import { makeTrace, errorDetails } from './debug.js';
import { GoogleGenAI, Type } from '@google/genai';
import { availability, createReservation, validateReservation, AppError, todayInBusinessTimezone } from './reservations.js';
import { BUSINESS } from './config.js';

// El estado pendiente vive en memoria y caduca: no contiene datos de terceros.
const conversations = new Map();
const TTL_MS = 30 * 60 * 1000;

const tools = [{ functionDeclarations: [
  { name: 'consultar_disponibilidad', description: 'Consulta las franjas reales de una fecha.', parameters: { type: Type.OBJECT, properties: { fecha: { type: Type.STRING, description: 'AAAA-MM-DD' } }, required: ['fecha'] } },
  { name: 'preparar_reserva', description: 'Prepara una reserva completa para pedir confirmación; nunca la crea.', parameters: { type: Type.OBJECT, properties: {
    nombre: { type: Type.STRING }, fecha: { type: Type.STRING, description: 'AAAA-MM-DD' }, hora: { type: Type.STRING, description: 'HH:MM, 24 horas' }, comensales: { type: Type.INTEGER }
  }, required: ['nombre', 'fecha', 'hora', 'comensales'] } }
]}];

function getConversation(id) {
  // Retirar sesiones caducadas para no acumular memoria durante las prácticas.
  for (const [key, item] of conversations) {
    if (Date.now() - item.updatedAt >= TTL_MS) conversations.delete(key);
  }
  const existing = id && conversations.get(id);
  if (existing && Date.now() - existing.updatedAt < TTL_MS) return existing;
  const conversation = { id: crypto.randomUUID(), history: [], pending: null, updatedAt: Date.now() };
  conversations.set(conversation.id, conversation);
  return conversation;
}

function isConfirmation(text) { return /^(sí|si|confirmo|confirmar|d’acord|d'acord|de acuerdo|vale)$/i.test(text.trim()); }
function isRejection(text) { return /^(no|cancelar|cancela|olvídalo|olvidalo)$/i.test(text.trim()); }

export async function chat(message, conversationId, trace = makeTrace()) {
  trace("01 ENTRADA", { message, conversationId });
  if (!process.env.GEMINI_API_KEY) throw new AppError(503, 'El asistente no está configurado. Puedes reservar con el formulario.');
  if (typeof message !== 'string' || !message.trim() || message.trim().length > 500) throw new AppError(400, 'Escribe un mensaje de hasta 500 caracteres.');
  const conversation = getConversation(conversationId);
  if (conversation.busy) throw new AppError(409, 'Espera que acabi el missatge anterior.');
  conversation.busy = true;
  try {
    trace("02 CONVERSACION", { id: conversation.id, historyLength: conversation.history.length, pending: conversation.pending });

    if (conversation.pending && isConfirmation(message)) {
      trace('03 CONFIRMACION INSERT INICIO', { pending: conversation.pending });
      const reservation = await createReservation(conversation.pending, 'chat');
      trace('04 CONFIRMACION INSERT OK', { reservation });
      conversation.pending = null; conversation.history = []; conversation.updatedAt = Date.now();
      return { conversationId: conversation.id, message: `Reserva confirmada per a ${reservation.name}: ${reservation.date} a les ${reservation.time}, ${reservation.diners} comensals.`, reservation };
    }
    if (conversation.pending && isRejection(message)) {
      conversation.pending = null; conversation.history = []; conversation.updatedAt = Date.now();
      return { conversationId: conversation.id, message: 'He descartat la proposta. Pots indicar-me altres dades.' };
    }

    // Correcciones del diagnóstico: una petición como máximo y espera limitada.
    // Una corrección del usuario invalida la propuesta anterior. Nunca confirmar datos antiguos.
    conversation.pending = null;
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } }
    });
    // TODO F5: adaptar personalidad, servicio y reglas; mantener los límites de seguridad.
    const systemInstruction = `Eres el asistente de ${BUSINESS.name}. Parla sempre en català. No inventis dades que falten. Ayudas exclusivamente a consultar disponibilidad y preparar reservas para una única mesa. Hoy es ${todayInBusinessTimezone()} en ${BUSINESS.timezone}. Pide nombre, fecha inequívoca, hora inequívoca y comensales (1-${BUSINESS.maxDiners}). Si falta algo, pregunta solo por ello. Si una hora como "a las nueve" es ambigua, aclara comida o cena. Usa consultar_disponibilidad para disponibilidad y preparar_reserva cuando tengas todos los datos. Nunca afirmes que una reserva está creada: la aplicación pedirá confirmación. No listes, modifiques ni canceles reservas existentes.`;
    const contents = [...conversation.history, { role: 'user', parts: [{ text: String(message).trim() }] }];
    const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    trace('03 GEMINI PETICION', { model, keyConfigured: Boolean(process.env.GEMINI_API_KEY), contents });
    let response;
    try {
      response = await ai.models.generateContent({ model, contents, config: { systemInstruction, tools } });
    } catch (error) {
      // Mantiene el diagnóstico original en Docker, sin convertir todos los fallos en 500.
      trace('04 GEMINI ERROR', errorDetails(error));
      const status = Number(error.status);
      const detail = status === 503 ? 'Gemini està saturat temporalment.'
        : status === 429 ? 'Cuota o límite de peticiones de Gemini.'
        : status === 404 ? 'Modelo de Gemini no encontrado o no disponible para esta clave.'
        : [400, 401, 403].includes(status) ? 'Gemini ha rechazado la petición; consulta el registro del backend.'
        : 'No se ha podido obtener respuesta de Gemini; consulta el registro del backend.';
      throw new AppError(503, `${detail} Puedes reservar con el formulario.`);
    }
    trace('04 GEMINI RESPUESTA', {
      candidates: response.candidates?.map(candidate => ({
        finishReason: candidate.finishReason,
        parts: candidate.content?.parts?.filter(part => !part.thought).map(part => ({ text: part.text, functionCall: part.functionCall }))
      })),
      promptFeedback: response.promptFeedback,
      usageMetadata: response.usageMetadata
    });
    const calls = response.functionCalls || [];
    trace('05 FUNCIONES RECIBIDAS', { calls });
    const call = calls[0];
    if (calls.length > 1) trace('AVISO', { message: 'El conector original solo procesa la primera función.' });
    // No leer response.text cuando la respuesta es una función (evita avisos del SDK).
    let reply = call ? '' : (response.text || 'Em pots donar més detalls de la reserva?');

    if (call?.name === 'consultar_disponibilidad') {
      trace('06 DISPONIBILIDAD INICIO', { args: call.args });
      const slots = await availability(call.args.fecha);
      trace('07 DISPONIBILIDAD OK', { slots });
      const free = slots.filter(slot => slot.available).map(slot => slot.time);
      reply = free.length ? `Per al ${call.args.fecha} queden lliures: ${free.join(', ')}.` : `No queden franges disponibles per al ${call.args.fecha}.`;
    }
    if (call?.name === 'preparar_reserva') {
      trace('06 PROPUESTA VALIDACION', { args: call.args });
      const proposed = validateReservation({ name: call.args.nombre, date: call.args.fecha, time: call.args.hora, diners: call.args.comensales });
      trace('07 PROPUESTA VALIDA', { proposed });
      const slots = await availability(proposed.date);
      trace('08 PROPUESTA DISPONIBILIDAD OK', { slots });
      if (!slots.find(slot => slot.time === proposed.time)?.available) reply = `La franja ${proposed.date} a les ${proposed.time} està ocupada. Demana’m altres opcions.`;
      else {
        conversation.pending = proposed;
        reply = `Confirma una taula: ${proposed.name}, ${proposed.date} a les ${proposed.time}, ${proposed.diners} comensals. Respon “sí” per reservar o “no” per descartar-la.`;
      }
    }
    conversation.history = [...contents, { role: 'model', parts: [{ text: reply }] }].slice(-10);
    conversation.updatedAt = Date.now();
    trace('09 RESPUESTA PREPARADA', { reply, pending: conversation.pending });
    return { conversationId: conversation.id, message: reply, pendingConfirmation: Boolean(conversation.pending) };
  } finally {
    conversation.busy = false;
  }
}
