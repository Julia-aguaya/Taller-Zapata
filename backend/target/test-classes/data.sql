INSERT INTO tipos_tramite (id, codigo, nombre, prefijo_carpeta, orden_visual, requiere_tramitacion, requiere_abogado, activo) VALUES
(1, 'PARTICULAR', 'Particular', 'P', 1, FALSE, FALSE, TRUE);

INSERT INTO organizaciones (id, public_id, codigo, nombre) VALUES
(1, '00000000-0000-0000-0000-000000000001', 'TZ', 'Taller Zapata');

INSERT INTO sucursales (id, organizacion_id, codigo, nombre) VALUES
(1, 1, 'Z', 'Zapata'),
(2, 1, 'C', 'Centro');

INSERT INTO roles (id, codigo, nombre, activo) VALUES
(1, 'ROLE_ADMIN', 'Administrador', TRUE),
(2, 'ROLE_OPERADOR', 'Operador', TRUE);

INSERT INTO permisos (id, codigo) VALUES
(1, 'caso.ver'),
(2, 'caso.crear'),
(3, 'workflow.transicionar'),
(4, 'auditoria.ver'),
(5, 'identity.permissions.read'),
(6, 'identity.roles.manage'),
(7, 'workflow.tramite.avanzar'),
(8, 'workflow.tramite.cerrar'),
(9, 'workflow.reparacion.asignar_turno'),
(10, 'workflow.reparacion.cerrar'),
(11, 'workflow.pago.marcar_pagado'),
(12, 'workflow.documentacion.completar'),
(13, 'workflow.legal.iniciar'),
(14, 'turno.ver'),
(15, 'turno.crear'),
(16, 'turno.editar'),
(17, 'tarea.ver'),
(18, 'tarea.crear'),
(19, 'tarea.editar'),
(20, 'ingreso.ver'),
(21, 'ingreso.crear'),
(22, 'egreso.ver'),
(23, 'egreso.crear'),
(24, 'documento.ver'),
(25, 'documento.subir'),
(26, 'documento.relacionar'),
(27, 'finanza.ver'),
(28, 'finanza.crear'),
(29, 'seguro.ver'),
(30, 'seguro.crear');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(1, 1, 1, TRUE),
(2, 1, 2, TRUE),
(3, 1, 3, TRUE),
(4, 1, 4, TRUE),
(5, 2, 1, TRUE),
(6, 2, 2, TRUE),
(7, 2, 3, TRUE),
(8, 1, 5, TRUE),
(9, 1, 6, TRUE),
(10, 1, 7, TRUE),
(11, 1, 8, TRUE),
(12, 1, 9, TRUE),
(13, 1, 10, TRUE),
(14, 1, 11, TRUE),
(15, 1, 12, TRUE),
(16, 1, 13, TRUE),
(17, 2, 7, TRUE),
(18, 2, 8, TRUE),
(19, 2, 9, TRUE),
(20, 2, 10, TRUE),
(21, 2, 11, TRUE),
(22, 2, 12, TRUE),
(23, 2, 13, TRUE),
(24, 1, 14, TRUE),
(25, 1, 15, TRUE),
(26, 1, 16, TRUE),
(27, 1, 17, TRUE),
(28, 1, 18, TRUE),
(29, 1, 19, TRUE),
(30, 2, 14, TRUE),
(31, 2, 15, TRUE),
(32, 2, 16, TRUE),
(33, 2, 17, TRUE),
(34, 2, 18, TRUE),
(35, 2, 19, TRUE),
(36, 1, 20, TRUE),
(37, 1, 21, TRUE),
(38, 1, 22, TRUE),
(39, 1, 23, TRUE),
(40, 2, 20, TRUE),
(41, 2, 21, TRUE),
(42, 2, 22, TRUE),
(43, 2, 23, TRUE),
(44, 1, 24, TRUE),
(45, 1, 25, TRUE),
(46, 1, 26, TRUE),
(47, 2, 24, TRUE),
(48, 2, 25, TRUE),
(49, 2, 26, TRUE),
(50, 1, 27, TRUE),
(51, 1, 28, TRUE),
(52, 2, 27, TRUE),
(53, 2, 28, TRUE),
(54, 1, 29, TRUE),
(55, 1, 30, TRUE),
(56, 2, 29, TRUE),
(57, 2, 30, TRUE);

INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES
(1, '00000000-0000-0000-0000-000000000100', 'admin', 'admin@tallerzapata.local', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'Bootstrap', TRUE);

INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES
(1, 1, 1, 1, NULL, TRUE);

INSERT INTO workflow_estados (id, codigo, dominio, nombre, terminal) VALUES
(1, 'INGRESADO', 'tramite', 'Ingresado', FALSE),
(2, 'EN_TRAMITE', 'tramite', 'En tramite', FALSE),
(3, 'CERRADO', 'tramite', 'Cerrado', TRUE),
(4, 'SIN_TURNO', 'reparacion', 'Sin turno', FALSE),
(5, 'CON_TURNO', 'reparacion', 'Con turno', FALSE),
(6, 'REPARADO', 'reparacion', 'Reparado', TRUE),
(7, 'PENDIENTE', 'pago', 'Pendiente', FALSE),
(8, 'PAGADO', 'pago', 'Pagado', TRUE),
(9, 'PENDIENTE_DOCS', 'documentacion', 'Pendiente docs', FALSE),
(10, 'COMPLETA', 'documentacion', 'Completa', TRUE),
(11, 'SIN_GESTION', 'legal', 'Sin gestion', FALSE),
(12, 'EN_ESTUDIO', 'legal', 'En estudio', FALSE);

INSERT INTO tipos_contacto (codigo, nombre, activo) VALUES
('TELEFONO', 'Telefono fijo', TRUE),
('CEL', 'Celular', TRUE),
('CELULAR', 'Celular', TRUE),
('EMAIL', 'Correo electronico', TRUE),
('WHATSAPP', 'WhatsApp', TRUE),
('OTRO', 'Otro', TRUE);

INSERT INTO tipos_domicilio (codigo, nombre, activo) VALUES
('FISCAL', 'Fiscal', TRUE),
('REAL', 'Real', TRUE),
('LEGAL', 'Legal', TRUE),
('LABORAL', 'Laboral', TRUE),
('OTRO', 'Otro', TRUE);

INSERT INTO roles_vehiculo (codigo, nombre, activo) VALUES
('TITULAR', 'Titular', TRUE),
('CONDUCTOR', 'Conductor', TRUE),
('ASEGURADO', 'Asegurado', TRUE),
('TENEDOR', 'Tenedor', TRUE),
('PRINCIPAL', 'Principal', TRUE),
('OTRO', 'Otro', TRUE);

