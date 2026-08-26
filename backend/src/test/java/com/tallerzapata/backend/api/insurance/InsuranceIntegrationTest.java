package com.tallerzapata.backend.api.insurance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InsuranceIntegrationTest {

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
    void shouldCreateCompanyAndContact() throws Exception {
        String companyResponse = mockMvc.perform(post("/api/v1/insurance/companies")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new InsuranceCompanyCreateRequest("RIVADAVIA", "Rivadavia Seguros", "30711222334", true, 30, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("RIVADAVIA"))
                .andReturn().getResponse().getContentAsString();

        Long companyId = objectMapper.readTree(companyResponse).get("id").asLong();

        mockMvc.perform(post("/api/v1/insurance/companies/{companyId}/contacts", companyId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new InsuranceCompanyContactCreateRequest(10L, "TRAMITADOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactRoleCode").value("TRAMITADOR"));

        mockMvc.perform(get("/api/v1/insurance/companies/{companyId}/contacts", companyId)
                .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].personId").value(10));

        mockMvc.perform(put("/api/v1/insurance/companies/{companyId}", companyId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new InsuranceCompanyUpdateRequest("RIVADAVIA", "Rivadavia Actualizada", "30711222334", false, 15))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rivadavia Actualizada"));

        Long contactId = jdbcTemplate.queryForObject("SELECT id FROM companias_contactos WHERE compania_id = ?", Long.class, companyId);
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/insurance/companies/{companyId}/contacts/{contactId}", companyId, contactId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/insurance/companies/{companyId}/deactivate", companyId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void shouldCreateCompanyWithNameOnlyAndKeepExplicitCodeCompatible() throws Exception {
        String generatedCodeResponse = mockMvc.perform(post("/api/v1/insurance/companies")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Seguros Delta\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Seguros Delta"))
                .andExpect(jsonPath("$.code").value(org.hamcrest.Matchers.startsWith("AUTO-")))
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(generatedCodeResponse).get("code").asText()).hasSizeLessThanOrEqualTo(50);

        mockMvc.perform(post("/api/v1/insurance/companies")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"DELTA\",\"name\":\"Seguros Delta Codigo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("DELTA"));

        mockMvc.perform(get("/api/v1/insurance/companies")
                        .param("q", "Delta")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void shouldSearchProvidersByNameWithoutSurnameFields() throws Exception {
        jdbcTemplate.update("INSERT INTO proveedores (id, public_id, nombre, activo) VALUES (?, ?, ?, ?)", 701L, "00000000-0000-0000-0000-000000007001", "Autopartes Delta", true);

        mockMvc.perform(get("/api/v1/providers")
                        .param("q", "partes del")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Autopartes Delta"))
                .andExpect(jsonPath("$[0].surname").doesNotExist());
    }

    @Test
    void shouldUpsertCaseInsuranceProcessingAndFranchise() throws Exception {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "RIVA", "Rivadavia", "30711222334", true, 30, true);

        mockMvc.perform(put("/api/v1/cases/100/insurance")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseInsuranceUpsertRequest(1L, "POL-123", "CERT-1", "Todo riesgo", null, null, null, null, null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.insuranceCompanyId").value(1));

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-05-12\",\"inspectionForwardedAt\":\"2026-05-13\",\"modalityCode\":\"PRESENCIAL\",\"opinionCode\":\"APROBADO\",\"quotationStatusCode\":\"ACEPTADA\",\"quotationDate\":\"2026-05-14\",\"agreedAmount\":2500,\"partsSupplierText\":\"Proveedor X\",\"finalAmountForWorkshop\":1800}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modalityCode").value("PRESENCIAL"))
                .andExpect(jsonPath("$.inspectionDate").doesNotExist());

        mockMvc.perform(put("/api/v1/cases/100/franchise")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseFranchiseUpsertRequest("PENDIENTE", new BigDecimal("500.00"), "ABONA_CLIENTE", null, "A_FAVOR", true, new BigDecimal("500.00"), "Recuperar luego"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.franchiseStatusCode").value("PENDIENTE"));

        mockMvc.perform(get("/api/v1/insurance/catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modalityCodes.length()").value(2))
                .andExpect(jsonPath("$.modalityCodes[?(@.code == 'PRESENCIAL')].name").value("Presencial"))
                .andExpect(jsonPath("$.modalityCodes[?(@.code == 'POR_FOTOS')].name").value("Por fotos"))
                .andExpect(jsonPath("$.franchiseStatusCodes.length()").isNumber());

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo IN ('upsert_caso_seguro', 'patch_tramitacion_seguro', 'upsert_franquicia')", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(3);
    }

    @Test
    void shouldReturnDerivedProcessingProjectionBeforeAnyProcessingIsSaved() throws Exception {
        jdbcTemplate.update("INSERT INTO presupuestos (id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, monto_minimo_cierre_mo, version_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 500L, 100L, 1L, 1L, LocalDate.of(2026, 1, 1), "PENDIENTE", new BigDecimal("100.00"), 1);
        jdbcTemplate.update("INSERT INTO presupuesto_items (id, presupuesto_id, orden_visual, pieza_afectada, requiere_reemplazo, valor_repuesto, importe_mano_obra, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 501L, 500L, 1, "Paragolpes", true, BigDecimal.ZERO, BigDecimal.ZERO, true);

        mockMvc.perform(get("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.caseId").value(100))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.minimumCloseAmount").value(100))
                .andExpect(jsonPath("$.includesParts").value(true))
                .andExpect(jsonPath("$.amountToBillCompany").doesNotExist());
    }

    @Test
    void shouldAssociateInsuranceContactsByPersonIdAndRenderTheirLinkedIdentityInPdf() throws Exception {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "RIVA", "Rivadavia", "30711222334", true, 30, true);
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 2L, "00000000-0000-0000-0000-000000004002", "OTRA", "Otra", "30711222335", true, 30, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, email_principal, telefono_principal, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 11L, "00000000-0000-0000-0000-000000001011", "fisica", "Ana", "Tramitadora", "Ana Tramitadora", "DNI", "30111223", "30111223", "ana@riva.test", "111", true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, email_principal, telefono_principal, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 12L, "00000000-0000-0000-0000-000000001012", "fisica", "Ines", "Inspectora", "Ines Inspectora", "DNI", "30111224", "30111224", "ines@riva.test", "222", true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 13L, "00000000-0000-0000-0000-000000001013", "fisica", "Otra", "Compania", "Otra Compania", "DNI", "30111225", "30111225", true);
        jdbcTemplate.update("INSERT INTO companias_contactos (id, compania_id, persona_id, rol_contacto_codigo) VALUES (?, ?, ?, ?)", 1L, 1L, 11L, "TRAMITADOR");
        jdbcTemplate.update("INSERT INTO companias_contactos (id, compania_id, persona_id, rol_contacto_codigo) VALUES (?, ?, ?, ?)", 2L, 1L, 12L, "INSPECTOR");
        jdbcTemplate.update("INSERT INTO companias_contactos (id, compania_id, persona_id, rol_contacto_codigo) VALUES (?, ?, ?, ?)", 3L, 2L, 13L, "TRAMITADOR");
        // case-person ID 11 deliberately collides with processor person ID 11 but points to another person.
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 11L, 100L, 10L, "CLIENTE", null, false, null);

        mockMvc.perform(put("/api/v1/cases/100/insurance")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1,\"processorPersonId\":11,\"inspectorPersonId\":12}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processorPersonId").value(11))
                .andExpect(jsonPath("$.inspectorPersonId").value(12))
                .andExpect(jsonPath("$.processorCasePersonId").isNumber())
                .andExpect(jsonPath("$.inspectorCasePersonId").isNumber());

        assertThat(jdbcTemplate.queryForObject("SELECT persona_id FROM caso_personas WHERE caso_id = ? AND rol_caso_codigo = 'TRAMITADOR'", Long.class, 100L)).isEqualTo(11L);
        assertThat(jdbcTemplate.queryForObject("SELECT persona_id FROM caso_personas WHERE caso_id = ? AND rol_caso_codigo = 'INSPECTOR'", Long.class, 100L)).isEqualTo(12L);
        assertThat(jdbcTemplate.queryForObject("SELECT tramitador_caso_persona_id FROM caso_seguro WHERE caso_id = ?", Long.class, 100L)).isNotEqualTo(11L);

        byte[] pdf = mockMvc.perform(get("/api/v1/cases/100/tramite/pdf").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        PdfReader reader = new PdfReader(pdf);
        String text = new PdfTextExtractor(reader).getTextFromPage(1);
        assertThat(text).contains("Ana Tramitadora", "Ines Inspectora");

        mockMvc.perform(put("/api/v1/cases/100/insurance")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1,\"processorPersonId\":12}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/cases/100/insurance")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1,\"processorPersonId\":13}"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectAmbiguousLegacyCasePersonContactFields() throws Exception {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "RIVA", "Rivadavia", "30711222334", true, 30, true);

        mockMvc.perform(put("/api/v1/cases/100/insurance")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1,\"processorCasePersonId\":1}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldUpsertCaseCleas() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/cleas")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseCleasUpsertRequest("PARCIAL", "FAVORABLE", new BigDecimal("800.00"), new BigDecimal("200.00"), "PENDIENTE", null, new BigDecimal("800.00"), "PENDIENTE", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scopeCode").value("PARCIAL"))
                .andExpect(jsonPath("$.opinionCode").value("FAVORABLE"));

        mockMvc.perform(get("/api/v1/cases/100/cleas")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerPaymentStatusCode").value("PENDIENTE"));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'upsert_caso_cleas'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldUpsertCaseThirdParty() throws Exception {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 2L, "00000000-0000-0000-0000-000000004002", "SANCOR", "Sancor", "30711222335", false, 20, true);

        CaseThirdPartyUpsertRequest thirdPartyRequest = new CaseThirdPartyUpsertRequest(2L, "REC-98765", "EN_REVISION", false, "TALLER", new BigDecimal("1500.00"), new BigDecimal("800.00"), new BigDecimal("2300.00"), new BigDecimal("2100.00"), new BigDecimal("3800.00"), new BigDecimal("3200.00"));
        mockMvc.perform(put("/api/v1/cases/100/third-party")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(thirdPartyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thirdPartyCompanyId").value(2))
                .andExpect(jsonPath("$.claimReference").value("REC-98765"));

        mockMvc.perform(get("/api/v1/cases/100/third-party")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partsProvisionModeCode").value("TALLER"));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'upsert_caso_terceros'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldRejectGranizoFranchiseCleasAndThirdPartyWrites() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = ? WHERE id = ?", 3L, 100L);

        mockMvc.perform(put("/api/v1/cases/100/franchise")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/cases/100/cleas")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/cases/100/third-party")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturnAllCatalogsIncludingCleasAndThirdParty() throws Exception {
        mockMvc.perform(get("/api/v1/insurance/catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cleasScopeCodes.length()").isNumber())
                .andExpect(jsonPath("$.cleasOpinionCodes.length()").isNumber())
                .andExpect(jsonPath("$.paymentStatusCodes.length()").isNumber())
                .andExpect(jsonPath("$.thirdPartyDocumentationStatusCodes.length()").isNumber())
                .andExpect(jsonPath("$.partsProvisionModeCodes.length()").isNumber());
    }

    @Test
    void shouldUpsertCaseLegal() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/legal")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseLegalUpsertRequest("ABOGADO", "CLIENTE", "JUDICIAL", LocalDate.of(2026, 1, 15), "CIUJ-12345", "Juzgado Civil 42", "Autos 1234/2026", "Dr. Gomez", "1144445555", "gomez@estudio.com", true, "ACUERDO", LocalDate.of(2026, 6, 1), new BigDecimal("150000.00"), "Observaciones iniciales", "Notas de cierre"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processorCode").value("ABOGADO"))
                .andExpect(jsonPath("$.claimantCode").value("CLIENTE"))
                .andExpect(jsonPath("$.instanceCode").value("JUDICIAL"))
                .andExpect(jsonPath("$.repairsVehicle").value(true))
                .andExpect(jsonPath("$.closedByCode").value("ACUERDO"))
                .andExpect(jsonPath("$.totalProceedsAmount").value(150000.00));

        mockMvc.perform(get("/api/v1/cases/100/legal")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.court").value("Juzgado Civil 42"));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'upsert_caso_legal'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCreateAndListLegalNews() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/legal")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseLegalUpsertRequest("TALLER", "TERCERO", "ADMINISTRATIVA", null, null, null, null, null, null, null, false, null, null, null, null, null))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/legal-news")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new LegalNewsCreateRequest(LocalDate.of(2026, 3, 10), "Se presento demanda", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.detail").value("Se presento demanda"))
                .andExpect(jsonPath("$.notifyCustomer").value(true));

        mockMvc.perform(get("/api/v1/cases/100/legal-news")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].detail").value("Se presento demanda"));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_legal_novedad'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCreateAndListLegalExpenses() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/legal")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseLegalUpsertRequest("CLIENTE", "COMPANIA", "MEDIACION", null, null, null, null, null, null, null, false, null, null, null, null, null))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/legal-expenses")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new LegalExpenseCreateRequest("Honorarios abogado", new BigDecimal("50000.00"), LocalDate.of(2026, 2, 20), "CLIENTE", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.concept").value("Honorarios abogado"))
                .andExpect(jsonPath("$.amount").value(50000.00))
                .andExpect(jsonPath("$.paidByCode").value("CLIENTE"));

        mockMvc.perform(get("/api/v1/cases/100/legal-expenses")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].concept").value("Honorarios abogado"));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_legal_gasto'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldReturnAllCatalogsIncludingLegal() throws Exception {
        mockMvc.perform(get("/api/v1/insurance/catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalProcessorCodes.length()").isNumber())
                .andExpect(jsonPath("$.legalClaimantCodes.length()").isNumber())
                .andExpect(jsonPath("$.legalInstanceCodes.length()").isNumber())
                .andExpect(jsonPath("$.legalClosureReasonCodes.length()").isNumber())
                .andExpect(jsonPath("$.legalExpensePayerCodes.length()").isNumber());
    }

    @Test
    void shouldCreateAndUpdateInsuranceProcessing() throws Exception {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "RIVA", "Rivadavia", "30711222334", true, 30, true);
        mockMvc.perform(put("/api/v1/cases/{caseId}/insurance", 100L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1,\"policyNumber\":\"POL-123\",\"certificateNumber\":\"CERT-456\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/cases/{caseId}/insurance-processing", 100L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-01-10\",\"inspectionForwardedAt\":\"2026-01-15\",\"modalityCode\":\"PRESENCIAL\",\"opinionCode\":null,\"quotationStatusCode\":null,\"quotationDate\":null,\"agreedAmount\":null,\"partsSupplierText\":\"CIA\",\"finalAmountForWorkshop\":null}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/cases/{caseId}/insurance-processing", 100L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"opinionCode\":\"APROBADO\",\"quotationStatusCode\":\"ACEPTADA\",\"quotationDate\":\"2026-01-20\",\"agreedAmount\":120000,\"partsSupplierText\":\"CIA\",\"finalAmountForWorkshop\":120000}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}/insurance-processing", 100L)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.agreedAmount").value(120000))
                .andExpect(jsonPath("$.quotationStatusCode").value("ACEPTADA"))
                .andExpect(jsonPath("$.amountToBillCompany").value(120000));
    }

    @Test
    void shouldCreateAndUpdateFranchise() throws Exception {
        mockMvc.perform(put("/api/v1/cases/{caseId}/franchise", 100L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"franchiseStatusCode\":\"PENDIENTE\",\"franchiseAmount\":50000,\"recoveryTypeCode\":\"ABONA_CLIENTE\",\"franchiseOpinionCode\":\"A_FAVOR\",\"exceedsFranchise\":true,\"recoveryAmount\":0}"))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/cases/{caseId}/franchise", 100L)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"franchiseStatusCode\":\"PENDIENTE\",\"franchiseAmount\":50000,\"recoveryTypeCode\":\"ABONA_CLIENTE\",\"franchiseOpinionCode\":\"A_FAVOR\",\"exceedsFranchise\":true,\"recoveryAmount\":50000}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/{caseId}/franchise", 100L)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.franchiseStatusCode").value("PENDIENTE"))
                .andExpect(jsonPath("$.recoveryAmount").value(50000));
    }

    @Test
    void shouldStoreInsuranceProviderSnapshotAndRejectInactiveProviders() throws Exception {
        jdbcTemplate.update("INSERT INTO proveedores (id, public_id, nombre, activo) VALUES (?, ?, ?, ?)", 702L, "00000000-0000-0000-0000-000000007002", "Proveedor Seguro", true);

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-01-10\",\"providerId\":702,\"partsSupplierText\":\"Ignorado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerId").value(702))
                .andExpect(jsonPath("$.partsSupplierText").value("Proveedor Seguro"));

        jdbcTemplate.update("UPDATE proveedores SET activo = false WHERE id = ?", 702L);
        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerId\":702}"))
                .andExpect(status().isConflict());

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerId\":null,\"partsSupplierText\":\"Proveedor Libre\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerId").doesNotExist())
                .andExpect(jsonPath("$.partsSupplierText").value("Proveedor Libre"));
    }

    @Test
    void shouldRequireConfirmationAndAuditAgreedAmountBelowDerivedMinimum() throws Exception {
        jdbcTemplate.update("INSERT INTO presupuestos (id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, monto_minimo_cierre_mo, version_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 500L, 100L, 1L, 1L, LocalDate.of(2026, 1, 1), "PENDIENTE", new BigDecimal("100.00"), 1);

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-01-10\",\"agreedAmount\":90}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROCESSING_AMOUNT_BELOW_MINIMUM_CONFIRMATION_REQUIRED"))
                .andExpect(jsonPath("$.data.minimumCloseAmount").value(100))
                .andExpect(jsonPath("$.data.difference").value(10));

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-01-10\",\"agreedAmount\":90,\"allowBelowMinimum\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.minimumCloseAmount").value(100))
                .andExpect(jsonPath("$.amountToBillCompany").value(90));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'patch_tramitacion_seguro'", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT despues_json FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'patch_tramitacion_seguro'", String.class, 100L))
                .contains("\"agreedAmount\":90.00", "\"minimumCloseAmount\":100.00", "\"difference\":10.00", "\"accepted\":true");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notificaciones WHERE caso_id = ?", Integer.class, 100L)).isZero();
    }

    @Test
    void shouldPersistInspectionRejectPrematureFieldsAndDetectVersionConflicts() throws Exception {
        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"inspectionDate\":\"2026-02-10\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROCESSING_PRESENTATION_DATE_REQUIRED"));

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"partsAuthorizationCode\":\"TOTAL\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROCESSING_PRESENTATION_DATE_REQUIRED"));

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-02-01\",\"inspectionDate\":\"2026-02-10\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inspectionDate").value("2026-02-10"))
                .andExpect(jsonPath("$.version").value(0));

        mockMvc.perform(get("/api/v1/cases/100/insurance-processing").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inspectionDate").value("2026-02-10"));

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":99,\"partsSupplierText\":\"Proveedor\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROCESSING_VERSION_CONFLICT"))
                .andExpect(jsonPath("$.data.expectedVersion").value(99))
                .andExpect(jsonPath("$.data.actualVersion").value(0));
    }

    @Test
    void shouldRecalculateAmountToBillFromCurrentFranchise() throws Exception {
        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-02-01\",\"agreedAmount\":50}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amountToBillCompany").value(50));

        mockMvc.perform(put("/api/v1/cases/100/franchise")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"franchiseStatusCode\":\"PENDIENTE\",\"franchiseAmount\":80,\"recoveryTypeCode\":\"ABONA_CLIENTE\",\"franchiseOpinionCode\":\"A_FAVOR\",\"exceedsFranchise\":true,\"recoveryAmount\":0}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/insurance-processing").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amountToBillCompany").value(0));

        mockMvc.perform(put("/api/v1/cases/100/franchise")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"franchiseStatusCode\":\"PENDIENTE\",\"franchiseAmount\":80,\"recoveryTypeCode\":\"PROPIA_CIA\",\"franchiseOpinionCode\":\"A_FAVOR\",\"exceedsFranchise\":true,\"recoveryAmount\":0}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/insurance-processing").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amountToBillCompany").value(50));
    }

    @Test
    void shouldPersistProcessingPartsAuthorizationWithoutChangingIndividualParts() throws Exception {
        jdbcTemplate.update("INSERT INTO presupuestos (id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, version_actual) VALUES (?, ?, ?, ?, ?, ?, ?)", 500L, 100L, 1L, 1L, LocalDate.of(2026, 1, 1), "PENDIENTE", 1);
        jdbcTemplate.update("INSERT INTO presupuesto_items (id, presupuesto_id, orden_visual, pieza_afectada, requiere_reemplazo, valor_repuesto, importe_mano_obra, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 501L, 500L, 1, "Paragolpes", true, BigDecimal.ZERO, BigDecimal.ZERO, true);
        jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, presupuesto_item_id, descripcion, autorizado_codigo, estado_codigo, usado, devuelto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 502L, 100L, 501L, "Paragolpes", "AUTORIZADO", "PEDIDO", false, false);

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-02-01\",\"partsAuthorizationCode\":\"PARCIAL\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.includesParts").value(true))
                .andExpect(jsonPath("$.partsAuthorizationCode").value("PARCIAL"));

        mockMvc.perform(get("/api/v1/cases/100/insurance-processing").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.includesParts").value(true))
                .andExpect(jsonPath("$.partsAuthorizationCode").value("PARCIAL"));

        assertThat(jdbcTemplate.queryForObject("SELECT autorizado_codigo FROM repuestos_caso WHERE id = ?", String.class, 502L)).isEqualTo("AUTORIZADO");
        assertThat(jdbcTemplate.queryForObject("SELECT antes_json FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'patch_tramitacion_seguro'", String.class, 100L)).contains("\"partsAuthorizationCode\":null");
        assertThat(jdbcTemplate.queryForObject("SELECT despues_json FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'patch_tramitacion_seguro'", String.class, 100L)).contains("\"partsAuthorizationCode\":\"PARCIAL\"");

        jdbcTemplate.update("UPDATE presupuesto_items SET requiere_reemplazo = false WHERE presupuesto_id = ?", 500L);
        mockMvc.perform(get("/api/v1/cases/100/insurance-processing").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.includesParts").value(false))
                .andExpect(jsonPath("$.partsAuthorizationCode").doesNotExist());
    }

    @Test
    void shouldRequireInsuranceCreatePermissionToUpdateProcessingPartsAuthorization() throws Exception {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 4L, "00000000-0000-0000-0000-000000000400", "sin-permiso", "sin-permiso@tallerzapata.local", "hash", "Sin", "Permiso", true);

        mockMvc.perform(patch("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"partsAuthorizationCode\":\"TOTAL\"}"))
                .andExpect(status().isForbidden());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 2L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
    }
}
