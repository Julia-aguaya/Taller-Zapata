package com.tallerzapata.backend.api.operation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VehicleOutcomeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedBaseData();
    }

    @Test
    void shouldCreateOutcomeWithReentryAndListIt() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO ingresos_vehiculo (id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id, persona_entrega_id, kilometraje_ingreso, combustible_codigo, fecha_salida_estimada, con_observaciones, detalle_observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                50L, "00000000-0000-0000-0000-000000009050", 100L, null, 10L, LocalDateTime.of(2026, 5, 6, 8, 45), 3L, 10L, 125000, "MEDIO", LocalDate.of(2026, 5, 10), false, null
        );

        VehicleOutcomeCreateRequest request = new VehicleOutcomeCreateRequest(
                50L,
                LocalDateTime.of(2026, 5, 9, 18, 15),
                3L,
                10L,
                false,
                true,
                LocalDate.of(2026, 5, 14),
                2,
                "AGENDADO",
                true,
                "Debe volver por pulido final"
        );

        mockMvc.perform(post("/api/v1/cases/100/vehicle-outcomes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shouldReenter").value(true))
                .andExpect(jsonPath("$.reentryStatusCode").value("AGENDADO"));

        mockMvc.perform(get("/api/v1/cases/100/vehicle-outcomes")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].intakeId").value(50));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_egreso'",
                Integer.class,
                100L
        );
        Integer appointmentCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM turnos_reparacion WHERE caso_id = ? AND es_reingreso = TRUE",
                Integer.class,
                100L
        );
        Long linkedAppointmentId = jdbcTemplate.queryForObject(
                "SELECT turno_reingreso_id FROM egresos_vehiculo WHERE ingreso_id = ?",
                Long.class,
                50L
        );
        Long repairStateId = jdbcTemplate.queryForObject(
                "SELECT estado_reparacion_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
        assertThat(appointmentCount).isEqualTo(1);
        assertThat(linkedAppointmentId).isNotNull();
        assertThat(repairStateId).isEqualTo(5L);
    }

    @Test
    void shouldMoveRepairWorkflowToRepairedOnDefinitiveOutcome() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO ingresos_vehiculo (id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id, persona_entrega_id, kilometraje_ingreso, combustible_codigo, fecha_salida_estimada, con_observaciones, detalle_observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                52L, "00000000-0000-0000-0000-000000009052", 100L, null, 10L, java.time.LocalDateTime.of(2026, 5, 6, 8, 45), 3L, 10L, 125000, "MEDIO", java.time.LocalDate.of(2026, 5, 10), false, null
        );

        VehicleOutcomeCreateRequest request = new VehicleOutcomeCreateRequest(
                52L,
                java.time.LocalDateTime.of(2026, 5, 9, 18, 15),
                3L,
                10L,
                true,
                false,
                null,
                null,
                null,
                true,
                "Entrega final"
        );

        mockMvc.perform(post("/api/v1/cases/100/vehicle-outcomes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.definitive").value(true));

        Long repairStateId = jdbcTemplate.queryForObject(
                "SELECT estado_reparacion_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        assertThat(repairStateId).isEqualTo(6L);
    }

    @Test
    void shouldUpdateOutcomeAndMoveWorkflowToRepaired() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO ingresos_vehiculo (id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id, persona_entrega_id, kilometraje_ingreso, combustible_codigo, fecha_salida_estimada, con_observaciones, detalle_observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                53L, "00000000-0000-0000-0000-000000009053", 100L, null, 10L, LocalDateTime.of(2026, 5, 6, 8, 45), 3L, 10L, 125000, "MEDIO", LocalDate.of(2026, 5, 10), false, null
        );
        jdbcTemplate.update(
                "INSERT INTO turnos_reparacion (id, public_id, caso_id, fecha_turno, hora_turno, dias_estimados, fecha_salida_estimada, estado_codigo, es_reingreso, notas, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                80L, "00000000-0000-0000-0000-000000008080", 100L, LocalDate.of(2026, 5, 14), java.time.LocalTime.of(9, 0), 2, LocalDate.of(2026, 5, 16), "PENDIENTE", true, "Turno auto", 3L
        );
        jdbcTemplate.update(
                "INSERT INTO egresos_vehiculo (id, public_id, caso_id, ingreso_id, fecha_egreso, entregado_por_usuario_id, persona_recibe_id, egreso_definitivo, debe_reingresar, fecha_reingreso_prevista, dias_estimados_reingreso, estado_reingreso_codigo, fotos_reparado_cargadas, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                70L, "00000000-0000-0000-0000-000000009070", 100L, 53L, LocalDateTime.of(2026, 5, 9, 18, 15), 3L, 10L, false, true, LocalDate.of(2026, 5, 14), 2, "AGENDADO", true, "Pendiente"
        );
        jdbcTemplate.update("UPDATE egresos_vehiculo SET turno_reingreso_id = ? WHERE id = ?", 80L, 70L);

        VehicleOutcomeUpdateRequest request = new VehicleOutcomeUpdateRequest(
                LocalDateTime.of(2026, 5, 10, 12, 0),
                3L,
                10L,
                true,
                false,
                null,
                null,
                null,
                true,
                "Ahora si es entrega final"
        );

        mockMvc.perform(put("/api/v1/vehicle-outcomes/{outcomeId}", 70L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.definitive").value(true))
                .andExpect(jsonPath("$.shouldReenter").value(false));

        Long repairStateId = jdbcTemplate.queryForObject(
                "SELECT estado_reparacion_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'actualizar_egreso'",
                Integer.class,
                100L
        );
        Integer cancelledAppointments = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM turnos_reparacion WHERE caso_id = ? AND es_reingreso = TRUE AND estado_codigo = 'CANCELADO'",
                Integer.class,
                100L
        );
        assertThat(repairStateId).isEqualTo(6L);
        assertThat(auditCount).isEqualTo(1);
        assertThat(cancelledAppointments).isEqualTo(1);
    }

    @Test
    void shouldRejectOutcomeWithoutReentryDataWhenNotDefinitive() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO ingresos_vehiculo (id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id, persona_entrega_id, kilometraje_ingreso, combustible_codigo, fecha_salida_estimada, con_observaciones, detalle_observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                51L, "00000000-0000-0000-0000-000000009051", 100L, null, 10L, LocalDateTime.of(2026, 5, 6, 8, 45), 3L, 10L, 125000, "MEDIO", LocalDate.of(2026, 5, 10), false, null
        );

        VehicleOutcomeCreateRequest request = new VehicleOutcomeCreateRequest(
                51L,
                LocalDateTime.of(2026, 5, 9, 18, 15),
                3L,
                10L,
                false,
                false,
                null,
                null,
                null,
                false,
                null
        );

        mockMvc.perform(post("/api/v1/cases/100/vehicle-outcomes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Un egreso no definitivo debe marcarse con shouldReenter=true"));
    }

    private void seedBaseData() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_vehiculos (id, caso_id, vehiculo_id, rol_vehiculo_codigo, es_principal, orden_visual) VALUES (?, ?, ?, ?, ?, ?)",
                1L, 100L, 10L, "PRINCIPAL", true, 1
        );
    }
}
