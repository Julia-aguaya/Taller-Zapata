CREATE TABLE roles_contacto_compania (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modalidades_tramitacion_seguro (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dictamenes_tramitacion_seguro (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_cotizacion_seguro (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE autorizaciones_repuestos_seguro (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_franquicia (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_recupero_franquicia (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dictamenes_franquicia (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE companias_seguro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(180) NOT NULL,
    cuit VARCHAR(20) NULL,
    requiere_fotos_reparado TINYINT(1) NOT NULL DEFAULT 0,
    dias_pago_esperados INT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_companias_seguro_public_id (public_id),
    UNIQUE KEY uq_companias_seguro_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE companias_contactos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    compania_id BIGINT UNSIGNED NOT NULL,
    persona_id BIGINT UNSIGNED NOT NULL,
    rol_contacto_codigo VARCHAR(40) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_companias_contactos (compania_id, persona_id, rol_contacto_codigo),
    CONSTRAINT fk_companias_contactos_compania FOREIGN KEY (compania_id) REFERENCES companias_seguro (id) ON DELETE CASCADE,
    CONSTRAINT fk_companias_contactos_persona FOREIGN KEY (persona_id) REFERENCES personas (id),
    CONSTRAINT fk_companias_contactos_rol FOREIGN KEY (rol_contacto_codigo) REFERENCES roles_contacto_compania (codigo)
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
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_seguro_caso (caso_id),
    CONSTRAINT fk_caso_seguro_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_caso_seguro_compania FOREIGN KEY (compania_seguro_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_caso_seguro_compania_tercero FOREIGN KEY (compania_tercero_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_caso_seguro_tramitador FOREIGN KEY (tramitador_caso_persona_id) REFERENCES caso_personas (id),
    CONSTRAINT fk_caso_seguro_inspector FOREIGN KEY (inspector_caso_persona_id) REFERENCES caso_personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_tramitacion_seguro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_presentacion DATE NULL,
    fecha_derivado_inspeccion DATE NULL,
    modalidad_codigo VARCHAR(40) NULL,
    dictamen_codigo VARCHAR(40) NULL,
    cotizacion_estado_codigo VARCHAR(40) NULL,
    fecha_cotizacion DATE NULL,
    monto_acordado DECIMAL(14,2) NULL,
    monto_minimo_cierre DECIMAL(14,2) NULL,
    lleva_repuestos TINYINT(1) NOT NULL DEFAULT 0,
    autorizacion_repuestos_codigo VARCHAR(40) NULL,
    proveedor_repuestos_texto VARCHAR(255) NULL,
    monto_facturar_compania DECIMAL(14,2) NULL,
    monto_final_favor_taller DECIMAL(14,2) NULL,
    no_repara TINYINT(1) NOT NULL DEFAULT 0,
    admin_override_turno TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_tramitacion_seguro_caso (caso_id),
    CONSTRAINT fk_caso_tramitacion_seguro_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_caso_tramitacion_seguro_modalidad FOREIGN KEY (modalidad_codigo) REFERENCES modalidades_tramitacion_seguro (codigo),
    CONSTRAINT fk_caso_tramitacion_seguro_dictamen FOREIGN KEY (dictamen_codigo) REFERENCES dictamenes_tramitacion_seguro (codigo),
    CONSTRAINT fk_caso_tramitacion_seguro_cotizacion FOREIGN KEY (cotizacion_estado_codigo) REFERENCES estados_cotizacion_seguro (codigo),
    CONSTRAINT fk_caso_tramitacion_seguro_autorizacion FOREIGN KEY (autorizacion_repuestos_codigo) REFERENCES autorizaciones_repuestos_seguro (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_franquicia (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    estado_franquicia_codigo VARCHAR(40) NULL,
    monto_franquicia DECIMAL(14,2) NULL,
    tipo_recupero_codigo VARCHAR(40) NULL,
    caso_asociado_id BIGINT UNSIGNED NULL,
    dictamen_franquicia_codigo VARCHAR(40) NULL,
    supera_franquicia TINYINT(1) NOT NULL DEFAULT 0,
    monto_recuperar DECIMAL(14,2) NULL,
    notas TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_franquicia_caso (caso_id),
    CONSTRAINT fk_caso_franquicia_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_caso_franquicia_asociado FOREIGN KEY (caso_asociado_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_franquicia_estado FOREIGN KEY (estado_franquicia_codigo) REFERENCES estados_franquicia (codigo),
    CONSTRAINT fk_caso_franquicia_tipo_recupero FOREIGN KEY (tipo_recupero_codigo) REFERENCES tipos_recupero_franquicia (codigo),
    CONSTRAINT fk_caso_franquicia_dictamen FOREIGN KEY (dictamen_franquicia_codigo) REFERENCES dictamenes_franquicia (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO roles_contacto_compania (codigo, nombre, activo) VALUES
('TRAMITADOR', 'Tramitador', 1),
('INSPECTOR', 'Inspector', 1),
('COBRANZA', 'Cobranza', 1);

INSERT INTO modalidades_tramitacion_seguro (codigo, nombre, activo) VALUES
('CONVENIO', 'Convenio', 1),
('INSPECCION', 'Inspeccion', 1),
('EXPRESS', 'Express', 1);

INSERT INTO dictamenes_tramitacion_seguro (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('APROBADO', 'Aprobado', 1),
('RECHAZADO', 'Rechazado', 1);

INSERT INTO estados_cotizacion_seguro (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('ENVIADA', 'Enviada', 1),
('ACEPTADA', 'Aceptada', 1),
('RECHAZADA', 'Rechazada', 1);

INSERT INTO autorizaciones_repuestos_seguro (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('AUTORIZADO', 'Autorizado', 1),
('RECHAZADO', 'Rechazado', 1);

INSERT INTO estados_franquicia (codigo, nombre, activo) VALUES
('SIN_DEFINIR', 'Sin definir', 1),
('COBRAR_CLIENTE', 'Cobrar al cliente', 1),
('RECUPERAR', 'Recuperar', 1),
('CERRADA', 'Cerrada', 1);

INSERT INTO tipos_recupero_franquicia (codigo, nombre, activo) VALUES
('NINGUNO', 'Ninguno', 1),
('CLIENTE', 'Cliente', 1),
('TERCERO', 'Tercero', 1);

INSERT INTO dictamenes_franquicia (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('PROCEDE', 'Procede', 1),
('NO_PROCEDE', 'No procede', 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion) VALUES
('seguro.ver', 'Ver seguros', 'insurance', 'Permite consultar companias y extensiones del caso'),
('seguro.crear', 'Crear seguros', 'insurance', 'Permite registrar companias y datos de seguro');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1 FROM permisos WHERE codigo IN ('seguro.ver', 'seguro.crear');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1 FROM permisos WHERE codigo IN ('seguro.ver', 'seguro.crear');
