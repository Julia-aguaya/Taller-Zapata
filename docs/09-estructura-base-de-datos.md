# Estructura base de datos

## Objetivo y criterios del modelo

Este documento propone una estructura relacional MySQL integral para `tallerDemo`, pensada como base de diseno del producto completo y no solo del MVP. El objetivo es soportar el nucleo operativo del taller, los distintos tramites, la trazabilidad de estados, la operacion documental, la administracion de usuarios/permisos y un log de auditoria persistente.

Este es el documento principal y vigente del modelo de base de datos. `docs/09-bbdd.md` queda solo como referencia minima para redirigir aca y evitar duplicacion o deriva documental.

Criterios principales del modelo:

- `casos` es el agregado raiz del negocio y concentra la referencia operativa principal.
- los datos comunes van en tablas base; los datos especificos por tramite viven en tablas de extension.
- `usuarios` y `personas` se separan porque resuelven problemas distintos: autenticacion/autorizacion vs identidad de negocio.
- `personas` es una entidad unificada; los roles de cliente, titular, lesionado, abogado, conductor o contacto se expresan por relacion con el caso.
- el documento principal de identificacion vive en `personas`; no se modela `persona_documentos` en esta etapa.
- la relacion entre personas y vehiculos/casos evita porcentajes de copropiedad; solo interesa titular y quien trae el vehiculo.
- turnos, ingresos y egresos se modelan como eventos operativos distintos para soportar trazabilidad real y reingresos.
- las tareas deben poder existir de forma independiente o vinculadas a un caso, y con o sin asignacion.
- permisos y visibilidad se resuelven con RBAC scopeado por rol, organizacion y sucursal.
- toda accion relevante debe dejar evidencia visible y persistente en auditoria.

Como antecedente util, este diseno consolida y corrige ideas que ya aparecen en `docs/08-schema-inicial-base-de-datos.md` y en versiones previas resumidas del diccionario de datos.

## Estado de consolidacion documental

- la fuente principal de modelado es `docs/09-estructura-base-de-datos.md`.
- `docs/09-bbdd.md` ya no define estructura propia: solo apunta a este documento para evitar contradicciones.
- el DER textual derivado del modelo consolidado vive en `docs/10-der-base-de-datos.md`.

## Como leer este modelo

- `usuarios` y `personas` NO son lo mismo: `usuarios` resuelve acceso al sistema, login, roles y trazabilidad de acciones; `personas` resuelve identidades de negocio como clientes, titulares, abogados, inspectores o contactos.
- `casos` es la carpeta raiz. Casi todo cuelga de ahi de forma directa o indirecta porque el sistema trabaja sobre expedientes, no sobre tablas aisladas.
- cuando una tabla termina en catalogo o configuracion, suele definir opciones reutilizables; cuando termina en historial, log o relaciones, suele registrar contexto, trazabilidad o vinculos.
- en cada tabla, pensa los atributos en tres grupos: identificacion (`id`, `public_id`, `codigo`), contexto de negocio (por ejemplo `caso_id`, `persona_id`, `estado_codigo`) y datos propios del proceso.
- los campos de auditoria tecnica como `created_at`, `updated_at`, `activo` o `archived_at` se asumen como convencion transversal, salvo cuando tienen impacto funcional puntual.

## Decisiones de diseno adoptadas

1. `casos` es la raiz del modelo y cada tramite especial se resuelve con tablas de extension `1 a 1`.
2. `usuarios` queda separado de `personas`.
3. `personas` no se divide por tipo funcional; una misma persona puede asumir multiples roles por caso mediante `caso_personas`.
4. el documento principal se guarda directamente en `personas`.
5. se elimina cualquier logica de porcentajes/copropiedad; solo se modelan roles operativos relevantes.
6. `turnos_reparacion`, `ingresos_vehiculo` y `egresos_vehiculo` son tablas distintas.
7. `tareas` admite `caso_id` nullable y `usuario_asignado_id` nullable, con indices para consulta por asignado.
8. los permisos se asignan a roles y los roles se otorgan a usuarios con scope.
9. `auditoria_eventos` es el log central, persistente y visible.
10. el modelo contempla dominios completos: operacion, finanzas, documentos, workflow, administracion e integraciones.

## Dominios o modulos del sistema

- nucleo organizacional y catalogos
- personas, usuarios y seguridad
- vehiculos
- casos y relaciones del caso
- workflow y estados
- turnos y operacion de reparacion
- presupuesto y repuestos
- finanzas
- documentos
- tramites especializados
- administracion e integraciones
- auditoria y trazabilidad

## Tablas principales por dominio

### Nucleo

#### `organizaciones`

**Lectura orientativa**

- representa: la empresa o razon operadora del sistema; deja preparada la base para multiempresa aunque hoy exista un unico taller.
- relaciones: es el nivel superior para `sucursales`, para asignaciones de `usuario_roles` y para la pertenencia administrativa de `casos`.
- atributos clave: `public_id` identifica de forma segura hacia afuera, `codigo` sirve para referencia interna, `nombre` y `razon_social` separan lo comercial de lo legal, `cuit` y `condicion_iva` ordenan lo fiscal, `activo` permite baja logica.


- proposito: empresa o taller operador.
- columnas principales: `id`, `public_id`, `codigo`, `nombre`, `razon_social`, `cuit`, `condicion_iva`, `telefono`, `email`, `activo`, `created_at`, `updated_at`.
- claves: PK `id`; unique `public_id`, `codigo`, `cuit`.
- relaciones: `1 a N` con `sucursales`, `usuario_roles`, `casos`.
- notas: si hoy existe un solo taller, igual conviene dejar esta capa porque ordena tenancy y permisos.

#### `sucursales`

**Lectura orientativa**

- representa: cada sede fisica u operativa desde la que el taller trabaja casos, agenda y atencion.
- relaciones: depende de `organizaciones` y le da alcance concreto a `casos` y `usuario_roles`; una misma organizacion puede tener varias sucursales.
- atributos clave: `organizacion_id` marca a que empresa pertenece, `codigo` y `nombre` identifican la sede, `direccion_linea1`, `ciudad` y `provincia` ubican fisicamente, `telefono` y `email` concentran contacto, `activo` controla disponibilidad.


- proposito: unidad operativa fisica.
- columnas principales: `id`, `public_id`, `organizacion_id`, `codigo`, `nombre`, `direccion_linea1`, `ciudad`, `provincia`, `telefono`, `email`, `activo`.
- claves: PK `id`; FK `organizacion_id`; unique (`organizacion_id`, `codigo`).
- relaciones: `N a 1` con `organizaciones`; `1 a N` con `casos`, `usuario_roles`.
- notas: la sucursal define alcance operativo y visibilidad.

#### `tipos_tramite`

**Lectura orientativa**

- representa: el catalogo de variantes de negocio que el sistema soporta, como particular, todo riesgo, CLEAS o terceros.
- relaciones: condiciona la creacion de `casos` y tambien la parametrizacion de `workflow_transiciones` y categorias documentales.
- atributos clave: `codigo` identifica el tramite de forma estable, `nombre` lo muestra en interfaz, `prefijo_carpeta` ayuda a construir nomenclaturas, `orden_visual` ordena opciones, `requiere_tramitacion` y `requiere_abogado` adelantan reglas de negocio, `activo` habilita o no su uso.


- proposito: catalogo de tramites soportados por el sistema.
- columnas principales: `id`, `codigo`, `nombre`, `prefijo_carpeta`, `orden_visual`, `requiere_tramitacion`, `requiere_abogado`, `activo`.
- claves: PK `id`; unique `codigo`.
- relaciones: `1 a N` con `casos`; `1 a N` con `workflow_transiciones`.
- notas: permite distinguir particular, todo riesgo, granizo, CLEAS, terceros, recupero, etc.

#### `parametros_sistema`

**Lectura orientativa**

- representa: una tabla de configuracion flexible para defaults, banderas y reglas que no conviene hardcodear.
- relaciones: no apunta a un unico modulo; su alcance depende de `scope_tipo` y `scope_id`, por eso puede afectar organizacion, sucursal o configuraciones globales.
- atributos clave: `scope_tipo` indica a que nivel aplica el parametro, `scope_id` identifica la entidad concreta, `clave` nombra la configuracion, `valor_json` guarda el contenido parametrizable, `updated_at` ayuda a saber la ultima vigencia conocida.


- proposito: configuracion parametrizable por scope.
- columnas principales: `id`, `scope_tipo`, `scope_id`, `clave`, `valor_json`, `updated_at`.
- claves: unique (`scope_tipo`, `scope_id`, `clave`).
- relaciones: logicas con cualquier entidad scopiable.
- notas: sirve para defaults, reglas de negocio configurables y banderas operativas.

### Personas y usuarios

#### `personas`

**Lectura orientativa**

- representa: la identidad de negocio unificada del sistema. Aca vive la persona fisica o juridica como sujeto del expediente, no como cuenta de acceso.
- relaciones: desde `personas` se conectan roles dentro de `caso_personas`, domicilios, contactos, vinculos con vehiculos y contrapartes financieras; una misma persona puede participar en muchos casos con roles distintos.
- atributos clave: `tipo_persona` distingue fisica o juridica, `nombre`/`apellido` o `razon_social` arman la identidad base, `nombre_mostrar` resuelve presentacion consistente, `tipo_documento_codigo` y `numero_documento` guardan el documento principal, `numero_documento_normalizado` mejora busqueda y unicidad, `cuit_cuil` sirve para validaciones fiscales, `telefono_principal` y `email_principal` concentran contacto, `activo` evita borrar historial.


