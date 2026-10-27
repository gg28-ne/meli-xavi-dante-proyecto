# ReservaFàcil — versión alumno

Esqueleto de trabajo para 2.º de SMX, parejas, 99 horas. **No es la aplicación terminada.**

Empieza por [README_ALUMNO.md](README_ALUMNO.md). Consulta el contrato en
[docs/API.md](docs/API.md) y anota pruebas y evidencias en [docs/PRUEBAS.md](docs/PRUEBAS.md).

El núcleo proporcionado resuelve acceso parametrizado a MariaDB, validación, exclusión de
reservas duplicadas, conector Gemini y confirmación. La infraestructura, las rutas y la interfaz
contienen TODO que debéis completar. No hay una solución docente escondida en el paquete.

Con Docker y Compose v2 instalados, el único arranque previsto inicialmente es:

```bash
cp .env.example .env
docker compose up -d --build nginx
```

Abre http://localhost:8085. Verás la maqueta. La API del proxy devuelve 501 hasta F3;
las rutas Express, hasta F4/F5. No rellenar los TODO todavía NO es un error del servidor.

TODO F8: convertir este README en la guía técnica final de vuestra versión.
