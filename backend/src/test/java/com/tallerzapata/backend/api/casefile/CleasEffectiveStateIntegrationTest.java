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
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CleasEffectiveStateIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000001010', 'fisica', 'Carlos', 'Cliente', 'Carlos Cliente', 'DNI', '30111222', '30111222', TRUE)");
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000002010', 'AB123CD', 'AB123CD', TRUE)");
    }

    @Test
    void persistsTerminalOverridesAndExposesThemThroughCaseStates() throws Exception {
        long caseId = createCase();
        mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"tramite\",\"stateCode\":\"RECHAZADO\",\"reason\":\"Dictamen desfavorable\"}"))
                .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject("SELECT tramite_terminal_override_codigo FROM cleas_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo("RECHAZADO");
        assertThat(jdbcTemplate.queryForObject("SELECT cause FROM cleas_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", String.class, caseId)).isEqualTo("OVERRIDE");
        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("RECHAZADO"));

        mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"tramite\",\"stateCode\":null,\"reason\":\"Reabrir calculo\"}"))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT tramite_terminal_override_codigo FROM cleas_effective_state WHERE caso_id = ?", String.class, caseId)).isNull();
    }

    @Test
    void rejectsTerminalOverrideWithoutTheExplicitOverridePermission() throws Exception {
        long caseId = createCase();
        Long permissionId = jdbcTemplate.queryForObject("SELECT id FROM permisos WHERE codigo = ?", Long.class, "workflow.estado.visible.override");
        jdbcTemplate.update("DELETE FROM rol_permisos WHERE rol_id = ? AND permiso_id = ?", 1L, permissionId);
        try {
            mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"reparacion\",\"stateCode\":\"DESISTIDO\",\"reason\":\"Sin permiso\"}"))
                    .andExpect(status().isForbidden());
            assertThat(jdbcTemplate.queryForObject("SELECT reparacion_terminal_override_codigo FROM cleas_effective_state WHERE caso_id = ?", String.class, caseId)).isNull();
        } finally {
            jdbcTemplate.update("INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag) VALUES (?, ?, ?)", 1L, permissionId, true);
        }
    }

    @Test
    void onlyCanonicalCompanyPaymentsSettleAndAnnullingReopensTheProjection() throws Exception {
        long caseId = createEligibleCase();
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"ASEGURADORA\",\"counterpartyTypeCode\":\"COMPANIA\",\"counterpartyCompanyId\":1,\"movementAt\":\"2026-08-03T10:00:00\",\"grossAmount\":1000,\"netAmount\":1000,\"paymentMethodCode\":\"TRANSFERENCIA\",\"cancellationTypeCode\":\"COMPANIA\",\"advancePayment\":false,\"bonification\":false}"))
                .andExpect(status().isConflict());
        assertProjection(caseId, "PASADO_A_PAGOS", "DAR_TURNO");

        String response = mockMvc.perform(post("/api/v1/cases/{caseId}/cleas/company-payments", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":1000,\"paymentMethodCode\":\"TRANSFERENCIA\",\"documentId\":201}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertProjection(caseId, "PAGADO", "DAR_TURNO");
        long movementId = objectMapper.readTree(response).get("movementId").asLong();
        mockMvc.perform(post("/api/v1/cases/{caseId}/cleas/company-payments/{movementId}/annul", caseId, movementId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Anulacion\"}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PASADO_A_PAGOS", "DAR_TURNO");
    }

    @Test
    void protectsExceptionalRepairActionsAndWiresNotificationsAndReentry() throws Exception {
        long caseId = createCase();
        mockMvc.perform(post("/api/v1/cases/{caseId}/cleas/no-repair", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Dano estructural\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.visibleRepairState.code").value("NO_DEBE_REPARARSE"));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notificaciones WHERE caso_id = ? AND usuario_id = 1 AND tipo_codigo = 'CLEAS_NO_REPARA'", Integer.class, caseId)).isEqualTo(1);

        long forbiddenCaseId = createCase();
        jdbcTemplate.update("UPDATE usuario_roles SET organizacion_id = 1, sucursal_id = 1 WHERE usuario_id = 1 AND rol_id = 1");
        try {
            mockMvc.perform(post("/api/v1/cases/{caseId}/cleas/urgent-repaired", forbiddenCaseId).header("X-User-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Urgente\"}"))
                    .andExpect(status().isForbidden());
        } finally {
            jdbcTemplate.update("UPDATE usuario_roles SET organizacion_id = NULL, sucursal_id = NULL WHERE usuario_id = 1 AND rol_id = 1");
        }

        long repairCaseId = createEligibleCase();
        long intakeId = createIntake(repairCaseId);
        String outcome = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-outcomes", repairCaseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"intakeId\":" + intakeId + ",\"outcomeAt\":\"2026-08-05T18:00:00\",\"deliveredByUserId\":1,\"definitive\":false,\"shouldReenter\":true,\"expectedReentryDate\":\"2026-08-12\",\"estimatedReentryDays\":2,\"repairedPhotosUploaded\":false}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long outcomeId = objectMapper.readTree(outcome).get("id").asLong();
        Long reentryId = jdbcTemplate.queryForObject("SELECT turno_reingreso_id FROM egresos_vehiculo WHERE id = ?", Long.class, outcomeId);
        mockMvc.perform(put("/api/v1/appointments/{appointmentId}", reentryId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"appointmentDate\":\"2026-08-12\",\"appointmentTime\":\"09:00:00\",\"estimatedDays\":1,\"statusCode\":\"CANCELADO\",\"reentry\":true,\"userId\":1}"))
                .andExpect(status().isOk());
        assertProjection(repairCaseId, "PASADO_A_PAGOS", "DEBE_REINGRESAR");
    }

    private long createCase() throws Exception {
        Long typeId = jdbcTemplate.queryForObject("SELECT id FROM tipos_tramite WHERE codigo = 'CLEAS'", Long.class);
        MvcResult result = mockMvc.perform(post("/api/v1/cases").header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":" + typeId + ",\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false,\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long createEligibleCase() throws Exception {
        long caseId = createCase();
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, activo) VALUES (1, '00000000-0000-0000-0000-000000004001', 'RIVA', 'Rivadavia', TRUE)");
        Long categoryId = jdbcTemplate.queryForObject("SELECT id FROM categorias_documentales WHERE codigo = 'COMPROBANTE_PAGO_CLEAS' AND modulo_codigo = 'CLEAS'", Long.class);
        jdbcTemplate.update("INSERT INTO documentos (id, public_id, storage_key, nombre_archivo, mime_type, tamano_bytes, checksum_sha256, categoria_id, subido_por, origen_codigo, activo) VALUES (201, '00000000-0000-0000-0000-000000000201', 'cleas/pago.pdf', 'pago.pdf', 'application/pdf', 10, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', ?, 1, 'CLEAS', TRUE)", categoryId);
        mockMvc.perform(put("/api/v1/cases/{caseId}/cleas/definition", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"A_FAVOR\"}")).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/cases/{caseId}/cleas/insurance", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"insuranceCompanyId\":1}")).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/cases/{caseId}/cleas/financial-plan", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"billableCompanyId\":1}")).andExpect(status().isOk());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/cases/{caseId}/cleas/processing", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"presentedAt\":\"2026-08-02\"}")).andExpect(status().isOk());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/cases/{caseId}/cleas/processing", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"quotationStatusCode\":\"ACEPTADA\",\"quotationDate\":\"2026-08-02\",\"agreedAmount\":1000,\"agreementDate\":\"2026-08-02\"}")).andExpect(status().isOk());
        return caseId;
    }

    private long createIntake(long caseId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-intakes", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"vehicleId\":10,\"intakeAt\":\"2026-08-05T08:00:00\",\"receivedByUserId\":1,\"mileage\":100,\"fuelCode\":\"MEDIO\",\"estimatedExitDate\":\"2026-08-20\",\"hasObservations\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void assertProjection(long caseId, String procedure, String repair) {
        assertThat(jdbcTemplate.queryForObject("SELECT tramite_codigo FROM cleas_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo(procedure);
        assertThat(jdbcTemplate.queryForObject("SELECT reparacion_codigo FROM cleas_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo(repair);
    }
}
