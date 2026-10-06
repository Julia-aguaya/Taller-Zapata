package com.tallerzapata.backend.api.recovery;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FranchiseRecoveryIntegrationTest {

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
    void shouldUpsertFranchiseRecovery() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest(
                                "ABOGADO", null, null, "PROCEDE",
                                new BigDecimal("2500.00"), new BigDecimal("500.00"),
                                true, false, new BigDecimal("200.00"),
                                "PENDIENTE", LocalDate.of(2026, 6, 15),
                                false, null, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerCode").value("ABOGADO"))
                .andExpect(jsonPath("$.opinionCode").value("PROCEDE"))
                .andExpect(jsonPath("$.agreedAmount").value(2500.00))
                .andExpect(jsonPath("$.recoveryAmount").value(500.00))
                .andExpect(jsonPath("$.enablesRepair").value(true))
                .andExpect(jsonPath("$.recoversClient").value(false))
                .andExpect(jsonPath("$.clientAmount").value(200.00))
                .andExpect(jsonPath("$.clientPaymentStatusCode").value("PENDIENTE"))
                .andExpect(jsonPath("$.approvedLowerAgreement").value(false))
                .andExpect(jsonPath("$.reusesBaseData").value(true));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'upsert_recupero_franquicia'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldGetFranchiseRecovery() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest(
                                "TALLER", null, null, "PENDIENTE",
                                null, new BigDecimal("100.00"), false, true, new BigDecimal("50.00"),
                                "NO_APLICA", null, false, null, false))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerCode").value("TALLER"))
                .andExpect(jsonPath("$.opinionCode").value("PENDIENTE"))
                .andExpect(jsonPath("$.clientPaymentStatusCode").value("NO_APLICA"))
                .andExpect(jsonPath("$.recoversClient").value(true));
    }

    @Test
    void shouldRejectInvalidManagerCode() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest(
                                "INVALIDO", null, null, null,
                                null, null, false, false, null,
                                null, null, false, null, false))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRequireGlobalAdminForLowerAgreementApproval() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest("TALLER", 101L, "0101TZ", "PROCEDE", new BigDecimal("100.00"), new BigDecimal("50.00"), false, false, null, null, null, true, "No autorizado", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvedLowerAgreement").value(false));

        mockMvc.perform(post("/api/v1/cases/100/franchise-recovery/lower-agreement-approval")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Acuerdo documentado\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldPersistAlertAndAuditGlobalAdminApprovalWithoutFinancialMovements() throws Exception {
        upsertRecovery("PROCEDE", new BigDecimal("100.00"), new BigDecimal("50.00"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notificaciones WHERE caso_id = ? AND tipo_codigo = 'RECUPERO_MONTO_MENOR'", Integer.class, 100L)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, 100L)).isZero();

        mockMvc.perform(post("/api/v1/cases/100/franchise-recovery/lower-agreement-approval")
                        .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Acuerdo documentado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvedLowerAgreement").value(true))
                .andExpect(jsonPath("$.approvalNote").value("Acuerdo documentado"))
                .andExpect(jsonPath("$.approvedByUserId").value(1))
                .andExpect(jsonPath("$.approvedAt").isNotEmpty());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'aprobar_monto_recupero_menor'", Integer.class, 100L)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, 100L)).isZero();
    }

    @Test
    void shouldRequireApprovalReasonAndExemptSharedFault() throws Exception {
        upsertRecovery("PROCEDE", new BigDecimal("100.00"), new BigDecimal("50.00"));
        mockMvc.perform(post("/api/v1/cases/100/franchise-recovery/lower-agreement-approval")
                        .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\" \"}"))
                .andExpect(status().isBadRequest());

        upsertRecovery("CULPA_COMPARTIDA", new BigDecimal("100.00"), new BigDecimal("50.00"));
        mockMvc.perform(post("/api/v1/cases/100/franchise-recovery/lower-agreement-approval")
                        .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"No corresponde\"}"))
                .andExpect(status().isConflict());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, 100L)).isZero();
    }

    @Test
    void shouldCalculateRecoveryAmountsFromOwnBudgetAndActiveParts() throws Exception {
        jdbcTemplate.update("INSERT INTO presupuestos (id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, mano_obra_sin_iva, alicuota_iva, mano_obra_iva, mano_obra_con_iva, repuestos_total, total_cotizado, version_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 500L, 100L, 1L, 1L, LocalDate.of(2026, 1, 1), "CERRADO", new BigDecimal("100.00"), new BigDecimal("21.00"), new BigDecimal("21.00"), new BigDecimal("121.00"), new BigDecimal("200.00"), new BigDecimal("321.00"), 1);
        jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, estado_codigo, precio_final, usado, devuelto, source_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 501L, 100L, "Activo", "PEDIDO", new BigDecimal("80.00"), false, false, "MANUAL");
        jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, estado_codigo, precio_final, usado, devuelto, source_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 502L, 100L, "Devuelto", "DEVUELTO", new BigDecimal("70.00"), false, false, "MANUAL");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, estado_codigo, precio_final, usado, devuelto, source_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 503L, 100L, "Alias legado", "DEVOLVER", new BigDecimal("60.00"), false, false, "MANUAL");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
        upsertRecovery("PROCEDE", new BigDecimal("300.00"), new BigDecimal("300.00"));

        mockMvc.perform(get("/api/v1/cases/100/franchise-recovery").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.minimumLaborAmount").value(100.00))
                .andExpect(jsonPath("$.minimumPartsAmount").value(200.00))
                .andExpect(jsonPath("$.finalPartsTotal").value(80.00))
                .andExpect(jsonPath("$.amountToBillCompany").value(300.00))
                .andExpect(jsonPath("$.finalAmountForWorkshop").value(220.00));
    }

    @Test
    void shouldGateRecoveryBudgetWritesAndCopyBaseBudgetOnlyOnce() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isConflict());
        jdbcTemplate.update("INSERT INTO presupuestos (id, caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, total_cotizado, version_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 700L, 101L, 1L, 1L, LocalDate.of(2026, 1, 1), "CERRADO", new BigDecimal("500.00"), 1);
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest("TALLER", 101L, "0101TZ", "PROCEDE", null, null, true, false, null, null, null, false, null, true))))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuestos WHERE caso_id = ?", Integer.class, 100L)).isEqualTo(1);
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest("TALLER", 101L, "0101TZ", "PROCEDE", null, null, false, false, null, null, null, false, null, true))))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuestos WHERE caso_id = ?", Integer.class, 100L)).isEqualTo(1);
    }

    private void upsertRecovery(String opinionCode, BigDecimal agreedAmount, BigDecimal recoveryAmount) throws Exception {
        boolean sharedFault = "CULPA_COMPARTIDA".equals(opinionCode);
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest("TALLER", 101L, "0101TZ", opinionCode, agreedAmount, recoveryAmount, false, sharedFault, null, sharedFault ? "PENDIENTE" : null, sharedFault ? LocalDate.of(2026, 1, 1) : null, false, null, true, null, null, null, null, null, null, null, true, false, "TALLER"))))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectInvalidBaseCaseId() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest(
                                "CLIENTE", 9999L, null, null,
                                null, null, false, false, null,
                                null, null, false, null, false))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldPersistGeneralDataAndCaptureTodoRiesgoAssociation() throws Exception {
        jdbcTemplate.update("DELETE FROM caso_relaciones WHERE caso_destino_id = ?", 100L);
        jdbcTemplate.update("DELETE FROM recuperos_franquicia WHERE caso_id = ?", 100L);
        LocalDate presentedAt = LocalDate.now().minusDays(4);

        mockMvc.perform(put("/api/v1/cases/100/franchise-recovery")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new FranchiseRecoveryUpsertRequest(
                                "ABOGADO", 101L, null, "CULPA_COMPARTIDA", null, new BigDecimal("100.00"),
                                false, true, null, "PENDIENTE", presentedAt, false, null, false,
                                null, presentedAt))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerCode").value("ABOGADO"))
                .andExpect(jsonPath("$.baseFolderCode").value("0101TZ"))
                .andExpect(jsonPath("$.baseFolderName").value("Carlos Cliente"))
                .andExpect(jsonPath("$.incidentDate").value("2024-05-20"))
                .andExpect(jsonPath("$.presentedAt").value(presentedAt.toString()))
                .andExpect(jsonPath("$.prescriptionDate").value(presentedAt.plusYears(3).toString()))
                .andExpect(jsonPath("$.daysInProcess").value(4));

        assertThat(jdbcTemplate.queryForObject("SELECT fotografia_carpeta_base FROM recuperos_franquicia WHERE caso_id = ?", String.class, 100L))
                .contains("0101TZ");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_relaciones WHERE caso_origen_id = ? AND caso_destino_id = ? AND tipo_relacion_codigo = 'RECUPERO_DE'", Integer.class, 101L, 100L)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT compania_seguro_id FROM caso_seguro WHERE caso_id = ?", Long.class, 100L)).isEqualTo(20L);
        assertThat(jdbcTemplate.queryForObject("SELECT referencia_reclamo FROM caso_terceros WHERE caso_id = ?", String.class, 100L)).isEqualTo("REF-BASE");

        mockMvc.perform(put("/api/v1/cases/100/incident").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"incidentDate\":\"2024-05-20\",\"incidentTime\":\"10:15\",\"location\":\"Rosario\",\"dynamics\":\"Dinámica local\",\"observations\":\"Observaciones locales\"}"))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT dinamica FROM caso_siniestro WHERE caso_id = ?", String.class, 100L)).isEqualTo("Dinámica local");
        assertThat(jdbcTemplate.queryForObject("SELECT dinamica FROM caso_siniestro WHERE caso_id = ?", String.class, 101L)).isEqualTo("Dinámica base");

        mockMvc.perform(put("/api/v1/cases/100/insurance").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"insuranceCompanyId\":21,\"claimNumber\":\"SIN-LOCAL\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.claimNumber").value("SIN-LOCAL"));
        mockMvc.perform(put("/api/v1/cases/100/third-party-workshop").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thirdPartyCompanyId\":21,\"claimReference\":\"REF-LOCAL\",\"thirdPartyVehicleId\":10,\"driverPersonId\":10,\"newProcessor\":{\"name\":\"Tania\",\"lastName\":\"Tramita\",\"email\":\"tania@local.test\",\"phone\":\"3415550000\"},\"newInspector\":{\"name\":\"Ines\",\"lastName\":\"Inspecciona\",\"email\":\"ines@local.test\",\"phone\":\"3415550001\"}}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.claimReference").value("REF-LOCAL"))
                .andExpect(jsonPath("$.processor.email").value("tania@local.test"))
                .andExpect(jsonPath("$.inspector.phone").value("3415550001"));
        mockMvc.perform(post("/api/v1/cases/100/persons").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"personId\":10,\"caseRoleCode\":\"TITULAR\",\"vehicleId\":10,\"isMain\":false,\"porcentajeTitularidad\":60}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/100/persons").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"personId\":10,\"caseRoleCode\":\"TITULAR\",\"vehicleId\":10,\"isMain\":false,\"porcentajeTitularidad\":50}"))
                .andExpect(status().isConflict());
        Long holderRelationId = jdbcTemplate.queryForObject("SELECT id FROM caso_personas WHERE caso_id = ? AND rol_caso_codigo = 'TITULAR'", Long.class, 100L);
        mockMvc.perform(delete("/api/v1/cases/100/persons/{relationId}", holderRelationId).header("X-User-Id", "3"))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM personas WHERE id = ?", Integer.class, 10L)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT numero_siniestro FROM caso_seguro WHERE caso_id = ?", String.class, 101L)).isEqualTo("SIN-BASE");
        assertThat(jdbcTemplate.queryForObject("SELECT referencia_reclamo FROM caso_terceros WHERE caso_id = ?", String.class, 101L)).isEqualTo("REF-BASE");
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, activo) VALUES (?, ?, ?, ?, ?)", 20L, "00000000-0000-0000-0000-000000002020", "BASE", "Aseguradora Base", true);
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, codigo, nombre, activo) VALUES (?, ?, ?, ?, ?)", 21L, "00000000-0000-0000-0000-000000002021", "LOCAL", "Aseguradora Local", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 101L, "00000000-0000-0000-0000-000000003101", "0101TZ", 101L, 2L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100RF", 100L, 7L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO recuperos_franquicia (caso_id, caso_base_id, carpeta_base_codigo, habilita_reparacion, recupera_cliente, aprobado_menor_acuerdo, reutiliza_datos_base) VALUES (?, ?, ?, ?, ?, ?, ?)", 100L, 101L, "0101TZ", false, false, false, true);
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id, numero_siniestro) VALUES (?, ?, ?)", 101L, 20L, "SIN-BASE");
        jdbcTemplate.update("INSERT INTO caso_terceros (caso_id, compania_tercero_id, referencia_reclamo, documentacion_aceptada) VALUES (?, ?, ?, ?)", 101L, 21L, "REF-BASE", false);
        jdbcTemplate.update("INSERT INTO caso_siniestro (caso_id, fecha_siniestro, dinamica, observaciones) VALUES (?, ?, ?, ?)", 101L, LocalDate.of(2024, 5, 20), "Dinámica base", "Observaciones base");
        jdbcTemplate.update("INSERT INTO caso_relaciones (caso_origen_id, caso_destino_id, tipo_relacion_codigo, descripcion) VALUES (?, ?, ?, ?)", 101L, 100L, "RECUPERO_DE", "Recupero de franquicia de la carpeta 0101TZ");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
    }
}