- proposito: identidad de negocio reutilizable para personas fisicas o juridicas.
- columnas principales: `id`, `public_id`, `tipo_persona`, `nombre`, `apellido`, `razon_social`, `nombre_mostrar`, `tipo_documento_codigo`, `numero_documento`, `numero_documento_normalizado`, `cuit_cuil`, `fecha_nacimiento`, `telefono_principal`, `email_principal`, `ocupacion`, `observaciones`, `activo`, `created_at`, `updated_at`.
- claves: PK `id`; recommended unique parcial/logica para (`tipo_documento_codigo`, `numero_documento_normalizado`) cuando exista.
- relaciones: `1 a N` con `caso_personas`, `persona_contactos`, `persona_domicilios`, `vehiculo_personas`, `movimientos_financieros`, `companias_contactos`.
- notas: aca vive el documento principal. No se crea `persona_documentos` por ahora.

#### `persona_contactos`

**Lectura orientativa**

- representa: los medios de contacto adicionales o especializados de una persona.
- relaciones: cuelga de `personas` para no ensanchar la tabla principal y permitir multiples telefonos, emails o canales.
- atributos clave: `persona_id` indica de quien es el contacto, `tipo_contacto_codigo` clasifica si es telefono, email o WhatsApp, `valor` guarda el dato concreto, `principal` marca el medio preferido, `validado` refleja confianza operativa, `observaciones` agrega contexto.


- proposito: multiples medios de contacto por persona.
- columnas principales: `id`, `persona_id`, `tipo_contacto_codigo`, `valor`, `principal`, `validado`, `observaciones`.
- claves: PK `id`; FK `persona_id`.
- relaciones: `N a 1` con `personas`.
- notas: permite telefonos alternativos, email secundario y WhatsApp sin inflar `personas`.

#### `persona_domicilios`

**Lectura orientativa**

- representa: los domicilios asociados a una persona para contacto, documentacion o frente legal.
- relaciones: depende de `personas` y permite varios domicilios segun uso sin mezclar todo en una sola columna.
- atributos clave: `persona_id` define la pertenencia, `tipo_domicilio_codigo` dice si es fiscal, real u otro, `calle`/`numero`/`piso`/`depto` describen ubicacion, `localidad`, `provincia` y `codigo_postal` completan la referencia geografica, `principal` marca el domicilio prioritario.


- proposito: domicilios asociados a persona.
- columnas principales: `id`, `persona_id`, `tipo_domicilio_codigo`, `calle`, `numero`, `piso`, `depto`, `localidad`, `provincia`, `codigo_postal`, `pais_codigo`, `principal`.
- claves: PK `id`; FK `persona_id`.
- relaciones: `N a 1` con `personas`.
- notas: util para documentacion, reclamos y contacto legal.

#### `usuarios`

**Lectura orientativa**

- representa: la cuenta autenticable que puede entrar al sistema y ejecutar acciones. Esta tabla NO reemplaza a `personas`; resuelve seguridad, acceso y trazabilidad del actor interno o externo autenticado.
- relaciones: se conecta con `usuario_roles` para permisos, con `tareas` para asignaciones, con `caso_estado_historial`, `documentos`, `turnos_reparacion` y `auditoria_eventos` para saber quien hizo cada accion.
- atributos clave: `username` y `email` son credenciales de acceso, `password_hash` guarda la clave de forma segura, `nombre` y `apellido` muestran al usuario en interfaz, `telefono` sirve para contacto operativo, `ultimo_acceso_at` ayuda a control y soporte, `activo` permite bloquear acceso sin perder trazabilidad.


- proposito: identidad autenticable del sistema.
- columnas principales: `id`, `public_id`, `username`, `email`, `password_hash`, `nombre`, `apellido`, `telefono`, `ultimo_acceso_at`, `activo`, `created_at`, `updated_at`.
- claves: PK `id`; unique `email`, `username`.
- relaciones: `1 a N` con `usuario_roles`, `tareas`, `casos`, `caso_estado_historial`, `auditoria_eventos`, `documentos`, `turnos_reparacion`.
- notas: puede opcionalmente vincularse a una `persona` si mas adelante se quiere unificar agenda interna y externa, pero no es obligatorio en esta etapa.

#### `roles`

**Lectura orientativa**

- representa: perfiles funcionales reutilizables que agrupan capacidades, como recepcion, taller o administracion.
- relaciones: alimenta `rol_permisos` y luego se asigna a usuarios mediante `usuario_roles`; el rol define intencion funcional, no alcance por si solo.
- atributos clave: `codigo` es la clave estable del rol, `nombre` es la etiqueta visible, `descripcion` explica su alcance esperado, `system_role` distingue roles base del sistema de roles configurables, `activo` controla vigencia.


- proposito: rol funcional reusable.
- columnas principales: `id`, `codigo`, `nombre`, `descripcion`, `system_role`, `activo`.
- claves: PK `id`; unique `codigo`.
- relaciones: `1 a N` con `rol_permisos`, `usuario_roles`.
- notas: ejemplos: administrador, recepcion, taller, gestor, caja, abogado.

#### `permisos`

**Lectura orientativa**

- representa: la capacidad atomica sobre un recurso o accion concreta.
- relaciones: se asocia a `roles` via `rol_permisos`; el permiso es la unidad minima que despues se hereda al usuario por rol y scope.
- atributos clave: `codigo` identifica la accion en forma estable, `nombre` resume el permiso, `modulo` agrupa por area funcional, `descripcion` aclara que habilita o restringe realmente.


- proposito: permiso atomico por accion o capacidad.
- columnas principales: `id`, `codigo`, `nombre`, `modulo`, `descripcion`.
- claves: PK `id`; unique `codigo`.
- relaciones: `1 a N` con `rol_permisos`.
- notas: conviene modelarlos por verbo + recurso (`caso.ver`, `caso.cerrar`, `turno.crear`, `auditoria.ver`).

#### `rol_permisos`

**Lectura orientativa**

- representa: la matriz RBAC entre un rol y cada permiso posible.
- relaciones: une `roles` con `permisos` y permite saber que puede hacer cada perfil antes de aplicar el scope de `usuario_roles`.
- atributos clave: `rol_id` apunta al perfil funcional, `permiso_id` apunta a la capacidad concreta, `allow` expresa si la combinacion queda habilitada dentro del modelo adoptado.


- proposito: matriz RBAC entre roles y permisos.
- columnas principales: `id`, `rol_id`, `permiso_id`, `allow`.
- claves: PK `id`; unique (`rol_id`, `permiso_id`).
- relaciones: `N a 1` con `roles` y `permisos`.
- notas: puede arrancar sin denegaciones explicitas, pero el modelo admite evolucion.

#### `usuario_roles`

**Lectura orientativa**

- representa: la asignacion real de un rol a un usuario dentro de cierto alcance. Esta tabla es la que vuelve practico el esquema de seguridad.
- relaciones: une `usuarios`, `roles`, `organizaciones` y opcionalmente `sucursales`; asi un mismo usuario puede ser administrador global y, al mismo tiempo, operador limitado en otra sede.
- atributos clave: `usuario_id` identifica al actor, `rol_id` define el perfil otorgado, `organizacion_id` y `sucursal_id` limitan visibilidad y accion, `vigente_desde` y `vigente_hasta` permiten historial o asignaciones temporales, `activo` indica si la asignacion sigue corriendo.


- proposito: asignacion de rol a un usuario con alcance.
- columnas principales: `id`, `usuario_id`, `rol_id`, `organizacion_id`, `sucursal_id`, `vigente_desde`, `vigente_hasta`, `activo`.
- claves: PK `id`; FKs a `usuarios`, `roles`, `organizaciones`, `sucursales`.
- relaciones: `N a 1` con sus tablas padre.
- notas: esta tabla resuelve permisos scopeados por rol. Un usuario puede tener mas de un rol y distinto alcance.

### Vehiculos

#### `marcas_vehiculo`

**Lectura orientativa**

- representa: el catalogo base de marcas normalizadas.
- relaciones: alimenta `modelos_vehiculo` y puede asociarse directo a `vehiculos` cuando la marca esta bien consolidada.
- atributos clave: `codigo` da una referencia estable, `nombre` muestra la marca al usuario, `activo` permite depurar catalogo sin romper historico.


- proposito: catalogo de marcas.
- columnas principales: `id`, `codigo`, `nombre`, `activo`.
- claves: PK `id`; unique `codigo`.
- relaciones: `1 a N` con `modelos_vehiculo`, `vehiculos`.
- notas: puede convivir con texto libre mientras se consolida catalogo.

#### `modelos_vehiculo`

**Lectura orientativa**

- representa: el catalogo de modelos asociados a una marca.
- relaciones: depende de `marcas_vehiculo` y luego se usa desde `vehiculos`; sirve para normalizar, aunque el modelo de vehiculo puede conservar texto libre de respaldo.
- atributos clave: `marca_id` fija la marca madre, `codigo` evita ambiguedades internas, `nombre` describe el modelo comercial, `activo` controla vigencia del catalogo.


- proposito: catalogo de modelos por marca.
- columnas principales: `id`, `marca_id`, `codigo`, `nombre`, `activo`.
- claves: PK `id`; unique (`marca_id`, `codigo`).
- relaciones: `N a 1` con `marcas_vehiculo`; `1 a N` con `vehiculos`.
- notas: conviene permitir override textual en `vehiculos` para casos no normalizados.

#### `vehiculos`

**Lectura orientativa**

- representa: el automotor como entidad reutilizable del negocio, independientemente de cuantos casos atraviese.
- relaciones: se vincula con `caso_vehiculos`, `vehiculo_personas` e `ingresos_vehiculo`; asi se separa la identidad permanente del vehiculo de su uso puntual en un expediente.
- atributos clave: `marca_id`/`modelo_id` apuntan al catalogo cuando existe, `marca_texto`/`modelo_texto` cubren casos no normalizados, `dominio` y `dominio_normalizado` identifican patente y su version comparable, `anio`, `tipo_vehiculo_codigo` y `uso_codigo` describen caracteristicas de negocio, `chasis` y `motor` fortalecen trazabilidad, `kilometraje` aporta estado operativo, `activo` evita eliminacion fisica.


