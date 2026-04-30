DROP TABLE IF EXISTS parametros_sistema;

CREATE TABLE parametros_sistema (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(80) NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato_codigo VARCHAR(40) NOT NULL,
    descripcion VARCHAR(255) NULL,
    editable TINYINT(1) NOT NULL DEFAULT 1,
    visible TINYINT(1) NOT NULL DEFAULT 1,
    modulo_codigo VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_parametros_sistema_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_dato_parametro (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_dato_parametro (codigo, nombre, activo) VALUES
('STRING', 'Texto', 1),
('NUMBER', 'Numero', 1),
('BOOLEAN', 'Booleano', 1),
('DATE', 'Fecha', 1),
('JSON', 'JSON', 1);

INSERT INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
(35, 'parametro.ver', 'Ver parametros', 'system', 'Permite consultar parametros del sistema'),
(36, 'parametro.editar', 'Editar parametros', 'system', 'Permite modificar parametros del sistema');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, TRUE
FROM permisos
WHERE codigo IN ('parametro.ver', 'parametro.editar');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, TRUE
FROM permisos
WHERE codigo IN ('parametro.ver', 'parametro.editar');

INSERT INTO parametros_sistema (codigo, valor, tipo_dato_codigo, descripcion, editable, visible, modulo_codigo) VALUES
('TASA_IVA_DEFAULT', '21.00', 'NUMBER', 'Tasa de IVA por defecto', 1, 1, 'GENERAL'),
('DIAS_PAGO_ESPERADOS_DEFAULT', '30', 'NUMBER', 'Dias de pago esperados por defecto', 1, 1, 'GENERAL'),
('REQUIERE_FOTOS_REPARADO_DEFAULT', 'false', 'BOOLEAN', 'Requiere fotos del vehiculo reparado por defecto', 1, 1, 'GENERAL'),
('PREFIJO_CARPETA_DEFAULT', 'TZ', 'STRING', 'Prefijo de carpeta por defecto', 1, 1, 'GENERAL');
