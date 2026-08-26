package com.tallerzapata.backend.application.extrabudget;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExtraBudgetPdfServiceTest {
    @Test
    void shouldRenderOnlyTheFrozenExtraSnapshot() throws Exception {
        ExtraBudgetPdfService.Snapshot snapshot = new ExtraBudgetPdfService.Snapshot(
                42L, 3, "PRESENTADO", "PENDIENTE", "Nota congelada", new BigDecimal("50.00"), true,
                new BigDecimal("21.00"), new BigDecimal("100.00"), new BigDecimal("10.50"), new BigDecimal("160.50"),
                List.of(new ExtraBudgetPdfService.Item("Puerta", "REEMPLAZAR", "LEVE", BigDecimal.ONE, new BigDecimal("100.00"))));

        byte[] content = new ExtraBudgetPdfService().generate(snapshot);
        PdfReader reader = new PdfReader(content);
        String text = new PdfTextExtractor(reader).getTextFromPage(1);

        assertThat(text).contains("PRESUPUESTO EXTRA 42 - REVISION 3", "Puerta", "REEMPLAZAR", "LEVE", "PENDIENTE", "Nota congelada", "160.50");
        assertThat(text).doesNotContain("Cliente congelado", "Ford Focus", "CARP-2026-7", "ASEGURADORA", "PRESUPUESTO PRINCIPAL", "TALLER ZAPATA");
    }
}
