package com.tallerzapata.backend.testsupport;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Limpia tablas transaccionales para tests de integracion.
 * NO limpia catalogos ni seeds de Flyway (workflow_estados, permisos, etc.)
 * porque se comparten entre tests y su recreacion es costosa.
 *
 * Uso: autowired en el test, llamar cleanAll() en @BeforeEach.
 */
@Component
public class TestDatabaseCleaner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Tablas transaccionales que se pueden borrar sin afectar catálogos.
     * Orden: hijas primero, padres después (aunque deshabilitamos FKs).
     * Si una tabla no existe, se ignora silenciosamente (tolerancia a schema parcial).
     */
    private static final List<String> TRANSACTIONAL_TABLES = List.of(
            // Autenticacion
            "auth_refresh_tokens",
            "usuario_roles",
            "usuarios",          // excepto el admin base (id=1), filtrado abajo

            // Notificaciones
            "notificaciones",

            // Finanzas
            "movimiento_aplicaciones",
            "movimiento_retenciones",
            "movimientos_financieros",
            "comprobantes_emitidos",

            // Documentos
            "documento_relaciones",
            "documentos",

            // Operaciones
            "egresos_vehiculo",
            "ingreso_items",
            "ingresos_vehiculo",
            "turnos_reparacion",
            "tareas",

            // Legal / Seguros / Recuperos
            "legal_gastos",
            "legal_novedades",
            "caso_legal",
            "caso_terceros",
            "caso_cleas",
            "caso_franquicia",
            "caso_tramitacion_seguro",
            "caso_seguro",
            "companias_contactos",
            "companias_seguro",
            "recuperos_franquicia",

            // Presupuestos y repuestos
            "presupuesto_items",
            "presupuestos",
            "repuestos_caso",

            // Caso
            "auditoria_eventos",
            "caso_estado_historial",
            "caso_relaciones",
            "caso_siniestro",
            "caso_vehiculos",
            "caso_personas",
            "casos",

            // Vehiculos y personas
            "vehiculo_personas",
            "vehiculos",
            "persona_contactos",
            "persona_domicilios",
            "personas",

            // Parametros (transaccionales)
            "parametros_sistema"
    );

    public void cleanAll() {
        disableReferentialIntegrity();
        try {
            for (String table : TRANSACTIONAL_TABLES) {
                safeDelete(table);
            }
        } finally {
            enableReferentialIntegrity();
        }
    }

    /**
     * Limpia solo las tablas relacionadas con casos y sus dependencias directas.
     * Util cuando un test no toca finanzas, documentos, etc.
     */
    public void cleanCaseRelated() {
        disableReferentialIntegrity();
        try {
            List<String> caseTables = List.of(
                    "auditoria_eventos",
                    "caso_estado_historial",
                    "caso_relaciones",
                    "caso_siniestro",
                    "caso_vehiculos",
                    "caso_personas",
                    "casos",
                    "vehiculo_personas",
                    "vehiculos",
                    "persona_contactos",
                    "persona_domicilios",
                    "personas"
            );
            for (String table : caseTables) {
                safeDelete(table);
            }
        } finally {
            enableReferentialIntegrity();
        }
    }

    private void safeDelete(String table) {
        try {
            if ("usuarios".equals(table)) {
                // Preservar usuario admin base (id=1)
                jdbcTemplate.update("DELETE FROM " + table + " WHERE id <> 1");
            } else if ("usuario_roles".equals(table)) {
                // Preservar roles del admin base (usuario_id=1)
                jdbcTemplate.update("DELETE FROM " + table + " WHERE usuario_id <> 1");
            } else {
                jdbcTemplate.update("DELETE FROM " + table);
            }
        } catch (BadSqlGrammarException e) {
            // Tabla no existe en este schema; ignorar silenciosamente.
            // Esto permite que el cleaner sea robusto ante migraciones
            // condicionales o tablas que aun no fueron creadas.
        }
    }

    private void disableReferentialIntegrity() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    }

    private void enableReferentialIntegrity() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    }
}
