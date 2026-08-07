-- Seed demo/local para taller_zapata.
-- Carga 3 carpetas utiles para una demo rapida del frontend:
-- - 9001PZ: particular cerrado
-- - 9002TC: todo riesgo en tramite
-- - 9003CLZ: CLEAS en gestion

INSERT INTO marcas_vehiculo (id, codigo, nombre, activo) VALUES
    (9101, 'CHEVROLET', 'Chevrolet', 1),
    (9102, 'PEUGEOT', 'Peugeot', 1),
    (9103, 'VOLKSWAGEN', 'Volkswagen', 1);

INSERT INTO modelos_vehiculo (id, marca_id, codigo, nombre, activo) VALUES
    (9111, 9101, 'ONIX', 'Onix', 1),
    (9112, 9102, '208', '208', 1),
    (9113, 9103, 'NIVUS', 'Nivus', 1);

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
    (9205, '00000000-0000-0000-0000-000000009205', 'fisica', 'Diego', 'Fernandez', NULL, 'Diego Fernandez', 'DNI', '32555444', '32555444', NULL, '1991-03-17', '3415551005', 'diego.fernandez@demo.local', 'Contador', 'Cliente de caso CLEAS.', 1);

INSERT INTO persona_contactos (id, persona_id, tipo_contacto_codigo, valor, principal, validado, observaciones) VALUES
    (9531, 9201, 'WHATSAPP', '3415551001', 1, 1, 'Canal principal cliente caso 9001PZ'),
    (9532, 9201, 'EMAIL', 'juan.perez@demo.local', 0, 1, NULL),
    (9533, 9202, 'WHATSAPP', '3415551002', 1, 1, 'Canal principal cliente caso 9002TC'),
    (9534, 9203, 'EMAIL', 'luciana.segura@aseguradora.local', 1, 1, 'Contacto de tramitacion'),
    (9535, 9204, 'EMAIL', 'martin.peralta@aseguradora.local', 1, 1, 'Contacto de inspeccion'),
    (9536, 9205, 'WHATSAPP', '3415551005', 1, 1, NULL);

INSERT INTO persona_domicilios (id, persona_id, tipo_domicilio_codigo, calle, numero, piso, depto, localidad, provincia, codigo_postal, pais_codigo, principal) VALUES
    (9541, 9201, 'REAL', 'Bv. Orono', '1450', NULL, NULL, 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9542, 9202, 'REAL', 'Mendoza', '3321', NULL, NULL, 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9543, 9203, 'LABORAL', 'Cordoba', '950', '6', 'B', 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9544, 9204, 'LABORAL', 'Cordoba', '950', '6', 'C', 'Rosario', 'Santa Fe', '2000', 'AR', 1),
    (9545, 9205, 'REAL', 'San Jose', '741', NULL, NULL, 'Funes', 'Santa Fe', '2132', 'AR', 1);

INSERT INTO vehiculos (
    id, public_id, marca_id, modelo_id, marca_texto, modelo_texto, dominio, dominio_normalizado,
    anio, tipo_vehiculo_codigo, uso_codigo, color, pintura_codigo, chasis, motor,
    transmision_codigo, kilometraje, observaciones, activo
) VALUES
    (9301, '00000000-0000-0000-0000-000000009301', 9101, 9111, NULL, NULL, 'AA123BB', 'AA123BB', 2020, 'SEDAN', 'PARTICULAR', 'Gris grafito', 'BICAPA', 'CHASIS9001', 'MOTOR9001', 'MANUAL', 48210, 'Unidad entregada y cerrada.', 1),
    (9302, '00000000-0000-0000-0000-000000009302', 9102, 9112, NULL, NULL, 'AC456DE', 'AC456DE', 2022, 'HATCH', 'PARTICULAR', 'Blanco nacarado', 'PERLADO', 'CHASIS9002', 'MOTOR9002', 'MANUAL', 18650, 'Caso todo riesgo con repuestos pendientes.', 1),
    (9303, '00000000-0000-0000-0000-000000009303', 9103, 9113, NULL, NULL, 'AD789FG', 'AD789FG', 2023, 'SUV', 'PARTICULAR', 'Azul oscuro', 'TRICAPA', 'CHASIS9003', 'MOTOR9003', 'AUTOMATICA', 9200, 'Caso CLEAS en proceso documental.', 1);

