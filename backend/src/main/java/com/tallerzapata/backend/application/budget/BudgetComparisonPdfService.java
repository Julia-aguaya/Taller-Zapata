package com.tallerzapata.backend.application.budget;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Cell;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Detail;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.Piece;
import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.ProviderColumn;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.HashMap;
import java.util.Map;

@Service
public class BudgetComparisonPdfService {
    private static final Color INK = new Color(30, 41, 59);
    private static final Color HEADER = new Color(226, 232, 240);
    private static final Color FIRST_COLUMN = new Color(248, 250, 252);
    private static final Color TERMS = new Color(241, 245, 249);
    private static final Color BEST_PRICE = new Color(220, 252, 231);
    private static final Color SUBTOTAL = new Color(219, 234, 254);

    public byte[] generate(Detail detail) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 28, 28, 34, 36);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new ComparisonFooter(detail.snapshot().generation()));
            document.open();

            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, INK);
            Font subtitle = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, new Color(71, 85, 105));
            Font header = FontFactory.getFont(FontFactory.HELVETICA_BOLD, tableFontSize(detail), Color.WHITE);
            Font providerName = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, tableFontSize(detail), new Color(226, 232, 240));
            Font body = FontFactory.getFont(FontFactory.HELVETICA, tableFontSize(detail), INK);
            Font muted = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, tableFontSize(detail), new Color(100, 116, 139));
            Font strong = FontFactory.getFont(FontFactory.HELVETICA_BOLD, tableFontSize(detail), INK);
            Font best = FontFactory.getFont(FontFactory.HELVETICA_BOLD, tableFontSize(detail), new Color(22, 101, 52));

            Paragraph heading = new Paragraph("COMPARACION DE PROVEEDORES", title);
            heading.setSpacingAfter(2);
            document.add(heading);
            Paragraph description = new Paragraph("Matriz de precios nominales en ARS. Los importes destacados indican el mejor precio por repuesto.", subtitle);
            description.setSpacingAfter(9);
            document.add(description);

            PdfPTable table = new PdfPTable(detail.providers().size() + 1);
            table.setWidthPercentage(100);
            table.setWidths(columnWidths(detail.providers().size()));
            table.setHeaderRows(1);
            table.setSpacingAfter(8);

            addHeader(table, "REPUESTO", header, null);
            for (int index = 0; index < detail.providers().size(); index++) {
                ProviderColumn provider = detail.providers().get(index);
                addHeader(table, "PROVEEDOR " + (index + 1), header, provider.name(), providerName);
            }

            for (Piece piece : detail.pieces()) {
                addPieceCell(table, piece, strong, muted);
                Map<Long, Cell> cells = cellsByProvider(piece);
                int minimumCount = (int) piece.cells().stream().filter(Cell::minimum).count();
                for (ProviderColumn provider : detail.providers()) {
                    addPriceCell(table, cells.get(provider.id()), minimumCount, body, muted, best);
                }
            }

            addTermsRow(table, "Facturación", detail.providers(), true, strong, body);
            addTermsRow(table, "Medio de pago", detail.providers(), false, strong, body);
            addSubtotalRow(table, detail, strong, body);
            document.add(table);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
        return out.toByteArray();
    }

    private float tableFontSize(Detail detail) {
        return detail.providers().size() > 5 ? 5.5f : detail.providers().size() > 3 ? 6.5f : 7.5f;
    }

    private float[] columnWidths(int providerCount) {
        float[] widths = new float[providerCount + 1];
        widths[0] = providerCount > 5 ? 2.1f : 2.5f;
        for (int index = 1; index < widths.length; index++) {
            widths[index] = 1f;
        }
        return widths;
    }

    private Map<Long, Cell> cellsByProvider(Piece piece) {
        Map<Long, Cell> cells = new HashMap<>();
        piece.cells().forEach(cell -> cells.put(cell.providerColumnId(), cell));
        return cells;
    }

    private void addHeader(PdfPTable table, String label, Font labelFont, String providerName, Font nameFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(INK);
        cell.setPadding(5);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.addElement(new Paragraph(label, labelFont));
        if (providerName != null) {
            cell.addElement(new Paragraph(providerName, nameFont));
        }
        table.addCell(cell);
    }

    private void addHeader(PdfPTable table, String label, Font labelFont, String providerName) {
        addHeader(table, label, labelFont, providerName, labelFont);
    }

    private void addPieceCell(PdfPTable table, Piece piece, Font strong, Font muted) {
        PdfPCell cell = firstColumnCell();
        cell.addElement(new Paragraph(piece.description(), strong));
        String detail = piece.actionCode() == null || piece.actionCode().isBlank() ? "Manual" : piece.actionCode();
        cell.addElement(new Paragraph(detail, muted));
        table.addCell(cell);
    }

    private void addPriceCell(PdfPTable table, Cell price, int minimumCount, Font body, Font muted, Font best) {
        PdfPCell cell = baseCell();
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (price == null) {
            cell.addElement(new Paragraph("Sin cotización", muted));
        } else {
            cell.addElement(new Paragraph(money(price.amount()), body));
            if (price.minimum()) {
                cell.setBackgroundColor(BEST_PRICE);
                cell.setBorderColor(new Color(34, 197, 94));
                cell.addElement(new Paragraph(minimumCount > 1 ? "Mejor precio (empate)" : "Mejor precio", best));
            }
        }
        table.addCell(cell);
    }

    private void addTermsRow(PdfPTable table, String label, java.util.List<ProviderColumn> providers, boolean billing, Font strong, Font body) {
        PdfPCell labelCell = firstColumnCell();
        labelCell.setBackgroundColor(TERMS);
        labelCell.addElement(new Paragraph(label, strong));
        table.addCell(labelCell);
        for (ProviderColumn provider : providers) {
            PdfPCell cell = baseCell();
            cell.setBackgroundColor(TERMS);
            cell.addElement(new Paragraph(billing ? billing(provider.billingCode()) : payment(provider.paymentMethodCode()), body));
            table.addCell(cell);
        }
    }

    private void addSubtotalRow(PdfPTable table, Detail detail, Font strong, Font body) {
        PdfPCell labelCell = firstColumnCell();
        labelCell.setBackgroundColor(SUBTOTAL);
        labelCell.addElement(new Paragraph("Subtotal mejor precio", strong));
        table.addCell(labelCell);

        PdfPCell subtotalCell = baseCell();
        subtotalCell.setColspan(detail.providers().size());
        subtotalCell.setBackgroundColor(SUBTOTAL);
        subtotalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        subtotalCell.addElement(new Paragraph(money(detail.bestPriceSubtotal()), body));
        table.addCell(subtotalCell);
    }

    private PdfPCell firstColumnCell() {
        PdfPCell cell = baseCell();
        cell.setBackgroundColor(FIRST_COLUMN);
        return cell;
    }

    private PdfPCell baseCell() {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(4);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBorderColor(HEADER);
        return cell;
    }

    private String money(BigDecimal value) {
        return "$ " + new DecimalFormat("#,##0.00").format(value);
    }

    private String billing(String value) {
        return "SIN_FACTURA".equals(value) ? "Sin factura" : value;
    }

    private String payment(String value) {
        return switch (value) {
            case "CONTADO" -> "Contado";
            case "TARJETA_1_PAGO_SIN_INTERES" -> "Tarjeta 1 pago sin interes";
            default -> "Tarjeta cuotas sin interes";
        };
    }

    private static final class ComparisonFooter extends PdfPageEventHelper {
        private final Integer generation;

        private ComparisonFooter(Integer generation) {
            this.generation = generation;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Font footer = FontFactory.getFont(FontFactory.HELVETICA, 6.5f, new Color(100, 116, 139));
            String text = "Generación " + generation + " | Página " + writer.getPageNumber();
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_RIGHT, new Phrase(text, footer), document.right(), document.bottom() - 16, 0);
        }
    }
}
