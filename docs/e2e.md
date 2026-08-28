# Entorno E2E aislado

Este entorno levanta `front2`, backend y MySQL en recursos Docker exclusivos. No reutiliza los puertos, la base, los volúmenes ni las credenciales de desarrollo o producción.

## Requisitos

- Docker Desktop con Docker Compose v2.
- Dependencias de Playwright instaladas en la raíz del repositorio y el navegador Chromium disponible.

## Uso

Desde PowerShell, recreá el stack y aplicá la semilla:

```powershell
.\scripts\e2e\reset.ps1
```

El script elimina únicamente el proyecto Compose `taller-zapata-e2e` y sus volúmenes; luego espera `/actuator/health` del backend, aplica Flyway al iniciar el backend y carga la semilla.

Servicios disponibles:

- front2: `http://localhost:5181`
- backend: `http://localhost:8082`
- base de datos: accesible sólo dentro de Docker como `db:3306`

Para reaplicar la semilla sin reiniciar el stack:

```powershell
.\scripts\e2e\seed.ps1
```

Para ejecutar la suite real contra ese stack:

```powershell
npx playwright test --config playwright.e2e.config.js
```

La configuración no inicia servidores ni usa `page.route`: apunta a `front2` en el puerto E2E y deja que Vite proxyee `/api` al backend del mismo stack. La configuración y suite mock histórica permanecen en `playwright.config.js` y `e2e/`, respectivamente.

## Casos CLEAS

`scripts/e2e/seed.sql` reserva el rango de IDs `9501` a `9504` y carga estos expedientes:

| Carpeta | Alcance | Dictamen |
| --- | --- | --- |
| `E2E-DT-AF` | `DANIO_TOTAL` | `A_FAVOR` |
| `E2E-DT-EC` | `DANIO_TOTAL` | `EN_CONTRA` |
| `E2E-FR-AF` | `FRANQUICIA` | `A_FAVOR` |
| `E2E-FR-EC` | `FRANQUICIA` | `EN_CONTRA` |

La semilla usa los códigos introducidos por las migraciones vigentes V80 y deja que Flyway aplique todo el historial. No modifica migraciones ni lógica de negocio.

## Limpieza

```powershell
docker compose -f docker-compose.e2e.yml down --volumes --remove-orphans
```