INSERT INTO vehiculo_personas (id, vehiculo_id, persona_id, rol_vehiculo_codigo, es_actual, desde, hasta, notas) VALUES
    (9551, 9301, 9201, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual'),
    (9552, 9302, 9202, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual'),
    (9553, 9303, 9205, 'TITULAR', 1, '2024-01-01', NULL, 'Titular actual');

INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES
    (9701, '00000000-0000-0000-0000-000000009701', 'LA_SEGUNDA', 'La Segunda', '30-50000001-1', 1, 30, 1),
    (9702, '00000000-0000-0000-0000-000000009702', 'SANCOR', 'Sancor Seguros', '30-50000002-2', 0, 25, 1),
    (9703, '00000000-0000-0000-0000-000000009703', 'FEDERACION', 'Federacion Patronal', '30-50000003-3', 1, 35, 1);

INSERT INTO companias_contactos (id, compania_id, persona_id, rol_contacto_codigo) VALUES
    (9721, 9701, 9203, 'TRAMITADOR'),
    (9722, 9701, 9204, 'INSPECTOR');

INSERT INTO casos (
    id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id,
    vehiculo_principal_id, cliente_principal_persona_id, referenciado, referido_por_persona_id,
    referido_por_texto, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id,
    estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id,
    prioridad_codigo, fecha_cierre, observaciones_generales, archived_at
) VALUES
    (9401, '00000000-0000-0000-0000-000000009401', '9001PZ', 9001, 1, 1, 1, 9301, 9201, 0, NULL, NULL, 1, 3, 6, 8, 10, 11, 'MEDIA', '2026-04-05 18:30:00', 'Caso particular cerrado con circuito completo.', NULL),
    (9402, '00000000-0000-0000-0000-000000009402', '9002TC', 9002, 2, 1, 2, 9302, 9202, 0, NULL, NULL, 1, 2, 5, 7, 9, 11, 'ALTA', NULL, 'Todo riesgo activo con seguro, presupuesto y turno asignado.', NULL),
    (9403, '00000000-0000-0000-0000-000000009403', '9003CLZ', 9003, 4, 1, 1, 9303, 9205, 0, NULL, NULL, 1, 2, 4, 7, 9, 11, 'MEDIA', NULL, 'Caso CLEAS con gestion documental pendiente.', NULL);

INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES
    (9561, 9401, 9201, 'CLIENTE', NULL, 1, 'Cliente principal'),
    (9562, 9402, 9202, 'CLIENTE', NULL, 1, 'Cliente principal'),
    (9563, 9403, 9205, 'CLIENTE', NULL, 1, 'Cliente principal');

INSERT INTO caso_vehiculos (id, caso_id, vehiculo_id, rol_vehiculo_codigo, es_principal, orden_visual, notas) VALUES
    (9571, 9401, 9301, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso'),
    (9572, 9402, 9302, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso'),
    (9573, 9403, 9303, 'PRINCIPAL', 1, 1, 'Vehiculo principal del caso');

INSERT INTO caso_siniestro (id, caso_id, fecha_siniestro, hora_siniestro, lugar, dinamica, observaciones, fecha_prescripcion, dias_tramitando) VALUES
    (9581, 9401, '2026-03-28', '10:15:00', 'Bv. Orono y Mendoza, Rosario', 'Choque delantero leve con vehiculo estacionado.', 'Siniestro cerrado y entregado.', '2028-03-28', 8),
    (9582, 9402, '2026-04-01', '16:20:00', 'Pellegrini 1200, Rosario', 'Impacto lateral con cobertura todo riesgo.', 'Esperando aprobacion final y cobro.', '2028-04-01', 12),
    (9583, 9403, '2026-04-02', '09:00:00', 'Ruta 9 km 305', 'Evento CLEAS con tercero identificado.', 'Se envio documentacion inicial.', '2028-04-02', 10);

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
    (9639, 9402, 'documentacion', 9, '2026-04-06 10:30:00', 1, 0, 'Esperando autorizacion y fotos', NULL),
    (9640, 9403, 'documentacion', 9, '2026-04-05 11:00:00', 1, 0, 'Pendiente aceptacion de compania', NULL);

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
    (9792, '00000000-0000-0000-0000-000000009792', 9402, 1, 2, 'TRAMITE', 'seguro', 'Pedir aprobacion final a la compania', 'Falta OK final para pasar a cobro y compra definitiva de repuestos.', '2026-04-10', 'ALTA', 'PENDIENTE', 1, 1, 0, NULL, '{"caseCode":"9002TC"}');

INSERT INTO presupuestos (
    id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo,
    mano_obra_sin_iva, alicuota_iva, mano_obra_iva, mano_obra_con_iva,
    repuestos_total, total_cotizado, dias_estimados, monto_minimo_cierre_mo,
    observaciones, version_actual
) VALUES
    (9811, 9401, 1, 1, '2026-03-29', 'CERRADO', 450000.00, 21.00, 94500.00, 544500.00, 210000.00, 754500.00, 4, 400000.00, 'Presupuesto ejecutado y cerrado.', 2),
    (9812, 9402, 1, 2, '2026-04-03', 'APROBADO', 780000.00, 21.00, 163800.00, 943800.00, 320000.00, 1263800.00, 5, 700000.00, 'Aprobado por compania. Falta orden final de compra.', 1),
    (9813, 9403, 1, 1, '2026-04-04', 'PENDIENTE', 390000.00, 21.00, 81900.00, 471900.00, 185000.00, 656900.00, 3, 350000.00, 'Esperando validacion CLEAS.', 1);

INSERT INTO presupuesto_items (
    id, presupuesto_id, orden_visual, pieza_afectada, tarea_codigo, nivel_danio_codigo,
    decision_repuesto_codigo, accion_codigo, requiere_reemplazo, valor_repuesto,
    horas_estimadas, importe_mano_obra, activo
) VALUES
    (9821, 9811, 1, 'Paragolpe delantero', 'CHAPA', 'MEDIO', 'REPARAR', 'REPARAR', 0, 0.00, 5.50, 180000.00, 1),
    (9822, 9811, 2, 'Optica delantera derecha', 'ELECTRICIDAD', 'LEVE', 'REEMPLAZAR', 'REEMPLAZAR', 1, 210000.00, 1.20, 45000.00, 1),
    (9823, 9812, 1, 'Puerta delantera izquierda', 'CHAPA', 'GRAVE', 'REEMPLAZAR', 'REEMPLAZAR', 1, 250000.00, 7.00, 290000.00, 1),
    (9824, 9812, 2, 'Zocalo lateral', 'PINTURA', 'MEDIO', 'REPARAR', 'REPARAR_Y_PINTAR', 0, 70000.00, 4.50, 180000.00, 1),
    (9825, 9813, 1, 'Paragolpe trasero', 'CHAPA', 'MEDIO', 'REPARAR', 'REPARAR', 0, 45000.00, 3.00, 130000.00, 1),
    (9826, 9813, 2, 'Porton trasero', 'PINTURA', 'LEVE', 'PULIR', 'DIFUMINAR', 0, 140000.00, 2.50, 95000.00, 1);

INSERT INTO repuestos_caso (
    id, caso_id, presupuesto_item_id, descripcion, codigo_pieza, proveedor_final,
    autorizado_codigo, estado_codigo, compra_por_codigo, pago_estado_codigo,
    precio_presupuestado, precio_final, fecha_recibido, usado, devuelto
) VALUES
    (9831, 9401, 9822, 'Optica delantera derecha', 'OPT-ONIX-01', 'Repuestos Orono', 'AUTORIZADO', 'INSTALADO', 'TALLER', 'PAGADO', 210000.00, 208500.00, '2026-04-02', 1, 0),
    (9832, 9402, 9823, 'Puerta delantera izquierda', 'PUE-208-IZQ', 'Repuestos Centro', 'AUTORIZADO', 'PEDIDO', 'COMPANIA', 'PENDIENTE', 250000.00, NULL, NULL, 0, 0),
    (9833, 9402, 9824, 'Moldura lateral', 'MOL-208-LAT', 'Repuestos Centro', 'PENDIENTE', 'PENDIENTE', 'TALLER', 'PENDIENTE', 70000.00, NULL, NULL, 0, 0),
    (9834, 9403, 9826, 'Porton trasero', 'POR-NIVUS-01', 'CLEAS Repuestos', 'AUTORIZADO', 'EN_CAMINO', 'COMPANIA', 'NO_APLICA', 140000.00, 138000.00, NULL, 0, 0);

INSERT INTO documentos (
    id, public_id, storage_key, nombre_archivo, extension, mime_type, tamano_bytes,
    checksum_sha256, categoria_id, subcategoria_codigo, fecha_documento, subido_por,
    origen_codigo, observaciones, reemplaza_documento_id, activo
) VALUES
    (9841, '00000000-0000-0000-0000-000000009841', 'seed/9001PZ/orden-ingreso.pdf', 'orden-ingreso-9001PZ.pdf', 'pdf', 'application/pdf', 125430, '1111111111111111111111111111111111111111111111111111111111111111', 1, NULL, '2026-04-01', 1, 'SEED_LOCAL', 'Orden de ingreso del caso cerrado.', NULL, 1),
    (9842, '00000000-0000-0000-0000-000000009842', 'seed/9002TC/presupuesto.pdf', 'presupuesto-9002TC.pdf', 'pdf', 'application/pdf', 223120, '2222222222222222222222222222222222222222222222222222222222222222', 3, NULL, '2026-04-03', 1, 'SEED_LOCAL', 'Presupuesto enviado a la compania.', NULL, 1),
    (9844, '00000000-0000-0000-0000-000000009844', 'seed/9001PZ/foto-dano.jpg', 'foto-dano-9001PZ.jpg', 'jpg', 'image/jpeg', 484210, '4444444444444444444444444444444444444444444444444444444444444444', 2, NULL, '2026-03-28', 1, 'SEED_LOCAL', 'Foto principal del dano.', NULL, 1);

INSERT INTO documento_relaciones (id, documento_id, caso_id, entidad_tipo, entidad_id, modulo_codigo, principal, visible_cliente, orden_visual) VALUES
    (9851, 9841, 9401, 'CASE', 9401, 'OPERACION', 1, 1, 1),
    (9852, 9842, 9402, 'BUDGET', 9812, 'FINANZAS', 1, 1, 1),
    (9854, 9844, 9401, 'CASE', 9401, 'OPERACION', 0, 1, 2);

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
    (9872, '00000000-0000-0000-0000-000000009872', 9402, 9862, 'INGRESO', 'ASEGURADORA', 'COMPANIA', NULL, 9701, '2026-04-08 11:00:00', 400000.00, 400000.00, 'TRANSFERENCIA', 'Anticipo compania', 'PRESUPUESTO', 0, 0, 'Anticipo para iniciar compra de repuestos.', 'TRX-9002-A', 1);

INSERT INTO movimiento_retenciones (id, movimiento_id, tipo_retencion_codigo, monto, detalle) VALUES
    (9881, 9871, 'IVA', 18900.00, 'Retencion IVA caso 9001PZ'),
    (9882, 9871, 'GANANCIAS', 12600.00, 'Retencion ganancias caso 9001PZ'),
    (9883, 9871, 'IIBB', 0.00, 'Sin retencion adicional');

INSERT INTO movimiento_aplicaciones (id, movimiento_id, caso_id, concepto_codigo, entidad_tipo, entidad_id, monto_aplicado) VALUES
    (9891, 9871, 9401, 'MANO_OBRA', 'PRESUPUESTO', 9811, 544500.00),
    (9892, 9871, 9401, 'REPUESTO', 'PRESUPUESTO', 9811, 210000.00);

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

INSERT INTO caso_cleas (
    id, caso_id, alcance_codigo, dictamen_codigo, monto_franquicia, monto_cargo_cliente,
    estado_pago_cliente_codigo, fecha_pago_cliente, monto_pago_compania_franquicia,
    estado_pago_compania_franquicia_codigo, fecha_pago_compania_franquicia
) VALUES
    (9771, 9403, 'PARCIAL', 'PENDIENTE', 150000.00, 0.00, 'NO_APLICA', NULL, 150000.00, 'PENDIENTE', NULL);

INSERT INTO notificaciones (id, usuario_id, caso_id, tipo_codigo, titulo, mensaje, leida, leida_at, accion_url, entidad_tipo, entidad_id, created_at) VALUES
    (9971, 1, 9402, 'TURNO_ASIGNADO', 'Turno cargado para 9002TC', 'El caso 9002TC ya tiene turno programado para el 10/04 a las 09:15.', 0, NULL, '/cases/9402/appointments', 'TURNO_REPARACION', 9806, '2026-04-08 09:05:00'),
    (9972, 1, 9401, 'PAGO_REGISTRADO', 'Pago registrado en 9001PZ', 'Se registro el cobro final del caso 9001PZ y ya figura como pagado.', 1, '2026-04-05 16:30:00', '/cases/9401/finance-summary', 'MOVIMIENTO_FINANCIERO', 9871, '2026-04-05 16:15:00');

COMMIT;

-- Credenciales utiles para la demo:
-- - admin@tallerzapata.local / password
