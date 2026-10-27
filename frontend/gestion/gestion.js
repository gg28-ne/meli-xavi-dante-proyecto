import { api } from '../js/api.js';
const status = document.querySelector('#admin-status');
const table = document.querySelector('#reservations');
const editForm = document.querySelector('#edit-form');

async function loadReservations() {
  // TODO F4: GET /api/reserves (protegido por Nginx).
  // Crear filas con textContent y botones Editar/Cancelar solo para activas.
  // Asociar acciones mediante addEventListener. No poner JSON de usuarios en HTML.
  status.textContent = 'TODO F4: listar reservas';
}
function selectReservation(reservation) {
  // TODO F4: copiar id,name,date,time,diners al formulario de edición.
}
async function updateReservation(event) {
  event.preventDefault();
  // TODO F4: PUT /api/reserves/:id con todos los campos; refrescar tras éxito.
  // Explicar 409 al usuario sin perder los datos que estaba editando.
  status.textContent = 'TODO F4: modificar reserva';
}
async function cancelReservation(id) {
  // TODO F4: pedir confirmación y DELETE /api/reserves/:id.
  // Respuesta 204 sin JSON. Refrescar para comprobar que sigue como cancelada.
}
// TODO F4: conectar selectReservation/cancelReservation a los botones de cada fila.
document.querySelector('#refresh').addEventListener('click', loadReservations);
editForm.addEventListener('submit', updateReservation);
loadReservations();
