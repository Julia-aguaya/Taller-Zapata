package com.tallerzapata.backend.api.casefile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.api.budget.BudgetCloseRequest;
import com.tallerzapata.backend.api.budget.BudgetItemCreateRequest;
import com.tallerzapata.backend.api.budget.BudgetUpsertRequest;
import com.tallerzapata.backend.api.finance.FinancialMovementCreateRequest;
import com.tallerzapata.backend.api.operation.RepairAppointmentCreateRequest;
import com.tallerzapata.backend.api.operation.VehicleIntakeCreateRequest;
import com.tallerzapata.backend.api.operation.VehicleOutcomeCreateRequest;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseReadinessIntegrationTest {

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
        seedPeopleAndVehicles();
    }

    @Test
    void shouldExposeInitialReadinessForParticularCase() throws Exception {
        Long caseId = createParticularCase();

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseTypeCode").value("PARTICULAR"))
                .andExpect(jsonPath("$.tabs[0].tabCode").value("FICHA_TECNICA"))
                .andExpect(jsonPath("$.tabs[0].completed").value(false))
                .andExpect(jsonPath("$.tabs[0].colorHint").value("RED"))
                .andExpect(jsonPath("$.tabs[0].blockingReasons[0]").value("Falta marca del vehiculo"))
                .andExpect(jsonPath("$.tabs[0].blockingReasons[1]").value("Falta modelo del vehiculo"))
                .andExpect(jsonPath("$.tabs[1].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[1].allowed").value(true))
                .andExpect(jsonPath("$.tabs[1].completed").value(false))
                .andExpect(jsonPath("$.tabs[1].blockingReasons[0]").value("Falta cargar el presupuesto"))
                .andExpect(jsonPath("$.tabs[2].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[2].allowed").value(false))
                .andExpect(jsonPath("$.tabs[2].completed").value(false))
                .andExpect(jsonPath("$.tabs[2].blockingReasons[0]").value("Debe cerrar el presupuesto antes de avanzar a gestion reparacion"))
                .andExpect(jsonPath("$.tabs[3].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[3].allowed").value(true))
                .andExpect(jsonPath("$.tabs[3].completed").value(false))
                .andExpect(jsonPath("$.tabs[3].blockingReasons[0]").value("Falta presupuesto para calcular el total cotizado"));
    }

    @Test
    void shouldMarkPaymentsCompletedWhenFullyPaid() throws Exception {
        Long caseId = createParticularCase();
        completeVehicle(caseId);
        createAndCloseBudget(caseId);
        createAppointment(caseId);
        createIntake(caseId);
        createDefinitiveOutcome(caseId);

        // Add full payment
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"CLIENTE\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"2026-01-15T12:00:00\",\"grossAmount\":100000,\"netAmount\":100000,\"paymentMethodCode\":\"EFECTIVO\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[3].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[3].allowed").value(true));
    }

    @Test
    void shouldMoveVisibleStatesToRepairAndPaymentsAccordingToParticularProgress() throws Exception {
        Long caseId = createParticularCase();

        jdbcTemplate.update(
                "UPDATE vehiculos SET marca_texto = ?, modelo_texto = ? WHERE id = ?",
                "Chevrolet", "Astra", 10L
        );

        prepareClosedBudget(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("INGRESADO"))
                .andExpect(jsonPath("$.visibleRepairState.code").value("DAR_TURNO"));

        RepairAppointmentCreateRequest appointmentRequest = new RepairAppointmentCreateRequest(
                LocalDate.of(2026, 7, 1),
                LocalTime.of(9, 0),
                2,
                null,
                "PENDIENTE",
                false,
                "Turno confirmado",
                1L
        );

        MvcResult appointmentResult = mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(appointmentRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long appointmentId = objectMapper.readTree(appointmentResult.getResponse().getContentAsByteArray()).get("id").asLong();

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("CON_TURNO"));

        VehicleIntakeCreateRequest intakeRequest = new VehicleIntakeCreateRequest(
                appointmentId,
                10L,
                LocalDateTime.of(2026, 7, 1, 9, 10),
                1L,
                null,
                120000,
                null,
                LocalDate.of(2026, 7, 2),
                false,
                null
        );

        MvcResult intakeResult = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-intakes", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(intakeRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long intakeId = objectMapper.readTree(intakeResult.getResponse().getContentAsByteArray()).get("id").asLong();

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleRepairState.code").value("EN_TRAMITE"));

        VehicleOutcomeCreateRequest outcomeRequest = new VehicleOutcomeCreateRequest(
                intakeId,
                LocalDateTime.of(2026, 7, 2, 18, 0),
                1L,
                null,
                true,
                false,
                null,
                null,
                null,
                true,
                "Egreso definitivo"
        );

        mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-outcomes", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(outcomeRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("PASADO_A_PAGOS"))
                .andExpect(jsonPath("$.visibleRepairState.code").value("REPARADO"));
    }

    @Test
    void shouldCloseParticularCaseWhenDefinitiveOutcomeAndFullPaymentExist() throws Exception {
        Long caseId = createParticularCase();

        jdbcTemplate.update(
                "UPDATE vehiculos SET marca_texto = ?, modelo_texto = ? WHERE id = ?",
                "Chevrolet", "Astra", 10L
        );

        prepareClosedBudget(caseId);

        RepairAppointmentCreateRequest appointmentRequest = new RepairAppointmentCreateRequest(
                LocalDate.of(2026, 7, 1),
                LocalTime.of(9, 0),
                2,
                null,
                "PENDIENTE",
                false,
                "Turno confirmado",
                1L
        );

        MvcResult appointmentResult = mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(appointmentRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long appointmentId = objectMapper.readTree(appointmentResult.getResponse().getContentAsByteArray()).get("id").asLong();

        VehicleIntakeCreateRequest intakeRequest = new VehicleIntakeCreateRequest(
                appointmentId,
                10L,
                LocalDateTime.of(2026, 7, 1, 9, 10),
                1L,
                null,
                120000,
                null,
                LocalDate.of(2026, 7, 2),
                false,
                null
        );

        MvcResult intakeResult = mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-intakes", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(intakeRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long intakeId = objectMapper.readTree(intakeResult.getResponse().getContentAsByteArray()).get("id").asLong();

        VehicleOutcomeCreateRequest outcomeRequest = new VehicleOutcomeCreateRequest(
                intakeId,
                LocalDateTime.of(2026, 7, 2, 18, 0),
                1L,
                null,
                true,
                false,
                null,
                null,
                null,
                true,
                "Egreso definitivo"
        );

        mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-outcomes", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(outcomeRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedAt").value(nullValue()))
                .andExpect(jsonPath("$.visibleTramiteState.code").value("PASADO_A_PAGOS"));

        FinancialMovementCreateRequest movementRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 7, 3, 10, 0),
                new BigDecimal("1210.00"),
                new BigDecimal("1210.00"),
                "TRANSFERENCIA",
                null,
                "PRESUPUESTO",
                false,
                false,
                "Pago total del cliente",
                null,
                List.of(),
                List.of()
        );

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(movementRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibleTramiteState.code").value("PAGADO"))
                .andExpect(jsonPath("$.visibleRepairState.code").value("REPARADO"))
                .andExpect(jsonPath("$.closedAt").value("2026-07-03T10:00:00"));
    }

    @Test
    void shouldReturnCaseWorkspaceBootstrap() throws Exception {
        Long caseId = createParticularCase();

        jdbcTemplate.update(
                "UPDATE vehiculos SET marca_texto = ?, modelo_texto = ? WHERE id = ?",
                "Chevrolet", "Astra", 10L
        );

        prepareClosedBudget(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}/workspace", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseDetail.id").value(caseId))
                .andExpect(jsonPath("$.caseDetail.visibleTramiteState.code").value("INGRESADO"))
                .andExpect(jsonPath("$.readiness.caseId").value(caseId))
                .andExpect(jsonPath("$.readiness.tabs[0].tabCode").value("FICHA_TECNICA"))
                .andExpect(jsonPath("$.workflowActions.caseId").value(caseId))
                .andExpect(jsonPath("$.financeSummary.caseId").value(caseId))
                .andExpect(jsonPath("$.particularFinanceSummary.caseId").value(caseId))
                .andExpect(jsonPath("$.particularFinanceSummary.quotedTotal").value(1210.00))
                .andExpect(jsonPath("$.particularFinanceSummary.pendingBalance").value(1210.00))
                .andExpect(jsonPath("$.budget.caseId").value(caseId))
                .andExpect(jsonPath("$.widgets.budget.exists").value(true))
                .andExpect(jsonPath("$.widgets.budget.reportStatusCode").value("CERRADO"))
                .andExpect(jsonPath("$.widgets.repair.hasAppointment").value(false))
                .andExpect(jsonPath("$.widgets.repair.hasIntake").value(false))
                .andExpect(jsonPath("$.widgets.repair.hasDefinitiveOutcome").value(false));
    }

    @Test
    void shouldReturnParticularFinanceSummary() throws Exception {
        Long caseId = createParticularCase();

        jdbcTemplate.update(
                "UPDATE vehiculos SET marca_texto = ?, modelo_texto = ? WHERE id = ?",
                "Chevrolet", "Astra", 10L
        );

        prepareClosedBudget(caseId);

        FinancialMovementCreateRequest advanceRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 7, 1, 12, 0),
                new BigDecimal("400.00"),
                new BigDecimal("400.00"),
                "TRANSFERENCIA",
                null,
                "PRESUPUESTO",
                true,
                false,
                "Seña",
                null,
                List.of(),
                List.of()
        );

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(advanceRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}/finance/particular-summary", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(caseId))
                .andExpect(jsonPath("$.quotedTotal").value(1210.00))
                .andExpect(jsonPath("$.customerPaid").value(400.00))
                .andExpect(jsonPath("$.pendingBalance").value(810.00))
                .andExpect(jsonPath("$.hasAdvancePayment").value(true))
                .andExpect(jsonPath("$.paidInFull").value(false))
                .andExpect(jsonPath("$.paidInFullAt").doesNotExist());
    }

    private void prepareClosedBudget(Long caseId) throws Exception {
        BudgetUpsertRequest budgetRequest = new BudgetUpsertRequest(
                LocalDate.of(2026, 6, 26),
                "BORRADOR",
                new BigDecimal("1000.00"),
                null,
                new BigDecimal("0.00"),
                3,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(put("/api/v1/cases/{caseId}/budget", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(budgetRequest)))
                .andExpect(status().isOk());

        BudgetItemCreateRequest itemRequest = new BudgetItemCreateRequest(
                1,
                "Puerta delantera derecha",
                "CHAPA",
                "LEVE",
                "REPARAR",
                "REPARAR",
                false,
                new BigDecimal("0.00"),
                new BigDecimal("2.00"),
                new BigDecimal("1000.00")
        );

        mockMvc.perform(post("/api/v1/cases/{caseId}/budget/items", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(itemRequest)))
                .andExpect(status().isOk());

        BudgetCloseRequest closeRequest = new BudgetCloseRequest("CERRADO", null);

        mockMvc.perform(post("/api/v1/cases/{caseId}/budget/close", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(closeRequest)))
                .andExpect(status().isOk());
    }

    private Long createParticularCase() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                1L,
                1L,
                1L,
                10L,
                10L,
                false,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "CLIENTE",
                "PRINCIPAL"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("id").asLong();
    }

    // ── TODO_RIESGO readiness tests ──────────────────────────────

    @Test
    void shouldExposeInitialReadinessForTodoRiesgoCase() throws Exception {
        Long caseId = createTodoRiesgoCase();

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseTypeCode").value("TODO_RIESGO"))
                .andExpect(jsonPath("$.tabs[0].tabCode").value("FICHA_TECNICA"))
                .andExpect(jsonPath("$.tabs[1].tabCode").value("GESTION_TRAMITE"))
                .andExpect(jsonPath("$.tabs[1].allowed").value(true))
                .andExpect(jsonPath("$.tabs[2].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[2].allowed").value(false))
                .andExpect(jsonPath("$.tabs[3].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[4].tabCode").value("PAGOS"));
    }

    @Test
    void shouldUnblockPresupuestoWhenTramiteCompletedForTodoRiesgo() throws Exception {
        Long caseId = createTodoRiesgoCase();
        seedInsuranceData(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[2].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[2].allowed").value(true));
    }

    // ── GRANIZO readiness tests ──────────────────────────────────

    @Test
    void shouldExposeInitialReadinessForGranizoCase() throws Exception {
        Long caseId = createGranizoCase();

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseTypeCode").value("GRANIZO"))
                .andExpect(jsonPath("$.tabs[0].tabCode").value("FICHA_TECNICA"))
                .andExpect(jsonPath("$.tabs[1].tabCode").value("GESTION_TRAMITE"))
                .andExpect(jsonPath("$.tabs[1].allowed").value(true))
                .andExpect(jsonPath("$.tabs[2].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[3].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[4].tabCode").value("PAGOS"));
    }

    @Test
    void shouldNotRequireFranchiseForGranizo() throws Exception {
        Long caseId = createGranizoCase();
        seedInsuranceData(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[1].tabCode").value("GESTION_TRAMITE"))
                .andExpect(jsonPath("$.tabs[1].blockingReasons.length()").value(0));
    }

    // ── PARTICULAR: presupuesto cerrado desbloquea reparación ──

    @Test
    void shouldUnblockRepairWhenBudgetClosedForParticular() throws Exception {
        Long caseId = createParticularCase();
        completeVehicle(caseId);
        createAndCloseBudget(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[1].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[1].completed").value(true))
                .andExpect(jsonPath("$.tabs[2].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[2].allowed").value(true));
    }

    // ── PARTICULAR: reparación definitiva desbloquea pagos ──

    @Test
    void shouldUnblockPaymentsWhenRepairDoneForParticular() throws Exception {
        Long caseId = createParticularCase();
        completeVehicle(caseId);
        createAndCloseBudget(caseId);

        // Agendar turno + ingreso + egreso definitivo
        createAppointment(caseId);
        createIntake(caseId);
        createDefinitiveOutcome(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[2].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[2].completed").value(true))
                .andExpect(jsonPath("$.tabs[3].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[3].allowed").value(true));
    }

    // ── TODO_RIESGO: franquicia PENDIENTE bloquea pagos ──

    @Test
    void shouldBlockPaymentsWhenFranchisePendingForTodoRiesgo() throws Exception {
        Long caseId = createTodoRiesgoCase();
        seedInsuranceData(caseId);
        // Crear franquicia PENDIENTE
        jdbcTemplate.update("INSERT INTO caso_franquicia (caso_id, estado_franquicia_codigo, monto_franquicia, tipo_recupero_codigo) VALUES (?, ?, ?, ?)",
                caseId, "SIN_DEFINIR", new BigDecimal("50000"), "TERCERO");

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[4].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[4].blockingReasons[0]").value("La franquicia sigue pendiente de resolucion"));
    }

    @Test
    void shouldAllowPaymentsWhenFranchiseResolvedForTodoRiesgo() throws Exception {
        Long caseId = createTodoRiesgoCase();
        seedInsuranceData(caseId);
        jdbcTemplate.update("INSERT INTO caso_franquicia (caso_id, estado_franquicia_codigo, monto_franquicia, tipo_recupero_codigo) VALUES (?, ?, ?, ?)",
                caseId, "CERRADA", new BigDecimal("50000"), "TERCERO");

        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[4].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[4].blockingReasons.length()").value(0));
    }

    // ── TODO_RIESGO: cotización pendiente bloquea todo ──

    @Test
    void shouldBlockDownstreamWhenQuotationNotAgreedForTodoRiesgo() throws Exception {
        Long caseId = createTodoRiesgoCase();
        // Sin seguro → GESTION_TRAMITE bloquea PRESUPUESTO, REPARACION y PAGOS
        mockMvc.perform(get("/api/v1/cases/{caseId}/readiness", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[2].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[2].allowed").value(false))
                .andExpect(jsonPath("$.tabs[3].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[3].allowed").value(false))
                .andExpect(jsonPath("$.tabs[4].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[4].allowed").value(false));
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Long createTodoRiesgoCase() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                2L, 1L, 1L, 10L, 10L, false, null, null, null, null, null, null,
                null, null, null, null, null, null, "CLIENTE", "PRINCIPAL"
        );
        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("id").asLong();
    }

    private Long createGranizoCase() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                3L, 1L, 1L, 10L, 10L, false, null, null, null, null, null, null,
                null, null, null, null, null, null, "CLIENTE", "PRINCIPAL"
        );
        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("id").asLong();
    }

    private void seedInsuranceData(Long caseId) {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, activo) VALUES (?,?,?,?,?)",
                1L, "00000000-0000-0000-0000-000000000101", "LA_SEGUNDA", "La Segunda", true);
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?,?)",
                caseId, 1L);
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado) VALUES (?,?,?)",
                caseId, LocalDate.now(), new BigDecimal("100000"));
    }

    private void seedPeopleAndVehicles() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true
        );
    }

    private void completeVehicle(Long caseId) {
        jdbcTemplate.update("UPDATE vehiculos SET marca_texto = 'Ford', modelo_texto = 'Focus', anio = 2020, tipo_vehiculo_codigo = 'SEDAN', uso_codigo = 'PARTICULAR', transmision_codigo = 'MANUAL' WHERE id = 10");
    }

    private void createAndCloseBudget(Long caseId) throws Exception {
        mockMvc.perform(put("/api/v1/cases/{caseId}/budget", caseId)
                .header("X-User-Id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"budgetDate\":\"2026-01-01\",\"reportStatusCode\":\"BORRADOR\",\"laborWithoutVat\":100000,\"vatRate\":21,\"partsTotal\":0,\"estimatedDays\":2,\"items\":[{\"visualOrder\":1,\"affectedPiece\":\"Puerta\",\"taskCode\":\"CHAPA\",\"damageLevelCode\":\"LEVE\",\"partDecisionCode\":\"REPARAR\",\"actionCode\":\"REPARAR\",\"requiresReplacement\":false,\"partValue\":0,\"estimatedHours\":2,\"laborAmount\":100000,\"active\":true}]}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/{caseId}/budget/close", caseId)
                .header("X-User-Id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reportStatusCode\":\"CERRADO\",\"reportDate\":\"2026-01-01\",\"authorizedByUserDisplayName\":\"Admin\",\"interestedPartyDisplayName\":\"Cliente\",\"items\":[{\"visualOrder\":1,\"affectedPiece\":\"Puerta\",\"taskCode\":\"CHAPA\",\"damageLevelCode\":\"LEVE\",\"partDecisionCode\":\"REPARAR\",\"actionCode\":\"REPARAR\",\"requiresReplacement\":false,\"partValue\":0,\"estimatedHours\":2,\"laborAmount\":100000,\"active\":true}]}"))
                .andExpect(status().isOk());
    }

    private void createAppointment(Long caseId) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId)
                        .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentDate\":\"2026-01-10\",\"appointmentTime\":\"09:00\",\"estimatedDays\":2,\"statusCode\":\"PENDIENTE\",\"reentry\":false,\"userId\":1}"))
                .andExpect(status().isOk());
    }

    private void createIntake(Long caseId) throws Exception {
        // Get first appointment
        String appts = mockMvc.perform(get("/api/v1/cases/{caseId}/appointments", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Long apptId = objectMapper.readTree(appts).get(0).get("id").asLong();

        mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-intakes", caseId)
                        .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentId\":" + apptId + ",\"vehicleId\":10,\"intakeAt\":\"2026-01-10T10:00:00\",\"mileage\":15000,\"receivedByUserId\":1,\"fuelCode\":null,\"estimatedExitDate\":\"2026-01-12\",\"hasObservations\":false,\"observationDetail\":null}"))
                .andExpect(status().isOk());
    }

    private void createDefinitiveOutcome(Long caseId) throws Exception {
        String intakes = mockMvc.perform(get("/api/v1/cases/{caseId}/vehicle-intakes", caseId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Long intakeId = objectMapper.readTree(intakes).get(0).get("id").asLong();

        mockMvc.perform(post("/api/v1/cases/{caseId}/vehicle-outcomes", caseId)
                        .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"intakeId\":" + intakeId + ",\"outcomeAt\":\"2026-01-12T18:00:00\",\"deliveredByUserId\":1,\"definitive\":true,\"shouldReenter\":false,\"repairedPhotosUploaded\":false,\"notes\":null}"))
                .andExpect(status().isOk());
    }
}
