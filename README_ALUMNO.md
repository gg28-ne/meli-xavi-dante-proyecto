# Guía del alumnado · ReservaFàcil · 99 h

## 1. Qué recibís y qué significa que funcione

Esta edición sustituye la base completamente conectada por un esqueleto guiado. Recibís código
crítico funcional, pero tenéis que conectar el sistema y demostrarlo. Las páginas son maquetas
mínimas; no existe autenticación de gestión todavía. Trabajad con datos ficticios.

| Preparado | Pendiente |
|---|---|
| Dependencias fijadas por package-lock y Dockerfiles | Configuración de servicios, persistencia y dependencias |
| Nginx sirve HTML | Proxy, autenticación básica y phpMyAdmin restringido |
| SQL, conexión y funciones de reservas | Rutas HTTP, eventos de interfaz y diseño |
| Validación y exclusión de duplicados | Adaptar reglas y comunicar errores al usuario |
| Conector Gemini, confirmación y trazas | Prompt, endpoint y conversación en pantalla |
| Scripts de copia y restauración | Montajes, planificación y demostrar recuperación |
| Plantillas MkDocs, Actions y pruebas | Contenidos, publicación y evidencias |

Código/comentarios y guía en castellano; interfaz base y asistente en catalán según el enunciado.

## 2. Primer arranque, antes de completar F3

Requisitos: Docker Engine y complemento Compose v2; editor; navegador; Git.
Para MkDocs: Python 3.12 y un entorno virtual. La IA requiere una clave del proveedor en F5.

```bash
cp .env.example .env
docker compose config --quiet
docker compose up -d --build nginx
docker compose ps
```

Abrir http://localhost:8085. El botón del formulario indica la tarea pendiente y no guarda datos.
Los servicios del perfil `taller` no arrancan todavía. Tras completar sus TODO:

```bash
docker compose --profile taller up -d --build
docker compose --profile taller ps
docker compose logs --tail=100 nginx backend mariadb
```

No activéis el perfil esperando que la plantilla incompleta funcione: a MariaDB le faltan
credenciales/montajes y al backend las variables de BD. Completadlo siguiendo F3.

- Modificar JS del backend exige `docker compose up -d --build backend`.
- Modificar `.env` exige recrear: `docker compose up -d --force-recreate backend`.
- `restart` no reconstruye código ni incorpora cambios de variables.
- Para parar todo el taller: `docker compose --profile taller down`.
- Añadir `-v` elimina los volúmenes: NO usarlo como solución habitual de errores.

## 3. Dónde trabajar

| Archivo | Función |
|---|---|
| docker-compose.yml | Único Compose; completar F3 y F6 |
| nginx/default.conf | Web, proxy y protección por método/ruta |
| backend/src/server.js | Conectar endpoints; devuelve 501 mientras esté pendiente |
| backend/src/config.js | Nombre, zona horaria y reglas del negocio |
| backend/src/reservations.js | Núcleo proporcionado: validación y SQL |
| backend/src/chat.js | Núcleo proporcionado: Gemini, propuesta y confirmación |
| backend/src/debug.js | Trazas y ocultación de claves |
| frontend/js/api.js | Auxiliar fetch pendiente |
| frontend/js/app.js | Formulario público y chat |
| frontend/gestion/gestion.js | Listar, editar y cancelar |
| database/init.sql | Tabla, restricciones y datos ficticios |
| scripts/ | Copia y restauración proporcionadas |
| aparador/, mkdocs.yml, .github/workflows/pages.yml | Escaparate comercial |

Buscar `TODO F3`, `TODO F4`, etc. Si usáis rg: `rg 'TODO F4' backend frontend`.

## 4. Itinerario por fites

| Fita | Sesiones | Horas | Trabajo y criterio de salida |
|---|---|---:|---|
| F1 | 1-2 | 6 | Propuesta, reglas, esquema y reparto. Explicar un caso válido y uno inválido. |
| F2 | 3-6 | 12 | Git, rama integrada, MkDocs y Pages. Cada miembro aporta cambios. |
| F3 | 7-12 | 18 | Compose, redes, Nginx, Basic, BD y persistencia. Probar salud y acceso restringido. |
| F4 | 13-19 | 21 | API, formulario, gestión y diseño. Circuito crear-repetir-modificar-cancelar. |
| F5 | 20-23 | 12 | Chat, prompt, aclaraciones y confirmación. Verificar fila solo después del “sí”. |
| F6 | 24-28 | 15 | Segunda máquina, copias cada 5 min y restauración de diez reservas. |
| F7 | 29-31 | 9 | Pruebas cruzadas, concurrencia, móvil e incidencia. Corregir y repetir. |
| F8 | 32-33 | 6 | Guía, ZIP de la versión y defensa individual. |
| Total | 33 | 99 | Incluye explicación, práctica, diagnóstico y evidencias. |

### F1: decidir antes de configurar

Una única mesa; una reserva activa por franja. Pedir nombre, fecha, hora y comensales.
El ejemplo cierra los lunes y usa tramos de 30 minutos. `end` significa última hora de inicio:
una franja 15:30 termina a las 16:00. Elegid una duración realista y ajustad las reglas.
Si aumentáis la capacidad, revisad también el CHECK SQL. No añadir cuentas, pagos ni email.

### F2: repositorio y escaparate

Instalar dependencias de documentación en un entorno virtual, completar Markdown y mkdocs.yml,
probar `mkdocs serve` y completar el paso bloqueado de Actions. Configurar Pages para GitHub Actions.
El escaparate no ejecuta Express. Documentar commit de cada miembro y una rama integrada.

