-- DDL inicial para tallerDemo - MySQL 8.x
--
-- Decisiones de modelado cerradas en este borrador:
-- 1. Se usa InnoDB + utf8mb4 y claves bigint unsigned autoincrementales.
-- 2. `public_id` se modela como CHAR(36) para UUID textual generado por aplicacion.
-- 3. Las referencias polimorficas (`entidad_tipo` + `entidad_id`) no tienen FK fisica;
--    su integridad se resuelve desde aplicacion y auditoria.
-- 4. Las restricciones unicas con columnas nullable que MySQL no puede expresar de forma
--    exacta (por ejemplo ciertos roles contextuales en `caso_personas`) quedan reforzadas
--    con indice unico aproximado + validacion aplicativa.
-- 5. `movimientos_financieros.comprobante_id` queda nullable para permitir registrar el
--    movimiento antes de emitir comprobante.
-- 6. `legal_rubros_cierre` se modela como detalle economico de cierre legal, porque en la
--    documentacion actual aparece como tabla requerida pero sin desglose completo de columnas.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE organizaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    razon_social VARCHAR(200) NULL,
    cuit VARCHAR(20) NULL,
    condicion_iva VARCHAR(50) NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_organizaciones_public_id (public_id),
    UNIQUE KEY uq_organizaciones_codigo (codigo),
    UNIQUE KEY uq_organizaciones_cuit (cuit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sucursales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion_linea1 VARCHAR(200) NULL,
    ciudad VARCHAR(100) NULL,
    provincia VARCHAR(100) NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sucursales_public_id (public_id),
    UNIQUE KEY uq_sucursales_org_codigo (organizacion_id, codigo),
    KEY idx_sucursales_organizacion (organizacion_id),
    CONSTRAINT fk_sucursales_organizacion
        FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_tramite (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    prefijo_carpeta VARCHAR(20) NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    requiere_tramitacion TINYINT(1) NOT NULL DEFAULT 0,
    requiere_abogado TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tipos_tramite_codigo (codigo),
    KEY idx_tipos_tramite_activo_orden (activo, orden_visual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE parametros_sistema (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    scope_tipo VARCHAR(50) NOT NULL,
    scope_id BIGINT UNSIGNED NULL,
    clave VARCHAR(120) NOT NULL,
    valor_json JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_parametros_scope_clave (scope_tipo, scope_id, clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE personas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    tipo_persona ENUM('fisica', 'juridica') NOT NULL,
    nombre VARCHAR(120) NULL,
    apellido VARCHAR(120) NULL,
    razon_social VARCHAR(200) NULL,
    nombre_mostrar VARCHAR(220) NOT NULL,
    tipo_documento_codigo VARCHAR(20) NULL,
    numero_documento VARCHAR(30) NULL,
    numero_documento_normalizado VARCHAR(30) NULL,
    cuit_cuil VARCHAR(20) NULL,
    fecha_nacimiento DATE NULL,
    telefono_principal VARCHAR(50) NULL,
    email_principal VARCHAR(150) NULL,
    ocupacion VARCHAR(120) NULL,
    observaciones TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_personas_public_id (public_id),
    UNIQUE KEY uq_personas_documento (tipo_documento_codigo, numero_documento_normalizado),
    KEY idx_personas_nombre_mostrar (nombre_mostrar),
    KEY idx_personas_cuit_cuil (cuit_cuil),
    KEY idx_personas_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE persona_contactos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    persona_id BIGINT UNSIGNED NOT NULL,
    tipo_contacto_codigo VARCHAR(30) NOT NULL,
    valor VARCHAR(200) NOT NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    validado TINYINT(1) NOT NULL DEFAULT 0,
    observaciones VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_persona_contactos_persona (persona_id),
    KEY idx_persona_contactos_tipo (tipo_contacto_codigo),
    CONSTRAINT fk_persona_contactos_persona
        FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE persona_domicilios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    persona_id BIGINT UNSIGNED NOT NULL,
    tipo_domicilio_codigo VARCHAR(30) NOT NULL,
    calle VARCHAR(150) NULL,
    numero VARCHAR(20) NULL,
    piso VARCHAR(20) NULL,
    depto VARCHAR(20) NULL,
    localidad VARCHAR(100) NULL,
    provincia VARCHAR(100) NULL,
    codigo_postal VARCHAR(20) NULL,
    pais_codigo VARCHAR(10) NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_persona_domicilios_persona (persona_id),
    CONSTRAINT fk_persona_domicilios_persona
        FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120) NULL,
    telefono VARCHAR(50) NULL,
    ultimo_acceso_at DATETIME NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_public_id (public_id),
    UNIQUE KEY uq_usuarios_username (username),
    UNIQUE KEY uq_usuarios_email (email),
    KEY idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    system_role TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_codigo (codigo),
    KEY idx_roles_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE permisos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    modulo VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_permisos_codigo (codigo),
    KEY idx_permisos_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE rol_permisos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rol_id BIGINT UNSIGNED NOT NULL,
    permiso_id BIGINT UNSIGNED NOT NULL,
    allow_flag TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rol_permisos (rol_id, permiso_id),
    KEY idx_rol_permisos_permiso (permiso_id),
    CONSTRAINT fk_rol_permisos_rol
        FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_rol_permisos_permiso
        FOREIGN KEY (permiso_id) REFERENCES permisos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuario_roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    rol_id BIGINT UNSIGNED NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NULL,
    vigente_desde DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vigente_hasta DATETIME NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_roles_scope (usuario_id, rol_id, organizacion_id, sucursal_id, vigente_desde),
    KEY idx_usuario_roles_usuario_activo (usuario_id, activo),
    KEY idx_usuario_roles_scope (organizacion_id, sucursal_id, activo),
    CONSTRAINT fk_usuario_roles_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_usuario_roles_rol
        FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_usuario_roles_organizacion
        FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_usuario_roles_sucursal
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE marcas_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_marcas_vehiculo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modelos_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    marca_id BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_modelos_vehiculo_marca_codigo (marca_id, codigo),
    KEY idx_modelos_vehiculo_marca (marca_id),
    CONSTRAINT fk_modelos_vehiculo_marca
        FOREIGN KEY (marca_id) REFERENCES marcas_vehiculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE workflow_estados (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    dominio VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    terminal TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_workflow_estados_dominio_codigo (dominio, codigo),
    KEY idx_workflow_estados_dominio_orden (dominio, orden_visual, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE companias_seguro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20) NULL,
    requiere_fotos_reparado TINYINT(1) NOT NULL DEFAULT 0,
    dias_pago_esperados INT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_companias_seguro_codigo (codigo),
    UNIQUE KEY uq_companias_seguro_cuit (cuit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vehiculos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    marca_id BIGINT UNSIGNED NULL,
    modelo_id BIGINT UNSIGNED NULL,
    marca_texto VARCHAR(120) NULL,
    modelo_texto VARCHAR(120) NULL,
    dominio VARCHAR(20) NULL,
    dominio_normalizado VARCHAR(20) NULL,
    anio SMALLINT UNSIGNED NULL,
    tipo_vehiculo_codigo VARCHAR(30) NULL,
    uso_codigo VARCHAR(30) NULL,
    color VARCHAR(60) NULL,
    pintura_codigo VARCHAR(30) NULL,
    chasis VARCHAR(80) NULL,
    motor VARCHAR(80) NULL,
    transmision_codigo VARCHAR(30) NULL,
    kilometraje INT UNSIGNED NULL,
    observaciones TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehiculos_public_id (public_id),
    UNIQUE KEY uq_vehiculos_dominio_normalizado (dominio_normalizado),
    KEY idx_vehiculos_marca (marca_id),
    KEY idx_vehiculos_modelo (modelo_id),
    CONSTRAINT fk_vehiculos_marca
        FOREIGN KEY (marca_id) REFERENCES marcas_vehiculo (id),
    CONSTRAINT fk_vehiculos_modelo
        FOREIGN KEY (modelo_id) REFERENCES modelos_vehiculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vehiculo_personas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehiculo_id BIGINT UNSIGNED NOT NULL,
    persona_id BIGINT UNSIGNED NOT NULL,
    rol_vehiculo_codigo VARCHAR(40) NOT NULL,
    es_actual TINYINT(1) NOT NULL DEFAULT 1,
    desde DATE NULL,
    hasta DATE NULL,
    notas VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehiculo_personas (vehiculo_id, persona_id, rol_vehiculo_codigo, desde),
    KEY idx_vehiculo_personas_persona (persona_id),
    KEY idx_vehiculo_personas_vehiculo_actual (vehiculo_id, es_actual),
    CONSTRAINT fk_vehiculo_personas_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
    CONSTRAINT fk_vehiculo_personas_persona
        FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE companias_contactos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    compania_id BIGINT UNSIGNED NOT NULL,
    persona_id BIGINT UNSIGNED NOT NULL,
    rol_contacto_codigo VARCHAR(40) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_companias_contactos (compania_id, persona_id, rol_contacto_codigo),
    KEY idx_companias_contactos_persona (persona_id),
    CONSTRAINT fk_companias_contactos_compania
        FOREIGN KEY (compania_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_companias_contactos_persona
        FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE casos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    codigo_carpeta VARCHAR(50) NOT NULL,
    numero_orden BIGINT UNSIGNED NOT NULL,
    tipo_tramite_id BIGINT UNSIGNED NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NOT NULL,
    vehiculo_principal_id BIGINT UNSIGNED NULL,
    cliente_principal_persona_id BIGINT UNSIGNED NOT NULL,
    referenciado TINYINT(1) NOT NULL DEFAULT 0,
    referido_por_persona_id BIGINT UNSIGNED NULL,
    referido_por_texto VARCHAR(200) NULL,
    usuario_creador_id BIGINT UNSIGNED NOT NULL,
    estado_tramite_actual_id BIGINT UNSIGNED NULL,
    estado_reparacion_actual_id BIGINT UNSIGNED NULL,
    prioridad_codigo VARCHAR(20) NOT NULL DEFAULT 'media',
    fecha_cierre DATE NULL,
    observaciones_generales TEXT NULL,
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_casos_public_id (public_id),
    UNIQUE KEY uq_casos_codigo_carpeta (codigo_carpeta),
    UNIQUE KEY uq_casos_org_numero_orden (organizacion_id, numero_orden),
    KEY idx_casos_tipo_tramite (tipo_tramite_id),
    KEY idx_casos_sucursal (sucursal_id),
    KEY idx_casos_cliente_principal (cliente_principal_persona_id),
    KEY idx_casos_vehiculo_principal (vehiculo_principal_id),
    KEY idx_casos_estado_tramite (estado_tramite_actual_id),
    KEY idx_casos_estado_reparacion (estado_reparacion_actual_id),
    KEY idx_casos_archived_at (archived_at),
    CONSTRAINT fk_casos_tipo_tramite
        FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite (id),
    CONSTRAINT fk_casos_organizacion
        FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_casos_sucursal
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
    CONSTRAINT fk_casos_vehiculo_principal
        FOREIGN KEY (vehiculo_principal_id) REFERENCES vehiculos (id),
    CONSTRAINT fk_casos_cliente_principal
        FOREIGN KEY (cliente_principal_persona_id) REFERENCES personas (id),
    CONSTRAINT fk_casos_referido_persona
        FOREIGN KEY (referido_por_persona_id) REFERENCES personas (id),
    CONSTRAINT fk_casos_usuario_creador
        FOREIGN KEY (usuario_creador_id) REFERENCES usuarios (id),
    CONSTRAINT fk_casos_estado_tramite_actual
        FOREIGN KEY (estado_tramite_actual_id) REFERENCES workflow_estados (id),
    CONSTRAINT fk_casos_estado_reparacion_actual
        FOREIGN KEY (estado_reparacion_actual_id) REFERENCES workflow_estados (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_personas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    persona_id BIGINT UNSIGNED NOT NULL,
    rol_caso_codigo VARCHAR(40) NOT NULL,
    vehiculo_id BIGINT UNSIGNED NULL,
    es_principal TINYINT(1) NOT NULL DEFAULT 0,
    notas VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_personas_ctx (caso_id, persona_id, rol_caso_codigo, vehiculo_id),
    KEY idx_caso_personas_persona (persona_id),
    KEY idx_caso_personas_vehiculo (vehiculo_id),
    KEY idx_caso_personas_caso_rol (caso_id, rol_caso_codigo),
    CONSTRAINT fk_caso_personas_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_personas_persona
        FOREIGN KEY (persona_id) REFERENCES personas (id),
    CONSTRAINT fk_caso_personas_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_vehiculos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    vehiculo_id BIGINT UNSIGNED NOT NULL,
    rol_vehiculo_codigo VARCHAR(40) NOT NULL,
    es_principal TINYINT(1) NOT NULL DEFAULT 0,
    orden_visual INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_vehiculos (caso_id, vehiculo_id, rol_vehiculo_codigo),
    KEY idx_caso_vehiculos_vehiculo (vehiculo_id),
    KEY idx_caso_vehiculos_caso_principal (caso_id, es_principal),
    CONSTRAINT fk_caso_vehiculos_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_vehiculos_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_relaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_origen_id BIGINT UNSIGNED NOT NULL,
    caso_destino_id BIGINT UNSIGNED NOT NULL,
    tipo_relacion_codigo VARCHAR(40) NOT NULL,
    descripcion VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_relaciones (caso_origen_id, caso_destino_id, tipo_relacion_codigo),
    KEY idx_caso_relaciones_destino (caso_destino_id),
    CONSTRAINT fk_caso_relaciones_origen
        FOREIGN KEY (caso_origen_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_relaciones_destino
        FOREIGN KEY (caso_destino_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_siniestro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_siniestro DATE NULL,
    hora_siniestro TIME NULL,
    lugar VARCHAR(255) NULL,
    dinamica TEXT NULL,
    observaciones TEXT NULL,
    fecha_prescripcion DATE NULL,
    dias_tramitando INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_siniestro_caso (caso_id),
    CONSTRAINT fk_caso_siniestro_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE workflow_transiciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dominio VARCHAR(50) NOT NULL,
    tipo_tramite_id BIGINT UNSIGNED NULL,
    estado_origen_id BIGINT UNSIGNED NOT NULL,
    estado_destino_id BIGINT UNSIGNED NOT NULL,
    accion_codigo VARCHAR(60) NOT NULL,
    requiere_permiso_codigo VARCHAR(100) NULL,
    automatica TINYINT(1) NOT NULL DEFAULT 0,
    regla_json JSON NULL,
    active_from DATETIME NULL,
    active_to DATETIME NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_workflow_transiciones (dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo),
    KEY idx_workflow_transiciones_origen (estado_origen_id),
    KEY idx_workflow_transiciones_destino (estado_destino_id),
    CONSTRAINT fk_workflow_transiciones_tipo_tramite
        FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite (id),
    CONSTRAINT fk_workflow_transiciones_estado_origen
        FOREIGN KEY (estado_origen_id) REFERENCES workflow_estados (id),
    CONSTRAINT fk_workflow_transiciones_estado_destino
        FOREIGN KEY (estado_destino_id) REFERENCES workflow_estados (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_estado_historial (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    dominio_estado VARCHAR(50) NOT NULL,
    estado_id BIGINT UNSIGNED NOT NULL,
    fecha_estado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id BIGINT UNSIGNED NULL,
    automatico TINYINT(1) NOT NULL DEFAULT 0,
    motivo VARCHAR(255) NULL,
    detalle_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_caso_estado_historial_caso_fecha (caso_id, fecha_estado),
    KEY idx_caso_estado_historial_estado (estado_id),
    KEY idx_caso_estado_historial_usuario (usuario_id),
    CONSTRAINT fk_caso_estado_historial_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_estado_historial_estado
        FOREIGN KEY (estado_id) REFERENCES workflow_estados (id),
    CONSTRAINT fk_caso_estado_historial_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE turnos_reparacion (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_turno TIME NOT NULL,
    dias_estimados INT NULL,
    fecha_salida_estimada DATE NULL,
    estado_codigo VARCHAR(30) NOT NULL,
    es_reingreso TINYINT(1) NOT NULL DEFAULT 0,
    notas TEXT NULL,
    usuario_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_turnos_reparacion_caso_fecha (caso_id, fecha_turno, hora_turno),
    KEY idx_turnos_reparacion_usuario (usuario_id),
    KEY idx_turnos_reparacion_estado (estado_codigo),
    CONSTRAINT fk_turnos_reparacion_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_turnos_reparacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ingresos_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    turno_id BIGINT UNSIGNED NULL,
    vehiculo_id BIGINT UNSIGNED NOT NULL,
    fecha_ingreso DATETIME NOT NULL,
    recibido_por_usuario_id BIGINT UNSIGNED NOT NULL,
    persona_entrega_id BIGINT UNSIGNED NULL,
    kilometraje_ingreso INT UNSIGNED NULL,
    combustible_codigo VARCHAR(20) NULL,
    fecha_salida_estimada DATE NULL,
    con_observaciones TINYINT(1) NOT NULL DEFAULT 0,
    detalle_observaciones TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ingresos_vehiculo_caso_fecha (caso_id, fecha_ingreso),
    KEY idx_ingresos_vehiculo_turno (turno_id),
    KEY idx_ingresos_vehiculo_vehiculo (vehiculo_id),
    CONSTRAINT fk_ingresos_vehiculo_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_ingresos_vehiculo_turno
        FOREIGN KEY (turno_id) REFERENCES turnos_reparacion (id),
    CONSTRAINT fk_ingresos_vehiculo_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
    CONSTRAINT fk_ingresos_vehiculo_recibido_por
        FOREIGN KEY (recibido_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_ingresos_vehiculo_persona_entrega
        FOREIGN KEY (persona_entrega_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ingreso_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ingreso_id BIGINT UNSIGNED NOT NULL,
    tipo_item_codigo VARCHAR(40) NOT NULL,
    detalle VARCHAR(255) NOT NULL,
    estado_codigo VARCHAR(30) NULL,
    referencia_media VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ingreso_items_ingreso (ingreso_id),
    CONSTRAINT fk_ingreso_items_ingreso
        FOREIGN KEY (ingreso_id) REFERENCES ingresos_vehiculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE egresos_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    ingreso_id BIGINT UNSIGNED NOT NULL,
    fecha_egreso DATETIME NOT NULL,
    entregado_por_usuario_id BIGINT UNSIGNED NOT NULL,
    persona_recibe_id BIGINT UNSIGNED NULL,
    egreso_definitivo TINYINT(1) NOT NULL DEFAULT 0,
    debe_reingresar TINYINT(1) NOT NULL DEFAULT 0,
    fecha_reingreso_prevista DATE NULL,
    dias_estimados_reingreso INT NULL,
    estado_reingreso_codigo VARCHAR(30) NULL,
    fotos_reparado_cargadas TINYINT(1) NOT NULL DEFAULT 0,
    notas TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_egresos_vehiculo_caso_fecha (caso_id, fecha_egreso),
    KEY idx_egresos_vehiculo_ingreso (ingreso_id),
    KEY idx_egresos_vehiculo_reingreso (debe_reingresar, fecha_reingreso_prevista),
    CONSTRAINT fk_egresos_vehiculo_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_egresos_vehiculo_ingreso
        FOREIGN KEY (ingreso_id) REFERENCES ingresos_vehiculo (id),
    CONSTRAINT fk_egresos_vehiculo_entregado_por
        FOREIGN KEY (entregado_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_egresos_vehiculo_persona_recibe
        FOREIGN KEY (persona_recibe_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tareas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NULL,
    modulo_origen_codigo VARCHAR(50) NOT NULL,
    subtab_origen_codigo VARCHAR(50) NULL,
    titulo VARCHAR(180) NOT NULL,
    descripcion TEXT NULL,
    fecha_limite DATETIME NULL,
    prioridad_codigo VARCHAR(20) NOT NULL DEFAULT 'media',
    estado_codigo VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    usuario_asignado_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    resuelta TINYINT(1) NOT NULL DEFAULT 0,
    resuelta_at DATETIME NULL,
    payload_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tareas_usuario_estado_fecha (usuario_asignado_id, estado_codigo, fecha_limite),
    KEY idx_tareas_caso_estado (caso_id, estado_codigo),
    KEY idx_tareas_creador (created_by),
    CONSTRAINT fk_tareas_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_tareas_usuario_asignado
        FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios (id),
    CONSTRAINT fk_tareas_creador
        FOREIGN KEY (created_by) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuestos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NOT NULL,
    fecha_presupuesto DATE NOT NULL,
    informe_estado_codigo VARCHAR(30) NOT NULL,
    mano_obra_sin_iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    alicuota_iva DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    mano_obra_iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    mano_obra_con_iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    repuestos_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_cotizado DECIMAL(12,2) NOT NULL DEFAULT 0,
    dias_estimados INT NULL,
    monto_minimo_cierre_mo DECIMAL(12,2) NULL,
    observaciones TEXT NULL,
    version_actual INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_presupuestos_caso (caso_id),
    KEY idx_presupuestos_organizacion_sucursal (organizacion_id, sucursal_id),
    CONSTRAINT fk_presupuestos_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_presupuestos_organizacion
        FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_presupuestos_sucursal
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuesto_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_id BIGINT UNSIGNED NOT NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    pieza_afectada VARCHAR(150) NOT NULL,
    tarea_codigo VARCHAR(50) NULL,
    nivel_danio_codigo VARCHAR(30) NULL,
    decision_repuesto_codigo VARCHAR(30) NULL,
    accion_codigo VARCHAR(50) NULL,
    requiere_reemplazo TINYINT(1) NOT NULL DEFAULT 0,
    valor_repuesto DECIMAL(12,2) NOT NULL DEFAULT 0,
    horas_estimadas DECIMAL(8,2) NULL,
    importe_mano_obra DECIMAL(12,2) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_presupuesto_items_presupuesto (presupuesto_id, orden_visual),
    CONSTRAINT fk_presupuesto_items_presupuesto
        FOREIGN KEY (presupuesto_id) REFERENCES presupuestos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categorias_documentales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    modulo_codigo VARCHAR(50) NOT NULL,
    tipo_tramite_id BIGINT UNSIGNED NULL,
    requiere_fecha TINYINT(1) NOT NULL DEFAULT 0,
    visible_cliente TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_documentales (codigo, modulo_codigo),
    KEY idx_categorias_documentales_tipo_tramite (tipo_tramite_id),
    CONSTRAINT fk_categorias_documentales_tipo_tramite
        FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE documentos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    extension VARCHAR(20) NULL,
    mime_type VARCHAR(120) NOT NULL,
    tamano_bytes BIGINT UNSIGNED NOT NULL,
    checksum_sha256 CHAR(64) NULL,
    categoria_id BIGINT UNSIGNED NOT NULL,
    subcategoria_codigo VARCHAR(50) NULL,
    fecha_documento DATE NULL,
    subido_por BIGINT UNSIGNED NULL,
    origen_codigo VARCHAR(50) NULL,
    observaciones VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_documentos_public_id (public_id),
    UNIQUE KEY uq_documentos_storage_key (storage_key),
    KEY idx_documentos_categoria (categoria_id),
    KEY idx_documentos_checksum (checksum_sha256),
    KEY idx_documentos_subido_por (subido_por),
    CONSTRAINT fk_documentos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_documentales (id),
    CONSTRAINT fk_documentos_subido_por
        FOREIGN KEY (subido_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comprobantes_emitidos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    tipo_comprobante_codigo VARCHAR(30) NOT NULL,
    numero_comprobante VARCHAR(60) NOT NULL,
    razon_social_receptor VARCHAR(200) NOT NULL,
    fecha_emision DATE NOT NULL,
    neto_gravado DECIMAL(12,2) NOT NULL DEFAULT 0,
    iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    firmado_conforme_en DATETIME NULL,
    notas TEXT NULL,
    documento_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comprobantes_emitidos_numero (tipo_comprobante_codigo, numero_comprobante),
    KEY idx_comprobantes_emitidos_caso_fecha (caso_id, fecha_emision),
    KEY idx_comprobantes_emitidos_documento (documento_id),
    CONSTRAINT fk_comprobantes_emitidos_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_comprobantes_emitidos_documento
        FOREIGN KEY (documento_id) REFERENCES documentos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE movimientos_financieros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    comprobante_id BIGINT UNSIGNED NULL,
    tipo_movimiento_codigo VARCHAR(40) NOT NULL,
    origen_flujo_codigo VARCHAR(40) NOT NULL,
    contraparte_tipo_codigo VARCHAR(30) NULL,
    contraparte_persona_id BIGINT UNSIGNED NULL,
    contraparte_compania_id BIGINT UNSIGNED NULL,
    fecha_movimiento DATETIME NOT NULL,
    monto_bruto DECIMAL(12,2) NOT NULL,
    monto_neto DECIMAL(12,2) NOT NULL,
    medio_pago_codigo VARCHAR(30) NULL,
    medio_pago_detalle VARCHAR(255) NULL,
    cancela_tipo_codigo VARCHAR(30) NULL,
    es_senia TINYINT(1) NOT NULL DEFAULT 0,
    es_bonificacion TINYINT(1) NOT NULL DEFAULT 0,
    motivo VARCHAR(255) NULL,
    referencia_externa VARCHAR(120) NULL,
    registrado_por BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_movimientos_financieros_caso_fecha (caso_id, fecha_movimiento),
    KEY idx_movimientos_financieros_persona (contraparte_persona_id),
    KEY idx_movimientos_financieros_compania (contraparte_compania_id),
    KEY idx_movimientos_financieros_registrado_por (registrado_por),
    KEY idx_movimientos_financieros_comprobante (comprobante_id),
    CONSTRAINT fk_movimientos_financieros_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_movimientos_financieros_comprobante
        FOREIGN KEY (comprobante_id) REFERENCES comprobantes_emitidos (id),
    CONSTRAINT fk_movimientos_financieros_persona
        FOREIGN KEY (contraparte_persona_id) REFERENCES personas (id),
    CONSTRAINT fk_movimientos_financieros_compania
        FOREIGN KEY (contraparte_compania_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_movimientos_financieros_registrado_por
        FOREIGN KEY (registrado_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE movimiento_retenciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    tipo_retencion_codigo VARCHAR(30) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    detalle VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_movimiento_retenciones (movimiento_id, tipo_retencion_codigo),
    CONSTRAINT fk_movimiento_retenciones_movimiento
        FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE movimiento_aplicaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    caso_id BIGINT UNSIGNED NULL,
    concepto_codigo VARCHAR(40) NOT NULL,
    entidad_tipo VARCHAR(60) NULL,
    entidad_id BIGINT UNSIGNED NULL,
    monto_aplicado DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_movimiento_aplicaciones_movimiento (movimiento_id),
    KEY idx_movimiento_aplicaciones_caso (caso_id),
    KEY idx_movimiento_aplicaciones_entidad (entidad_tipo, entidad_id),
    CONSTRAINT fk_movimiento_aplicaciones_movimiento
        FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros (id),
    CONSTRAINT fk_movimiento_aplicaciones_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE repuestos_caso (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    presupuesto_item_id BIGINT UNSIGNED NULL,
    trabajo_accesorio_id BIGINT UNSIGNED NULL,
    descripcion VARCHAR(200) NOT NULL,
    codigo_pieza VARCHAR(80) NULL,
    proveedor_final VARCHAR(150) NULL,
    autorizado_codigo VARCHAR(30) NULL,
    estado_codigo VARCHAR(30) NOT NULL,
    compra_por_codigo VARCHAR(30) NULL,
    pago_estado_codigo VARCHAR(30) NULL,
    precio_presupuestado DECIMAL(12,2) NULL,
    precio_final DECIMAL(12,2) NULL,
    fecha_recibido DATE NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    devuelto TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_repuestos_caso_caso_estado (caso_id, estado_codigo),
    KEY idx_repuestos_caso_presupuesto_item (presupuesto_item_id),
    CONSTRAINT fk_repuestos_caso_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_repuestos_caso_presupuesto_item
        FOREIGN KEY (presupuesto_item_id) REFERENCES presupuesto_items (id),
    CONSTRAINT chk_repuestos_caso_origen
        CHECK (
            NOT (presupuesto_item_id IS NOT NULL AND trabajo_accesorio_id IS NOT NULL)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE documento_relaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    documento_id BIGINT UNSIGNED NOT NULL,
    caso_id BIGINT UNSIGNED NULL,
    entidad_tipo VARCHAR(60) NOT NULL,
    entidad_id BIGINT UNSIGNED NOT NULL,
    modulo_codigo VARCHAR(50) NOT NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    visible_cliente TINYINT(1) NOT NULL DEFAULT 0,
    orden_visual INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_documento_relaciones (documento_id, entidad_tipo, entidad_id),
    KEY idx_documento_relaciones_caso (caso_id),
    KEY idx_documento_relaciones_entidad (entidad_tipo, entidad_id),
    CONSTRAINT fk_documento_relaciones_documento
        FOREIGN KEY (documento_id) REFERENCES documentos (id),
    CONSTRAINT fk_documento_relaciones_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_seguro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    compania_seguro_id BIGINT UNSIGNED NOT NULL,
    numero_poliza VARCHAR(80) NULL,
    numero_certificado VARCHAR(80) NULL,
    detalle_cobertura VARCHAR(255) NULL,
    compania_tercero_id BIGINT UNSIGNED NULL,
    numero_cleas VARCHAR(80) NULL,
    tramitador_caso_persona_id BIGINT UNSIGNED NULL,
    inspector_caso_persona_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_seguro_caso (caso_id),
    KEY idx_caso_seguro_compania (compania_seguro_id),
    CONSTRAINT fk_caso_seguro_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_seguro_compania
        FOREIGN KEY (compania_seguro_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_caso_seguro_compania_tercero
        FOREIGN KEY (compania_tercero_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_caso_seguro_tramitador
        FOREIGN KEY (tramitador_caso_persona_id) REFERENCES caso_personas (id),
    CONSTRAINT fk_caso_seguro_inspector
        FOREIGN KEY (inspector_caso_persona_id) REFERENCES caso_personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_tramitacion_seguro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_presentacion DATE NULL,
    fecha_derivado_inspeccion DATE NULL,
    modalidad_codigo VARCHAR(30) NULL,
    dictamen_codigo VARCHAR(30) NULL,
    cotizacion_estado_codigo VARCHAR(30) NULL,
    fecha_cotizacion DATE NULL,
    monto_acordado DECIMAL(12,2) NULL,
    monto_minimo_cierre DECIMAL(12,2) NULL,
    lleva_repuestos TINYINT(1) NOT NULL DEFAULT 0,
    autorizacion_repuestos_codigo VARCHAR(30) NULL,
    proveedor_repuestos_texto VARCHAR(150) NULL,
    monto_facturar_compania DECIMAL(12,2) NULL,
    monto_final_favor_taller DECIMAL(12,2) NULL,
    no_repara TINYINT(1) NOT NULL DEFAULT 0,
    admin_override_turno TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_tramitacion_seguro_caso (caso_id),
    CONSTRAINT fk_caso_tramitacion_seguro_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_franquicia (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    estado_franquicia_codigo VARCHAR(30) NULL,
    monto_franquicia DECIMAL(12,2) NULL,
    tipo_recupero_codigo VARCHAR(30) NULL,
    caso_asociado_id BIGINT UNSIGNED NULL,
    dictamen_franquicia_codigo VARCHAR(30) NULL,
    supera_franquicia TINYINT(1) NOT NULL DEFAULT 0,
    monto_recuperar DECIMAL(12,2) NULL,
    notas TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_franquicia_caso (caso_id),
    CONSTRAINT fk_caso_franquicia_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_franquicia_caso_asociado
        FOREIGN KEY (caso_asociado_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_cleas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    alcance_codigo VARCHAR(30) NULL,
    dictamen_codigo VARCHAR(30) NULL,
    monto_franquicia DECIMAL(12,2) NULL,
    monto_cargo_cliente DECIMAL(12,2) NULL,
    estado_pago_cliente_codigo VARCHAR(30) NULL,
    fecha_pago_cliente DATE NULL,
    monto_pago_compania_franquicia DECIMAL(12,2) NULL,
    estado_pago_compania_franquicia_codigo VARCHAR(30) NULL,
    fecha_pago_compania_franquicia DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_cleas_caso (caso_id),
    CONSTRAINT fk_caso_cleas_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_terceros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    compania_tercero_id BIGINT UNSIGNED NULL,
    referencia_reclamo VARCHAR(120) NULL,
    documentacion_estado_codigo VARCHAR(30) NULL,
    documentacion_aceptada TINYINT(1) NOT NULL DEFAULT 0,
    modo_provision_repuestos_codigo VARCHAR(30) NULL,
    monto_minimo_labor DECIMAL(12,2) NULL,
    monto_minimo_repuestos DECIMAL(12,2) NULL,
    subtotal_mejor_cotizacion DECIMAL(12,2) NULL,
    total_final_repuestos DECIMAL(12,2) NULL,
    monto_facturar_compania DECIMAL(12,2) NULL,
    monto_final_favor_taller DECIMAL(12,2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_terceros_caso (caso_id),
    CONSTRAINT fk_caso_terceros_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_terceros_compania
        FOREIGN KEY (compania_tercero_id) REFERENCES companias_seguro (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_legal (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    tramita_codigo VARCHAR(30) NULL,
    reclama_codigo VARCHAR(30) NULL,
    instancia_codigo VARCHAR(30) NULL,
    fecha_ingreso DATE NULL,
    cuij VARCHAR(80) NULL,
    juzgado VARCHAR(150) NULL,
    autos VARCHAR(200) NULL,
    abogado_contraparte VARCHAR(150) NULL,
    telefono_contraparte VARCHAR(50) NULL,
    email_contraparte VARCHAR(150) NULL,
    repara_vehiculo TINYINT(1) NOT NULL DEFAULT 0,
    cierre_por_codigo VARCHAR(30) NULL,
    fecha_cierre_legal DATE NULL,
    importe_total_expediente DECIMAL(12,2) NULL,
    observaciones TEXT NULL,
    notas_cierre TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_legal_caso (caso_id),
    CONSTRAINT fk_caso_legal_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE legal_novedades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    fecha_novedad DATE NOT NULL,
    detalle TEXT NOT NULL,
    notificar_cliente TINYINT(1) NOT NULL DEFAULT 0,
    notificado_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_legal_novedades_caso_legal_fecha (caso_legal_id, fecha_novedad),
    CONSTRAINT fk_legal_novedades_caso_legal
        FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE legal_gastos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha_gasto DATE NOT NULL,
    pagado_por_codigo VARCHAR(30) NULL,
    movimiento_financiero_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_legal_gastos_caso_legal_fecha (caso_legal_id, fecha_gasto),
    KEY idx_legal_gastos_movimiento (movimiento_financiero_id),
    CONSTRAINT fk_legal_gastos_caso_legal
        FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id),
    CONSTRAINT fk_legal_gastos_movimiento
        FOREIGN KEY (movimiento_financiero_id) REFERENCES movimientos_financieros (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE legal_rubros_cierre (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    rubro_codigo VARCHAR(40) NOT NULL,
    descripcion VARCHAR(200) NULL,
    monto_estimado DECIMAL(12,2) NULL,
    monto_acordado DECIMAL(12,2) NULL,
    observaciones VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_legal_rubros_cierre_caso_legal (caso_legal_id),
    CONSTRAINT fk_legal_rubros_cierre_caso_legal
        FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE recuperos_franquicia (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    gestiona_codigo VARCHAR(30) NULL,
    caso_base_id BIGINT UNSIGNED NULL,
    carpeta_base_codigo VARCHAR(50) NULL,
    dictamen_codigo VARCHAR(30) NULL,
    monto_acordado DECIMAL(12,2) NULL,
    monto_recuperar DECIMAL(12,2) NULL,
    habilita_reparacion TINYINT(1) NOT NULL DEFAULT 0,
    recupera_cliente TINYINT(1) NOT NULL DEFAULT 0,
    monto_cliente DECIMAL(12,2) NULL,
    estado_cobro_cliente_codigo VARCHAR(30) NULL,
    fecha_cobro_cliente DATE NULL,
    aprobado_menor_acuerdo TINYINT(1) NOT NULL DEFAULT 0,
    nota_aprobacion TEXT NULL,
    reutiliza_datos_base TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recuperos_franquicia_caso (caso_id),
    KEY idx_recuperos_franquicia_caso_base (caso_base_id),
    CONSTRAINT fk_recuperos_franquicia_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_recuperos_franquicia_caso_base
        FOREIGN KEY (caso_base_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notificaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    caso_id BIGINT UNSIGNED NULL,
    tipo_codigo VARCHAR(40) NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    mensaje TEXT NOT NULL,
    prioridad_codigo VARCHAR(20) NOT NULL DEFAULT 'media',
    leida_at DATETIME NULL,
    resuelta_at DATETIME NULL,
    payload_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notificaciones_usuario_estado (usuario_id, leida_at, resuelta_at),
    KEY idx_notificaciones_caso (caso_id),
    CONSTRAINT fk_notificaciones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_notificaciones_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auditoria_eventos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NULL,
    caso_id BIGINT UNSIGNED NULL,
    entidad_tipo VARCHAR(60) NOT NULL,
    entidad_id BIGINT UNSIGNED NULL,
    accion_codigo VARCHAR(60) NOT NULL,
    antes_json JSON NULL,
    despues_json JSON NULL,
    metadata_json JSON NULL,
    ip_origen VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_auditoria_eventos_caso_fecha (caso_id, created_at),
    KEY idx_auditoria_eventos_usuario_fecha (usuario_id, created_at),
    KEY idx_auditoria_eventos_entidad (entidad_tipo, entidad_id),
    KEY idx_auditoria_eventos_accion_fecha (accion_codigo, created_at),
    CONSTRAINT fk_auditoria_eventos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_auditoria_eventos_caso
        FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
