# Backend - Setup rapido (IntelliJ + Postman)

## Requisitos

- Java 21 (OK en este entorno)
- No requiere Docker para tests (perfil `test` usa H2 en memoria)

## Abrir en IntelliJ IDEA

1. Open -> seleccionar `backend/pom.xml`.
2. En Maven settings usar "Maven Wrapper".
3. SDK del proyecto: Java 21.
4. Esperar importacion de dependencias.

## Comandos utiles (Windows)

- Ejecutar tests:

```bat
mvnw.cmd test
```

- Levantar app local:

```bat
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

## Comandos utiles (bash)

```bash
./mvnw test
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

## Probar con Postman

- Base URL local: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `GET http://localhost:8080/actuator/health`

### Seguridad actual (temporal)

La API usa JWT access token + refresh token para endpoints protegidos.

Header requerido:

- `Authorization: Bearer <access_token>`

Solo en perfil `test` se mantiene compatibilidad con:

- `X-User-Id: <id_usuario>`

IDs de seed usados en tests:

- `1`: admin base
- `3`: usuario con alcance de sucursal
