package com.tallerzapata.backend.application.finance;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class ClientPaymentPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale AR = new Locale("es", "AR");

    public byte[] generate(CaseEntity caseEntity, String clientName, String vehiclePlate,
                           String comprobanteTipo, BudgetEntity budget,
                           List<FinancialMovementEntity> movements,
                           String observaciones, String facturaRazonSocial, String facturaNumero,
                           OrganizationEntity org, BranchEntity branch) {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font redFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, RGBColor.RED);
            Font greenFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, new RGBColor(0, 120, 0));

            // ══ HEADER ══
            PdfPTable headerBand = new PdfPTable(2);
            headerBand.setWidthPercentage(100);
            headerBand.setWidths(new float[]{2, 1});

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.addElement(new Paragraph(org != null ? org.getName() : "Taller Zapata", brandFont));
            if (branch != null) {
                String line = "";
                if (branch.getName() != null) line = branch.getName();
                if (branch.getAddressLine1() != null) line += " — " + branch.getAddressLine1();
                if (branch.getPhone() != null) line += " — " + branch.getPhone();
                if (!line.isBlank()) brandCell.addElement(new Paragraph(line.trim(), smallFont));
            }
            headerBand.addCell(brandCell);

            PdfPCell titleCell = new PdfPCell(new Paragraph("COMPROBANTE DE PAGO", titleFont));
            titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleCell.setBorder(Rectangle.NO_BORDER);
            headerBand.addCell(titleCell);

            document.add(headerBand);
            document.add(separator());
            document.add(new Paragraph(" "));

            // ══ DATOS GENERALES ══
            PdfPTable info = new PdfPTable(2);
            info.setWidthPercentage(100);
            info.setWidths(new float[]{1, 3});
            addInfoRow(info, "Cliente:", clientName, normalFont);
            addInfoRow(info, "Vehículo:", vehiclePlate, normalFont);
            addInfoRow(info, "Carpeta:", caseEntity.getFolderCode() != null ? caseEntity.getFolderCode() : "#" + caseEntity.getId(), normalFont);
            if (budget != null && budget.getBudgetDate() != null) {
                addInfoRow(info, "Presupuesto:", budget.getBudgetDate().format(DATE_FMT), normalFont);
            }
            addInfoRow(info, "Total cotizado:", formatCurrency(budget != null ? budget.getTotalQuoted() : BigDecimal.ZERO), boldFont);
            addInfoRow(info, "Comprobante:", comprobanteTipo != null ? comprobanteTipo : "A", normalFont);
            document.add(info);
            document.add(new Paragraph(" "));
            document.add(separator());

            // ══ PAGOS ══
            BigDecimal totalCotizado = budget != null && budget.getTotalQuoted() != null ? budget.getTotalQuoted() : BigDecimal.ZERO;
            BigDecimal saldo = totalCotizado;

            List<FinancialMovementEntity> sorted = movements.stream()
                    .sorted(Comparator.comparing(FinancialMovementEntity::getMovementAt))
                    .toList();

            for (FinancialMovementEntity m : sorted) {
                if (!"CLIENTE".equalsIgnoreCase(m.getFlowOriginCode() != null ? m.getFlowOriginCode() : "")) continue;
                boolean isAdvance = Boolean.TRUE.equals(m.getAdvancePayment());
                boolean isBonification = Boolean.TRUE.equals(m.getBonification());
                BigDecimal monto = m.getNetAmount() != null ? m.getNetAmount() : BigDecimal.ZERO;
                saldo = saldo.subtract(monto);
                String tipoLabel = isAdvance ? "SEÑA" : isBonification ? "BONIFICACIÓN" : saldo.compareTo(BigDecimal.ZERO) > 0 ? "PAGO PARCIAL" : "PAGO TOTAL";

                Font tipoFont = isAdvance ? boldFont : saldo.compareTo(BigDecimal.ZERO) <= 0 ? greenFont : redFont;

                PdfPTable pagoTable = new PdfPTable(2);
                pagoTable.setWidthPercentage(100);
                pagoTable.setWidths(new float[]{1, 4});
                pagoTable.setSpacingBefore(8);

                PdfPCell tipoCell = new PdfPCell(new Paragraph(tipoLabel, tipoFont));
                tipoCell.setBorder(Rectangle.NO_BORDER);
                tipoCell.setVerticalAlignment(Element.ALIGN_TOP);
                pagoTable.addCell(tipoCell);

                PdfPCell detCell = new PdfPCell();
                detCell.setBorder(Rectangle.NO_BORDER);
                detCell.addElement(new Paragraph("Monto: " + formatCurrency(monto), boldFont));
                String fechaStr = m.getMovementAt() != null ? m.getMovementAt().toLocalDate().format(DATE_FMT) : "—";
                detCell.addElement(new Paragraph("Fecha: " + fechaStr, normalFont));
                detCell.addElement(new Paragraph("Modo: " + (m.getPaymentMethodCode() != null ? m.getPaymentMethodCode() : "—"), normalFont));
                detCell.addElement(new Paragraph("Saldo deudor: " + formatCurrency(saldo), saldo.signum() > 0 ? redFont : greenFont));
                pagoTable.addCell(detCell);

                document.add(pagoTable);
                document.add(thinSeparator());
            }

            // ══ OBSERVACIONES ══
            if (observaciones != null && !observaciones.isBlank()) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph("Observaciones: " + observaciones, normalFont));
            }

            // ══ FACTURA ══
            if (facturaRazonSocial != null && !facturaRazonSocial.isBlank()) {
                document.add(new Paragraph(" "));
                document.add(separator());
                PdfPTable facTable = new PdfPTable(2);
                facTable.setWidthPercentage(100);
                facTable.setWidths(new float[]{1, 3});
                addInfoRow(facTable, "Factura:", "SI", boldFont);
                addInfoRow(facTable, "Razón Social:", facturaRazonSocial, normalFont);
                addInfoRow(facTable, "N° Factura:", facturaNumero != null ? facturaNumero : "—", normalFont);
                document.add(facTable);
            }

            // ══ FIRMA ══
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(thinSeparator());
            PdfPTable firma = new PdfPTable(2);
            firma.setWidthPercentage(100);
            firma.setWidths(new float[]{1, 1});
            PdfPCell f1 = new PdfPCell(new Paragraph("Firma del cliente", smallFont));
            f1.setBorder(Rectangle.NO_BORDER);
            f1.setHorizontalAlignment(Element.ALIGN_CENTER);
            f1.setPaddingTop(30);
            PdfPCell f2 = new PdfPCell(new Paragraph("Aclaración", smallFont));
            f2.setBorder(Rectangle.NO_BORDER);
            f2.setHorizontalAlignment(Element.ALIGN_CENTER);
            f2.setPaddingTop(30);
            firma.addCell(f1);
            firma.addCell(f2);
            document.add(firma);

            // ══ FOOTER ══
            document.add(new Paragraph(" "));
            document.add(separator());
            document.add(new Paragraph("Documento generado el " + java.time.LocalDateTime.now().format(DATETIME_FMT), smallFont));

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF del comprobante", e);
        }
        return out.toByteArray();
    }

    private PdfPTable separator() {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell(new Paragraph(" "));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(new RGBColor(200, 200, 200));
        t.addCell(c);
        return t;
    }

    private PdfPTable thinSeparator() {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell(new Paragraph(" "));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(new RGBColor(230, 230, 230));
        c.setPadding(4);
        t.addCell(c);
        return t;
    }

    private void addInfoRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell l = new PdfPCell(new Paragraph(label, font));
        l.setBorder(Rectangle.NO_BORDER);
        PdfPCell v = new PdfPCell(new Paragraph(value != null ? value : "", font));
        v.setBorder(Rectangle.NO_BORDER);
        table.addCell(l);
        table.addCell(v);
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "$ 0,00";
        return "$ " + new java.text.DecimalFormat("#,##0.00").format(amount.setScale(2, RoundingMode.HALF_UP));
    }
}
