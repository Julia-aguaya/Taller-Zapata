package com.tallerzapata.backend.application.budget;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.application.document.DocumentStorageService;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
public class BudgetPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;

    public BudgetPdfService(DocumentRepository documentRepository, DocumentStorageService documentStorageService) {
        this.documentRepository = documentRepository;
        this.documentStorageService = documentStorageService;
    }

    public byte[] generate(BudgetEntity budget, List<BudgetItemEntity> items, String folderCode, OrganizationEntity org, BranchEntity branch) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font brandSubFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);

            PdfPTable headerBand = new PdfPTable(2);
            headerBand.setWidthPercentage(100);
            headerBand.setWidths(new float[]{1f, 1f});
            headerBand.setSpacingAfter(8);
            PdfPCell brandCell = new PdfPCell();
            brandCell.setPadding(8);
            brandCell.setMinimumHeight(56);
            // Logo
            if (org != null && org.getLogoDocumentId() != null) {
                try {
                    DocumentEntity logoDoc = documentRepository.findById(org.getLogoDocumentId()).orElse(null);
                    if (logoDoc != null && logoDoc.getStorageKey() != null) {
                        Resource logoRes = documentStorageService.open(logoDoc.getStorageKey());
                        Image logo = Image.getInstance(logoRes.getInputStream().readAllBytes());
                        logo.scaleToFit(120, 60);
                        brandCell.addElement(logo);
                    }
                } catch (Exception ignored) {
                    // Logo not available, skip
                }
            }
            brandCell.addElement(new Paragraph("ESTETICA DEL AUTOMOTOR", brandFont));
            brandCell.addElement(new Paragraph("ZAPATA | Mecanica, chaperia & pintura", brandSubFont));
            PdfPCell legalCell = new PdfPCell();
            legalCell.setPadding(8);
            legalCell.setMinimumHeight(56);
            String legalText = buildLegalText(org, branch);
            legalCell.addElement(new Paragraph(legalText, normalFont));
            headerBand.addCell(brandCell);
            headerBand.addCell(legalCell);
            document.add(headerBand);

            PdfPCell vehicleBar = new PdfPCell(new Phrase("DATOS DEL VEHICULO", sectionFont));
            vehicleBar.setColspan(2);
            vehicleBar.setPadding(6);
            vehicleBar.setBackgroundColor(new RGBColor(235, 235, 235));
            headerBand = new PdfPTable(2);
            headerBand.setWidthPercentage(100);
            headerBand.addCell(vehicleBar);
            document.add(headerBand);

            PdfPTable vehicleData = new PdfPTable(8);
            vehicleData.setWidthPercentage(100);
            vehicleData.setWidths(new float[]{1.2f, 0.5f, 0.9f, 0.6f, 1.2f, 0.7f, 1.0f, 1.0f});
            vehicleData.setSpacingAfter(8);
            addMetaCell(vehicleData, "PRESUPUESTO", sectionFont, Element.ALIGN_CENTER, true);
            addMetaCell(vehicleData, "Fecha:", smallFont, Element.ALIGN_RIGHT, false);
            addMetaCell(vehicleData, budget.getBudgetDate() != null ? budget.getBudgetDate().format(DATE_FMT) : "-", normalFont, Element.ALIGN_CENTER, false);
            addMetaCell(vehicleData, "Autorizo:", smallFont, Element.ALIGN_RIGHT, false);
            addMetaCell(vehicleData, nullToStr(budget.getAuthorizedByName()), normalFont, Element.ALIGN_LEFT, false);
            addMetaCell(vehicleData, "Interesado:", smallFont, Element.ALIGN_RIGHT, false);
            addMetaCell(vehicleData, nullToStr(budget.getInterestedName()), normalFont, Element.ALIGN_LEFT, false);
            addMetaCell(vehicleData, nullToStr(folderCode), normalFont, Element.ALIGN_CENTER, false);
            document.add(vehicleData);

            Paragraph title = new Paragraph("PRESUPUESTO", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(8);
            document.add(title);

            Paragraph itemsTitle = new Paragraph("Detalle de intervenciones", sectionFont);
            itemsTitle.setSpacingAfter(10);
            document.add(itemsTitle);

            PdfPTable itemsTable = new PdfPTable(4);
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(15);
            float[] colWidths = {2.2f, 1.7f, 1.4f, 1.0f};
            itemsTable.setWidths(colWidths);
            itemsTable.setHeaderRows(1);

            String[] headers = {"PIEZA AFECTADA", "TAREA A EJECUTAR", "NIVEL DE DANO", "$ REPUESTOS"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, smallFont));
                cell.setBackgroundColor(new RGBColor(220, 220, 220));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(4);
                itemsTable.addCell(cell);
            }

            boolean hasActive = false;
            for (BudgetItemEntity item : items) {
                if (!Boolean.TRUE.equals(item.getActive())) continue;
                hasActive = true;
                String taskText = Arrays.stream(new String[]{item.getPartDecisionCode(), item.getTaskCode()})
                        .filter(value -> value != null && !value.isBlank())
                        .reduce((a, b) -> a + " / " + b)
                        .orElse("-");
                itemsTable.addCell(createCell(nullToStr(item.getAffectedPiece()), normalFont));
                itemsTable.addCell(createCell(taskText, normalFont));
                itemsTable.addCell(createCell(nullToStr(item.getDamageLevelCode()), normalFont));
                itemsTable.addCell(createCell(formatCurrency(item.getPartValue()), normalFont));
            }

            if (!hasActive) {
                PdfPCell emptyCell = new PdfPCell(new Phrase("Sin items", normalFont));
                emptyCell.setColspan(4);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyCell.setPadding(8);
                itemsTable.addCell(emptyCell);
            }

            document.add(itemsTable);

            PdfPTable checksTable = new PdfPTable(3);
            checksTable.setWidthPercentage(100);
            checksTable.setSpacingAfter(10);
            checksTable.setWidths(new float[]{2.3f, 0.7f, 2.0f});
            addCheckHeaderCell(checksTable, "Control");
            addCheckHeaderCell(checksTable, "Aplica");
            addCheckHeaderCell(checksTable, "Detalle");
            addCheckRow(checksTable, "Estiraje en bancada", formatBoolean(budget.getBenchStraighteningApplies()), nullToStr(budget.getBenchStraighteningDetail()), normalFont);
            addCheckRow(checksTable, "Alineacion", formatBoolean(budget.getAlignmentApplies()), nullToStr(budget.getAlignmentDetail()), normalFont);
            addCheckRow(checksTable, "Balanceo", formatBoolean(budget.getBalancingApplies()), nullToStr(budget.getBalancingDetail()), normalFont);
            addCheckRow(checksTable, "Recambio cristales", formatBoolean(budget.getGlassReplacementApplies()), nullToStr(budget.getGlassReplacementDetail()), normalFont);
            addCheckRow(checksTable, "Trabajos sobre sist. electrico", formatBoolean(budget.getElectricalWorkApplies()), nullToStr(budget.getElectricalDetail()), normalFont);
            addCheckRow(checksTable, "Trabajos de mecanicas", formatBoolean(budget.getMechanicalWorkApplies()), nullToStr(budget.getMechanicalWorkCode()), normalFont);
            document.add(checksTable);

            PdfPTable quotedPartsBlock = new PdfPTable(2);
            quotedPartsBlock.setWidthPercentage(100);
            quotedPartsBlock.setSpacingAfter(10);
            quotedPartsBlock.setWidths(new float[]{1f, 2f});
            PdfPCell quotedPartsTitle = new PdfPCell(new Phrase("REPUESTOS COTIZADOS", sectionFont));
            quotedPartsTitle.setColspan(2);
            quotedPartsTitle.setPadding(5);
            quotedPartsTitle.setBackgroundColor(new RGBColor(235, 235, 235));
            quotedPartsBlock.addCell(quotedPartsTitle);
            addInfoRow(quotedPartsBlock, "Fecha:", budget.getQuotedPartsDate() != null ? budget.getQuotedPartsDate().format(DATE_FMT) : "-", sectionFont, normalFont);
            addInfoRow(quotedPartsBlock, "Proveedor:", nullToStr(budget.getQuotedPartsSupplier()), sectionFont, normalFont);
            document.add(quotedPartsBlock);

            PdfPTable observationsBlock = new PdfPTable(1);
            observationsBlock.setWidthPercentage(100);
            PdfPCell obsLabel = new PdfPCell(new Phrase("Observaciones:", sectionFont));
            obsLabel.setPadding(4);
            observationsBlock.addCell(obsLabel);
            PdfPCell obsValue = new PdfPCell(new Phrase(
                    budget.getObservations() != null && !budget.getObservations().isBlank() ? budget.getObservations() : "-",
                    normalFont));
            obsValue.setMinimumHeight(28);
            obsValue.setPadding(6);
            observationsBlock.addCell(obsValue);
            observationsBlock.setSpacingAfter(10);
            document.add(observationsBlock);

            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(100);
            totalsTable.setHorizontalAlignment(Element.ALIGN_LEFT);
            totalsTable.setSpacingBefore(4);
            float[] totalWidths = {1.7f, 1f};
            totalsTable.setWidths(totalWidths);

            addTotalRow(totalsTable, "DIAS DE TRABAJO ESTIMADO:", budget.getEstimatedDays() != null ? String.valueOf(budget.getEstimatedDays()) : "-", sectionFont);
            addTotalRow(totalsTable, "Total repuestos:", formatCurrency(budget.getPartsTotal()), sectionFont);
            addTotalRow(totalsTable, "Mano de obra s/iva:", formatCurrency(budget.getLaborWithoutVat()), sectionFont);
            String vatLabel = budget.getVatRate() != null ? "IVA (" + formatDecimal(budget.getVatRate()) + "%):" : "IVA:";
            addTotalRow(totalsTable, "Mano de obra iva incluido:", formatCurrency(budget.getLaborWithVat()), sectionFont);
            addTotalRow(totalsTable, vatLabel, formatCurrency(budget.getLaborVat()), normalFont);
            addTotalRow(totalsTable, "Total Mano de Obra + Repuestos:", formatCurrency(budget.getTotalQuoted()), headerFont);
            document.add(totalsTable);
        } finally {
            if (document != null && document.isOpen()) {
                document.close();
            }
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

    private void addCheckHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
        cell.setBackgroundColor(new RGBColor(220, 220, 220));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addCheckRow(PdfPTable table, String label, String applies, String detail, Font font) {
        table.addCell(createCell(label, font));
        table.addCell(createCell(applies, font));
        table.addCell(createCell(detail, font));
    }

    private void addMetaCell(PdfPTable table, String text, Font font, int align, boolean shaded) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text, font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        if (shaded) {
            cell.setBackgroundColor(new RGBColor(235, 235, 235));
        }
        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(3);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private String nullToStr(String s) { return s == null ? "-" : s; }

    private String formatBoolean(Boolean value) {
        if (value == null) {
            return "-";
        }
        return value ? "SI" : "NO";
    }

    private String formatDecimal(BigDecimal d) {
        return d == null ? "-" : new DecimalFormat("#,##0.00").format(d);
    }

    private String formatCurrency(BigDecimal d) {
        return d == null ? "-" : "$" + new DecimalFormat("#,##0.00").format(d);
    }

    private String buildLegalText(OrganizationEntity org, BranchEntity branch) {
        StringBuilder sb = new StringBuilder();
        if (org != null && org.getRazonSocial() != null) sb.append(org.getRazonSocial()).append("\n");
        if (org != null && org.getCuit() != null) sb.append("CUIT: ").append(org.getCuit()).append("  ");
        if (org != null && org.getCondicionIva() != null) sb.append("IVA: ").append(org.getCondicionIva()).append("\n");
        if (branch != null && branch.getAddressLine1() != null) {
            sb.append(branch.getAddressLine1());
            if (branch.getCity() != null) sb.append(", ").append(branch.getCity());
            sb.append("\n");
        }
        if (branch != null && branch.getPhone() != null) sb.append("Tel: ").append(branch.getPhone()).append("  ");
        if (branch != null && branch.getEmail() != null) sb.append(branch.getEmail());
        return sb.toString().trim().isEmpty() ? "CUIT / COND. FRENTE AL IVA / DOMICILIO / TEL / CORREO" : sb.toString().trim();
    }
}