- proposito: automotor reutilizable del dominio.
- columnas principales: `id`, `public_id`, `marca_id`, `modelo_id`, `marca_texto`, `modelo_texto`, `dominio`, `dominio_normalizado`, `anio`, `tipo_vehiculo_codigo`, `uso_codigo`, `color`, `pintura_codigo`, `chasis`, `motor`, `transmision_codigo`, `kilometraje`, `observaciones`, `activo`, `created_at`, `updated_at`.
- claves: PK `id`; unique `dominio_normalizado` cuando exista.
- relaciones: `1 a N` con `caso_vehiculos`, `vehiculo_personas`, `ingresos_vehiculo`.
- notas: si el dominio no esta cargado aun, conviene permitir null temporal con validacion posterior.

#### `vehiculo_personas`

**Lectura orientativa**

- representa: el vinculo relativamente estable entre un vehiculo y una persona, como titular o asegurado.
- relaciones: une `vehiculos` con `personas` fuera del contexto puntual del caso; complementa a `caso_personas`, no la reemplaza.
- atributos clave: `vehiculo_id` y `persona_id` identifican el par relacionado, `rol_vehiculo_codigo` dice que papel cumple la persona respecto del vehiculo, `es_actual` marca vigencia, `desde` y `hasta` permiten historizar cambios, `notas` aclaran particularidades.


- proposito: relacion entre vehiculo y persona para roles permanentes del vehiculo.
- columnas principales: `id`, `vehiculo_id`, `persona_id`, `rol_vehiculo_codigo`, `es_actual`, `desde`, `hasta`, `notas`.
- claves: PK `id`; unique logica para evitar duplicar mismo rol vigente por persona.
- relaciones: `N a 1` con `vehiculos` y `personas`.
- notas: reemplaza la idea de copropiedad. Roles utiles: `titular`, `trae_vehiculo`, `asegurado`.

### Casos

#### `casos`

**Lectura orientativa**

- representa: la carpeta o expediente central sobre la que trabaja todo el sistema. Esta es la raiz real del modelo.
- relaciones: desde `casos` cuelgan personas, vehiculos, workflow, documentos, finanzas, turnos y extensiones por tramite; por eso concentra claves hacia catalogos y estados actuales cacheados.
- atributos clave: `codigo_carpeta` y `numero_orden` identifican operativamente el expediente, `tipo_tramite_id` define que extension puede necesitar, `organizacion_id` y `sucursal_id` ubican la carpeta, `vehiculo_principal_id` y `cliente_principal_persona_id` aceleran lectura del contexto base, `referenciado` y datos de referencia guardan origen comercial, `usuario_creador_id` preserva autoria, `estado_tramite_actual_id` y `estado_reparacion_actual_id` cachean estados vigentes, `prioridad_codigo` ordena urgencia, `fecha_cierre` y `archived_at` marcan fin o archivado.


- proposito: expediente o carpeta central del negocio.
- columnas principales: `id`, `public_id`, `codigo_carpeta`, `numero_orden`, `tipo_tramite_id`, `organizacion_id`, `sucursal_id`, `vehiculo_principal_id`, `cliente_principal_persona_id`, `referenciado`, `referido_por_persona_id`, `referido_por_texto`, `usuario_creador_id`, `estado_tramite_actual_id`, `estado_reparacion_actual_id`, `prioridad_codigo`, `fecha_cierre`, `observaciones_generales`, `archived_at`, `created_at`, `updated_at`.
- claves: PK `id`; unique `codigo_carpeta`; unique (`organizacion_id`, `numero_orden`).
- relaciones: `N a 1` con `tipos_tramite`, `organizaciones`, `sucursales`, `vehiculos`, `personas`, `usuarios`, `workflow_estados`; `1 a N` con casi todo el dominio operativo.
- notas: es la tabla madre. Debe guardar caches de estados actuales por performance, pero la verdad historica vive en el historial.

#### `caso_personas`

**Lectura orientativa**

- representa: la tabla que dice QUIEN es QUIEN dentro de un expediente. Aca se resuelven los roles contextuales del caso y por eso es una pieza central del modelo.
- relaciones: une `casos` con `personas` y, cuando hace falta, con `vehiculos` para contextualizar aun mas el rol. Es la razon por la que no hace falta dividir `personas` en clientes, titulares, abogados o lesionados.
- atributos clave: `caso_id` indica en que carpeta actua la persona, `persona_id` apunta a la identidad de negocio, `rol_caso_codigo` expresa si es cliente, titular, conductor, abogado, inspector u otro, `vehiculo_id` contextualiza roles ligados a un vehiculo puntual, `es_principal` destaca el actor principal dentro de ese rol, `notas` agrega aclaraciones operativas.


- proposito: vincular personas al caso segun rol.
- columnas principales: `id`, `caso_id`, `persona_id`, `rol_caso_codigo`, `vehiculo_id`, `es_principal`, `notas`, `created_at`.
- claves: PK `id`; unique recomendada (`caso_id`, `persona_id`, `rol_caso_codigo`, `vehiculo_id`) con `vehiculo_id` nullable tratado a nivel aplicacion.
- relaciones: `N a 1` con `casos`, `personas`, `vehiculos`.
- notas: aca se resuelve cliente, titular, conductor, lesionado, abogado, tramitador, inspector, contacto compania, quien trae el vehiculo, etc. Esta tabla es CLAVE.

#### `caso_vehiculos`

**Lectura orientativa**

- representa: la lista de vehiculos involucrados en una carpeta y el papel que juega cada uno.
- relaciones: conecta `casos` con `vehiculos`; permite distinguir vehiculo principal, tercero involucrado o unidad asociada a recupero sin ensuciar la tabla `casos`.
- atributos clave: `caso_id` define la carpeta, `vehiculo_id` identifica el automotor, `rol_vehiculo_codigo` dice como participa, `es_principal` resuelve cual es el vehiculo principal, `orden_visual` ayuda a presentacion consistente.


- proposito: relacionar uno o varios vehiculos con un caso.
- columnas principales: `id`, `caso_id`, `vehiculo_id`, `rol_vehiculo_codigo`, `es_principal`, `orden_visual`.
- claves: PK `id`; unique (`caso_id`, `vehiculo_id`, `rol_vehiculo_codigo`).
- relaciones: `N a 1` con `casos`, `vehiculos`.
- notas: permite modelar vehiculo del cliente, tercero involucrado o vehiculo asociado a recupero.

#### `caso_relaciones`

**Lectura orientativa**

- representa: los vinculos entre expedientes que se necesitan para seguir negocios conectados.
- relaciones: une un `caso_origen_id` con un `caso_destino_id` y agrega el tipo de la relacion; sirve para CLEAS, recuperos o carpetas derivadas.
- atributos clave: `caso_origen_id` marca desde donde nace la relacion, `caso_destino_id` indica el expediente asociado, `tipo_relacion_codigo` explica el motivo del vinculo, `descripcion` permite detalle humano.


- proposito: vinculo entre carpetas.
- columnas principales: `id`, `caso_origen_id`, `caso_destino_id`, `tipo_relacion_codigo`, `descripcion`.
- claves: PK `id`; unique (`caso_origen_id`, `caso_destino_id`, `tipo_relacion_codigo`).
- relaciones: doble `N a 1` con `casos`.
- notas: necesaria para CLEAS, recuperos, franquicias y seguimiento cruzado.

#### `caso_siniestro`

**Lectura orientativa**

- representa: el bloque comun de datos del hecho que origina el tramite.
- relaciones: es una extension `1 a 1` de `casos` para no repetir estos datos en cada subtipo de negocio.
- atributos clave: `caso_id` vincula el hecho con la carpeta, `fecha_siniestro` y `hora_siniestro` ubican el evento, `lugar` y `dinamica` describen que paso, `observaciones` agrega contexto, `fecha_prescripcion` ayuda a alertas legales, `dias_tramitando` puede funcionar como dato derivado o cache operativo.