INSERT INTO roles_caso (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', TRUE),
('ASEGURADO', 'Asegurado', TRUE),
('TERCERO', 'Tercero', TRUE),
('CONDUCTOR', 'Conductor', TRUE),
('TITULAR', 'Titular', TRUE),
('OTRO', 'Otro', TRUE);

INSERT INTO prioridades_caso (codigo, nombre, orden_visual, activo) VALUES
('BAJA', 'Baja', 1, TRUE),
('MEDIA', 'Media', 2, TRUE),
('ALTA', 'Alta', 3, TRUE),
('URGENTE', 'Urgente', 4, TRUE);

INSERT INTO estados_turno_reparacion (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('REPROGRAMADO', 'Reprogramado', TRUE),
('CANCELADO', 'Cancelado', TRUE),
('CUMPLIDO', 'Cumplido', TRUE);

INSERT INTO estados_tarea (codigo, nombre, terminal, activo) VALUES
('PENDIENTE', 'Pendiente', FALSE, TRUE),
('EN_PROGRESO', 'En progreso', FALSE, TRUE),
('RESUELTA', 'Resuelta', TRUE, TRUE),
('CANCELADA', 'Cancelada', TRUE, TRUE);

INSERT INTO prioridades_tarea (codigo, nombre, orden_visual, activo) VALUES
('BAJA', 'Baja', 1, TRUE),
('MEDIA', 'Media', 2, TRUE),
('ALTA', 'Alta', 3, TRUE),
('URGENTE', 'Urgente', 4, TRUE);

INSERT INTO combustibles_vehiculo (codigo, nombre, activo) VALUES
('VACIO', 'Vacio', TRUE),
('RESERVA', 'Reserva', TRUE),
('MEDIO', 'Medio tanque', TRUE),
('LLENO', 'Lleno', TRUE);

INSERT INTO tipos_ingreso_item (codigo, nombre, activo) VALUES
('ACCESORIO', 'Accesorio', TRUE),
('DANO_PREEXISTENTE', 'Dano preexistente', TRUE),
('FALTANTE', 'Faltante', TRUE),
('OBSERVACION', 'Observacion', TRUE);

INSERT INTO estados_ingreso_item (codigo, nombre, activo) VALUES
('OK', 'OK', TRUE),
('OBSERVADO', 'Observado', TRUE),
('FALTANTE', 'Faltante', TRUE),
('DANADO', 'Danado', TRUE);

INSERT INTO estados_reingreso (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('AGENDADO', 'Agendado', TRUE),
('REINGRESADO', 'Reingresado', TRUE),
('CANCELADO', 'Cancelado', TRUE);

INSERT INTO categorias_documentales (id, codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo) VALUES
(1, 'ORDEN_INGRESO', 'Orden de ingreso', 'OPERACION', NULL, TRUE, TRUE, TRUE),
(2, 'FOTO_DANO', 'Foto de dano', 'OPERACION', NULL, FALSE, TRUE, TRUE),
(3, 'PRESUPUESTO', 'Presupuesto', 'FINANZAS', NULL, TRUE, TRUE, TRUE),
(4, 'INFORME_INTERNO', 'Informe interno', 'OPERACION', NULL, FALSE, FALSE, TRUE);

INSERT INTO tipos_movimiento_financiero (codigo, nombre, signo, activo) VALUES
('INGRESO', 'Ingreso', 1, TRUE),
('EGRESO', 'Egreso', -1, TRUE),
('AJUSTE', 'Ajuste', 1, TRUE);

INSERT INTO origenes_flujo_financiero (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', TRUE),
('ASEGURADORA', 'Aseguradora', TRUE),
('INTERNO', 'Interno', TRUE);

INSERT INTO contrapartes_tipo_financiero (codigo, nombre, activo) VALUES
('PERSONA', 'Persona', TRUE),
('COMPANIA', 'Compania', TRUE),
('CAJA', 'Caja', TRUE);

INSERT INTO medios_pago_financiero (codigo, nombre, activo) VALUES
('EFECTIVO', 'Efectivo', TRUE),
('TRANSFERENCIA', 'Transferencia', TRUE),
('TARJETA', 'Tarjeta', TRUE),
('CHEQUE', 'Cheque', TRUE);

INSERT INTO cancela_tipos_financiero (codigo, nombre, activo) VALUES
('NINGUNO', 'Ninguno', TRUE),
('PRESUPUESTO', 'Presupuesto', TRUE),
('FRANQUICIA', 'Franquicia', TRUE),
('REPUESTO', 'Repuesto', TRUE);

INSERT INTO tipos_retencion_financiero (codigo, nombre, activo) VALUES
('IVA', 'IVA', TRUE),
('IIBB', 'Ingresos Brutos', TRUE),
('GANANCIAS', 'Ganancias', TRUE);

INSERT INTO conceptos_aplicacion_financiera (codigo, nombre, activo) VALUES
('MANO_OBRA', 'Mano de obra', TRUE),
('REPUESTO', 'Repuesto', TRUE),
('FRANQUICIA', 'Franquicia', TRUE),
('BONIFICACION', 'Bonificacion', TRUE);

INSERT INTO tipos_comprobante_emitido (codigo, nombre, activo) VALUES
('FACTURA', 'Factura', TRUE),
('RECIBO', 'Recibo', TRUE),
('NOTA_CREDITO', 'Nota de credito', TRUE);

INSERT INTO roles_contacto_compania (codigo, nombre, activo) VALUES
('TRAMITADOR', 'Tramitador', TRUE),
('INSPECTOR', 'Inspector', TRUE),
('COBRANZA', 'Cobranza', TRUE);

INSERT INTO modalidades_tramitacion_seguro (codigo, nombre, activo) VALUES
('CONVENIO', 'Convenio', TRUE),
('INSPECCION', 'Inspeccion', TRUE),
('EXPRESS', 'Express', TRUE);

INSERT INTO dictamenes_tramitacion_seguro (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('APROBADO', 'Aprobado', TRUE),
('RECHAZADO', 'Rechazado', TRUE);

INSERT INTO estados_cotizacion_seguro (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('ENVIADA', 'Enviada', TRUE),
('ACEPTADA', 'Aceptada', TRUE),
('RECHAZADA', 'Rechazada', TRUE);

INSERT INTO autorizaciones_repuestos_seguro (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('AUTORIZADO', 'Autorizado', TRUE),
('RECHAZADO', 'Rechazado', TRUE);

INSERT INTO estados_franquicia (codigo, nombre, activo) VALUES
('SIN_DEFINIR', 'Sin definir', TRUE),
('COBRAR_CLIENTE', 'Cobrar al cliente', TRUE),
('RECUPERAR', 'Recuperar', TRUE),
('CERRADA', 'Cerrada', TRUE);

INSERT INTO tipos_recupero_franquicia (codigo, nombre, activo) VALUES
('NINGUNO', 'Ninguno', TRUE),
('CLIENTE', 'Cliente', TRUE),
('TERCERO', 'Tercero', TRUE);

INSERT INTO dictamenes_franquicia (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('PROCEDE', 'Procede', TRUE),
('NO_PROCEDE', 'No procede', TRUE);

INSERT INTO alcances_cleas (codigo, nombre, activo) VALUES
('PARCIAL', 'Parcial', TRUE),
('TOTAL', 'Total', TRUE),
('NO_CUBIERTO', 'No cubierto', TRUE);

INSERT INTO dictamenes_cleas (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('FAVORABLE', 'Favorable', TRUE),
('DESFAVORABLE', 'Desfavorable', TRUE);

INSERT INTO estados_pago (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('COBRADO', 'Cobrado', TRUE),
('NO_APLICA', 'No aplica', TRUE);

INSERT INTO estados_documentacion_terceros (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('EN_REVISION', 'En revision', TRUE),
('ACEPTADA', 'Aceptada', TRUE),
('RECHAZADA', 'Rechazada', TRUE);

INSERT INTO modos_provision_repuestos (codigo, nombre, activo) VALUES
('TALLER', 'Taller', TRUE),
('TERCERO', 'Tercero', TRUE),
('COMPANIA', 'Compania', TRUE),
('NO_APLICA', 'No aplica', TRUE);

INSERT INTO quienes_tramitan_legal (codigo, nombre, activo) VALUES
('ABOGADO', 'Abogado', TRUE),
('TALLER', 'Taller', TRUE),
('CLIENTE', 'Cliente', TRUE);

INSERT INTO quienes_reclaman_legal (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', TRUE),
('TALLER', 'Taller', TRUE),
('TERCERO', 'Tercero', TRUE),
('COMPANIA', 'Compania', TRUE);

INSERT INTO instancias_legal (codigo, nombre, activo) VALUES
('ADMINISTRATIVA', 'Administrativa', TRUE),
('JUDICIAL', 'Judicial', TRUE),
('ARBITRAJE', 'Arbitraje', TRUE),
('MEDIACION', 'Mediacion', TRUE);

INSERT INTO cierre_por_legal (codigo, nombre, activo) VALUES
('ACUERDO', 'Acuerdo', TRUE),
('SENTENCIA', 'Sentencia', TRUE),
('DESISTIMIENTO', 'Desistimiento', TRUE),
('CADUCIDAD', 'Caducidad', TRUE);

INSERT INTO pagado_por_gasto_legal (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', TRUE),
('ABOGADO', 'Abogado', TRUE),
('TALLER', 'Taller', TRUE),
('TERCERO', 'Tercero', TRUE);

INSERT INTO informes_estado (codigo, nombre, activo) VALUES
('BORRADOR', 'Borrador', TRUE),
('PENDIENTE', 'Pendiente', TRUE),
('APROBADO', 'Aprobado', TRUE),
('RECHAZADO', 'Rechazado', TRUE),
('CERRADO', 'Cerrado', TRUE);

INSERT INTO tareas_presupuesto (codigo, nombre, activo) VALUES
('CHAPA', 'Chapa', TRUE),
('PINTURA', 'Pintura', TRUE),
('MECANICA', 'Mecanica', TRUE),
('ELECTRICIDAD', 'Electricidad', TRUE),
('PULIDO', 'Pulido', TRUE),
('OTRO', 'Otro', TRUE);

INSERT INTO niveles_danio (codigo, nombre, activo) VALUES
('LEVE', 'Leve', TRUE),
('MEDIO', 'Medio', TRUE),
('GRAVE', 'Grave', TRUE),
('TOTAL', 'Total', TRUE);

INSERT INTO decisiones_repuesto (codigo, nombre, activo) VALUES
('REPARAR', 'Reparar', TRUE),
('REEMPLAZAR', 'Reemplazar', TRUE),
('PULIR', 'Pulir', TRUE),
('NO_APLICA', 'No aplica', TRUE);

INSERT INTO acciones_presupuesto (codigo, nombre, activo) VALUES
('DESABOLLAR', 'Desabollar', TRUE),
('ENDEREZAR', 'Enderezar', TRUE),
('PINTAR', 'Pintar', TRUE),
('CAMBIAR', 'Cambiar', TRUE),
('REPARAR', 'Reparar', TRUE),
('AJUSTAR', 'Ajustar', TRUE),
('LIMPIAR', 'Limpiar', TRUE);

INSERT INTO estados_repuesto (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('PEDIDO', 'Pedido', TRUE),
('EN_CAMINO', 'En camino', TRUE),
('RECIBIDO', 'Recibido', TRUE),
('INSTALADO', 'Instalado', TRUE),
('DEVUELTO', 'Devuelto', TRUE),
('CANCELADO', 'Cancelado', TRUE);

INSERT INTO compra_por_repuesto (codigo, nombre, activo) VALUES
('TALLER', 'Taller', TRUE),
('COMPANIA', 'Compania', TRUE),
('CLIENTE', 'Cliente', TRUE),
('TERCERO', 'Tercero', TRUE);

INSERT INTO pagos_estado_repuesto (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('PAGADO', 'Pagado', TRUE),
('NO_APLICA', 'No aplica', TRUE);

INSERT INTO permisos (id, codigo) VALUES
(31, 'presupuesto.ver'),
(32, 'presupuesto.crear');

INSERT INTO feriados (fecha, descripcion, tipo_codigo) VALUES
('2026-01-01', 'Anio Nuevo', 'NACIONAL'),
('2026-05-01', 'Dia del Trabajador', 'NACIONAL'),
('2026-05-25', 'Revolucion de Mayo', 'NACIONAL'),
('2026-07-09', 'Dia de la Independencia', 'NACIONAL'),
('2026-12-25', 'Navidad', 'NACIONAL');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(58, 1, 31, TRUE),
(59, 1, 32, TRUE),
(60, 2, 31, TRUE),
(61, 2, 32, TRUE);

INSERT INTO quienes_gestionan_recupero (codigo, nombre, activo) VALUES
('ABOGADO', 'Abogado', TRUE),
('TALLER', 'Taller', TRUE),
('CLIENTE', 'Cliente', TRUE),
('ASEGURADORA', 'Aseguradora', TRUE);

INSERT INTO dictamenes_recupero (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('PROCEDE', 'Procede', TRUE),
('NO_PROCEDE', 'No procede', TRUE),
('MENOR_ACUERDO', 'Menor acuerdo', TRUE);

INSERT INTO estados_cobro_recupero (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', TRUE),
('COBRADO', 'Cobrado', TRUE),
('NO_APLICA', 'No aplica', TRUE),
('EN_JUICIO', 'En juicio', TRUE);

INSERT INTO permisos (id, codigo) VALUES
(33, 'recupero.ver'),
(34, 'recupero.crear');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(62, 1, 33, TRUE),
(63, 1, 34, TRUE),
(64, 2, 33, TRUE),
(65, 2, 34, TRUE);

INSERT INTO tipos_dato_parametro (codigo, nombre, activo) VALUES
('STRING', 'Texto', TRUE),
('NUMBER', 'Numero', TRUE),
('BOOLEAN', 'Booleano', TRUE),
('DATE', 'Fecha', TRUE),
('JSON', 'JSON', TRUE);

INSERT INTO permisos (id, codigo) VALUES
(35, 'parametro.ver'),
(36, 'parametro.editar');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(66, 1, 35, TRUE),
(67, 1, 36, TRUE),
(68, 2, 35, TRUE),
(69, 2, 36, TRUE);

INSERT INTO tipos_notificacion (codigo, nombre, activo) VALUES
('TURNO_ASIGNADO', 'Turno asignado', 1),
('PRESUPUESTO_APROBADO', 'Presupuesto aprobado', 1),
('PRESUPUESTO_RECHAZADO', 'Presupuesto rechazado', 1),
('REPUESTO_RECIBIDO', 'Repuesto recibido', 1),
('VEHICULO_LISTO', 'Vehiculo listo', 1),
('PAGO_REGISTRADO', 'Pago registrado', 1),
('DOCUMENTO_SUBIDO', 'Documento subido', 1),
('CASO_TRANSFERIDO', 'Caso transferido', 1),
('RECORDATORIO', 'Recordatorio', 1);

INSERT INTO permisos (id, codigo) VALUES
(37, 'notificacion.ver'),
(38, 'notificacion.crear');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(70, 1, 37, TRUE),
(71, 1, 38, TRUE),
(72, 2, 37, TRUE),
(73, 2, 38, TRUE);

INSERT INTO permisos (id, codigo) VALUES
(39, 'persona.ver'),
(40, 'persona.crear'),
(41, 'vehiculo.ver'),
(42, 'vehiculo.crear'),
(43, 'documento.crear');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(74, 1, 39, TRUE),
(75, 1, 40, TRUE),
(76, 1, 41, TRUE),
(77, 1, 42, TRUE),
(78, 1, 43, TRUE),
(79, 2, 39, TRUE),
(80, 2, 40, TRUE),
(81, 2, 41, TRUE),
(82, 2, 42, TRUE),
(83, 2, 43, TRUE);

INSERT INTO parametros_sistema (codigo, valor, tipo_dato_codigo, descripcion, editable, visible, modulo_codigo, created_at, updated_at) VALUES
('TASA_IVA_DEFAULT', '21.00', 'NUMBER', 'Tasa de IVA por defecto', TRUE, TRUE, 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('DIAS_PAGO_ESPERADOS_DEFAULT', '30', 'NUMBER', 'Dias de pago esperados por defecto', TRUE, TRUE, 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('REQUIERE_FOTOS_REPARADO_DEFAULT', 'false', 'BOOLEAN', 'Requiere fotos del vehiculo reparado por defecto', TRUE, TRUE, 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PREFIJO_CARPETA_DEFAULT', 'TZ', 'STRING', 'Prefijo de carpeta por defecto', TRUE, TRUE, 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
