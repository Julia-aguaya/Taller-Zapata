package com.tallerzapata.backend.api.casefile;

import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseListFiltersIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedUsers();
        seedPeopleAndVehicles();
        seedCases();
        seedHistory();
        seedInsuranceProcessing();
        seedRecovery();
        seedTasks();
        seedFinancialMovements();
    }

    @Test
    void shouldFilterCasesByFolderStatusAndOpenedRange() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .param("folderStatus", "Abiertas")
                        .param("openedFrom", "2026-02-01")
                        .param("openedTo", "2026-02-28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(101))
                .andExpect(jsonPath("$.items[0].folderCode").value("0101TZ"));
    }

    @Test
    void shouldFilterCasesByTypeVisibleStatesAndPaymentState() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .param("caseTypeCode", "TODO_RIESGO")
                        .param("visibleTramiteState", "En tramite")
                        .param("visibleRepairState", "En tramite")
                        .param("paymentStateCode", "PENDIENTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(101));
    }

    @Test
    void shouldFilterCasesByOpinionAndManager() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .param("opinionCode", "PROCEDE")
                        .param("managerCode", "ABOGADO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(102));
    }

    @Test
    void shouldFilterCasesByPendingTasksAssignedUser() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .param("hasPendingTasks", "true")
                        .param("pendingTaskAssignedUserId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(100));
    }

    @Test
    void shouldFilterPaidCasesByMovementDateRange() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .param("paidFrom", "2026-03-01")
                        .param("paidTo", "2026-03-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(102));
    }

    private void seedUsers() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "melina", "melina@tallerzapata.local", "hash", "Melina", "Zapata", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
    }

    private void seedPeopleAndVehicles() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000001001", "fisica", "Ana", "Uno", "Ana Uno", "DNI", "11111111", "11111111", true
        );
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                2L, "00000000-0000-0000-0000-000000001002", "fisica", "Beto", "Dos", "Beto Dos", "DNI", "22222222", "22222222", true
        );
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000001003", "fisica", "Carla", "Tres", "Carla Tres", "DNI", "33333333", "33333333", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000002001", "AA111AA", "AA111AA", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                2L, "00000000-0000-0000-0000-000000002002", "BB222BB", "BB222BB", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000002003", "CC333CC", "CC333CC", true
        );
    }

    private void seedCases() {
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 1L, 1L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA"
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                101L, "00000000-0000-0000-0000-000000003101", "0101TZ", 101L, 2L, 1L, 1L, 2L, 2L, false, 1L, 2L, 5L, 7L, 9L, 11L, "ALTA"
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo, fecha_cierre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                102L, "00000000-0000-0000-0000-000000003102", "0102RFZ", 102L, 7L, 1L, 1L, 3L, 3L, false, 1L, 2L, 5L, 8L, 9L, 11L, "BAJA", LocalDateTime.of(2026, 3, 20, 10, 0)
        );
    }

    private void seedHistory() {
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "tramite", 1L, LocalDateTime.of(2026, 1, 5, 8, 0), 1L, false, "Alta", "{}"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                101L, "tramite", 2L, LocalDateTime.of(2026, 2, 10, 8, 0), 1L, false, "Alta", "{}"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                102L, "tramite", 2L, LocalDateTime.of(2026, 3, 15, 8, 0), 1L, false, "Alta", "{}"
        );
    }

    private void seedInsuranceProcessing() {
        jdbcTemplate.update(
                "INSERT INTO caso_tramitacion_seguro (caso_id, fecha_presentacion, dictamen_codigo, cotizacion_estado_codigo, lleva_repuestos, no_repara, admin_override_turno) VALUES (?, ?, ?, ?, ?, ?, ?)",
                101L, java.sql.Date.valueOf("2026-02-11"), "APROBADO", "ENVIADA", true, false, false
        );
    }

    private void seedRecovery() {
        jdbcTemplate.update(
                "INSERT INTO recuperos_franquicia (caso_id, gestiona_codigo, dictamen_codigo, habilita_reparacion, recupera_cliente, aprobado_menor_acuerdo, reutiliza_datos_base) VALUES (?, ?, ?, ?, ?, ?, ?)",
                102L, "ABOGADO", "PROCEDE", true, false, false, false
        );
    }

    private void seedTasks() {
        jdbcTemplate.update(
                "INSERT INTO tareas (id, public_id, caso_id, organizacion_id, sucursal_id, modulo_origen_codigo, subtab_origen_codigo, titulo, fecha_limite, prioridad_codigo, estado_codigo, usuario_asignado_id, created_by, resuelta, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1000L, "00000000-0000-0000-0000-000000004000", 100L, 1L, 1L, "gestion", "tramite", "Llamar cliente", java.sql.Date.valueOf("2026-01-07"), "MEDIA", "PENDIENTE", 3L, 1L, false, "{}"
        );
        jdbcTemplate.update(
                "INSERT INTO tareas (id, public_id, caso_id, organizacion_id, sucursal_id, modulo_origen_codigo, subtab_origen_codigo, titulo, fecha_limite, prioridad_codigo, estado_codigo, usuario_asignado_id, created_by, resuelta, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1001L, "00000000-0000-0000-0000-000000004001", 101L, 1L, 1L, "gestion", "tramite", "Enviar docs", java.sql.Date.valueOf("2026-02-12"), "ALTA", "PENDIENTE", 1L, 1L, true, "{}"
        );
    }

    private void seedFinancialMovements() {
        jdbcTemplate.update(
                "INSERT INTO movimientos_financieros (id, public_id, caso_id, tipo_movimiento_codigo, origen_flujo_codigo, contraparte_tipo_codigo, fecha_movimiento, monto_bruto, monto_neto, medio_pago_codigo, registrado_por, es_senia, es_bonificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                2000L, "00000000-0000-0000-0000-000000005000", 102L, "INGRESO", "CLIENTE", "CAJA", LocalDateTime.of(2026, 3, 12, 11, 0), 1000, 1000, "TRANSFERENCIA", 1L, false, false
        );
    }
}