- proposito: datos comunes del hecho generador del tramite.
- columnas principales: `id`, `caso_id`, `fecha_siniestro`, `hora_siniestro`, `lugar`, `dinamica`, `observaciones`, `fecha_prescripcion`, `dias_tramitando`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`.
- notas: conviene dejarla comun para no repetir en cada tramite.

### Workflow y estados

#### `workflow_estados`

**Lectura orientativa**

- representa: el catalogo maestro de estados posibles para cada dominio funcional.
- relaciones: alimenta `workflow_transiciones`, sirve como cache actual en `casos` y da semantica al `caso_estado_historial`. Sin esta tabla, cada modulo terminaria inventando estados sueltos.
- atributos clave: `codigo` identifica el estado de forma estable, `dominio` separa tramite, reparacion, pago u otros frentes, `nombre` y `descripcion` hacen legible el estado, `orden_visual` mejora UX y reportes, `terminal` indica si cierra el ciclo, `activo` permite retirar estados sin borrar historico.


- proposito: catalogo de estados por dominio.
- columnas principales: `id`, `codigo`, `dominio`, `nombre`, `descripcion`, `orden_visual`, `terminal`, `activo`.
- claves: PK `id`; unique (`dominio`, `codigo`).
- relaciones: `1 a N` con `workflow_transiciones`; `1 a N` con `casos` como estado cacheado; `1 a N` con `caso_estado_historial`.
- notas: dominios minimos: `tramite`, `reparacion`, `pago`, `documentacion`, `legal`.

#### `workflow_transiciones`

**Lectura orientativa**

- representa: la regla que autoriza pasar de un estado a otro. Esta tabla convierte el workflow en algo parametrizable y no hardcodeado.
- relaciones: une `workflow_estados` origen/destino y opcionalmente limita la regla por `tipos_tramite`; dialoga con permisos y con logica aplicativa al momento de ejecutar cambios.
- atributos clave: `dominio` dice sobre que frente opera la transicion, `tipo_tramite_id` permite reglas generales o especificas, `estado_origen_id` y `estado_destino_id` definen el salto, `accion_codigo` nombra la accion funcional, `requiere_permiso_codigo` fuerza control de autorizacion, `automatica` distingue cambios automaticos o manuales, `regla_json` expresa precondiciones, `active_from` y `active_to` manejan vigencia.


- proposito: definir la maquina de estados parametrizable.
- columnas principales: `id`, `dominio`, `tipo_tramite_id`, `estado_origen_id`, `estado_destino_id`, `accion_codigo`, `requiere_permiso_codigo`, `automatica`, `regla_json`, `active_from`, `active_to`, `activo`.
- claves: PK `id`.
- relaciones: `N a 1` con `tipos_tramite`, `workflow_estados` origen/destino.
- notas: `tipo_tramite_id` nullable permite transiciones globales. `regla_json` puede expresar precondiciones declarativas o referencia a reglas de aplicacion.

#### `caso_estado_historial`

**Lectura orientativa**

- representa: la cronologia real de estados que atraveso el caso. Aca vive la verdad historica del workflow.
- relaciones: une `casos`, `workflow_estados` y `usuarios`; trabaja junto con el cache de estados de `casos` y con `auditoria_eventos` para explicar cada cambio.
- atributos clave: `caso_id` identifica la carpeta, `dominio_estado` dice que frente cambio, `estado_id` marca el nuevo estado alcanzado, `fecha_estado` fija el momento del cambio, `usuario_id` identifica al actor humano cuando existe, `automatico` diferencia procesos del sistema, `motivo` resume la razon funcional, `detalle_json` guarda contexto ampliado.


- proposito: trazabilidad completa de cambios de estado del caso.
- columnas principales: `id`, `caso_id`, `dominio_estado`, `estado_id`, `fecha_estado`, `usuario_id`, `automatico`, `motivo`, `detalle_json`.
- claves: PK `id`.
- relaciones: `N a 1` con `casos`, `workflow_estados`, `usuarios`.
- notas: no se borra. De aca sale la auditoria funcional del caso.

### Turnos y operacion

#### `turnos_reparacion`

**Lectura orientativa**

- representa: la reserva operativa previa al ingreso real del vehiculo. Un turno organiza agenda; no certifica que el auto haya entrado.
- relaciones: depende de `casos`, puede ser creado o gestionado por `usuarios` y puede terminar vinculandose con uno o varios `ingresos_vehiculo` segun reprogramaciones o reingresos.
- atributos clave: `caso_id` enlaza el turno con la carpeta, `fecha_turno` y `hora_turno` reservan agenda, `dias_estimados` y `fecha_salida_estimada` anticipan plan operativo, `estado_codigo` refleja si esta pendiente, reprogramado o cancelado, `es_reingreso` distingue vueltas posteriores, `notas` agrega contexto, `usuario_id` deja trazado quien gestiono el turno.


- proposito: reserva operativa para ingreso del vehiculo al taller.
- columnas principales: `id`, `caso_id`, `fecha_turno`, `hora_turno`, `dias_estimados`, `fecha_salida_estimada`, `estado_codigo`, `es_reingreso`, `notas`, `usuario_id`, `created_at`, `updated_at`.
- claves: PK `id`; FK `caso_id`.
- relaciones: `N a 1` con `casos`, `usuarios`; `1 a N` con `ingresos_vehiculo`.
- notas: un turno puede cancelarse o reprogramarse sin implicar ingreso real.

#### `ingresos_vehiculo`

**Lectura orientativa**

- representa: el ingreso fisico real del vehiculo al taller. Este evento SI tiene impacto operativo y de trazabilidad.
- relaciones: cuelga de `casos`, puede vincularse a un `turnos_reparacion`, apunta al `vehiculo`, identifica quien recibe y quien entrega, y luego sirve como padre de `ingreso_items` y `egresos_vehiculo`.
- atributos clave: `turno_id` conecta con la reserva previa cuando existe, `vehiculo_id` identifica el auto recibido, `fecha_ingreso` marca el momento real de entrada, `recibido_por_usuario_id` y `persona_entrega_id` dejan trazado humano, `kilometraje_ingreso` y `combustible_codigo` registran estado de recepcion, `fecha_salida_estimada` orienta planificacion, `con_observaciones` y `detalle_observaciones` documentan anomalias.


- proposito: registrar el ingreso fisico real del vehiculo.
- columnas principales: `id`, `caso_id`, `turno_id`, `vehiculo_id`, `fecha_ingreso`, `recibido_por_usuario_id`, `persona_entrega_id`, `kilometraje_ingreso`, `combustible_codigo`, `fecha_salida_estimada`, `con_observaciones`, `detalle_observaciones`, `created_at`, `updated_at`.
- claves: PK `id`; FK `turno_id` nullable.
- relaciones: `N a 1` con `casos`, `turnos_reparacion`, `vehiculos`, `usuarios`, `personas`; `1 a N` con `ingreso_items`, `egresos_vehiculo`.
- notas: puede existir ingreso sin turno previo si se habilita recepcion excepcional.

#### `ingreso_items`

**Lectura orientativa**

- representa: el checklist puntual del ingreso, con faltantes, danos previos o evidencia observada.
- relaciones: depende de `ingresos_vehiculo` y desagrega el detalle que no conviene meter en una sola columna larga.
- atributos clave: `ingreso_id` identifica la recepcion padre, `tipo_item_codigo` clasifica el hallazgo, `detalle` describe el item, `estado_codigo` resume condicion o resultado, `referencia_media` enlaza evidencia externa como fotos o video.


- proposito: checklist y observaciones del ingreso.
- columnas principales: `id`, `ingreso_id`, `tipo_item_codigo`, `detalle`, `estado_codigo`, `referencia_media`.
- claves: PK `id`; FK `ingreso_id`.
- relaciones: `N a 1` con `ingresos_vehiculo`.
- notas: cubre faltantes, danos preexistentes, accesorios y soporte multimedia referenciado.

#### `egresos_vehiculo`

**Lectura orientativa**

- representa: cada salida del vehiculo del taller, sea definitiva o temporal. Separarla de ingresos evita perder la historia real del movimiento fisico.
- relaciones: cuelga de `ingresos_vehiculo` y `casos`, identifica usuario que entrega y persona que recibe, y conversa con futuros `turnos_reparacion` si hay reingreso.
- atributos clave: `ingreso_id` indica desde que ingreso sale el vehiculo, `fecha_egreso` marca el momento de salida, `entregado_por_usuario_id` y `persona_recibe_id` registran responsables, `egreso_definitivo` diferencia cierre final de salida parcial, `debe_reingresar` habilita flujo posterior, `fecha_reingreso_prevista` y `dias_estimados_reingreso` ayudan a planificar la vuelta, `estado_reingreso_codigo` comunica la situacion, `fotos_reparado_cargadas` valida evidencia final, `notas` agrega contexto.


- proposito: registrar cada salida del vehiculo.
- columnas principales: `id`, `caso_id`, `ingreso_id`, `fecha_egreso`, `entregado_por_usuario_id`, `persona_recibe_id`, `egreso_definitivo`, `debe_reingresar`, `fecha_reingreso_prevista`, `dias_estimados_reingreso`, `estado_reingreso_codigo`, `fotos_reparado_cargadas`, `notas`, `created_at`, `updated_at`.
- claves: PK `id`; FK `ingreso_id`.
- relaciones: `N a 1` con `casos`, `ingresos_vehiculo`, `usuarios`, `personas`.
- notas: separa egreso temporario de cierre definitivo y permite disparar nuevos turnos de reingreso.

#### `tareas`

**Lectura orientativa**

- representa: pendientes operativos o administrativos que pueden existir con o sin caso asociado.
- relaciones: puede depender de `casos`, se asigna a `usuarios` y se alimenta desde modulos muy distintos; justamente por eso conviene una tabla transversal.
- atributos clave: `caso_id` vincula la tarea con una carpeta cuando aplica, `modulo_origen_codigo` y `subtab_origen_codigo` dicen desde donde nacio, `titulo` y `descripcion` explican el pendiente, `fecha_limite` y `prioridad_codigo` ordenan trabajo, `estado_codigo` refleja avance, `usuario_asignado_id` define responsable, `created_by` guarda autor, `resuelta` y `resuelta_at` cierran el ciclo, `payload_json` admite contexto extra.


- proposito: pendientes operativos o administrativos.
- columnas principales: `id`, `caso_id`, `modulo_origen_codigo`, `subtab_origen_codigo`, `titulo`, `descripcion`, `fecha_limite`, `prioridad_codigo`, `estado_codigo`, `usuario_asignado_id`, `created_by`, `resuelta`, `resuelta_at`, `payload_json`, `created_at`, `updated_at`.
- claves: PK `id`; FK `caso_id` nullable; FK `usuario_asignado_id` nullable.
- relaciones: `N a 1` con `casos`, `usuarios` asignado/creador.
- notas: indice obligatorio sobre (`usuario_asignado_id`, `estado_codigo`, `fecha_limite`) para consulta por persona asignada.

### Presupuesto y finanzas

#### `presupuestos`

**Lectura orientativa**

- representa: la vista economica principal de la reparacion para un caso.
- relaciones: es extension `1 a 1` de `casos`, cuelga de organizacion/sucursal para contexto comercial y baja a detalle mediante `presupuesto_items`, servicios y trabajos accesorios.
- atributos clave: `fecha_presupuesto` ubica la version vigente, `informe_estado_codigo` resume situacion del presupuesto, `mano_obra_sin_iva`, `mano_obra_iva` y `mano_obra_con_iva` separan calculos de mano de obra, `repuestos_total` y `total_cotizado` consolidan montos, `dias_estimados` apoya planificacion, `monto_minimo_cierre_mo` expresa umbral operativo, `version_actual` deja abierta la puerta a evolucion futura.


- proposito: resumen economico y tecnico del presupuesto de reparacion.
- columnas principales: `id`, `caso_id`, `organizacion_id`, `sucursal_id`, `fecha_presupuesto`, `informe_estado_codigo`, `mano_obra_sin_iva`, `alicuota_iva`, `mano_obra_iva`, `mano_obra_con_iva`, `repuestos_total`, `total_cotizado`, `dias_estimados`, `monto_minimo_cierre_mo`, `observaciones`, `version_actual`, `created_at`, `updated_at`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`; `1 a N` con `presupuesto_items`, `presupuesto_servicios`, `presupuesto_trabajos_accesorios`.
- notas: si se necesita versionado historico real, se agrega tabla hija de snapshots mas adelante.

