package com.tallerzapata.backend.application.cleas;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRetentionRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceCompanyEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceCompanyRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CleasLiquidationPdfService {

    private static final String CLEAS_MODULE = "CLEAS";
    private static final String COMPANY_PAYMENT_CANCELLATION_TYPE = "COMPANIA";
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DecimalFormat CURRENCY_FMT = new DecimalFormat("$ #,##0.00");

    private final CaseRepository caseRepository;
    private final CaseCleasRepository caseCleasRepository;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final FinancialMovementRetentionRepository financialMovementRetentionRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final VehicleRepository vehicleRepository;
    private final PersonRepository personRepository;
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;
    private final CleasSettlementPolicy cleasSettlementPolicy;

    public CleasLiquidationPdfService(CaseRepository caseRepository, CaseCleasRepository caseCleasRepository, CaseInsuranceRepository caseInsuranceRepository, InsuranceProcessingRepository insuranceProcessingRepository, FinancialMovementRepository financialMovementRepository, FinancialMovementRetentionRepository financialMovementRetentionRepository, InsuranceCompanyRepository insuranceCompanyRepository, VehicleRepository vehicleRepository, PersonRepository personRepository, OrganizationRepository organizationRepository, BranchRepository branchRepository, CleasSettlementPolicy cleasSettlementPolicy) {
        this.caseRepository = caseRepository;
        this.caseCleasRepository = caseCleasRepository;
        this.caseInsuranceRepository = caseInsuranceRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.financialMovementRetentionRepository = financialMovementRetentionRepository;
        this.insuranceCompanyRepository = insuranceCompanyRepository;
        this.vehicleRepository = vehicleRepository;
        this.personRepository = personRepository;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.cleasSettlementPolicy = cleasSettlementPolicy;
    }

    @Transactional(readOnly = true)
    public byte[] generate(Long caseId) {
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        CaseCleasEntity cleas = caseCleasRepository.findByCaseId(caseId).orElseThrow(() -> new ConflictException("El caso no tiene definicion CLEAS"));
        CaseInsuranceEntity insurance = caseInsuranceRepository.findByCaseId(caseId).orElse(null);

        BigDecimal agreedAmount = insuranceProcessingRepository.findByCaseId(caseId).map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        CleasSettlement settlement = cleasSettlementPolicy.settle(cleas, agreedAmount);

        Long companyId = insurance == null ? null : insurance.getInsuranceCompanyId();
        List<FinancialMovementEntity> companyPayments = financialMovementRepository.findByCaseId(caseId, Sort.by(Sort.Order.asc("movementAt"), Sort.Order.asc("id"))).stream()
                .filter(movement -> "ASEGURADORA".equals(normalize(movement.getFlowOriginCode()))
                        && COMPANY_PAYMENT_CANCELLATION_TYPE.equals(normalize(movement.getCancellationTypeCode()))
                        && companyId.equals(movement.getCounterpartyCompanyId()))
                .toList();

        BigDecimal paidNet = companyPayments.stream().map(this::signedNetAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paidGross = companyPayments.stream().map(this::signedGrossAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal target = settlement.amountToBillCompany();
        BigDecimal pendingNet = target.subtract(paidNet).max(BigDecimal.ZERO);
        BigDecimal pendingGross = target.subtract(paidGross).max(BigDecimal.ZERO);

        OrganizationEntity org = organizationRepository.findAll().stream().findFirst().orElse(null);
        BranchEntity branch = org == null ? null : branchRepository.findByOrganizationIdOrderByNameAsc(org.getId()).stream().findFirst().orElse(null);

        String customerName = caseEntity.getPrincipalCustomerPersonId() == null ? null
                : personRepository.findById(caseEntity.getPrincipalCustomerPersonId()).map(person -> person.getNombreMostrar()).orElse(null);
        String vehicleDescription = caseEntity.getPrincipalVehicleId() == null ? null
                : vehicleRepository.findById(caseEntity.getPrincipalVehicleId())
                        .map(vehicle -> join(" ", vehicle.getBrandText(), vehicle.getModelText(), vehicle.getPlate())).orElse(null);
        String companyName = companyId == null ? null
                : insuranceCompanyRepository.findById(companyId).map(InsuranceCompanyEntity::getName).orElse(null);

        Snapshot snapshot = new Snapshot(
                caseEntity.getFolderCode(), customerName, vehicleDescription, companyName,
                insurance == null ? null : insurance.getCleasNumber(),
                insurance == null ? null : insurance.getClaimNumber(),
                labelScope(cleas.getScopeCode()), labelOpinion(cleas.getOpinionCode()),
                agreedAmount, settlement.franchiseAmount(), settlement.companyRequiredAmount(),
                settlement.customerChargeAmount(), target,
                paidNet, paidGross, pendingNet, pendingGross,
                companyPayments.stream().map(this::toPayment).toList());

        return render(snapshot, org, branch);
    }

    private Payment toPayment(FinancialMovementEntity movement) {
        BigDecimal retentions = financialMovementRetentionRepository.findByMovementIdOrderByIdAsc(movement.getId()).stream()
                .map(retention -> money(retention.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Payment(
                movement.getMovementAt() == null ? "" : movement.getMovementAt().format(DATE_TIME_FMT),
                normalize(movement.getMovementTypeCode()),
                normalize(movement.getPaymentMethodCode()),
                money(movement.getGrossAmount()),
                retentions,
                money(movement.getNetAmount()),
                movement.getReason());
    }

    private byte[] render(Snapshot snapshot, OrganizationEntity org, BranchEntity branch) {
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

            PdfPTable headerBand = new PdfPTable(2);
            headerBand.setWidthPercentage(100);
            headerBand.setWidths(new float[]{2, 1});
            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.addElement(new Paragraph(org != null ? org.getName() : "Taller Zapata", brandFont));
            if (branch != null) {
                String branchLine = join(" — ", branch.getName(), branch.getAddressLine1(), branch.getPhone());
                if (!branchLine.isBlank()) brandCell.addElement(new Paragraph(branchLine, smallFont));
            }
            headerBand.addCell(brandCell);
            PdfPCell titleCell = new PdfPCell(new Paragraph("LIQUIDACIÓN CLEAS", titleFont));
            titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleCell.setBorder(Rectangle.NO_BORDER);
            headerBand.addCell(titleCell);
            document.add(headerBand);

            document.add(separator());
            document.add(new Paragraph(" "));

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{1, 3});
            addInfoRow(infoTable, "Carpeta:", snapshot.folderCode(), normalFont);
            addInfoRow(infoTable, "Cliente:", snapshot.customerName(), normalFont);
            addInfoRow(infoTable, "Vehículo:", snapshot.vehicleDescription(), normalFont);
            addInfoRow(infoTable, "Compañía:", snapshot.companyName(), normalFont);
            addInfoRow(infoTable, "N.º de CLEAS:", snapshot.cleasNumber(), normalFont);
            addInfoRow(infoTable, "N.º de siniestro:", snapshot.claimNumber(), normalFont);
            addInfoRow(infoTable, "Alcance:", snapshot.scopeLabel(), normalFont);
            addInfoRow(infoTable, "Dictamen:", snapshot.opinionLabel(), normalFont);
            document.add(infoTable);
            document.add(new Paragraph(" "));

            PdfPTable settlementTable = new PdfPTable(2);
            settlementTable.setWidthPercentage(100);
            settlementTable.setWidths(new float[]{3, 1});
            addAmountRow(settlementTable, "Monto de cotización acordada", snapshot.agreedAmount(), normalFont, headerFont);
            addAmountRow(settlementTable, "Monto de franquicia", snapshot.franchiseAmount(), normalFont, headerFont);
            addAmountRow(settlementTable, "Parte exigida por la compañía", snapshot.companyRequiredAmount(), normalFont, headerFont);
            addAmountRow(settlementTable, "Monto a cargo del cliente", snapshot.customerChargeAmount(), normalFont, headerFont);
            addAmountRow(settlementTable, "A facturar a la compañía", snapshot.amountToBillCompany(), headerFont, headerFont);
            document.add(settlementTable);
            document.add(new Paragraph(" "));

            PdfPTable paymentsTable = new PdfPTable(6);
            paymentsTable.setWidthPercentage(100);
            paymentsTable.setWidths(new float[]{2, 1, 1, 1, 1, 1});
            addHeaderCell(paymentsTable, "Fecha", headerFont);
            addHeaderCell(paymentsTable, "Tipo", headerFont);
            addHeaderCell(paymentsTable, "Medio", headerFont);
            addHeaderCell(paymentsTable, "Bruto", headerFont);
            addHeaderCell(paymentsTable, "Retenciones", headerFont);
            addHeaderCell(paymentsTable, "Neto", headerFont);
            for (Payment payment : snapshot.payments()) {
                addCell(paymentsTable, payment.movementAt(), normalFont, Element.ALIGN_LEFT);
                addCell(paymentsTable, payment.movementTypeCode(), normalFont, Element.ALIGN_LEFT);
                addCell(paymentsTable, payment.paymentMethodCode(), normalFont, Element.ALIGN_LEFT);
                addCell(paymentsTable, CURRENCY_FMT.format(payment.grossAmount()), normalFont, Element.ALIGN_RIGHT);
                addCell(paymentsTable, CURRENCY_FMT.format(payment.retentionsAmount()), normalFont, Element.ALIGN_RIGHT);
                addCell(paymentsTable, CURRENCY_FMT.format(payment.netAmount()), normalFont, Element.ALIGN_RIGHT);
            }
            document.add(paymentsTable);
            document.add(new Paragraph(" "));

            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(100);
            totalsTable.setWidths(new float[]{3, 1});
            addAmountRow(totalsTable, "Pagado (neto)", snapshot.paidNet(), normalFont, headerFont);
            addAmountRow(totalsTable, "Pagado (bruto)", snapshot.paidGross(), normalFont, headerFont);
            addAmountRow(totalsTable, "Saldo pendiente (neto)", snapshot.pendingNet(), headerFont, headerFont);
            addAmountRow(totalsTable, "Saldo pendiente (bruto)", snapshot.pendingGross(), normalFont, headerFont);
            document.add(totalsTable);

            document.add(new Paragraph(" "));
            document.add(footerSeparator());
            document.add(new Paragraph("Documento generado el " + java.time.LocalDateTime.now().format(DATE_TIME_FMT), smallFont));

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF de liquidación CLEAS", e);
        }
        return out.toByteArray();
    }

    private PdfPTable separator() {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Paragraph(" "));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(new com.lowagie.text.pdf.RGBColor(200, 200, 200));
        table.addCell(cell);
        return table;
    }

    private PdfPTable footerSeparator() {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Paragraph(" "));
        cell.setBorder(Rectangle.TOP);
        cell.setBorderColor(new com.lowagie.text.pdf.RGBColor(200, 200, 200));
        table.addCell(cell);
        return table;
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

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, font));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBackgroundColor(new java.awt.Color(240, 240, 240));
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Paragraph(text != null ? text : "", font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(3);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private String labelScope(String code) {
        if ("DANIO_TOTAL".equals(code)) return "Daño total";
        if ("FRANQUICIA".equals(code)) return "Franquicia";
        return code;
    }

    private String labelOpinion(String code) {
        if ("A_FAVOR".equals(code)) return "A favor";
        if ("EN_CONTRA".equals(code)) return "En contra";
        if ("CULPA_COMPARTIDA".equals(code)) return "Culpa compartida";
        if ("PENDIENTE".equals(code)) return "Pendiente";
        return code;
    }

    private BigDecimal signedNetAmount(FinancialMovementEntity movement) {
        BigDecimal amount = money(movement.getNetAmount());
        return isIngreso(movement, amount) ? amount : amount.negate();
    }

    private BigDecimal signedGrossAmount(FinancialMovementEntity movement) {
        BigDecimal amount = money(movement.getGrossAmount());
        return isIngreso(movement, amount) ? amount : amount.negate();
    }

    private boolean isIngreso(FinancialMovementEntity movement, BigDecimal amount) {
        return "INGRESO".equals(normalize(movement.getMovementTypeCode()))
                || ("AJUSTE".equals(normalize(movement.getMovementTypeCode())) && amount.signum() >= 0);
    }

    private String join(String delimiter, String... parts) {
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part == null || part.isBlank()) continue;
            if (!builder.isEmpty()) builder.append(delimiter);
            builder.append(part.trim());
        }
        return builder.toString();
    }

    private BigDecimal money(BigDecimal value) { return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP); }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }

    public record Payment(String movementAt, String movementTypeCode, String paymentMethodCode, BigDecimal grossAmount, BigDecimal retentionsAmount, BigDecimal netAmount, String reason) {}
    public record Snapshot(String folderCode, String customerName, String vehicleDescription, String companyName, String cleasNumber, String claimNumber, String scopeLabel, String opinionLabel, BigDecimal agreedAmount, BigDecimal franchiseAmount, BigDecimal companyRequiredAmount, BigDecimal customerChargeAmount, BigDecimal amountToBillCompany, BigDecimal paidNet, BigDecimal paidGross, BigDecimal pendingNet, BigDecimal pendingGross, List<Payment> payments) {}
}
