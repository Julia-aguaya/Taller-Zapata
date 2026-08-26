package com.tallerzapata.backend.application.extrabudget;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.List;

@Service
public class ExtraBudgetPdfService {
    public byte[] generate(Snapshot snapshot) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, output);
            document.open();
            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font section = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 9);

            Paragraph heading = new Paragraph("PRESUPUESTO EXTRA " + snapshot.issuedNumber() + " - REVISION " + snapshot.versionNumber(), title);
            heading.setAlignment(Element.ALIGN_CENTER);
            heading.setSpacingAfter(12);
            document.add(heading);

            PdfPTable data = new PdfPTable(2);
            data.setWidthPercentage(100);
            addRow(data, "Estado del documento", snapshot.status(), section, normal);
            addRow(data, "Confirmacion del cliente", snapshot.customerConfirmation(), section, normal);
            document.add(data);

            Paragraph detail = new Paragraph("TRABAJOS EXTRA", section);
            detail.setSpacingBefore(14);
            detail.setSpacingAfter(6);
            document.add(detail);
            PdfPTable items = new PdfPTable(5);
            items.setWidthPercentage(100);
            items.setWidths(new float[]{2.5f, 1.3f, 1.3f, 1.3f, 1.5f});
            for (String header : List.of("Pieza", "Accion", "Danio", "Cant.", "Repuestos")) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, section));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(4);
                items.addCell(cell);
            }
            for (Item item : snapshot.items()) {
                items.addCell(cell(item.affectedPiece(), normal));
                items.addCell(cell(item.actionCode(), normal));
                items.addCell(cell(item.damageLevelCode(), normal));
                items.addCell(cell(item.quantity().toPlainString(), normal));
                items.addCell(cell(currency(item.partsTotal()), normal));
            }
            document.add(items);

            PdfPTable totals = new PdfPTable(2);
            totals.setWidthPercentage(55);
            totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totals.setSpacingBefore(12);
            addRow(totals, "Repuestos", currency(snapshot.partsTotal()), section, normal);
            addRow(totals, "Mano de obra general", currency(snapshot.generalLaborAmount()), section, normal);
            addRow(totals, "IVA" + (snapshot.generalLaborVatApplies() ? " (" + snapshot.vatRate().stripTrailingZeros().toPlainString() + "%)" : " (no aplica)"), currency(snapshot.laborVat()), section, normal);
            addRow(totals, "TOTAL", currency(snapshot.total()), section, section);
            document.add(totals);

            if (snapshot.notes() != null && !snapshot.notes().isBlank()) {
                Paragraph notes = new Paragraph("Notas: " + snapshot.notes(), normal);
                notes.setSpacingBefore(14);
                document.add(notes);
            }

            Paragraph signature = new Paragraph("\nAceptacion del cliente: ________________________________", normal);
            signature.setSpacingBefore(30);
            document.add(signature);
        } finally {
            if (document.isOpen()) document.close();
        }
        return output.toByteArray();
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        table.addCell(cell(label, labelFont));
        table.addCell(cell(value, valueFont));
    }

    private PdfPCell cell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text == null || text.isBlank() ? "-" : text, font));
        cell.setPadding(4);
        return cell;
    }

    private String currency(BigDecimal amount) {
        return "$" + new DecimalFormat("#,##0.00").format(amount == null ? BigDecimal.ZERO : amount);
    }

    public record Snapshot(Long issuedNumber, Integer versionNumber, String status, String customerConfirmation,
                           String notes, BigDecimal generalLaborAmount, boolean generalLaborVatApplies,
                           BigDecimal vatRate, BigDecimal partsTotal, BigDecimal laborVat, BigDecimal total,
                           List<Item> items) { }
    public record Item(String affectedPiece, String actionCode, String damageLevelCode, BigDecimal quantity,
                       BigDecimal partsTotal) { }
}