#### `presupuesto_items`

**Lectura orientativa**

- representa: el detalle por pieza, tarea o intervencion dentro del presupuesto.
- relaciones: depende de `presupuestos` y sirve como base para seguimiento de `repuestos_caso`.
- atributos clave: `presupuesto_id` identifica el presupuesto padre, `orden_visual` ordena la lectura, `pieza_afectada` indica la zona o componente, `tarea_codigo`, `nivel_danio_codigo`, `decision_repuesto_codigo` y `accion_codigo` describen la intervencion, `requiere_reemplazo` sintetiza decision, `valor_repuesto`, `horas_estimadas` e `importe_mano_obra` cuantifican impacto, `activo` ayuda a bajas logicas.


- proposito: piezas, tareas y acciones del presupuesto.
- columnas principales: `id`, `presupuesto_id`, `orden_visual`, `pieza_afectada`, `tarea_codigo`, `nivel_danio_codigo`, `decision_repuesto_codigo`, `accion_codigo`, `requiere_reemplazo`, `valor_repuesto`, `horas_estimadas`, `importe_mano_obra`, `activo`.
- claves: PK `id`; FK `presupuesto_id`.
- relaciones: `N a 1` con `presupuestos`; `1 a N` con `repuestos_caso`.
- notas: concentra granularidad de mano de obra y repuestos.

#### `repuestos_caso`

**Lectura orientativa**

- representa: el seguimiento operativo real de cada repuesto involucrado en una carpeta.
- relaciones: se conecta con `casos` y opcionalmente con `presupuesto_items`; asi se puede medir lo presupuestado contra lo efectivamente gestionado.
- atributos clave: `presupuesto_item_id` o `trabajo_accesorio_id` vinculan el origen funcional, `descripcion` y `codigo_pieza` identifican el repuesto, `proveedor_final` y `compra_por_codigo` explican circuito de compra, `autorizado_codigo`, `estado_codigo` y `pago_estado_codigo` resumen avance, `precio_presupuestado` y `precio_final` permiten comparar desvio, `fecha_recibido`, `usado` y `devuelto` cierran seguimiento fisico.


- proposito: seguimiento operativo de repuestos por caso.
- columnas principales: `id`, `caso_id`, `presupuesto_item_id`, `trabajo_accesorio_id`, `descripcion`, `codigo_pieza`, `proveedor_final`, `autorizado_codigo`, `estado_codigo`, `compra_por_codigo`, `pago_estado_codigo`, `precio_presupuestado`, `precio_final`, `fecha_recibido`, `usado`, `devuelto`, `created_at`, `updated_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `casos`, `presupuesto_items`.
- notas: regla importante: no se permite completar simultaneamente `presupuesto_item_id` y `trabajo_accesorio_id`.

#### `movimientos_financieros`

**Lectura orientativa**

- representa: el ledger unico de dinero que entra, sale o se imputa en el sistema.
- relaciones: cuelga de `casos`, puede tener contraparte persona o compania, referencia al usuario que registra y se complementa con retenciones, aplicaciones y comprobantes.
- atributos clave: `tipo_movimiento_codigo` y `origen_flujo_codigo` describen de que clase de movimiento se trata, `contraparte_tipo_codigo`, `contraparte_persona_id` y `contraparte_compania_id` identifican quien participa del otro lado, `fecha_movimiento` fija el momento contable, `monto_bruto` y `monto_neto` separan importes, `medio_pago_codigo` y `medio_pago_detalle` explican como se pago, `cancela_tipo_codigo` muestra que se compensa, `es_senia` y `es_bonificacion` agregan semantica, `motivo` y `referencia_externa` facilitan trazabilidad, `registrado_por` conserva autoria.


- proposito: ledger unico de movimientos economicos.
- columnas principales: `id`, `caso_id`, `comprobante_id`, `tipo_movimiento_codigo`, `origen_flujo_codigo`, `contraparte_tipo_codigo`, `contraparte_persona_id`, `contraparte_compania_id`, `fecha_movimiento`, `monto_bruto`, `monto_neto`, `medio_pago_codigo`, `medio_pago_detalle`, `cancela_tipo_codigo`, `es_senia`, `es_bonificacion`, `motivo`, `referencia_externa`, `registrado_por`, `created_at`, `updated_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `casos`, `personas`, `companias_seguro`, `usuarios`; `1 a N` con `movimiento_retenciones`, `movimiento_aplicaciones`.
- notas: evita multiplicar tablas de pagos por tipo de tramite.

#### `movimiento_retenciones`

**Lectura orientativa**

- representa: el detalle de descuentos o retenciones aplicados a un movimiento economico.
- relaciones: depende de `movimientos_financieros` y permite mantener limpio el ledger base.
- atributos clave: `movimiento_id` indica sobre que movimiento aplica, `tipo_retencion_codigo` clasifica el descuento, `monto` cuantifica la retencion, `detalle` agrega justificacion o descripcion.


- proposito: detallar retenciones o descuentos de un movimiento.
- columnas principales: `id`, `movimiento_id`, `tipo_retencion_codigo`, `monto`, `detalle`.
- claves: PK `id`; unique (`movimiento_id`, `tipo_retencion_codigo`).
- relaciones: `N a 1` con `movimientos_financieros`.
- notas: deja consistente la contabilidad operativa sin complejizar el ledger base.

#### `movimiento_aplicaciones`

**Lectura orientativa**

- representa: la imputacion funcional de un movimiento a conceptos o entidades concretas.
- relaciones: baja desde `movimientos_financieros` y puede apuntar de nuevo a `casos` u otras entidades del dominio sin rigidizar el ledger.
- atributos clave: `movimiento_id` identifica el origen economico, `caso_id` mantiene contexto de carpeta, `concepto_codigo` explica para que se aplica, `entidad_tipo` y `entidad_id` permiten vinculo flexible, `monto_aplicado` mide cuanto del movimiento se imputo ahi.


- proposito: imputar un movimiento a conceptos o entidades del caso.
- columnas principales: `id`, `movimiento_id`, `caso_id`, `concepto_codigo`, `entidad_tipo`, `entidad_id`, `monto_aplicado`.
- claves: PK `id`.
- relaciones: `N a 1` con `movimientos_financieros`, `casos`.
- notas: desacopla el movimiento de su aplicacion funcional.

#### `comprobantes_emitidos`

**Lectura orientativa**

- representa: los comprobantes comerciales o recibos que formalizan operaciones economicas.
- relaciones: se asocia a `casos` y opcionalmente a `documentos` para enlazar el PDF, escaneo o archivo firmado.
- atributos clave: `tipo_comprobante_codigo` y `numero_comprobante` identifican el comprobante, `razon_social_receptor` define a nombre de quien sale, `fecha_emision` ubica el acto comercial, `neto_gravado`, `iva` y `total` desglosan importes, `firmado_conforme_en` conserva evidencia de conformidad, `documento_id` apunta al archivo soporte, `notas` agrega contexto.


