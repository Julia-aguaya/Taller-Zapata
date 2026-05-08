-- Seed local/dev para taller_zapata.
-- Objetivo: poblar datos utiles para frontend sin cargar a mano.
-- Requiere esquema migrado con Flyway hasta V30.

USE taller_zapata;

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- Limpieza idempotente de los registros de esta semilla.
-- Solo toca IDs reservados en el rango 9000+.
-- ---------------------------------------------------------------------------

DELETE FROM notificaciones WHERE id IN (9971, 9972, 9973);

DELETE FROM legal_gastos WHERE id IN (9921, 9922);
DELETE FROM legal_novedades WHERE id IN (9911, 9912);
DELETE FROM recuperos_franquicia WHERE id IN (9901);

DELETE FROM movimiento_aplicaciones WHERE id IN (9891, 9892);
DELETE FROM movimiento_retenciones WHERE id IN (9881, 9882, 9883);
DELETE FROM movimientos_financieros WHERE id IN (9871, 9872, 9873);
DELETE FROM comprobantes_emitidos WHERE id IN (9861, 9862);

DELETE FROM documento_relaciones WHERE id IN (9851, 9852, 9853, 9854);
DELETE FROM documentos WHERE id IN (9841, 9842, 9843, 9844);

DELETE FROM repuestos_caso WHERE id IN (9831, 9832, 9833, 9834);
DELETE FROM presupuesto_items WHERE id IN (9821, 9822, 9823, 9824, 9825, 9826, 9827);
DELETE FROM presupuestos WHERE id IN (9811, 9812, 9813, 9814);

DELETE FROM egresos_vehiculo WHERE id IN (9803);
DELETE FROM ingreso_items WHERE id IN (9804, 9805);
DELETE FROM ingresos_vehiculo WHERE id IN (9802);
DELETE FROM turnos_reparacion WHERE id IN (9801, 9806);

DELETE FROM tareas WHERE id IN (9791, 9792, 9793, 9794);

DELETE FROM caso_legal WHERE id IN (9781);
DELETE FROM caso_cleas WHERE id IN (9771);
DELETE FROM caso_terceros WHERE id IN (9761);
DELETE FROM caso_franquicia WHERE id IN (9751);
DELETE FROM caso_tramitacion_seguro WHERE id IN (9741, 9742);
DELETE FROM caso_seguro WHERE id IN (9731, 9732);
DELETE FROM companias_contactos WHERE id IN (9721, 9722, 9723);

DELETE FROM caso_estado_historial
WHERE id BETWEEN 9601 AND 9643;

DELETE FROM caso_relaciones WHERE id IN (9591);
DELETE FROM caso_siniestro WHERE id IN (9581, 9582, 9583, 9584, 9585);
DELETE FROM caso_vehiculos WHERE id IN (9571, 9572, 9573, 9574, 9575);
DELETE FROM caso_personas WHERE id IN (9561, 9562, 9563, 9564, 9565, 9566);
DELETE FROM casos WHERE id IN (9401, 9402, 9403, 9404, 9405);

DELETE FROM vehiculo_personas WHERE id IN (9551, 9552, 9553, 9554, 9555);
DELETE FROM persona_domicilios WHERE id IN (9541, 9542, 9543, 9544, 9545, 9546, 9547, 9548, 9549);
DELETE FROM persona_contactos WHERE id IN (9531, 9532, 9533, 9534, 9535, 9536, 9537, 9538, 9539, 9540);
DELETE FROM vehiculos WHERE id IN (9301, 9302, 9303, 9304, 9305);
DELETE FROM personas WHERE id IN (9201, 9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209);

DELETE FROM modelos_vehiculo WHERE id IN (9111, 9112, 9113, 9114, 9115);
DELETE FROM marcas_vehiculo WHERE id IN (9101, 9102, 9103, 9104, 9105);
DELETE FROM companias_seguro WHERE id IN (9701, 9702, 9703);

-- ---------------------------------------------------------------------------
-- Catalogos minimos utiles para autocomplete de vehiculos.
-- ---------------------------------------------------------------------------

INSERT INTO marcas_vehiculo (id, codigo, nombre, activo) VALUES
    (9101, 'CHEVROLET', 'Chevrolet', 1),
    (9102, 'PEUGEOT', 'Peugeot', 1),
    (9103, 'VOLKSWAGEN', 'Volkswagen', 1),
    (9104, 'TOYOTA', 'Toyota', 1),
    (9105, 'FORD', 'Ford', 1);

INSERT INTO modelos_vehiculo (id, marca_id, codigo, nombre, activo) VALUES
    (9111, 9101, 'ONIX', 'Onix', 1),
    (9112, 9102, '208', '208', 1),
    (9113, 9103, 'NIVUS', 'Nivus', 1),
    (9114, 9104, 'COROLLA', 'Corolla', 1),
    (9115, 9105, 'RANGER', 'Ranger', 1);

-- ---------------------------------------------------------------------------
-- Personas base: clientes y contactos de companias.
-- ---------------------------------------------------------------------------

