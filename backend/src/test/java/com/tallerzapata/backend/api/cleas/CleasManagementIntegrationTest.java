package com.tallerzapata.backend.api.cleas;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CleasManagementIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (3, '00000000-0000-0000-0000-000000000300', 'operador', 'operador@tallerzapata.local', 'hash', 'Olivia', 'Operadora', true)");
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (3, 3, 2, 1, 1, true)");
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000001010', 'fisica', 'Carlos', 'Cliente', 'Carlos Cliente', 'DNI', '30111222', '30111222', true)");
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000002010', 'AB123CD', 'AB123CD', true)");
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (11, '00000000-0000-0000-0000-000000002011', 'AC123DE', 'AC123DE', true)");
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (100, '00000000-0000-0000-0000-000000003100', '0100CL', 100, 4, 1, 1, 10, 10, false, 1, 1, 4, 7, 9, 11, 'MEDIA')");
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, activo) VALUES (1, '00000000-0000-0000-0000-000000004001', 'RIVA', 'Rivadavia', true)");
    }

    @Test
    void shouldPersistEveryCleasManagementSectionUsingExistingDomainRelations() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"A_FAVOR\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.scopeCode").value("DANIO_TOTAL"));

        mockMvc.perform(put("/api/v1/cases/100/cleas/insurance").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1,\"cleasNumber\":\"CLEAS-100\",\"claimNumber\":\"SIN-100\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cleasNumber").value("CLEAS-100"));

        mockMvc.perform(put("/api/v1/cases/100/cleas/incident").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incident\":{\"incidentDate\":\"2026-08-01\",\"incidentTime\":\"10:30\",\"location\":\"Rosario\",\"dynamics\":\"Impacto lateral\",\"observations\":\"Con tercero\"},\"thirdPartyVehicleId\":11}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.incident.location").value("Rosario")).andExpect(jsonPath("$.thirdPartyVehicleId").value(11));
        assertThat(jdbcTemplate.queryForObject("SELECT vehiculo_id FROM caso_vehiculos WHERE caso_id = ? AND rol_vehiculo_codigo = 'TERCERO'", Long.class, 100L)).isEqualTo(11L);

        mockMvc.perform(patch("/api/v1/cases/100/cleas/processing").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-08-02\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.presentedAt").value("2026-08-02"));

        Long categoryId = jdbcTemplate.queryForObject("SELECT id FROM categorias_documentales WHERE codigo = 'ORDEN_CLEAS' AND modulo_codigo = 'CLEAS'", Long.class);
        jdbcTemplate.update("INSERT INTO documentos (id, public_id, storage_key, nombre_archivo, mime_type, tamano_bytes, checksum_sha256, categoria_id, subido_por, origen_codigo, activo) VALUES (200, '00000000-0000-0000-0000-000000000200', 'cleas/orden-100.pdf', 'orden-100.pdf', 'application/pdf', 10, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', ?, 3, 'CLEAS', true)", categoryId);
        String orderResponse = mockMvc.perform(post("/api/v1/cases/100/cleas/orders").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CleasOrderCreateRequest(200L, true, false, 2))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.fileName").value("orden-100.pdf")).andReturn().getResponse().getContentAsString();
        Long relationId = objectMapper.readTree(orderResponse).get("relationId").asLong();
        mockMvc.perform(get("/api/v1/cases/100/cleas/orders").header("X-User-Id", "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].documentId").value(200));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/cases/100/cleas/orders/{relationId}", relationId).header("X-User-Id", "3"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectSectionEndpointsForNonCleasCases() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = 2 WHERE id = 100");
        mockMvc.perform(get("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldPersistAdverseTotalClosureAndRejectFurtherCleasWrites() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"EN_CONTRA\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/cleas/close").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(100))
                .andExpect(jsonPath("$.closedAt").isNotEmpty());

        assertThat(jdbcTemplate.queryForObject("SELECT fecha_cierre FROM casos WHERE id = 100", java.time.LocalDateTime.class)).isNotNull();
        mockMvc.perform(get("/api/v1/cases/100/readiness").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[2].allowed").value(false))
                .andExpect(jsonPath("$.tabs[3].allowed").value(false))
                .andExpect(jsonPath("$.tabs[4].allowed").value(false))
                .andExpect(jsonPath("$.tabs[4].blockingReasons[0]").value("Esta etapa no está disponible porque el caso CLEAS fue cerrado por dictamen en contra."));
        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"A_FAVOR\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldOnlyCloseAdverseTotalCleasAndKeepUnfavorableFranchiseOpen() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"FRANQUICIA\",\"opinionCode\":\"EN_CONTRA\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/cleas/close").header("X-User-Id", "3"))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT fecha_cierre FROM casos WHERE id = 100", java.time.LocalDateTime.class)).isNull();
        mockMvc.perform(get("/api/v1/cases/100/readiness").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[2].tabCode").value("PRESUPUESTO"))
                .andExpect(jsonPath("$.tabs[2].allowed").value(true))
                .andExpect(jsonPath("$.tabs[3].tabCode").value("GESTION_REPARACION"))
                .andExpect(jsonPath("$.tabs[3].allowed").value(true))
                .andExpect(jsonPath("$.tabs[4].tabCode").value("PAGOS"))
                .andExpect(jsonPath("$.tabs[4].allowed").value(true));
    }

    @Test
    void shouldBlockCleasDownstreamReadinessWhileOpinionIsPending() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"PENDIENTE\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/readiness").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tabs[2].allowed").value(false))
                .andExpect(jsonPath("$.tabs[3].allowed").value(false))
                .andExpect(jsonPath("$.tabs[4].allowed").value(false))
                .andExpect(jsonPath("$.tabs[4].blockingReasons[0]").value("No se puede avanzar hasta recibir el dictamen."));
    }

    @Test
    void shouldRegisterCompanyPaymentsAgainstTheCleasAgreementAndCalculateTheSummaryOnTheBackend() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"A_FAVOR\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/cases/100/cleas/insurance").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1}"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/cases/100/cleas/processing").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-08-02\",\"agreedAmount\":1000}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/cleas/summary").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.agreedAmount").value(1000))
                .andExpect(jsonPath("$.paidAmount").value(0))
                .andExpect(jsonPath("$.pendingAmount").value(1000));

        mockMvc.perform(post("/api/v1/cases/100/cleas/company-payments").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":400,\"movementAt\":\"2026-08-03T10:30:00\",\"paymentMethodCode\":\"TRANSFERENCIA\",\"externalReference\":\"CLEAS-400\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(400))
                .andExpect(jsonPath("$.reason").value("Pago CLEAS de compania"));

        mockMvc.perform(get("/api/v1/cases/100/cleas/summary").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paidAmount").value(400))
                .andExpect(jsonPath("$.pendingAmount").value(600));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ? AND tipo_movimiento_codigo = 'INGRESO' AND origen_flujo_codigo = 'ASEGURADORA' AND contraparte_tipo_codigo = 'COMPANIA' AND cancela_tipo_codigo = 'COMPANIA'", Integer.class, 100L)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'registrar_pago_compania_cleas'", Integer.class, 100L)).isEqualTo(1);
    }

    @Test
    void shouldRejectCompanyPaymentsOutsideTheCleasEligibilityAndBalanceRules() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/cleas/company-payments").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":100,\"paymentMethodCode\":\"TRANSFERENCIA\"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/cases/100/cleas/definition").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeCode\":\"DANIO_TOTAL\",\"opinionCode\":\"A_FAVOR\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/cases/100/cleas/insurance").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":1}"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/cases/100/cleas/processing").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"presentedAt\":\"2026-08-02\",\"agreedAmount\":100}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/cleas/company-payments").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":101,\"paymentMethodCode\":\"TRANSFERENCIA\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/cases/100/cleas/company-payments").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":0,\"paymentMethodCode\":\"TRANSFERENCIA\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/cases/100/cleas/company-payments").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":100,\"paymentMethodCode\":\"INACTIVO\"}"))
                .andExpect(status().isConflict());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, 100L)).isZero();
    }
}
