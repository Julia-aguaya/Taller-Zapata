-- Datos reservados exclusivamente para E2E. Requiere que Flyway haya aplicado
-- todas las migraciones del backend en la base taller_zapata_e2e.
START TRANSACTION;

DELETE FROM caso_cleas WHERE caso_id BETWEEN 9501 AND 9504;
DELETE FROM caso_tramitacion_seguro WHERE caso_id BETWEEN 9501 AND 9504;
DELETE FROM caso_seguro WHERE caso_id BETWEEN 9501 AND 9504;
DELETE FROM caso_siniestro WHERE caso_id BETWEEN 9501 AND 9504;
DELETE FROM caso_personas WHERE caso_id BETWEEN 9501 AND 9504;
DELETE FROM caso_vehiculos WHERE caso_id BETWEEN 9501 AND 9504;
DELETE FROM casos WHERE id BETWEEN 9501 AND 9504;
DELETE FROM vehiculo_personas WHERE vehiculo_id BETWEEN 9961 AND 9964;
DELETE FROM vehiculos WHERE id BETWEEN 9961 AND 9964;
DELETE FROM personas WHERE id BETWEEN 9951 AND 9954;
DELETE FROM companias_seguro WHERE id = 9971;

SET @organization_id = (SELECT id FROM organizaciones WHERE codigo = 'TZ');
SET @branch_id = (SELECT id FROM sucursales WHERE organizacion_id = @organization_id AND codigo = 'Z');
SET @case_type_id = (SELECT id FROM tipos_tramite WHERE codigo = 'CLEAS');
SET @creator_id = (SELECT id FROM usuarios WHERE username = 'demo_admin');
SET @tramite_state_id = (SELECT id FROM workflow_estados WHERE dominio = 'tramite' AND codigo = 'EN_TRAMITE');
SET @repair_state_id = (SELECT id FROM workflow_estados WHERE dominio = 'reparacion' AND codigo = 'SIN_TURNO');
SET @payment_state_id = (SELECT id FROM workflow_estados WHERE dominio = 'pago' AND codigo = 'PENDIENTE');
SET @documentation_state_id = (SELECT id FROM workflow_estados WHERE dominio = 'documentacion' AND codigo = 'PENDIENTE_DOCS');
SET @legal_state_id = (SELECT id FROM workflow_estados WHERE dominio = 'legal' AND codigo = 'SIN_GESTION');

INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, email_principal, activo) VALUES
    (9951, '00000000-0000-0000-0000-000000009951', 'fisica', 'E2E', 'Danio Total Favor', 'E2E Danio Total Favor', 'DNI', '40995001', '40995001', 'e2e.total.favor@example.test', 1),
    (9952, '00000000-0000-0000-0000-000000009952', 'fisica', 'E2E', 'Danio Total Contra', 'E2E Danio Total Contra', 'DNI', '40995002', '40995002', 'e2e.total.contra@example.test', 1),
    (9953, '00000000-0000-0000-0000-000000009953', 'fisica', 'E2E', 'Franquicia Favor', 'E2E Franquicia Favor', 'DNI', '40995003', '40995003', 'e2e.franquicia.favor@example.test', 1),
    (9954, '00000000-0000-0000-0000-000000009954', 'fisica', 'E2E', 'Franquicia Contra', 'E2E Franquicia Contra', 'DNI', '40995004', '40995004', 'e2e.franquicia.contra@example.test', 1);

INSERT INTO vehiculos (id, public_id, marca_texto, modelo_texto, dominio, dominio_normalizado, anio, color, activo) VALUES
    (9961, '00000000-0000-0000-0000-000000009961', 'E2E', 'Total Favor', 'E2E501', 'E2E501', 2024, 'Azul', 1),
    (9962, '00000000-0000-0000-0000-000000009962', 'E2E', 'Total Contra', 'E2E502', 'E2E502', 2024, 'Rojo', 1),
    (9963, '00000000-0000-0000-0000-000000009963', 'E2E', 'Franquicia Favor', 'E2E503', 'E2E503', 2024, 'Verde', 1),
    (9964, '00000000-0000-0000-0000-000000009964', 'E2E', 'Franquicia Contra', 'E2E504', 'E2E504', 2024, 'Gris', 1);

INSERT INTO vehiculo_personas (vehiculo_id, persona_id, rol_vehiculo_codigo, es_actual, desde) VALUES
    (9961, 9951, 'TITULAR', 1, '2026-01-01'),
    (9962, 9952, 'TITULAR', 1, '2026-01-01'),
    (9963, 9953, 'TITULAR', 1, '2026-01-01'),
    (9964, 9954, 'TITULAR', 1, '2026-01-01');

INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, activo) VALUES
    (9971, '00000000-0000-0000-0000-000000009971', 'E2E_ASEGURADORA', 'Aseguradora E2E', '30-99999999-9', 1);

INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo, observaciones_generales) VALUES
    (9501, '00000000-0000-0000-0000-000000009501', 'E2E-DT-AF', 9501, @case_type_id, @organization_id, @branch_id, 9961, 9951, @creator_id, @tramite_state_id, @repair_state_id, @payment_state_id, @documentation_state_id, @legal_state_id, 'MEDIA', 'E2E CLEAS: dano total A_FAVOR.'),
    (9502, '00000000-0000-0000-0000-000000009502', 'E2E-DT-EC', 9502, @case_type_id, @organization_id, @branch_id, 9962, 9952, @creator_id, @tramite_state_id, @repair_state_id, @payment_state_id, @documentation_state_id, @legal_state_id, 'MEDIA', 'E2E CLEAS: dano total EN_CONTRA.'),
    (9503, '00000000-0000-0000-0000-000000009503', 'E2E-FR-AF', 9503, @case_type_id, @organization_id, @branch_id, 9963, 9953, @creator_id, @tramite_state_id, @repair_state_id, @payment_state_id, @documentation_state_id, @legal_state_id, 'MEDIA', 'E2E CLEAS: franquicia A_FAVOR.'),
    (9504, '00000000-0000-0000-0000-000000009504', 'E2E-FR-EC', 9504, @case_type_id, @organization_id, @branch_id, 9964, 9954, @creator_id, @tramite_state_id, @repair_state_id, @payment_state_id, @documentation_state_id, @legal_state_id, 'MEDIA', 'E2E CLEAS: franquicia EN_CONTRA.');

INSERT INTO caso_personas (caso_id, persona_id, rol_caso_codigo, es_principal) VALUES
    (9501, 9951, 'CLIENTE', 1), (9502, 9952, 'CLIENTE', 1), (9503, 9953, 'CLIENTE', 1), (9504, 9954, 'CLIENTE', 1);

INSERT INTO caso_vehiculos (caso_id, vehiculo_id, rol_vehiculo_codigo, es_principal, orden_visual) VALUES
    (9501, 9961, 'PRINCIPAL', 1, 1), (9502, 9962, 'PRINCIPAL', 1, 1), (9503, 9963, 'PRINCIPAL', 1, 1), (9504, 9964, 'PRINCIPAL', 1, 1);

INSERT INTO caso_siniestro (caso_id, fecha_siniestro, lugar, dinamica, observaciones) VALUES
    (9501, '2026-01-10', 'Rosario', 'Caso E2E dano total a favor.', 'Semilla E2E.'),
    (9502, '2026-01-11', 'Rosario', 'Caso E2E dano total en contra.', 'Semilla E2E.'),
    (9503, '2026-01-12', 'Rosario', 'Caso E2E franquicia a favor.', 'Semilla E2E.'),
    (9504, '2026-01-13', 'Rosario', 'Caso E2E franquicia en contra.', 'Semilla E2E.');

INSERT INTO caso_seguro (caso_id, compania_seguro_id, numero_poliza, detalle_cobertura, numero_cleas) VALUES
    (9501, 9971, 'E2E-9501', 'CLEAS dano total.', 'E2E-CLEAS-9501'),
    (9502, 9971, 'E2E-9502', 'CLEAS dano total.', 'E2E-CLEAS-9502'),
    (9503, 9971, 'E2E-9503', 'CLEAS franquicia.', 'E2E-CLEAS-9503'),
    (9504, 9971, 'E2E-9504', 'CLEAS franquicia.', 'E2E-CLEAS-9504');

INSERT INTO caso_tramitacion_seguro (caso_id, fecha_presentacion, modalidad_codigo, dictamen_codigo, cotizacion_estado_codigo, monto_acordado, lleva_repuestos, no_repara, admin_override_turno, version) VALUES
    (9501, '2026-01-10', 'POR_FOTOS', 'APROBADO', 'ACEPTADA', 1000000.00, 0, 1, 0, 0),
    (9502, '2026-01-11', 'POR_FOTOS', 'RECHAZADO', 'ACEPTADA', 1000000.00, 0, 1, 0, 0),
    (9503, '2026-01-12', 'POR_FOTOS', 'APROBADO', 'ACEPTADA', 800000.00, 0, 0, 0, 0),
    (9504, '2026-01-13', 'POR_FOTOS', 'RECHAZADO', 'ACEPTADA', 800000.00, 0, 0, 0, 0);

INSERT INTO caso_cleas (caso_id, alcance_codigo, dictamen_codigo, monto_franquicia, monto_cargo_cliente, estado_pago_cliente_codigo, monto_pago_compania_franquicia, estado_pago_compania_franquicia_codigo) VALUES
    (9501, 'DANIO_TOTAL', 'A_FAVOR', 0.00, 0.00, 'NO_APLICA', 0.00, 'NO_APLICA'),
    (9502, 'DANIO_TOTAL', 'EN_CONTRA', 0.00, 0.00, 'NO_APLICA', 0.00, 'NO_APLICA'),
    (9503, 'FRANQUICIA', 'A_FAVOR', 250000.00, 0.00, 'NO_APLICA', 250000.00, 'PENDIENTE'),
    (9504, 'FRANQUICIA', 'EN_CONTRA', 250000.00, 150000.00, 'PENDIENTE', 100000.00, 'PENDIENTE');

COMMIT;