### F3: conectar y proteger

1. Completar variables MariaDB y backend desde .env; no escribir contraseñas en YAML.
2. Añadir volumen de datos y SQL inicial. El SQL se ejecuta solo con el volumen vacío.
3. Añadir healthchecks y dependencias; explicar diferencia entre arrancado y saludable.
4. Completar proxy y cabeceras de Nginx. API pública y privada comparten origen con la web.
5. Crear fichero htpasswd y montarlo. Configurar autenticación en gestión, operaciones privadas
   de API y phpMyAdmin. No añadir usuarios, sesiones ni JWT en Express.
6. Comprobar sin credenciales: GET /api/reserves, PUT y DELETE deben quedar bloqueados,
   incluso sin visitar /gestion/. POST /api/reserves seguirá público.
7. Inspeccionar datos iniciales y demostrar persistencia recreando contenedores sin borrar volúmenes.

La doble red del backend ya está corregida: privada para BD y publica para salir a Gemini.
`internal: true` sin otra red impide llamar a Gemini. `networks` no va dentro de `healthcheck`.
Solo Nginx publica puerto. Guardad la plantilla sin protección en entorno de prácticas hasta completar F3.

### F4: circuito convencional

Seguir docs/API.md. Conectar funciones suministradas, sin reescribir SQL. Crear api.js, conectar
formulario, tabla y edición. Usar textContent para datos del usuario; comprobar response.ok.
Consultar /api/config para evitar horarios distintos entre navegador y servidor.
El índice UNIQUE decide si una franja sigue libre al escribir, aunque dos clientes la vieran libre.

### F5: IA

Añadir clave solo al .env y conectar la ruta al helper `chat`. Modelo de referencia:
`gemini-flash-lite-latest`. Timeout de 15 s y un intento total ya configurados.
Cada petición imprime un id, pasos, tiempos y error del proveedor. 503 puede significar saturación;
429, cuota. Recargar la página no cancela necesariamente una llamada en curso en Node.
No publicar claves. Las trazas sí incluyen mensajes: usar datos ficticios.

El helper solo permite consultar disponibilidad y preparar reservas. La propuesta no escribe.
Solo un “sí/confirmo” posterior ejecuta el INSERT. La BD puede rechazarlo si otro cliente se adelantó.
No añadir a las herramientas funciones de gestión privada. No confundir un texto de la IA con prueba
de reserva: comprobar el id y la fila. El historial vive en memoria 30 minutos y se pierde al reiniciar;
las reservas confirmadas persisten en MariaDB. Este ejemplo se despliega con un solo backend.

Probar fallos con clave vacía, sesión nueva y backend recreado. El formulario debe seguir funcionando.
El alias del modelo puede cambiar en Google: si deja de estar disponible, registrar el cambio de .env.

### F6: copias y segunda máquina

Completar servicio backup usando la misma imagen de MariaDB. El script hace una copia inmediata
y luego cada 300 segundos; un .sql final implica dump correcto. No hay retención automática:
controlar espacio y guardar una copia fuera de la VM. No subir backups a Git.

Una vez configurado el servicio y con diez reservas ficticias guardadas:

```bash
docker compose logs -f backup
```

Registrar dos ejecuciones correctas. Elegir copia anterior al borrado y detener copias y escrituras:

```bash
docker compose stop backup backend
```

Nginx/phpMyAdmin siguen disponibles. Borrar SOLO las filas de prueba indicadas por el profesor desde
phpMyAdmin, registrar el resultado y no realizar otras escrituras durante la restauración.

```bash
docker compose run --rm --no-deps backup sh /scripts/restore.sh /backups/NOMBRE_REAL.sql
docker compose start backend
```

Verificar diez filas y crear una reserva nueva antes de reactivar copias:

```bash
docker compose start backup
```

Restaurar recupera el instante de la copia, perdiendo cambios posteriores. El dump incluye DROP/CREATE
para recuperar las tablas exportadas; no inventar evidencias ni ejecutar sobre datos reales.
En la segunda máquina, repetir instalación, .env, permisos, arranque y prueba desde otro equipo.
Configurar PMA_ABSOLUTE_URI con la dirección y puerto reales. Solo HTTP y SSH donde proceda.

### F7/F8: comprobar y explicar

Completar PRUEBAS.md con entradas, obtenido, evidencia, autor y estado. La salida esperada no prueba
que se haya ejecutado. Cada persona debe seguir una petición navegador-Nginx-Express-MariaDB y explicar
un error. Entregar guía técnica, escaparate, versión identificada y ZIP de esa misma versión sin secretos.

## 5. Pruebas del núcleo proporcionado

Con Node instalado: `cd backend`, `npm ci` y `npm test`. Estas pruebas no necesitan MariaDB y
verifican únicamente validación. Las operaciones SQL, proxy, permisos, copias y Gemini real se
deben comprobar con el sistema integrado. Si cambiáis reglas, revisad las expectativas del test.

## 6. Uso de IA y reparto

Podéis pedir explicación y ayuda por TODO, indicando archivo, contrato y prueba esperada. Revisad
cada cambio y probadlo antes de seguir. No pidáis que sustituya la autenticación de Nginx por otro sistema.
Alternad implementación y comprobación; cada miembro debe realizar una tarea de servidor y otra de cliente.
Registrad tres ayudas significativas en docs/USO_IA.md. Una app generada que no podéis explicar no completa F8.
