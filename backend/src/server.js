import express from 'express';
import { pool } from './db.js';
import { AppError } from './reservations.js';
import { makeTrace, errorDetails } from './debug.js';
// TODO F4: importar availability, createReservation, listReservations,
// updateReservation y cancelReservation desde reservations.js.
// TODO F5: importar chat desde chat.js. No escribir un segundo conector Gemini.

const app = express();
// Únicos mecanismos comunes: leer JSON y responder errores. Sin login en Node.
app.use(express.json({ limit: '20kb' }));

// PROPORCIONADO: ejemplo real de async/await, SQL y gestión del error.
app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) { next(error); }
});

// PROPORCIONADO: configuración pública para no duplicar reglas en el navegador.
// TODO F4: importar BUSINESS y todayInBusinessTimezone y devolverlas según API.md.
app.get('/api/config', (_req, res) => {
  res.status(501).json({ error: 'TODO F4: publicar configuración sin secretos' });
});

app.get('/api/disponibilitat', async (req, res, next) => {
  // TODO F4: req.query.fecha -> availability(fecha).
  // Responder { date: fecha, slots: [...] }. Solo horas; nunca nombres.
  // Usar try/catch y next(error), como /api/health.
  res.status(501).json({ error: 'TODO F4: consultar disponibilidad' });
});

app.post('/api/reserves', async (req, res, next) => {
  // TODO F4: pasar req.body a createReservation; esa función ya valida e inserta.
  // Responder 201 + reserva. No hacer SELECT y después INSERT por vuestra cuenta.
  // Prueba: dos POST simultáneos -> una alta y un conflicto 409.
  res.status(501).json({ error: 'TODO F4: crear reserva' });
});

app.get('/api/reserves', async (req, res, next) => {
  // TODO F4: llamar a listReservations y devolver su array.
  // OBLIGATORIO F3: Nginx debe exigir credenciales para este método/ruta.
  res.status(501).json({ error: 'TODO F4: listar reservas' });
});

app.put('/api/reserves/:id', async (req, res, next) => {
  // TODO F4: updateReservation(req.params.id, req.body) -> respuesta 200.
  // No permitir cambios en canceladas. No implementar autenticación en Express.
  res.status(501).json({ error: 'TODO F4: modificar reserva' });
});

app.delete('/api/reserves/:id', async (req, res, next) => {
  // TODO F4: cancelReservation(req.params.id) -> respuesta 204 SIN cuerpo.
  // Es cancelación lógica: la fila permanece y se libera la franja.
  res.status(501).json({ error: 'TODO F4: cancelar reserva' });
});

app.post('/api/chat', async (req, res, next) => {
  // PROPORCIONADO: trazabilidad por petición. La clave nunca se imprime.
  const trace = makeTrace();
  res.setHeader('X-Request-Id', trace.id);
  trace('00 HTTP INICIO', { method: req.method, path: req.path });
  res.on('finish', () => trace('10 HTTP FIN', { status: res.statusCode }));
  // TODO F5: llamar a chat(req.body?.message, req.body?.conversationId, trace).
  // Enviar el resultado JSON; en catch registrar errorDetails y llamar next(error).
  // El helper ya impide INSERT sin confirmación. No llamar aquí a createReservation.
  res.status(501).json({ error: 'TODO F5: conectar el asistente' });
});

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((error, _req, res, _next) => {
  console.error('[API ERROR]', errorDetails(error));
  const status = error instanceof AppError ? error.status
    : error.type === 'entity.parse.failed' ? 400
    : error.type === 'entity.too.large' ? 413 : 500;
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor'
    : error instanceof AppError ? error.message : 'JSON incorrecto o demasiado grande' });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Backend escuchando en ${port}`));
