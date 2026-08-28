package com.tallerzapata.backend.api.finance;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinanceIntegrationTest {

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
    void shouldCreateMovementAndSummarizeCase() throws Exception {
        FinancialMovementCreateRequest request = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                "PRESUPUESTO",
                false,
                false,
                "Pago parcial",
                "TX-001",
                List.of(new FinancialMovementRetentionRequest("IIBB", new BigDecimal("100.00"), "Retencion provincial")),
                List.of()
        );

        mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementTypeCode").value("INGRESO"))
                .andExpect(jsonPath("$.retentions[0].retentionTypeCode").value("IIBB"));

        mockMvc.perform(get("/api/v1/cases/100/finance-summary")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIngresos").value(900.00))
                .andExpect(jsonPath("$.saldo").value(900.00));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_movimiento_financiero'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCreateMovementWithCompanyCounterparty() throws Exception {
        FinancialMovementCreateRequest request = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "ASEGURADORA",
                "COMPANIA",
                null,
                1L,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("2000.00"),
                new BigDecimal("2000.00"),
                "TRANSFERENCIA",
                "Cuenta aseguradora",
                null,
                false,
                false,
                "Pago aseguradora",
                "TX-002",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementTypeCode").value("INGRESO"))
                .andExpect(jsonPath("$.counterpartyTypeCode").value("COMPANIA"))
                .andExpect(jsonPath("$.counterpartyCompanyId").value(1));
    }

    @Test
    void shouldRejectDirectGranizoFranchiseMovementWithoutPersistingIt() throws Exception {
        Long caseId = createGranizoCase();
        int movementsBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, caseId);
        int auditEventsBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ?", Integer.class, caseId);

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"CLIENTE\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"2026-05-11T10:30:00\",\"grossAmount\":1000,\"netAmount\":1000,\"paymentMethodCode\":\"TRANSFERENCIA\",\"cancellationTypeCode\":\"FRANQUICIA\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Franquicia no aplica a casos GRANIZO"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, caseId)).isEqualTo(movementsBefore);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ?", Integer.class, caseId)).isEqualTo(auditEventsBefore);
    }

    @Test
    void shouldApplyPartialAndFullTodoRiesgoFranchiseWithoutAffectingCompanyBalance() throws Exception {
        Long caseId = createTodoRiesgoCase();
        jdbcTemplate.update("INSERT INTO caso_franquicia (caso_id, estado_franquicia_codigo, monto_franquicia, tipo_recupero_codigo) VALUES (?, ?, ?, ?)", caseId, "SIN_DEFINIR", new BigDecimal("100.00"), "TERCERO");
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?, ?)", caseId, 1L);
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?, ?, ?, ?)", caseId, LocalDate.of(2026, 5, 11), new BigDecimal("500.00"), new BigDecimal("400.00"));

        postFranchiseMovement(caseId, "INGRESO", "40.00").andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/cases/{caseId}/finance/payment-breakdown", caseId).header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.client.franchisePaid").value(40.00))
                .andExpect(jsonPath("$.client.franchisePending").value(60.00))
                .andExpect(jsonPath("$.insurer.paid").value(0.00));

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"ASEGURADORA\",\"counterpartyTypeCode\":\"COMPANIA\",\"counterpartyCompanyId\":1,\"movementAt\":\"2026-05-11T10:30:00\",\"grossAmount\":400,\"netAmount\":400,\"paymentMethodCode\":\"TRANSFERENCIA\",\"cancellationTypeCode\":\"COMPANIA\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isOk());
        postFranchiseMovement(caseId, "INGRESO", "60.00").andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}/finance/payment-breakdown", caseId).header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.client.franchisePending").value(0.00))
                .andExpect(jsonPath("$.client.extrasPaid").value(0.00))
                .andExpect(jsonPath("$.insurer.paid").value(400.00));
    }

    @Test
    void shouldAcceptExactCompanyPaymentAndRejectOverpaymentForTheSelectedInsurer() throws Exception {
        Long caseId = createTodoRiesgoCase();
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?, ?)", caseId, 1L);
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?, ?, ?, ?)",
                caseId, LocalDate.of(2026, 5, 11), new BigDecimal("10.00"), new BigDecimal("10.00"));

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(companyPaymentJson(1L, "10.00")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flowOriginCode").value("ASEGURADORA"))
                .andExpect(jsonPath("$.counterpartyTypeCode").value("COMPANIA"))
                .andExpect(jsonPath("$.counterpartyCompanyId").value(1))
                .andExpect(jsonPath("$.cancellationTypeCode").value("COMPANIA"));

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(companyPaymentJson(1L, "0.01")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El pago no puede superar el saldo pendiente de la compania"));
    }

    @Test
    void shouldRejectCompanyPaymentWithoutAnAgreementOrForAnotherInsurer() throws Exception {
        Long caseId = createTodoRiesgoCase();
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?, ?)", caseId, 1L);

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(companyPaymentJson(1L, "10.00")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No hay un monto acordado de la compania para registrar el pago"));

        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?, ?, ?, ?)",
                caseId, LocalDate.of(2026, 5, 11), new BigDecimal("10.00"), new BigDecimal("10.00"));
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                2L, "00000000-0000-0000-0000-000000004002", "OTRA", "Otra Compania", "30-98765432-1", false, 30, true);

        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(companyPaymentJson(2L, "10.00")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El pago debe registrarse para la compania aseguradora del caso"));
    }

    @Test
    void shouldRejectInvalidTodoRiesgoFranchiseAndRestoreOnlyFranchiseWhenAnnulled() throws Exception {
        Long caseId = createTodoRiesgoCase();
        jdbcTemplate.update("INSERT INTO caso_franquicia (caso_id, estado_franquicia_codigo, monto_franquicia, tipo_recupero_codigo) VALUES (?, ?, ?, ?)", caseId, "SIN_DEFINIR", new BigDecimal("100.00"), "TERCERO");
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?, ?)", caseId, 1L);
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?, ?, ?, ?)", caseId, LocalDate.of(2026, 5, 11), new BigDecimal("100.00"), new BigDecimal("100.00"));

        postFranchiseMovement(caseId, "INGRESO", "101.00").andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El pago no puede superar la franquicia pendiente"));
        postFranchiseMovement(caseId, "INGRESO", "40.00").andExpect(status().isOk());
        postFranchiseMovement(caseId, "EGRESO", "40.00").andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}/finance/payment-breakdown", caseId).header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.client.franchisePaid").value(0.00))
                .andExpect(jsonPath("$.client.franchisePending").value(100.00));
        mockMvc.perform(post("/api/v1/cases/100/financial-movements").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(franchiseMovementJson("INGRESO", "10.00")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Franquicia solo aplica a casos TODO_RIESGO"));
    }

    @Test
    void shouldKeepGranizoInsurerTargetAtFullAgreementDespiteHistoricalFranchise() throws Exception {
        Long caseId = createGranizoCase();
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?, ?)", caseId, 1L);
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?, ?, ?, ?)",
                caseId, LocalDate.of(2026, 5, 11), new BigDecimal("1000.00"), new BigDecimal("1000.00"));
        jdbcTemplate.update("INSERT INTO caso_franquicia (caso_id, estado_franquicia_codigo, monto_franquicia, tipo_recupero_codigo) VALUES (?, ?, ?, ?)",
                caseId, "SIN_DEFINIR", new BigDecimal("200.00"), "TERCERO");

        mockMvc.perform(get("/api/v1/cases/{caseId}/finance/payment-breakdown", caseId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.client.eligibleFranchise").value(0.00))
                .andExpect(jsonPath("$.insurer.agreement").value(1000.00))
                .andExpect(jsonPath("$.insurer.total").value(1000.00));
    }

    @Test
    void shouldCreateReceiptAndListFinanceCatalogs() throws Exception {
        IssuedReceiptCreateRequest request = new IssuedReceiptCreateRequest(
                "FACTURA",
                "A-0001-00000001",
                "Carlos Cliente",
                LocalDate.of(2026, 5, 11),
                new BigDecimal("1000.00"),
                new BigDecimal("210.00"),
                new BigDecimal("1210.00"),
                null,
                null,
                "Factura inicial",
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/cases/100/receipts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptTypeCode").value("FACTURA"));

        mockMvc.perform(get("/api/v1/finance/catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementTypeCodes.length()").isNumber())
                .andExpect(jsonPath("$.receiptTypeCodes.length()").isNumber());
    }

    @Test
    void shouldCreatePartialCreditNoteWithoutExceedingItsOriginalInvoice() throws Exception {
        String invoice = mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"FACTURA\",\"receiptNumber\":\"A-1\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-11\",\"taxableNet\":1000,\"vatAmount\":0,\"total\":1000}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long invoiceId = objectMapper.readTree(invoice).get("id").asLong();
        mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"NOTA_CREDITO\",\"receiptNumber\":\"NC-1\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-12\",\"taxableNet\":400,\"vatAmount\":0,\"total\":400,\"originalReceiptId\":" + invoiceId + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.originalReceiptId").value(invoiceId));
        mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"NOTA_CREDITO\",\"receiptNumber\":\"NC-2\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-12\",\"taxableNet\":700,\"vatAmount\":0,\"total\":700,\"originalReceiptId\":" + invoiceId + "}"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectCreditNoteAgainstAnInvoiceFromAnotherCase() throws Exception {
        String invoice = mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"FACTURA\",\"receiptNumber\":\"A-OTHER-1\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-11\",\"taxableNet\":1000,\"vatAmount\":0,\"total\":1000}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long originalReceiptId = objectMapper.readTree(invoice).get("id").asLong();
        Long otherCaseId = createParticularCase();

        mockMvc.perform(post("/api/v1/cases/{caseId}/receipts", otherCaseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"NOTA_CREDITO\",\"receiptNumber\":\"NC-OTHER-1\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-12\",\"taxableNet\":100,\"vatAmount\":0,\"total\":100,\"originalReceiptId\":" + originalReceiptId + "}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("La nota de crédito debe vincular una factura del mismo caso"));
    }

    @Test
    void shouldKeepFiscalTypeSalePointAndNumberSeparateWhenRegisteringReceipts() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"FACTURA\",\"receiptNumber\":\"0001-00000001\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-11\",\"taxableNet\":1000,\"vatAmount\":0,\"total\":1000,\"fiscalTypeCode\":\"A\",\"salePoint\":\"0001\",\"fiscalNumber\":\"00000001\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fiscalTypeCode").value("A"))
                .andExpect(jsonPath("$.salePoint").value("0001"))
                .andExpect(jsonPath("$.fiscalNumber").value("00000001"));
        mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"FACTURA\",\"receiptNumber\":\"0001-00000001\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-11\",\"taxableNet\":1000,\"vatAmount\":0,\"total\":1000,\"fiscalTypeCode\":\"B\",\"salePoint\":\"0001\",\"fiscalNumber\":\"00000001\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/100/receipts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"FACTURA\",\"receiptNumber\":\"0001-00000001\",\"receiverBusinessName\":\"Aseguradora SA\",\"issuedDate\":\"2026-05-11\",\"taxableNet\":1000,\"vatAmount\":0,\"total\":1000,\"fiscalTypeCode\":\"A\",\"salePoint\":\"0001\",\"fiscalNumber\":\"00000001\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya existe un comprobante con ese tipo fiscal, punto de venta y número"));
    }

    @Test
    void shouldAddRetentionsToMovement() throws Exception {
        FinancialMovementCreateRequest createRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                null,
                false,
                false,
                "Pago parcial",
                "TX-001",
                null,
                null
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long movementId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        List<FinancialMovementRetentionRequest> retentionRequests = List.of(
                new FinancialMovementRetentionRequest("IIBB", new BigDecimal("50.00"), "Retencion test")
        );

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/retentions", movementId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(retentionRequests)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].retentionTypeCode").value("IIBB"))
                .andExpect(jsonPath("$[0].amount").value(50.00));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_retenciones_movimiento'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldAddApplicationsToMovement() throws Exception {
        FinancialMovementCreateRequest createRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                null,
                false,
                false,
                "Pago parcial",
                "TX-002",
                null,
                null
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long movementId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        List<FinancialMovementApplicationRequest> applicationRequests = List.of(
                new FinancialMovementApplicationRequest("MANO_OBRA", "CASO", 100L, new BigDecimal("400.00"))
        );

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/applications", movementId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(applicationRequests)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].conceptCode").value("MANO_OBRA"))
                .andExpect(jsonPath("$[0].appliedAmount").value(400.00));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_aplicaciones_movimiento'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldRejectInvalidRetentionTypeCode() throws Exception {
        FinancialMovementCreateRequest createRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                null,
                false,
                false,
                "Pago parcial",
                "TX-003",
                null,
                null
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long movementId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        List<FinancialMovementRetentionRequest> retentionRequests = List.of(
                new FinancialMovementRetentionRequest("INVALIDO", new BigDecimal("50.00"), "Retencion invalida")
        );

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/retentions", movementId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(retentionRequests)))
                .andExpect(status().isConflict());
    }

    // ── Receipt PDF tests ─────────────────────────────────────────

    @Test
    void shouldGenerateReceiptPdfWithComprobanteFiscal() throws Exception {
        Long receiptId = createReceiptWithComprobanteFiscal();

        mockMvc.perform(get("/api/v1/receipts/{receiptId}/pdf", receiptId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertTrue(result.getResponse().getContentAsByteArray().length > 0));
    }

    @Test
    void shouldGenerateClientPaymentPdf() throws Exception {
        Long caseId = createCaseWithPayment();

        mockMvc.perform(get("/api/v1/cases/{caseId}/finance/client-payment-pdf", caseId)
                        .param("clientName", "Carlos Cliente")
                        .param("vehiclePlate", "AB123CD")
                        .param("comprobanteTipo", "A")
                        .param("totalCotizado", "150000")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertTrue(result.getResponse().getContentAsByteArray().length > 0));
    }

    @Test
    void shouldReturn404ForNonExistentReceiptPdf() throws Exception {
        mockMvc.perform(get("/api/v1/receipts/{receiptId}/pdf", 99999L)
                        .header("X-User-Id", "1"))
                .andExpect(status().isNotFound());
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Long createReceiptWithComprobanteFiscal() throws Exception {
        Long caseId = createParticularCase();
        jdbcTemplate.update("INSERT INTO caso_tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?,?,?,?)",
                caseId, java.time.LocalDate.now(), new java.math.BigDecimal("100000"), new java.math.BigDecimal("100000"));

        MvcResult result = mockMvc.perform(post("/api/v1/cases/{caseId}/receipts", caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiptTypeCode\":\"FACTURA\",\"receiptNumber\":\"A-0001-00000099\",\"receiverBusinessName\":\"Cliente Test\",\"issuedDate\":\"2026-05-01\",\"taxableNet\":100000,\"vatAmount\":21000,\"total\":121000,\"comprobanteFiscal\":\"A\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createCaseWithPayment() throws Exception {
        Long caseId = createParticularCase();
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId)
                .header("X-User-Id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"CLIENTE\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"2026-01-15T12:00:00\",\"grossAmount\":100000,\"netAmount\":100000,\"paymentMethodCode\":\"EFECTIVO\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isOk());
        return caseId;
    }

    private Long createParticularCase() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":1,\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false,\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createGranizoCase() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":3,\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false,\"incidentDate\":\"2026-01-01\",\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createTodoRiesgoCase() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":2,\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false,\"incidentDate\":\"2026-01-01\",\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private org.springframework.test.web.servlet.ResultActions postFranchiseMovement(Long caseId, String movementType, String amount) throws Exception {
        return mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                .content(franchiseMovementJson(movementType, amount)));
    }

    private String franchiseMovementJson(String movementType, String amount) {
        return "{\"movementTypeCode\":\"" + movementType + "\",\"flowOriginCode\":\"CLIENTE\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"2026-05-11T10:30:00\",\"grossAmount\":" + amount + ",\"netAmount\":" + amount + ",\"paymentMethodCode\":\"TRANSFERENCIA\",\"cancellationTypeCode\":\"FRANQUICIA\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}";
    }

    private String companyPaymentJson(Long companyId, String amount) {
        return "{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"ASEGURADORA\",\"counterpartyTypeCode\":\"COMPANIA\",\"counterpartyCompanyId\":" + companyId + ",\"movementAt\":\"2026-05-11T10:30:00\",\"grossAmount\":" + amount + ",\"netAmount\":" + amount + ",\"paymentMethodCode\":\"TRANSFERENCIA\",\"cancellationTypeCode\":\"COMPANIA\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}";
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
        jdbcTemplate.update("MERGE INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) KEY(id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "SANCOR", "Sancor Seguros", "30-12345678-9", false, 30, true);
    }
}
