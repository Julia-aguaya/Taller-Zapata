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
    UNIQUE KEY uq_usuarios_email (email)
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
    UNIQUE KEY uq_roles_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE permisos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    modulo VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_permisos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE rol_permisos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rol_id BIGINT UNSIGNED NOT NULL,
    permiso_id BIGINT UNSIGNED NOT NULL,
    allow_flag TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rol_permisos (rol_id, permiso_id),
    CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id)
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
    CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_usuario_roles_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_usuario_roles_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO roles (codigo, nombre, descripcion, system_role)
VALUES
('ROLE_ADMIN', 'Administrador', 'Acceso total al sistema', 1),
('ROLE_OPERADOR', 'Operador', 'Operacion general del taller', 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
VALUES
('caso.ver', 'Ver casos', 'casefile', 'Permite consultar expedientes'),
('caso.crear', 'Crear casos', 'casefile', 'Permite crear expedientes'),
('workflow.transicionar', 'Transicionar workflow', 'workflow', 'Permite cambiar estados'),
('auditoria.ver', 'Ver auditoria', 'audit', 'Permite consultar auditoria');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
VALUES
(1, 1, 1),
(1, 2, 1),
(1, 3, 1),
(1, 4, 1),
(2, 1, 1),
(2, 2, 1),
(2, 3, 1);

INSERT INTO usuarios (public_id, username, email, password_hash, nombre, apellido, telefono)
VALUES ('00000000-0000-0000-0000-000000000100', 'admin', 'admin@tallerzapata.local', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'Bootstrap', '3410000000');

INSERT INTO usuario_roles (usuario_id, rol_id, organizacion_id, sucursal_id)
VALUES (1, 1, 1, NULL);
