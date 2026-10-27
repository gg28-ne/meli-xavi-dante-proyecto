import crypto from 'node:crypto';

// Activado para esta versión de diagnóstico. DEBUG_CHAT=false silencia las trazas.
// Solo se registran campos seleccionados: nunca cabeceras, .env ni objetos HTTP.
export function redact(value) {
  let text = String(value ?? '');
  for (const key of ['GEMINI_API_KEY', 'DB_PASSWORD', 'DB_ROOT_PASSWORD']) {
    if (process.env[key]) text = text.split(process.env[key]).join('[OCULTO]');
  }
  return text.replace(/AIza[\w-]+/g, '[CLAVE OCULTA]');
}

export function errorDetails(error) {
  return {
    name: error?.name,
    status: error?.status,
    code: error?.code,
    message: redact(error?.message),
    cause: redact(error?.cause?.message),
    causeCode: error?.cause?.code,
    stack: redact(error?.stack)
  };
}

export function makeTrace() {
  const id = crypto.randomUUID().slice(0, 8);
  const started = Date.now();
  const trace = (stage, data = {}) => {
    if (process.env.DEBUG_CHAT === 'false') return;
    console.log(`[CHAT ${id}] +${Date.now() - started}ms ${stage}`, redact(JSON.stringify(data)));
  };
  trace.id = id;
  return trace;
}