- proposito: comprobantes comerciales o recibos asociados al caso.
- columnas principales: `id`, `caso_id`, `tipo_comprobante_codigo`, `numero_comprobante`, `razon_social_receptor`, `fecha_emision`, `neto_gravado`, `iva`, `total`, `firmado_conforme_en`, `notas`, `documento_id`, `created_at`, `updated_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `casos`, `documentos`.
- notas: el PDF o archivo firmado se adjunta via `documentos`.

### Documentos

#### `categorias_documentales`

**Lectura orientativa**

- representa: el catalogo que clasifica documentos por uso funcional.
- relaciones: puede limitarse por `tipos_tramite` y luego ordena la carga y consulta de `documentos`.
- atributos clave: `codigo` identifica la categoria, `nombre` la hace legible, `modulo_codigo` la ubica dentro del sistema, `tipo_tramite_id` permite especializacion, `requiere_fecha` fuerza metadato adicional cuando aplica, `visible_cliente` adelanta criterio de exposicion, `activo` controla vigencia.


- proposito: catalogo de categorias y subdominios documentales.
- columnas principales: `id`, `codigo`, `nombre`, `modulo_codigo`, `tipo_tramite_id`, `requiere_fecha`, `visible_cliente`, `activo`.
- claves: PK `id`; unique (`codigo`, `modulo_codigo`).
- relaciones: `N a 1` con `tipos_tramite`; `1 a N` con `documentos`.
- notas: evita arrays hardcodeados y permite filtrar por modulo/tramite.

#### `documentos`

**Lectura orientativa**

- representa: el archivo como objeto unico, con sus metadatos tecnicos y funcionales. La idea central es NO duplicar storage cuando un mismo documento sirve en mas de un contexto.
- relaciones: se clasifica por `categorias_documentales`, registra al usuario que lo subio y se conecta con el resto del dominio a traves de `documento_relaciones`.
- atributos clave: `public_id` expone un identificador seguro, `storage_key` ubica el archivo en almacenamiento, `nombre_archivo`, `extension`, `mime_type` y `tamano_bytes` describen el binario, `checksum_sha256` ayuda a evitar duplicados y validar integridad, `categoria_id` y `subcategoria_codigo` lo clasifican, `fecha_documento` refleja fecha funcional del documento, `subido_por` conserva autoria, `origen_codigo` dice de donde llego, `observaciones` agrega contexto humano.


- proposito: repositorio central de archivos y metadatos.
- columnas principales: `id`, `public_id`, `storage_key`, `nombre_archivo`, `extension`, `mime_type`, `tamano_bytes`, `checksum_sha256`, `categoria_id`, `subcategoria_codigo`, `fecha_documento`, `subido_por`, `origen_codigo`, `observaciones`, `created_at`, `updated_at`.
- claves: PK `id`; unique `storage_key`.
- relaciones: `N a 1` con `categorias_documentales`, `usuarios`; `1 a N` con `documento_relaciones`.
- notas: un documento existe una sola vez y luego se relaciona con una o varias entidades.

#### `documento_relaciones`

**Lectura orientativa**

- representa: el contexto de uso del archivo dentro del dominio. Esta tabla explica a QUE esta asociado cada documento y por eso completa el modelo documental.
- relaciones: une `documentos` con `casos` y con cualquier otra entidad via `entidad_tipo` + `entidad_id`; asi un mismo archivo puede verse desde la carpeta completa o desde una entidad puntual.
- atributos clave: `documento_id` apunta al archivo base, `caso_id` permite agrupar documentacion por carpeta incluso si el documento cuelga de otra entidad, `entidad_tipo` y `entidad_id` identifican el destino concreto, `modulo_codigo` ubica el contexto funcional, `principal` destaca el adjunto principal, `visible_cliente` controla exposicion, `orden_visual` ordena presentacion.


- proposito: relacionar documentos con entidades del dominio.
- columnas principales: `id`, `documento_id`, `caso_id`, `entidad_tipo`, `entidad_id`, `modulo_codigo`, `principal`, `visible_cliente`, `orden_visual`.
- claves: PK `id`; unique (`documento_id`, `entidad_tipo`, `entidad_id`).
- relaciones: `N a 1` con `documentos`, `casos`; relacion polimorfica con la entidad apuntada.
- notas: soporta asociar un mismo archivo al caso completo, a una persona, a un ingreso, a un movimiento financiero o a una extension de tramite.

### Tramites especializados

#### `companias_seguro`

**Lectura orientativa**

- representa: las companias aseguradoras o terceros pagadores con los que se opera.
- relaciones: participa en `caso_seguro`, en movimientos financieros y en la gestion de contactos asociados.
- atributos clave: `codigo` identifica la compania, `nombre` la hace visible en negocio, `cuit` ayuda a formalizacion fiscal, `requiere_fotos_reparado` agrega regla operativa, `dias_pago_esperados` orienta seguimiento de cobranza, `activo` controla vigencia.


- proposito: catalogo de companias y terceros pagadores.
- columnas principales: `id`, `codigo`, `nombre`, `cuit`, `requiere_fotos_reparado`, `dias_pago_esperados`, `activo`.
- claves: PK `id`; unique `codigo`.
- relaciones: `1 a N` con `caso_seguro`, `movimientos_financieros`, `companias_contactos`.
- notas: sirve tanto para aseguradoras como para terceros cuando corresponda.

#### `companias_contactos`

**Lectura orientativa**

- representa: el puente entre una compania y personas que actuan como sus contactos.
- relaciones: une `companias_seguro` con `personas`; evita crear tablas aisladas para inspectores, tramitadores u otros interlocutores.
- atributos clave: `compania_id` identifica la compania, `persona_id` apunta al contacto reutilizable, `rol_contacto_codigo` explica que papel cumple para esa compania.


- proposito: contactos de compania reutilizando `personas`.
- columnas principales: `id`, `compania_id`, `persona_id`, `rol_contacto_codigo`.
- claves: PK `id`; unique (`compania_id`, `persona_id`, `rol_contacto_codigo`).
- relaciones: `N a 1` con `companias_seguro`, `personas`.
- notas: evita tablas separadas para inspectores y tramitadores.

#### `caso_seguro`

**Lectura orientativa**

- representa: la extension estructural del caso para tramites de seguro.
- relaciones: es `1 a 1` con `casos`, apunta a `companias_seguro` y puede referenciar filas de `caso_personas` para roles como tramitador o inspector dentro del expediente.
- atributos clave: `compania_seguro_id` identifica la aseguradora principal, `numero_poliza` y `numero_certificado` guardan datos contractuales, `detalle_cobertura` resume alcance, `compania_tercero_id` y `numero_cleas` conectan con terceros o circuitos especiales, `tramitador_caso_persona_id` e `inspector_caso_persona_id` atan interlocutores concretos del caso.


- proposito: datos estructurales del tramite de seguro.
- columnas principales: `id`, `caso_id`, `compania_seguro_id`, `numero_poliza`, `numero_certificado`, `detalle_cobertura`, `compania_tercero_id`, `numero_cleas`, `tramitador_caso_persona_id`, `inspector_caso_persona_id`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`; `N a 1` con `companias_seguro`; referencia opcional a `caso_personas` para roles del caso.
- notas: concentra interlocutores y datos de poliza.

#### `caso_tramitacion_seguro`

**Lectura orientativa**

- representa: la evolucion operativa de la gestion del seguro una vez definidos sus datos estructurales.
- relaciones: es extension `1 a 1` de `casos` y complementa a `caso_seguro` separando configuracion de cobertura respecto de seguimiento del tramite.
- atributos clave: `fecha_presentacion` y `fecha_derivado_inspeccion` ubican hitos, `modalidad_codigo` y `dictamen_codigo` describen tratamiento y resultado, `cotizacion_estado_codigo` y `fecha_cotizacion` siguen la cotizacion, `monto_acordado`, `monto_minimo_cierre` y `monto_facturar_compania` miden acuerdo economico, `lleva_repuestos` y `autorizacion_repuestos_codigo` impactan operacion, `proveedor_repuestos_texto` guarda excepciones, `monto_final_favor_taller`, `no_repara` y `admin_override_turno` agregan decisiones finales.


- proposito: seguimiento operativo del tramite ante compania.
- columnas principales: `id`, `caso_id`, `fecha_presentacion`, `fecha_derivado_inspeccion`, `modalidad_codigo`, `dictamen_codigo`, `cotizacion_estado_codigo`, `fecha_cotizacion`, `monto_acordado`, `monto_minimo_cierre`, `lleva_repuestos`, `autorizacion_repuestos_codigo`, `proveedor_repuestos_texto`, `monto_facturar_compania`, `monto_final_favor_taller`, `no_repara`, `admin_override_turno`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`.
- notas: separa configuracion de cobertura de la evolucion de gestion.

#### `caso_franquicia`

**Lectura orientativa**

- representa: la extension para tratar franquicias y posibles recuperos derivados.
- relaciones: es `1 a 1` con `casos` y puede apuntar a otro caso relacionado cuando hay recupero o expediente asociado.
- atributos clave: `estado_franquicia_codigo` resume situacion, `monto_franquicia` cuantifica el componente economico, `tipo_recupero_codigo` define circuito posterior, `caso_asociado_id` conecta otra carpeta, `dictamen_franquicia_codigo` explica evaluacion, `supera_franquicia` sintetiza condicion, `monto_recuperar` y `notas` completan contexto.


- proposito: datos de franquicia y recupero asociado.
- columnas principales: `id`, `caso_id`, `estado_franquicia_codigo`, `monto_franquicia`, `tipo_recupero_codigo`, `caso_asociado_id`, `dictamen_franquicia_codigo`, `supera_franquicia`, `monto_recuperar`, `notas`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`; relacion opcional con otro `caso`.
- notas: fundamental para todo riesgo y recupero derivado.

#### `caso_cleas`

**Lectura orientativa**

- representa: la extension especifica para el circuito CLEAS.
- relaciones: se acopla `1 a 1` con `casos` y convive con otras extensiones economicas o de seguro segun el tramite.
- atributos clave: `alcance_codigo` y `dictamen_codigo` describen la situacion CLEAS, `monto_franquicia` y `monto_cargo_cliente` cuantifican impacto al cliente, `estado_pago_cliente_codigo` y `fecha_pago_cliente` siguen cobro al cliente, `monto_pago_compania_franquicia`, `estado_pago_compania_franquicia_codigo` y `fecha_pago_compania_franquicia` siguen recupero frente a compania.


- proposito: extension especifica para CLEAS.
- columnas principales: `id`, `caso_id`, `alcance_codigo`, `dictamen_codigo`, `monto_franquicia`, `monto_cargo_cliente`, `estado_pago_cliente_codigo`, `fecha_pago_cliente`, `monto_pago_compania_franquicia`, `estado_pago_compania_franquicia_codigo`, `fecha_pago_compania_franquicia`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`.
- notas: resuelve las variaciones economicas del circuito CLEAS.

#### `caso_terceros`

**Lectura orientativa**

- representa: la extension para reclamos o gestiones contra terceros.
- relaciones: es `1 a 1` con `casos`, puede apuntar a `companias_seguro` y se apoya en `caso_personas` para titularidad y participacion de actores sin recurrir a porcentajes de copropiedad.
- atributos clave: `compania_tercero_id` identifica la contraparte, `referencia_reclamo` guarda numero externo, `documentacion_estado_codigo` y `documentacion_aceptada` miden avance documental, `modo_provision_repuestos_codigo` explica quien provee piezas, `monto_minimo_labor` y `monto_minimo_repuestos` fijan umbrales, `subtotal_mejor_cotizacion`, `total_final_repuestos`, `monto_facturar_compania` y `monto_final_favor_taller` permiten seguir acuerdo economico.


- proposito: extension para reclamos contra terceros.
- columnas principales: `id`, `caso_id`, `compania_tercero_id`, `referencia_reclamo`, `documentacion_estado_codigo`, `documentacion_aceptada`, `modo_provision_repuestos_codigo`, `monto_minimo_labor`, `monto_minimo_repuestos`, `subtotal_mejor_cotizacion`, `total_final_repuestos`, `monto_facturar_compania`, `monto_final_favor_taller`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`; `N a 1` con `companias_seguro`.
- notas: reemplaza planteos antiguos de titulares porcentuales; ahora la titularidad y participacion salen de `caso_personas`.

