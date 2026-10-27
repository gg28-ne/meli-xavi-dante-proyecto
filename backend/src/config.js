// TODO F1/F4: adaptar las reglas y servirlas al navegador mediante /api/config.
// end es la ÚLTIMA HORA DE INICIO admitida, no el cierre físico del local.
// La mesa se ocupa durante slotMinutes; el siguiente grupo entra al terminar.
// Si cambia maxDiners, revisar también CHECK de database/init.sql.
export const BUSINESS = {
  name: 'ReservaFácil Bistro',
  service: 'mesa del restaurante',
  timezone: 'Europe/Madrid',
  slotMinutes: 30,
  maxDiners: 8,
  // 0=domingo, 1=lunes... El restaurante cierra los lunes.
  openingDays: [0, 2, 3, 4, 5, 6],
  periods: [
    { start: '13:00', end: '15:30' },
    { start: '20:00', end: '22:30' }
  ]
};