INSERT INTO personas (
    id, public_id, tipo_persona, nombre, apellido, razon_social, nombre_mostrar,
    tipo_documento_codigo, numero_documento, numero_documento_normalizado,
    cuit_cuil, fecha_nacimiento, telefono_principal, email_principal, ocupacion,
    observaciones, activo
) VALUES
    (9201, '00000000-0000-0000-0000-000000009201', 'fisica', 'Juan', 'Perez', NULL, 'Juan Perez', 'DNI', '30111222', '30111222', NULL, '1984-02-10', '3415551001', 'juan.perez@demo.local', 'Comerciante', 'Cliente de caso particular cerrado.', 1),
    (9202, '00000000-0000-0000-0000-000000009202', 'fisica', 'Laura', 'Costa', NULL, 'Laura Costa', 'DNI', '27111444', '27111444', NULL, '1988-11-02', '3415551002', 'laura.costa@demo.local', 'Disenadora', 'Cliente de todo riesgo en gestion.', 1),
    (9203, '00000000-0000-0000-0000-000000009203', 'fisica', 'Luciana', 'Segura', NULL, 'Luciana Segura', 'DNI', '28999888', '28999888', NULL, '1986-06-14', '3415551003', 'luciana.segura@aseguradora.local', 'Tramitadora', 'Contacto de compania para casos con seguro.', 1),
    (9204, '00000000-0000-0000-0000-000000009204', 'fisica', 'Martin', 'Peralta', NULL, 'Martin Peralta', 'DNI', '30000111', '30000111', NULL, '1981-09-21', '3415551004', 'martin.peralta@aseguradora.local', 'Inspector', 'Inspector asignado por compania.', 1),
    (9205, '00000000-0000-0000-0000-000000009205', 'fisica', 'Diego', 'Fernandez', NULL, 'Diego Fernandez', 'DNI', '32555444', '32555444', NULL, '1991-03-17', '3415551005', 'diego.fernandez@demo.local', 'Contador', 'Cliente de caso CLEAS.', 1),
    (9206, '00000000-0000-0000-0000-000000009206', 'fisica', 'Sofia', 'Benitez', NULL, 'Sofia Benitez', 'DNI', '29444777', '29444777', NULL, '1987-12-09', '3415551006', 'sofia.benitez@demo.local', 'Administrativa', 'Cliente de reclamo con abogado.', 1),
    (9207, '00000000-0000-0000-0000-000000009207', 'fisica', 'Hector', 'Benitez', NULL, 'Hector Benitez', 'DNI', '23111999', '23111999', NULL, '1960-04-28', '3415551007', 'hector.benitez@demo.local', 'Jubilado', 'Titular registral asociado al reclamo.', 1),
    (9208, '00000000-0000-0000-0000-000000009208', 'fisica', 'Mariano', 'Soto', NULL, 'Mariano Soto', 'DNI', '31222999', '31222999', NULL, '1989-01-08', '3415551008', 'mariano.soto@demo.local', 'Arquitecto', 'Cliente del recupero de franquicia.', 1),
    (9209, '00000000-0000-0000-0000-000000009209', 'fisica', 'Paula', 'Cobranza', NULL, 'Paula Cobranza', 'DNI', '27888777', '27888777', NULL, '1985-07-05', '3415551009', 'paula.cobranza@aseguradora.local', 'Cobranza', 'Contacto de cobranzas de compania.', 1);

INSERT INTO persona_contactos (id, persona_id, tipo_contacto_codigo, valor, principal, validado, observaciones) VALUES
    (9531, 9201, 'WHATSAPP', '3415551001', 1, 1, 'Canal principal cliente caso 9001PZ'),
    (9532, 9201, 'EMAIL', 'juan.perez@demo.local', 0, 1, NULL),
    (9533, 9202, 'WHATSAPP', '3415551002', 1, 1, 'Canal principal cliente caso 9002TC'),
    (9534, 9203, 'EMAIL', 'luciana.segura@aseguradora.local', 1, 1, 'Contacto de tramitacion'),
    (9535, 9204, 'EMAIL', 'martin.peralta@aseguradora.local', 1, 1, 'Contacto de inspeccion'),
    (9536, 9205, 'WHATSAPP', '3415551005', 1, 1, NULL),
    (9537, 9206, 'WHATSAPP', '3415551006', 1, 1, NULL),
    (9538, 9207, 'CELULAR', '3415551007', 1, 0, NULL),
    (9539, 9208, 'WHATSAPP', '3415551008', 1, 1, NULL),
    (9540, 9209, 'EMAIL', 'paula.cobranza@aseguradora.local', 1, 1, 'Contacto cobranzas');

INSERT INTO persona_domicilios (id, persona_id, tipo_domicilio_codigo, calle, numero, piso, depto, localidad, provincia, codigo_postal, pais_codigo, principal) VALUES
    (9541, 9201, 'REAL', 'Bv. Oroño', '1450', NULL, NULL, 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9542, 9202, 'REAL', 'Mendoza', '3321', NULL, NULL, 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9543, 9203, 'LABORAL', 'Cordoba', '950', '6', 'B', 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9544, 9204, 'LABORAL', 'Cordoba', '950', '6', 'C', 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9545, 9205, 'REAL', 'San Jose', '741', NULL, NULL, 'Funes', 'Santa Fe', '2132', 'AR', 1),
    (9546, 9206, 'REAL', 'Catamarca', '2210', NULL, NULL, 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9547, 9207, 'REAL', 'Catamarca', '2210', NULL, NULL, 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9548, 9208, 'REAL', 'Belgrano', '1818', NULL, NULL, 'Villa Gobernador Galvez', 'Santa Fe', '2124', 'AR', 1),
    (9549, 9209, 'LABORAL', 'Mitre', '880', '4', 'A', 'Rosario', 'Santa Fe', '2000', 'AR', 1);

-- ---------------------------------------------------------------------------
-- Vehiculos y titularidades.
-- ---------------------------------------------------------------------------

