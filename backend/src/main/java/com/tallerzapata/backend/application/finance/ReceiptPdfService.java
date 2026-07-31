package com.tallerzapata.backend.application.finance;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

@Service
public class ReceiptPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DecimalFormat CURRENCY_FMT = new DecimalFormat("$ #,##0.00");

    public byte[] generate(IssuedReceiptEntity receipt, CaseEntity caseEntity, OrganizationEntity org, BranchEntity branch) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);

            // Header
            PdfPTable headerBand = new PdfPTable(2);
            headerBand.setWidthPercentage(100);
            headerBand.setWidths(new float[]{2, 1});

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.addElement(new Paragraph(org != null ? org.getName() : "Taller Zapata", brandFont));
            if (branch != null) {
                String branchLine = (branch.getName() != null ? branch.getName() : "");
                if (branch.getAddressLine1() != null) branchLine += " — " + branch.getAddressLine1();
                if (branch.getPhone() != null) branchLine += " — " + branch.getPhone();
                if (!branchLine.isBlank()) brandCell.addElement(new Paragraph(branchLine.trim(), smallFont));
            }
            headerBand.addCell(brandCell);

            PdfPCell titleCell = new PdfPCell(new Paragraph("RECIBO", titleFont));
            titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleCell.setBorder(Rectangle.NO_BORDER);
            headerBand.addCell(titleCell);

            document.add(headerBand);

            // Separator
            PdfPTable sep = new PdfPTable(1);
            sep.setWidthPercentage(100);
            PdfPCell sepCell = new PdfPCell(new Paragraph(" "));
            sepCell.setBorder(Rectangle.BOTTOM);
            sepCell.setBorderColor(new RGBColor(200, 200, 200));
            sep.addCell(sepCell);
            document.add(sep);
            document.add(new Paragraph(" "));

            // Receipt info
            String tipoLabel;
            if (receipt.getComprobanteFiscal() != null) {
                tipoLabel = "Factura " + receipt.getComprobanteFiscal();
            } else {
                tipoLabel = receipt.getReceiptTypeCode();
            }
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{1, 3});
            addInfoRow(infoTable, "Tipo:", tipoLabel, normalFont);
            addInfoRow(infoTable, "Numero:", receipt.getReceiptNumber(), normalFont);
            addInfoRow(infoTable, "Fecha:", receipt.getIssuedDate().format(DATE_FMT), normalFont);
            addInfoRow(infoTable, "Cliente:", receipt.getReceiverBusinessName(), normalFont);
            if (caseEntity != null && caseEntity.getFolderCode() != null) {
                addInfoRow(infoTable, "Carpeta:", caseEntity.getFolderCode(), normalFont);
            }
            document.add(infoTable);
            document.add(new Paragraph(" "));

            // Amounts table
            PdfPTable amountsTable = new PdfPTable(2);
            amountsTable.setWidthPercentage(100);
            amountsTable.setWidths(new float[]{3, 1});
            addAmountRow(amountsTable, "Neto gravado", receipt.getTaxableNet(), normalFont, headerFont);
            String ivaLabel = "IVA " + (receipt.getVatAmount() != null && receipt.getVatAmount().compareTo(BigDecimal.ZERO) > 0 ? "21%" : "0%");
            addAmountRow(amountsTable, ivaLabel, receipt.getVatAmount(), normalFont, headerFont);
            addAmountRow(amountsTable, "Total", receipt.getTotal(), headerFont, headerFont);
            document.add(amountsTable);

            if (receipt.getNotes() != null && !receipt.getNotes().isBlank()) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph("Notas: " + receipt.getNotes(), smallFont));
            }

            // Footer
            document.add(new Paragraph(" "));
            PdfPTable footerSep = new PdfPTable(1);
            footerSep.setWidthPercentage(100);
            PdfPCell fsCell = new PdfPCell(new Paragraph(" "));
            fsCell.setBorder(Rectangle.TOP);
            fsCell.setBorderColor(new RGBColor(200, 200, 200));
            footerSep.addCell(fsCell);
            document.add(footerSep);
            document.add(new Paragraph("Documento generado el " + java.time.LocalDateTime.now().format(DATETIME_FMT), smallFont));
            if (receipt.getSignedAt() != null) {
                document.add(new Paragraph("Firmado conforme el " + receipt.getSignedAt().format(DATETIME_FMT), smallFont));
            }

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF del recibo", e);
        }
        return out.toByteArray();
    }

    private void addInfoRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell l = new PdfPCell(new Paragraph(label, font));
        l.setBorder(Rectangle.NO_BORDER);
        PdfPCell v = new PdfPCell(new Paragraph(value != null ? value : "", font));
        v.setBorder(Rectangle.NO_BORDER);
        table.addCell(l);
        table.addCell(v);
    }

    private void addAmountRow(PdfPTable table, String label, BigDecimal amount, Font labelFont, Font amountFont) {
        PdfPCell l = new PdfPCell(new Paragraph(label, labelFont));
        l.setBorder(Rectangle.NO_BORDER);
        l.setPaddingTop(4);
        PdfPCell v = new PdfPCell(new Paragraph(amount != null ? CURRENCY_FMT.format(amount) : "$ 0,00", amountFont));
        v.setBorder(Rectangle.NO_BORDER);
        v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        v.setPaddingTop(4);
        table.addCell(l);
        table.addCell(v);
    }
}
