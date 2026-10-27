import { api } from './api.js';

// Referencias proporcionadas: conservad los name/id del HTML o cambiad ambos archivos.
const bookingForm = document.querySelector('#booking-form');
const bookingStatus = document.querySelector('#booking-status');
const chatForm = document.querySelector('#chat-form');
const chatStatus = document.querySelector('#chat-status');
const messages = document.querySelector('#messages');
let conversationId = null;

async function loadBusiness() {
  // TODO F4: GET /api/config. Rellenar horario, máximo y fecha mínima según el negocio.
  // No usar la fecha local del navegador si difiere de Europe/Madrid.
}

async function loadAvailability() {
  // TODO F4: GET /api/disponibilitat?fecha=AAAA-MM-DD.
  // Vaciar la selección anterior, deshabilitar durante la carga y mostrar solo libres.
  // Si cambia rápidamente la fecha, no aplicar una respuesta de la fecha anterior.
  bookingStatus.textContent = 'TODO F4: cargar disponibilidad';
}

async function submitReservation(event) {
  event.preventDefault(); // Evita que el navegador recargue y borre el formulario.
  // TODO F4: recoger {name,date,time,diners}, convertir diners a número y hacer POST.
  // Deshabilitar botón durante envío, mostrar éxito solo después de recibir 201.
  // En error 409 refrescar disponibilidad. En finally rehabilitar botón.
  bookingStatus.textContent = 'TODO F4: enviar la reserva';
}

async function sendMessage(event) {
  event.preventDefault();
  // TODO F5: dibujar mensaje del usuario usando textContent, nunca HTML sin escapar.
  // POST /api/chat con {message,conversationId}. Conservar el id que devuelve.
  // Mostrar respuesta, estado de espera y errores. Evitar varios envíos a la vez.
  // Un 503 debe permitir seguir usando el formulario. NO fabricar confirmaciones.
  // Enviar el “sí” del usuario al backend; no escribir reservas directamente desde aquí.
  chatStatus.textContent = 'TODO F5: conectar el chat';
}

// Eventos básicos conectados a funciones vacías: ya se puede ver dónde trabajar.
bookingForm.elements.date.addEventListener('change', loadAvailability);
bookingForm.addEventListener('submit', submitReservation);
chatForm.addEventListener('submit', sendMessage);
loadBusiness();