#### `caso_legal`

**Lectura orientativa**

- representa: la extension para frente legal, judicial o administrativo.
- relaciones: es `1 a 1` con `casos` y baja a detalle mediante `legal_novedades`, `legal_gastos` y `legal_rubros_cierre` segun evolucion del expediente.
- atributos clave: `tramita_codigo`, `reclama_codigo` e `instancia_codigo` describen el tipo de frente legal, `fecha_ingreso` marca inicio, `cuij`, `juzgado` y `autos` identifican causa o expediente, `abogado_contraparte`, `telefono_contraparte` y `email_contraparte` guardan contraparte, `repara_vehiculo` vincula lo legal con operacion, `cierre_por_codigo`, `fecha_cierre_legal`, `importe_total_expediente`, `observaciones` y `notas_cierre` documentan resultado.


- proposito: extension legal/judicial o administrativa.
- columnas principales: `id`, `caso_id`, `tramita_codigo`, `reclama_codigo`, `instancia_codigo`, `fecha_ingreso`, `cuij`, `juzgado`, `autos`, `abogado_contraparte`, `telefono_contraparte`, `email_contraparte`, `repara_vehiculo`, `cierre_por_codigo`, `fecha_cierre_legal`, `importe_total_expediente`, `observaciones`, `notas_cierre`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`; `1 a N` con `legal_novedades`, `legal_gastos`, `legal_rubros_cierre`.
- notas: soporta terceros por abogado y recuperos judicializados.

#### `legal_novedades`

**Lectura orientativa**

- representa: la bitacora funcional del seguimiento legal.
- relaciones: depende de `caso_legal` y permite registrar hitos sin mezclar todo en observaciones generales.
- atributos clave: `caso_legal_id` identifica el expediente legal padre, `fecha_novedad` ubica el hecho, `detalle` explica la novedad, `notificar_cliente` marca si debe comunicarse, `notificado_at` deja constancia de esa comunicacion.


- proposito: bitacora funcional del frente legal.
- columnas principales: `id`, `caso_legal_id`, `fecha_novedad`, `detalle`, `notificar_cliente`, `notificado_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `caso_legal`.
- notas: complementa pero no reemplaza auditoria tecnica.

#### `legal_gastos`

**Lectura orientativa**

- representa: los gastos asociados al expediente legal.
- relaciones: une `caso_legal` con `movimientos_financieros` cuando el gasto ya tuvo impacto economico registrado.
- atributos clave: `caso_legal_id` define a que frente legal pertenece, `concepto` describe el gasto, `monto` lo cuantifica, `fecha_gasto` ubica el hecho, `pagado_por_codigo` identifica quien lo asumio, `movimiento_financiero_id` enlaza con el ledger.


- proposito: registrar gastos del expediente legal.
- columnas principales: `id`, `caso_legal_id`, `concepto`, `monto`, `fecha_gasto`, `pagado_por_codigo`, `movimiento_financiero_id`.
- claves: PK `id`.
- relaciones: `N a 1` con `caso_legal`, `movimientos_financieros`.
- notas: conecta mundo legal con finanzas.

#### `recuperos_franquicia`

**Lectura orientativa**

- representa: la extension para recuperar franquicias como flujo propio pero conectado al caso base.
- relaciones: es `1 a 1` con `casos` y puede enlazarse con otro expediente origen para reutilizar contexto y trazabilidad.
- atributos clave: `gestiona_codigo` define quien lleva la gestion, `caso_base_id` y `carpeta_base_codigo` conectan con la carpeta original, `dictamen_codigo` resume evaluacion, `monto_acordado` y `monto_recuperar` siguen negociacion, `habilita_reparacion` y `recupera_cliente` expresan impacto operativo, `monto_cliente`, `estado_cobro_cliente_codigo` y `fecha_cobro_cliente` siguen cobro al cliente, `aprobado_menor_acuerdo`, `nota_aprobacion` y `reutiliza_datos_base` documentan excepciones y decision de reutilizacion.


- proposito: extension para recupero de franquicia como caso propio.
- columnas principales: `id`, `caso_id`, `gestiona_codigo`, `caso_base_id`, `carpeta_base_codigo`, `dictamen_codigo`, `monto_acordado`, `monto_recuperar`, `habilita_reparacion`, `recupera_cliente`, `monto_cliente`, `estado_cobro_cliente_codigo`, `fecha_cobro_cliente`, `aprobado_menor_acuerdo`, `nota_aprobacion`, `reutiliza_datos_base`.
- claves: PK `id`; unique `caso_id`.
- relaciones: `1 a 1` con `casos`; `N a 1` opcional con otro `caso` base.
- notas: permite flujo separado pero conectado a la carpeta original.

### Administracion e integraciones

#### `feriados`

**Lectura orientativa**

- representa: el calendario de dias no habiles que impacta promesas operativas y calculos.
- relaciones: no requiere FKs directas, pero condiciona agenda, SLA y estimaciones en otros modulos.
- atributos clave: `fecha` identifica el dia, `descripcion` explica el motivo, `ambito_codigo` y `provincia_codigo` delimitan alcance geografico, `activo` permite anular una carga sin borrar registro.


- proposito: calendario no habil para calculos operativos.
- columnas principales: `id`, `fecha`, `descripcion`, `ambito_codigo`, `provincia_codigo`, `activo`.
- claves: PK `id`; unique `fecha` + ambito si se requiere granularidad.
- relaciones: sin FK directas.
- notas: impacta salida estimada, agenda y SLA.

#### `notificaciones`

**Lectura orientativa**

- representa: la bandeja de avisos que recibe cada usuario dentro del sistema.
- relaciones: apunta a `usuarios` y opcionalmente a `casos`; puede alimentarse desde workflow, tareas, auditoria o reglas de negocio.
- atributos clave: `usuario_id` define destinatario, `caso_id` agrega contexto de carpeta, `tipo_codigo` clasifica la alerta, `titulo` y `mensaje` comunican contenido, `prioridad_codigo` ordena relevancia, `leida_at` y `resuelta_at` describen estado, `payload_json` permite datos adicionales.


- proposito: bandeja de eventos para usuarios.
- columnas principales: `id`, `usuario_id`, `caso_id`, `tipo_codigo`, `titulo`, `mensaje`, `prioridad_codigo`, `leida_at`, `resuelta_at`, `payload_json`, `created_at`, `updated_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `usuarios`, `casos`.
- notas: se alimenta desde reglas de negocio, workflow y auditoria.

#### `integraciones_config`

**Lectura orientativa**

- representa: la configuracion de proveedores o integraciones externas.
- relaciones: es tabla padre de `integraciones_log` y desacopla credenciales o parametros del resto del dominio.
- atributos clave: `codigo` identifica la integracion, `tipo_codigo` clasifica el proveedor, `nombre` la vuelve entendible para operacion, `activo` habilita o deshabilita ejecucion, `config_json` guarda configuracion flexible.


- proposito: parametrizar integraciones externas.
- columnas principales: `id`, `codigo`, `tipo_codigo`, `nombre`, `activo`, `config_json`.
- claves: PK `id`; unique `codigo`.
- relaciones: `1 a N` con `integraciones_log`.
- notas: mantiene desacopladas credenciales y comportamiento por proveedor.

#### `integraciones_log`

**Lectura orientativa**

- representa: la trazabilidad tecnica de llamadas a servicios externos.
- relaciones: depende de `integraciones_config`, puede apuntar a `casos` y a una entidad puntual, pero NO reemplaza la auditoria funcional del negocio.
- atributos clave: `integracion_id` identifica el proveedor, `caso_id` suma contexto de carpeta, `direccion_codigo` indica si fue request saliente o respuesta procesada, `entidad_tipo` y `entidad_id` contextualizan, `request_json` y `response_json` guardan payloads, `estado_codigo` resume resultado, `ejecutado_at` ubica el evento.


- proposito: trazabilidad tecnica de requests/responses externos.
- columnas principales: `id`, `integracion_id`, `caso_id`, `direccion_codigo`, `entidad_tipo`, `entidad_id`, `request_json`, `response_json`, `estado_codigo`, `ejecutado_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `integraciones_config`, `casos`.
- notas: es log tecnico, no reemplaza `auditoria_eventos`.

#### `outbox_eventos`

**Lectura orientativa**

- representa: la cola persistente para publicar eventos de dominio sin perder consistencia.
- relaciones: referencia aggregates como `casos`, `documentos` o `movimientos_financieros`, y sirve como puente hacia notificaciones o sistemas externos.
- atributos clave: `aggregate_type` y `aggregate_id` identifican el origen del evento, `event_type` nombra lo ocurrido, `payload_json` lleva el contenido, `published_at` indica si ya salio, `failed_attempts` mide reintentos, `created_at` ayuda a ordenar procesamiento.


