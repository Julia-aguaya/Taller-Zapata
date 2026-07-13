package com.tallerzapata.backend.api.panel;

import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PanelGeneralIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedPanelCases();
    }

    @Test
    void shouldReturnOperationalSummaryAndPriorityBuckets() throws Exception {
        mockMvc.perform(get("/api/v1/panel/general")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.openCases").value(2))
                .andExpect(jsonPath("$.summary.pendingPayments").value(1))
                .andExpect(jsonPath("$.summary.casesWithoutAppointment").value(1))
                .andExpect(jsonPath("$.summary.casesNearPrescription").value(1))
                .andExpect(jsonPath("$.summary.pendingTasks").value(1))
                .andExpect(jsonPath("$.priorityBuckets[0].code").value("URGENT"))
                .andExpect(jsonPath("$.priorityBuckets[0].items.length()").value(2))
                .andExpect(jsonPath("$.priorityBuckets[0].items[0].priorityReasons").isArray());
    }

    private void seedPanelCases() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true
        );
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                11L, "00000000-0000-0000-0000-000000001011", "fisica", "Juana", "Pago", "Juana Pago", "DNI", "30111223", "30111223", true
        );

        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, marca_texto, modelo_texto, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000002010", "Chevrolet", "Astra", "AB123CD", "AB123CD", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, marca_texto, modelo_texto, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                11L, "00000000-0000-0000-0000-000000002011", "Ford", "Ka", "AC456EF", "AC456EF", true
        );

        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "ALTA", Timestamp.valueOf(LocalDateTime.of(2026, 6, 1, 9, 0))
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                101L, "00000000-0000-0000-0000-000000003101", "0101PZ", 101L, 1L, 1L, 1L, 11L, 11L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA", Timestamp.valueOf(LocalDateTime.of(2026, 6, 2, 9, 0))
        );

        jdbcTemplate.update(
                "INSERT INTO caso_siniestro (id, caso_id, fecha_prescripcion) VALUES (?, ?, ?)",
                1L, 100L, LocalDate.now().plusDays(10)
        );

        insertBudget(1L, 100L, 1L, 1L, LocalDate.of(2026, 6, 5), new BigDecimal("1000.00"), new BigDecimal("210.00"), new BigDecimal("1210.00"));
        insertBudget(2L, 101L, 1L, 1L, LocalDate.of(2026, 6, 6), new BigDecimal("1000.00"), new BigDecimal("210.00"), new BigDecimal("1210.00"));

        jdbcTemplate.update(
                "INSERT INTO tareas (id, public_id, caso_id, organizacion_id, sucursal_id, titulo, prioridad_codigo, estado_codigo, created_by, resuelta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000004001", 100L, 1L, 1L, "Pedir confirmacion al cliente", "ALTA", "PENDIENTE", 1L, false
        );

        jdbcTemplate.update(
                "INSERT INTO turnos_reparacion (id, public_id, caso_id, fecha_turno, hora_turno, dias_estimados, fecha_salida_estimada, estado_codigo, es_reingreso, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000005001", 101L, LocalDate.of(2026, 6, 10), java.sql.Time.valueOf("09:00:00"), 2, LocalDate.of(2026, 6, 11), "PENDIENTE", false, 1L
        );
        jdbcTemplate.update(
                "INSERT INTO ingresos_vehiculo (id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id, con_observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000006001", 101L, 1L, 11L, Timestamp.valueOf(LocalDateTime.of(2026, 6, 10, 9, 15)), 1L, false
        );
        jdbcTemplate.update(
                "INSERT INTO egresos_vehiculo (id, public_id, caso_id, ingreso_id, fecha_egreso, entregado_por_usuario_id, egreso_definitivo, debe_reingresar, fotos_reparado_cargadas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000007001", 101L, 1L, Timestamp.valueOf(LocalDateTime.of(2026, 6, 11, 18, 0)), 1L, true, false, true
        );
    }

    private void insertBudget(Long id, Long caseId, Long organizationId, Long branchId, LocalDate budgetDate, BigDecimal laborWithVat, BigDecimal partsTotal, BigDecimal totalQuoted) {
        jdbcTemplate.update(
                "INSERT INTO presupuestos (id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, mano_obra_sin_iva, alicuota_iva, mano_obra_iva, mano_obra_con_iva, repuestos_total, total_cotizado, version_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id,
                caseId,
                organizationId,
                branchId,
                budgetDate,
                "CERRADO",
                new BigDecimal("1000.00"),
                new BigDecimal("21.00"),
                new BigDecimal("210.00"),
                laborWithVat,
                partsTotal,
                totalQuoted,
                1
        );
    }
}
