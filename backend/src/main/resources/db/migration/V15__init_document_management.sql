CREATE TABLE categorias_documentales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    modulo_codigo VARCHAR(50) NOT NULL,
    tipo_tramite_id BIGINT UNSIGNED NULL,
    requiere_fecha TINYINT(1) NOT NULL DEFAULT 0,
    visible_cliente TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_documentales_codigo_modulo (codigo, modulo_codigo),
    CONSTRAINT fk_categorias_documentales_tipo_tramite FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE documentos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    extension VARCHAR(20) NULL,
    mime_type VARCHAR(120) NOT NULL,
    tamano_bytes BIGINT UNSIGNED NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    categoria_id BIGINT UNSIGNED NOT NULL,
    subcategoria_codigo VARCHAR(50) NULL,
    fecha_documento DATE NULL,
    subido_por BIGINT UNSIGNED NOT NULL,
    origen_codigo VARCHAR(50) NOT NULL,
    observaciones TEXT NULL,
    reemplaza_documento_id BIGINT UNSIGNED NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_documentos_public_id (public_id),
    UNIQUE KEY uq_documentos_storage_key (storage_key),
    KEY idx_documentos_checksum (checksum_sha256),
    KEY idx_documentos_categoria (categoria_id),
    CONSTRAINT fk_documentos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_documentales (id),
    CONSTRAINT fk_documentos_subido_por FOREIGN KEY (subido_por) REFERENCES usuarios (id),
    CONSTRAINT fk_documentos_reemplaza_documento FOREIGN KEY (reemplaza_documento_id) REFERENCES documentos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE documento_relaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    documento_id BIGINT UNSIGNED NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    entidad_tipo VARCHAR(60) NOT NULL,
    entidad_id BIGINT UNSIGNED NOT NULL,
    modulo_codigo VARCHAR(50) NOT NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    visible_cliente TINYINT(1) NOT NULL DEFAULT 0,
    orden_visual INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_documento_relaciones_documento_entidad (documento_id, entidad_tipo, entidad_id),
    KEY idx_documento_relaciones_caso (caso_id),
    KEY idx_documento_relaciones_entidad (entidad_tipo, entidad_id),
    CONSTRAINT fk_documento_relaciones_documento FOREIGN KEY (documento_id) REFERENCES documentos (id) ON DELETE CASCADE,
    CONSTRAINT fk_documento_relaciones_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO categorias_documentales (codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo)
VALUES
('ORDEN_INGRESO', 'Orden de ingreso', 'OPERACION', NULL, 1, 1, 1),
('FOTO_DANO', 'Foto de dano', 'OPERACION', NULL, 0, 1, 1),
('PRESUPUESTO', 'Presupuesto', 'FINANZAS', NULL, 1, 1, 1),
('INFORME_INTERNO', 'Informe interno', 'OPERACION', NULL, 0, 0, 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
VALUES
('documento.ver', 'Ver documentos', 'documents', 'Permite consultar documentos y relaciones'),
('documento.subir', 'Subir documentos', 'documents', 'Permite cargar documentos al repositorio'),
('documento.relacionar', 'Relacionar documentos', 'documents', 'Permite vincular documentos con entidades del dominio');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1
FROM permisos
WHERE codigo IN ('documento.ver', 'documento.subir', 'documento.relacionar');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1
FROM permisos
WHERE codigo IN ('documento.ver', 'documento.subir', 'documento.relacionar');
