// Tests proporcionados del núcleo. No sustituyen las pruebas de integración del alumnado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { slotsForDate, validateReservation, todayInBusinessTimezone } from '../src/reservations.js';
import { BUSINESS } from '../src/config.js';

// Buscar una fecha futura abierta: no depender de una fecha fija que caduque.
function nextOpenDate() {
  const date = new Date(`${todayInBusinessTimezone()}T12:00:00Z`);
  for (let n = 0; n < 8; n++) {
    date.setUTCDate(date.getUTCDate() + 1);
    const iso = date.toISOString().slice(0, 10);
    if (slotsForDate(iso).length) return iso;
  }
  throw new Error('La configuración no tiene días abiertos');
}
function valid() {
  const date = nextOpenDate();
  return { name: 'Anna Demo', date, time: slotsForDate(date)[0], diners: 2 };
}

test('acepta datos válidos y limpia espacios del nombre', () => {
  assert.equal(validateReservation({ ...valid(), name: ' Anna Demo ' }).name, 'Anna Demo');
});
test('rechaza fechas imposibles', () => {
  assert.throws(() => slotsForDate('2099-02-30'), e => e.status === 400);
});
test('rechaza fechas pasadas', () => {
  assert.throws(() => slotsForDate('2000-01-01'), e => e.status === 400);
});
test('rechaza nombre vacío, hora ajena a franja y hora mal formada', () => {
  for (const changes of [{name:''},{time:'03:07'},{time:'13:00texto'}]) {
    assert.throws(() => validateReservation({...valid(),...changes}), e => e.status === 400);
  }
});
test('rechaza comensales fuera de rango y booleanos', () => {
  for (const diners of [0, BUSINESS.maxDiners+1, 1.5, true]) {
    assert.throws(() => validateReservation({...valid(),diners}), e => e.status === 400);
  }
});
test('rechaza cuerpo JSON ausente y query de fecha repetida como array', () => {
  assert.throws(() => validateReservation(null), e => e.status === 400);
  assert.throws(() => slotsForDate(['2099-06-16']), e => e.status === 400);
});
