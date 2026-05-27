package com.tallerzapata.backend.application.budget;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BudgetPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generate(BudgetEntity budget, List<BudgetItemEntity> items, String folderCode) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            // Title
            Paragraph title = new Paragraph("PRESUPUESTO", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Case info table
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(15);
            float[] infoWidths = {1f, 2f};
            infoTable.setWidths(infoWidths);

            addInfoRow(infoTable, "Carpeta:", folderCode, headerFont, normalFont);
            addInfoRow(infoTable, "Fecha:", budget.getBudgetDate() != null ? budget.getBudgetDate().format(DATE_FMT) : "-", headerFont, normalFont);
            addInfoRow(infoTable, "Estado:", budget.getReportStatusCode() != null ? budget.getReportStatusCode() : "-", headerFont, normalFont);
            addInfoRow(infoTable, "Dias estimados:", budget.getEstimatedDays() != null ? String.valueOf(budget.getEstimatedDays()) : "-", headerFont, normalFont);
            document.add(infoTable);

            // Items table
            Paragraph itemsTitle = new Paragraph("Detalle de intervenciones", headerFont);
            itemsTitle.setSpacingAfter(10);
            document.add(itemsTitle);

            PdfPTable itemsTable = new PdfPTable(7);
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(15);
            float[] colWidths = {1.5f, 1.5f, 1.5f, 1.5f, 1f, 1f, 1f};
            itemsTable.setWidths(colWidths);

            // Headers
            String[] headers = {"Pieza", "Tarea", "Danio", "Decision", "Horas", "MO ($)", "Repuesto ($)"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, smallFont));
                cell.setBackgroundColor(new java.awt.Color(220, 220, 220));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(4);
                itemsTable.addCell(cell);
            }

            // Item rows (only active items)
            for (BudgetItemEntity item : items) {
                if (!Boolean.TRUE.equals(item.getActive())) continue;
                itemsTable.addCell(createCell(nullToStr(item.getAffectedPiece()), normalFont));
                itemsTable.addCell(createCell(nullToStr(item.getTaskCode()), normalFont));
                itemsTable.addCell(createCell(nullToStr(item.getDamageLevelCode()), normalFont));
                itemsTable.addCell(createCell(nullToStr(item.getPartDecisionCode()), normalFont));
                itemsTable.addCell(createCell(formatDecimal(item.getEstimatedHours()), normalFont));
                itemsTable.addCell(createCell(formatDecimal(item.getLaborAmount()), normalFont));
                itemsTable.addCell(createCell(formatDecimal(item.getPartValue()), normalFont));
            }

            if (items.stream().noneMatch(i -> Boolean.TRUE.equals(i.getActive()))) {
                PdfPCell emptyCell = new PdfPCell(new Phrase("Sin items", normalFont));
                emptyCell.setColspan(7);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyCell.setPadding(8);
                itemsTable.addCell(emptyCell);
            }

            document.add(itemsTable);

            // Totals table
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(60);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setSpacingBefore(20);
            float[] totalWidths = {1f, 1f};
            totalsTable.setWidths(totalWidths);

            addTotalRow(totalsTable, "Mano de obra (sin IVA):", formatDecimal(budget.getLaborWithoutVat()), normalFont);
            addTotalRow(totalsTable, "IVA (" + formatDecimal(budget.getVatRate()) + "%):", formatDecimal(budget.getLaborVat()), normalFont);
            addTotalRow(totalsTable, "Mano de obra (con IVA):", formatDecimal(budget.getLaborWithVat()), normalFont);
            addTotalRow(totalsTable, "Total repuestos:", formatDecimal(budget.getPartsTotal()), normalFont);
            addTotalRow(totalsTable, "TOTAL COTIZADO:", formatDecimal(budget.getTotalQuoted()), headerFont);
            document.add(totalsTable);

            // Observations
            if (budget.getObservations() != null && !budget.getObservations().isBlank()) {
                Paragraph obsTitle = new Paragraph("Observaciones", headerFont);
                obsTitle.setSpacingBefore(20);
                obsTitle.setSpacingAfter(5);
                document.add(obsTitle);
                document.add(new Paragraph(budget.getObservations(), normalFont));
            }

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF de presupuesto", e);
        }
        return out.toByteArray();
    }

    private void addInfoRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(3);
        table.addCell(labelCell);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(3);
        table.addCell(valueCell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(3);
        table.addCell(labelCell);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(3);
        table.addCell(valueCell);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(3);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private String nullToStr(String s) { return s == null ? "-" : s; }

    private String formatDecimal(BigDecimal d) {
        return d == null ? "-" : new DecimalFormat("#,##0.00").format(d);
    }
}
