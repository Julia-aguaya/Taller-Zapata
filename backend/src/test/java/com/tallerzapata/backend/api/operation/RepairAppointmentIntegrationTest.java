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
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RepairAppointmentIntegrationTest {

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
        seedCases();
        seedUsers();
    }

    @Test
    void shouldCreateListAndUpdateRepairAppointment() throws Exception {
        RepairAppointmentCreateRequest createRequest = new RepairAppointmentCreateRequest(
                LocalDate.of(2026, 5, 4),
                LocalTime.of(9, 0),
                3,
                LocalDate.of(2026, 5, 7),
                null,
                false,
                "Recepcion inicial",
                3L
        );

        String response = mockMvc.perform(post("/api/v1/cases/100/appointments")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("PENDIENTE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long appointmentId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/v1/cases/100/appointments")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentDate").value("2026-05-04"));

        RepairAppointmentUpdateRequest updateRequest = new RepairAppointmentUpdateRequest(
                LocalDate.of(2026, 5, 5),
                LocalTime.of(10, 30),
                2,
                LocalDate.of(2026, 5, 7),
                "REPROGRAMADO",
                true,
                "Vuelve por detalle menor",
                3L
        );

        mockMvc.perform(put("/api/v1/appointments/{appointmentId}", appointmentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("REPROGRAMADO"))
                .andExpect(jsonPath("$.reentry").value(true));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo IN ('crear_turno', 'actualizar_turno')",
                Integer.class,
                100L
        );
        Long repairStateId = jdbcTemplate.queryForObject(
                "SELECT estado_reparacion_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        assertThat(auditCount).isEqualTo(2);
        assertThat(repairStateId).isEqualTo(5L);
    }

    @Test
    void shouldCalculateEstimatedDateSkippingHolidays() throws Exception {
        RepairAppointmentCreateRequest createRequest = new RepairAppointmentCreateRequest(
                LocalDate.of(2026, 5, 20),
                LocalTime.of(9, 0),
                3,
                null,
                null,
                false,
                "Recepcion cerca de feriado",
                3L
        );

        mockMvc.perform(post("/api/v1/cases/100/appointments")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimatedExitDate").value("2026-05-26"));
    }

    private void seedCases() {
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
    }

    private void seedUsers() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
    }
}
