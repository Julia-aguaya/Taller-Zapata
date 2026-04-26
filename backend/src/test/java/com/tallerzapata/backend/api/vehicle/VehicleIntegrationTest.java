package com.tallerzapata.backend.api.vehicle;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VehicleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM caso_estado_historial");
        jdbcTemplate.update("DELETE FROM caso_relaciones");
        jdbcTemplate.update("DELETE FROM caso_siniestro");
        jdbcTemplate.update("DELETE FROM caso_vehiculos");
        jdbcTemplate.update("DELETE FROM caso_personas");
        jdbcTemplate.update("DELETE FROM casos");
        jdbcTemplate.update("DELETE FROM vehiculo_personas");
        jdbcTemplate.update("DELETE FROM vehiculos");
        jdbcTemplate.update("DELETE FROM modelos_vehiculo");
        jdbcTemplate.update("DELETE FROM marcas_vehiculo");
        jdbcTemplate.update("DELETE FROM personas");

        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                10L,
                "00000000-0000-0000-0000-000000001210",
                "fisica",
                "Ana",
                "Gomez",
                "Ana Gomez",
                true
        );

        jdbcTemplate.update(
                "INSERT INTO marcas_vehiculo (id, codigo, nombre, activo) VALUES (?, ?, ?, ?)",
                1L,
                "FORD",
                "Ford",
                true
        );
        jdbcTemplate.update(
                "INSERT INTO modelos_vehiculo (id, marca_id, codigo, nombre, activo) VALUES (?, ?, ?, ?, ?)",
                1L,
                1L,
                "FIESTA",
                "Fiesta",
                true
        );
        jdbcTemplate.update(
                "INSERT INTO modelos_vehiculo (id, marca_id, codigo, nombre, activo) VALUES (?, ?, ?, ?, ?)",
                2L,
                1L,
                "FOCUS",
                "Focus",
                true
        );

        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, marca_id, modelo_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                10L,
                "00000000-0000-0000-0000-000000002210",
                1L,
                1L,
                "AB123CD",
                "AB123CD",
                true
        );
    }

    @Test
    void shouldListBrandAndModels() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles/brands")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").value("FORD"));

        mockMvc.perform(get("/api/v1/vehicles/models")
                        .param("brandId", "1")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].brandId").value(1));
    }

    @Test
    void shouldCreateAndUpdateVehiclePersonRelation() throws Exception {
        VehiclePersonUpsertRequest createRequest = new VehiclePersonUpsertRequest(
                10L,
                "TITULAR",
                true,
                LocalDate.of(2026, 1, 1),
                null,
                "alta"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/vehicles/10/persons")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personId").value(10))
                .andExpect(jsonPath("$.rolVehiculoCodigo").value("TITULAR"))
                .andReturn();

        Long relationId = objectMapper.readTree(createResult.getResponse().getContentAsByteArray()).get("id").asLong();

        VehiclePersonUpsertRequest updateRequest = new VehiclePersonUpsertRequest(
                10L,
                "CONDUCTOR",
                false,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 3, 1),
                "cambio"
        );

        mockMvc.perform(put("/api/v1/vehicles/10/persons/{relationId}", relationId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rolVehiculoCodigo").value("CONDUCTOR"))
                .andExpect(jsonPath("$.esActual").value(false));

        mockMvc.perform(get("/api/v1/vehicles/10/persons")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].rolVehiculoCodigo").value("CONDUCTOR"));
    }

    @Test
    void shouldRejectInvalidVehiclePersonDateRange() throws Exception {
        VehiclePersonUpsertRequest invalid = new VehiclePersonUpsertRequest(
                10L,
                "TITULAR",
                true,
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 1),
                null
        );

        mockMvc.perform(post("/api/v1/vehicles/10/persons")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(invalid)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("La fecha 'hasta' no puede ser anterior a 'desde'"));
    }

    @Test
    void shouldSearchVehiclesByAutocompleteQuery() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, marca_texto, modelo_texto, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                11L,
                "00000000-0000-0000-0000-000000002211",
                "Toyota",
                "Corolla",
                "AE456FG",
                "AE456FG",
                true
        );

        mockMvc.perform(get("/api/v1/vehicles")
                        .param("q", "ab12")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10));

        mockMvc.perform(get("/api/v1/vehicles")
                        .param("q", "toyota")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(11));
    }
}
