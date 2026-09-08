-- Parte 5 Reclamo de Terceros: titularidad registral, lesionados del abogado,
-- Suma Taller en gastos legales y re-alineacion de catalogos legales con el negocio.

-- 1) Porcentaje de titularidad registral por persona del caso (roles TITULAR: 100 o 50)
ALTER TABLE caso_personas ADD COLUMN porcentaje_titularidad INT NULL;

-- 2) Suma Taller en gastos legales (NULL = sin responder, 1 = SI, 0 = NO)
ALTER TABLE legal_gastos ADD COLUMN suma_taller TINYINT(1) NULL;

-- 3) Lesionados del expediente del abogado
CREATE TABLE tipos_lesionado_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_legal_lesionados (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    lesionado_es_codigo VARCHAR(40) NULL,
    persona_id BIGINT UNSIGNED NULL,
    nombre VARCHAR(150) NULL,
    documento VARCHAR(50) NULL,
    acredita_ingresos TINYINT(1) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_lesionados_caso_legal FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id) ON DELETE CASCADE,
    CONSTRAINT fk_lesionados_tipo FOREIGN KEY (lesionado_es_codigo) REFERENCES tipos_lesionado_legal (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_lesionado_legal (codigo, nombre, activo) VALUES
('TITULAR_REGISTRAL', 'Titular registral', 1),
('CLIENTE', 'Cliente', 1),
('OTRO', 'Otro', 1);

-- 4) Catalogos legales alineados al negocio:
--    TRAMITA = instrumento (Con Poder / Con Patrocinio)
INSERT INTO quienes_tramitan_legal (codigo, nombre, activo) VALUES
('CON_PODER', 'Con Poder', 1),
('CON_PATROCINIO', 'Con Patrocinio', 1);
UPDATE quienes_tramitan_legal SET activo = 0 WHERE codigo IN ('ABOGADO', 'TALLER', 'CLIENTE');

--    RECLAMA = objeto del reclamo (danio material / lesiones / franquicia)
INSERT INTO quienes_reclaman_legal (codigo, nombre, activo) VALUES
('DANIO_MATERIAL', 'Daño material', 1),
('DANIO_MATERIAL_LESIONES', 'Daño material y lesiones', 1),
('FRANQUICIA', 'Franquicia', 1),
('FRANQUICIA_LESIONES', 'Franquicia y lesiones', 1);
UPDATE quienes_reclaman_legal SET activo = 0 WHERE codigo IN ('CLIENTE', 'TALLER', 'TERCERO', 'COMPANIA');

--    CIERRE POR = pendiente / conciliacion / sentencia / desistimiento
INSERT INTO cierre_por_legal (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('CONCILIACION', 'Conciliación', 1);
UPDATE cierre_por_legal SET activo = 0 WHERE codigo IN ('ACUERDO', 'CADUCIDAD');

--    INSTANCIA = administrativa / judicial (arbitraje y mediacion fuera del alcance)
UPDATE instancias_legal SET activo = 0 WHERE codigo IN ('ARBITRAJE', 'MEDIACION');
