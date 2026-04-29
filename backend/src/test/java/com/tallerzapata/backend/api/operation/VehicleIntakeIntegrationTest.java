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
class VehicleIntakeIntegrationTest {

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
    void shouldCreateIntakeAddItemsAndListThem() throws Exception {
        VehicleIntakeCreateRequest request = new VehicleIntakeCreateRequest(
                null,
                10L,
                LocalDateTime.of(2026, 5, 6, 8, 45),
                3L,
                10L,
                125000,
                "MEDIO",
                LocalDate.of(2026, 5, 10),
                true,
                "Rayon en paragolpes"
        );

        String response = mockMvc.perform(post("/api/v1/cases/100/vehicle-intakes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleId").value(10))
                .andExpect(jsonPath("$.fuelCode").value("MEDIO"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long intakeId = objectMapper.readTree(response).get("id").asLong();

        VehicleIntakeItemCreateRequest itemRequest = new VehicleIntakeItemCreateRequest(
                "DANO_PREEXISTENTE",
                "Golpe previo en puerta",
                "OBSERVADO",
                "foto-001.jpg"
        );

        mockMvc.perform(post("/api/v1/vehicle-intakes/{intakeId}/items", intakeId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(itemRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemTypeCode").value("DANO_PREEXISTENTE"));

        mockMvc.perform(get("/api/v1/cases/100/vehicle-intakes")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(intakeId));

        mockMvc.perform(get("/api/v1/vehicle-intakes/{intakeId}/items", intakeId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].statusCode").value("OBSERVADO"));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo IN ('crear_ingreso', 'crear_ingreso_item')",
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
    void shouldUpdateVehicleIntake() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO ingresos_vehiculo (id, public_id, caso_id, turno_id, vehiculo_id, fecha_ingreso, recibido_por_usuario_id, persona_entrega_id, kilometraje_ingreso, combustible_codigo, fecha_salida_estimada, con_observaciones, detalle_observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                60L, "00000000-0000-0000-0000-000000009060", 100L, null, 10L, LocalDateTime.of(2026, 5, 6, 8, 45), 3L, 10L, 125000, "MEDIO", LocalDate.of(2026, 5, 10), false, null
        );

        VehicleIntakeUpdateRequest request = new VehicleIntakeUpdateRequest(
                null,
                10L,
                LocalDateTime.of(2026, 5, 6, 10, 0),
                3L,
                10L,
                126500,
                "LLENO",
                LocalDate.of(2026, 5, 11),
                true,
                "Se detecta detalle adicional"
        );

        mockMvc.perform(put("/api/v1/vehicle-intakes/{intakeId}", 60L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mileage").value(126500))
                .andExpect(jsonPath("$.fuelCode").value("LLENO"))
                .andExpect(jsonPath("$.hasObservations").value(true));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'actualizar_ingreso'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
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
