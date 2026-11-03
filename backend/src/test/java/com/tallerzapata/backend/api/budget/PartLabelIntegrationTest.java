package com.tallerzapata.backend.api.budget;

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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PartLabelIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedBaseData();
    }

    @Test
    void shouldGenerateLegibleLabelsForPartsInEveryCaseType() throws Exception {
        for (long caseId = 100L; caseId <= 106L; caseId++) {
            long partId = 1000L + caseId;
            var result = mockMvc.perform(get("/api/v1/cases/{caseId}/parts/{partId}/label", caseId, partId)
                            .header("X-User-Id", "1"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type", MediaType.APPLICATION_PDF_VALUE))
                    .andExpect(header().string("Content-Disposition", containsString("attachment")))
                    .andExpect(header().string("Content-Disposition", containsString("etiqueta-rep-" + partId + ".pdf")))
                    .andExpect(header().exists("Content-Length"))
                    .andReturn();

            byte[] pdf = result.getResponse().getContentAsByteArray();
            assertThat(pdf.length).isGreaterThan(500);
            String text = new PdfTextExtractor(new PdfReader(pdf)).getTextFromPage(1);
            assertThat(text)
                    .contains("Carpeta: R" + caseId)
                    .contains("REP-" + partId)
                    .contains("Repuesto " + caseId)
                    .contains("Cantidad del item: " + (caseId == 100L ? "3 unidades" : "1 unidad"));
        }
    }

    @Test
    void shouldKeepThePartIdentifierAfterOperationalEditionAndReload() throws Exception {
        long partId = 1100L;
        String firstLabel = labelText(100L, partId);

        mockMvc.perform(put("/api/v1/cases/100/repair-parts/{partId}", partId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"finalSupplier\":\"Proveedor actualizado\",\"providerId\":null,\"authorizationCode\":null,\"statusCode\":\"PEDIDO\",\"purchasedByCode\":\"TALLER\",\"paymentStatusCode\":\"PENDIENTE\",\"receivedDate\":null,\"used\":false,\"returned\":false,\"orderedQuantity\":3}"))
                .andExpect(status().isOk());

        String reloadedLabel = labelText(100L, partId);

        assertThat(firstLabel).contains("REP-" + partId).contains("Cantidad del item: 3 unidades");
        assertThat(reloadedLabel).contains("REP-" + partId).contains("Cantidad del item: 3 unidades");
        assertThat(jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = ? AND id = ?", Long.class, 100L, partId))
                .isEqualTo(partId);
    }

    private String labelText(long caseId, long partId) throws Exception {
        byte[] pdf = mockMvc.perform(get("/api/v1/cases/{caseId}/parts/{partId}/label", caseId, partId)
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();
        return new PdfTextExtractor(new PdfReader(pdf)).getTextFromPage(1);
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (3, '00000000-0000-0000-0000-000000000300', 'operador', 'operador@tallerzapata.local', 'hash', 'Olivia', 'Operadora', true)");
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (3, 3, 1, NULL, NULL, true)");
        for (long typeId = 1; typeId <= 7; typeId++) {
            long caseId = 99 + typeId;
            long partId = 1000 + caseId;
            jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, 1, 1, false, 3, 1, 4, 7, 9, 11, 'MEDIA')",
                    caseId, String.format("00000000-0000-0000-0000-%012d", caseId), "R" + caseId, caseId, typeId);
            jdbcTemplate.update("INSERT INTO repuestos_caso (id, caso_id, descripcion, estado_codigo, compra_por_codigo, usado, devuelto, source_type, cantidad_pedida) VALUES (?, ?, ?, 'PEDIDO', 'TALLER', false, false, 'MANUAL', ?)",
                    partId, caseId, "Repuesto " + caseId, caseId == 100L ? 3 : 1);
        }
        jdbcTemplate.update("INSERT INTO presupuestos (caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, mano_obra_sin_iva, alicuota_iva, mano_obra_iva, mano_obra_con_iva, repuestos_total, total_cotizado, version_actual) VALUES (100, 1, 1, ?, 'CERRADO', 0, 21, 0, 0, 0, 0, 1)", LocalDate.of(2026, 5, 1));
    }
}
