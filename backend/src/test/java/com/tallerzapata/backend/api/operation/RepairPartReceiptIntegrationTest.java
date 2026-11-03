package com.tallerzapata.backend.api.operation;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RepairPartReceiptIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedBaseData();
    }

    @Test
    void shouldPersistOrderedReceiptsAndKeepPhysicalStatusSeparateFromAuthorization() throws Exception {
        mockMvc.perform(post(receiptPath(500L))
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"receiptDate\":\"2026-05-03\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderedQuantity").value(3))
                .andExpect(jsonPath("$.receivedQuantity").value(1))
                .andExpect(jsonPath("$.receiptStatus").value("PARCIAL"))
                .andExpect(jsonPath("$.authorizationCode").value("AUTORIZADO"));

        mockMvc.perform(post(receiptPath(500L))
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"receiptDate\":\"2026-05-01\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receipts[0].receiptDate").value("2026-05-01"))
                .andExpect(jsonPath("$.receipts[1].receiptDate").value("2026-05-03"))
                .andExpect(jsonPath("$.receivedDate").value("2026-05-03"));

        mockMvc.perform(post(receiptPath(501L))
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"receiptDate\":\"2026-05-02\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptStatus").value("RECIBIDO"));

        mockMvc.perform(get("/api/v1/cases/100/repair-parts").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].receipts.length()").value(2))
                .andExpect(jsonPath("$[0].receivedQuantity").value(2))
                .andExpect(jsonPath("$[1].receipts.length()").value(1));
    }

    @Test
    void shouldRejectReceiptRegistrationWhenPartAuthorizationIsRejected() throws Exception {
        mockMvc.perform(post(receiptPath(1100L))
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"receiptDate\":\"2026-05-03\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No se puede registrar ni modificar una recepción cuando la autorización del repuesto está rechazada"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso_recepciones WHERE repuesto_id = ?", Integer.class, 1100L))
                .isZero();
    }

    @Test
    void shouldUpdateAndDeleteOneReceiptWithoutChangingAnotherAndRejectInvalidTotals() throws Exception {
        mockMvc.perform(post(receiptPath(500L)).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"receiptDate\":\"2026-05-01\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post(receiptPath(500L)).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"receiptDate\":\"2026-05-03\"}"))
                .andExpect(status().isOk());

        Long firstReceiptId = jdbcTemplate.queryForObject(
                "SELECT id FROM repuestos_caso_recepciones WHERE repuesto_id = ? ORDER BY fecha_recepcion ASC, id ASC LIMIT 1", Long.class, 500L);
        Long secondReceiptId = jdbcTemplate.queryForObject(
                "SELECT id FROM repuestos_caso_recepciones WHERE repuesto_id = ? ORDER BY fecha_recepcion DESC, id DESC LIMIT 1", Long.class, 500L);

        mockMvc.perform(put(receiptPath(500L) + "/" + firstReceiptId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":2,\"receiptDate\":\"2026-05-02\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receivedQuantity").value(3))
                .andExpect(jsonPath("$.receiptStatus").value("RECIBIDO"));

        mockMvc.perform(delete(receiptPath(500L) + "/" + secondReceiptId).header("X-User-Id", "3"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/cases/100/repair-parts").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].receipts.length()").value(1))
                .andExpect(jsonPath("$[0].receipts[0].quantity").value(2))
                .andExpect(jsonPath("$[0].receivedQuantity").value(2))
                .andExpect(jsonPath("$[0].receiptStatus").value("PARCIAL"));

        mockMvc.perform(post(receiptPath(500L)).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":0,\"receiptDate\":\"2026-05-04\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(receiptPath(500L)).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":2,\"receiptDate\":\"2026-05-04\"}"))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND usuario_id = ? AND accion_codigo IN ('actualizar_recepcion_repuesto', 'eliminar_recepcion_repuesto')",
                Integer.class, 100L, 3L)).isEqualTo(2);
    }

    @Test
    void shouldExposeRepairPartsForEverySharedCaseType() throws Exception {
        for (long caseId = 100L; caseId <= 106L; caseId++) {
            mockMvc.perform(get("/api/v1/cases/{caseId}/repair-parts", caseId).header("X-User-Id", "3"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].orderedQuantity").value(caseId == 100L ? 3 : 1))
                    .andExpect(jsonPath("$[0].receivedQuantity").value(0))
                    .andExpect(jsonPath("$[0].receiptStatus").value("PENDIENTE"));
        }
    }

    private String receiptPath(Long partId) {
        return "/api/v1/cases/100/repair-parts/" + partId + "/receipts";
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (3, '00000000-0000-0000-0000-000000000300', 'operador', 'operador@tallerzapata.local', 'hash', 'Olivia', 'Operadora', true)");
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (3, 3, 1, NULL, NULL, true)");
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000001010', 'fisica', 'Carlos', 'Cliente', 'Carlos Cliente', 'DNI', '30111222', '30111222', true)");
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (10, '00000000-0000-0000-0000-000000002010', 'AB123CD', 'AB123CD', true)");
        for (long typeId = 1; typeId <= 7; typeId++) {
            long caseId = 99 + typeId;
            jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, 1, 1, 10, 10, false, 3, 1, 4, 7, 9, 11, 'MEDIA')",
                    caseId, String.format("00000000-0000-0000-0000-%012d", caseId), "R" + caseId, caseId, typeId);
            jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, autorizado_codigo, estado_codigo, usado, devuelto, source_type, cantidad_pedida) VALUES (?, ?, ?, ?, 'PENDIENTE', false, false, 'MANUAL', 1)",
                    1000L + caseId, caseId, "Repuesto " + caseId, caseId == 100 ? "RECHAZADO" : null);
        }
        jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, autorizado_codigo, estado_codigo, usado, devuelto, source_type, cantidad_pedida) VALUES (500, 100, 'Paragolpes', 'AUTORIZADO', 'PEDIDO', false, false, 'MANUAL', 3)");
        jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, estado_codigo, usado, devuelto, source_type, cantidad_pedida) VALUES (501, 100, 'Faro', 'PEDIDO', false, false, 'MANUAL', 1)");
        jdbcTemplate.update("INSERT INTO presupuestos (caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, mano_obra_sin_iva, alicuota_iva, mano_obra_iva, mano_obra_con_iva, repuestos_total, total_cotizado, version_actual) VALUES (100, 1, 1, ?, 'CERRADO', 0, 21, 0, 0, 0, 0, 1)", LocalDate.of(2026, 5, 1));
    }
}
