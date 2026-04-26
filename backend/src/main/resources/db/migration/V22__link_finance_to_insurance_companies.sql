ALTER TABLE movimientos_financieros
ADD CONSTRAINT fk_movimientos_financieros_compania
FOREIGN KEY (contraparte_compania_id) REFERENCES companias_seguro(id);