- proposito: publicar eventos de dominio de forma confiable.
- columnas principales: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload_json`, `published_at`, `failed_attempts`, `created_at`.
- claves: PK `id`.
- relaciones: logicas con aggregates como `casos`, `movimientos_financieros`, `documentos`.
- notas: importante si despues se integran notificaciones, ERP o aseguradoras.

### Auditoria

#### `auditoria_eventos`

**Lectura orientativa**

- representa: el log central, persistente y visible de acciones sensibles del sistema. No es un extra: es parte del modelo de negocio porque explica quien hizo que y sobre que entidad.
- relaciones: se conecta con `usuarios`, `casos` y cualquier entidad del dominio via referencia polimorfica; complementa al `caso_estado_historial` y al log tecnico de integraciones.
- atributos clave: `usuario_id` identifica al actor cuando existe, `caso_id` permite filtrar por carpeta, `entidad_tipo` y `entidad_id` ubican la entidad afectada, `accion_codigo` nombra la operacion, `antes_json` y `despues_json` permiten comparar cambios, `metadata_json` agrega contexto adicional, `ip_origen` y `user_agent` fortalecen trazabilidad, `created_at` fija el momento exacto.


- proposito: log central visible y persistente de acciones de negocio y sistema.
- columnas principales: `id`, `usuario_id`, `caso_id`, `entidad_tipo`, `entidad_id`, `accion_codigo`, `antes_json`, `despues_json`, `metadata_json`, `ip_origen`, `user_agent`, `created_at`.
- claves: PK `id`.
- relaciones: `N a 1` con `usuarios`, `casos`; referencia polimorfica a la entidad afectada.
- notas: debe registrar altas, cambios, anulaciones, transiciones de estado, adjuntos, asignaciones, movimientos de dinero y acciones sensibles.

## Relaciones importantes entre tablas

- `organizaciones -> sucursales -> casos` ordena la operacion multi-sede.
- `usuarios -> usuario_roles -> roles -> rol_permisos -> permisos` resuelve autorizacion scopeada.
- `casos -> caso_personas -> personas` expresa roles de negocio por expediente.
- `casos -> caso_vehiculos -> vehiculos` permite uno o varios vehiculos por carpeta.
- `casos -> workflow_estados` guarda estado actual cacheado; `caso_estado_historial` conserva la historia.
- `casos -> turnos_reparacion -> ingresos_vehiculo -> egresos_vehiculo` refleja la secuencia operativa real.
- `casos -> presupuestos -> presupuesto_items -> repuestos_caso` baja del nivel macro al item operativo.
- `casos -> movimientos_financieros -> movimiento_aplicaciones` separa caja de imputacion funcional.
- `documentos -> documento_relaciones` desacopla almacenamiento de contexto de uso.
- `casos -> caso_seguro / caso_cleas / caso_terceros / caso_legal / recuperos_franquicia` implementa extensiones por tramite.
- `casos -> auditoria_eventos` centraliza trazabilidad transversal.

## Reglas de negocio asociadas

- no se crea un caso sin `tipo_tramite_id`, una persona cliente principal y un vehiculo principal o al menos datos suficientes para crearlo en la misma transaccion.
- `casos` no debe llenarse de columnas especificas del tramite; cualquier dato especial va a su extension correspondiente.
- una `persona` puede aparecer multiples veces en un mismo caso si cambia el rol; lo que no debe duplicarse es el mismo rol identico para el mismo contexto.
- el documento principal de identidad se valida en `personas`; si despues se necesitan archivos respaldatorios, esos si van por `documentos`.
- no se maneja porcentaje de titularidad ni copropiedad. Si hay mas de un titular, se registran varias filas en `caso_personas` con rol `titular`.
- `vehiculo_personas` y `caso_personas` deben poder distinguir entre `titular` y `quien_trae_vehiculo`.
- un `turno_reparacion` no implica ingreso; solo reserva.
- un `ingreso_vehiculo` puede existir sin turno solo con permiso especial o flujo excepcional.
- un `egreso_vehiculo` con `debe_reingresar = true` no cierra reparacion; debe dejar trazable el siguiente paso.
- una `tarea` puede existir sin caso y sin asignado, pero toda tarea resuelta debe registrar quien la resolvio o al menos el usuario actor en auditoria.
- una transicion de workflow debe existir en `workflow_transiciones` o ser una automatica expresamente permitida.
- cada cambio de estado exitoso debe actualizar el cache del caso y crear registro en `caso_estado_historial` y `auditoria_eventos`.
- toda accion sensible debe dejar snapshot o diff suficiente en `auditoria_eventos`.
- la eliminacion fisica de datos transaccionales no deberia permitirse; conviene usar `activo`, `archived_at` o anulacion logica.

## Flujo turnos -> ingreso -> egreso -> reingreso

1. se crea `turnos_reparacion` para reservar fecha/hora y estimar salida.
2. cuando el vehiculo llega, se crea `ingresos_vehiculo`; puede referenciar el turno original.
3. durante el ingreso se cargan `ingreso_items`, observaciones, faltantes y evidencia documental.
4. cuando el vehiculo sale, se crea `egresos_vehiculo` asociado al ingreso.
5. si el egreso es final, `egreso_definitivo = true` y el workflow de reparacion puede avanzar a cerrado/entregado segun reglas.
6. si debe volver, `debe_reingresar = true`, se deja fecha prevista y puede generarse un nuevo `turnos_reparacion` marcado como `es_reingreso = true`.
7. el reingreso crea un nuevo registro en `ingresos_vehiculo`, nunca reusa el ingreso anterior.
8. cada paso debe impactar historial de estados y auditoria.

## Seccion especifica: `documentos` + `documento_relaciones`

La decision correcta ACA es separar archivo de contexto. Y sabes por que? Porque el mismo PDF, foto o escaneo puede servir para mas de una entidad y no queres duplicar storage ni logica.

- `documentos` guarda el archivo y sus metadatos tecnicos/funcionales.
- `documento_relaciones` indica con que entidad se vincula ese archivo.
- `caso_id` en `documento_relaciones` permite filtrar toda la documentacion de una carpeta incluso cuando el documento apunta a otra entidad puntual.
- `entidad_tipo` + `entidad_id` habilita asociar archivos a `casos`, `personas`, `vehiculos`, `ingresos_vehiculo`, `egresos_vehiculo`, `movimientos_financieros`, `caso_legal`, etc.
- `principal` sirve para destacar el archivo de referencia de una categoria o entidad.
- `visible_cliente` permite separar documentacion interna de la compartible.

Reglas sugeridas:

- no duplicar el mismo archivo si el `checksum_sha256` y `storage_key` ya existen.
- si un documento queda obsoleto, conviene versionarlo o marcarlo inactivo logicamente, no borrarlo sin rastro.
- las categorias deben condicionar validaciones por tramite o modulo, no la estructura de la tabla.

## Seccion especifica: `workflow_estados` + `workflow_transiciones` + `caso_estado_historial`

Esto define la maquina de estados del sistema.

- `workflow_estados` es el catalogo por dominio.
- `workflow_transiciones` define desde donde hasta donde se puede avanzar, para que tipo de tramite, con que accion y con que permiso.
- `caso_estado_historial` registra cada cambio ocurrido, manual o automatico.

Diseno recomendado:

- mantener en `casos` los estados actuales (`estado_tramite_actual_id`, `estado_reparacion_actual_id`) como cache de lectura.
- usar `workflow_transiciones.requiere_permiso_codigo` para bloquear acciones sensibles sin hardcodear todo en aplicacion.
- usar `regla_json` para precondiciones como "no dar turno si falta acuerdo" o "no cerrar caso si falta pago".
- registrar en historial `automatico`, `motivo` y `detalle_json` para entender por que se movio el estado.

Reglas sugeridas:

- no actualizar el estado actual del caso sin insertar antes o en la misma transaccion el historial.
- toda transicion invalida debe rechazarse y, si aplica, dejar intento fallido en auditoria.
- los estados terminales no deberian admitir nuevas transiciones salvo reapertura con permiso explicito.

## Seccion especifica: `auditoria_eventos` como log central

`auditoria_eventos` debe ser EL log central del sistema. Visible para usuarios autorizados y persistente a nivel base de datos.

Debe registrar como minimo:

- creacion, edicion, anulacion y archivado de casos.
- alta o cambio de personas, vehiculos, documentos y relaciones.
- altas, reasignaciones y resoluciones de tareas.
- creacion, reprogramacion, cancelacion e impacto operativo de turnos, ingresos y egresos.
- cambios de estado del workflow.
- movimientos financieros y emision de comprobantes.
- cambios de permisos o roles de usuario.

Buenas practicas:

- usar `accion_codigo` consistente (`crear`, `actualizar`, `eliminar_logico`, `transicionar_estado`, `adjuntar_documento`, etc.).
- guardar `antes_json` y `despues_json` cuando haya mutacion relevante.
- guardar `metadata_json` para contexto adicional: modulo, origen UI/API, motivo, correlacion, etc.
- indexar por `caso_id`, `usuario_id`, `entidad_tipo + entidad_id` y `created_at`.
- nunca depender solo de logs de aplicacion o consola; la auditoria de negocio debe vivir en la base.

## Pendientes y decisiones futuras

- definir si `usuarios` necesitara FK opcional a `personas` para agenda unificada interna/externa.
- decidir estrategia de versionado real para presupuestos y documentos reemplazados.
- cerrar catalogos controlados: medios de pago, prioridades, estados de repuesto, tipos de contacto, tipos de documento.
- evaluar si `documentos` requiere politicas de retencion, borrado legal o cifrado por categoria.
- definir si `workflow_transiciones.regla_json` sera 100% declarativo o mixto con reglas en codigo.
- decidir si `auditoria_eventos` necesitara particionado por fecha o archivado por volumen.
- validar si `vehiculo_personas` debe persistir solo roles estables del vehiculo o si todo alcanza con `caso_personas`.
- evaluar modelos de conciliacion financiera y caja diaria si el sistema crece a gestion administrativa completa.
