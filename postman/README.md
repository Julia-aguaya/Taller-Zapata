# Postman quickstart

## Archivos incluidos

- `Taller-Zapata-Backend.postman_collection.json`
- `Taller-Zapata-Local.postman_environment.json`

## Importar en Postman

1. Abrir Postman.
2. Click en `Import`.
3. Arrastrar ambos archivos JSON de esta carpeta.
4. Seleccionar environment `Taller Zapata Local`.

## Flujo recomendado de prueba

1. Ejecutar `Auth > POST Login`.
   - El script de test guarda `accessToken` y `refreshToken` en el environment.
2. Ejecutar `Auth > GET Me` para validar JWT.
3. Ejecutar `Identity Admin > GET Permissions`.
4. Ejecutar `Identity Admin > PUT User Roles` y luego `GET User Roles`.
5. Ejecutar `Cases > GET Cases (paged+filters)`.

## Exportar

Si modificás requests/variables en Postman:

1. Collection -> `...` -> `Export` -> `Collection v2.1`.
2. Environment -> `...` -> `Export`.
3. Guardar los archivos exportados en esta carpeta para versionarlos en Git.