INSERT INTO vehiculos (
    id, public_id, marca_id, modelo_id, marca_texto, modelo_texto, dominio, dominio_normalizado,
    anio, tipo_vehiculo_codigo, uso_codigo, color, pintura_codigo, chasis, motor,
    transmision_codigo, kilometraje, observaciones, activo
) VALUES
    (9301, '00000000-0000-0000-0000-000000009301', 9101, 9111, NULL, NULL, 'AA123BB', 'AA123BB', 2020, 'SEDAN', 'PARTICULAR', 'Gris grafito', 'BICAPA', 'CHASIS9001', 'MOTOR9001', 'MANUAL', 48210, 'Unidad entregada y cerrada.', 1),
    (9302, '00000000-0000-0000-0000-000000009302', 9102, 9112, NULL, NULL, 'AC456DE', 'AC456DE', 2022, 'HATCH', 'PARTICULAR', 'Blanco nacarado', 'PERLADO', 'CHASIS9002', 'MOTOR9002', 'MANUAL', 18650, 'Caso todo riesgo con repuestos pendientes.', 1),
    (9303, '00000000-0000-0000-0000-000000009303', 9103, 9113, NULL, NULL, 'AD789FG', 'AD789FG', 2023, 'SUV', 'PARTICULAR', 'Azul oscuro', 'TRICAPA', 'CHASIS9003', 'MOTOR9003', 'AUTOMATICA', 9200, 'Caso CLEAS en proceso documental.', 1),
    (9304, '00000000-0000-0000-0000-000000009304', 9104, 9114, NULL, NULL, 'AE012HI', 'AE012HI', 2019, 'SEDAN', 'PARTICULAR', 'Negro', 'BICAPA', 'CHASIS9004', 'MOTOR9004', 'CVT', 73110, 'Caso con abogado y reclamo a terceros.', 1),
    (9305, '00000000-0000-0000-0000-000000009305', 9105, 9115, NULL, NULL, 'AF345JK', 'AF345JK', 2021, 'PICKUP', 'COMERCIAL', 'Plata', 'MONOCAPA', 'CHASIS9005', 'MOTOR9005', 'MANUAL', 55200, 'Carpeta de recupero vinculada al todo riesgo.', 1);

