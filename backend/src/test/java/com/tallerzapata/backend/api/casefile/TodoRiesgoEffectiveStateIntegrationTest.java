package com.tallerzapata.backend.api.casefile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import jakarta.persistence.EntityManager;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TodoRiesgoEffectiveStateIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private EntityManager entityManager;
    @Autowired private TestDatabaseCleaner cleaner;
    @Autowired private TodoRiesgoEffectiveStateRecalculator recalculator;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000001010', 'fisica', 'Carlos', 'Cliente', 'Carlos Cliente', 'DNI', '30111222', '30111222', TRUE)");
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000002010', 'AB123CD', 'AB123CD', TRUE)");
    }

    @Test
    void createsAndAdvancesProcedureProjectionForInsuranceDocumentationAndRecordedDates() throws Exception {
        long caseId = createCase("TODO_RIESGO");
        assertProjection(caseId, "SIN_PRESENTAR", "SIN_TURNO");

        upsertInsuranceProcessing(caseId, "2026-08-09", null, null, null, null);
        assertProjection(caseId, "PRESENTADO_PD", "SIN_TURNO");
        upsertInsuranceProcessing(caseId, "2026-08-09", "ACEPTADA", "2026-08-10", null, null);
        assertProjection(caseId, "PRESENTADO_PD", "SIN_TURNO");

        Long completeDocumentationState = jdbcTemplate.queryForObject("SELECT id FROM workflow_estados WHERE LOWER(dominio) = 'documentacion' AND codigo = 'COMPLETA'", Long.class);
        jdbcTemplate.update("UPDATE casos SET estado_documentacion_actual_id = ? WHERE id = ?", completeDocumentationState, caseId);
        entityManager.clear();
        recalculator.recalculate(caseId);
        assertProjection(caseId, "EN_TRAMITE", "SIN_TURNO");

        upsertInsuranceProcessing(caseId, "2026-08-09", "ACEPTADA", "2026-08-10", "2026-08-10", null);
        assertProjection(caseId, "ACORDADO", "DAR_TURNO");
        upsertInsuranceProcessing(caseId, "2026-08-09", "ACEPTADA", "2026-08-10", "2026-08-10", "2026-08-11");
        assertProjection(caseId, "PASADO_A_PAGOS", "DAR_TURNO");
        assertThat(jdbcTemplate.queryForObject("SELECT fecha_acuerdo FROM todo_riesgo_state_facts WHERE caso_id = ?", String.class, caseId)).isEqualTo("2026-08-10");
        assertThat(jdbcTemplate.queryForObject("SELECT fecha_pasado_a_pagos FROM todo_riesgo_state_facts WHERE caso_id = ?", String.class, caseId)).isEqualTo("2026-08-11");
        // El estado PAGADO exige un acuerdo positivo cubierto por pagos de la compania
        // (el pago con acuerdo en cero nunca cierra).
        upsertAgreedAmount(caseId, "50000");
        createInsurancePayment(caseId, "2026-08-12T12:00:00", "50000");
        assertProjection(caseId, "PAGADO", "DAR_TURNO");
        assertThat(jdbcTemplate.queryForObject("SELECT fecha_pago FROM todo_riesgo_state_facts WHERE caso_id = ?", String.class, caseId)).isEqualTo("2026-08-12");
    }

    @Test
    void recalculatesPartsForEveryAuthorizationAndReceiptCombination() throws Exception {
        long caseId = createCase("TODO_RIESGO");
        upsertInsuranceProcessing(caseId, "2026-08-09", "ACEPTADA", "2026-08-10", "2026-08-10", null);
        long pendingAuthorization = createPart(caseId, "PEDIDO");
        assertProjection(caseId, "ACORDADO", "SIN_TURNO");

        jdbcTemplate.update("UPDATE repuestos_caso SET autorizado_codigo = 'AUTORIZADO' WHERE id = ?", pendingAuthorization);
        recalculator.recalculate(caseId);
        assertProjection(caseId, "ACORDADO", "FALTAN_REPUESTOS");

        updatePart(caseId, pendingAuthorization, "RECIBIDO");
        assertProjection(caseId, "ACORDADO", "SIN_TURNO");
        jdbcTemplate.update("UPDATE repuestos_caso SET autorizado_codigo = 'AUTORIZADO' WHERE id = ?", pendingAuthorization);
        recalculator.recalculate(caseId);
        assertProjection(caseId, "ACORDADO", "DAR_TURNO");

        long rejected = createPart(caseId, "PEDIDO");
        jdbcTemplate.update("UPDATE repuestos_caso SET autorizado_codigo = 'RECHAZADO' WHERE id = ?", rejected);
        recalculator.recalculate(caseId);
        assertProjection(caseId, "ACORDADO", "DAR_TURNO");

        // Las notas de credito requieren una factura del mismo caso (regla fiscal V83).
        long invoiceId = createReceiptId(caseId, "FACTURA");
        assertProjection(caseId, "ACORDADO", "DAR_TURNO");
        createLinkedCreditNote(caseId, invoiceId);
        assertProjection(caseId, "ACORDADO", "DAR_TURNO");
    }

    @Test
    void appointmentAndOutcomeWiringRespectsReentryAndTerminalRepair() throws Exception {
        long caseId = createCase("TODO_RIESGO");
        long appointmentId = createAppointment(caseId, "PENDIENTE", false);
        assertProjection(caseId, "SIN_PRESENTAR", "CON_TURNO");
        updateAppointment(appointmentId, "CANCELADO", false);
        assertProjection(caseId, "SIN_PRESENTAR", "SIN_TURNO");

        long intakeId = createIntake(caseId);
        long outcomeId = createOutcome(caseId, intakeId, false, true);
        Long reentryAppointmentId = jdbcTemplate.queryForObject("SELECT turno_reingreso_id FROM egresos_vehiculo WHERE id = ?", Long.class, outcomeId);
        assertProjection(caseId, "SIN_PRESENTAR", "CON_TURNO");
        updateAppointment(reentryAppointmentId, "CANCELADO", true);
        assertProjection(caseId, "SIN_PRESENTAR", "DEBE_REINGRESAR");
        updateOutcome(outcomeId, true, false);
        assertProjection(caseId, "SIN_PRESENTAR", "REPARADO");
    }

    @Test
    void noRepairRequiresReasonIsIdempotentAndKeepsAppendOnlyHistoryOnRevert() throws Exception {
        long caseId = createCase("TODO_RIESGO");
        int initialHistory = historyCount(caseId);
        assertThatThrownBy(() -> recalculator.markNoRepair(caseId, " ", 1L)).isInstanceOf(ConflictException.class);
        assertThat(historyCount(caseId)).isEqualTo(initialHistory);

        recalculator.markNoRepair(caseId, "Dano estructural", 1L);
        assertProjection(caseId, "SIN_PRESENTAR", "NO_DEBE_REPARARSE");
        assertThat(historyCount(caseId)).isEqualTo(initialHistory + 2);
        assertThat(jdbcTemplate.queryForObject("SELECT actor_usuario_id FROM todo_riesgo_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", Long.class, caseId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT cause FROM todo_riesgo_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", String.class, caseId)).isEqualTo("NO_REPAIR");

        recalculator.markNoRepair(caseId, "Duplicado", 1L);
        assertThat(historyCount(caseId)).isEqualTo(initialHistory + 2);
        recalculator.revertNoRepair(caseId, "Reparacion autorizada", 1L);
        assertProjection(caseId, "SIN_PRESENTAR", "SIN_TURNO");
        assertThat(jdbcTemplate.queryForObject("SELECT cause FROM todo_riesgo_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", String.class, caseId)).isEqualTo("NO_REPAIR_REVERT");
        int afterRevert = historyCount(caseId);
        recalculator.revertNoRepair(caseId, "Duplicado", 1L);
        assertThat(historyCount(caseId)).isEqualTo(afterRevert);
    }

    @Test
    void exposesProjectionCodesThroughCanonicalStatesAndCompatibleAliases() throws Exception {
        long caseId = createCase("TODO_RIESGO");

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId).header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("SIN_PRESENTAR"))
                .andExpect(jsonPath("$.visibleRepairState.code").value("SIN_TURNO"))
                .andExpect(jsonPath("$.tramiteCode").value("SIN_PRESENTAR"))
                .andExpect(jsonPath("$.reparacionCode").value("SIN_TURNO"));
    }

    @Test
    void noRepairEndpointsRequireGlobalAdminEvenWhenTheUserRetainsAdminPermissions() throws Exception {
        long caseId = createCase("TODO_RIESGO");

        mockMvc.perform(post("/api/v1/cases/{caseId}/todo-riesgo/no-repair", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Dano estructural\",\"actorUserId\":999}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("NO_DEBE_REPARARSE"))
                .andExpect(jsonPath("$.reparacionCode").value("NO_DEBE_REPARARSE"));
        assertThat(jdbcTemplate.queryForObject("SELECT no_repara_actor_usuario_id FROM todo_riesgo_state_facts WHERE caso_id = ?", Long.class, caseId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notificaciones WHERE caso_id = ? AND usuario_id = 1 AND tipo_codigo = 'TODO_RIESGO_NO_REPARA'", Integer.class, caseId)).isEqualTo(1);

        mockMvc.perform(post("/api/v1/cases/{caseId}/todo-riesgo/no-repair/revert", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Reparacion autorizada\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("SIN_TURNO"));

        long forbiddenCaseId = createCase("TODO_RIESGO");
        jdbcTemplate.update("UPDATE usuario_roles SET organizacion_id = 1, sucursal_id = 1 WHERE usuario_id = 1 AND rol_id = 1");
        int historyBefore = historyCount(forbiddenCaseId);
        try {
            mockMvc.perform(post("/api/v1/cases/{caseId}/todo-riesgo/no-repair", forbiddenCaseId).header("X-User-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Sin permiso\"}"))
                    .andExpect(status().isForbidden());
            assertThat(historyCount(forbiddenCaseId)).isEqualTo(historyBefore);
            assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM todo_riesgo_state_facts WHERE caso_id = ?", Integer.class, forbiddenCaseId)).isZero();
        } finally {
            jdbcTemplate.update("UPDATE usuario_roles SET organizacion_id = NULL, sucursal_id = NULL WHERE usuario_id = 1 AND rol_id = 1");
        }
    }

    @Test
    void rejectsNoRepairWhileARequiredPartIsUnreceivedAndAuditsUrgentRepair() throws Exception {
        long blockedCaseId = createCase("TODO_RIESGO");
        createPart(blockedCaseId, "PEDIDO");
        mockMvc.perform(post("/api/v1/cases/{caseId}/todo-riesgo/no-repair", blockedCaseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"No reparable\"}"))
                .andExpect(status().isConflict());
        assertProjection(blockedCaseId, "SIN_PRESENTAR", "EN_TRAMITE");

        long urgentCaseId = createCase("TODO_RIESGO");
        mockMvc.perform(post("/api/v1/cases/{caseId}/todo-riesgo/urgent-repaired", urgentCaseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Entrega urgente\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("REPARADO"))
                .andExpect(jsonPath("$.priorityCode").value("URGENTE"));
        assertThat(jdbcTemplate.queryForObject("SELECT reparacion_urgente_actor_usuario_id FROM todo_riesgo_state_facts WHERE caso_id = ?", Long.class, urgentCaseId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT cause FROM todo_riesgo_effective_state_history WHERE caso_id = ? ORDER BY id DESC LIMIT 1", String.class, urgentCaseId)).isEqualTo("URGENT_REPAIR");
    }

    @Test
    void rejectsInvalidNoRepairInputWithoutChangingProjectionOrHistory() throws Exception {
        long caseId = createCase("TODO_RIESGO");
        int historyBefore = historyCount(caseId);

        mockMvc.perform(post("/api/v1/cases/{caseId}/todo-riesgo/no-repair", caseId).header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\" \"}"))
                .andExpect(status().isBadRequest());

        assertProjection(caseId, "SIN_PRESENTAR", "SIN_TURNO");
        assertThat(historyCount(caseId)).isEqualTo(historyBefore);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM todo_riesgo_state_facts WHERE caso_id = ?", Integer.class, caseId)).isZero();
    }

    @Test
    void isIdempotentForBothInsuranceRepairTypesAndIsolatedFromParticular() throws Exception {
        long todoRiesgoId = createCase("TODO_RIESGO");
        int historyBefore = historyCount(todoRiesgoId);
        recalculator.recalculate(todoRiesgoId);
        recalculator.recalculate(todoRiesgoId);
        assertThat(historyCount(todoRiesgoId)).isEqualTo(historyBefore);

        long particularId = createCase("PARTICULAR");
        long granizoId = createCase("GRANIZO");
        recalculator.recalculate(particularId);
        recalculator.recalculate(granizoId);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM todo_riesgo_effective_state WHERE caso_id = ?", Integer.class, particularId)).isZero();
        assertProjection(granizoId, "SIN_PRESENTAR", "SIN_TURNO");
        assertThatThrownBy(() -> recalculator.markNoRepair(particularId, "No aplica", 1L)).isInstanceOf(ConflictException.class);
        recalculator.markNoRepair(granizoId, "Daño por granizo no reparable", 1L);
        assertProjection(granizoId, "SIN_PRESENTAR", "NO_DEBE_REPARARSE");
        recalculator.revertNoRepair(granizoId, "Reapertura autorizada", 1L);
        assertProjection(granizoId, "SIN_PRESENTAR", "SIN_TURNO");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM todo_riesgo_state_facts WHERE caso_id = ?", Integer.class, particularId)).isZero();
    }

    private long createCase(String typeCode) throws Exception {
        Long typeId = jdbcTemplate.queryForObject("SELECT id FROM tipos_tramite WHERE codigo = ?", Long.class, typeCode);
        String incidentDate = ("TODO_RIESGO".equals(typeCode) || "GRANIZO".equals(typeCode)) ? ",\"incidentDate\":\"2026-01-01\"" : "";
        MvcResult result = mockMvc.perform(post("/api/v1/cases").header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":" + typeId + ",\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false" + incidentDate + ",\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void upsertInsuranceProcessing(long caseId, String presentedAt, String quotationStatusCode, String quotationDate, String agreementDate, String passedToPaymentsDate) throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/cases/{caseId}/insurance-processing", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"" + presentedAt + "\",\"inspectionForwardedAt\":null,\"modalityCode\":\"PRESENCIAL\",\"opinionCode\":null,\"quotationStatusCode\":" + nullableJson(quotationStatusCode) + ",\"quotationDate\":" + nullableJson(quotationDate) + ",\"agreedAmount\":null,\"agreementDate\":" + nullableJson(agreementDate) + ",\"passedToPaymentsAt\":" + nullableJson(passedToPaymentsDate) + ",\"minimumCloseAmount\":50000,\"includesParts\":false,\"partsAuthorizationCode\":null,\"partsSupplierText\":null,\"amountToBillCompany\":null,\"finalAmountForWorkshop\":null,\"noRepair\":false,\"adminOverrideAppointment\":false}"))
                .andExpect(status().isOk());
    }

    private void createInsurancePayment(long caseId, String movementAt) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"ASEGURADORA\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"" + movementAt + "\",\"grossAmount\":100,\"netAmount\":100,\"paymentMethodCode\":\"TRANSFERENCIA\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isOk());
    }

    private void createInsurancePayment(long caseId, String movementAt, String amount) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"ASEGURADORA\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"" + movementAt + "\",\"grossAmount\":" + amount + ",\"netAmount\":" + amount + ",\"paymentMethodCode\":\"TRANSFERENCIA\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isOk());
    }

    private void upsertAgreedAmount(long caseId, String agreedAmount) throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/cases/{caseId}/insurance-processing", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"agreedAmount\":" + agreedAmount + ",\"minimumCloseAmount\":50000}"))
                .andExpect(status().isOk());
    }

    private long createPart(long caseId, String statusCode) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/parts", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Optica\",\"statusCode\":\"" + statusCode + "\",\"budgetedPrice\":10,\"finalPrice\":10,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void updatePart(long caseId, long partId, String statusCode) throws Exception {
        mockMvc.perform(put("/api/v1/cases/{caseId}/parts/{partId}", caseId, partId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Optica\",\"statusCode\":\"" + statusCode + "\",\"budgetedPrice\":10,\"finalPrice\":10,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk());
    }

    private void createReceipt(long caseId, String type) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/receipts", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"" + type + "\",\"receiptNumber\":\"R-" + type + "-" + caseId + "\",\"receiverBusinessName\":\"Carlos Cliente\",\"issuedDate\":\"2026-08-09\",\"taxableNet\":100,\"vatAmount\":0,\"total\":100}"))
                .andExpect(status().isOk());
    }

    /** Las notas de credito requieren una factura del mismo caso (regla fiscal V83). */
    private long createReceiptId(long caseId, String type) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/receipts", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"" + type + "\",\"receiptNumber\":\"R-" + type + "-" + caseId + "\",\"receiverBusinessName\":\"Carlos Cliente\",\"issuedDate\":\"2026-08-09\",\"taxableNet\":100,\"vatAmount\":0,\"total\":100}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long createLinkedCreditNote(long caseId, long invoiceId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/receipts", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"NOTA_CREDITO\",\"receiptNumber\":\"R-NC-" + caseId + "\",\"receiverBusinessName\":\"Carlos Cliente\",\"issuedDate\":\"2026-08-09\",\"taxableNet\":100,\"vatAmount\":0,\"total\":100,\"originalReceiptId\":" + invoiceId + "}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long createAppointment(long caseId, String statusCode, boolean reentry) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentDate\":\"2026-08-10\",\"appointmentTime\":\"09:00:00\",\"estimatedDays\":1,\"statusCode\":\"" + statusCode + "\",\"reentry\":" + reentry + ",\"overrideMissingAgreement\":true,\"userId\":1}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void updateAppointment(long appointmentId, String statusCode, boolean reentry) throws Exception {
        mockMvc.perform(put("/api/v1/appointments/{appointmentId}", appointmentId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentDate\":\"2026-08-11\",\"appointmentTime\":\"09:00:00\",\"estimatedDays\":1,\"statusCode\":\"" + statusCode + "\",\"reentry\":" + reentry + ",\"userId\":1}"))
                .andExpect(status().isOk());
    }

    private long createIntake(long caseId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-intakes", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vehicleId\":10,\"intakeAt\":\"2026-08-05T08:00:00\",\"receivedByUserId\":1,\"mileage\":100,\"fuelCode\":\"MEDIO\",\"estimatedExitDate\":\"2026-08-20\",\"hasObservations\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long createOutcome(long caseId, long intakeId, boolean definitive, boolean reentry) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-outcomes", caseId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"intakeId\":" + intakeId + ",\"outcomeAt\":\"2026-08-05T18:00:00\",\"deliveredByUserId\":1,\"definitive\":" + definitive + ",\"shouldReenter\":" + reentry + ",\"expectedReentryDate\":\"2026-08-12\",\"estimatedReentryDays\":2,\"repairedPhotosUploaded\":false}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void updateOutcome(long outcomeId, boolean definitive, boolean reentry) throws Exception {
        mockMvc.perform(put("/api/v1/vehicle-outcomes/{outcomeId}", outcomeId).header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"outcomeAt\":\"2026-08-05T18:00:00\",\"deliveredByUserId\":1,\"definitive\":" + definitive + ",\"shouldReenter\":" + reentry + ",\"repairedPhotosUploaded\":false}"))
                .andExpect(status().isOk());
    }

    private void assertProjection(long caseId, String procedure, String repair) {
        assertThat(jdbcTemplate.queryForObject("SELECT tramite_codigo FROM todo_riesgo_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo(procedure);
        assertThat(jdbcTemplate.queryForObject("SELECT reparacion_codigo FROM todo_riesgo_effective_state WHERE caso_id = ?", String.class, caseId)).isEqualTo(repair);
    }

    private int historyCount(long caseId) { return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM todo_riesgo_effective_state_history WHERE caso_id = ?", Integer.class, caseId); }
    private String nullableJson(String value) { return value == null ? "null" : "\"" + value + "\""; }
}
