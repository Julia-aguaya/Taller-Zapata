package com.tallerzapata.backend.application.budget;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Cell;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Detail;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Piece;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.ProviderColumn;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Snapshot;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetComparisonPdfServiceTest {
    @Test
    void shouldRenderTheCompleteLandscapeMatrixWithTermsAndExplicitPriceStates() throws Exception {
        Detail detail = new Detail(
                new Snapshot(1L, 7, LocalDate.of(2026, 8, 24), 1, "MATRIX", 1),
                List.of(
                        new ProviderColumn(10L, 100L, "Norte", "A", "CONTADO", 1),
                        new ProviderColumn(20L, 200L, "Sur", "SIN_FACTURA", "TARJETA_CUOTAS_SIN_INTERES", 1)),
                List.of(new Piece(30L, "Optica delantera", "REEMPLAZAR", null, "MANUAL", List.of(
                        new Cell(10L, new BigDecimal("120.00"), true),
                        new Cell(20L, new BigDecimal("120.00"), true))),
                        new Piece(31L, "Paragolpes", "REEMPLAZAR", null, "MANUAL", List.of())),
                new BigDecimal("120.00"));

        byte[] pdf = new BudgetComparisonPdfService().generate(detail);
        PdfReader reader = new PdfReader(pdf);
        String text = new PdfTextExtractor(reader).getTextFromPage(1);

        assertThat(reader.getPageSize(1).getWidth()).isGreaterThan(reader.getPageSize(1).getHeight());
        assertThat(text).contains("REPUESTO", "PROVEEDOR 1", "Norte", "PROVEEDOR 2", "Sur");
        assertThat(text).contains("Optica delantera", "Facturación", "Medio de pago", "Subtotal mejor precio");
        assertThat(text).contains("Mejor precio (empate)", "Sin cotización", "Sin factura", "Tarjeta cuotas sin interes", "Generación 7", "Página 1");
    }
}
