CREATE TABLE feriados (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fecha DATE NOT NULL,
    descripcion VARCHAR(200) NULL,
    tipo_codigo VARCHAR(40) NOT NULL DEFAULT 'NACIONAL',
    PRIMARY KEY (id),
    UNIQUE KEY uq_feriados_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO feriados (fecha, descripcion, tipo_codigo) VALUES
('2026-01-01', 'Anio Nuevo', 'NACIONAL'),
('2026-05-01', 'Dia del Trabajador', 'NACIONAL'),
('2026-05-25', 'Revolucion de Mayo', 'NACIONAL'),
('2026-07-09', 'Dia de la Independencia', 'NACIONAL'),
('2026-12-25', 'Navidad', 'NACIONAL');
