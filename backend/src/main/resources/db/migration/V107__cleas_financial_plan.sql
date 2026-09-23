CREATE TABLE cleas_financial_plans (
    caso_id BIGINT UNSIGNED NOT NULL,
    compania_facturable_id BIGINT UNSIGNED NULL,
    firma_conforme TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (caso_id),
    CONSTRAINT fk_cleas_financial_plans_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_cleas_financial_plans_compania FOREIGN KEY (compania_facturable_id) REFERENCES companias_seguro (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
