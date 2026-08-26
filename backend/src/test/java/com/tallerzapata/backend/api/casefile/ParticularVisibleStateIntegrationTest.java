package com.tallerzapata.backend.api.casefile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ParticularVisibleStateIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TestDatabaseCleaner cleaner;
    @Autowired private ParticularEffectiveStateRecalculator recalculator;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000001010', 'fisica', 'Carlos', 'Cliente', 'Carlos Cliente', 'DNI', '30111222', '30111222', TRUE)");
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000002010', 'AB123CD', 'AB123CD', TRUE)");
    }

    @Test
    void createsProjectionAndPersistsManualOverrideRevertAndReadContract() throws Exception {
        long caseId = createCase("PARTICULAR");
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        assertThat(countHistory(caseId)).isEqualTo(1);

        mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"reparacion\",\"stateCode\":\"RECHAZADO\",\"reason\":\"Peritaje rechazado\"}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "RECHAZADO");
        assertThat(countHistory(caseId)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT actor_usuario_id FROM particular_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", Long.class, caseId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT reason FROM particular_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", String.class, caseId)).isEqualTo("Peritaje rechazado");

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("RECHAZADO"));

        mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"reparacion\",\"stateCode\":null,\"reason\":\"Vuelve a calculo automatico\"}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        assertThat(countHistory(caseId)).isEqualTo(3);
        assertThat(jdbcTemplate.queryForObject("SELECT cause FROM particular_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", String.class, caseId)).isEqualTo("OVERRIDE_REVERT");
    }

    @Test
    void rejectsNonTerminalParticularOverrideAndKeepsHistoryAppendOnly() throws Exception {
        long caseId = createCase("PARTICULAR");
        int before = countHistory(caseId);
        mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"reparacion\",\"stateCode\":\"CON_TURNO\",\"reason\":\"No permitido\"}"))
                .andExpect(status().isConflict());
        assertThat(countHistory(caseId)).isEqualTo(before);
    }

    @Test
    void enforcesProjectionAndHistoryDomainsWhileApplicationWritesAppendNewHistoryRows() throws Exception {
        long caseId = createCase("PARTICULAR");
        Long firstHistoryId = jdbcTemplate.queryForObject("SELECT id FROM particular_effective_state_history WHERE caso_id = ?", Long.class, caseId);
        String firstRepair = jdbcTemplate.queryForObject("SELECT new_reparacion_codigo FROM particular_effective_state_history WHERE id = ?", String.class, firstHistoryId);

        assertThatThrownBy(() -> jdbcTemplate.update("INSERT INTO particular_effective_state (caso_id, tramite_codigo, reparacion_codigo) VALUES (?, 'INVALIDO', 'EN_TRAMITE')", caseId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update("INSERT INTO particular_effective_state (caso_id, tramite_codigo, reparacion_codigo) VALUES (?, 'PAGADO', 'EN_TRAMITE')", caseId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update("INSERT INTO particular_effective_state_history (caso_id, new_tramite_codigo, new_reparacion_codigo, change_scope, cause) VALUES (?, 'PAGADO', 'INVALIDO', 'DUAL', 'TEST')", caseId))
                .isInstanceOf(DataIntegrityViolationException.class);

        mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"reparacion\",\"stateCode\":\"RECHAZADO\",\"reason\":\"Auditoria\"}"))
                .andExpect(status().isOk());

        assertThat(countHistory(caseId)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT new_reparacion_codigo FROM particular_effective_state_history WHERE id = ?", String.class, firstHistoryId)).isEqualTo(firstRepair);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT id) FROM particular_effective_state_history WHERE caso_id = ?", Integer.class, caseId)).isEqualTo(2);
    }

    @Test
    void leavesGenericTodoRiesgoWorkflowAndProjectionTablesUntouched() throws Exception {
        long caseId = createCase("TODO_RIESGO");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM particular_effective_state WHERE caso_id = ?", Integer.class, caseId)).isZero();
        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("SIN_PRESENTAR"));
    }

    @Test
    void recalculatesForReceiptTypesAndPartsLifecycle() throws Exception {
        long caseId = createCase("PARTICULAR");

        createReceipt(caseId, "NOTA_CREDITO");
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        createReceipt(caseId, "FACTURA");
        assertProjection(caseId, "PAGADO", "DAR_TURNO");

        long firstPart = createPart(caseId, "PENDIENTE");
        long secondPart = createPart(caseId, "PEDIDO");
        assertProjection(caseId, "PAGADO", "FALTAN_REPUESTOS");
        updatePart(caseId, firstPart, "RECIBIDO");
        assertProjection(caseId, "PAGADO", "FALTAN_REPUESTOS");
        updatePart(caseId, secondPart, "RECIBIDO");
        assertProjection(caseId, "PAGADO", "DAR_TURNO");
        mockMvc.perform(delete("/api/v1/cases/{caseId}/parts/{partId}", caseId, secondPart).header("X-User-Id", "1"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/cases/{caseId}/parts/{partId}", caseId, firstPart).header("X-User-Id", "1"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "DAR_TURNO");
    }

    @Test
    void recalculatesForEveryAppointmentCurrentnessStatusAndMultipleAppointments() throws Exception {
        long caseId = createCase("PARTICULAR");
        long appointmentId = createAppointment(caseId, "PENDIENTE", false);
        assertProjection(caseId, "PAGADO", "CON_TURNO");
        updateAppointment(appointmentId, "REPROGRAMADO", false);
        assertProjection(caseId, "PAGADO", "CON_TURNO");
        updateAppointment(appointmentId, "CANCELADO", false);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        updateAppointment(appointmentId, "CUMPLIDO", false);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");

        createAppointment(caseId, "CANCELADO", false);
        createAppointment(caseId, "REPROGRAMADO", false);
        assertProjection(caseId, "PAGADO", "CON_TURNO");
    }

    @Test
    void pendingReentryAppointmentSatisfiesReentryRequirement() throws Exception {
        long caseId = createCase("PARTICULAR");
        long intakeId = createIntake(caseId, 1);
        createOutcome(caseId, intakeId, false, true);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
    }

    @Test
    void reprogrammedReentryAppointmentSatisfiesReentryRequirement() throws Exception {
        long caseId = createCase("PARTICULAR");
        long intakeId = createIntake(caseId, 1);
        long outcomeId = createOutcome(caseId, intakeId, false, true);
        Long reentryAppointmentId = jdbcTemplate.queryForObject("SELECT turno_reingreso_id FROM egresos_vehiculo WHERE id = ?", Long.class, outcomeId);

        updateAppointment(reentryAppointmentId, "REPROGRAMADO", true);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
    }

    @Test
    void cancelledReentryAppointmentDoesNotSatisfyReentryRequirement() throws Exception {
        long caseId = createCase("PARTICULAR");
        long intakeId = createIntake(caseId, 1);
        long outcomeId = createOutcome(caseId, intakeId, false, true);
        Long reentryAppointmentId = jdbcTemplate.queryForObject("SELECT turno_reingreso_id FROM egresos_vehiculo WHERE id = ?", Long.class, outcomeId);

        updateAppointment(reentryAppointmentId, "CANCELADO", true);
        assertProjection(caseId, "PAGADO", "DEBE_REINGRESAR");
    }

    @Test
    void fulfilledReentryFollowedByLaterIntakeAndOutcomeUsesLaterFacts() throws Exception {
        long caseId = createCase("PARTICULAR");
        long intakeId = createIntake(caseId, 1);
        long outcomeId = createOutcome(caseId, intakeId, false, true);

        Long reentryAppointmentId = jdbcTemplate.queryForObject("SELECT turno_reingreso_id FROM egresos_vehiculo WHERE id = ?", Long.class, outcomeId);
        updateAppointment(reentryAppointmentId, "CUMPLIDO", true);
        assertProjection(caseId, "PAGADO", "DEBE_REINGRESAR");

        createIntake(caseId, 2);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        updateOutcome(outcomeId, true, false);
        assertProjection(caseId, "PAGADO", "REPARADO");
    }

    @Test
    void pendingAndFulfilledNormalAppointmentsRespectPartsAndQualifyingReceipt() throws Exception {
        long caseId = createCase("PARTICULAR");
        createReceipt(caseId, "FACTURA");
        long partId = createPart(caseId, "PENDIENTE");
        assertProjection(caseId, "PAGADO", "FALTAN_REPUESTOS");

        long appointmentId = createAppointment(caseId, "PENDIENTE", false);
        assertProjection(caseId, "PAGADO", "CON_TURNO");
        updateAppointment(appointmentId, "CUMPLIDO", false);
        assertProjection(caseId, "PAGADO", "FALTAN_REPUESTOS");
        updatePart(caseId, partId, "RECIBIDO");
        assertProjection(caseId, "PAGADO", "DAR_TURNO");
    }

    @Test
    void fulfilledNormalAppointmentDoesNotDisplaceQualifyingReceipt() throws Exception {
        long caseId = createCase("PARTICULAR");
        createReceipt(caseId, "RECIBO");
        createAppointment(caseId, "CUMPLIDO", false);

        assertProjection(caseId, "PAGADO", "DAR_TURNO");
    }

    @Test
    void recalculatesForClientPaymentsAndPreservesReadCompatibility() throws Exception {
        long caseId = createCase("PARTICULAR");
        createReceipt(caseId, "RECIBO");
        assertProjection(caseId, "PAGADO", "DAR_TURNO");
        createClientMovement(caseId, "50.00");
        assertProjection(caseId, "PAGADO", "DAR_TURNO");

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("PAGADO"))
                .andExpect(jsonPath("$.visibleRepairState.code").value("DAR_TURNO"))
                .andExpect(jsonPath("$.tramiteCode").value("PAGADO"))
                .andExpect(jsonPath("$.reparacionCode").value("DAR_TURNO"));
        mockMvc.perform(get("/api/v1/cases/{caseId}/workspace", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseDetail.visibleRepairState.code").value("DAR_TURNO"))
                .andExpect(jsonPath("$.caseDetail.tramiteCode").value("PAGADO"))
                .andExpect(jsonPath("$.caseDetail.reparacionCode").value("DAR_TURNO"));
        mockMvc.perform(get("/api/v1/cases?visibleRepairState=DAR_TURNO").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].visibleRepairState.code").value("DAR_TURNO"))
                .andExpect(jsonPath("$.items[0].tramiteCode").value("PAGADO"))
                .andExpect(jsonPath("$.items[0].reparacionCode").value("DAR_TURNO"));
    }

    @Test
    void panelGeneralUsesParticularProjectionCompatibility() throws Exception {
        long caseId = createCase("PARTICULAR");
        createReceipt(caseId, "FACTURA");

        mockMvc.perform(get("/api/v1/panel/general").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.casesWithoutAppointment").value(1))
                .andExpect(jsonPath("$.priorityBuckets[0].items[0].caseId").value(caseId))
                .andExpect(jsonPath("$.priorityBuckets[0].items[0].visibleRepairState.code").value("DAR_TURNO"))
                .andExpect(jsonPath("$.priorityBuckets[0].items[0].tramiteCode").value("PAGADO"))
                .andExpect(jsonPath("$.priorityBuckets[0].items[0].reparacionCode").value("DAR_TURNO"));
    }

    @Test
    void canonicalCodesAndCompatibilityAliasesShareTheSameProjectionValues() throws Exception {
        long caseId = createCase("PARTICULAR");
        createReceipt(caseId, "FACTURA");

        assertCanonicalMatchesAliases(mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "");
        assertCanonicalMatchesAliases(mockMvc.perform(get("/api/v1/cases/{caseId}/workspace", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "/caseDetail");
        assertCanonicalMatchesAliases(mockMvc.perform(get("/api/v1/cases?visibleRepairState=DAR_TURNO").header("X-User-Id", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "/items/0");
        assertCanonicalMatchesAliases(mockMvc.perform(get("/api/v1/panel/general").header("X-User-Id", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "/priorityBuckets/0/items/0");
    }

    @Test
    void leavesGranizoWorkflowAndProjectionTablesUntouched() throws Exception {
        long caseId = createCase("GRANIZO");
        createAppointment(caseId, "PENDIENTE", false);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM particular_effective_state WHERE caso_id = ?", Integer.class, caseId)).isZero();
        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("CON_TURNO"))
                .andExpect(jsonPath("$.tramiteCode").doesNotExist())
                .andExpect(jsonPath("$.reparacionCode").doesNotExist());
    }

    @Test
    void rejectsUnauthorizedOverrideWithoutChangingProjectionOrHistory() throws Exception {
        long caseId = createCase("PARTICULAR");
        int historyBefore = countHistory(caseId);
        Long permissionId = jdbcTemplate.queryForObject("SELECT id FROM permisos WHERE codigo = ?", Long.class, "workflow.estado.visible.override");
        jdbcTemplate.update("DELETE FROM rol_permisos WHERE rol_id = ? AND permiso_id = ?", 1L, permissionId);
        try {
            mockMvc.perform(put("/api/v1/cases/{caseId}/visible-states", caseId).header("X-User-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"domain\":\"reparacion\",\"stateCode\":\"RECHAZADO\",\"reason\":\"Sin permiso\"}"))
                    .andExpect(status().isForbidden());
            assertProjection(caseId, "PAGADO", "EN_TRAMITE");
            assertThat(countHistory(caseId)).isEqualTo(historyBefore);
        } finally {
            jdbcTemplate.update("INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag) VALUES (?, ?, ?)", 1L, permissionId, true);
        }
    }

    @Test
    void rejectsInvalidAppointmentWithoutWritingSourceOrProjection() throws Exception {
        long caseId = createCase("PARTICULAR");
        int historyBefore = countHistory(caseId);

        mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentDate\":\"2026-08-10\",\"appointmentTime\":\"09:00:00\",\"estimatedDays\":1,\"statusCode\":\"NO_EXISTE\",\"reentry\":false,\"userId\":1}"))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM turnos_reparacion WHERE caso_id = ?", Integer.class, caseId)).isZero();
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        assertThat(countHistory(caseId)).isEqualTo(historyBefore);
    }

    @Test
    void coversBudgetAndNonStateFinancialMutationEndpointsInTheParticularMatrix() throws Exception {
        long caseId = createCase("PARTICULAR");

        mockMvc.perform(put("/api/v1/cases/{caseId}/budget", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"budgetDate\":\"2026-08-09\",\"reportStatusCode\":\"BORRADOR\",\"laborWithoutVat\":100,\"vatRate\":21,\"partsTotal\":0,\"estimatedDays\":1,\"minimumCloseAmount\":0}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "INGRESADO", "EN_TRAMITE");

        createClientMovement(caseId, "121.00");
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
        int historyBeforeNonStateFinancialMutations = countHistory(caseId);
        long movementId = jdbcTemplate.queryForObject("SELECT id FROM movimientos_financieros WHERE caso_id = ?", Long.class, caseId);

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/retentions", movementId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("[{\"retentionTypeCode\":\"IIBB\",\"amount\":1,\"detail\":\"No cambia el neto\"}]"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/applications", movementId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("[{\"conceptCode\":\"MANO_OBRA\",\"entityType\":\"CASO\",\"entityId\":" + caseId + ",\"appliedAmount\":1}]"))
                .andExpect(status().isOk());
        assertThat(countHistory(caseId)).isEqualTo(historyBeforeNonStateFinancialMutations);

        mockMvc.perform(post("/api/v1/cases/{caseId}/budget/items", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"visualOrder\":1,\"affectedPiece\":\"Optica\",\"taskCode\":\"ELECTRICIDAD\",\"damageLevelCode\":\"LEVE\",\"partDecisionCode\":\"REEMPLAZAR\",\"actionCode\":\"REEMPLAZAR\",\"requiresReplacement\":true,\"partValue\":10,\"estimatedHours\":1,\"laborAmount\":1}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/{caseId}/parts/sync-from-budget", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "FALTAN_REPUESTOS");

        mockMvc.perform(post("/api/v1/cases/{caseId}/budget/close", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reportStatusCode\":\"CERRADO\",\"observations\":\"Cierre de matriz\"}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "FALTAN_REPUESTOS");
    }

    @Test
    void keepsProjectionAuthoritativeAcrossIntakeUpdatesAndGenericWorkflowTransitions() throws Exception {
        long caseId = createCase("PARTICULAR");
        long intakeId = createIntake(caseId, 1);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");

        mockMvc.perform(put("/api/v1/vehicle-intakes/{intakeId}", intakeId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vehicleId\":10,\"intakeAt\":\"2026-08-06T09:00:00\",\"receivedByUserId\":1,\"mileage\":101,\"fuelCode\":\"MEDIO\",\"estimatedExitDate\":\"2026-08-20\",\"hasObservations\":false}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");

        mockMvc.perform(post("/api/v1/cases/{caseId}/workflow/transitions", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"domain\":\"tramite\",\"actionCode\":\"tramite.avanzar\",\"reason\":\"No gobierna PARTICULAR\",\"automatic\":false}"))
                .andExpect(status().isOk());
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
    }

    @Test
    void retriesAndConcurrentSameCaseRecalculationAppendOnlyOnce() throws Exception {
        long caseId = createCase("PARTICULAR");
        int historyBeforeRetry = countHistory(caseId);
        recalculator.recalculate(caseId);
        recalculator.recalculate(caseId);
        assertThat(countHistory(caseId)).isEqualTo(historyBeforeRetry);

        jdbcTemplate.update("DELETE FROM particular_effective_state_history WHERE caso_id = ?", caseId);
        jdbcTemplate.update("DELETE FROM particular_effective_state WHERE caso_id = ?", caseId);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = executor.submit(() -> recalculateAfterSharedStart(caseId, ready, start));
            Future<?> second = executor.submit(() -> recalculateAfterSharedStart(caseId, ready, start));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
        } finally {
            executor.shutdownNow();
        }

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM particular_effective_state WHERE caso_id = ?", Integer.class, caseId)).isEqualTo(1);
        assertThat(countHistory(caseId)).isEqualTo(1);
        assertProjection(caseId, "PAGADO", "EN_TRAMITE");
    }

    private long createCase(String typeCode) throws Exception {
        Long typeId = jdbcTemplate.queryForObject("SELECT id FROM tipos_tramite WHERE codigo = ?", Long.class, typeCode);
        String incidentDate = ("TODO_RIESGO".equals(typeCode) || "GRANIZO".equals(typeCode)) ? ",\"incidentDate\":\"2026-01-01\"" : "";
        MvcResult result = mockMvc.perform(post("/api/v1/cases").header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":" + typeId + ",\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false" + incidentDate + ",\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk()).andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("id").asLong();
    }

    private void assertProjection(long caseId, String procedure, String repair) {
        assertThat(jdbcTemplate.queryForObject("SELECT tramite_codigo FROM particular_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo(procedure);
        assertThat(jdbcTemplate.queryForObject("SELECT reparacion_codigo FROM particular_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo(repair);
    }

    private int countHistory(long caseId) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM particular_effective_state_history WHERE caso_id = ?", Integer.class, caseId);
    }

    private void recalculateAfterSharedStart(long caseId, CountDownLatch ready, CountDownLatch start) {
        try {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) throw new AssertionError("Concurrent recalculation did not start");
            recalculator.recalculate(caseId);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError(exception);
        }
    }

    private void assertCanonicalMatchesAliases(String response, String pointer) throws Exception {
        JsonNode node = objectMapper.readTree(response).at(pointer);
        assertThat(node.get("tramiteCode").asText()).isEqualTo(node.get("visibleTramiteState").get("code").asText());
        assertThat(node.get("reparacionCode").asText()).isEqualTo(node.get("visibleRepairState").get("code").asText());
    }

    private void createReceipt(long caseId, String type) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/receipts", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"" + type + "\",\"receiptNumber\":\"R-" + type + "-" + caseId + "\",\"receiverBusinessName\":\"Carlos Cliente\",\"issuedDate\":\"2026-08-09\",\"taxableNet\":100,\"vatAmount\":0,\"total\":100}"))
                .andExpect(status().isOk());
    }

    private long createPart(long caseId, String statusCode) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/parts", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Optica\",\"statusCode\":\"" + statusCode + "\",\"budgetedPrice\":10,\"finalPrice\":10,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void updatePart(long caseId, long partId, String statusCode) throws Exception {
        mockMvc.perform(put("/api/v1/cases/{caseId}/parts/{partId}", caseId, partId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Optica\",\"statusCode\":\"" + statusCode + "\",\"budgetedPrice\":10,\"finalPrice\":10,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk());
    }

    private long createAppointment(long caseId, String statusCode, boolean reentry) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentDate\":\"2026-08-10\",\"appointmentTime\":\"09:00:00\",\"estimatedDays\":1,\"statusCode\":\"" + statusCode + "\",\"reentry\":" + reentry + ",\"userId\":1}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void updateAppointment(long appointmentId, String statusCode, boolean reentry) throws Exception {
        mockMvc.perform(put("/api/v1/appointments/{appointmentId}", appointmentId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentDate\":\"2026-08-11\",\"appointmentTime\":\"09:00:00\",\"estimatedDays\":1,\"statusCode\":\"" + statusCode + "\",\"reentry\":" + reentry + ",\"userId\":1}"))
                .andExpect(status().isOk());
    }

    private long createIntake(long caseId, int sequence) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-intakes", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vehicleId\":10,\"intakeAt\":\"2026-08-0" + (sequence + 4) + "T08:00:00\",\"receivedByUserId\":1,\"mileage\":100,\"fuelCode\":\"MEDIO\",\"estimatedExitDate\":\"2026-08-20\",\"hasObservations\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long createOutcome(long caseId, long intakeId, boolean definitive, boolean reentry) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-outcomes", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"intakeId\":" + intakeId + ",\"outcomeAt\":\"2026-08-05T18:00:00\",\"deliveredByUserId\":1,\"definitive\":" + definitive + ",\"shouldReenter\":" + reentry + ",\"expectedReentryDate\":\"2026-08-12\",\"estimatedReentryDays\":2,\"repairedPhotosUploaded\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void updateOutcome(long outcomeId, boolean definitive, boolean reentry) throws Exception {
        mockMvc.perform(put("/api/v1/vehicle-outcomes/{outcomeId}", outcomeId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"outcomeAt\":\"2026-08-05T18:00:00\",\"deliveredByUserId\":1,\"definitive\":" + definitive + ",\"shouldReenter\":" + reentry + ",\"repairedPhotosUploaded\":false}"))
                .andExpect(status().isOk());
    }

    private void createClientMovement(long caseId, String amount) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"CLIENTE\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"2026-08-09T10:00:00\",\"grossAmount\":" + amount + ",\"netAmount\":" + amount + ",\"paymentMethodCode\":\"TRANSFERENCIA\",\"advancePayment\":false,\"bonification\":false}"))
                .andExpect(status().isOk());
    }
}
