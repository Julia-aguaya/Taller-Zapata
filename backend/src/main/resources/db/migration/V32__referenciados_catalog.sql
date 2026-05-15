CREATE TABLE referenciados (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    nombre VARCHAR(180) NOT NULL,
    telefono VARCHAR(60) NULL,
    email VARCHAR(150) NULL,
    observaciones TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_referenciados_public_id (public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
SELECT 'referenciado.ver', 'Ver referenciados', 'reference', 'Permite consultar el catalogo de referenciados'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo = 'referenciado.ver');

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
SELECT 'referenciado.gestionar', 'Gestionar referenciados', 'reference', 'Permite crear y editar referenciados'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo = 'referenciado.gestionar');

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, p.id, 1 FROM permisos p WHERE p.codigo IN ('referenciado.ver', 'referenciado.gestionar');

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, p.id, 1 FROM permisos p WHERE p.codigo IN ('referenciado.ver');
