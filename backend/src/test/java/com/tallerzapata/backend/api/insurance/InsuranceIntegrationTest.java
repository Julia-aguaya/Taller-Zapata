package com.tallerzapata.backend.api.insurance;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    }

    @Test
    void shouldUpsertCaseInsuranceProcessingAndFranchise() throws Exception {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "RIVA", "Rivadavia", "30711222334", true, 30, true);

        mockMvc.perform(put("/api/v1/cases/100/insurance")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseInsuranceUpsertRequest(1L, "POL-123", "CERT-1", "Todo riesgo", null, null, 1L, null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.insuranceCompanyId").value(1));

        mockMvc.perform(put("/api/v1/cases/100/insurance-processing")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new InsuranceProcessingUpsertRequest(LocalDate.of(2026, 5, 12), LocalDate.of(2026, 5, 13), "CONVENIO", "APROBADO", "ACEPTADA", LocalDate.of(2026, 5, 14), new BigDecimal("2500.00"), new BigDecimal("1200.00"), true, "AUTORIZADO", "Proveedor X", new BigDecimal("2200.00"), new BigDecimal("1800.00"), false, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modalityCode").value("CONVENIO"));

        mockMvc.perform(put("/api/v1/cases/100/franchise")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseFranchiseUpsertRequest("RECUPERAR", new BigDecimal("500.00"), "CLIENTE", null, "PROCEDE", true, new BigDecimal("500.00"), "Recuperar luego"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.franchiseStatusCode").value("RECUPERAR"));

        mockMvc.perform(get("/api/v1/insurance/catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modalityCodes.length()").isNumber())
                .andExpect(jsonPath("$.franchiseStatusCodes.length()").isNumber());

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo IN ('upsert_caso_seguro', 'upsert_tramitacion_seguro', 'upsert_franquicia')", Integer.class, 100L);
        assertThat(auditCount).isEqualTo(3);
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

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
    }
}
