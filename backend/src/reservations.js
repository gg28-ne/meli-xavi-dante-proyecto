import { pool } from './db.js';
import { BUSINESS } from './config.js';

export class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Fecha del negocio; evita depender de la zona horaria del navegador.
export function todayInBusinessTimezone() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS.timezone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

// Valida también fechas imposibles, como 30 de febrero.
function dateParts(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
  if (!match) return null;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day
    ? { year, month, day, weekday: value.getUTCDay() } : null;
}

// Genera los posibles inicios según día y horario, sin consultar la BD.
export function slotsForDate(date) {
  if (typeof date !== 'string') throw new AppError(400, 'Indica una fecha de texto AAAA-MM-DD.');
  if (!Number.isInteger(BUSINESS.slotMinutes) || BUSINESS.slotMinutes <= 0) throw new AppError(500, 'Revisar slotMinutes en config.js.');
  const parts = dateParts(date);
  if (!parts) throw new AppError(400, 'La fecha debe tener formato AAAA-MM-DD.');
  if (date < todayInBusinessTimezone()) throw new AppError(400, 'No se admiten fechas pasadas.');
  if (!BUSINESS.openingDays.includes(parts.weekday)) return [];
  const slots = [];
  for (const period of BUSINESS.periods) {
    let cursor = toMinutes(period.start); const end = toMinutes(period.end);
    while (cursor <= end) { slots.push(fromMinutes(cursor)); cursor += BUSINESS.slotMinutes; }
  }
  return slots;
}

function toMinutes(time) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(time || ''));
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}
function fromMinutes(value) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }

// PROPORCIONADO: todos los caminos de escritura pasan por esta validación.
export function validateReservation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError(400, 'Se esperaba un objeto JSON.');
  if (typeof input.name !== 'string' || typeof input.date !== 'string' || typeof input.time !== 'string') throw new AppError(400, 'Nombre, fecha y hora deben ser textos.');
  if (!/^\d{2}:\d{2}$/.test(input.time)) throw new AppError(400, 'La hora debe tener formato HH:MM.');
  if (!['string', 'number'].includes(typeof input.diners)) throw new AppError(400, 'Comensales no válidos.');
  const reservation = {
    name: String(input.name || '').trim(), date: String(input.date || ''),
    time: input.time, diners: Number(input.diners)
  };
  if (reservation.name.length < 2 || reservation.name.length > 100) throw new AppError(400, 'El nombre debe tener entre 2 y 100 caracteres.');
  if (!Number.isInteger(reservation.diners) || reservation.diners < 1 || reservation.diners > BUSINESS.maxDiners) throw new AppError(400, `Los comensales deben estar entre 1 y ${BUSINESS.maxDiners}.`);
  if (!slotsForDate(reservation.date).includes(reservation.time)) throw new AppError(400, 'La hora no corresponde a una franja de apertura.');
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  if (reservation.date === todayInBusinessTimezone() && reservation.time <= currentTime) throw new AppError(400, 'No se admiten horas ya pasadas.');
  return reservation;
}

// Consulta pública: únicamente horas y estado libre/ocupado.
export async function availability(date) {
  const slots = slotsForDate(date);
  if (!slots.length) return [];
  const [rows] = await pool.execute("SELECT TIME_FORMAT(reservation_time, '%H:%i') AS time FROM reservations WHERE reservation_date=? AND status='active'", [date]);
  const occupied = new Set(rows.map(row => row.time));
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  return slots.map(time => ({ time, available: !occupied.has(time) && (date !== todayInBusinessTimezone() || time > currentTime) }));
}

// INSERT parametrizado. El índice UNIQUE resuelve las carreras simultáneas.
export async function createReservation(input, source = 'form') {
  const data = validateReservation(input);
  try {
    const [result] = await pool.execute('INSERT INTO reservations (customer_name,reservation_date,reservation_time,diners,source) VALUES (?,?,?,?,?)', [data.name, data.date, `${data.time}:00`, data.diners, source]);
    return { id: result.insertId, ...data, status: 'active', source };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'La franja acaba de ser reservada. Elige otra.');
    throw error;
  }
}

// Datos privados: solo conectar esta función a GET protegido por Nginx.
export async function listReservations() {
  const [rows] = await pool.query("SELECT id, customer_name AS name, DATE_FORMAT(reservation_date,'%Y-%m-%d') AS date, TIME_FORMAT(reservation_time,'%H:%i') AS time, diners, status, source, created_at AS createdAt FROM reservations ORDER BY reservation_date, reservation_time");
  return rows;
}

// UPDATE de una activa; la misma restricción UNIQUE protege la nueva franja.
export async function updateReservation(id, input) {
  validateId(id);
  const data = validateReservation(input);
  try {
    const [result] = await pool.execute("UPDATE reservations SET customer_name=?, reservation_date=?, reservation_time=?, diners=? WHERE id=? AND status='active'", [data.name, data.date, `${data.time}:00`, data.diners, id]);
    if (!result.affectedRows) throw new AppError(404, 'Reserva activa no encontrada.');
    return { id: Number(id), ...data, status: 'active' };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'La nueva franja ya está ocupada.');
    throw error;
  }
}

// Cancelación lógica: conserva historial y hace NULL el índice de franja activa.
export async function cancelReservation(id) {
  validateId(id);
  const [result] = await pool.execute("UPDATE reservations SET status='cancelled', cancelled_at=CURRENT_TIMESTAMP WHERE id=? AND status='active'", [id]);
  if (!result.affectedRows) throw new AppError(404, 'Reserva activa no encontrada.');
}


// Un id incorrecto debe producir 400, no una consulta ambigua.
function validateId(id) {
  if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) throw new AppError(400, 'ID no válido.');
}