INSERT INTO vehiculo_personas (id, vehiculo_id, persona_id, rol_vehiculo_codigo, es_actual, desde, hasta, notas) VALUES
    (9551, 9301, 9201, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual'),
    (9552, 9302, 9202, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual'),
    (9553, 9303, 9205, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual'),
    (9554, 9304, 9207, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual'),
    (9555, 9305, 9208, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual');

-- ---------------------------------------------------------------------------
-- Companias de seguro y contactos.
-- ---------------------------------------------------------------------------

INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES
    (9701, '00000000-0000-0000-0000-000000009701', 'LA_SEGUNDA', 'La Segunda', '30-50000001-1', 1, 30, 1),
    (9702, '00000000-0000-0000-0000-000000009702', 'SANCOR', 'Sancor Seguros', '30-50000002-2', 0, 25, 1),
    (9703, '00000000-0000-0000-0000-000000009703', 'FEDERACION', 'Federacion Patronal', '30-50000003-3', 1, 35, 1);

INSERT INTO companias_contactos (id, compania_id, persona_id, rol_contacto_codigo) VALUES
    (9721, 9701, 9203, 'TRAMITADOR'),
    (9722, 9701, 9204, 'INSPECTOR'),
    (9723, 9701, 9209, 'COBRANZA');

-- ---------------------------------------------------------------------------
-- Casos principales visibles para frontend.
-- Estados:
--  tramite: 1 INGRESADO, 2 EN_TRAMITE, 3 CERRADO
--  reparacion: 4 SIN_TURNO, 5 CON_TURNO, 6 REPARADO
--  pago: 7 PENDIENTE, 8 PAGADO
--  documentacion: 9 PENDIENTE_DOCS, 10 COMPLETA
--  legal: 11 SIN_GESTION, 12 EN_ESTUDIO
-- ---------------------------------------------------------------------------

INSERT INTO casos (
    id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id,
    vehiculo_principal_id, cliente_principal_persona_id, referenciado, referido_por_persona_id,
    referido_por_texto, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id,
    estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id,
    prioridad_codigo, fecha_cierre, observaciones_generales, archived_at
) VALUES
    (9401, '00000000-0000-0000-0000-000000009401', '9001PZ', 9001, 1, 1, 1, 9301, 9201, 0, NULL, NULL, 1, 3, 6, 8, 10, 11, 'MEDIA', '2026-04-05 18:30:00', 'Caso particular cerrado con circuito completo.', NULL),
    (9402, '00000000-0000-0000-0000-000000009402', '9002TC', 9002, 2, 1, 2, 9302, 9202, 0, NULL, NULL, 1, 2, 5, 7, 9, 11, 'ALTA', NULL, 'Todo riesgo activo con seguro, presupuesto y turno asignado.', NULL),
    (9403, '00000000-0000-0000-0000-000000009403', '9003CLZ', 9003, 4, 1, 1, 9303, 9205, 0, NULL, NULL, 1, 2, 4, 7, 9, 11, 'MEDIA', NULL, 'Caso CLEAS con gestion documental pendiente.', NULL),
    (9404, '00000000-0000-0000-0000-000000009404', '9004RAZ', 9004, 6, 1, 1, 9304, 9206, 1, 9207, NULL, 1, 2, 4, 7, 9, 12, 'URGENTE', NULL, 'Reclamo de terceros con abogado y novedades legales.', NULL),
    (9405, '00000000-0000-0000-0000-000000009405', '9005RFC', 9005, 7, 1, 2, 9305, 9208, 0, NULL, NULL, 1, 2, 4, 7, 9, 12, 'MEDIA', NULL, 'Recupero de franquicia vinculado al caso todo riesgo.', NULL);

INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES
    (9561, 9401, 9201, 'CLIENTE', NULL, 1, 'Cliente principal'),
    (9562, 9402, 9202, 'CLIENTE', NULL, 1, 'Cliente principal'),
    (9563, 9403, 9205, 'CLIENTE', NULL, 1, 'Cliente principal'),
    (9564, 9404, 9206, 'CLIENTE', NULL, 1, 'Cliente principal'),
    (9565, 9404, 9207, 'TITULAR', 9304, 0, 'Titular registral'),
    (9566, 9405, 9208, 'CLIENTE', NULL, 1, 'Cliente principal');

INSERT INTO caso_vehiculos (id, caso_id, vehiculo_id, rol_vehiculo_codigo, es_principal, orden_visual, notas) VALUES
    (9571, 9401, 9301, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso'),
    (9572, 9402, 9302, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso'),
    (9573, 9403, 9303, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso'),
    (9574, 9404, 9304, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso'),
    (9575, 9405, 9305, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso');

INSERT INTO caso_siniestro (id, caso_id, fecha_siniestro, hora_siniestro, lugar, dinamica, observaciones, fecha_prescripcion, dias_tramitando) VALUES
    (9581, 9401, '2026-03-28', '10:15:00', 'Bv. Oroño y Mendoza, Rosario', 'Choque delantero leve con vehiculo estacionado.', 'Siniestro cerrado y entregado.', '2028-03-28', 8),
    (9582, 9402, '2026-04-01', '16:20:00', 'Pellegrini 1200, Rosario', 'Impacto lateral con cobertura todo riesgo.', 'Esperando aprobacion final y cobro.', '2028-04-01', 12),
    (9583, 9403, '2026-04-02', '09:00:00', 'Ruta 9 km 305', 'Evento CLEAS con tercero identificado.', 'Se envio documentacion inicial.', '2028-04-02', 10),
    (9584, 9404, '2026-03-20', '19:30:00', 'Av. Francia 2100, Rosario', 'Colision con tercero asegurado. Reclamo derivado a abogado.', 'Cliente prioriza seguimiento judicial.', '2028-03-20', 23),
    (9585, 9405, '2026-04-03', '11:45:00', 'Relacionado al caso 9002TC', 'Recupero administrativo de franquicia del caso base.', 'Usa datos del caso base para acelerar gestion.', '2028-04-03', 9);

INSERT INTO caso_relaciones (id, caso_origen_id, caso_destino_id, tipo_relacion_codigo, descripcion) VALUES
    (9591, 9402, 9405, 'RECUPERO_FRANQUICIA', 'El caso 9005RFC recupera la franquicia del caso 9002TC.');

INSERT INTO caso_estado_historial (id, caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES
    (9601, 9401, 'tramite', 1, '2026-03-28 10:30:00', 1, 0, 'Alta inicial', NULL),
    (9602, 9401, 'tramite', 2, '2026-03-29 09:15:00', 1, 0, 'Inicio de gestion', NULL),
    (9603, 9401, 'tramite', 3, '2026-04-05 18:30:00', 1, 0, 'Caso finalizado', NULL),
    (9604, 9401, 'reparacion', 4, '2026-03-28 10:30:00', 1, 0, 'Sin turno al alta', NULL),
    (9605, 9401, 'reparacion', 5, '2026-03-30 11:00:00', 1, 0, 'Turno confirmado', NULL),
    (9606, 9401, 'reparacion', 6, '2026-04-05 17:45:00', 1, 0, 'Reparacion concluida', NULL),
    (9607, 9401, 'pago', 7, '2026-03-28 10:30:00', 1, 0, 'Pendiente al alta', NULL),
    (9608, 9401, 'pago', 8, '2026-04-05 16:20:00', 1, 0, 'Pago acreditado', NULL),
    (9609, 9401, 'documentacion', 9, '2026-03-28 10:30:00', 1, 0, 'Documentacion inicial', NULL),
    (9610, 9401, 'documentacion', 10, '2026-04-02 12:00:00', 1, 0, 'Documentacion completa', NULL),
    (9611, 9401, 'legal', 11, '2026-03-28 10:30:00', 1, 0, 'No requiere gestion legal', NULL),
    (9612, 9402, 'tramite', 1, '2026-04-01 17:00:00', 1, 0, 'Alta inicial', NULL),
    (9613, 9402, 'tramite', 2, '2026-04-02 09:40:00', 1, 0, 'Derivado a seguro', NULL),
    (9614, 9402, 'reparacion', 4, '2026-04-01 17:00:00', 1, 0, 'Sin turno al alta', NULL),
    (9615, 9402, 'reparacion', 5, '2026-04-04 10:00:00', 1, 0, 'Turno asignado', NULL),
    (9616, 9402, 'pago', 7, '2026-04-01 17:00:00', 1, 0, 'Pendiente de cobro', NULL),
    (9617, 9402, 'documentacion', 9, '2026-04-01 17:00:00', 1, 0, 'Faltan respaldos de compania', NULL),
    (9618, 9402, 'legal', 11, '2026-04-01 17:00:00', 1, 0, 'Sin gestion legal', NULL),
    (9619, 9403, 'tramite', 1, '2026-04-02 09:30:00', 1, 0, 'Alta inicial', NULL),
    (9620, 9403, 'tramite', 2, '2026-04-03 08:50:00', 1, 0, 'CLEAS en revision', NULL),
    (9621, 9403, 'reparacion', 4, '2026-04-02 09:30:00', 1, 0, 'Aun sin turno', NULL),
    (9622, 9403, 'pago', 7, '2026-04-02 09:30:00', 1, 0, 'Pendiente', NULL),
    (9623, 9403, 'documentacion', 9, '2026-04-02 09:30:00', 1, 0, 'Documentacion incompleta', NULL),
    (9624, 9403, 'legal', 11, '2026-04-02 09:30:00', 1, 0, 'Sin gestion legal', NULL),
    (9625, 9404, 'tramite', 1, '2026-03-20 20:00:00', 1, 0, 'Alta inicial', NULL),
    (9626, 9404, 'tramite', 2, '2026-03-22 11:00:00', 1, 0, 'Derivado a abogado', NULL),
    (9627, 9404, 'reparacion', 4, '2026-03-20 20:00:00', 1, 0, 'Pendiente definir reparacion', NULL),
    (9628, 9404, 'pago', 7, '2026-03-20 20:00:00', 1, 0, 'Pendiente', NULL),
    (9629, 9404, 'documentacion', 9, '2026-03-20 20:00:00', 1, 0, 'Faltan escritos digitalizados', NULL),
    (9630, 9404, 'legal', 11, '2026-03-20 20:00:00', 1, 0, 'Sin gestion legal al alta', NULL),
    (9631, 9404, 'legal', 12, '2026-03-25 15:15:00', 1, 0, 'Se inicio estudio legal', NULL),
    (9632, 9405, 'tramite', 1, '2026-04-03 12:10:00', 1, 0, 'Alta inicial', NULL),
    (9633, 9405, 'tramite', 2, '2026-04-04 09:00:00', 1, 0, 'Recupero en curso', NULL),
    (9634, 9405, 'reparacion', 4, '2026-04-03 12:10:00', 1, 0, 'No aplica turno inicial', NULL),
    (9635, 9405, 'pago', 7, '2026-04-03 12:10:00', 1, 0, 'Pendiente de recupero', NULL),
    (9636, 9405, 'documentacion', 9, '2026-04-03 12:10:00', 1, 0, 'Se reutiliza documentacion base', NULL),
    (9637, 9405, 'legal', 11, '2026-04-03 12:10:00', 1, 0, 'Sin gestion legal al alta', NULL),
    (9638, 9405, 'legal', 12, '2026-04-06 14:00:00', 1, 0, 'Recupero elevado para seguimiento', NULL),
    (9639, 9402, 'documentacion', 9, '2026-04-06 10:30:00', 1, 0, 'Esperando autorizacion y fotos', NULL),
    (9640, 9403, 'documentacion', 9, '2026-04-05 11:00:00', 1, 0, 'Pendiente aceptacion de compania', NULL),
    (9641, 9404, 'documentacion', 9, '2026-04-04 16:00:00', 1, 0, 'Pendiente poder firmado', NULL),
    (9642, 9405, 'pago', 7, '2026-04-06 14:05:00', 1, 0, 'Pendiente cobro cliente/tercero', NULL),
    (9643, 9402, 'pago', 7, '2026-04-08 09:00:00', 1, 0, 'Sin acreditacion aun', NULL);

-- ---------------------------------------------------------------------------
-- Operacion de taller: turnos, ingresos, egresos y tareas.
-- ---------------------------------------------------------------------------

INSERT INTO turnos_reparacion (
    id, public_id, caso_id, fecha_turno, hora_turno, dias_estimados,
    fecha_salida_estimada, estado_codigo, es_reingreso, notas, usuario_id
) VALUES
    (9801, '00000000-0000-0000-0000-000000009801', 9401, '2026-04-01', '08:30:00', 4, '2026-04-05', 'CUMPLIDO', 0, 'Turno cumplido y unidad entregada.', 1),
    (9806, '00000000-0000-0000-0000-000000009806', 9402, '2026-04-10', '09:15:00', 5, '2026-04-15', 'PENDIENTE', 0, 'Cliente confirma por WhatsApp 24 hs antes.', 1);

INSERT INTO ingresos_vehiculo (
    id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id,
    persona_entrega_id, kilometraje_ingreso, combustible_codigo, fecha_salida_estimada,
    con_observaciones, detalle_observaciones
) VALUES
    (9802, '00000000-0000-0000-0000-000000009802', 9401, 9801, 9301, '2026-04-01 08:42:00', 1, 9201, 48210, 'MEDIO', '2026-04-05', 1, 'Se deja constancia de una marca menor en llanta delantera derecha.');

INSERT INTO ingreso_items (id, ingreso_id, tipo_item_codigo, detalle, estado_codigo, referencia_media) VALUES
    (9804, 9802, 'ACCESORIO', 'Se recibe rueda de auxilio y crique.', 'OK', 'fotos/9001PZ/ingreso-auxilio.jpg'),
    (9805, 9802, 'OBSERVACION', 'Rayon menor preexistente en llanta delantera derecha.', 'OBSERVADO', 'fotos/9001PZ/ingreso-llanta.jpg');

INSERT INTO egresos_vehiculo (
    id, public_id, caso_id, ingreso_id, turno_reingreso_id, fecha_egreso, entregado_por_usuario_id,
    persona_recibe_id, egreso_definitivo, debe_reingresar, fecha_reingreso_prevista,
    dias_estimados_reingreso, estado_reingreso_codigo, fotos_reparado_cargadas, notas
) VALUES
    (9803, '00000000-0000-0000-0000-000000009803', 9401, 9802, NULL, '2026-04-05 17:50:00', 1, 9201, 1, 0, NULL, NULL, NULL, 1, 'Entrega final sin novedades.');

INSERT INTO tareas (
    id, public_id, caso_id, organizacion_id, sucursal_id, modulo_origen_codigo, subtab_origen_codigo,
    titulo, descripcion, fecha_limite, prioridad_codigo, estado_codigo, usuario_asignado_id,
    created_by, resuelta, resuelta_at, payload_json
) VALUES
    (9791, '00000000-0000-0000-0000-000000009791', 9401, 1, 1, 'PAGOS', 'cierre', 'Confirmar entrega y factura final', 'Validar que la entrega final quede vinculada al comprobante emitido.', '2026-04-05', 'MEDIA', 'RESUELTA', 1, 1, 1, '2026-04-05 18:00:00', '{"caseCode":"9001PZ"}'),
    (9792, '00000000-0000-0000-0000-000000009792', 9402, 1, 2, 'TRAMITE', 'seguro', 'Pedir aprobacion final a la compania', 'Falta OK final para pasar a cobro y compra definitiva de repuestos.', '2026-04-10', 'ALTA', 'PENDIENTE', 1, 1, 0, NULL, '{"caseCode":"9002TC"}'),
    (9793, '00000000-0000-0000-0000-000000009793', 9404, 1, 1, 'ABOGADO', 'novedades', 'Subir poder firmado del cliente', 'Sin el poder digitalizado el estudio no puede cerrar la presentacion.', '2026-04-09', 'URGENTE', 'EN_PROGRESO', 1, 1, 0, NULL, '{"caseCode":"9004RAZ"}'),
    (9794, '00000000-0000-0000-0000-000000009794', 9405, 1, 2, 'RECUPERO', 'seguimiento', 'Confirmar monto recuperable con cliente', 'Definir si se acepta menor acuerdo antes de escalar a juicio.', '2026-04-12', 'MEDIA', 'PENDIENTE', 1, 1, 0, NULL, '{"caseCode":"9005RFC"}');

-- ---------------------------------------------------------------------------
-- Presupuestos y repuestos.
-- ---------------------------------------------------------------------------

INSERT INTO presupuestos (
    id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo,
    mano_obra_sin_iva, alicuota_iva, mano_obra_iva, mano_obra_con_iva,
    repuestos_total, total_cotizado, dias_estimados, monto_minimo_cierre_mo,
    observaciones, version_actual
) VALUES
    (9811, 9401, 1, 1, '2026-03-29', 'CERRADO', 450000.00, 21.00, 94500.00, 544500.00, 210000.00, 754500.00, 4, 400000.00, 'Presupuesto ejecutado y cerrado.', 2),
    (9812, 9402, 1, 2, '2026-04-03', 'APROBADO', 780000.00, 21.00, 163800.00, 943800.00, 320000.00, 1263800.00, 5, 700000.00, 'Aprobado por compania. Falta orden final de compra.', 1),
    (9813, 9403, 1, 1, '2026-04-04', 'PENDIENTE', 390000.00, 21.00, 81900.00, 471900.00, 185000.00, 656900.00, 3, 350000.00, 'Esperando validacion CLEAS.', 1),
    (9814, 9404, 1, 1, '2026-03-26', 'APROBADO', 520000.00, 21.00, 109200.00, 629200.00, 95000.00, 724200.00, 6, 450000.00, 'Se usa como base del reclamo judicial.', 1);

INSERT INTO presupuesto_items (
    id, presupuesto_id, orden_visual, pieza_afectada, tarea_codigo, nivel_danio_codigo,
    decision_repuesto_codigo, accion_codigo, requiere_reemplazo, valor_repuesto,
    horas_estimadas, importe_mano_obra, activo
) VALUES
    (9821, 9811, 1, 'Paragolpe delantero', 'CHAPA', 'MEDIO', 'REPARAR', 'REPARAR', 0, 0.00, 5.50, 180000.00, 1),
    (9822, 9811, 2, 'Optica delantera derecha', 'ELECTRICIDAD', 'LEVE', 'REEMPLAZAR', 'CAMBIAR', 1, 210000.00, 1.20, 45000.00, 1),
    (9823, 9812, 1, 'Puerta delantera izquierda', 'CHAPA', 'GRAVE', 'REEMPLAZAR', 'CAMBIAR', 1, 250000.00, 7.00, 290000.00, 1),
    (9824, 9812, 2, 'Zocalo lateral', 'PINTURA', 'MEDIO', 'REPARAR', 'PINTAR', 0, 70000.00, 4.50, 180000.00, 1),
    (9825, 9813, 1, 'Paragolpe trasero', 'CHAPA', 'MEDIO', 'REPARAR', 'REPARAR', 0, 45000.00, 3.00, 130000.00, 1),
    (9826, 9813, 2, 'Porton trasero', 'PINTURA', 'LEVE', 'PULIR', 'AJUSTAR', 0, 140000.00, 2.50, 95000.00, 1),
    (9827, 9814, 1, 'Guardabarro delantero derecho', 'CHAPA', 'GRAVE', 'REEMPLAZAR', 'CAMBIAR', 1, 95000.00, 6.00, 210000.00, 1);

INSERT INTO repuestos_caso (
    id, caso_id, presupuesto_item_id, descripcion, codigo_pieza, proveedor_final,
    autorizado_codigo, estado_codigo, compra_por_codigo, pago_estado_codigo,
    precio_presupuestado, precio_final, fecha_recibido, usado, devuelto
) VALUES
    (9831, 9401, 9822, 'Optica delantera derecha', 'OPT-ONIX-01', 'Repuestos Oroño', 'AUTORIZADO', 'INSTALADO', 'TALLER', 'PAGADO', 210000.00, 208500.00, '2026-04-02', 1, 0),
    (9832, 9402, 9823, 'Puerta delantera izquierda', 'PUE-208-IZQ', 'Repuestos Centro', 'AUTORIZADO', 'PEDIDO', 'COMPANIA', 'PENDIENTE', 250000.00, NULL, NULL, 0, 0),
    (9833, 9402, 9824, 'Moldura lateral', 'MOL-208-LAT', 'Repuestos Centro', 'PENDIENTE', 'PENDIENTE', 'TALLER', 'PENDIENTE', 70000.00, NULL, NULL, 0, 0),
    (9834, 9403, 9826, 'Porton trasero', 'POR-NIVUS-01', 'CLEAS Repuestos', 'AUTORIZADO', 'EN_CAMINO', 'COMPANIA', 'NO_APLICA', 140000.00, 138000.00, NULL, 0, 0);

-- ---------------------------------------------------------------------------
-- Documentos: solo metadata. El listado funciona; la descarga depende de storage.
-- ---------------------------------------------------------------------------

INSERT INTO documentos (
    id, public_id, storage_key, nombre_archivo, extension, mime_type, tamano_bytes,
    checksum_sha256, categoria_id, subcategoria_codigo, fecha_documento, subido_por,
    origen_codigo, observaciones, reemplaza_documento_id, activo
) VALUES
    (9841, '00000000-0000-0000-0000-000000009841', 'seed/9001PZ/orden-ingreso.pdf', 'orden-ingreso-9001PZ.pdf', 'pdf', 'application/pdf', 125430, '1111111111111111111111111111111111111111111111111111111111111111', 1, NULL, '2026-04-01', 1, 'SEED_LOCAL', 'Orden de ingreso del caso cerrado.', NULL, 1),
    (9842, '00000000-0000-0000-0000-000000009842', 'seed/9002TC/presupuesto.pdf', 'presupuesto-9002TC.pdf', 'pdf', 'application/pdf', 223120, '2222222222222222222222222222222222222222222222222222222222222222', 3, NULL, '2026-04-03', 1, 'SEED_LOCAL', 'Presupuesto enviado a la compania.', NULL, 1),
    (9843, '00000000-0000-0000-0000-000000009843', 'seed/9004RAZ/poder-cliente.pdf', 'poder-cliente-9004RAZ.pdf', 'pdf', 'application/pdf', 98110, '3333333333333333333333333333333333333333333333333333333333333333', 4, NULL, '2026-03-25', 1, 'SEED_LOCAL', 'Poder firmado pendiente de validacion final.', NULL, 1),
    (9844, '00000000-0000-0000-0000-000000009844', 'seed/9001PZ/foto-dano.jpg', 'foto-dano-9001PZ.jpg', 'jpg', 'image/jpeg', 484210, '4444444444444444444444444444444444444444444444444444444444444444', 2, NULL, '2026-03-28', 1, 'SEED_LOCAL', 'Foto principal del dano.', NULL, 1);

INSERT INTO documento_relaciones (id, documento_id, caso_id, entidad_tipo, entidad_id, modulo_codigo, principal, visible_cliente, orden_visual) VALUES
    (9851, 9841, 9401, 'CASE', 9401, 'OPERACION', 1, 1, 1),
    (9852, 9842, 9402, 'BUDGET', 9812, 'FINANZAS', 1, 1, 1),
    (9853, 9843, 9404, 'LEGAL', 9781, 'LEGAL', 1, 0, 1),
    (9854, 9844, 9401, 'CASE', 9401, 'OPERACION', 0, 1, 2);

-- ---------------------------------------------------------------------------
-- Finanzas.
-- ---------------------------------------------------------------------------

INSERT INTO comprobantes_emitidos (
    id, public_id, caso_id, tipo_comprobante_codigo, numero_comprobante, razon_social_receptor,
    fecha_emision, neto_gravado, iva, total, firmado_conforme_en, notas, documento_id
) VALUES
    (9861, '00000000-0000-0000-0000-000000009861', 9401, 'FACTURA', '0002-00009001', 'Juan Perez', '2026-04-05', 623553.72, 130946.28, 754500.00, '2026-04-05 15:20:00', 'Factura final de caso particular.', 9841),
    (9862, '00000000-0000-0000-0000-000000009862', 9402, 'FACTURA', '0002-00009002', 'La Segunda', '2026-04-08', 1044462.81, 219337.19, 1263800.00, NULL, 'Factura emitida a la compania, pendiente cobro.', 9842);

INSERT INTO movimientos_financieros (
    id, public_id, caso_id, comprobante_id, tipo_movimiento_codigo, origen_flujo_codigo,
    contraparte_tipo_codigo, contraparte_persona_id, contraparte_compania_id, fecha_movimiento,
    monto_bruto, monto_neto, medio_pago_codigo, medio_pago_detalle, cancela_tipo_codigo,
    es_senia, es_bonificacion, motivo, referencia_externa, registrado_por
) VALUES
    (9871, '00000000-0000-0000-0000-000000009871', 9401, 9861, 'INGRESO', 'CLIENTE', 'PERSONA', 9201, NULL, '2026-04-05 16:10:00', 754500.00, 723000.00, 'TRANSFERENCIA', 'CBU taller cuenta corriente', 'PRESUPUESTO', 0, 0, 'Cobro final del caso cerrado.', 'TRX-9001', 1),
    (9872, '00000000-0000-0000-0000-000000009872', 9402, 9862, 'INGRESO', 'ASEGURADORA', 'COMPANIA', NULL, 9701, '2026-04-08 11:00:00', 400000.00, 400000.00, 'TRANSFERENCIA', 'Anticipo compania', 'PRESUPUESTO', 0, 0, 'Anticipo para iniciar compra de repuestos.', 'TRX-9002-A', 1),
    (9873, '00000000-0000-0000-0000-000000009873', 9405, NULL, 'INGRESO', 'CLIENTE', 'PERSONA', 9208, NULL, '2026-04-07 09:30:00', 120000.00, 120000.00, 'TRANSFERENCIA', 'Pago de reserva para gastos del recupero', 'FRANQUICIA', 1, 0, 'Senia para iniciar recupero.', 'TRX-9005-S', 1);

INSERT INTO movimiento_retenciones (id, movimiento_id, tipo_retencion_codigo, monto, detalle) VALUES
    (9881, 9871, 'IVA', 18900.00, 'Retencion IVA caso 9001PZ'),
    (9882, 9871, 'GANANCIAS', 12600.00, 'Retencion ganancias caso 9001PZ'),
    (9883, 9871, 'IIBB', 0.00, 'Sin retencion adicional');

INSERT INTO movimiento_aplicaciones (id, movimiento_id, caso_id, concepto_codigo, entidad_tipo, entidad_id, monto_aplicado) VALUES
    (9891, 9871, 9401, 'MANO_OBRA', 'PRESUPUESTO', 9811, 544500.00),
    (9892, 9871, 9401, 'REPUESTO', 'PRESUPUESTO', 9811, 210000.00);

-- ---------------------------------------------------------------------------
-- Seguros, CLEAS, terceros y legal.
-- ---------------------------------------------------------------------------

INSERT INTO caso_seguro (
    id, caso_id, compania_seguro_id, numero_poliza, numero_certificado, detalle_cobertura,
    compania_tercero_id, numero_cleas, tramitador_caso_persona_id, inspector_caso_persona_id
) VALUES
    (9731, 9402, 9701, 'POL-9002-01', 'CERT-9002-01', 'Todo riesgo con franquicia de $350.000.', 9703, NULL, NULL, NULL),
    (9732, 9403, 9702, 'POL-9003-01', 'CERT-9003-01', 'Cobertura CLEAS parcial.', 9703, 'CLEAS-2026-9003', NULL, NULL);

INSERT INTO caso_tramitacion_seguro (
    id, caso_id, fecha_presentacion, fecha_derivado_inspeccion, modalidad_codigo, dictamen_codigo,
    cotizacion_estado_codigo, fecha_cotizacion, monto_acordado, monto_minimo_cierre,
    lleva_repuestos, autorizacion_repuestos_codigo, proveedor_repuestos_texto,
    monto_facturar_compania, monto_final_favor_taller, no_repara, admin_override_turno
) VALUES
    (9741, 9402, '2026-04-02', '2026-04-03', 'INSPECCION', 'APROBADO', 'ACEPTADA', '2026-04-04', 1263800.00, 700000.00, 1, 'AUTORIZADO', 'Repuestos Centro', 1263800.00, 1180000.00, 0, 0),
    (9742, 9403, '2026-04-03', '2026-04-04', 'CONVENIO', 'PENDIENTE', 'ENVIADA', '2026-04-04', 656900.00, 350000.00, 1, 'PENDIENTE', 'CLEAS Repuestos', 656900.00, 610000.00, 0, 0);

INSERT INTO caso_franquicia (
    id, caso_id, estado_franquicia_codigo, monto_franquicia, tipo_recupero_codigo,
    caso_asociado_id, dictamen_franquicia_codigo, supera_franquicia, monto_recuperar, notas
) VALUES
    (9751, 9402, 'RECUPERAR', 350000.00, 'TERCERO', 9405, 'PENDIENTE', 1, 280000.00, 'Se abre caso separado de recupero para seguimiento.');

INSERT INTO caso_cleas (
    id, caso_id, alcance_codigo, dictamen_codigo, monto_franquicia, monto_cargo_cliente,
    estado_pago_cliente_codigo, fecha_pago_cliente, monto_pago_compania_franquicia,
    estado_pago_compania_franquicia_codigo, fecha_pago_compania_franquicia
) VALUES
    (9771, 9403, 'PARCIAL', 'PENDIENTE', 150000.00, 0.00, 'NO_APLICA', NULL, 150000.00, 'PENDIENTE', NULL);

INSERT INTO caso_terceros (
    id, caso_id, compania_tercero_id, referencia_reclamo, documentacion_estado_codigo,
    documentacion_aceptada, modo_provision_repuestos_codigo, monto_minimo_labor,
    monto_minimo_repuestos, subtotal_mejor_cotizacion, total_final_repuestos,
    monto_facturar_compania, monto_final_favor_taller
) VALUES
    (9761, 9404, 9703, 'REC-TER-9004', 'EN_REVISION', 0, 'TERCERO', 450000.00, 85000.00, 91000.00, 95000.00, 724200.00, 680000.00);

INSERT INTO caso_legal (
    id, caso_id, tramita_codigo, reclama_codigo, instancia_codigo, fecha_ingreso, cuij,
    juzgado, autos, abogado_contraparte, telefono_contraparte, email_contraparte,
    repara_vehiculo, cierre_por_codigo, fecha_cierre_legal, importe_total_expediente,
    observaciones, notas_cierre
) VALUES
    (9781, 9404, 'ABOGADO', 'CLIENTE', 'JUDICIAL', '2026-03-25', '21-12345678-9', 'Juzgado Civil 4 Rosario', 'Benitez c/ Federacion Patronal s/ danos', 'Dr. Marcelo Torres', '3415007788', 'mtorres@estudioterceros.local', 1, NULL, NULL, 1450000.00, 'Se adjuntaron pruebas fotograficas y presupuesto del taller.', NULL);

INSERT INTO legal_novedades (id, caso_legal_id, fecha_novedad, detalle, notificar_cliente, notificado_at) VALUES
    (9911, 9781, '2026-04-04', 'Se presento escrito inicial con presupuesto y documental respaldatoria.', 1, '2026-04-04 18:10:00'),
    (9912, 9781, '2026-04-07', 'La aseguradora del tercero pidio ampliacion de fotos y poder firmado.', 0, NULL);

INSERT INTO legal_gastos (id, caso_legal_id, concepto, monto, fecha_gasto, pagado_por_codigo, movimiento_financiero_id) VALUES
    (9921, 9781, 'Tasa de justicia', 45000.00, '2026-04-05', 'CLIENTE', NULL),
    (9922, 9781, 'Certificacion de firmas', 18000.00, '2026-04-06', 'ABOGADO', NULL);

-- ---------------------------------------------------------------------------
-- Recupero de franquicia.
-- ---------------------------------------------------------------------------

INSERT INTO recuperos_franquicia (
    id, caso_id, gestiona_codigo, caso_base_id, carpeta_base_codigo, dictamen_codigo,
    monto_acordado, monto_recuperar, habilita_reparacion, recupera_cliente, monto_cliente,
    estado_cobro_cliente_codigo, fecha_cobro_cliente, aprobado_menor_acuerdo,
    nota_aprobacion, reutiliza_datos_base
) VALUES
    (9901, 9405, 'TALLER', 9402, '9002TC', 'PENDIENTE', 280000.00, 280000.00, 1, 1, 120000.00, 'PENDIENTE', NULL, 0, 'Pendiente respuesta final del tercero.', 1);

-- ---------------------------------------------------------------------------
-- Notificaciones para el admin base (id = 1).
-- ---------------------------------------------------------------------------

INSERT INTO notificaciones (id, usuario_id, caso_id, tipo_codigo, titulo, mensaje, leida, leida_at, accion_url, entidad_tipo, entidad_id, created_at) VALUES
    (9971, 1, 9402, 'TURNO_ASIGNADO', 'Turno cargado para 9002TC', 'El caso 9002TC ya tiene turno programado para el 10/04 a las 09:15.', 0, NULL, '/cases/9402/appointments', 'TURNO_REPARACION', 9806, '2026-04-08 09:05:00'),
    (9972, 1, 9401, 'PAGO_REGISTRADO', 'Pago registrado en 9001PZ', 'Se registro el cobro final del caso 9001PZ y ya figura como pagado.', 1, '2026-04-05 16:30:00', '/cases/9401/finance-summary', 'MOVIMIENTO_FINANCIERO', 9871, '2026-04-05 16:15:00'),
    (9973, 1, 9404, 'DOCUMENTO_SUBIDO', 'Documento legal pendiente en 9004RAZ', 'Se vinculo el poder del cliente al caso 9004RAZ para continuar el reclamo.', 0, NULL, '/cases/9404/documents', 'DOCUMENTO', 9843, '2026-04-07 11:00:00');

COMMIT;

-- Credenciales utiles ya documentadas en el repo:
-- - admin@tallerzapata.local / password  (ver docs/20-onboarding-backend.md)
-- - admin@demo.com existe por migracion V30; la clave depende de tu entorno local.
