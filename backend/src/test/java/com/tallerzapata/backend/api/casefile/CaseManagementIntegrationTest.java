package com.tallerzapata.backend.api.casefile;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseManagementIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedBaseData();
    }

    @Test
    void shouldAddPersonToCase() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(11L, "TERCERO", null, false, "Nota de prueba"))))
                .andExpect(status().isOk());

        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_personas WHERE caso_id = ? AND persona_id = ?", Integer.class, 100L, 11L);
        assertThat(count).isEqualTo(1);

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'agregar_persona_caso'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldAddTitularWithOwnershipPercentage() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(11L, "TITULAR", 10L, false, null, 100))))
                .andExpect(status().isOk());

        Integer percentage = jdbcTemplate.queryForObject("SELECT porcentaje_titularidad FROM caso_personas WHERE caso_id = 100 AND persona_id = 11", Integer.class);
        assertThat(percentage).isEqualTo(100);
    }

    @Test
    void shouldListCasePersonsWithOwnershipPercentage() throws Exception {
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas, porcentaje_titularidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 5L, 100L, 11L, "TITULAR", 10L, false, null, 50);

        mockMvc.perform(get("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                // La persona CLIENTE del fixture (id 1) encabeza el listado; el titular sembrado es el segundo
                .andExpect(jsonPath("$[1].caseRoleCode").value("TITULAR"))
                .andExpect(jsonPath("$[1].registryOwnershipPercentage").value(50))
                .andExpect(jsonPath("$[1].displayName").value("Ana Test"));
    }

    @Test
    void shouldRejectInvalidOwnershipPercentage() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(11L, "TITULAR", 10L, false, null, 70))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectOwnershipPercentageForNonTitularRole() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(11L, "TERCERO", 10L, false, null, 100))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectOwnershipSumAbove100() throws Exception {
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas, porcentaje_titularidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 5L, 100L, 11L, "TITULAR", 10L, false, null, 50);

        // 50 + 50 = 100: el segundo titular entra
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(10L, "TITULAR", 10L, false, null, 50))))
                .andExpect(status().isOk());

        // 100 ya cubierto: un tercer titular al 50% no entra
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(11L, "TITULAR", 10L, false, null, 50))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldAddVehicleToCase() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/vehicles")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseVehicleAddRequest(11L, "CONDUCTOR", false, "Nota vehiculo"))))
                .andExpect(status().isOk());

        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_vehiculos WHERE caso_id = ? AND vehiculo_id = ?", Integer.class, 100L, 11L);
        assertThat(count).isEqualTo(1);

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'agregar_vehiculo_caso'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldUpdateCaseIncident() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseIncidentUpdateRequest(
                                LocalDate.of(2026, 4, 20),
                                "14:30",
                                "Av. Libertador 1234",
                                "Colision por alcance",
                                "Observaciones del siniestro",
                                LocalDate.of(2027, 4, 20)
                        ))))
                .andExpect(status().isOk());

        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_siniestro WHERE caso_id = ?", Integer.class, 100L);
        assertThat(count).isEqualTo(1);

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'actualizar_siniestro_caso'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldReadCaseIncident() throws Exception {
        jdbcTemplate.update("INSERT INTO caso_siniestro (id, caso_id, fecha_siniestro, hora_siniestro, lugar, dinamica, observaciones, fecha_prescripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                1L, 100L, LocalDate.of(2026, 4, 20), "14:30:00", "Av. Libertador 1234", "Colision por alcance", "Observaciones del siniestro", LocalDate.of(2027, 4, 20));

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidentDate").value("2026-04-20"))
                .andExpect(jsonPath("$.incidentTime").value("14:30"))
                .andExpect(jsonPath("$.location").value("Av. Libertador 1234"))
                .andExpect(jsonPath("$.dynamics").value("Colision por alcance"))
                .andExpect(jsonPath("$.observations").value("Observaciones del siniestro"))
                .andExpect(jsonPath("$.prescriptionDate").value("2027-04-20"));
    }

    @Test
    void shouldOwnGranizoPrescriptionAndRejectClientOverride() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 3L, 100L);

        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incidentDate\":\"2026-04-20\",\"prescriptionDate\":\"2029-04-20\"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incidentDate\":\"2026-04-20\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prescriptionDate").value("2027-04-20"));
    }

    @Test
    void shouldPreserveTodoRiesgoClientPrescriptionWithoutRequiringIncidentDate() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 2L, 100L);

        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prescriptionDate\":\"2029-04-20\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidentDate").doesNotExist())
                .andExpect(jsonPath("$.prescriptionDate").value("2029-04-20"));
    }

    @Test
    void shouldKeepOneYearDefaultPrescriptionForTodoRiesgoWithIncidentDate() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 2L, 100L);

        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incidentDate\":\"2026-04-20\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prescriptionDate").value("2027-04-20"));
    }

    @Test
    void shouldComputeThirdPartyPrescriptionAsThreeYearsFromIncident() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 5L, 100L);

        // Sin fecha de siniestro no hay prescripcion calculable: el valor del cliente se descarta.
        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prescriptionDate\":\"2027-04-20\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prescriptionDate").doesNotExist());

        // Con siniestro: 3 anios automaticos; el valor enviado por el cliente se recalcula.
        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incidentDate\":\"2026-04-20\",\"prescriptionDate\":\"2027-04-20\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidentDate").value("2026-04-20"))
                .andExpect(jsonPath("$.prescriptionDate").value("2029-04-20"));
    }

    @Test
    void shouldComputeLawyerThirdPartyPrescriptionAsThreeYearsFromIncident() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 6L, 100L);

        mockMvc.perform(put("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incidentDate\":\"2026-04-20\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prescriptionDate").value("2029-04-20"));
    }

    @Test
    void shouldComputeLawyerDaysInProcessFromExpedienteEntryDate() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 6L, 100L);
        jdbcTemplate.update("INSERT INTO caso_siniestro (id, caso_id, fecha_siniestro, fecha_prescripcion) VALUES (?, ?, ?, ?)", 1L, 100L, LocalDate.of(2026, 4, 20), LocalDate.of(2029, 4, 20));
        jdbcTemplate.update("INSERT INTO caso_legal (caso_id, fecha_ingreso, instancia_codigo) VALUES (?, ?, ?)", 100L, LocalDate.now().minusDays(5), "ADMINISTRATIVA");
        // La presentacion ante compania no corre los dias del expediente del abogado
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_presentacion) VALUES (?, ?)", 100L, LocalDate.now().minusDays(40));

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daysInProcess").value(5));
    }

    @Test
    void shouldComputeThirdPartyWorkshopDaysInProcessFromPresentationDate() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 5L, 100L);
        jdbcTemplate.update("INSERT INTO caso_siniestro (id, caso_id, fecha_siniestro) VALUES (?, ?, ?)", 1L, 100L, LocalDate.of(2026, 4, 20));
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_presentacion) VALUES (?, ?)", 100L, LocalDate.now().minusDays(3));

        mockMvc.perform(get("/api/v1/cases/100/incident")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daysInProcess").value(3));
    }

    @Test
    void shouldRejectDuplicateMainPerson() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/persons")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePersonAddRequest(11L, "TERCERO", null, true, null))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectDuplicateMainVehicle() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/vehicles")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseVehicleAddRequest(11L, "TERCERO", true, null))))
                .andExpect(status().isConflict());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 11L, "00000000-0000-0000-0000-000000001011", "fisica", "Ana", "Test", "Ana Test", "DNI", "30222333", "30222333", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 11L, "00000000-0000-0000-0000-000000002011", "XY987ZA", "XY987ZA", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
        jdbcTemplate.update("INSERT INTO caso_vehiculos (id, caso_id, vehiculo_id, rol_vehiculo_codigo, es_principal, orden_visual) VALUES (?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "TITULAR", true, 1);
    }
}
