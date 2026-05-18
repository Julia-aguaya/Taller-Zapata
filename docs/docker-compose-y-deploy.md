# Docker Compose y deploy en DigitalOcean

## 1. Stack definido

- Frontend React/Vite en `localhost:5173` para desarrollo.
- Backend Spring Boot en `localhost:8080`.
- MySQL 8.4 en `localhost:3307` por defecto para evitar choques con una instalacion local existente.
- En produccion, el frontend se sirve con Caddy y hace reverse proxy al backend.

## 2. Levantar todo en local/dev

### Requisitos

- Docker Desktop
- Docker Compose v2

### Comando

```bash
docker compose up --build
```

### URLs utiles

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`
- MySQL: `localhost:3307`

### Como funciona

- `db` levanta MySQL con base `taller_zapata`.
- `backend` corre `mvn spring-boot:run` con perfil `local` usando el Maven ya incluido en la imagen.
- `frontend` corre Vite en modo desarrollo.
- Vite hace proxy de `/api`, `/swagger-ui`, `/v3/api-docs` y `/actuator` hacia `backend:8080`.
- Si queres usar otro puerto host para MySQL, defini `MYSQL_HOST_PORT` antes de levantar el stack.

### Parar y borrar contenedores

```bash
docker compose down
```

### Parar y borrar tambien los volumenes

```bash
docker compose down -v
```

### Cambiar el puerto host de MySQL

Si `3307` tambien estuviera ocupado, podes elegir otro puerto:

```bash
MYSQL_HOST_PORT=3310 docker compose up --build
```

En PowerShell:

```powershell
$env:MYSQL_HOST_PORT = "3310"
docker compose up --build
```

## 3. Deploy recomendado en DigitalOcean

### Recomendacion

Para produccion simple y mantenible te conviene:

- 1 Droplet Ubuntu
- 1 base MySQL administrada de DigitalOcean
- Docker + Docker Compose en la Droplet
- dominio apuntando a la IP publica
- Caddy dentro del contenedor para TLS automatico

Y te digo POR QUE: meter MySQL en el mismo `compose` de produccion es rapido, pero es peor arquitectura. Si la VM muere o el disco se complica, te llevas puesta la app Y la data. Para local sirve. Para produccion, no.

## 4. Archivos para produccion

- `docker-compose.do.yml`
- `Dockerfile.frontend`
- `backend/Dockerfile`
- `Caddyfile`
- `.env.do.example`

## 5. Pasos de deploy en DigitalOcean

### 5.1 Crear infraestructura

1. Crear una Droplet Ubuntu 24.04.
2. Crear una base MySQL administrada.
3. Crear un dominio o subdominio, por ejemplo `app.tu-dominio.com`.
4. Apuntar el DNS A/AAAA a la IP de la Droplet.

### 5.2 Instalar Docker en la Droplet

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
```

### 5.3 Copiar el proyecto al servidor

Opciones razonables:

- clonar con `git clone`
- subir con `scp`
- usar CI/CD despues

### 5.4 Preparar variables de entorno

```bash
cp .env.do.example .env.do
```

Completar en `.env.do`:

- `APP_DOMAIN`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

### 5.5 Levantar produccion

```bash
docker compose --env-file .env.do -f docker-compose.do.yml up -d --build
```

### 5.6 Verificar

```bash
docker compose --env-file .env.do -f docker-compose.do.yml ps
docker compose --env-file .env.do -f docker-compose.do.yml logs -f
```

URLs esperadas:

- App: `https://app.tu-dominio.com`
- Swagger: `https://app.tu-dominio.com/swagger-ui.html`
- Health: `https://app.tu-dominio.com/actuator/health`

## 6. Actualizar una nueva version

```bash
git pull
docker compose --env-file .env.do -f docker-compose.do.yml up -d --build
```

## 7. Persistencia

- En local, MySQL persiste en el volumen `mysql_data`.
- En produccion, los documentos persisten en `backend_storage`.
- La base de datos de produccion deberia vivir fuera del `compose`, idealmente en DigitalOcean Managed MySQL.

## 8. Tradeoffs importantes

### Opcion A: Droplet + Docker Compose + Managed MySQL

- Pros: simple, barato, control total, buen fit para tu proyecto actual.
- Contras: despliegue manual, observabilidad limitada si no agregas tooling.

### Opcion B: Droplet + Docker Compose + MySQL dentro del compose

- Pros: mas rapido de arrancar.
- Contras: peor resiliencia, backups mas delicados, mas riesgo operativo.

### Opcion C: DigitalOcean App Platform

- Pros: menos ops.
- Contras: te aleja de `docker compose`, puede requerir adaptar redes, healthchecks y storage.

## 9. Cosas a vigilar antes de salir a produccion

- Cambiar `APP_SECURITY_JWT_SECRET` por un secret real.
- Confirmar backups del storage de documentos.
- Confirmar backups y failover de MySQL.
- Revisar monitoreo basico de `actuator/health`.
- Evaluar mover documentos a object storage mas adelante.

## 10. Comandos utiles

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose restart backend
docker compose restart frontend
docker compose down
```
